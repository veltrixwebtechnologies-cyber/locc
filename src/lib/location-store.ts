import { usableGPS } from "./coordinates";
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
      if (parsed && typeof parsed.lat === "number" && typeof parsed.lng === "number") {
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

export function setActiveDeliveryLocation(loc: DeliveryLocation) {
  locationRevision++;
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
  locationRevision++;
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

/**
 * Detect Current GPS Location using Browser Geolocation API with two-stage fallback.
 * Updates both the GPS detection state AND (on success) the active delivery location.
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

  const processPosition = async (position: GeolocationPosition): Promise<DeliveryLocation> => {
    if (!usableGPS(position))
      throw new Error(
        "Location is approximate or stale. Enable precise location or choose your destination manually.",
      );
    const { latitude: lat, longitude: lng, accuracy } = position.coords;
    let area = `GPS Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
    let city = "";
    let label = `Near ${lat.toFixed(4)}, ${lng.toFixed(4)}, Coimbatore, TN`;
    let pincode: string | undefined;

    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lng),
        format: "json",
        addressdetails: "1",
        zoom: "16",
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
        headers: { "Accept-Language": "en" },
      });
      if (res.ok) {
        const data = await res.json();
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
        // Fallback attempt: server function reverse geocode
        const result = await reverseGeocode({ data: { lat, lng } });
        if (result && result.area) {
          area = result.area;
          city = result.city || city;
          label = result.address || label;
        }
      }
    } catch (err) {
      try {
        const result = await reverseGeocode({ data: { lat, lng } });
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
          ? `${area}, ${city} · Accuracy ±${Math.round(accuracy)}m — move to an open area for better precision`
          : `${area}, ${city}`;
      toast.success("Live Location Acquired", {
        id: "live-location-toast",
        description: toastDesc,
      });
    }
    return newLoc;
  };

  return new Promise((resolve, reject) => {
    // Try High-Accuracy GPS first (ideal for mobile devices)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const loc = await processPosition(pos);
          resolve(loc);
        } catch (err) {
          setGPSStatus("error", "Failed to process GPS location.");
          reject(err);
        }
      },
      (firstErr) => {
        // High accuracy failed or timed out — retry with low accuracy (WiFi / IP / coarse desktop fix)
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const loc = await processPosition(pos);
              resolve(loc);
            } catch (err) {
              setGPSStatus("error", "Failed to process GPS location.");
              reject(err);
            }
          },
          (secondErr) => {
            let msg = "Could not fetch current GPS location.";
            let status: GPSStatus = "error";
            if (
              secondErr.code === secondErr.PERMISSION_DENIED ||
              firstErr.code === firstErr.PERMISSION_DENIED
            ) {
              msg =
                "Location access denied. Please enable location permission in browser site settings.";
              status = "denied";
            } else if (secondErr.code === secondErr.POSITION_UNAVAILABLE) {
              msg = "GPS signal unavailable. Please select your location manually.";
              status = "unavailable";
            } else if (secondErr.code === secondErr.TIMEOUT) {
              msg = "GPS request timed out. Please select your area from the list.";
              status = "timeout";
            }
            setGPSStatus(status, msg);
            if (!silent) {
              toast.error("Geolocation Error", { id: "live-location-toast-err", description: msg });
            }
            reject(new Error(msg));
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          },
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 0,
      },
    );
  });
}
