import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const geocodeInput = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

type GeocodeResult = {
  address: string;
};

let lastNominatimRequestAt = 0;

// Reverse geocoding via OpenStreetMap Nominatim (no API key required).
// Nominatim usage policy: identify with a User-Agent and keep volume modest.
export const reverseGeocode = createServerFn({ method: "GET" })
  .validator((data: unknown) => geocodeInput.parse(data))
  .handler(async ({ data }): Promise<GeocodeResult> => {
    const elapsed = Date.now() - lastNominatimRequestAt;
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
        },
      );

      if (response.ok) {
        const payload = (await response.json()) as {
          display_name?: string;
          error?: string;
        };

        if (payload.display_name && !payload.error) {
          return { address: payload.display_name };
        }
      }
    } catch {
      // Fallback below
    }

    return { address: `Near ${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}` };
  });
