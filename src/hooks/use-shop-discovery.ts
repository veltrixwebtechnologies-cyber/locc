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
    retry: false,
    queryFn: async () => {
      if (!deliveryLoc || !hasConfirmedCoordinates(deliveryLoc)) {
        return { shops: [], total: 0, expanded: false, fallbackZoneNames: [], primaryZoneName: null, effectiveRadiusKm: radiusKm, legacyMode: false };
      }
      const discovery = await discoverShops((name, args) => (supabase as any).rpc(name, args), {
        lat: deliveryLoc.lat, lng: deliveryLoc.lng,
        query: filterState.query || null,
        category: catalogCategoryKey(filterState.category), radiusKm,
      });
      const data = discovery.shops;
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
        matchingProductCount: 0,
        isVerified: s.is_verified === true,
        city: s.city || "",
        address: s.address_line1 || undefined,
        isFallback: s.is_fallback === true,
        fallbackZoneName: s.fallback_zone_name || s.zone_name || undefined,
      }));

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
        list = list.filter((s) => s.isVerified);
      }

      // Filter: Community Favorite
      if (filterState.localFavoriteOnly) {
        list = list.filter((s) => s.isCommunityFavorite === true);
      }

      // Filter: Open Now
      if (filterState.openNowOnly) {
        list = list.filter((s) => s.isOpen !== false);
      }

      // Filter: Delivery Available
      if (filterState.deliveryAvailableOnly) {
        list = list.filter((s) => s.deliveryAvailable !== false);
      }

      // Filter: Pickup Available
      if (filterState.pickupAvailableOnly) {
        list = list.filter((s) => s.pickupAvailable !== false);
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
