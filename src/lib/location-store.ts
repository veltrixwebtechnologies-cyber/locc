import { parseCoordinates } from "./coordinates";
import {
  acquireCurrentPosition,
  accuracyLabel,
  freshBrowserPosition,
  LocationAcquisitionError,
} from "./acquire-location";
/**
 * LocalShore Global Delivery Location Store
 * Reactive delivery location management supporting GPS Geolocation, Nominatim Reverse Geocoding,
 * and pre-set Coimbatore hubs.
 *
 * KEY DESIGN:
 *  - `activeLocation`    = the user's currently *selected* delivery destination
 *  - `gpsDetectionState` = real-time status of device GPS detection (separate concern)
 *  - The header reads `activeLocation` — it is NEVER populated with a default/preset
 *    unless the user explicitly picks one or GPS successfully detects their position.
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";

export interface DeliveryLocation {
  id: string;
  label: string; // Full formatted address label (e.g. "Pappampatti Pirivu, Coimbatore, TN")
  area: string; // Locality (e.g. "Pappampatti Pirivu")
  city: string; // City & State (e.g. "Coimbatore, TN")
  lat: number;
  lng: number;
  isGPS?: boolean;
  accuracy?: number | null;
  isApproximate?: boolean;
  pincode?: string;
}

export type GPSStatus =
  | "idle" // No attempt made yet
  | "detecting" // Currently requesting GPS
  | "ok" // GPS fix acquired
  | "denied" // User denied permission
  | "unavailable" // GPS position unavailable
  | "timeout" // GPS request timed out
  | "error" // Generic error
  | "unsupported"; // Browser doesn't support geolocation

export const PRESET_LOCATIONS: DeliveryLocation[] = [
  {
    id: "kovilmedu",
    label: "Kovilmedu, Coimbatore, TN",
    area: "Kovilmedu",
    city: "Coimbatore, TN",
    lat: 11.0285,
    lng: 76.9258,
  },
  {
    id: "pappampatti",
    label: "Pappampatti Pirivu, Coimbatore, TN",
    area: "Pappampatti Pirivu",
    city: "Coimbatore, TN",
    lat: 11.0028,
    lng: 77.0865,
  },
  {
    id: "rspuram",
    label: "RS Puram, Coimbatore, TN",
    area: "RS Puram",
    city: "Coimbatore, TN",
    lat: 11.0064,
    lng: 76.9507,
  },
  {
    id: "gandhipuram",
    label: "Gandhipuram, Coimbatore, TN",
    area: "Gandhipuram",
    city: "Coimbatore, TN",
    lat: 11.0172,
    lng: 76.9562,
  },
  {
    id: "peelamedu",
    label: "Peelamedu, Coimbatore, TN",
    area: "Peelamedu",
    city: "Coimbatore, TN",
    lat: 11.0252,
    lng: 77.0025,
  },
  {
    id: "singanallur",
    label: "Singanallur, Coimbatore, TN",
    area: "Singanallur",
    city: "Coimbatore, TN",
    lat: 10.9984,
    lng: 77.0258,
  },
  {
    id: "saravanampatti",
    label: "Saravanampatti, Coimbatore, TN",
    area: "Saravanampatti",
    city: "Coimbatore, TN",
    lat: 11.0797,
    lng: 76.9997,
  },
  {
    id: "tidalpark",
    label: "Tidal Park, Coimbatore, TN",
    area: "Tidal Park",
    city: "Coimbatore, TN",
    lat: 11.0264,
    lng: 77.018,
  },
];

const STORAGE_KEY = "localshore_active_delivery_location";
const CONFIRMED_KEY = "localshore_location_confirmed"; // set only when user explicitly picks
const GPS_STATUS_KEY = "localshore_gps_status";
const LISTENERS = new Set<() => void>();
const GPS_LISTENERS = new Set<() => void>();

// ─── GPS Detection State (separate from delivery location) ───

let gpsStatus: GPSStatus = "idle";
let gpsErrorMessage: string | null = null;

function notifyGPSListeners() {
  GPS_LISTENERS.forEach((listener) => listener());
}

export function getGPSStatus(): { status: GPSStatus; errorMessage: string | null } {
  return { status: gpsStatus, errorMessage: gpsErrorMessage };
}

function setGPSStatus(status: GPSStatus, errorMessage: string | null = null) {
  gpsStatus = status;
  gpsErrorMessage = errorMessage;
  notifyGPSListeners();
}

/**
 * React hook to subscribe to GPS detection status changes.
 */
export function useGPSStatus(): { status: GPSStatus; errorMessage: string | null } {
  const [state, setState] = useState<{ status: GPSStatus; errorMessage: string | null }>({
    status: gpsStatus,
    errorMessage: gpsErrorMessage,
  });

  useEffect(() => {
    const handleChange = () => {
      setState({ status: gpsStatus, errorMessage: gpsErrorMessage });
    };
    GPS_LISTENERS.add(handleChange);
    // Sync immediately in case status changed between render and effect
    handleChange();
    return () => {
      GPS_LISTENERS.delete(handleChange);
    };
  }, []);

  return state;
}

// ─── Delivery Location State ───

function getStoredLocation(): DeliveryLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parseCoordinates(parsed.lat, parsed.lng)) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage parse errors
  }
  return null;
}

/**
 * Returns null if no location has been explicitly chosen or GPS-detected.
 * NEVER returns a hardcoded default.
 */
function getInitialLocation(): DeliveryLocation | null {
  if (typeof window === "undefined") return null;
  const stored = getStoredLocation();
  if (stored && hasUserChosenLocation()) {
    return stored;
  }
  return null;
}

/** Returns true only when the user has explicitly chosen a delivery location */
export function hasUserChosenLocation(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CONFIRMED_KEY) === "1";
  } catch {
    return false;
  }
}

let activeLocation: DeliveryLocation | null = getInitialLocation();

function notifyListeners() {
  LISTENERS.forEach((listener) => listener());
}

export function getActiveDeliveryLocation(): DeliveryLocation | null {
  return activeLocation;
}

let locationRevision = 0;
let activeGPSRequest: AbortController | null = null;

export function cancelCurrentGPSLocation() {
  locationRevision++;
  activeGPSRequest?.abort();
  activeGPSRequest = null;
  if (gpsStatus === "detecting") setGPSStatus("idle");
}

export function setActiveDeliveryLocation(loc: DeliveryLocation) {
  cancelCurrentGPSLocation();
  setGPSStatus("idle");
  publishLocation(loc);
}

function publishLocation(loc: DeliveryLocation) {
  activeLocation = { ...loc };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activeLocation));
    localStorage.setItem(CONFIRMED_KEY, "1"); // mark as explicitly chosen
  } catch {
    // Ignore storage errors
  }
  notifyListeners();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("localshore_location_change", { detail: activeLocation }));
  }
}

/**
 * Clear the current delivery location (used when user wants to re-detect).
 */
export function clearActiveDeliveryLocation() {
  cancelCurrentGPSLocation();
  activeLocation = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CONFIRMED_KEY);
  } catch {
    // Ignore storage errors
  }
  notifyListeners();
}

/**
 * Custom React Hook to subscribe to active delivery location updates.
 * Returns null if no location is selected yet.
 */
export function useDeliveryLocation(): [DeliveryLocation | null, (loc: DeliveryLocation) => void] {
  const [loc, setLoc] = useState<DeliveryLocation | null>(null);

  useEffect(() => {
    setLoc(activeLocation ? { ...activeLocation } : null);
    const handleChange = () => {
      setLoc(activeLocation ? { ...activeLocation } : null);
    };
    LISTENERS.add(handleChange);
    if (typeof window !== "undefined") {
      window.addEventListener("localshore_location_change", handleChange);
    }
    return () => {
      LISTENERS.delete(handleChange);
      if (typeof window !== "undefined") {
        window.removeEventListener("localshore_location_change", handleChange);
      }
    };
  }, []);

  return [loc, setActiveDeliveryLocation];
}

/**
 * Auto-detect live GPS location on application load if permissions are granted or on initial session.
 * Only runs SILENTLY if permission is already granted — never prompts.
 */
let autoGPSDone = false;

export function initAutoGPSLocation() {
  if (typeof window === "undefined" || !navigator.geolocation || autoGPSDone) return;

  // Check if the user already has an explicitly chosen location
  if (hasUserChosenLocation() && getStoredLocation()) {
    autoGPSDone = true;
    return;
  }

  const sessionKey = "localshore_auto_gps_done";
  try {
    if (sessionStorage.getItem(sessionKey)) {
      autoGPSDone = true;
      return;
    }
  } catch {
    // Ignore storage errors
  }

  const tryDetect = () => {
    autoGPSDone = true;
    try {
      sessionStorage.setItem(sessionKey, "1");
    } catch {}
    detectCurrentGPSLocation({ silent: true }).catch((err) => {
      console.warn("Auto GPS detection skipped:", err);
    });
  };

  if ("permissions" in navigator) {
    navigator.permissions
      .query({ name: "geolocation" as any })
      .then((result) => {
        if (result.state === "granted") {
          tryDetect();
        }
        // If "prompt" or "denied", do NOT auto-detect — wait for user action
      })
      .catch(() => {});
  }
}

/** Update the selected coordinates immediately; the optional address lookup cannot block GPS. */
function locationFromPosition(
  position: GeolocationPosition,
  approximate = false,
): DeliveryLocation {
  const { latitude: lat, longitude: lng, accuracy } = position.coords;
  const point = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  return {
    id: `gps-${Date.now()}`,
    label: approximate ? `Approximate area near ${point} (±${accuracyLabel(accuracy)})` : point,
    area: approximate ? `Approximate area (±${accuracyLabel(accuracy)})` : `Near ${point}`,
    city: "",
    lat,
    lng,
    isGPS: true,
    isApproximate: approximate,
    accuracy,
  };
}

async function enrichLocationLabel(
  location: DeliveryLocation,
  revision: number,
  signal: AbortSignal,
) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(abort, 4000);
  try {
    if (signal.aborted) return;
    const params = new URLSearchParams({
      lat: String(location.lat),
      lon: String(location.lng),
      format: "json",
      addressdetails: "1",
      zoom: "16",
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: { "Accept-Language": "en" },
      signal: controller.signal,
    });
    if (!response.ok) return;
    const data = await response.json();
    if (
      controller.signal.aborted ||
      signal.aborted ||
      revision !== locationRevision ||
      activeLocation?.id !== location.id
    )
      return;
    if (typeof data?.display_name !== "string" || !data.display_name.trim()) return;
    const parts = data.display_name.split(",").map((part: string) => part.trim());
    const district =
      data.address?.city ||
      data.address?.town ||
      data.address?.county ||
      data.address?.state_district ||
      "";
    publishLocation({
      ...location,
      label: location.isApproximate
        ? `Approximate: ${parts.slice(0, 3).join(", ")} (±${accuracyLabel(location.accuracy!)})`
        : parts.slice(0, 3).join(", "),
      area: location.isApproximate ? `Near ${parts[0]} (approximate)` : parts[0],
      city: [district, data.address?.state].filter(Boolean).join(", "),
      pincode: location.isApproximate ? undefined : data.address?.postcode,
    });
  } catch {
    // Coordinates remain selected if address lookup is blocked, slow, or unavailable.
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
  }
}

/** Explicit browsing-area choice only. Checkout independently requires an entrance pin. */
export function confirmApproximateGPSLocation(position: GeolocationPosition): DeliveryLocation {
  if (!freshBrowserPosition(position))
    throw new Error("This location reading has expired. Retry location detection.");
  cancelCurrentGPSLocation();
  const controller = new AbortController();
  activeGPSRequest = controller;
  const location = locationFromPosition(position, true);
  publishLocation(location);
  setGPSStatus("ok");
  void enrichLocationLabel(location, locationRevision, controller.signal);
  return location;
}

export async function detectCurrentGPSLocation(options?: {
  silent?: boolean;
}): Promise<DeliveryLocation> {
  cancelCurrentGPSLocation();
  const requestRevision = locationRevision;
  const controller = new AbortController();
  activeGPSRequest = controller;
  setGPSStatus("detecting", "Waiting for your browser's location. Allow access if prompted.");
  try {
    const position = await acquireCurrentPosition({
      signal: controller.signal,
      onProgress: (message) => {
        if (requestRevision === locationRevision) setGPSStatus("detecting", message);
      },
    });
    if (controller.signal.aborted || requestRevision !== locationRevision)
      throw new DOMException("Location selection changed.", "AbortError");
    const location = locationFromPosition(position);
    publishLocation(location);
    setGPSStatus("ok");
    void enrichLocationLabel(location, requestRevision, controller.signal);
    if (!options?.silent)
      toast.success("Current location updated", {
        id: "live-location-toast",
        description: `Accuracy ±${accuracyLabel(position.coords.accuracy)}. Confirm your delivery entrance at checkout.`,
      });
    return location;
  } catch (error) {
    if (controller.signal.aborted || requestRevision !== locationRevision) throw error;
    const message =
      error instanceof Error
        ? error.message
        : "Could not determine your location. Retry or choose an area.";
    setGPSStatus(error instanceof LocationAcquisitionError ? error.status : "error", message);
    if (!options?.silent)
      toast.error("Location could not be updated", {
        id: "live-location-toast-err",
        description: message,
      });
    throw error;
  }
}
