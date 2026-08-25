import type { GeocodeResult, RouteResult, MapLocation } from "./types";

// Default CORS-friendly tile provider (OpenStreetMap data via CARTO / Esri)
const CUSTOM_TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL ||
  "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png";
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
          "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
          "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
          "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
          "https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
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
        "User-Agent": "LocalShore-Map/1.0 (https://localshore.app)",
        "Accept-Language": "en",
      },
    });

    if (!res.ok) return [];

    const data = (await res.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
      boundingbox?: string[];
    }>;

    return data.map((item) => ({
      placeName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      bbox: item.boundingbox
        ? [
            parseFloat(item.boundingbox[0]),
            parseFloat(item.boundingbox[2]),
            parseFloat(item.boundingbox[1]),
            parseFloat(item.boundingbox[3]),
          ]
        : undefined,
    }));
  } catch (err) {
    console.warn("[MapService] Geocoding lookup failed", err);
    return [];
  }
}

/**
 * Modular Routing Service (Uses Open Source Routing Machine OSRM with fallback)
 */
export async function fetchMapRoute(
  origin: MapLocation,
  destination: MapLocation
): Promise<RouteResult | null> {
  const baseUrl =
    import.meta.env.VITE_ROUTING_API_URL ||
    "https://router.project-osrm.org/route/v1/driving";

  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `${baseUrl}/${coords}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM status ${res.status}`);

    const data = await res.json();
    if (!data.routes || data.routes.length === 0) return null;

    const route = data.routes[0];
    return {
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      geometry: route.geometry.coordinates as [number, number][],
    };
  } catch (err) {
    console.warn("[MapService] Routing calculation failed, using direct line fallback", err);
    // Straight line fallback if OSRM service is rate limited
    return {
      distanceMeters: calculateHaversineDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng) * 1000,
      durationSeconds: Math.round((calculateHaversineDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng) / 25) * 3600),
      geometry: [
        [origin.lng, origin.lat],
        [destination.lng, destination.lat],
      ],
    };
  }
}

/**
 * Utility: Haversine distance in kilometers
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
