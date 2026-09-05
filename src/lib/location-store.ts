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
  area: string;  // Locality (e.g. "Pappampatti Pirivu")
  city: string;  // City & State (e.g. "Coimbatore, TN")
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
    lat: 11.0168,
    lng: 76.9558,
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
    lng: 77.0180,
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
  activeLocation = loc;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  } catch {
    // Ignore storage errors
  }
  notifyListeners();
}

/**
 * Custom React Hook to subscribe to active delivery location updates
 */
export function useDeliveryLocation(): [DeliveryLocation, (loc: DeliveryLocation) => void] {
  const [loc, setLoc] = useState<DeliveryLocation>(activeLocation);

  useEffect(() => {
    const handleChange = () => setLoc(activeLocation);
    LISTENERS.add(handleChange);
    return () => {
      LISTENERS.delete(handleChange);
    };
  }, []);

  return [loc, setActiveDeliveryLocation];
}

/**
 * Detect Current GPS Location using Browser Geolocation API
 */
export async function detectCurrentGPSLocation(): Promise<DeliveryLocation> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    throw new Error("Geolocation is not supported by your browser.");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        let area = "Current Location";
        let city = "Coimbatore, TN";
        let label = `Near ${lat.toFixed(4)}, ${lng.toFixed(4)}, Coimbatore`;

        try {
          // Attempt reverse geocoding
          const result = await reverseGeocode({ data: { lat, lng } });
          if (result && result.address) {
            const parts = result.address.split(",").map((s) => s.trim());
            area = parts[0] || parts[1] || "Current Location";
            city = parts.slice(2, 4).join(", ") || "Coimbatore, TN";
            label = `${area}, ${city}`;
          }
        } catch {
          // Fallback location formatting
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
        toast.success("Location set to Current GPS Position", {
          description: label,
        });
        resolve(newLoc);
      },
      (error) => {
        let msg = "Could not fetch current GPS location.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location access denied. Please allow location permissions in your browser.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "GPS signal unavailable. Please select a hub manually.";
        } else if (error.code === error.TIMEOUT) {
          msg = "GPS request timed out. Please try again.";
        }
        toast.error("Geolocation Error", { description: msg });
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  });
}
