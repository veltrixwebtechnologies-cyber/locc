import type { MapLocation, RouteResult } from "./types";
import { calculateHaversineDistanceKm } from "./providers";

export interface TurnStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  name: string;
}

export interface AdvancedRouteResult extends RouteResult {
  steps?: TurnStep[];
  formattedDistance: string;
  formattedDuration: string;
  phase: "to_vendor" | "to_customer";
}

/**
 * High-performance OSRM Road Route Fetcher with Retry & Straight-Line Fallback
 */
export async function fetchDeliveryRoute(
  origin: MapLocation,
  destination: MapLocation,
  phase: "to_vendor" | "to_customer" = "to_customer",
  retries = 2
): Promise<AdvancedRouteResult> {
  const baseUrl =
    import.meta.env.VITE_ROUTING_API_URL ||
    "https://router.project-osrm.org/route/v1/driving";

  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `${baseUrl}/${coords}?overview=full&geometries=geojson&steps=true`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (!data.routes || data.routes.length === 0) throw new Error("No routes returned");

      const route = data.routes[0];
      const distanceMeters = Math.round(route.distance);
      const durationSeconds = Math.round(route.duration);
      const geometry = route.geometry.coordinates as [number, number][];

      const steps: TurnStep[] = (route.legs?.[0]?.steps || []).map((step: any) => ({
        instruction: step.maneuver?.type ? `${step.maneuver.type} ${step.maneuver.modifier || ""}`.trim() : "Continue",
        distanceMeters: Math.round(step.distance || 0),
        durationSeconds: Math.round(step.duration || 0),
        name: step.name || "road",
      }));

      return {
        distanceMeters,
        durationSeconds,
        geometry,
        steps,
        formattedDistance: distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(1)} km` : `${distanceMeters} m`,
        formattedDuration: durationSeconds >= 3600 
          ? `${Math.floor(durationSeconds / 3600)}h ${Math.ceil((durationSeconds % 3600) / 60)}m` 
          : `${Math.ceil(durationSeconds / 60)} mins`,
        phase,
      };
    } catch (err) {
      if (attempt === retries) {
        console.warn(`[Routing] OSRM API failed after ${retries + 1} attempts, using straight-line fallback`, err);
        const distKm = calculateHaversineDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
        const distMeters = Math.round(distKm * 1000);
        const durSec = Math.round((distKm / 22) * 3600); // ~22km/h city driving average

        return {
          distanceMeters: distMeters,
          durationSeconds: durSec,
          geometry: [
            [origin.lng, origin.lat],
            [destination.lng, destination.lat],
          ],
          formattedDistance: distKm >= 1 ? `${distKm.toFixed(1)} km` : `${distMeters} m`,
          formattedDuration: `${Math.ceil(durSec / 60)} mins`,
          phase,
        };
      }
      // Exponential backoff delay
      await new Promise((resolve) => setTimeout(resolve, 300 * Math.pow(2, attempt)));
    }
  }

  // Fallback
  const distKm = calculateHaversineDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
  return {
    distanceMeters: distKm * 1000,
    durationSeconds: Math.round((distKm / 22) * 3600),
    geometry: [[origin.lng, origin.lat], [destination.lng, destination.lat]],
    formattedDistance: `${distKm.toFixed(1)} km`,
    formattedDuration: `${Math.ceil((distKm / 22) * 60)} mins`,
    phase,
  };
}

/**
 * Calculates shortest distance in meters from point to polyline
 */
export function distanceToPolylineMeters(
  point: MapLocation,
  geometry: [number, number][]
): number {
  if (!geometry || geometry.length === 0) return 0;
  let minDistanceMeters = Infinity;

  for (let i = 0; i < geometry.length; i++) {
    const ptLng = geometry[i][0];
    const ptLat = geometry[i][1];
    const distKm = calculateHaversineDistanceKm(point.lat, point.lng, ptLat, ptLng);
    const distMeters = distKm * 1000;
    if (distMeters < minDistanceMeters) {
      minDistanceMeters = distMeters;
    }
  }

  return minDistanceMeters;
}

/**
 * Intelligent Route Recalculation Threshold Evaluator
 */
export function shouldRecalculateRoute(
  currentPos: MapLocation,
  lastCalculatedPos: MapLocation | null,
  geometry: [number, number][] | null,
  lastCalculatedAt: number,
  phaseChanged: boolean
): boolean {
  // Rule 1: Always recalculate if phase changed (Driver -> Vendor vs Driver -> Customer)
  if (phaseChanged) return true;

  // Rule 2: If no previous route exists
  if (!geometry || geometry.length === 0 || !lastCalculatedPos) return true;

  // Rule 3: Off-route check (> 80 meters away from polyline)
  const offRouteDistance = distanceToPolylineMeters(currentPos, geometry);
  if (offRouteDistance > 80) {
    console.info(`[Routing] Off-route detected: ${offRouteDistance.toFixed(0)}m from path`);
    return true;
  }

  // Rule 4: Meaningful distance & time elapsed (> 150m moved AND > 20s elapsed)
  const movedKm = calculateHaversineDistanceKm(currentPos.lat, currentPos.lng, lastCalculatedPos.lat, lastCalculatedPos.lng);
  const timeElapsedSec = (Date.now() - lastCalculatedAt) / 1000;

  if (movedKm > 0.15 && timeElapsedSec > 20) {
    return true;
  }

  return false;
}
