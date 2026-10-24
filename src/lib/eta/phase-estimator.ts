/**
 * LocalShore Delivery ETA Engine — Phase Estimator
 * Calibrates operational stage durations, category-specific preparation SLAs,
 * and lifecycle progression adjustments.
 */

import type { DeliveryPhase, ETARequestInput, PhaseTimingEstimate } from "./types";

export interface CategoryPrepSLA {
  basePrepMins: number;
  perExtraItemMins: number;
  maxExtraPrepMins: number;
  ingressMins: number;
}

export const CATEGORY_PREP_SLAS: Record<string, CategoryPrepSLA> = {
  food: { basePrepMins: 16, perExtraItemMins: 1.5, maxExtraPrepMins: 10, ingressMins: 2.5 },
  restaurant: { basePrepMins: 16, perExtraItemMins: 1.5, maxExtraPrepMins: 10, ingressMins: 2.5 },
  bakery: { basePrepMins: 10, perExtraItemMins: 1.0, maxExtraPrepMins: 8, ingressMins: 2.0 },
  sweets: { basePrepMins: 8, perExtraItemMins: 0.8, maxExtraPrepMins: 6, ingressMins: 2.0 },
  grocery: { basePrepMins: 5, perExtraItemMins: 0.5, maxExtraPrepMins: 6, ingressMins: 2.5 },
  supermarket: { basePrepMins: 5, perExtraItemMins: 0.5, maxExtraPrepMins: 6, ingressMins: 2.5 },
  pharmacy: { basePrepMins: 4, perExtraItemMins: 0.4, maxExtraPrepMins: 4, ingressMins: 2.0 },
  fashion: { basePrepMins: 5, perExtraItemMins: 0.5, maxExtraPrepMins: 5, ingressMins: 2.0 },
  apparel: { basePrepMins: 5, perExtraItemMins: 0.5, maxExtraPrepMins: 5, ingressMins: 2.0 },
  electronics: { basePrepMins: 7, perExtraItemMins: 0.5, maxExtraPrepMins: 5, ingressMins: 2.5 },
  default: { basePrepMins: 8, perExtraItemMins: 0.8, maxExtraPrepMins: 6, ingressMins: 2.0 },
};

export function getCategorySla(category?: string | null): CategoryPrepSLA {
  if (!category) return CATEGORY_PREP_SLAS["default"];
  const normalized = category.toLowerCase().trim();
  for (const [key, sla] of Object.entries(CATEGORY_PREP_SLAS)) {
    if (normalized.includes(key)) return sla;
  }
  return CATEGORY_PREP_SLAS["default"];
}

export interface EstimatedPhaseValues {
  remainingAcceptanceMins: number;
  remainingPreparationMins: number;
  remainingDispatchMins: number;
  remainingFirstMileMins: number;
  handoverMins: number;
  ingressMins: number;
  breakdown: Record<DeliveryPhase, PhaseTimingEstimate>;
}

export function estimateOperationalPhases(
  input: ETARequestInput,
  firstMileRouteDurationSec?: number,
): EstimatedPhaseValues {
  const now = Date.now();
  const status = (input.currentStatus || "new").toLowerCase();
  const milestones = new Set(input.completedMilestones || []);
  const sla = getCategorySla(input.category);

  // Time-of-day peak adjustments
  const currentHour = new Date(now).getHours();
  const isPeak =
    (currentHour >= 12 && currentHour <= 14) || (currentHour >= 18 && currentHour <= 21);

  // 1. Acceptance Phase
  const isAccepted =
    milestones.has("accepted") ||
    [
      "accepted",
      "vendor_accepted",
      "preparing",
      "packed",
      "ready_for_pickup",
      "arrived_at_vendor",
      "picked_up",
      "out_for_delivery",
      "delivered",
    ].includes(status);

  let remainingAcceptanceMins = 0;
  if (!isAccepted) {
    const elapsedSinceCreation = input.orderCreatedAtMs
      ? Math.max(0, (now - input.orderCreatedAtMs) / 60000)
      : 0;
    const baseAcceptance = isPeak ? 2.5 : 1.5;
    remainingAcceptanceMins = Math.max(0.5, Math.round((baseAcceptance - elapsedSinceCreation) * 10) / 10);
  }

  // 2. Preparation Phase
  const isPrepared =
    milestones.has("prepared") ||
    [
      "packed",
      "ready_for_pickup",
      "arrived_at_vendor",
      "picked_up",
      "out_for_delivery",
      "delivered",
    ].includes(status);

  let remainingPreparationMins = 0;
  if (!isPrepared) {
    const itemCount = Math.max(1, input.itemCount || 1);
    const extraItems = Math.max(0, itemCount - 1);
    const extraTime = Math.min(sla.maxExtraPrepMins, extraItems * sla.perExtraItemMins);
    const totalPrepBaseline = sla.basePrepMins + extraTime;

    if (input.storeAcceptedAtMs) {
      const elapsedPrep = Math.max(0, (now - input.storeAcceptedAtMs) / 60000);
      remainingPreparationMins = Math.max(1.0, Math.round((totalPrepBaseline - elapsedPrep) * 10) / 10);
    } else {
      remainingPreparationMins = totalPrepBaseline;
    }
  }

  // 3. Dispatch (Rider Assignment) Phase
  const isRiderAssigned =
    milestones.has("rider_assigned") ||
    Boolean(input.riderCoordinates) ||
    Boolean(input.riderAssignedAtMs) ||
    [
      "assigned",
      "delivery_partner_assigned",
      "rider_assigned",
      "rider_accepted",
      "arrived_at_vendor",
      "picked_up",
      "out_for_delivery",
      "delivered",
    ].includes(status);

  let remainingDispatchMins = 0;
  if (!isRiderAssigned) {
    remainingDispatchMins = isPeak ? 4.5 : 2.5;
  }

  // 4. First-Mile Travel (Rider to Store)
  const isRiderAtStore =
    milestones.has("rider_arrived_at_store") ||
    milestones.has("picked_up") ||
    Boolean(input.riderAtStoreAtMs) ||
    ["arrived_at_vendor", "rider_at_shop", "picked_up", "out_for_delivery", "delivered"].includes(
      status,
    );

  let remainingFirstMileMins = 0;
  if (!isRiderAtStore) {
    if (firstMileRouteDurationSec != null && firstMileRouteDurationSec > 0) {
      remainingFirstMileMins = Math.max(1.0, Math.round((firstMileRouteDurationSec / 60) * 10) / 10);
    } else {
      // Statistical default for urban radius dispatch: 1.4 km at ~20 km/h
      remainingFirstMileMins = isPeak ? 5.5 : 3.8;
    }
  }

  // 5. Handover Phase (Order verification & OTP scan at counter)
  const isPickedUp =
    milestones.has("picked_up") ||
    Boolean(input.orderPickedUpAtMs) ||
    ["picked_up", "out_for_delivery", "delivered"].includes(status);

  const handoverMins = isPickedUp ? 0 : 1.5;

  // 6. Ingress Phase (Gate/Parking/Doorstep handoff)
  const isDelivered = milestones.has("delivered") || status === "delivered";
  const ingressMins = isDelivered ? 0 : sla.ingressMins;

  // Status mapping for breakdown
  const breakdown: Record<DeliveryPhase, PhaseTimingEstimate> = {
    acceptance: {
      durationMins: remainingAcceptanceMins,
      status: isAccepted ? "completed" : "in_progress",
    },
    preparation: {
      durationMins: remainingPreparationMins,
      status: isPrepared ? "completed" : isAccepted ? "in_progress" : "pending",
    },
    dispatch: {
      durationMins: remainingDispatchMins,
      status: isRiderAssigned ? "completed" : "in_progress",
    },
    first_mile: {
      durationMins: remainingFirstMileMins,
      status: isRiderAtStore ? "completed" : isRiderAssigned ? "in_progress" : "pending",
    },
    handover: {
      durationMins: handoverMins,
      status: isPickedUp ? "completed" : isRiderAtStore && isPrepared ? "in_progress" : "pending",
    },
    transit: {
      durationMins: 0, // Injected by calculator after route query
      status: isDelivered ? "completed" : isPickedUp ? "in_progress" : "pending",
    },
    ingress: {
      durationMins: ingressMins,
      status: isDelivered ? "completed" : "pending",
    },
  };

  return {
    remainingAcceptanceMins,
    remainingPreparationMins,
    remainingDispatchMins,
    remainingFirstMileMins,
    handoverMins,
    ingressMins,
    breakdown,
  };
}
