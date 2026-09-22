import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDeliveryLocation } from "@/lib/location-store";
import { type ProductFilterState } from "@/lib/filter-types";
import { type ShopCardData } from "@/components/shop-card";
import { hasConfirmedCoordinates, CUSTOMER_VISIBILITY_RADIUS_KM } from "@/lib/location-visibility";
import { catalogCategoryKey, isStoreInCategory } from "@/lib/shop-categories";

export function useShopDiscovery(filterState: ProductFilterState) {
  const [deliveryLoc] = useDeliveryLocation();

  const queryKey = [
    "shops-discovery-v3",
    filterState.query,
    filterState.category,
    filterState.maxDistanceKm,
    filterState.minRating,
    filterState.verifiedShopOnly,
    filterState.localFavoriteOnly,
    filterState.openNowOnly,
    filterState.deliveryAvailableOnly,
    filterState.pickupAvailableOnly,
    CUSTOMER_VISIBILITY_RADIUS_KM,
    deliveryLoc?.lat,
    deliveryLoc?.lng,
  ];

  return useQuery<{ shops: ShopCardData[]; total: number }>({
    queryKey,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: false,
    queryFn: async () => {
      if (!hasConfirmedCoordinates(deliveryLoc)) return { shops: [], total: 0 };
      const { data, error } = await (supabase as any).rpc("get_customer_visible_shops", {
        p_lat: deliveryLoc.lat,
        p_lng: deliveryLoc.lng,
        p_query: filterState.query || null,
        p_category_slug: catalogCategoryKey(filterState.category),
        p_limit: 100,
        p_offset: 0,
      });
      if (error) throw error;
      let list: ShopCardData[] = (data ?? []).map((s: any) => ({
        id: s.id,
        name: s.shop_name || "Local Shop",
        category: s.category || s.business_type || "General Store",
        imageUrl: null,
        rating: 0,
        distanceKm: Number(s.distance_km),
        isOpen: s.is_open !== false,
        matchingProductCount: 0,
        isVerified: s.is_verified === true,
        city: s.city || "",
        address: s.address_line1 || undefined,
      }));

      const rawQ = (filterState.query || "").trim().toLowerCase();
      const hasConfirmedLocation = true;

      // The server has already applied the mandatory 5 km radius. User filters
      // can only narrow the returned set; they can never widen it. Apply the
      // selected category here as well so a broad RPC response cannot leak
      // unrelated shops into a category-specific listing.
      list = list.filter((s) => (s.distanceKm ?? Infinity) <= CUSTOMER_VISIBILITY_RADIUS_KM);

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

      // Confirmed results use distance buckets first, then availability/relevance.
      list.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        if (rawQ) {
          if (a.name.toLowerCase().includes(rawQ)) scoreA += 50;
          if (b.name.toLowerCase().includes(rawQ)) scoreB += 50;
        }

        if (a.isOpen !== false) scoreA += 20;
        if (b.isOpen !== false) scoreB += 20;

        if (hasConfirmedLocation) {
          const bucketA = a.distanceKm === undefined ? 3 : a.distanceKm <= 2 ? 0 : 1;
          const bucketB = b.distanceKm === undefined ? 3 : b.distanceKm <= 2 ? 0 : 1;
          if (bucketA !== bucketB) return bucketA - bucketB;
          scoreA += Math.max(0, 30 - (a.distanceKm ?? 30) * 3);
          scoreB += Math.max(0, 30 - (b.distanceKm ?? 30) * 3);
        }

        scoreA += (a.rating || 4.5) * 5;
        scoreB += (b.rating || 4.5) * 5;

        if (a.isVerified) scoreA += 10;
        if (b.isVerified) scoreB += 10;

        if (a.isCommunityFavorite) scoreA += 10;
        if (b.isCommunityFavorite) scoreB += 10;

        return scoreB - scoreA;
      });

      return { shops: list, total: list.length };
    },
  });
}
