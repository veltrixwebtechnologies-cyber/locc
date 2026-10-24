import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { resolveNominatimAddress } from "./location-address";

const geocodeInput = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type GeocodeResult = {
  address: string;
  area?: string;
  city?: string;
  pincode?: string;
};

let lastNominatimRequestAt = 0;
const geocodeCache = new Map<string, { result: GeocodeResult; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 2; // 2-hour cache for high-precision doorstep coordinates

// Reverse geocoding via OpenStreetMap Nominatim (server-side proxied).
// Nominatim usage policy: identify with a User-Agent, rate limit, and cache results.
export const reverseGeocode = createServerFn({ method: "GET" })
  .validator((data: unknown) => geocodeInput.parse(data))
  .handler(async ({ data }): Promise<GeocodeResult> => {
    // Round to 4 decimal places (~11 meters) for doorstep spatial resolution
    const cacheKey = `${data.lat.toFixed(4)},${data.lng.toFixed(4)}`;
    const cached = geocodeCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.result;
    }

    const elapsed = now - lastNominatimRequestAt;
    if (elapsed < 1000) {
      await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
    }
    lastNominatimRequestAt = Date.now();

    const params = new URLSearchParams({
      lat: String(data.lat),
      lon: String(data.lng),
      format: "json",
      addressdetails: "1",
      zoom: "18",
    });

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
        {
          headers: {
            "User-Agent": "LocalShore/1.0 (https://shop-local-delivery.lovable.app)",
            "Accept-Language": "en",
          },
          signal: AbortSignal.timeout(4000),
        },
      );

      if (response.ok) {
        const payload = (await response.json()) as {
          display_name?: string;
          address?: Record<string, string>;
          error?: string;
        };

        if (payload && !payload.error) {
          const resolved = resolveNominatimAddress(payload);
          const result: GeocodeResult = {
            address: resolved.label,
            area: resolved.area,
            city: resolved.city,
            pincode: resolved.pincode,
          };
          geocodeCache.set(cacheKey, { result, timestamp: now });
          return result;
        }
      }
    } catch (err) {
      console.warn("[geocoding] Reverse geocode request notice:", err);
    }

    const fallbackResult: GeocodeResult = {
      address: `Near ${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`,
      area: `GPS (${data.lat.toFixed(3)}, ${data.lng.toFixed(3)})`,
      city: "",
    };
    return fallbackResult;
  });
