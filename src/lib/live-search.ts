import { discoverShops } from "./shop-discovery";
import { DEFAULT_SHOP_DISCOVERY_RADIUS_KM, CUSTOMER_VISIBILITY_RADIUS_KM } from "./location-visibility";
import type { SearchResultItem } from "./search-service";

type Rpc = Parameters<typeof discoverShops>[0];

export async function searchLiveCatalog(rpc: Rpc, input: {lat: number; lng: number; query: string}): Promise<SearchResultItem[]> {
  const query = input.query.trim().replace(/\s+/g, " ");
  if (!query) return [];
  const [discovery, products] = await Promise.all([
    discoverShops(rpc, { ...input, query, category: null, radiusKm: DEFAULT_SHOP_DISCOVERY_RADIUS_KM }),
    rpc("get_customer_visible_products", {
      p_lat: input.lat, p_lng: input.lng, p_query: query,
      p_category_slug: null, p_limit: 24, p_offset: 0,
    }),
  ]);
  if (products.error) throw new Error(products.error.message || "Unable to search products");
  if (!Array.isArray(products.data)) throw new Error("Invalid catalog search response");
  const shops: SearchResultItem[] = discovery.shops.map(shop => ({
    id: `shop-${shop.id}`, title: shop.shop_name,
    subtitle: `${shop.business_type || "Local shop"} · ${shop.distance_km.toFixed(1)} km away${shop.is_fallback ? " · Nearby area" : ""}`,
    type: "Shop", imageUrl: "/placeholder.svg", url: `/store/${shop.id}`,
    storeId: shop.id, distanceKm: shop.distance_km, matchScore: 0,
  }));
  const items: SearchResultItem[] = products.data.filter((row: any) =>
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
  return Array.from(new Map([...shops, ...items].map(item => [item.id, item])).values());
}
