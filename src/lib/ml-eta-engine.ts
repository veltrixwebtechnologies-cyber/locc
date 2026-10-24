import { calculateDistanceKm } from "./geo";

export interface DynamicETARequest {
  userLat?: number | null;
  userLng?: number | null;
  shopLat?: number | null;
  shopLng?: number | null;
  avgPrepTimeMins?: number;
  itemCount?: number;
}

export interface DynamicETAResult {
  minMins: number;
  maxMins: number;
  formattedRange: string;
  distanceKm: number | null;
  breakdown: {
    prepTimeMins: number;
    dispatchLagMins: number;
    transitMins: number;
  };
  confidenceScore: number; // 0-100
}

/**
 * Dynamic ETA & Delivery Speed Predictor
 * Computes high precision ETA ranges considering preparation, driver dispatch, and distance speed curves.
 */
export function calculateDynamicETA(req: DynamicETARequest): DynamicETAResult {
  const { userLat, userLng, shopLat, shopLng, avgPrepTimeMins = 10, itemCount = 1 } = req;

  // 1. Store Preparation (scaled by items)
  const extraPrep = Math.max(0, Math.floor((itemCount - 1) * 0.8));
  const prepTimeMins = avgPrepTimeMins + extraPrep;
  const storeReadyMins = prepTimeMins;

  // 2. Dispatch lag & First-Mile rider travel
  const currentHour = new Date().getHours();
  const isPeakHour =
    (currentHour >= 12 && currentHour <= 14) || (currentHour >= 18 && currentHour <= 21);
  const dispatchLagMins = isPeakHour ? 4.5 : 2.5;
  const firstMileMins = isPeakHour ? 5.0 : 3.5;
  const riderReadyMins = dispatchLagMins + firstMileMins;

  // 3. Concurrency: Pickup occurs once both store & rider are ready
  const pickupReadyMins = Math.max(storeReadyMins, riderReadyMins);
  const handoverMins = 1.5;

  // 4. Distance & Road Transit Speed (Air distance * 1.35 circuity)
  let distanceKm: number | null = null;
  let transitMins = 8; // Default estimate if coordinates missing

  if (userLat != null && userLng != null && shopLat != null && shopLng != null) {
    const rawAirDistance = calculateDistanceKm(userLat, userLng, shopLat, shopLng);
    distanceKm = Math.round(rawAirDistance * 1.35 * 10) / 10; // road network circuity

    const avgSpeedKmh = isPeakHour ? 14 : 20;
    transitMins = Math.max(3, Math.ceil((distanceKm / avgSpeedKmh) * 60));
  }

  // 5. Ingress buffer (gate / elevator / customer handoff)
  const ingressMins = 2.0;

  const totalMins = pickupReadyMins + handoverMins + transitMins + ingressMins;

  // Calibrated prediction window (p10 / p90)
  const minMins = Math.max(8, Math.floor(totalMins * 0.88));
  const maxMins = Math.ceil(totalMins * 1.18);

  const formattedRange = `${minMins}-${maxMins} mins`;
  const confidenceScore = distanceKm !== null ? 94 : 75;

  return {
    minMins,
    maxMins,
    formattedRange,
    distanceKm,
    breakdown: {
      prepTimeMins,
      dispatchLagMins,
      transitMins,
    },
    confidenceScore,
  };
}
