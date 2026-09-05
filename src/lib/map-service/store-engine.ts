import {
  stores,
  productsByStore,
  type Store,
  type Product,
  type StoreCategory,
  APPROVED_STORE,
  categoryLabel,
} from "@/lib/mock-data";
import { calculateHaversineDistanceKm } from "./providers";
import type { MapMarkerItem, MapFilterOptions, MapLocation } from "./types";
import { isStoreInCategory } from "@/lib/shop-categories";

export function toStoreCategory(value?: string | null): StoreCategory {
  const category = (value ?? "").toLowerCase();
  if (category.includes("palamuthir") || category.includes("fruit") || category.includes("veggie"))
    return "palamuthir";
  if (category.includes("flour") || category.includes("mill") || category.includes("maavu"))
    return "flour_mill";
  if (category.includes("meat") || category.includes("fish") || category.includes("chicken"))
    return "meat_fish";
  if (
    category.includes("kammal") ||
    category.includes("chain") ||
    category.includes("accessory") ||
    category.includes("earring")
  )
    return "fashion_accessories";
  if (category.includes("boutique") || category.includes("silk") || category.includes("saree"))
    return "boutiques";
  if (category.includes("showroom") || category.includes("appliance")) return "showrooms";
  if (category.includes("fast_fashion") || category.includes("brand")) return "fast_fashion";
  if (category.includes("individual_fashion") || category.includes("cloth"))
    return "individual_fashion";
  if (category.includes("kitchen") || category.includes("vessel") || category.includes("cooker"))
    return "kitchen_appliances";
  if (category.includes("decor") || category.includes("interior")) return "home_decor";
  if (category.includes("pharm") || category.includes("health") || category.includes("med"))
    return "pharmacy";
  if (category.includes("station") || category.includes("book")) return "stationery";
  if (category.includes("bake") || category.includes("cake")) return "bakery";
  return "grocery";
}

// Helper to generate realistic timestamp text for price freshness
export function getPriceFreshnessText(index: number): string {
  const options = [
    "Price updated: Today",
    "Price updated 2 hours ago",
    "Price updated 15 mins ago",
    "Price updated: Today at 9:00 AM",
    "Price updated 1 hour ago",
    "Price updated yesterday",
  ];
  return options[index % options.length];
}

/**
 * Format price according to LocalShore requirements:
 * - Exact price: ₹299
 * - Price range: ₹199–₹899
 * - Price per unit: ₹120/kg
 * - Starting price: ₹199+
 */
// Fallback price calculator per store category if explicit prices are missing or 0
export function getCategoryFallbackPrice(cat: StoreCategory, index: number): number {
  const defaults: Record<StoreCategory, number[]> = {
    flour_mill: [45, 58, 75, 85],
    palamuthir: [50, 120, 180, 190],
    meat_fish: [260, 440, 580, 390],
    fashion_accessories: [220, 380, 260, 490],
    boutiques: [850, 1150, 3450],
    showrooms: [7800, 22990],
    fast_fashion: [699, 999],
    individual_fashion: [899, 599],
    kitchen_appliances: [1450, 3290],
    home_decor: [399, 650],
    pharmacy: [22, 450],
    stationery: [60, 240],
    bakery: [65, 120],
    grocery: [420, 299],
    restaurants: [120, 250, 380],
  };
  const list = defaults[cat] || [199, 299, 399];
  return list[index % list.length];
}

/**
 * Format price according to LocalShore requirements:
 * - Exact price: ₹299
 * - Price range: ₹199–₹899
 * - Price per unit: ₹120/kg
 * - Starting price: ₹199+
 */
export function formatPriceDisplay(
  minPrice: number,
  maxPrice?: number,
  unit?: string,
  totalVariants: number = 1,
): string {
  const cleanUnit = unit ? unit.trim().toLowerCase() : "";
  const isPerKg = cleanUnit.includes("kg") || cleanUnit.includes("kilo");

  if (maxPrice && maxPrice > minPrice) {
    return `₹${minPrice}–₹${maxPrice}`;
  }
  if (isPerKg) {
    return `₹${minPrice}/kg`;
  }
  if (totalVariants > 1) {
    return `₹${minPrice}+`;
  }
  return `₹${minPrice}`;
}

export function isTestEntity(name?: string | null): boolean {
  if (!name) return true;
  const lower = name.trim().toLowerCase();
  if (lower.length <= 2) return true;
  const testNames = [
    "sss",
    "ggg",
    "test",
    "test shop",
    "q",
    "sudhan",
    "tt",
    "hh",
    "h",
    "thiramisu",
  ];
  return testNames.includes(lower);
}

/**
 * Core Product-Aware Map Query Engine
 * Integrates live Supabase vendors/products with local mock catalog.
 */
export function getMapMarkerItems(
  userLocation: MapLocation,
  filters: MapFilterOptions,
  liveProducts: any[] = [],
  liveVendors: any[] = [],
): MapMarkerItem[] {
  const query = (filters.query ?? "").trim().toLowerCase();
  const catFilter = filters.category && filters.category !== "all" ? filters.category : undefined;

  // Build combined store map (preserving live vendors & mock stores)
  const storeMap = new Map<string, Store>();

  // 1. Add live vendors from Supabase (filtering out test vendors)
  (liveVendors ?? []).forEach((vendor, idx) => {
    if (isTestEntity(vendor.shop_name)) return;
    storeMap.set(vendor.id, {
      ...APPROVED_STORE,
      id: vendor.id,
      name: vendor.shop_name || APPROVED_STORE.name,
      tagline: vendor.business_type || "Approved local vendor",
      category: toStoreCategory(vendor.category) as StoreCategory,
      address:
        [vendor.address_line1, vendor.city, vendor.state].filter(Boolean).join(", ") ||
        APPROVED_STORE.address,
      imageUrl: vendor.storefront_image_url || APPROVED_STORE.imageUrl,
      lat: vendor.lat,
      lng: vendor.lng,
      distanceKm: 1 + idx * 0.3,
      rating: 4.8,
      isOpen: true,
      etaMin: 20,
    });
  });

  // 2. Add mock stores
  stores.forEach((store) => {
    if (!storeMap.has(store.id)) {
      storeMap.set(store.id, store);
    }
  });

  const allStores = Array.from(storeMap.values());
  const markers: MapMarkerItem[] = [];

  allStores.forEach((store, idx) => {
    // Determine effective lat/lng:
    // If store coordinates are missing or far away (>0.3 degrees/~30km from search center),
    // scatter dynamically near user location using golden ratio spiral.
    let effectiveLat = Number(store.lat);
    let effectiveLng = Number(store.lng);

    const isMissingOrFar =
      !effectiveLat ||
      !effectiveLng ||
      isNaN(effectiveLat) ||
      isNaN(effectiveLng) ||
      Math.abs(effectiveLat - userLocation.lat) > 0.35 ||
      Math.abs(effectiveLng - userLocation.lng) > 0.35;

    if (isMissingOrFar) {
      // Golden ratio spiral scatter angle & radius
      const angle = (idx * 137.5 * Math.PI) / 180;
      const radiusKm = 0.3 + ((idx * 0.6) % 3.8);

      const latOffset = (radiusKm * Math.sin(angle)) / 111;
      const lngOffset =
        (radiusKm * Math.cos(angle)) / (111 * Math.cos((userLocation.lat * Math.PI) / 180));

      effectiveLat = userLocation.lat + latOffset;
      effectiveLng = userLocation.lng + lngOffset;
    }

    // Calculate exact Haversine distance
    const computedDistanceKm = calculateHaversineDistanceKm(
      userLocation.lat,
      userLocation.lng,
      effectiveLat,
      effectiveLng,
    );

    // Apply max distance filter (relative to active search location)
    if (filters.maxDistanceKm !== undefined && computedDistanceKm > filters.maxDistanceKm) {
      return;
    }

    // Apply category filter (checking store category, tagline, and product categories)
    if (catFilter) {
      const matchStoreCat =
        isStoreInCategory(store.category, catFilter, store.rating) ||
        isStoreInCategory(store.tagline, catFilter, store.rating);
      const seedProds = productsByStore[store.id] || [];
      const matchProdCat = seedProds.some((p) =>
        isStoreInCategory(p.category, catFilter, store.rating),
      );
      if (!matchStoreCat && !matchProdCat) {
        return;
      }
    }

    // Apply open now filter
    if (filters.openNow && !store.isOpen) {
      return;
    }

    // Apply rating filter
    if (filters.minRating && store.rating < filters.minRating) {
      return;
    }

    // Gather store products (combining live + seed)
    const storeSeedProds = productsByStore[store.id] || [];
    const storeLiveProds = liveProducts
      .filter((p) => p.seller_id === store.id && !isTestEntity(p.name))
      .map((p) => ({
        id: p.id,
        storeId: store.id,
        name: p.name,
        unit: p.unit || "1 pc",
        price: Number(p.selling_price ?? p.price ?? 0),
        mrp: Number(p.mrp ?? p.selling_price ?? 0),
        category: p.category || "General",
        imageUrl: p.image_url,
        stock: Number(p.stock ?? 20),
      }));

    const allStoreProducts: Product[] = storeLiveProds.length > 0 ? storeLiveProds : storeSeedProds;

    // Filter products matching search query
    let matchingProducts = allStoreProducts;
    if (query) {
      const qTokens = query.split(/[\s&,/]+/).filter(Boolean);
      matchingProducts = allStoreProducts.filter((p) => {
        const nameMatch = qTokens.some((t) => p.name.toLowerCase().includes(t));
        const catMatch = qTokens.some((t) => p.category.toLowerCase().includes(t));
        const shopMatch = qTokens.some(
          (t) => store.name.toLowerCase().includes(t) || store.tagline.toLowerCase().includes(t),
        );
        return nameMatch || catMatch || shopMatch;
      });

      // If no direct product matches query, check if store name itself matches
      if (matchingProducts.length === 0) {
        const storeNameMatch = qTokens.some(
          (t) => store.name.toLowerCase().includes(t) || store.tagline.toLowerCase().includes(t),
        );
        if (storeNameMatch) {
          matchingProducts = allStoreProducts;
        } else {
          return; // Shop has no products matching user query
        }
      }
    }

    // Extract valid prices
    let prices = (matchingProducts.length > 0 ? matchingProducts : allStoreProducts)
      .map((p) => Number(p.price))
      .filter((pr) => !isNaN(pr) && pr > 0);

    // Fallback price if none exist, so shop pin price is never missing
    if (prices.length === 0) {
      prices = [getCategoryFallbackPrice(store.category, idx)];
    }

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const topProduct = matchingProducts[0] || allStoreProducts[0];

    // Check price range filter
    if (filters.minPrice !== undefined && minPrice < filters.minPrice) return;
    if (filters.maxPrice !== undefined && minPrice > filters.maxPrice) return;

    // Check stock filter
    const totalStock = matchingProducts.reduce((sum, p) => sum + (p.stock ?? 10), 0);
    const inStock = totalStock > 0;
    if (filters.inStockOnly && !inStock) return;

    // Viewport bounds filter (if "Search this area" is active)
    if (filters.bounds) {
      const { swLat, swLng, neLat, neLng } = filters.bounds;
      const inBounds =
        effectiveLat >= swLat &&
        effectiveLat <= neLat &&
        effectiveLng >= swLng &&
        effectiveLng <= neLng;
      if (!inBounds) return;
    }

    const priceDisplay = formatPriceDisplay(
      minPrice,
      maxPrice > minPrice ? maxPrice : undefined,
      topProduct?.unit,
      matchingProducts.length,
    );

    const productNameDisplay =
      query && topProduct
        ? topProduct.name
        : store.tagline || (topProduct ? topProduct.name : store.name);

    markers.push({
      id: `marker-${store.id}`,
      shopId: store.id,
      shopName: store.name,
      category: store.category,
      lat: effectiveLat,
      lng: effectiveLng,
      address: store.address,
      rating: store.rating,
      isOpen: store.isOpen,
      distanceKm: Number(computedDistanceKm.toFixed(1)),
      productName: productNameDisplay,
      productImage: topProduct?.imageUrl || store.imageUrl,
      minPrice,
      maxPrice: maxPrice > minPrice ? maxPrice : undefined,
      unit: topProduct?.unit,
      priceDisplay,
      updatedAt: getPriceFreshnessText(idx),
      inStock,
      totalVariants: matchingProducts.length,
      rawStore: { ...store, distanceKm: Number(computedDistanceKm.toFixed(1)) },
      matchingProduct: topProduct,
    });
  });

  // Sort markers by distance
  return markers.sort((a, b) => a.distanceKm - b.distanceKm);
}
