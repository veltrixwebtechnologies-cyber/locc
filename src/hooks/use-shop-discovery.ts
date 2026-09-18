import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDeliveryLocation } from "@/lib/location-store";
import { type ProductFilterState } from "@/lib/filter-types";
import { type ShopCardData } from "@/components/shop-card";
import { stores, type Store } from "@/lib/mock-data";
import { isStoreInCategory } from "@/lib/shop-categories";

export function useShopDiscovery(filterState: ProductFilterState) {
  const [deliveryLoc] = useDeliveryLocation();

  const queryKey = [
    "shops-discovery-v2",
    filterState.query,
    filterState.category,
    filterState.maxDistanceKm,
    filterState.minRating,
    filterState.verifiedShopOnly,
    filterState.localFavoriteOnly,
    filterState.openNowOnly,
    filterState.deliveryAvailableOnly,
    filterState.pickupAvailableOnly,
    deliveryLoc?.lat,
    deliveryLoc?.lng,
  ];

  return useQuery<{ shops: ShopCardData[]; total: number }>({
    queryKey,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: false,
    queryFn: async () => {
      let dbShops: ShopCardData[] = [];

      try {
        const { data: sellersData } = await (supabase as any)
          .from("sellers")
          .select(
            "id, business_name, business_type, city, status, lat, lng, is_active, accepts_orders",
          )
          .in("status", ["approved", "active"]);

        if (sellersData && sellersData.length > 0) {
          dbShops = sellersData.map((s: any) => {
            let dist: number | undefined = undefined;
            if (s.lat && s.lng && deliveryLoc?.lat && deliveryLoc?.lng) {
              dist = calculateDistanceKm(deliveryLoc.lat, deliveryLoc.lng, s.lat, s.lng);
            }

            return {
              id: s.id,
              name: s.business_name || "Local Shop",
              category: s.business_type || "General Store",
              imageUrl: null,
              // Do not invent trust or pricing signals when the seller row does
              // not contain them. Undefined distance must not pass a radius filter.
              rating: 0,
              distanceKm: dist,
              isOpen: s.accepts_orders !== false,
              matchingProductCount: 0,
              isVerified: s.status === "approved",
              city: s.city || "",
            };
          });
        }
      } catch (err) {
        console.warn("Sellers DB query notice:", err);
      }

      const hasConfirmedLocation =
        typeof deliveryLoc?.lat === "number" && typeof deliveryLoc?.lng === "number";
      const catalogShops: ShopCardData[] = stores.map((store: Store) => ({
        id: store.id,
        name: store.name,
        category: store.category,
        imageUrl: store.imageUrl,
        rating: store.rating,
        distanceKm: hasConfirmedLocation
          ? calculateDistanceKm(deliveryLoc!.lat, deliveryLoc!.lng, store.lat, store.lng)
          : undefined,
        isOpen: store.isOpen,
        address: store.address,
        city: "Coimbatore",
        isVerified: true,
      }));

      // Live approved sellers take precedence by id; the local catalog keeps
      // category/search pages useful when the database has no matching rows.
      const shopsById = new Map<string, ShopCardData>();
      catalogShops.forEach((shop) => shopsById.set(shop.id, shop));
      dbShops.forEach((shop) => shopsById.set(shop.id, shop));
      let list = Array.from(shopsById.values());

      const rawQ = (filterState.query || "").trim().toLowerCase();
      const normCat = (filterState.category || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

      // Category matching
      if (normCat && normCat !== "all" && normCat !== "all-shops") {
        list = list.filter((s) => {
          const catLower = s.category.toLowerCase().replace(/[^a-z0-9]+/g, "");
          return (
            catLower.includes(normCat) ||
            normCat.includes(catLower) ||
            (normCat.includes("fashion") &&
              (catLower.includes("fashion") || catLower.includes("boutique"))) ||
            ((normCat.includes("mobile") || normCat.includes("electronic")) &&
              (catLower.includes("mobile") ||
                catLower.includes("electronic") ||
                catLower.includes("tech"))) ||
            (normCat.includes("grocery") && catLower.includes("grocery")) ||
            (normCat.includes("bakery") &&
              (catLower.includes("bakery") || catLower.includes("sweet"))) ||
            (normCat.includes("food") &&
              (catLower.includes("food") || catLower.includes("restaurant"))) ||
            (normCat.includes("footwear") && catLower.includes("footwear")) ||
            ((normCat.includes("home") ||
              normCat.includes("decor") ||
              normCat.includes("furniture") ||
              normCat.includes("kitchen")) &&
              (catLower.includes("home") ||
                catLower.includes("decor") ||
                catLower.includes("furniture") ||
                catLower.includes("kitchen")))
          );
        });
      }

      // Query matching
      if (rawQ) {
        list = list.filter((s) => {
          const shopText =
            `${s.name} ${s.category} ${s.address || ""} ${s.city || ""}`.toLowerCase();
          return (
            shopText.includes(rawQ) ||
            rawQ.split(" ").some((t) => t.length > 2 && shopText.includes(t))
          );
        });
      }

      // Filter: Distance
      if (
        hasConfirmedLocation &&
        filterState.maxDistanceKm !== undefined &&
        filterState.maxDistanceKm > 0
      ) {
        list = list.filter(
          (s) => s.distanceKm !== undefined && s.distanceKm <= filterState.maxDistanceKm!,
        );
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

      // Unknown-location results are general recommendations. Confirmed
      // results use distance buckets first, then availability/relevance.
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
          const bucketA =
            a.distanceKm === undefined ? 3 : a.distanceKm <= 2 ? 0 : a.distanceKm <= 5 ? 1 : 2;
          const bucketB =
            b.distanceKm === undefined ? 3 : b.distanceKm <= 2 ? 0 : b.distanceKm <= 5 ? 1 : 2;
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

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
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
