import type { DiscoveryShop } from "@/shared/core/shops";
export type { DiscoveryShop } from "@/shared/core/shops";
import { catalogCategoryKey } from "@/lib/shop-categories";
import { CUSTOMER_VISIBILITY_RADIUS_KM } from "@/lib/location-visibility";
import { isValidCoordinate, isFiniteNumber } from "@/lib/geo";
import { runCatalogRpcWithTimeout } from "@/lib/catalog-rpc";

type Rpc = (
  name: string,
  args: Record<string, unknown>,
) => PromiseLike<{
  data: unknown;
  error: { code?: string; message?: string } | null;
}>;

export async function discoverShops(
  rpc: Rpc,
  input: {
    lat: number;
    lng: number;
    category: string | null;
    query: string | null;
    radiusKm: number;
  },
) {
  if (!isValidCoordinate(input.lat, input.lng)) {
    throw new Error("Select a valid delivery location to calculate shop distances");
  }
  const args = {
    p_lat: input.lat,
    p_lng: input.lng,
    p_query: input.query,
    p_category_slug: input.category,
    p_limit: 100,
    p_offset: 0,
  };
  let response = await runCatalogRpcWithTimeout(
    rpc("discover_nearby_shops", {
      ...args,
      p_radius_km: input.radiusKm,
      p_min_results: 3,
    }),
  );
  // An unapplied migration must not hide the existing catalog. Only fall back
  // for a missing RPC; connectivity/auth/database failures remain errors.
  const legacyMode = response.error?.code === "PGRST202";
  if (legacyMode)
    response = await runCatalogRpcWithTimeout(rpc("get_customer_visible_shops", args));
  if (response.error) throw new Error(response.error.message || "Unable to load nearby shops");
  if (!Array.isArray(response.data)) throw new Error("Invalid shop discovery response");
  const effectiveRadiusKm = legacyMode
    ? Math.min(input.radiusKm, CUSTOMER_VISIBILITY_RADIUS_KM)
    : input.radiusKm;
  const shops = (response.data as DiscoveryShop[])
    .filter((shop) => {
      // Number(null) and Number("") are zero, not a measured distance.
      if (!isFiniteNumber(shop.distance_km) || !isValidCoordinate(shop.lat, shop.lng)) return false;
      const distance = Number(shop.distance_km);
      if (!Number.isFinite(distance) || distance < 0) return false;
      if (distance > effectiveRadiusKm && (legacyMode || shop.is_fallback !== true)) return false;
      return (
        !input.category ||
        catalogCategoryKey(shop.business_type || shop.category) === input.category
      );
    })
    .map((shop) => ({
      ...shop,
      distance_km: Number(shop.distance_km),
      is_fallback: !legacyMode && shop.is_fallback === true,
    }))
    .sort((a, b) => a.distance_km - b.distance_km);
  return { shops, effectiveRadiusKm, legacyMode };
}
