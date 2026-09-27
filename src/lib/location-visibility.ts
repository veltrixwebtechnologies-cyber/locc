import { isValidCoordinate } from "./geo";

export const CUSTOMER_VISIBILITY_RADIUS_KM = 5;
export const CUSTOMER_VISIBILITY_RADIUS_METERS = 5000;
export const DEFAULT_SHOP_DISCOVERY_RADIUS_KM = 7;
export const SHOP_DISCOVERY_RADIUS_OPTIONS_KM = [5, 7, 10] as const;

export function hasConfirmedCoordinates<T extends { lat?: number; lng?: number }>(location: T | null | undefined): location is T & { lat: number; lng: number } {
  return (
    typeof location?.lat === "number" &&
    Number.isFinite(location.lat) &&
    typeof location?.lng === "number" &&
    Number.isFinite(location.lng) &&
    isValidCoordinate(location.lat, location.lng)
  );
}

export function formatNearbyDistance(distanceKm: number | null | undefined) {
  if (distanceKm == null || !Number.isFinite(distanceKm) || distanceKm < 0) return "";
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m away`;
  return `${distanceKm.toFixed(1)} km away`;
}

// Defensive client-side check. The database RPCs are the authoritative filter.
export function isWithinCustomerVisibilityRadius(distanceKm: number | null | undefined) {
  return distanceKm != null && Number.isFinite(distanceKm) && distanceKm >= 0 && distanceKm <= CUSTOMER_VISIBILITY_RADIUS_KM;
}
