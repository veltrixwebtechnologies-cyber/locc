export interface Coordinate {
  lat: number;
  lng: number;
}

export function isFiniteNumber(value: unknown): value is number {
  if (value === null || value === undefined || value === "" || typeof value === "boolean")
    return false;
  const num = Number(value);
  return Number.isFinite(num);
}

export function isValidCoordinate(lat: unknown, lng: unknown): lat is number {
  if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) return false;
  const numLat = Number(lat);
  const numLng = Number(lng);
  return Math.abs(numLat) <= 90 && Math.abs(numLng) <= 180 && !(numLat === 0 && numLng === 0);
}

export function normalizeCoordinate(value: unknown): Coordinate | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const lat = record.lat;
  const lng = record.lng;
  if (typeof lat === "number" && typeof lng === "number" && isValidCoordinate(lat, lng)) {
    return { lat, lng };
  }
  return null;
}

const EARTH_RADIUS_M = 6_371_000;

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function pointToSegmentMeters(point: Coordinate, start: Coordinate, end: Coordinate): number {
  const avgLat = (point.lat + start.lat + end.lat) / 3;
  const project = (lat: number, lng: number) => ({
    x: EARTH_RADIUS_M * toRad(lng) * Math.cos(toRad(avgLat)),
    y: EARTH_RADIUS_M * toRad(lat),
  });
  const p = project(point.lat, point.lng);
  const a = project(start.lat, start.lng);
  const b = project(end.lat, end.lng);
  const abX = b.x - a.x;
  const abY = b.y - a.y;
  const apX = p.x - a.x;
  const apY = p.y - a.y;
  const denom = abX * abX + abY * abY;
  const t = denom <= 0 ? 0 : Math.max(0, Math.min(1, (apX * abX + apY * abY) / denom));
  const closestX = a.x + abX * t;
  const closestY = a.y + abY * t;
  return Math.hypot(p.x - closestX, p.y - closestY);
}

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return (2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) / 1000;
}

export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  return haversineDistanceKm(lat1, lon1, lat2, lon2) * 1000;
}

export function distanceToPolylineMeters(point: Coordinate, geometry: [number, number][]): number {
  if (!geometry || geometry.length === 0) return Infinity;
  if (geometry.length === 1) {
    const [lng, lat] = geometry[0];
    return haversineDistanceMeters(point.lat, point.lng, lat, lng);
  }
  let minDistance = Infinity;
  for (let i = 0; i < geometry.length - 1; i += 1) {
    const start = geometry[i];
    const end = geometry[i + 1];
    if (!start || !end) continue;
    const distance = pointToSegmentMeters(
      point,
      { lat: start[1], lng: start[0] },
      { lat: end[1], lng: end[0] },
    );
    if (distance < minDistance) minDistance = distance;
  }
  return minDistance;
}
