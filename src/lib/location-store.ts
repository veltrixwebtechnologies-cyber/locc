import {
  MAX_CUSTOMER_DELIVERY_ACCURACY_M,
  MAX_LOCATION_AGE_MS,
  parseCoordinates,
} from "./coordinates";
import { resolveNominatimAddress } from "./location-address";
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

/** Discovery must never infer a customer location from a default city or seed data. */
export type DiscoveryLocationState = "LOCATION_UNKNOWN" | "LOCATION_CONFIRMED";

export function getDiscoveryLocationState(): DiscoveryLocationState {
  return activeLocation ? "LOCATION_CONFIRMED" : "LOCATION_UNKNOWN";
}

export type GPSStatus =
  | "idle" // No attempt made yet
  | "detecting" // Currently requesting GPS
  | "ok" // GPS fix acquired
  | "denied" // User denied permission
  | "unavailable" // GPS position unavailable
  | "timeout" // GPS request timed out
  | "imprecise" // Device returned a fix, but not accurate enough for delivery
  | "error" // Generic error
  | "unsupported"; // Browser doesn't support geolocation

const STORAGE_KEY = "localshore_active_delivery_location";
const CONFIRMED_KEY = "localshore_location_confirmed"; // set only when user explicitly picks
const LISTENERS = new Set<() => void>();
const STATE_LISTENERS = new Set<() => void>();

// ─── Location & GPS State ───

let gpsStatus: GPSStatus = "idle";
let gpsErrorMessage: string | null = null;
export interface GPSFix {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}
let bestGPSFix: GPSFix | null = null;

function hasFreshGPSFix(position: GeolocationPosition, now = Date.now()): boolean {
  return (
    !!parseCoordinates(position.coords.latitude, position.coords.longitude) &&
    Number.isFinite(position.coords.accuracy) &&
    position.coords.accuracy >= 0 &&
    Number.isFinite(position.timestamp) &&
    now - position.timestamp <= MAX_LOCATION_AGE_MS &&
    position.timestamp <= now + 1000
  );
}

function hasFreshPreciseGPSFix(position: GeolocationPosition): boolean {
  return hasFreshGPSFix(position) && position.coords.accuracy <= MAX_CUSTOMER_DELIVERY_ACCURACY_M;
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
    // Never reuse a coarse automatic GPS fix on a later visit. A manually
    // confirmed pin is retained because it is an explicit customer choice.
    if (
      stored.isGPS &&
      (typeof stored.accuracy !== "number" || stored.accuracy > MAX_CUSTOMER_DELIVERY_ACCURACY_M)
    ) {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(CONFIRMED_KEY);
      } catch {
        // Ignore storage errors
      }
      return null;
    }
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

export function getGPSStatus() {
  return { status: gpsStatus, errorMessage: gpsErrorMessage, fix: bestGPSFix };
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
    status === "imprecise" ||
    status === "error" ||
    status === "unsupported"
  ) {
    currentState = activeLocation ? "LOCATION_SELECTED" : "LOCATION_ERROR";
  }
  notifyListeners();
}

export function useGPSStatus() {
  const [state, setState] = useState(getGPSStatus);

  useEffect(() => {
    const handleChange = () => {
      setState(getGPSStatus());
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
let activeGPSRequest: Promise<DeliveryLocation> | null = null;

export function setActiveDeliveryLocation(
  loc: DeliveryLocation,
  options: { confirmed?: boolean } = {},
) {
  locationRevision++;
  activeLocation = { ...loc };
  currentState = "LOCATION_SELECTED";
  gpsStatus = "idle";
  gpsErrorMessage = null;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activeLocation));
    if (options.confirmed !== false) {
      localStorage.setItem(CONFIRMED_KEY, "1");
    } else {
      localStorage.removeItem(CONFIRMED_KEY);
    }
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
 * Auto-detect live GPS location on application load.
 * Request once per page load; a failed attempt must not block later reloads.
 */
let autoGPSDone = false;

export function initAutoGPSLocation() {
  if (typeof window === "undefined" || !navigator.geolocation || autoGPSDone) return;

  // Check if the user already has an explicitly chosen location
  if (hasUserChosenLocation() && activeLocation) {
    autoGPSDone = true;
    return;
  }

  const tryDetect = () => {
    autoGPSDone = true;
    detectCurrentGPSLocation({ silent: true }).catch((err) => {
      console.warn("Auto GPS detection skipped:", err);
    });
  };

  // Request immediately so the browser can show its location permission
  // prompt. Permission state checks alone cannot acquire a first-ever fix.
  tryDetect();
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

  // Background auto-detection may already be running when the picker opens.
  // Share it with other background callers, but a user-triggered request must
  // start fresh so changed browser/device sensor settings are respected.
  if (activeGPSRequest && options?.silent !== false) return activeGPSRequest;

  const requestRevision = ++locationRevision;
  const silent = options?.silent ?? false;
  bestGPSFix = null;
  setGPSStatus("detecting");

  if (window.isSecureContext === false) {
    const message = "Location requires a secure connection. Open this page using HTTPS.";
    setGPSStatus("unsupported", message);
    throw new Error(message);
  }

  // A failed address provider must not leave a valid GPS fix waiting indefinitely.
  const withDeadline = async <T>(operation: Promise<T>): Promise<T> => {
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
    if (!hasFreshPreciseGPSFix(position))
      throw new Error("Location is invalid or out of date. Refresh and try again.");
    const { latitude: lat, longitude: lng, accuracy } = position.coords;
    let area = `Device location (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
    let city = "";
    let label = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    let pincode: string | undefined;

    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lng),
        format: "json",
        addressdetails: "1",
        zoom: "18",
      });
      const res = await withDeadline(
        fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
          headers: { "Accept-Language": "en" },
          signal: AbortSignal.timeout(4000),
        }),
      );
      if (res.ok) {
        const data = await withDeadline(res.json());
        if (data && data.display_name) {
          const resolved = resolveNominatimAddress(data);
          // A network/Wi-Fi fix may be valid but cover a wide radius. Do not
          // present its reverse-geocoded result as an exact street address.
          area = accuracy && accuracy > 100 ? `Near ${resolved.area}` : resolved.area;
          city = resolved.city;
          label = accuracy && accuracy > 100 ? `Near ${resolved.label}` : resolved.label;
          pincode = resolved.pincode;
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

    // A user-triggered GPS permission grant is an explicit location choice for
    // discovery. It immediately enables location-aware shop ranking.
    setActiveDeliveryLocation(newLoc, { confirmed: true });
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

  const request = new Promise<DeliveryLocation>((resolve, reject) => {
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
    // Do not leave the picker waiting indefinitely when a desktop browser only
    // provides a coarse Wi-Fi/IP estimate. The map pin remains the precise,
    // user-confirmed fallback.
    const deadline = setTimeout(
      () =>
        fail(
          bestGPSFix ? "imprecise" : "timeout",
          bestGPSFix
            ? `Your device reported an accuracy radius of ${Math.round(bestGPSFix.accuracy)}m. Delivery needs ${MAX_CUSTOMER_DELIVERY_ACCURACY_M}m or better. Enable device location and Wi-Fi, or confirm your entrance on the map.`
            : "Your device did not return a current location. Check browser permission and device location services, then retry or choose your entrance on the map.",
        ),
      15000,
    );
    try {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (finished) return;
          if (requestRevision !== locationRevision) {
            fail("error", "Location selection changed while GPS was resolving.");
            return;
          }
          if (!hasFreshGPSFix(position)) return;
          if (!bestGPSFix || position.coords.accuracy < bestGPSFix.accuracy) {
            bestGPSFix = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
            };
            notifyListeners();
          }
          if (!hasFreshPreciseGPSFix(position)) return;
          cleanup();
          processPosition(position).then(resolve, (error) => {
            if (requestRevision === locationRevision) {
              setGPSStatus(
                "error",
                error instanceof Error ? error.message : "Location detection failed. Please retry.",
              );
            }
            reject(error);
          });
        },
        (error) => {
          if (finished) return;
          if (error.code === 1)
            fail(
              "denied",
              "Allow location access in your browser site settings, then retry. You can also choose a pin on the map.",
            );
          // Watch errors can be transient. Keep accepting improved readings
          // until our overall deadline; permission denial is terminal.
          if (error.code !== 1 && error.code !== 2 && error.code !== 3)
            fail("error", "Location detection failed. Please retry.");
        },
        // High accuracy requests the best available provider; it cannot add
        // GPS hardware or guarantee a particular accuracy on a laptop.
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
      if (finished) navigator.geolocation.clearWatch(watchId);
    } catch (error) {
      fail(
        "error",
        error instanceof Error ? error.message : "Location detection failed. Please retry.",
      );
    }
  });
  activeGPSRequest = request;
  return request.finally(() => {
    if (activeGPSRequest === request) activeGPSRequest = null;
  });
}
