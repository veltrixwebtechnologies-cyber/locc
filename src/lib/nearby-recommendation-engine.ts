import { stores, productsByStore, type Store, type Product } from "./mock-data";
import { haversineDistanceKm, isValidCoordinate } from "./geo";

export interface NearbyStoreRecommendation {
  id: string;
  name: string;
  category: string;
  address: string;
  distanceKm: number;
  etaMin: number;
  rating: number;
  imageUrl: string;
  matchingReason: string;
  matchingProducts: Array<{
    id: string;
    name: string;
    price: number;
    unit: string;
    imageUrl: string;
  }>;
}

export interface RecommendationQueryOptions {
  userLat?: number | null;
  userLng?: number | null;
  currentCategory?: string | null;
  currentProductId?: string;
  currentStoreId?: string;
  searchQuery?: string;
  limit?: number;
}

export function getNearbyStoreRecommendations(
  options: RecommendationQueryOptions
): NearbyStoreRecommendation[] {
  const {
    userLat,
    userLng,
    currentCategory = "",
    currentProductId = "",
    currentStoreId = "",
    searchQuery = "",
    limit = 4,
  } = options;

  // Default coordinate if GPS unavailable (Coimbatore local center)
  const defaultLat = 11.0168;
  const defaultLng = 76.9558;

  const validUserLat =
    typeof userLat === "number" && isValidCoordinate(userLat, userLng ?? 0)
      ? userLat
      : defaultLat;
  const validUserLng =
    typeof userLng === "number" && isValidCoordinate(userLat ?? 0, userLng)
      ? userLng
      : defaultLng;

  const candidateStores = Object.values(stores).filter(
    (s) => s.id !== currentStoreId
  );

  const queryTerms = (searchQuery + " " + currentCategory)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const scoredStores = candidateStores.map((store) => {
    // Distance calculation
    const storeLat = typeof store.lat === "number" ? store.lat : defaultLat;
    const storeLng = typeof store.lng === "number" ? store.lng : defaultLng;

    const distanceKm = Math.max(
      0.1,
      Math.round(haversineDistanceKm(storeLat, storeLng, validUserLat, validUserLng) * 10) / 10
    );

    const etaMin = Math.max(10, Math.round(distanceKm * 5 + 10));

    // Get products for this store
    const storeProds = productsByStore[store.id] ?? [];

    // Category / Keyword matching score
    const categoryMatch =
      currentCategory &&
      store.category.toLowerCase().includes(currentCategory.toLowerCase());

    const matchingProducts: Product[] = [];
    if (queryTerms.length > 0) {
      storeProds.forEach((p) => {
        if (p.id === currentProductId) return;
        const nameLower = p.name.toLowerCase();
        const catLower = p.category.toLowerCase();
        const matches = queryTerms.some(
          (t) => nameLower.includes(t) || catLower.includes(t)
        );
        if (matches) matchingProducts.push(p);
      });
    }

    if (matchingProducts.length === 0) {
      matchingProducts.push(...storeProds.slice(0, 3));
    }

    // Distance Score (smaller distance = higher score)
    const distScore = Math.max(0, 100 - distanceKm * 8);
    const ratingScore = (store.rating || 4.5) * 10;
    const categoryScore = categoryMatch ? 50 : 0;
    const productCountScore = Math.min(30, matchingProducts.length * 10);

    const totalScore = distScore + ratingScore + categoryScore + productCountScore;

    // Reason Text
    let matchingReason = `Nearby store (${distanceKm} km away) with quick delivery`;
    if (distanceKm <= 1.0) {
      matchingReason = `⚡ Express Delivery (${distanceKm} km away from your location)`;
    } else if (categoryMatch) {
      matchingReason = `🏆 Top local ${store.category} store near your home`;
    } else if (matchingProducts.length > 1) {
      matchingReason = `📦 Stocks ${matchingProducts.length}+ similar items near your area`;
    }

    return {
      id: store.id,
      name: store.name,
      category: store.category,
      address: store.address,
      distanceKm,
      etaMin,
      rating: store.rating || 4.5,
      imageUrl: store.imageUrl,
      matchingReason,
      matchingProducts: matchingProducts.slice(0, 3).map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        unit: p.unit || "1 unit",
        imageUrl: p.imageUrl ?? "",
      })),
      totalScore,
    };
  });

  // Sort by highest recommendation score
  scoredStores.sort((a, b) => b.totalScore - a.totalScore);

  return scoredStores.slice(0, limit);
}
