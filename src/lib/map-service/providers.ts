import type { GeocodeResult, RouteResult, MapLocation } from "./types";

// Default OpenStreetMap tile provider (No API key required)
const CUSTOM_TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL ||
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const CUSTOM_STYLE_URL = import.meta.env.VITE_MAP_STYLE_URL;

export function getMapLibreStyle() {
  if (CUSTOM_STYLE_URL) {
    return CUSTOM_STYLE_URL;
  }
  // Standard high-performance OpenStreetMap raster style configuration for MapLibre GL
  return {
    version: 8 as const,
    sources: {
      "osm-tiles": {
        type: "raster" as const,
        tiles: [
          CUSTOM_TILE_URL,
          "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    },
    layers: [
      {
        id: "osm-tiles-layer",
        type: "raster" as const,
        source: "osm-tiles",
        minzoom: 0,
        maxzoom: 19,
      },
    ],
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  };
}

/**
 * Modular Geocoding Service (Uses OpenStreetMap Nominatim with fallback)
 */
export async function geocodeSearch(query: string): Promise<GeocodeResult[]> {
  if (!query || query.trim().length < 2) return [];
  
  const baseUrl = import.meta.env.VITE_GEOCODING_API_URL || "https://nominatim.openstreetmap.org/search";
  const params = new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "1",
    limit: "5",
    countrycodes: "in", // Prioritize India / LocalShore default region
  });

  try {
    const res = await fetch(`${baseUrl}?${params.toString()}`, {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "LocalShore-QuickCommerce/1.0",
      },
    });
    if (!res.ok) throw new Error(`Geocoding HTTP error ${res.status}`);
    const data = await res.json();
    
    return (data || []).map((item: any) => ({
      placeName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      address: item.address,
    }));
  } catch (err) {
    console.warn("Primary Nominatim geocode failed, returning empty:", err);
    return [];
  }
}

/**
 * Modular Routing Service (Uses Open Source Routing Machine - OSRM)
 */
export async function fetchOSRMRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<RouteResult | null> {
  const osrmUrl =
    import.meta.env.VITE_ROUTING_API_URL ||
    `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;

  try {
    const res = await fetch(osrmUrl);
    if (!res.ok) throw new Error(`OSRM HTTP error ${res.status}`);
    const data = await res.json();

    if (!data.routes || data.routes.length === 0) return null;

    const mainRoute = data.routes[0];
    const distanceKm = +(mainRoute.distance / 1000).toFixed(2);
    const durationMins = Math.max(1, Math.round(mainRoute.duration / 60));

    return {
      distanceMeters: Math.round(mainRoute.distance),
      durationSeconds: Math.round(mainRoute.duration),
      distanceKm,
      durationMins,
      geometry: mainRoute.geometry.coordinates, // [lng, lat][]
      steps: (mainRoute.legs?.[0]?.steps || []).map((step: any) => ({
        instruction: step.maneuver?.type ? `${step.maneuver.type} ${step.name || ""}`.trim() : step.name || "Drive ahead",
        distanceMeters: Math.round(step.distance),
        durationSeconds: Math.round(step.duration),
      })),
    };
  } catch (err) {
    console.warn("OSRM routing fetch failed:", err);
    // Straight line mathematical fallback if network fails
    const R = 6371; // Earth radius in KM
    const dLat = ((endLat - startLat) * Math.PI) / 180;
    const dLng = ((endLng - startLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((startLat * Math.PI) / 180) *
        Math.cos((endLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distKm = +(R * c).toFixed(2);

    return {
      distanceMeters: Math.round(distKm * 1000),
      durationSeconds: Math.round((distKm / 25) * 3600),
      distanceKm: distKm,
      durationMins: Math.max(2, Math.round((distKm / 25) * 60)), // Estimate at 25km/h city speed
      geometry: [
        [startLng, startLat],
        [endLng, endLat],
      ],
      steps: [{ instruction: "Proceed towards destination", distanceMeters: distKm * 1000, durationSeconds: (distKm / 25) * 3600 }],
    };
  }
}

/**
 * Calculates Haversine distance in kilometers between two lat/lng pairs.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

/**
 * Flexible wrapper for fetchOSRMRoute supporting either 4 numbers or 2 MapLocation objects.
 */
export async function fetchMapRoute(
  startLatOrOrigin: number | { lat: number; lng: number },
  startLngOrDest: number | { lat: number; lng: number },
  endLat?: number,
  endLng?: number
): Promise<RouteResult | null> {
  if (typeof startLatOrOrigin === "object" && typeof startLngOrDest === "object") {
    return fetchOSRMRoute(
      startLatOrOrigin.lat,
      startLatOrOrigin.lng,
      startLngOrDest.lat,
      startLngOrDest.lng
    );
  }
  return fetchOSRMRoute(
    startLatOrOrigin as number,
    startLngOrDest as number,
    endLat ?? 0,
    endLng ?? 0
  );
}
