/**
 * LocalShore Delivery ETA Engine — Multi-Tier Routing Provider
 *
 * Tier 1: Real road graph duration via OSRM with strict timeouts & signal aborts.
 * Tier 2: Spatial LRU in-memory route cache (keyed to ~100m grid buckets).
 * Tier 3: Mathematically calibrated Haversine fallback with dynamic urban circuity (1.35x)
 *         and time-of-day speed curves.
 */

import { haversineDistanceKm, isValidCoordinate } from "../geo";
import type { GeoPoint, RoutingResult } from "./types";

const ROUTE_CACHE_TTL_MS = 1000 * 60 * 60 * 2; // 2 hours
const DEFAULT_URBAN_CIRCUITY = 1.35; // Indian urban road network circuity multiplier

interface CachedRouteEntry {
  result: RoutingResult;
  timestamp: number;
}

const memoryRouteCache = new Map<string, CachedRouteEntry>();

/** Round coordinates to ~110m for cluster caching */
function makeCacheKey(start: GeoPoint, end: GeoPoint): string {
  return `${start.lat.toFixed(3)},${start.lng.toFixed(3)}->${end.lat.toFixed(3)},${end.lng.toFixed(3)}`;
}

/** Get calibrated urban two-wheeler speed based on traffic hour */
export function getUrbanTrafficSpeedKmh(date: Date = new Date()): number {
  const hour = date.getHours();
  // Lunch rush: 12-14, Evening/Dinner rush: 18-21
  if ((hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 21)) {
    return 14; // heavy rush hour congestion
  }
  // Morning / Midday / Late Evening
  if (hour >= 7 && hour <= 22) {
    return 20; // standard urban traffic
  }
  // Night / Early morning off-peak
  return 26; // open roads
}

export interface IRoutingProvider {
  getRoute(start: GeoPoint, end: GeoPoint, signal?: AbortSignal): Promise<RoutingResult>;
}

export class MultiTierRoutingProvider implements IRoutingProvider {
  private osrmBaseUrl: string;

  constructor(osrmBaseUrl?: string) {
    this.osrmBaseUrl =
      osrmBaseUrl ||
      (typeof process !== "undefined" && process.env?.["ROUTING_API_URL"]) ||
      "https://router.project-osrm.org/route/v1/driving";
  }

  async getRoute(start: GeoPoint, end: GeoPoint, signal?: AbortSignal): Promise<RoutingResult> {
    if (!isValidCoordinate(start.lat, start.lng) || !isValidCoordinate(end.lat, end.lng)) {
      throw new Error("Invalid coordinate supplied to routing provider.");
    }

    const airDistanceKm = haversineDistanceKm(start.lat, start.lng, end.lat, end.lng);
    // If locations are essentially identical (< 20 meters), transit is negligible
    if (airDistanceKm < 0.02) {
      return {
        distanceKm: 0,
        durationSeconds: 0,
        source: "cache",
        isFallback: false,
      };
    }

    // 1. Check cache
    const cacheKey = makeCacheKey(start, end);
    const cached = memoryRouteCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < ROUTE_CACHE_TTL_MS) {
      return { ...cached.result, source: "cache" };
    }

    // 2. Query OSRM Road Network
    try {
      const url = `${this.osrmBaseUrl.replace(/\/$/, "")}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=false&steps=false`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

      const onParentAbort = () => controller.abort();
      signal?.addEventListener("abort", onParentAbort, { once: true });

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onParentAbort);

      if (response.ok) {
        const body = (await response.json()) as {
          code: string;
          routes?: Array<{ distance: number; duration: number }>;
        };

        if (body.code === "Ok" && body.routes && body.routes.length > 0) {
          const route = body.routes[0];
          const roadDistKm = Math.round((route.distance / 1000) * 100) / 100;
          const roadDurationSec = Math.max(60, Math.round(route.duration));

          const res: RoutingResult = {
            distanceKm: roadDistKm,
            durationSeconds: roadDurationSec,
            source: "osrm",
            isFallback: false,
          };
          memoryRouteCache.set(cacheKey, { result: res, timestamp: now });
          return res;
        }
      }
    } catch {
      // OSRM network timeout or service unreachable -> gracefully fall through to calibrated fallback
    }

    // 3. Calibrated Haversine with Circuity and Traffic Curves
    const fallbackRes = this.computeCalibratedFallback(start, end, airDistanceKm);
    memoryRouteCache.set(cacheKey, { result: fallbackRes, timestamp: now });
    return fallbackRes;
  }

  computeCalibratedFallback(
    start: GeoPoint,
    end: GeoPoint,
    precomputedAirDist?: number,
  ): RoutingResult {
    const airDist =
      precomputedAirDist ?? haversineDistanceKm(start.lat, start.lng, end.lat, end.lng);
    const roadDistanceKm = Math.round(airDist * DEFAULT_URBAN_CIRCUITY * 100) / 100;
    const speedKmh = getUrbanTrafficSpeedKmh();
    const durationSeconds = Math.max(90, Math.round((roadDistanceKm / speedKmh) * 3600));

    return {
      distanceKm: roadDistanceKm,
      durationSeconds,
      source: "haversine_circuity_fallback",
      isFallback: true,
    };
  }
}

export const defaultRoutingProvider = new MultiTierRoutingProvider();
