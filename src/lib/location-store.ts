/**
 * LocalShore Global Delivery Location Store
 * Reactive delivery location management supporting GPS Geolocation, Nominatim Reverse Geocoding,
 * and pre-set Coimbatore hubs.
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
}

export const PRESET_LOCATIONS: DeliveryLocation[] = [
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
const LISTENERS = new Set<() => void>();

function getInitialLocation(): DeliveryLocation {
  if (typeof window === "undefined") return PRESET_LOCATIONS[0];
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
  return PRESET_LOCATIONS[0];
}

let activeLocation: DeliveryLocation = getInitialLocation();

function notifyListeners() {
  LISTENERS.forEach((listener) => listener());
}

export function getActiveDeliveryLocation(): DeliveryLocation {
  return activeLocation;
}

export function setActiveDeliveryLocation(loc: DeliveryLocation) {
  activeLocation = { ...loc };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activeLocation));
  } catch {
    // Ignore storage errors
  }
  notifyListeners();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("localshore_location_change", { detail: activeLocation }));
  }
}

/**
 * Custom React Hook to subscribe to active delivery location updates
 */
export function useDeliveryLocation(): [DeliveryLocation, (loc: DeliveryLocation) => void] {
  const [loc, setLoc] = useState<DeliveryLocation>(() => ({ ...activeLocation }));

  useEffect(() => {
    const handleChange = () => {
      setLoc({ ...activeLocation });
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
 * Auto-detect live GPS location on application load if permissions are granted or on initial session
 */
let autoGPSDone = false;

export function initAutoGPSLocation() {
  if (typeof window === "undefined" || !navigator.geolocation || autoGPSDone) return;

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
 * Detect Current GPS Location using Browser Geolocation API
 */
export async function detectCurrentGPSLocation(options?: { silent?: boolean }): Promise<DeliveryLocation> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    throw new Error("Geolocation is not supported by your browser.");
  }

  const silent = options?.silent ?? false;

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        let area = `GPS Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
        let city = "Coimbatore, TN";
        let label = `Near ${lat.toFixed(4)}, ${lng.toFixed(4)}, Coimbatore, TN`;

        try {
          // Direct client reverse geocode attempt with Nominatim
          const params = new URLSearchParams({
            lat: String(lat),
            lon: String(lng),
            format: "json",
            addressdetails: "1",
            zoom: "18",
          });
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
            {
              headers: { "Accept-Language": "en" },
            },
          );

          if (res.ok) {
            const data = await res.json();
            if (data && data.address) {
              const a = data.address;
              const locality =
                a.suburb ||
                a.neighbourhood ||
                a.residential ||
                a.village ||
                a.road ||
                a.town ||
                a.city_district ||
                "Live GPS Location";
              const dist = a.city || a.town || a.county || a.state_district || "Coimbatore";
              const st = a.state || "TN";

              area = locality;
              city = `${dist}, ${st}`;
              label = `${locality}, ${city}`;
            } else if (data && data.display_name) {
              const parts = data.display_name.split(",").map((s: string) => s.trim());
              area = parts[0] || "Live GPS Location";
              city = parts.slice(1, 3).join(", ") || "Coimbatore, TN";
              label = data.display_name;
            }
          } else {
            // Server function fallback
            const result = await reverseGeocode({ data: { lat, lng } });
            if (result && result.area) {
              area = result.area;
              city = result.city || city;
              label = result.address || label;
            }
          }
        } catch (err) {
          console.warn("Geolocation reverse geocode fallback:", err);
        }

        const newLoc: DeliveryLocation = {
          id: `gps-${Date.now()}`,
          label,
          area,
          city,
          lat,
          lng,
          isGPS: true,
        };

        setActiveDeliveryLocation(newLoc);
        if (!silent) {
          toast.success("Live Location Set", {
            id: "live-location-toast",
            description: `${area}, ${city}`,
          });
        }
        resolve(newLoc);
      },
      (error) => {
        let msg = "Could not fetch current GPS location.";
        if (error.code === error.PERMISSION_DENIED) {
          msg =
            "Location access denied. Please allow location permissions in your browser settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "GPS signal unavailable. Please select your area manually.";
        } else if (error.code === error.TIMEOUT) {
          msg = "GPS request timed out. Please try again or select a location hub.";
        }
        if (!silent) {
          toast.error("Geolocation Error", { id: "live-location-toast-err", description: msg });
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      },
    );
  });
}
