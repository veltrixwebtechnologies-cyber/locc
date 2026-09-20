export const CUSTOMER_VISIBILITY_RADIUS_KM = 5;
export const CUSTOMER_VISIBILITY_RADIUS_METERS = 5000;

export function hasConfirmedCoordinates(location: { lat?: number; lng?: number } | null | undefined) {
  return (
    typeof location?.lat === "number" &&
    Number.isFinite(location.lat) &&
    typeof location?.lng === "number" &&
    Number.isFinite(location.lng)
  );
}

export function formatNearbyDistance(distanceKm: number | null | undefined) {
  if (distanceKm == null || !Number.isFinite(distanceKm)) return "";
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m away`;
  return `${distanceKm.toFixed(1)} km away`;
}

// Defensive client-side check. The database RPCs are the authoritative filter.
export function isWithinCustomerVisibilityRadius(distanceKm: number | null | undefined) {
  return distanceKm != null && Number.isFinite(distanceKm) && distanceKm <= CUSTOMER_VISIBILITY_RADIUS_KM;
}
