import { MAX_LOCATION_AGE_MS, parseCoordinates } from "./coordinates";
/**
 * LocalShore Global Delivery Location Store
 * Reactive delivery location state machine supporting GPS Geolocation, Nominatim Reverse Geocoding,
 * Map Pin selection, and city-aware dynamic area presets.
 *
 * STATES:
 *  - NO_LOCATION_SELECTED : User has not selected or detected a location yet.
 *  - DETECTING_LOCATION   : Currently acquiring device GPS or reverse geocoding.
 *  - LOCATION_SELECTED    : Valid location confirmed & persisted.
 *  - LOCATION_ERROR       : GPS acquisition failed or permission denied (graceful fallback).
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { reverseGeocode } from "@/lib/geocoding.functions";

export interface DeliveryLocation {
  id: string;
  label: string; // Full formatted address label (e.g. "Pappampatti Pirivu, Coimbatore, TN")
  area: string; // Locality (e.g. "Pappampatti Pirivu")
  city: string; // City & State (e.g. "Coimbatore, TN")
  lat: number;
  lng: number;
  isGPS?: boolean;
  accuracy?: number | null;
  pincode?: string;
}

export type LocationState =
  | "NO_LOCATION_SELECTED"
  | "DETECTING_LOCATION"
  | "LOCATION_SELECTED"
  | "LOCATION_ERROR";

export type GPSStatus =
  | "idle" // No attempt made yet
  | "detecting" // Currently requesting GPS
  | "ok" // GPS fix acquired
  | "denied" // User denied permission
  | "unavailable" // GPS position unavailable
  | "timeout" // GPS request timed out
  | "error" // Generic error
  | "unsupported"; // Browser doesn't support geolocation

const STORAGE_KEY = "localshore_active_delivery_location";
const CONFIRMED_KEY = "localshore_location_confirmed"; // set only when user explicitly picks
const LISTENERS = new Set<() => void>();
const STATE_LISTENERS = new Set<() => void>();

// ─── Location & GPS State ───

let gpsStatus: GPSStatus = "idle";
let gpsErrorMessage: string | null = null;

// Customer discovery can use a live network/Wi-Fi fix when satellite GPS is
// unavailable. The accuracy is retained and shown to the user; checkout can
// still apply its stricter entrance-pin validation independently.
function hasFreshLiveGPSFix(position: GeolocationPosition, now = Date.now()): boolean {
  return (
    !!parseCoordinates(position.coords.latitude, position.coords.longitude) &&
    Number.isFinite(position.coords.accuracy) &&
    position.coords.accuracy >= 0 &&
    Number.isFinite(position.timestamp) &&
    now - position.timestamp <= MAX_LOCATION_AGE_MS &&
    position.timestamp <= now + 1000
  );
}

function getStoredLocation(): DeliveryLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed.lat === "number" && typeof parsed.lng === "number") {
        return parsed;
      }
    }
  } catch {
    // Ignore storage parse errors
  }
  return null;
}

export function hasUserChosenLocation(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CONFIRMED_KEY) === "1";
  } catch {
    return false;
  }
}

function getInitialLocation(): DeliveryLocation | null {
  if (typeof window === "undefined") return null;
  const stored = getStoredLocation();
  if (stored && hasUserChosenLocation()) {
    return stored;
  }
  return null;
}

let activeLocation: DeliveryLocation | null = getInitialLocation();

let currentState: LocationState = activeLocation ? "LOCATION_SELECTED" : "NO_LOCATION_SELECTED";

function notifyListeners() {
  LISTENERS.forEach((listener) => listener());
  STATE_LISTENERS.forEach((listener) => listener());
}

export function getActiveDeliveryLocation(): DeliveryLocation | null {
  return activeLocation;
}

export function getLocationState(): LocationState {
  return currentState;
}

export function setLocationState(state: LocationState) {
  currentState = state;
  notifyListeners();
}

export function getGPSStatus(): { status: GPSStatus; errorMessage: string | null } {
  return { status: gpsStatus, errorMessage: gpsErrorMessage };
}

function setGPSStatus(status: GPSStatus, errorMessage: string | null = null) {
  gpsStatus = status;
  gpsErrorMessage = errorMessage;
  if (status === "detecting") {
    currentState = "DETECTING_LOCATION";
  } else if (status === "ok" && activeLocation) {
    currentState = "LOCATION_SELECTED";
  } else if (
    status === "denied" ||
    status === "unavailable" ||
    status === "timeout" ||
    status === "error" ||
    status === "unsupported"
  ) {
    currentState = activeLocation ? "LOCATION_SELECTED" : "LOCATION_ERROR";
  }
  notifyListeners();
}

export function useGPSStatus(): { status: GPSStatus; errorMessage: string | null } {
  const [state, setState] = useState<{ status: GPSStatus; errorMessage: string | null }>({
    status: gpsStatus,
    errorMessage: gpsErrorMessage,
  });

  useEffect(() => {
    const handleChange = () => {
      setState({ status: gpsStatus, errorMessage: gpsErrorMessage });
    };
    STATE_LISTENERS.add(handleChange);
    handleChange();
    return () => {
      STATE_LISTENERS.delete(handleChange);
    };
  }, []);

  return state;
}

export function useLocationState(): LocationState {
  const [state, setState] = useState<LocationState>(currentState);

  useEffect(() => {
    const handleChange = () => {
      setState(currentState);
    };
    STATE_LISTENERS.add(handleChange);
    handleChange();
    return () => {
      STATE_LISTENERS.delete(handleChange);
    };
  }, []);

  return state;
}

let locationRevision = 0;

export function setActiveDeliveryLocation(loc: DeliveryLocation) {
  locationRevision++;
  activeLocation = { ...loc };
  currentState = "LOCATION_SELECTED";
  gpsStatus = "idle";
  gpsErrorMessage = null;
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
 * Clear the current delivery location (returns state to NO_LOCATION_SELECTED).
 */
export function clearActiveDeliveryLocation() {
  locationRevision++;
  activeLocation = null;
  currentState = "NO_LOCATION_SELECTED";
  gpsStatus = "idle";
  gpsErrorMessage = null;
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
 * Dynamically resolves popular sub-areas for a given selected location.
 * Only returns areas AFTER a location is explicitly selected.
 * Returns empty array when NO_LOCATION_SELECTED.
 */
export function getPopularAreasForLocation(location: DeliveryLocation | null): DeliveryLocation[] {
  // Area presets must never invent coordinates. Areas are populated from the
  // live location/search result by the backend when that feature is available.
  return [];
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
      })
      .catch(() => {});
  }
}

/**
 * Detect Current GPS Location using Geolocation API.
 * Updates state machine: DETECTING_LOCATION -> LOCATION_SELECTED or LOCATION_ERROR.
 */
export async function detectCurrentGPSLocation(options?: {
  silent?: boolean;
}): Promise<DeliveryLocation> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    setGPSStatus("unsupported", "Geolocation is not supported by your browser.");
    throw new Error("Geolocation is not supported by your browser.");
  }

  const requestRevision = ++locationRevision;
  const silent = options?.silent ?? false;
  setGPSStatus("detecting");

  if (window.isSecureContext === false) {
    const message = "Location requires a secure connection. Open this page using HTTPS.";
    setGPSStatus("unsupported", message);
    throw new Error(message);
  }

  // A failed address provider must not leave a valid GPS fix waiting indefinitely.
  const withDeadline = async <T,>(operation: Promise<T>): Promise<T> => {
    let timer: ReturnType<typeof setTimeout>;
    try {
      return await Promise.race([
        operation,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error("Address lookup timed out")), 4000);
        }),
      ]);
    } finally {
      clearTimeout(timer!);
    }
  };

  const processPosition = async (position: GeolocationPosition): Promise<DeliveryLocation> => {
    if (!hasFreshLiveGPSFix(position))
      throw new Error(
        "Location is invalid or out of date. Refresh and try again.",
      );
    const { latitude: lat, longitude: lng, accuracy } = position.coords;
    let area = `GPS Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
    let city = "";
    let label = `Near ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    let pincode: string | undefined;

    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lng),
        format: "json",
        addressdetails: "1",
        zoom: "16",
      });
      const res = await withDeadline(fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
        headers: { "Accept-Language": "en" },
        signal: AbortSignal.timeout(4000),
      }));
      if (res.ok) {
        const data = await withDeadline(res.json());
        if (data && data.display_name) {
          const parts = data.display_name.split(",").map((s: string) => s.trim());
          const shortArea = parts[0] || "Live GPS Location";
          const shortLabel = parts.slice(0, 3).join(", ");
          const dist =
            data.address?.city ||
            data.address?.town ||
            data.address?.county ||
            data.address?.state_district ||
            "";
          const st = data.address?.state || "";

          area = shortArea;
          city = [dist, st].filter(Boolean).join(", ");
          label = shortLabel;
          if (data.address?.postcode) pincode = data.address.postcode;
        }
      } else {
        const result = await withDeadline(reverseGeocode({ data: { lat, lng } }));
        if (result && result.area) {
          area = result.area;
          city = result.city || city;
          label = result.address || label;
        }
      }
    } catch (err) {
      try {
        const result = await withDeadline(reverseGeocode({ data: { lat, lng } }));
        if (result && result.area) {
          area = result.area;
          city = result.city || city;
          label = result.address || label;
        }
      } catch (innerErr) {
        console.warn("Geolocation reverse geocode fallback:", innerErr);
      }
    }

    const newLoc: DeliveryLocation = {
      id: `gps-${Date.now()}`,
      label,
      area,
      city,
      lat,
      lng,
      isGPS: true,
      accuracy: accuracy ?? null,
      pincode,
    };

    if (requestRevision !== locationRevision)
      throw new Error("Location selection changed while GPS was resolving.");

    setActiveDeliveryLocation(newLoc);
    setGPSStatus("ok");

    if (!silent) {
      const toastDesc =
        accuracy && accuracy > 100
          ? `${area}${city ? `, ${city}` : ""} · Accuracy ±${Math.round(accuracy)}m`
          : `${area}${city ? `, ${city}` : ""}`;
      toast.success("Live Location Acquired", {
        id: "live-location-toast",
        description: toastDesc,
      });
    }
    return newLoc;
  };

  return new Promise((resolve, reject) => {
    let watchId: number | undefined;
    let finished = false;
    const cleanup = () => {
      finished = true;
      clearTimeout(deadline);
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
    const fail = (status: GPSStatus, message: string) => {
      cleanup();
      if (requestRevision === locationRevision) setGPSStatus(status, message);
      reject(new Error(message));
    };
    const deadline = setTimeout(
      () => fail("timeout", "GPS request timed out. Retry outdoors or choose your destination on the map."),
      20000,
    );
    try {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (finished) return;
          if (requestRevision !== locationRevision) {
            fail("error", "Location selection changed while GPS was resolving.");
            return;
          }
          if (!hasFreshLiveGPSFix(position)) return;
          cleanup();
          processPosition(position).then(resolve, (error) => {
            if (requestRevision === locationRevision) {
              setGPSStatus("error", error instanceof Error ? error.message : "Location detection failed. Please retry.");
            }
            reject(error);
          });
        },
        (error) => {
          if (finished) return;
          if (error.code === 1) fail("denied", "Allow location access in your browser site settings, then retry. You can also choose a pin on the map.");
          if (error.code === 2) fail("unavailable", "Your device could not determine its location. Turn on device location services and retry.");
          if (error.code === 3) fail("timeout", "GPS took too long to respond. Move near a window or outdoors and retry.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
      if (finished) navigator.geolocation.clearWatch(watchId);
    } catch (error) {
      fail("error", error instanceof Error ? error.message : "Location detection failed. Please retry.");
    }
  });
}
