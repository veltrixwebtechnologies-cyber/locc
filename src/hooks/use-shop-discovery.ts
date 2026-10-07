import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDeliveryLocation } from "@/lib/location-store";
import { type ProductFilterState } from "@/lib/filter-types";
import { type ShopCardData } from "@/components/shop-card";
import {
  hasConfirmedCoordinates,
  DEFAULT_SHOP_DISCOVERY_RADIUS_KM,
} from "@/lib/location-visibility";
import { catalogCategoryKey, isStoreInCategory } from "@/lib/shop-categories";
import { discoverShops } from "@/lib/shop-discovery";
import { fetchNearbyImportedShops, toImportedShopCard, type ImportedShopRow } from "@/lib/imported-shops";
import { shouldRetryCatalogQuery } from "@/lib/catalog-rpc";

export function useShopDiscovery(filterState: ProductFilterState) {
  const [deliveryLoc] = useDeliveryLocation();
  const radiusKm = filterState.maxDistanceKm ?? DEFAULT_SHOP_DISCOVERY_RADIUS_KM;

  const queryKey = [
    "shops-discovery-v4",
    filterState.query,
    filterState.category,
    filterState.maxDistanceKm,
    filterState.minRating,
    filterState.verifiedShopOnly,
    filterState.localFavoriteOnly,
    filterState.openNowOnly,
    filterState.deliveryAvailableOnly,
    filterState.pickupAvailableOnly,
    radiusKm,
    deliveryLoc?.lat,
    deliveryLoc?.lng,
  ];

  return useQuery<{
    shops: ShopCardData[];
    total: number;
    expanded: boolean;
    fallbackZoneNames: string[];
    primaryZoneName: string | null;
    effectiveRadiusKm: number;
    legacyMode: boolean;
  }>({
    queryKey,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: shouldRetryCatalogQuery,
    retryDelay: (attempt) => Math.min(750 * 2 ** attempt, 3_000),
    queryFn: async () => {
      if (!deliveryLoc || !hasConfirmedCoordinates(deliveryLoc)) {
        return { shops: [], total: 0, expanded: false, fallbackZoneNames: [], primaryZoneName: null, effectiveRadiusKm: radiusKm, legacyMode: false };
      }
      const [discovery, visibleProductsResult, importedResult] = await Promise.all([
        discoverShops((name, args) => (supabase as any).rpc(name, args), {
          lat: deliveryLoc.lat, lng: deliveryLoc.lng,
          query: filterState.query || null,
          category: catalogCategoryKey(filterState.category), radiusKm,
        }),
        // Shop discovery returns shops only. Read the existing customer-visible
        // product feed once and join by seller ID so cards show real inventory,
        // rather than claiming a catalog is listed when the card has no items.
        (supabase as any).rpc("get_customer_visible_products", {
          p_lat: deliveryLoc.lat,
          p_lng: deliveryLoc.lng,
          p_query: null,
          p_category_slug: catalogCategoryKey(filterState.category),
          p_limit: 200,
          p_offset: 0,
        }),
        fetchNearbyImportedShops((name, args) => (supabase as any).rpc(name, args), {
          lat: deliveryLoc.lat, lng: deliveryLoc.lng, radiusKm,
          category: catalogCategoryKey(filterState.category), query: filterState.query || null,
        }).then((data) => ({ data, error: null })).catch((error: unknown) => ({
          data: [], error: { code: "IMPORTED_DISCOVERY_FAILED", message: error instanceof Error ? error.message : String(error) },
        })),
      ]);
      const data = discovery.shops;
      const productsBySeller = new Map<string, Array<{ name: string; price: number }>>();
      if (visibleProductsResult.error) {
        console.warn("Could not load shop-card product highlights:", visibleProductsResult.error);
      } else if (Array.isArray(visibleProductsResult.data)) {
        const discoveredShopIds = new Set(data.map((shop) => shop.id));
        for (const product of visibleProductsResult.data as any[]) {
          const sellerId = String(product.seller_id || "");
          if (!discoveredShopIds.has(sellerId) || !product.name) continue;
          const productCategory = catalogCategoryKey(product.category);
          const seller = data.find((shop) => shop.id === sellerId);
          const sellerCategory = catalogCategoryKey(seller?.business_type || seller?.category);
          if (sellerCategory && productCategory !== sellerCategory) continue;
          const rows = productsBySeller.get(sellerId) ?? [];
          rows.push({ name: String(product.name), price: Number(product.selling_price ?? product.price) });
          productsBySeller.set(sellerId, rows);
        }
      }
      let list: ShopCardData[] = (data ?? []).map((s: any) => ({
        id: s.id,
        name: s.shop_name || "Local Shop",
        // The RPC has already filtered by the requested category. Preserve
        // that canonical key for the UI instead of trusting a representative
        // product category returned for a multi-category shop.
        category:
          catalogCategoryKey(filterState.category) ||
          s.category ||
          s.business_type ||
          "General Store",
        imageUrl: null,
        rating: 0,
        distanceKm: Number(s.distance_km),
        isOpen: s.is_open !== false,
        featuredProductName: productsBySeller.get(s.id)?.[0]?.name,
        startingPrice: productsBySeller.get(s.id)
          ?.map((product) => product.price)
          .filter((price) => Number.isFinite(price) && price > 0)
          .sort((a, b) => a - b)[0],
        isVerified: s.is_verified === true,
        city: s.city || "",
        address: s.address_line1 || undefined,
        isFallback: s.is_fallback === true,
        fallbackZoneName: s.fallback_zone_name || s.zone_name || undefined,
      }));

      if (importedResult.error) {
        // Keep existing seller discovery available while a new schema migration
        // is being applied; an absent imported-shops RPC is not a fatal catalog error.
        if (importedResult.error.code !== "PGRST202") {
          console.warn("Could not load imported public shop listings:", importedResult.error);
        }
      } else if (Array.isArray(importedResult.data)) {
        list.push(...(importedResult.data as ImportedShopRow[])
          .map(toImportedShopCard)
          .filter((shop): shop is ShopCardData => shop !== null));
      }

      // The server applies the selected radius and uses adjacent zones only
      // when fewer than three matching shops are inside it. Recheck the radius
      // for primary results, while preserving explicitly marked fallbacks.
      list = list.filter(
        (s) => s.isFallback === true || (s.distanceKm ?? Infinity) <= radiusKm,
      );

      if (
        filterState.category &&
        filterState.category !== "all" &&
        filterState.category !== "all-shops"
      ) {
        list = list.filter((s) => isStoreInCategory(s.category, filterState.category!));
      }

      // Filter: Verified
      if (filterState.verifiedShopOnly) {
        list = list.filter((s) => s.isImported !== true && s.isVerified);
      }

      // Filter: Community Favorite
      if (filterState.localFavoriteOnly) {
        list = list.filter((s) => s.isCommunityFavorite === true);
      }

      // Filter: Open Now
      if (filterState.openNowOnly) {
        list = list.filter((s) => s.isImported !== true && s.isOpen !== false);
      }

      // Filter: Delivery Available
      if (filterState.deliveryAvailableOnly) {
        list = list.filter((s) => s.isImported !== true && s.deliveryAvailable !== false);
      }

      // Filter: Pickup Available
      if (filterState.pickupAvailableOnly) {
        list = list.filter((s) => s.isImported !== true && s.pickupAvailable !== false);
      }

      // Filter: Rating
      if (filterState.minRating !== undefined && filterState.minRating > 0) {
        list = list.filter((s) => s.rating >= filterState.minRating!);
      }

      list.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
      const fallbackZoneNames = Array.from(
        new Set(list.filter((shop) => shop.isFallback).map((shop) => shop.fallbackZoneName).filter(Boolean)),
      ) as string[];
      return {
        shops: list,
        total: list.length,
        expanded: fallbackZoneNames.length > 0,
        fallbackZoneNames,
        primaryZoneName: (data ?? []).find((row: any) => row.primary_zone_name)?.primary_zone_name ?? null,
        effectiveRadiusKm: discovery.effectiveRadiusKm,
        legacyMode: discovery.legacyMode,
      };
    },
  });
}
