import { SearchResultItem } from "./search-service";
import { stores, getStore } from "./mock-data";

export interface ShopRecommendation {
  shopId: string;
  shopName: string;
  shopTagline?: string;
  imageUrl?: string;
  category?: string;
  rating: number;
  reviewCount?: number;
  distanceKm?: number;
  matchingProductCount: number;
  startingPrice: number;
  matchScore: number;
  isOpen?: boolean;
  matchingProductNames: string[];
}

export function rankAndGroupShopsBySearchQuery(
  results: SearchResultItem[],
  currentShopId?: string,
): ShopRecommendation[] {
  if (!results || results.length === 0) return [];

  // Group matching products by storeId
  const shopProductMap = new Map<string, SearchResultItem[]>();
  const shopMetaMap = new Map<string, Partial<SearchResultItem>>();

  for (const item of results) {
    const sId = item.storeId || (item.type === "Shop" ? item.id.replace(/^store-/, "") : undefined);
    if (!sId) continue;

    // Exclude current shop
    if (currentShopId && sId === currentShopId) continue;

    if (item.type === "Shop" || item.type === "Restaurant") {
      const existingMeta = shopMetaMap.get(sId) || {};
      shopMetaMap.set(sId, {
        storeName: item.storeName || item.title || existingMeta.storeName,
        imageUrl: item.imageUrl || existingMeta.imageUrl,
        distanceKm: item.distanceKm ?? existingMeta.distanceKm,
        rating: item.rating ?? existingMeta.rating,
        reviewCount: item.reviewCount ?? existingMeta.reviewCount,
        isOpen: item.isOpen ?? existingMeta.isOpen,
        subtitle: item.subtitle || existingMeta.subtitle,
      });
    }

    if (item.type === "Product" || item.type === "Dish") {
      const existingProducts = shopProductMap.get(sId) || [];
      existingProducts.push(item);
      shopProductMap.set(sId, existingProducts);

      if (!shopMetaMap.has(sId)) {
        shopMetaMap.set(sId, {
          storeName: item.storeName,
          imageUrl: item.imageUrl,
          distanceKm: item.distanceKm,
          rating: item.rating,
          reviewCount: item.reviewCount,
          isOpen: item.isOpen,
        });
      }
    }
  }

  const recommendations: ShopRecommendation[] = [];

  for (const [shopId, products] of shopProductMap.entries()) {
    if (products.length === 0) continue;

    // Fallback store info from mock data if needed
    const mockStore = getStore(shopId) || stores.find((s) => s.id === shopId);
    const meta = shopMetaMap.get(shopId) || {};

    const shopName = meta.storeName || mockStore?.name || "Local Shop";
    const shopTagline = meta.subtitle || mockStore?.tagline || mockStore?.category || "Verified merchant";
    const imageUrl = mockStore?.imageUrl || meta.imageUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=75";
    const rating = meta.rating ?? mockStore?.rating ?? 4.5;
    const reviewCount = meta.reviewCount ?? (mockStore ? Math.floor(mockStore.rating * 35) : 42);
    const distanceKm = meta.distanceKm ?? mockStore?.distanceKm ?? 1.4;
    const isOpen = meta.isOpen ?? mockStore?.isOpen ?? true;

    // Filter valid prices
    const validPrices = products
      .map((p) => p.discountPrice ?? p.price ?? 0)
      .filter((p) => p > 0);
    const startingPrice = validPrices.length > 0 ? Math.min(...validPrices) : 299;

    const maxProductScore = Math.max(...products.map((p) => p.matchScore ?? 0));
    const matchingProductCount = products.length;

    // Only include shops with a meaningful search match
    if (maxProductScore < 10) continue;

    // Ranking Score Algorithm combining:
    // 1. Product search relevance (maxProductScore)
    // 2. Number of matching products
    // 3. Shop rating
    // 4. Distance penalty
    // 5. Open status boost
    const compositeRankScore =
      maxProductScore * 0.45 +
      matchingProductCount * 12 +
      rating * 6 -
      distanceKm * 2.5 +
      (isOpen ? 10 : 0);

    recommendations.push({
      shopId,
      shopName,
      shopTagline,
      imageUrl,
      rating,
      reviewCount,
      distanceKm,
      matchingProductCount,
      startingPrice,
      matchScore: compositeRankScore,
      isOpen,
      matchingProductNames: products.map((p) => p.title).slice(0, 3),
    });
  }

  // Sort by composite rank score descending
  return recommendations.sort((a, b) => b.matchScore - a.matchScore);
}
