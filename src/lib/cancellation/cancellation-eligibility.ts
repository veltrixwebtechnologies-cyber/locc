// ==============================================================================
// LocalShore Centralized Order Cancellation Eligibility Engine
// Authoritative rules for Customer, Seller, Delivery Partner, and Admin roles.
// ==============================================================================

import type { OrderStatus } from "@/shared/core/shopper-order";
import type {
  CancellationInitiatorRole,
  CancellationEligibilityResult,
} from "./cancellation-types";

export interface OrderEligibilityContext {
  orderId: string;
  status: OrderStatus | string;
  paymentMethod?: string;
  paymentStatus?: "unpaid" | "pending" | "authorized" | "captured" | "paid" | "failed" | "refunded" | string;
  total: number;
  subtotal: number;
  deliveryFee?: number;
  category?: string;
  hasPerishableItems?: boolean;
  riderAssigned?: boolean;
  riderArrivedAtShop?: boolean;
  isPickedUp?: boolean;
  isInTransit?: boolean;
  isDelivered?: boolean;
  createdAtMs?: number;
}

export interface CancellationPolicyConfig {
  freeCancellationWithinMins?: number;
  preparationFeePercentage?: number;
  maxPreparationFee?: number;
  riderArrivalCompensationFee?: number;
}

const DEFAULT_POLICY: CancellationPolicyConfig = {
  freeCancellationWithinMins: 5,
  preparationFeePercentage: 0.15, // 15% if prep started
  maxPreparationFee: 50.0,
  riderArrivalCompensationFee: 30.0,
};

/**
 * Authoritative Cancellation Eligibility Engine
 * Pure, deterministic evaluation suitable for client previews, server APIs, and RPC validation.
 */
export function evaluateCancellationEligibility(
  context: OrderEligibilityContext,
  role: CancellationInitiatorRole = "customer",
  policy: CancellationPolicyConfig = DEFAULT_POLICY,
): CancellationEligibilityResult {
  const normStatus = (context.status || "new").toLowerCase();
  const isPrepaid = ["paid", "captured"].includes((context.paymentStatus || "").toLowerCase());
  const paymentMethod = (context.paymentMethod || "card").toLowerCase();
  const refundDestination = isPrepaid
    ? paymentMethod === "wallet"
      ? "wallet"
      : "original_payment_method"
    : "none";

  // 1. TERMINAL & CANCELLED STATES
  if (normStatus === "cancelled" || normStatus === "cancelled_by_vendor") {
    return {
      eligible: false,
      code: "ALREADY_CANCELLED",
      reason: "This order has already been cancelled.",
      cancellationFee: 0,
      estimatedRefund: 0,
      requiresReview: false,
      allowedActions: [],
      breakdown: {
        orderTotal: context.total,
        paymentStatus: context.paymentStatus || "unpaid",
        isPrepaid,
        cancellationFee: 0,
        estimatedRefund: 0,
        refundDestination: "none",
      },
    };
  }

  if (normStatus === "delivered") {
    return {
      eligible: false,
      code: "ORDER_DELIVERED",
      reason: "Order has already been delivered. Cancellation is closed; you can initiate a return or contact support.",
      cancellationFee: 0,
      estimatedRefund: 0,
      requiresReview: false,
      allowedActions: ["initiate_return", "contact_support"],
      breakdown: {
        orderTotal: context.total,
        paymentStatus: context.paymentStatus || "paid",
        isPrepaid,
        cancellationFee: 0,
        estimatedRefund: 0,
        refundDestination: "none",
      },
    };
  }

  // 2. ADMIN ROLE (Explicit Permission Override)
  if (role === "admin") {
    const refundAmt = isPrepaid ? context.total : 0;
    return {
      eligible: true,
      code: "ADMIN_OVERRIDE_AVAILABLE",
      reason: "Administrator exceptional override cancellation allowed with mandatory audit reason.",
      cancellationFee: 0,
      estimatedRefund: refundAmt,
      requiresReview: false,
      allowedActions: ["admin_cancel", "admin_override_cancel", "force_refund"],
      breakdown: {
        orderTotal: context.total,
        paymentStatus: context.paymentStatus || "unpaid",
        isPrepaid,
        cancellationFee: 0,
        estimatedRefund: refundAmt,
        refundDestination,
      },
    };
  }

  // 3. SELLER ROLE
  if (role === "seller") {
    if (context.isPickedUp || normStatus === "picked_up" || normStatus === "out_for_delivery") {
      return {
        eligible: false,
        code: "SELLER_IN_TRANSIT_RESTRICTED",
        reason: "The order is already in rider custody and out for delivery. Contact delivery support for return-to-seller coordination.",
        cancellationFee: 0,
        estimatedRefund: 0,
        requiresReview: true,
        allowedActions: ["request_return_to_seller", "contact_support"],
        breakdown: {
          orderTotal: context.total,
          paymentStatus: context.paymentStatus || "paid",
          isPrepaid,
          cancellationFee: 0,
          estimatedRefund: 0,
          refundDestination: "none",
        },
      };
    }

    // Sellers can cancel before pickup with a mandatory reason (e.g. out of stock)
    const refundAmt = isPrepaid ? context.total : 0;
    return {
      eligible: true,
      code: "SELLER_CANCEL_PERMITTED",
      reason: "Seller cancellation allowed due to inventory or operational reasons. Customer will be notified and 100% refunded.",
      cancellationFee: 0,
      estimatedRefund: refundAmt,
      requiresReview: false,
      allowedActions: ["seller_cancel", "partial_item_cancel"],
      breakdown: {
        orderTotal: context.total,
        paymentStatus: context.paymentStatus || "paid",
        isPrepaid,
        cancellationFee: 0,
        estimatedRefund: refundAmt,
        refundDestination,
      },
    };
  }

  // 4. DELIVERY PARTNER (RIDER) ROLE
  if (role === "rider") {
    if (context.isPickedUp || normStatus === "picked_up" || normStatus === "out_for_delivery") {
      return {
        eligible: false,
        code: "RIDER_CUSTODY_RETURN_WORKFLOW",
        reason: "You have already confirmed pickup. You cannot cancel the order directly; please initiate the Return-to-Seller workflow.",
        cancellationFee: 0,
        estimatedRefund: 0,
        requiresReview: true,
        allowedActions: ["initiate_return_to_seller", "report_delivery_issue"],
        breakdown: {
          orderTotal: context.total,
          paymentStatus: context.paymentStatus || "paid",
          isPrepaid,
          cancellationFee: 0,
          estimatedRefund: 0,
          refundDestination: "none",
        },
      };
    }

    // Before pickup, rider can reject or release assignment -> triggers reassignment, NOT order cancellation!
    return {
      eligible: true,
      code: "RIDER_REASSIGNMENT_AVAILABLE",
      reason: "Rider can release this task with a valid reason. The order will be immediately reassigned to another available partner.",
      cancellationFee: 0,
      estimatedRefund: 0,
      requiresReview: false,
      allowedActions: ["release_assignment", "report_breakdown"],
      breakdown: {
        orderTotal: context.total,
        paymentStatus: context.paymentStatus || "unpaid",
        isPrepaid,
        cancellationFee: 0,
        estimatedRefund: 0,
        refundDestination: "none",
      },
    };
  }

  // 5. CUSTOMER ROLE (Default)
  // Check transit / pickup boundary
  if (
    context.isPickedUp ||
    context.isInTransit ||
    normStatus === "picked_up" ||
    normStatus === "out_for_delivery" ||
    normStatus === "at_customer"
  ) {
    return {
      eligible: false,
      code: "ORDER_IN_TRANSIT",
      reason: "Your order is already on its way with the delivery partner and cannot be cancelled directly. You may decline the order at doorstep or contact customer support.",
      cancellationFee: 0,
      estimatedRefund: 0,
      requiresReview: false,
      allowedActions: ["contact_support", "decline_at_doorstep"],
      breakdown: {
        orderTotal: context.total,
        paymentStatus: context.paymentStatus || "paid",
        isPrepaid,
        cancellationFee: 0,
        estimatedRefund: 0,
        refundDestination: "none",
      },
    };
  }

  // Stage A: Order Placed / Accepted (Free cancellation)
  if (["new", "placed", "accepted", "vendor_accepted"].includes(normStatus)) {
    const refundAmt = isPrepaid ? context.total : 0;
    return {
      eligible: true,
      code: "FREE_CANCELLATION",
      reason: "Order has not yet entered preparation. Cancellation is 100% free with full refund.",
      cancellationFee: 0,
      estimatedRefund: refundAmt,
      requiresReview: false,
      allowedActions: ["cancel_order"],
      breakdown: {
        orderTotal: context.total,
        paymentStatus: context.paymentStatus || "unpaid",
        isPrepaid,
        cancellationFee: 0,
        estimatedRefund: refundAmt,
        refundDestination,
      },
    };
  }

  // Stage B: Preparing / Packed (Conditional cancellation)
  if (["preparing", "packed"].includes(normStatus)) {
    // If perishable (fresh/bakery/restaurant), preparation fee applies to compensate merchant
    const isPerishable =
      context.hasPerishableItems ||
      ["fresh", "bakery", "restaurants", "food"].includes((context.category || "").toLowerCase());

    const fee = isPerishable
      ? Math.min(
          policy.maxPreparationFee ?? 50,
          Math.round(context.total * (policy.preparationFeePercentage ?? 0.15)),
        )
      : 0;

    const refundAmt = isPrepaid ? Math.max(0, context.total - fee) : 0;

    return {
      eligible: true,
      code: isPerishable ? "PREPARATION_FEE_APPLIES" : "PREPARATION_FREE_CANCEL",
      reason: isPerishable
        ? `The kitchen/bakery has already started preparing your fresh items. A ₹${fee} merchant compensation fee applies.`
        : "Your order is packed. Cancellation is permitted before the delivery partner collects the order.",
      cancellationFee: fee,
      estimatedRefund: refundAmt,
      requiresReview: false,
      allowedActions: ["cancel_order"],
      breakdown: {
        orderTotal: context.total,
        paymentStatus: context.paymentStatus || "paid",
        isPrepaid,
        cancellationFee: fee,
        estimatedRefund: refundAmt,
        refundDestination,
      },
    };
  }

  // Stage C: Ready for pickup / Rider Assigned / Arrived at shop
  if (
    [
      "ready_for_pickup",
      "assigned",
      "delivery_partner_assigned",
      "going_to_vendor",
      "arrived_at_vendor",
      "rider_assigned",
      "rider_accepted",
      "rider_at_shop",
    ].includes(normStatus)
  ) {
    const riderArrived =
      context.riderArrivedAtShop ||
      normStatus === "arrived_at_vendor" ||
      normStatus === "rider_at_shop";

    const fee = riderArrived
      ? (policy.riderArrivalCompensationFee ?? 30.0)
      : 15.0; // nominal dispatch reservation fee

    const refundAmt = isPrepaid ? Math.max(0, context.total - fee) : 0;

    return {
      eligible: true,
      code: riderArrived ? "RIDER_ARRIVED_DISPATCH_FEE" : "RIDER_ASSIGNED_DISPATCH_FEE",
      reason: riderArrived
        ? `A delivery partner has already arrived at the store. A ₹${fee} rider compensation fee applies.`
        : `A delivery partner is navigating to the store. A ₹${fee} dispatch allocation fee applies.`,
      cancellationFee: fee,
      estimatedRefund: refundAmt,
      requiresReview: false,
      allowedActions: ["cancel_order"],
      breakdown: {
        orderTotal: context.total,
        paymentStatus: context.paymentStatus || "paid",
        isPrepaid,
        cancellationFee: fee,
        estimatedRefund: refundAmt,
        refundDestination,
      },
    };
  }

  // Fallback for unrecognized status
  return {
    eligible: false,
    code: "UNRECOGNIZED_STATUS_RESTRICTED",
    reason: `Cancellation is not directly available at order stage '${normStatus}'. Please contact Customer Support.`,
    cancellationFee: 0,
    estimatedRefund: 0,
    requiresReview: true,
    allowedActions: ["contact_support"],
    breakdown: {
      orderTotal: context.total,
      paymentStatus: context.paymentStatus || "unpaid",
      isPrepaid,
      cancellationFee: 0,
      estimatedRefund: 0,
      refundDestination: "none",
    },
  };
}

