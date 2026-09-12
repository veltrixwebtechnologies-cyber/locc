import { calculateDistanceKm } from './geo';

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
  const { userLat, userLng, shopLat, shopLng, avgPrepTimeMins = 12, itemCount = 1 } = req;

  // 1. Base Prep Time scaled by item count
  const extraPrep = Math.max(0, Math.floor((itemCount - 1) * 2));
  const prepTimeMins = avgPrepTimeMins + extraPrep;

  // 2. Dispatch lag (driver assignment + pickup)
  const currentHour = new Date().getHours();
  const isPeakHour = (currentHour >= 12 && currentHour <= 14) || (currentHour >= 19 && currentHour <= 21);
  const dispatchLagMins = isPeakHour ? 7 : 4;

  // 3. Distance & Transit Speed (km / speed_kmh * 60)
  let distanceKm: number | null = null;
  let transitMins = 10; // Default estimate if coordinates missing

  if (userLat != null && userLng != null && shopLat != null && shopLng != null) {
    distanceKm = calculateDistanceKm(userLat, userLng, shopLat, shopLng);
    
    // Average urban speed: ~20 km/h during normal, ~15 km/h during peak
    const avgSpeedKmh = isPeakHour ? 15 : 22;
    const d = distanceKm ?? 2.0;
    transitMins = Math.ceil((d / avgSpeedKmh) * 60);
    transitMins = Math.max(3, transitMins); // Minimum 3 mins transit
  }

  const totalMins = prepTimeMins + dispatchLagMins + transitMins;

  // Compute narrow window +/- 15%
  const minMins = Math.max(10, Math.floor(totalMins * 0.85));
  const maxMins = Math.ceil(totalMins * 1.15);

  const formattedRange = `${minMins}-${maxMins} mins`;
  const confidenceScore = distanceKm !== null ? 92 : 75;

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
