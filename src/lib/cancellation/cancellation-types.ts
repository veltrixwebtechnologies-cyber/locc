// ==============================================================================
// LocalShore Order Cancellation & Refund System Types
// ==============================================================================

import type { OrderStatus } from "@/shared/core/shopper-order";

export type CancellationInitiatorRole = "customer" | "seller" | "rider" | "admin" | "system";

export type CancellationReasonCode =
  | "CUSTOMER_MISTAKE"
  | "CUSTOMER_CHANGE_ADDRESS"
  | "CUSTOMER_DELAY_EXPECTED"
  | "CUSTOMER_FOUND_BETTER_PRICE"
  | "CUSTOMER_OTHER"
  | "SELLER_OUT_OF_STOCK"
  | "SELLER_SHOP_CLOSED"
  | "SELLER_OPERATIONAL_ISSUE"
  | "SELLER_PRICING_ERROR"
  | "RIDER_VEHICLE_BREAKDOWN"
  | "RIDER_EMERGENCY"
  | "RIDER_SHOP_CLOSED_UNREACHABLE"
  | "ADMIN_DISPUTE_RESOLUTION"
  | "ADMIN_EXCEPTIONAL_OVERRIDE"
  | "PAYMENT_FAILED_RECOVERY"
  | "OUT_OF_STOCK_PARTIAL";

export interface CancellationEligibilityResult {
  eligible: boolean;
  code: string;
  reason: string;
  cancellationFee: number;
  estimatedRefund: number;
  allowedActions: string[];
  requiresReview: boolean;
  breakdown?: {
    orderTotal: number;
    paymentStatus: string;
    isPrepaid: boolean;
    cancellationFee: number;
    estimatedRefund: number;
    refundDestination: "original_payment_method" | "wallet" | "none";
  };
}

export interface CancellationRequestInput {
  orderId: string;
  initiatorRole: CancellationInitiatorRole;
  reasonCode: CancellationReasonCode;
  reasonText?: string;
  idempotencyKey?: string;
  isPartial?: boolean;
  itemIdsToCancel?: string[];
  adminOverrideReason?: string;
}

export interface CancellationResult {
  success: boolean;
  orderId: string;
  status: OrderStatus;
  cancellationId: string;
  cancellationFee: number;
  refundAmount: number;
  refundId?: string;
  refundStatus?: RefundStatus;
  idempotentReplay?: boolean;
  message: string;
}

export type RefundStatus =
  | "requested"
  | "reviewing"
  | "approved"
  | "processing"
  | "refunded"
  | "partially_refunded"
  | "failed"
  | "rejected"
  | "cancelled";

export interface RefundRecord {
  id: string;
  orderId: string;
  cancellationId?: string;
  paymentAttemptId?: string;
  amount: number;
  currency: string;
  status: RefundStatus;
  reasonCode: string;
  reason?: string;
  paymentMethod: string;
  executionMethod: "gateway" | "manual" | "wallet";
  gatewayProvider: string;
  gatewayRefundId?: string;
  manualReference?: string;
  idempotencyKey: string;
  failureReason?: string;
  retryCount: number;
  requestedAt: string;
  processedAt?: string;
  failedAt?: string;
}

export interface PartialCancellationRecalculation {
  oldSubtotal: number;
  newSubtotal: number;
  oldDiscount: number;
  newDiscount: number;
  couponRevoked: boolean;
  couponRevocationReason?: string;
  oldDeliveryFee: number;
  newDeliveryFee: number;
  oldTotal: number;
  newTotal: number;
  refundAmount: number;
}

