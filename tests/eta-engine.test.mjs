import test from "node:test";
import assert from "node:assert/strict";
import { sourceLoader } from "./load-source.mjs";

const load = sourceLoader(process.cwd());
const {
  computeDeliveryETA,
  estimateOperationalPhases,
  getCategorySla,
  computeAccuracyMetrics,
  getUrbanTrafficSpeedKmh,
} = await load("src/lib/eta/index.ts");

const STORE_COORDS = { lat: 11.0168, lng: 76.9558 };
const CUSTOMER_COORDS = { lat: 11.025, lng: 76.945 };
const RIDER_COORDS = { lat: 11.02, lng: 76.95 };

// Mock routing provider for deterministic testing
class MockRoutingProvider {
  constructor(shouldFail = false, durationSeconds = 480, distanceKm = 2.4) {
    this.shouldFail = shouldFail;
    this.durationSeconds = durationSeconds;
    this.distanceKm = distanceKm;
  }

  async getRoute(start, end) {
    if (this.shouldFail) {
      throw new Error("Simulated routing provider failure");
    }
    return {
      distanceKm: this.distanceKm,
      durationSeconds: this.durationSeconds,
      source: "osrm",
      isFallback: false,
    };
  }
}

test("ETA Engine: Store readiness occurs before rider arrival", async () => {
  // Store prep is fast (grocery, 5m), but rider dispatch + first mile is longer (~8m)
  const provider = new MockRoutingProvider(false, 300, 2.0); // 5m transit
  const result = await computeDeliveryETA(
    {
      storeCoordinates: STORE_COORDS,
      customerCoordinates: CUSTOMER_COORDS,
      category: "grocery",
      itemCount: 1,
      currentStatus: "new",
    },
    provider,
  );

  assert.ok(result.remainingMins > 0);
  assert.ok(result.storeReadyMins > 0);
  assert.ok(result.riderReadyMins > 0);
  // Pickup ready should be max(storeReady, riderReady)
  assert.equal(result.pickupReadyMins, Math.max(result.storeReadyMins, result.riderReadyMins));
  assert.ok(result.pickupReadyMins >= result.storeReadyMins);
});

test("ETA Engine: Rider arrives before store readiness", async () => {
  // Store prep is long (restaurant, 16m), rider is already near store (~3m)
  const provider = new MockRoutingProvider(false, 360, 2.0);
  const result = await computeDeliveryETA(
    {
      storeCoordinates: STORE_COORDS,
      customerCoordinates: CUSTOMER_COORDS,
      riderCoordinates: STORE_COORDS, // rider is at store
      category: "food",
      itemCount: 3,
      currentStatus: "accepted",
    },
    provider,
  );

  assert.ok(result.storeReadyMins > result.riderReadyMins);
  assert.equal(result.pickupReadyMins, result.storeReadyMins);
});

test("ETA Engine: Completed phases are not counted again", async () => {
  const provider = new MockRoutingProvider(false, 300, 2.0);

  // Status: ready_for_pickup -> prep is completed (0)
  const phasesReady = estimateOperationalPhases({
    storeCoordinates: STORE_COORDS,
    customerCoordinates: CUSTOMER_COORDS,
    currentStatus: "ready_for_pickup",
  });
  assert.equal(phasesReady.remainingAcceptanceMins, 0);
  assert.equal(phasesReady.remainingPreparationMins, 0);

  // Status: arrived_at_vendor -> first mile is completed (0)
  const phasesAtShop = estimateOperationalPhases({
    storeCoordinates: STORE_COORDS,
    customerCoordinates: CUSTOMER_COORDS,
    currentStatus: "arrived_at_vendor",
  });
  assert.equal(phasesAtShop.remainingFirstMileMins, 0);

  // Status: picked_up -> handover is completed (0)
  const phasesPickedUp = estimateOperationalPhases({
    storeCoordinates: STORE_COORDS,
    customerCoordinates: CUSTOMER_COORDS,
    currentStatus: "picked_up",
  });
  assert.equal(phasesPickedUp.handoverMins, 0);

  // Status: delivered -> remaining ETA is 0
  const resultDelivered = await computeDeliveryETA(
    {
      storeCoordinates: STORE_COORDS,
      customerCoordinates: CUSTOMER_COORDS,
      currentStatus: "delivered",
    },
    provider,
  );
  assert.equal(resultDelivered.remainingMins, 0);
  assert.equal(resultDelivered.targetMins, 0);
});

test("ETA Engine: Elapsed preparation time is correctly deducted", () => {
  const now = Date.now();
  const tenMinsAgo = now - 10 * 60 * 1000;

  const phases = estimateOperationalPhases({
    storeCoordinates: STORE_COORDS,
    customerCoordinates: CUSTOMER_COORDS,
    category: "food", // 16 min base
    itemCount: 1,
    currentStatus: "accepted",
    storeAcceptedAtMs: tenMinsAgo,
  });

  // 16 min base - 10 min elapsed = ~6 mins remaining
  assert.ok(phases.remainingPreparationMins <= 7 && phases.remainingPreparationMins >= 5);
});

test("ETA Engine: Rejects invalid coordinates", async () => {
  await assert.rejects(
    async () => {
      await computeDeliveryETA({
        storeCoordinates: { lat: 100, lng: 76 }, // lat > 90 invalid
        customerCoordinates: CUSTOMER_COORDS,
      });
    },
    { message: /Invalid store or customer coordinates/ },
  );

  await assert.rejects(
    async () => {
      await computeDeliveryETA({
        storeCoordinates: STORE_COORDS,
        customerCoordinates: { lat: 0, lng: 0 }, // 0,0 null island invalid
      });
    },
    { message: /Invalid store or customer coordinates/ },
  );
});

test("ETA Engine: Routing provider fallback with urban circuity", async () => {
  // Provider fails -> must fall back to calibrated Haversine with ~1.35x circuity
  const failingProvider = new MockRoutingProvider(true);
  const result = await computeDeliveryETA(
    {
      storeCoordinates: STORE_COORDS,
      customerCoordinates: CUSTOMER_COORDS,
      category: "grocery",
    },
    failingProvider,
  );

  assert.equal(result.routingSource, "haversine_circuity_fallback");
  assert.ok(result.isProvisional);
  assert.ok(result.circuityFactor >= 1.3);
  assert.ok(result.roadDistanceKm > result.airDistanceKm);
});

test("ETA Engine: Category preparation SLAs match operational defaults", () => {
  const grocerySla = getCategorySla("grocery");
  const foodSla = getCategorySla("food");
  const pharmacySla = getCategorySla("pharmacy");

  assert.ok(foodSla.basePrepMins > grocerySla.basePrepMins);
  assert.ok(grocerySla.basePrepMins > pharmacySla.basePrepMins);
});

test("ETA Engine: Speed curve handles peak vs off-peak hours", () => {
  const lunchRushDate = new Date("2026-10-23T13:00:00");
  const nightDate = new Date("2026-10-23T02:00:00");

  const peakSpeed = getUrbanTrafficSpeedKmh(lunchRushDate);
  const nightSpeed = getUrbanTrafficSpeedKmh(nightDate);

  assert.equal(peakSpeed, 14);
  assert.equal(nightSpeed, 26);
  assert.ok(nightSpeed > peakSpeed);
});

test("ETA Engine: Historical accuracy metrics calculation", () => {
  const now = Date.now();
  const sampleLogs = [
    {
      predictionId: "1",
      orderId: "o1",
      predictedTargetMins: 20,
      predictedEarliestMins: 17,
      predictedLatestMins: 24,
      routingSource: "osrm",
      predictedAtMs: now - 19 * 60 * 1000,
      actualDeliveredAtMs: now, // 19 min actual -> error 1 min (inside window)
      latencyMs: 45,
    },
    {
      predictionId: "2",
      orderId: "o2",
      predictedTargetMins: 25,
      predictedEarliestMins: 21,
      predictedLatestMins: 30,
      routingSource: "osrm",
      predictedAtMs: now - 28 * 60 * 1000,
      actualDeliveredAtMs: now, // 28 min actual -> error 3 mins (inside window)
      latencyMs: 52,
    },
    {
      predictionId: "3",
      orderId: "o3",
      predictedTargetMins: 15,
      predictedEarliestMins: 12,
      predictedLatestMins: 18,
      routingSource: "haversine_circuity_fallback",
      predictedAtMs: now - 22 * 60 * 1000,
      actualDeliveredAtMs: now, // 22 min actual -> error 7 mins (outside window)
      latencyMs: 12,
    },
  ];

  const metrics = computeAccuracyMetrics(sampleLogs);

  assert.equal(metrics.sampleSize, 3);
  // Errors: 1, 3, 7 -> MAE = (1 + 3 + 7) / 3 = 3.67
  assert.equal(metrics.meanAbsoluteErrorMinutes, 3.67);
  // P90 error: 7
  assert.equal(metrics.p90AbsoluteErrorMinutes, 7);
  // Coverage: 2 out of 3 inside window = 66.7%
  assert.equal(metrics.windowCoveragePercentage, 66.7);
  // Fallback rate: 1 out of 3 = 33.3%
  assert.equal(metrics.fallbackRoutingRatePercentage, 33.3);
  assert.ok(metrics.averageLatencyMs > 0);
});
