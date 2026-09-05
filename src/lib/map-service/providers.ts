import type { GeocodeResult, RouteResult, MapLocation } from "./types";
import { isValidCoordinate, haversineDistanceKm } from "@/lib/geo";

// Default OpenStreetMap tile provider (No API key required)
const CUSTOM_TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
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

  const baseUrl =
    import.meta.env.VITE_GEOCODING_API_URL || "https://nominatim.openstreetmap.org/search";
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
  endLng: number,
): Promise<RouteResult | null> {
  if (!isValidCoordinate(startLat, startLng) || !isValidCoordinate(endLat, endLng)) return null;
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
        instruction: step.maneuver?.type
          ? `${step.maneuver.type} ${step.name || ""}`.trim()
          : step.name || "Drive ahead",
        distanceMeters: Math.round(step.distance),
        durationSeconds: Math.round(step.duration),
      })),
      status: "success",
    };
  } catch (err) {
    console.warn("OSRM routing fetch failed:", err);
    return null;
  }
}

/**
 * Calculates Haversine distance in kilometers between two lat/lng pairs.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  return haversineDistanceKm(lat1, lon1, lat2, lon2);
}

/**
 * Flexible wrapper for fetchOSRMRoute supporting either 4 numbers or 2 MapLocation objects.
 */
export async function fetchMapRoute(
  startLatOrOrigin: number | { lat: number; lng: number },
  startLngOrDest: number | { lat: number; lng: number },
  endLat?: number,
  endLng?: number,
): Promise<RouteResult | null> {
  if (typeof startLatOrOrigin === "object" && typeof startLngOrDest === "object") {
    return fetchOSRMRoute(
      startLatOrOrigin.lat,
      startLatOrOrigin.lng,
      startLngOrDest.lat,
      startLngOrDest.lng,
    );
  }
  return fetchOSRMRoute(
    startLatOrOrigin as number,
    startLngOrDest as number,
    endLat ?? NaN,
    endLng ?? NaN,
  );
}
