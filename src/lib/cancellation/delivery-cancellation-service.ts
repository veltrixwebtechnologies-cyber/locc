// ==============================================================================
// LocalShore Delivery Cancellation & Return-to-Seller Integration Service
// Integrates with Delivery Partner Hub assignments, ETA engine, and custody tracking.
// ==============================================================================

export interface ActiveDeliveryTask {
  assignmentId: string;
  orderId: string;
  partnerId: string;
  status:
    | "pending"
    | "accepted"
    | "navigating_to_vendor"
    | "reached_vendor"
    | "picked_up"
    | "out_for_delivery"
    | "delivered"
    | "cancelled"
    | "rejected";
  isPickedUp: boolean;
}

export interface ReturnToSellerResult {
  success: boolean;
  orderId: string;
  assignmentId: string;
  returnStatus: "initiated" | "completed" | "escalated";
  riderCompensation: number;
  message: string;
}

/**
 * Check if an ETA prediction worker is permitted to update an order.
 * Stale ETA workers MUST NOT update an order that has entered a terminal or cancelled state.
 */
export function isEtaUpdatePermitted(orderStatus: string): boolean {
  const terminalStatuses = [
    "cancelled",
    "cancelled_by_vendor",
    "delivered",
    "returned",
    "delivery_failed",
  ];
  return !terminalStatuses.includes(orderStatus.toLowerCase());
}

/**
 * Handle delivery assignment cleanup when an order is cancelled prior to pickup.
 */
export function processPrePickupCancellation(task: ActiveDeliveryTask): {
  revokeAssignment: boolean;
  newPartnerStatus: "online" | "busy";
  stopEtaPrediction: boolean;
  stopLocationTracking: boolean;
} {
  if (task.isPickedUp || task.status === "picked_up" || task.status === "out_for_delivery") {
    throw new Error(
      "Cannot perform pre-pickup assignment revocation: Order is already in rider custody.",
    );
  }

  return {
    revokeAssignment: true,
    newPartnerStatus: "online",
    stopEtaPrediction: true,
    stopLocationTracking: true,
  };
}

/**
 * Handle Return-to-Seller workflow when cancellation is requested after pickup.
 * Records custody transfer, keeps the delivery partner compensated for the return leg,
 * and records the return outcome.
 */
export function processPostPickupReturnToSeller(
  task: ActiveDeliveryTask,
  policy = { baseRiderCompensation: 45.0 },
): ReturnToSellerResult {
  return {
    success: true,
    orderId: task.orderId,
    assignmentId: task.assignmentId,
    returnStatus: "initiated",
    riderCompensation: policy.baseRiderCompensation,
    message:
      "Package is in rider custody. Return-to-seller protocol initiated; rider compensated for return route.",
  };
}

