import { discoverShops } from "./shop-discovery";
import { DEFAULT_SHOP_DISCOVERY_RADIUS_KM, CUSTOMER_VISIBILITY_RADIUS_KM } from "./location-visibility";
import { searchCatalogItems, type SearchResultItem } from "./search-service";
import { runCatalogRpcWithTimeout } from "./catalog-rpc";
import { getImportedShopHref, type ImportedShopRow } from "./imported-shops";
import { isValidCoordinate } from "./geo";

type Rpc = Parameters<typeof discoverShops>[0];
const LIVE_SEARCH_DEADLINE_MS = 7_000;

function withSearchDeadline<T>(request: PromiseLike<T>, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), LIVE_SEARCH_DEADLINE_MS);
    Promise.resolve(request).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function searchLiveCatalog(rpc: Rpc, input: {lat: number; lng: number; query: string}): Promise<SearchResultItem[]> {
  const query = input.query.trim().replace(/\s+/g, " ");
  if (!query) return [];
  const [discoveryResult, productsResult, importedResult] = await Promise.allSettled([
    withSearchDeadline(
      // Fetch only the already-approved nearby shop set, then match names
      // locally so small spelling differences don't get rejected by SQL.
      discoverShops(rpc, { ...input, query: null, category: null, radiusKm: DEFAULT_SHOP_DISCOVERY_RADIUS_KM }),
      "Shop search timed out.",
    ),
    withSearchDeadline(
      runCatalogRpcWithTimeout(rpc("get_customer_visible_products", {
        p_lat: input.lat, p_lng: input.lng, p_query: query,
        p_category_slug: null, p_limit: 24, p_offset: 0,
      })),
      "Product search timed out.",
    ),
    withSearchDeadline(
      runCatalogRpcWithTimeout(rpc("get_nearby_imported_shops", {
        p_lat: input.lat, p_lng: input.lng, p_radius_km: DEFAULT_SHOP_DISCOVERY_RADIUS_KM,
        p_category_slug: null, p_query: query, p_limit: 50,
      })),
      "Public shop search timed out.",
    ),
  ]);

  const discovery = discoveryResult.status === "fulfilled" ? discoveryResult.value : null;
  const products = productsResult.status === "fulfilled" ? productsResult.value : null;
  const imported = importedResult.status === "fulfilled" ? importedResult.value : null;
  const discoveryError = discoveryResult.status === "rejected" ? discoveryResult.reason : null;
  const productsError = productsResult.status === "rejected"
    ? productsResult.reason
    : products?.error
      ? new Error(products.error.message || "Unable to search products")
      : null;

  // Shop discovery and product search are independent sources. Keep usable
  // results from either one if the other RPC is slow or unavailable.
  const importedError = importedResult.status === "rejected"
    ? importedResult.reason
    : imported?.error && imported.error.code !== "PGRST202"
      ? new Error(imported.error.message || "Unable to search public shop listings")
      : null;

  if (!discovery && !products && !imported) {
    const failure = discoveryError ?? productsError ?? importedError;
    throw failure instanceof Error
      ? failure
      : new Error("Catalog search could not load. Please retry.");
  }
  if (products && !products.error && !Array.isArray(products.data)) {
    throw new Error("Invalid catalog search response");
  }
  const shopCandidates = discovery?.shops ?? [];
  const shopSearchText = query.replace(/\b(shops?|stores?|markets?)\b/gi, " ").trim() || query;
  const matchingShopIds = new Set(
    searchCatalogItems(shopSearchText, shopCandidates.map((shop) => ({
      id: shop.id,
      name: shop.shop_name,
      tagline: [shop.business_type, shop.city, shop.zone_name].filter(Boolean).join(" "),
      category: shop.business_type,
    })))
      .filter((item) => item.type === "Shop")
      .slice(0, 10)
      .map((item) => item.storeId),
  );
  const nearbyShops = shopCandidates.filter((shop) => matchingShopIds.has(shop.id));

  const shops: SearchResultItem[] = nearbyShops.map(shop => ({
    id: `shop-${shop.id}`, title: shop.shop_name,
    subtitle: `${shop.business_type || "Local shop"} · ${shop.distance_km.toFixed(1)} km away${shop.is_fallback ? " · Nearby area" : ""}`,
    type: "Shop", imageUrl: "/placeholder.svg", url: `/store/${shop.id}`,
    storeId: shop.id, distanceKm: shop.distance_km, matchScore: 0,
  }));
  const importedRows = imported && !imported.error && Array.isArray(imported.data)
    ? (imported.data as ImportedShopRow[]).filter((shop) => shop.id && typeof shop.business_name === "string" && shop.business_name.trim())
    : [];
  const importedMatches = searchCatalogItems(shopSearchText, importedRows.map((shop) => ({
    id: shop.id,
    name: shop.business_name,
    tagline: [shop.category, shop.city].filter(Boolean).join(" "),
    category: shop.category,
    imageUrl: shop.cover_image_url,
  }))).filter((item) => item.type === "Shop").slice(0, 10);
  const importedById = new Map(importedRows.map((shop) => [shop.id, shop]));
  shops.push(...importedMatches.flatMap((match) => {
    const shop = match.storeId ? importedById.get(match.storeId) : undefined;
    if (!shop) return [];
    const distanceKm = Number(shop.distance_km);
    if (!Number.isFinite(distanceKm) || distanceKm < 0 || distanceKm > DEFAULT_SHOP_DISCOVERY_RADIUS_KM ||
      shop.latitude == null || shop.longitude == null || !isValidCoordinate(Number(shop.latitude), Number(shop.longitude))) return [];
    return [{
      id: `imported-shop-${shop.id}`,
      title: shop.business_name,
      subtitle: `${shop.category} · ${distanceKm.toFixed(1)} km away · public listing, unclaimed`,
      type: "Shop" as const,
      imageUrl: shop.cover_image_url || "/placeholder.svg",
      url: getImportedShopHref(shop.id, Number(shop.latitude), Number(shop.longitude)),
      distanceKm,
      rating: Number(shop.rating ?? 0) || undefined,
      reviewCount: shop.review_count ?? undefined,
      metadata: { imported: true, imageType: shop.image_type ?? "representative" },
      matchScore: match.matchScore,
    }];
  }));
  const items: SearchResultItem[] = (products && !products.error && Array.isArray(products.data)
    ? products.data
    : []).filter((row: any) =>
    row.id && row.name && row.seller_id && row.stock > 0 &&
    typeof row.distance_km === "number" && Number.isFinite(row.distance_km) &&
    row.distance_km >= 0 && row.distance_km <= CUSTOMER_VISIBILITY_RADIUS_KM,
  ).map((row: any) => ({
    id: `product-${row.id}`, title: row.name, subtitle: row.shop_name || "Local shop",
    type: "Product", imageUrl: row.image_url || "/placeholder.svg",
    url: `/product/${row.id}`, storeId: row.seller_id,
    price: Number(row.selling_price), distanceKm: row.distance_km, matchScore: 0,
  }));
  // Distinct shops can share a name; deduplicate by identity, not display text.
  const results = Array.from(new Map([...shops, ...items].map(item => [item.id, item])).values());
  if (results.length === 0 && (discoveryError || productsError || importedError)) {
    const failure = discoveryError ?? productsError ?? importedError;
    throw failure instanceof Error
      ? failure
      : new Error("Catalog search could not load. Please retry.");
  }
  return results;
}
