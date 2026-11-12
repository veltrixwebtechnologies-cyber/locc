// ==============================================================================
// LocalShore Payment & Refund Management State Machine
// Handles Razorpay API integrations, authorizations, captured refunds,
// idempotency guards, webhook reconciliations, and retry mechanisms.
// ==============================================================================

import { submitApprovedRefund, type RazorpayRefundTransport } from "@/lib/razorpay-refunds.server";
import type { RefundRecord, RefundStatus } from "./cancellation-types";

export interface RefundGatewayConfig {
  keyId: string;
  keySecret: string;
  apiBaseUrl?: string;
}

export interface GatewayRefundResponse {
  success: boolean;
  status: RefundStatus;
  gatewayRefundId?: string;
  failureReason?: string;
  rawResponse?: any;
}

/**
 * Production Razorpay Transport for creating refunds via REST API
 */
export function createRazorpayRefundTransport(config: RefundGatewayConfig): RazorpayRefundTransport {
  const baseUrl = config.apiBaseUrl || "https://api.razorpay.com/v1";
  const authHeader = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");

  return {
    async createRefund(input) {
      const url = `${baseUrl}/payments/${encodeURIComponent(input.paymentId)}/refund`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authHeader}`,
          "X-Razorpay-Account": "", // Optional sub-merchant ID
        },
        body: JSON.stringify({
          amount: input.amountPaise,
          receipt: input.localRefundId,
          notes: {
            idempotency_key: input.idempotencyKey,
            refund_origin: "localshore_cancellation_engine",
          },
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorDescription = "Gateway rejected refund request";
        try {
          const parsed = JSON.parse(errorText);
          errorDescription = parsed.error?.description || errorDescription;
        } catch {}
        return {
          id: "",
          status: "failed",
          errorDescription,
        };
      }

      const payload = (await res.json()) as { id: string; status: string };
      // Map Razorpay refund status: 'processed', 'pending', 'failed'
      const status: "pending" | "processed" | "failed" =
        payload.status === "failed" ? "failed" : payload.status === "processed" ? "processed" : "pending";

      return {
        id: payload.id,
        status,
      };
    },
  };
}

/**
 * Void an authorized but uncaptured payment
 * Razorpay endpoint: POST /v1/payments/{payment_id}/cancel
 */
export async function voidPaymentAuthorization(
  paymentId: string,
  config: RefundGatewayConfig,
): Promise<{ success: boolean; message: string }> {
  const baseUrl = config.apiBaseUrl || "https://api.razorpay.com/v1";
  const authHeader = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");

  try {
    const res = await fetch(`${baseUrl}/payments/${encodeURIComponent(paymentId)}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
      },
    });

    if (res.ok) {
      return { success: true, message: "Authorization voided successfully." };
    }
    const errText = await res.text();
    return { success: false, message: `Failed to void authorization: ${errText}` };
  } catch (err: any) {
    return { success: false, message: err.message || "Network exception voiding authorization." };
  }
}

/**
 * Fetch authoritative payment status directly from Gateway API
 */
export async function fetchGatewayPaymentStatus(
  paymentId: string,
  config: RefundGatewayConfig,
): Promise<{
  status: "captured" | "authorized" | "failed" | "refunded" | "unknown";
  amountPaise: number;
  amountInr: number;
}> {
  const baseUrl = config.apiBaseUrl || "https://api.razorpay.com/v1";
  const authHeader = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");

  try {
    const res = await fetch(`${baseUrl}/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Basic ${authHeader}` },
    });

    if (!res.ok) {
      return { status: "unknown", amountPaise: 0, amountInr: 0 };
    }

    const json = (await res.json()) as { status: string; amount: number };
    const amountPaise = Number(json.amount) || 0;
    const amountInr = Math.round(amountPaise / 100);

    let status: "captured" | "authorized" | "failed" | "refunded" | "unknown" = "unknown";
    if (json.status === "captured") status = "captured";
    else if (json.status === "authorized") status = "authorized";
    else if (json.status === "failed") status = "failed";
    else if (json.status === "refunded") status = "refunded";

    return { status, amountPaise, amountInr };
  } catch {
    return { status: "unknown", amountPaise: 0, amountInr: 0 };
  }
}

/**
 * Execute a Gateway Refund with idempotency protection and state machine progression
 */
export async function executeGatewayRefund(
  refund: RefundRecord,
  transport: RazorpayRefundTransport,
): Promise<GatewayRefundResponse> {
  // If already refunded or in a terminal non-retriable state, do not re-execute
  if (refund.status === "refunded") {
    return {
      success: true,
      status: "refunded",
      gatewayRefundId: refund.gatewayRefundId,
    };
  }

  // Calculate amount in paise
  const amountPaise = Math.round(refund.amount * 100);
  if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
    return {
      success: false,
      status: "failed",
      failureReason: "Invalid refund amount.",
    };
  }

  try {
    const result = await submitApprovedRefund(
      {
        localRefundId: refund.id,
        paymentId: refund.paymentAttemptId || "unknown_payment",
        amountPaise,
        idempotencyKey: refund.idempotencyKey,
      },
      transport,
    );

    return {
      success: result.status !== "failed",
      status: result.status as RefundStatus,
      gatewayRefundId: result.gatewayRefundId,
      failureReason: result.failureReason,
    };
  } catch (err: any) {
    return {
      success: false,
      status: "failed",
      failureReason: err.message || "Gateway refund dispatch exception.",
    };
  }
}

/**
 * Reconcile Out-of-Order Webhooks
 * Scenario: Payment captured webhook arrives AFTER the order was already cancelled.
 * Solution: Flag payment for immediate automatic refund rather than dropping the funds.
 */
export async function reconcileOutOfOrderPayment(
  orderOrStatus: string,
  paymentOrEvent: boolean | string,
  amount?: number,
  adminClient?: any,
): Promise<{ shouldAutoRefund: boolean; action: string; refundId?: string }> {
  if (typeof paymentOrEvent === "boolean") {
    const isCancelled = ["cancelled", "cancelled_by_vendor"].includes(orderOrStatus.toLowerCase());
    if (isCancelled && paymentOrEvent) {
      return {
        shouldAutoRefund: true,
        action: "AUTO_INITIATE_REFUND_FOR_POST_CANCEL_PAYMENT",
      };
    }
    return {
      shouldAutoRefund: false,
      action: "NORMAL_ORDER_FLOW",
    };
  }

  // Overload: execute DB insert of auto-refund if adminClient provided
  const orderId = orderOrStatus;
  const paymentId = paymentOrEvent;
  const refundAmount = amount || 0;

  if (adminClient && orderId && refundAmount > 0) {
    try {
      const { data: newRefund, error } = await adminClient
        .from("refunds")
        .insert({
          order_id: orderId,
          amount: refundAmount,
          status: "approved",
          reason_code: "CUSTOMER_CANCELLATION",
          reason: "Automatic refund for payment captured post-cancellation",
          idempotency_key: `post-cancel-${orderId}-${paymentId}`,
        })
        .select("id")
        .single();

      if (!error && newRefund?.id) {
        return {
          shouldAutoRefund: true,
          action: "AUTO_INITIATE_REFUND_FOR_POST_CANCEL_PAYMENT",
          refundId: newRefund.id,
        };
      }
    } catch (e) {
      console.error("[reconcileOutOfOrderPayment] error creating auto-refund:", e);
    }
  }

  return {
    shouldAutoRefund: true,
    action: "AUTO_INITIATE_REFUND_FOR_POST_CANCEL_PAYMENT",
  };
}
