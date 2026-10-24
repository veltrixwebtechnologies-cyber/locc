/**
 * LocalShore Phase-Based Delivery ETA Engine — Core Mathematical Calculator
 *
 * Implements the baseline multi-phase concurrency formula:
 * StoreReady = RemainingAcceptance + RemainingPreparation
 * RiderReady = RemainingDispatch + RemainingFirstMile
 * PickupReady = max(StoreReady, RiderReady)
 * RemainingETA = PickupReady + Handover + Transit + Ingress
 */

import { haversineDistanceKm, isValidCoordinate } from "../geo";
import { estimateOperationalPhases } from "./phase-estimator";
import { defaultRoutingProvider, type IRoutingProvider } from "./routing-provider";
import type { ETAPrediction, ETARequestInput, RoutingResult } from "./types";

export const ETA_ENGINE_VERSION = "2.1.0-phase-concurrency";
const PREDICTION_EXPIRATION_MS = 1000 * 60 * 3; // 3 minutes quote validity

export async function computeDeliveryETA(
  input: ETARequestInput,
  routingProvider: IRoutingProvider = defaultRoutingProvider,
  signal?: AbortSignal,
): Promise<ETAPrediction> {
  const { storeCoordinates, customerCoordinates, riderCoordinates, currentStatus } = input;

  if (
    !storeCoordinates ||
    !isValidCoordinate(storeCoordinates.lat, storeCoordinates.lng) ||
    !customerCoordinates ||
    !isValidCoordinate(customerCoordinates.lat, customerCoordinates.lng)
  ) {
    throw new Error(
      "Invalid store or customer coordinates provided for delivery ETA calculation.",
    );
  }

  const now = Date.now();
  const normalizedStatus = (currentStatus || "new").toLowerCase();

  // If already delivered, ETA is 0
  if (normalizedStatus === "delivered") {
    const nowIso = new Date(now).toISOString();
    return {
      earliestMins: 0,
      targetMins: 0,
      latestMins: 0,
      targetArrivalIso: nowIso,
      latestArrivalIso: nowIso,
      storeReadyMins: 0,
      riderReadyMins: 0,
      pickupReadyMins: 0,
      remainingMins: 0,
      isProvisional: false,
      confidenceScore: 100,
      modelVersion: ETA_ENGINE_VERSION,
      routingSource: "cache",
      roadDistanceKm: 0,
      airDistanceKm: 0,
      circuityFactor: 1.0,
      phaseBreakdown: {
        acceptance: { durationMins: 0, status: "completed" },
        preparation: { durationMins: 0, status: "completed" },
        dispatch: { durationMins: 0, status: "completed" },
        first_mile: { durationMins: 0, status: "completed" },
        handover: { durationMins: 0, status: "completed" },
        transit: { durationMins: 0, status: "completed" },
        ingress: { durationMins: 0, status: "completed" },
      },
      predictedAtIso: nowIso,
      expiresAtIso: new Date(now + PREDICTION_EXPIRATION_MS).toISOString(),
    };
  }

  // 1. Resolve first-mile road route if rider coordinates are available
  let firstMileSec: number | undefined;
  if (
    riderCoordinates &&
    isValidCoordinate(riderCoordinates.lat, riderCoordinates.lng) &&
    !["arrived_at_vendor", "rider_at_shop", "picked_up", "out_for_delivery"].includes(normalizedStatus)
  ) {
    try {
      const firstMileRoute = await routingProvider.getRoute(
        riderCoordinates,
        storeCoordinates,
        signal,
      );
      firstMileSec = firstMileRoute.durationSeconds;
    } catch {
      // Gracefully fall back to statistical first mile
    }
  }

  // 2. Resolve operational phase durations
  const phaseEstimates = estimateOperationalPhases(input, firstMileSec);

  // 3. Resolve customer transit road route
  // If rider is already out for delivery with active coordinates, route from rider to customer
  const isEnRoute = ["out_for_delivery", "going_to_customer"].includes(normalizedStatus);
  const transitStart =
    isEnRoute && riderCoordinates && isValidCoordinate(riderCoordinates.lat, riderCoordinates.lng)
      ? riderCoordinates
      : storeCoordinates;

  let transitRoute: RoutingResult;
  try {
    transitRoute = await routingProvider.getRoute(transitStart, customerCoordinates, signal);
  } catch {
    transitRoute = {
      distanceKm:
        haversineDistanceKm(
          transitStart.lat,
          transitStart.lng,
          customerCoordinates.lat,
          customerCoordinates.lng,
        ) * 1.35,
      durationSeconds: 15 * 60,
      source: "haversine_circuity_fallback",
      isFallback: true,
    };
  }

  const airDistanceKm = haversineDistanceKm(
    storeCoordinates.lat,
    storeCoordinates.lng,
    customerCoordinates.lat,
    customerCoordinates.lng,
  );
  const roadDistanceKm = transitRoute.distanceKm;
  const circuityFactor =
    airDistanceKm > 0.05
      ? Math.round((roadDistanceKm / airDistanceKm) * 100) / 100
      : 1.0;

  const transitMins = Math.max(1.5, Math.round((transitRoute.durationSeconds / 60) * 10) / 10);
  phaseEstimates.breakdown.transit.durationMins = transitMins;

  // 4. Apply Concurrency Formula
  const storeReadyMins =
    phaseEstimates.remainingAcceptanceMins + phaseEstimates.remainingPreparationMins;
  const riderReadyMins =
    phaseEstimates.remainingDispatchMins + phaseEstimates.remainingFirstMileMins;
  const pickupReadyMins = Math.max(storeReadyMins, riderReadyMins);

  const rawRemainingETA =
    pickupReadyMins +
    phaseEstimates.handoverMins +
    transitMins +
    phaseEstimates.ingressMins;

  const remainingMins = Math.max(3, Math.round(rawRemainingETA));

  // 5. Prediction Intervals (p10, p50, p90)
  const earliestMins = Math.max(2, Math.floor(remainingMins * 0.88));
  const targetMins = remainingMins;
  const latestMins = Math.ceil(remainingMins * 1.18);

  const targetArrivalIso = new Date(now + targetMins * 60000).toISOString();
  const latestArrivalIso = new Date(now + latestMins * 60000).toISOString();

  // Confidence assessment
  let confidenceScore = 85;
  if (transitRoute.source === "osrm") confidenceScore += 7;
  if (riderCoordinates && isValidCoordinate(riderCoordinates.lat, riderCoordinates.lng)) {
    confidenceScore += 5;
  }
  if (transitRoute.isFallback) confidenceScore -= 12;

  return {
    earliestMins,
    targetMins,
    latestMins,
    targetArrivalIso,
    latestArrivalIso,
    storeReadyMins: Math.round(storeReadyMins * 10) / 10,
    riderReadyMins: Math.round(riderReadyMins * 10) / 10,
    pickupReadyMins: Math.round(pickupReadyMins * 10) / 10,
    remainingMins,
    isProvisional: transitRoute.isFallback || !riderCoordinates,
    confidenceScore: Math.min(98, Math.max(50, confidenceScore)),
    modelVersion: ETA_ENGINE_VERSION,
    routingSource: transitRoute.source,
    roadDistanceKm,
    airDistanceKm: Math.round(airDistanceKm * 100) / 100,
    circuityFactor,
    phaseBreakdown: phaseEstimates.breakdown,
    predictedAtIso: new Date(now).toISOString(),
    expiresAtIso: new Date(now + PREDICTION_EXPIRATION_MS).toISOString(),
  };
}
