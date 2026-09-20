import { parseCoordinates, MAX_LOCATION_AGE_MS } from "./coordinates";

export function assignmentLocation(row: any, now = Date.now()) {
  const pin = parseCoordinates(row?.current_latitude, row?.current_longitude);
  const capturedAt = Date.parse(row?.last_location_update_at ?? "");
  if (
    !pin ||
    !Number.isFinite(capturedAt) ||
    capturedAt > now + 1000 ||
    now - capturedAt > MAX_LOCATION_AGE_MS
  )
    return null;
  return {
    ...pin,
    heading: Number.isFinite(row.current_heading) ? row.current_heading : 0,
    capturedAt,
  };
}
