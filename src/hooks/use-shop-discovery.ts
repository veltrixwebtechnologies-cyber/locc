import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDeliveryLocation } from "@/lib/location-store";
import { type ProductFilterState } from "@/lib/filter-types";
import { type ShopCardData } from "@/components/shop-card";

// MOCK LOCAL SHOPS CATALOG to complement real DB sellers and ensure rich shop discovery
const MOCK_LOCAL_SHOPS: ShopCardData[] = [
  {
    id: "seller-fashion-1",
    name: "Trendz Fashion & Readymades Hub",
    category: "Fashion & Clothing",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=75",
    rating: 4.8,
    reviewCount: 124,
    distanceKm: 0.8,
    isOpen: true,
    closingTime: "9:30 PM",
    matchingProductCount: 12,
    startingPrice: 699,
    deliveryAvailable: true,
    pickupAvailable: true,
    isVerified: true,
    isCommunityFavorite: true,
    address: "Crosscut Road, Gandhipuram",
    city: "Coimbatore",
  },
  {
    id: "seller-fashion-2",
    name: "Urban Style Menswear & Streetwear",
    category: "Fashion & Clothing",
    imageUrl: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=75",
    rating: 4.7,
    reviewCount: 89,
    distanceKm: 1.5,
    isOpen: true,
    closingTime: "10:00 PM",
    matchingProductCount: 8,
    startingPrice: 799,
    deliveryAvailable: true,
    pickupAvailable: true,
    isVerified: true,
    isCommunityFavorite: false,
    address: "DB Road, RS Puram",
    city: "Coimbatore",
  },
  {
    id: "seller-decor-1",
    name: "Royal Brass & Home Decor Emporium",
    category: "Furniture & Home Decor",
    imageUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=75",
    rating: 4.9,
    reviewCount: 156,
    distanceKm: 1.2,
    isOpen: true,
    closingTime: "9:00 PM",
    matchingProductCount: 32,
    startingPrice: 1299,
    deliveryAvailable: true,
    pickupAvailable: true,
    isVerified: true,
    isCommunityFavorite: true,
    address: "Avinashi Road, Peelamedu",
    city: "Coimbatore",
  },
  {
    id: "seller-decor-2",
    name: "Sri Vinayaga Furniture World",
    category: "Furniture & Home Decor",
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=75",
    rating: 4.8,
    reviewCount: 94,
    distanceKm: 2.4,
    isOpen: true,
    closingTime: "8:30 PM",
    matchingProductCount: 18,
    startingPrice: 2499,
    deliveryAvailable: true,
    pickupAvailable: true,
    isVerified: true,
    isCommunityFavorite: true,
    address: "Mettupalayam Road",
    city: "Coimbatore",
  },
  {
    id: "seller-elec-1",
    name: "Premier Mobile & Tech World",
    category: "Mobile & Accessories",
    imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=75",
    rating: 4.8,
    reviewCount: 210,
    distanceKm: 1.1,
    isOpen: true,
    closingTime: "9:30 PM",
    matchingProductCount: 15,
    startingPrice: 1499,
    deliveryAvailable: true,
    pickupAvailable: true,
    isVerified: true,
    isCommunityFavorite: true,
    address: "100 Feet Road, Tatabad",
    city: "Coimbatore",
  },
  {
    id: "seller-groc-1",
    name: "Roja Organic Supermarket & Kirana",
    category: "Grocery",
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=75",
    rating: 4.9,
    reviewCount: 184,
    distanceKm: 0.5,
    isOpen: true,
    closingTime: "10:00 PM",
    matchingProductCount: 45,
    startingPrice: 40,
    deliveryAvailable: true,
    pickupAvailable: true,
    isVerified: true,
    isCommunityFavorite: true,
    address: "Papampatti Pirivu, Trichy Road",
    city: "Coimbatore",
  },
  {
    id: "seller-bakery-1",
    name: "Roja Bakes & Oven Fresh Sweets",
    category: "Bakery & Sweets",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=75",
    rating: 4.9,
    reviewCount: 310,
    distanceKm: 0.4,
    isOpen: true,
    closingTime: "10:30 PM",
    matchingProductCount: 28,
    startingPrice: 30,
    deliveryAvailable: true,
    pickupAvailable: true,
    isVerified: true,
    isCommunityFavorite: true,
    address: "Papampatti Pirivu",
    city: "Coimbatore",
  },
  {
    id: "seller-food-1",
    name: "Haribhavanam Chettinad Restaurant",
    category: "Food & Restaurants",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=75",
    rating: 4.9,
    reviewCount: 420,
    distanceKm: 0.8,
    isOpen: true,
    closingTime: "11:00 PM",
    matchingProductCount: 22,
    startingPrice: 120,
    deliveryAvailable: true,
    pickupAvailable: true,
    isVerified: true,
    isCommunityFavorite: true,
    address: "Hope College, Peelamedu",
    city: "Coimbatore",
  },
];

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
          .select("id, business_name, business_type, city, status, lat, lng, is_active, accepts_orders")
          .in("status", ["approved", "active"]);

        if (sellersData && sellersData.length > 0) {
          dbShops = sellersData.map((s: any) => {
            let dist: number | undefined = undefined;
            if (s.lat && s.lng && deliveryLoc?.lat && deliveryLoc?.lng) {
              dist = calculateDistanceKm(deliveryLoc.lat, deliveryLoc.lng, s.lat, s.lng);
            } else {
              dist = 1.2;
            }

            return {
              id: s.id,
              name: s.business_name || "Local Shop",
              category: s.business_type || "General Store",
              imageUrl: null,
              rating: 4.8,
              reviewCount: 45,
              distanceKm: dist,
              isOpen: s.accepts_orders !== false,
              closingTime: "9:00 PM",
              matchingProductCount: 0,
              startingPrice: 99,
              deliveryAvailable: true,
              pickupAvailable: true,
              isVerified: s.status === "approved",
              isCommunityFavorite: true,
              city: s.city || "Coimbatore",
            };
          });
        }
      } catch (err) {
        console.warn("Sellers DB query fallback:", err);
      }

      // Merge DB sellers with mock catalog sellers without duplicates
      const shopMap = new Map<string, ShopCardData>();
      for (const s of [...dbShops, ...MOCK_LOCAL_SHOPS]) {
        if (!shopMap.has(s.id)) {
          shopMap.set(s.id, s);
        }
      }
      let list = Array.from(shopMap.values());

      const rawQ = (filterState.query || "").trim().toLowerCase();
      const normCat = (filterState.category || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

      // Category matching
      if (normCat && normCat !== "all" && normCat !== "all-shops") {
        list = list.filter((s) => {
          const catLower = s.category.toLowerCase().replace(/[^a-z0-9]+/g, "");
          return (
            catLower.includes(normCat) ||
            normCat.includes(catLower) ||
            (normCat.includes("fashion") && (catLower.includes("fashion") || catLower.includes("boutique"))) ||
            ((normCat.includes("mobile") || normCat.includes("electronic")) && (catLower.includes("mobile") || catLower.includes("electronic") || catLower.includes("tech"))) ||
            (normCat.includes("grocery") && catLower.includes("grocery")) ||
            (normCat.includes("bakery") && (catLower.includes("bakery") || catLower.includes("sweet"))) ||
            (normCat.includes("food") && (catLower.includes("food") || catLower.includes("restaurant"))) ||
            (normCat.includes("footwear") && catLower.includes("footwear")) ||
            ((normCat.includes("home") || normCat.includes("decor") || normCat.includes("furniture") || normCat.includes("kitchen")) &&
              (catLower.includes("home") || catLower.includes("decor") || catLower.includes("furniture") || catLower.includes("kitchen")))
          );
        });
      }

      // Query matching
      if (rawQ) {
        list = list.filter((s) => {
          const shopText = `${s.name} ${s.category} ${s.address || ""} ${s.city || ""}`.toLowerCase();
          return shopText.includes(rawQ) || rawQ.split(" ").some((t) => t.length > 2 && shopText.includes(t));
        });
      }

      // Filter: Distance
      if (filterState.maxDistanceKm !== undefined && filterState.maxDistanceKm > 0) {
        list = list.filter((s) => (s.distanceKm ?? 0) <= filterState.maxDistanceKm!);
      }

      // Filter: Verified
      if (filterState.verifiedShopOnly) {
        list = list.filter((s) => s.isVerified);
      }

      // Filter: Community Favorite
      if (filterState.localFavoriteOnly) {
        list = list.filter((s) => s.isCommunityFavorite || s.rating >= 4.8);
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

      // Multi-factor Shop Relevance Ranking:
      // 1. Search query match
      // 2. Open status
      // 3. Distance (closer first)
      // 4. Rating & Community Favorite
      list.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        if (rawQ) {
          if (a.name.toLowerCase().includes(rawQ)) scoreA += 50;
          if (b.name.toLowerCase().includes(rawQ)) scoreB += 50;
        }

        if (a.isOpen !== false) scoreA += 20;
        if (b.isOpen !== false) scoreB += 20;

        scoreA += Math.max(0, 30 - (a.distanceKm || 0) * 3);
        scoreB += Math.max(0, 30 - (b.distanceKm || 0) * 3);

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
