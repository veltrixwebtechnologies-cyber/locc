/**
 * LocalShore Delivery ETA Engine — Calibration & Historical Accuracy Metrics
 * Computes statistical metrics (MAE, P90, systematic bias, coverage)
 * to measure and refine prediction quality over time.
 */

import type { HistoricalAccuracyMetric } from "./types";

export interface LoggedPredictionRecord {
  predictionId: string;
  orderId: string;
  predictedTargetMins: number;
  predictedEarliestMins: number;
  predictedLatestMins: number;
  routingSource: string;
  predictedAtMs: number;
  actualDeliveredAtMs?: number | null;
  latencyMs?: number;
}

export function computeAccuracyMetrics(
  records: LoggedPredictionRecord[],
): HistoricalAccuracyMetric {
  const completed = records.filter(
    (r) =>
      typeof r.actualDeliveredAtMs === "number" &&
      r.actualDeliveredAtMs > r.predictedAtMs,
  );

  if (completed.length === 0) {
    return {
      sampleSize: 0,
      meanAbsoluteErrorMinutes: 0,
      p90AbsoluteErrorMinutes: 0,
      systematicBiasMinutes: 0,
      windowCoveragePercentage: 100,
      averageWindowWidthMinutes: 0,
      fallbackRoutingRatePercentage: 0,
      averageLatencyMs: 0,
    };
  }

  const errors: number[] = [];
  const signedErrors: number[] = [];
  let insideWindowCount = 0;
  let totalWindowWidth = 0;
  let fallbackCount = 0;
  let totalLatency = 0;

  for (const r of completed) {
    const actualDeliveryMins = (r.actualDeliveredAtMs! - r.predictedAtMs) / 60000;
    const errorMins = Math.abs(r.predictedTargetMins - actualDeliveryMins);
    const signedMins = r.predictedTargetMins - actualDeliveryMins; // > 0 means predicted later than actual

    errors.push(errorMins);
    signedErrors.push(signedMins);

    if (
      actualDeliveryMins >= r.predictedEarliestMins &&
      actualDeliveryMins <= r.predictedLatestMins
    ) {
      insideWindowCount += 1;
    }

    totalWindowWidth += Math.max(0, r.predictedLatestMins - r.predictedEarliestMins);
    if (r.routingSource === "haversine_circuity_fallback") {
      fallbackCount += 1;
    }
    if (r.latencyMs) {
      totalLatency += r.latencyMs;
    }
  }

  // Mean Absolute Error
  const sumErrors = errors.reduce((acc, e) => acc + e, 0);
  const mae = Math.round((sumErrors / completed.length) * 100) / 100;

  // P90 Absolute Error
  errors.sort((a, b) => a - b);
  const p90Index = Math.min(
    errors.length - 1,
    Math.floor(errors.length * 0.9),
  );
  const p90Error = Math.round(errors[p90Index] * 100) / 100;

  // Systematic Bias
  const sumSigned = signedErrors.reduce((acc, s) => acc + s, 0);
  const bias = Math.round((sumSigned / completed.length) * 100) / 100;

  // Coverage and window width
  const coverage = Math.round((insideWindowCount / completed.length) * 1000) / 10;
  const avgWindowWidth = Math.round((totalWindowWidth / completed.length) * 100) / 100;
  const fallbackRate = Math.round((fallbackCount / completed.length) * 1000) / 10;
  const avgLatency = Math.round(totalLatency / completed.length);

  return {
    sampleSize: completed.length,
    meanAbsoluteErrorMinutes: mae,
    p90AbsoluteErrorMinutes: p90Error,
    systematicBiasMinutes: bias,
    windowCoveragePercentage: coverage,
    averageWindowWidthMinutes: avgWindowWidth,
    fallbackRoutingRatePercentage: fallbackRate,
    averageLatencyMs: avgLatency,
  };
}
