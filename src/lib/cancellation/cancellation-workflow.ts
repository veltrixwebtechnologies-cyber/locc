// ==============================================================================
// LocalShore Cancellation Workflow & Partial Recalculation Engine
// Integrates Database transactions, Demo Order fallbacks, and Inventory Release.
// ==============================================================================

import type { Order, OrderStatus } from "@/shared/core/shopper-order";
import type {
  CancellationRequestInput,
  CancellationResult,
  PartialCancellationRecalculation,
} from "./cancellation-types";
import { evaluateCancellationEligibility } from "./cancellation-eligibility";

/**
 * Recalculate order financials for partial item cancellation
 * Example: 2 kg rice, 1 kg tomatoes, 1 kg onions. If tomatoes are cancelled:
 * - Subtotal reduces by price of tomatoes.
 * - Coupon minimum requirements are re-evaluated.
 * - Free shipping thresholds are re-evaluated.
 * - Net difference is computed as the authoritative refund amount.
 */
export function recalculatePartialCancellation(params: {
  currentSubtotal: number;
  currentShippingFee: number;
  currentTotal: number;
  currentDiscount: number;
  couponCode?: string;
  cancelledItemPrice: number;
  cancelledItemQty: number;
  remainingItemsCount: number;
}): PartialCancellationRecalculation {
  const itemTotal = params.cancelledItemPrice * params.cancelledItemQty;
  const oldSubtotal = params.currentSubtotal;
  const newSubtotal = Math.max(0, oldSubtotal - itemTotal);

  let newDiscount = params.currentDiscount;
  let couponRevoked = false;
  let couponRevocationReason: string | undefined = undefined;

  // Coupon threshold validation
  if (params.couponCode && params.currentDiscount > 0) {
    const code = params.couponCode.trim().toUpperCase();
    if (code === "LOCALSHORE50" && newSubtotal < 150) {
      newDiscount = 0;
      couponRevoked = true;
      couponRevocationReason = "Order subtotal dropped below ₹150 minimum for LOCALSHORE50";
    } else if (code === "WELCOME50" && newSubtotal < 200) {
      newDiscount = 0;
      couponRevoked = true;
      couponRevocationReason = "Order subtotal dropped below ₹200 minimum for WELCOME50";
    } else if (code === "FIRST100" && newSubtotal < 300) {
      newDiscount = 0;
      couponRevoked = true;
      couponRevocationReason = "Order subtotal dropped below ₹300 minimum for FIRST100";
    } else if (code === "SAVE20") {
      newDiscount = Math.min(60, Math.round(newSubtotal * 0.2));
    }
  }

  // Delivery fee threshold validation (Free shipping for >= ₹500, otherwise ₹25)
  let newDeliveryFee = params.currentShippingFee;
  if (newSubtotal < 500 && params.currentShippingFee === 0 && params.couponCode !== "FREESHIP") {
    // If order subtotal falls below free shipping minimum, retain configured fee or standard delivery
    newDeliveryFee = 25;
  }

  const oldTotal = params.currentTotal;
  const newTotal = Math.max(0, newSubtotal + newDeliveryFee - newDiscount);
  const refundAmount = Math.max(0, oldTotal - newTotal);

  return {
    oldSubtotal,
    newSubtotal,
    oldDiscount: params.currentDiscount,
    newDiscount,
    couponRevoked,
    couponRevocationReason,
    oldDeliveryFee: params.currentShippingFee,
    newDeliveryFee,
    oldTotal,
    newTotal,
    refundAmount,
  };
}

/**
 * Execute Client / Demo Order cancellation
 * Fallback for browser storage and demo simulated orders.
 */
export function executeDemoOrderCancellation(
  order: Order,
  input: CancellationRequestInput,
): CancellationResult {
  const eligibility = evaluateCancellationEligibility(
    {
      orderId: order.id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.isDemoPayment ? "paid" : "unpaid",
      total: order.total,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
    },
    input.initiatorRole,
  );

  if (!eligibility.eligible && input.initiatorRole !== "admin") {
    return {
      success: false,
      orderId: order.id,
      status: order.status,
      cancellationId: "",
      cancellationFee: 0,
      refundAmount: 0,
      message: eligibility.reason,
    };
  }

  const cancellationId = `demo_cancel_${Date.now()}`;
  const cancellationFee = eligibility.cancellationFee || 0;
  const refundAmount = eligibility.estimatedRefund || 0;

  return {
    success: true,
    orderId: order.id,
    status: (input.initiatorRole === "seller" ? "cancelled_by_vendor" : "cancelled") as OrderStatus,
    cancellationId,
    cancellationFee,
    refundAmount,
    refundStatus: refundAmount > 0 ? "refunded" : undefined,
    message: "Order cancelled successfully.",
  };
}

