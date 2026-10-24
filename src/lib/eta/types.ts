/**
 * LocalShore Phase-Based Delivery ETA Engine — Domain Types
 * Strict contracts for hyperlocal delivery prediction, multi-phase concurrency, and calibration.
 */

export type DeliveryPhase =
  | "acceptance"
  | "preparation"
  | "dispatch"
  | "first_mile"
  | "handover"
  | "transit"
  | "ingress";

export type OrderLifecycleMilestone =
  | "created"
  | "accepted"
  | "prepared"
  | "rider_assigned"
  | "rider_arrived_at_store"
  | "picked_up"
  | "arrived_at_customer"
  | "delivered"
  | "cancelled";

export type RoutingProviderSource = "osrm" | "cache" | "haversine_circuity_fallback";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface PhaseTimingEstimate {
  durationMins: number;
  status: "completed" | "in_progress" | "pending";
}

export interface ETAPrediction {
  /** Conservative lower bound estimate (~p10) */
  earliestMins: number;
  /** Primary calibrated estimate (~p50) */
  targetMins: number;
  /** Upper bound confidence estimate (~p90) */
  latestMins: number;
  /** ISO 8601 target arrival timestamp (UTC) */
  targetArrivalIso: string;
  /** ISO 8601 latest arrival timestamp (UTC) */
  latestArrivalIso: string;

  /** Intermediate synchronicity milestones (minutes from now) */
  storeReadyMins: number;
  riderReadyMins: number;
  pickupReadyMins: number;
  remainingMins: number;

  /** Quality and providence metadata */
  isProvisional: boolean;
  confidenceScore: number;
  modelVersion: string;
  routingSource: RoutingProviderSource;
  roadDistanceKm: number;
  airDistanceKm: number;
  circuityFactor: number;

  /** Breakdown by operational delivery phase */
  phaseBreakdown: Record<DeliveryPhase, PhaseTimingEstimate>;

  /** Timestamps */
  predictedAtIso: string;
  expiresAtIso: string;
}

export interface ETARequestInput {
  storeCoordinates: GeoPoint;
  customerCoordinates: GeoPoint;
  riderCoordinates?: GeoPoint | null;
  category?: string | null;
  itemCount?: number;
  /** Current order status or completed milestones */
  currentStatus?: string | null;
  completedMilestones?: OrderLifecycleMilestone[];
  orderCreatedAtMs?: number;
  storeAcceptedAtMs?: number;
  orderPackedAtMs?: number;
  riderAssignedAtMs?: number;
  riderAtStoreAtMs?: number;
  orderPickedUpAtMs?: number;
}

export interface RoutingResult {
  distanceKm: number;
  durationSeconds: number;
  source: RoutingProviderSource;
  isFallback: boolean;
}

export interface HistoricalAccuracyMetric {
  sampleSize: number;
  meanAbsoluteErrorMinutes: number;
  p90AbsoluteErrorMinutes: number;
  systematicBiasMinutes: number; // positive = predicted too late, negative = predicted too early
  windowCoveragePercentage: number; // % of actuals landing inside [earliest, latest]
  averageWindowWidthMinutes: number;
  fallbackRoutingRatePercentage: number;
  averageLatencyMs: number;
}
