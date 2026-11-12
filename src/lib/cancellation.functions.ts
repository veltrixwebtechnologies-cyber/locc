// ==============================================================================
// LocalShore Server Functions: Cancellation & Refund Lifecycle
// Authoritative endpoints for Customer, Seller, Delivery Partner, and Admin.
// ==============================================================================

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { evaluateCancellationEligibility, type OrderEligibilityContext } from "./cancellation/cancellation-eligibility";
import type { CancellationInitiatorRole, CancellationEligibilityResult } from "./cancellation/cancellation-types";
import { processApprovedRefund, submitApprovedRefund } from "@/lib/razorpay-refunds.server";
import { createRazorpayRefundTransport } from "./cancellation/refund-service";

export interface CheckEligibilityInput {
  orderId: string;
  role?: CancellationInitiatorRole;
}

export interface CancelOrderInput {
  orderId: string;
  reasonCode: string;
  reasonText?: string;
  role?: CancellationInitiatorRole;
  idempotencyKey?: string;
}

export interface CancelOrderItemInput {
  orderId: string;
  orderItemId: string;
  reason: string;
}

export interface RiderRejectAssignmentInput {
  assignmentId: string;
  reason: string;
}

export interface AdminOverrideCancellationInput {
  orderId: string;
  auditReason: string;
  issueFullRefund?: boolean;
}

function getRazorpayConfig() {
  return {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    apiBaseUrl: process.env.RAZORPAY_API_BASE_URL || "https://api.razorpay.com/v1",
  };
}

/**
 * 1. Authoritative Eligibility Check (Server-Side)
 * Evaluates live DB state, policies, delivery stage, and payment status.
 */
export const checkCancellationEligibilityFn = createServerFn({ method: "POST" })
  .inputValidator((data: CheckEligibilityInput) => {
    if (!data?.orderId) {
      throw new Error("orderId is required to evaluate cancellation eligibility.");
    }
    return data;
  })
  .handler(async ({ data }): Promise<CancellationEligibilityResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;
    const role = data.role || "customer";

    // 1. Try DB RPC first
    try {
      const { data: rpcRes, error: rpcErr } = await admin.rpc("evaluate_cancellation_eligibility", {
        _order_id: data.orderId,
        _initiator_role: role,
      });

      if (!rpcErr && rpcRes) {
        return rpcRes as CancellationEligibilityResult;
      }
    } catch (e) {
      console.warn("[cancellation.functions] RPC evaluate_cancellation_eligibility fallback:", e);
    }

    // 2. Authoritative Fallback from order & assignment tables
    const { data: order, error: orderErr } = await admin
      .from("orders")
      .select("id, status, payment_status, payment_method, total, subtotal, delivery_fee, created_at")
      .eq("id", data.orderId)
      .maybeSingle();

    if (orderErr || !order) {
      return {
        eligible: false,
        code: "ORDER_NOT_FOUND",
        reason: "Order could not be located.",
        cancellationFee: 0,
        estimatedRefund: 0,
        requiresReview: false,
        allowedActions: [],
        breakdown: {
          orderTotal: 0,
          paymentStatus: "unpaid",
          isPrepaid: false,
          cancellationFee: 0,
          estimatedRefund: 0,
          refundDestination: "none",
        },
      };
    }

    // Check delivery assignment status
    const { data: assignment } = await admin
      .from("delivery_assignments")
      .select("status")
      .eq("order_id", data.orderId)
      .not("status", "in", '("cancelled","rejected")')
      .maybeSingle();

    const isPickedUp = ["picked_up", "out_for_delivery"].includes(assignment?.status || "");
    const riderAssigned = Boolean(assignment);
    const riderArrived = assignment?.status === "arrived_at_vendor";

    const context: OrderEligibilityContext = {
      orderId: order.id,
      status: order.status,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      total: Number(order.total || 0),
      subtotal: Number(order.subtotal || order.total || 0),
      deliveryFee: Number(order.delivery_fee || 0),
      riderAssigned,
      riderArrivedAtShop: riderArrived,
      isPickedUp,
      createdAtMs: new Date(order.created_at).getTime(),
    };

    return evaluateCancellationEligibility(context, role);
  });

/**
 * 2. Execute Order Cancellation Workflow
 * Atomic cancellation, inventory restock, delivery revocation, and refund initiation.
 */
export const cancelOrderWorkflowFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: CancelOrderInput) => {
    if (!data?.orderId) {
      throw new Error("orderId is required to cancel an order.");
    }
    if (!data?.reasonCode) {
      throw new Error("reasonCode is required to cancel an order.");
    }
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;
    const role = data.role || "customer";
    const idempotencyKey = data.idempotencyKey || `cancel-${data.orderId}-${Date.now()}`;

    // Verify ownership if role is customer
    const authedUserId = (context as any).userId;
    if (role === "customer" && authedUserId) {
      const { data: orderOwner } = await admin
        .from("orders")
        .select("user_id")
        .eq("id", data.orderId)
        .maybeSingle();

      if (orderOwner && orderOwner.user_id && orderOwner.user_id !== authedUserId) {
        throw new Error("You do not have permission to cancel this order.");
      }
    }

    // Call PostgreSQL atomic RPC
    const { data: rpcResult, error: rpcError } = await admin.rpc("cancel_order_workflow", {
      _order_id: data.orderId,
      _initiator_role: role,
      _reason_code: data.reasonCode,
      _reason_text: data.reasonText || null,
      _idempotency_key: idempotencyKey,
    });

    if (rpcError) {
      console.error("[cancellation.functions] cancel_order_workflow error:", rpcError);
      throw new Error(rpcError.message || "Failed to cancel order.");
    }

    // If pre-paid and eligible for refund, trigger payment gateway refund safely
    if (rpcResult?.refund_id && Number(rpcResult.refund_amount) > 0) {
      try {
        const config = getRazorpayConfig();
        if (config.keyId && config.keySecret) {
          const transport = createRazorpayRefundTransport(config);
          const repository = {
            async getApprovedRefund(id: string) {
              const { data: row } = await admin.from("refunds").select("*").eq("id", id).single();
              return {
                localRefundId: row.id,
                paymentId: row.payment_reference || row.provider_payment_id || "pay_mock",
                amountPaise: Math.round(Number(row.amount) * 100),
                idempotencyKey: row.idempotency_key || `refund-${row.id}`,
                status: row.status,
              };
            },
            async markProcessing(id: string, gatewayRefundId: string) {
              await admin
                .from("refunds")
                .update({
                  status: "processing",
                  gateway_refund_id: gatewayRefundId,
                  processed_at: new Date().toISOString(),
                })
                .eq("id", id);
            },
            async markFailed(id: string, reason: string) {
              await admin
                .from("refunds")
                .update({
                  status: "failed",
                  failure_reason: reason,
                  failed_at: new Date().toISOString(),
                })
                .eq("id", id);
            },
          };

          await processApprovedRefund(rpcResult.refund_id, repository, transport);
        }
      } catch (gatewayErr) {
        console.warn("[cancellation.functions] Gateway refund trigger deferred to background/retry:", gatewayErr);
      }
    }

    return {
      success: true,
      orderId: data.orderId,
      status: "cancelled",
      cancellationFee: Number(rpcResult?.cancellation_fee || 0),
      refundAmount: Number(rpcResult?.refund_amount || 0),
      refundId: rpcResult?.refund_id || null,
      message: rpcResult?.message || "Order cancelled successfully.",
    };
  });

/**
 * 3. Partial Order Item Cancellation
 */
export const cancelOrderItemFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: CancelOrderItemInput) => {
    if (!data?.orderId || !data?.orderItemId) {
      throw new Error("orderId and orderItemId are required.");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;

    const { data: rpcResult, error: rpcError } = await admin.rpc("cancel_order_item_workflow", {
      _order_id: data.orderId,
      _order_item_id: data.orderItemId,
      _reason: data.reason || "Item unavailable",
    });

    if (rpcError) {
      throw new Error(rpcError.message || "Failed to cancel item.");
    }

    return rpcResult;
  });

/**
 * 4. Delivery Partner Rejection / Reassignment Workflow
 */
export const riderRejectAssignmentFn = createServerFn({ method: "POST" })
  .inputValidator((data: RiderRejectAssignmentInput) => {
    if (!data?.assignmentId || !data?.reason) {
      throw new Error("assignmentId and reason are required.");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;

    const { data: rpcResult, error: rpcError } = await admin.rpc("rider_reject_assignment_workflow", {
      _assignment_id: data.assignmentId,
      _reason: data.reason,
    });

    if (rpcError) {
      throw new Error(rpcError.message || "Failed to reject assignment.");
    }

    return rpcResult;
  });

/**
 * 5. Admin Override Cancellation
 */
export const adminOverrideCancellationFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: AdminOverrideCancellationInput) => {
    if (!data?.orderId || !data?.auditReason) {
      throw new Error("orderId and mandatory auditReason are required.");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;

    const { data: rpcResult, error: rpcError } = await admin.rpc("admin_override_cancellation_workflow", {
      _order_id: data.orderId,
      _audit_reason: data.auditReason,
      _issue_full_refund: Boolean(data.issueFullRefund),
    });

    if (rpcError) {
      throw new Error(rpcError.message || "Admin override failed.");
    }

    return rpcResult;
  });
