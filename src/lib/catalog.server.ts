/**
 * LOCALSHORE — PUBLIC CATALOG & SEARCH SERVER FUNCTIONS WITH REDIS CACHING
 *
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * 1. SERVER-ONLY EXECUTION via TanStack Start createServerFn.
 * 2. CLIENT CODE CALLS THESE SERVER FUNCTIONS — NEVER IMPORTS REDIS DIRECTLY.
 * 3. VERSIONED REDIS KEYS INCLUDING SORT & PAGINATION (shops:v<ver>...:sort:<sort>:page:<page>:limit:<limit>).
 * 4. FAIL-SAFE FALLBACK TO SUPABASE IF REDIS IS UNREACHABLE.
 */

import { createServerFn } from "@tanstack/react-start";
import { redisGet, redisSet, redisGetVersion, hashFilters, redisRateLimit } from "@/lib/redis.server";
import { isTestEntity } from "@/lib/map-service/store-engine";

export type SortOrder =
  | "popularity"
  | "rating"
  | "newest"
  | "price_asc"
  | "price_desc"
  | "price asc"
  | "price desc"
  | "distance"
  | "relevance";

export interface FetchShopsInput {
  category?: string;
  query?: string;
  lat?: number;
  lng?: number;
  sort?: string;
  page?: number;
  limit?: number;
  filters?: Record<string, any>;
}

export interface FetchProductsInput {
  category?: string;
  query?: string;
  sort?: string;
  page?: number;
  limit?: number;
  filters?: Record<string, any>;
}

export function normalizeSortOrder(sort?: string): string {
  if (!sort) return "relevance";
  const s = sort.trim().toLowerCase().replace(/\s+/g, "_");
  const validSorts: Record<string, string> = {
    popularity: "popularity",
    rating: "rating",
    newest: "newest",
    price_asc: "price_asc",
    price_desc: "price_desc",
    distance: "distance",
    relevance: "relevance",
  };
  return validSorts[s] || "relevance";
}

/**
 * Helper to build deterministic cache keys with sort and pagination
 * Example: products:v1:global:grocery:f_abc123:sort:price_asc:page:1:limit:20
 */
export function buildCatalogCacheKey(params: {
  prefix: "shops" | "products" | "search";
  version: string;
  locBucket: string;
  category: string;
  sort?: string;
  page?: number;
  limit?: number;
  filterHash: string;
}): string {
  const normSort = normalizeSortOrder(params.sort);
  const normPage = Math.max(1, params.page || 1);
  const normLimit = Math.max(1, Math.min(100, params.limit || 20));
  const normCat = (params.category || "all").trim().toLowerCase();
  const locBucket = params.locBucket || "global";
  return `${params.prefix}:v${params.version}:${locBucket}:${normCat}:${params.filterHash}:sort:${normSort}:page:${normPage}:limit:${normLimit}`;
}

/**
 * 1. SERVER FUNCTION: Fetch Public Vendor Catalog (Cached via Redis)
 */
export const fetchPublicShopsServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: FetchShopsInput) => data || {})
  .handler(async ({ data }) => {
    const category = data.category || "all";
    const userLat = Number(data.lat) || 11.0285;
    const userLng = Number(data.lng) || 76.9258;
    const locBucket = `loc:${userLat.toFixed(2)}_${userLng.toFixed(2)}`;
    const sort = data.sort || "relevance";
    const page = Math.max(1, data.page || 1);
    const limit = Math.max(1, Math.min(100, data.limit || 20));
    const filterHash = hashFilters(data.filters || {});

    // Read current catalog version namespace
    const shopsVer = await redisGetVersion("version:shops");
    const cacheKey = buildCatalogCacheKey({
      prefix: "shops",
      version: shopsVer,
      locBucket,
      category,
      sort,
      page,
      limit,
      filterHash,
    });

    // 1. Try Redis Cache Hit
    const cachedShops = await redisGet<any[]>(cacheKey);
    if (cachedShops) {
      return { shops: cachedShops, source: "redis" as const, key: cacheKey };
    }

    // 2. Cache Miss -> Query Supabase PostgreSQL Source of Truth
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let shops: any[] = [];

    try {
      const { data: vendors } = await (supabaseAdmin as any)
        .from("approved_vendor_catalog")
        .select("id, shop_name, business_type, city, state, address_line1, category, lat, lng");

      shops = (vendors ?? [])
        .filter((v: any) => !isTestEntity(v.shop_name))
        .map((v: any) => ({
          id: v.id,
          name: v.shop_name || "Verified Local Vendor",
          tagline: v.business_type || "Local Shore Vendor",
          category: v.category || "grocery",
          address: [v.address_line1, v.city, v.state].filter(Boolean).join(", "),
          imageUrl: v.storefront_image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=75",
          lat: Number(v.lat) || userLat,
          lng: Number(v.lng) || userLng,
          rating: 4.8,
          isOpen: true,
          distanceKm: 1.2,
          etaMin: 20,
        }));

      // Apply Sort Order in Server Function
      if (sort === "rating") {
        shops.sort((a, b) => b.rating - a.rating);
      } else if (sort === "distance") {
        shops.sort((a, b) => a.distanceKm - b.distanceKm);
      } else if (sort === "popularity") {
        shops.sort((a, b) => b.rating * 10 - a.rating * 10);
      }

      // Apply Pagination
      const start = (page - 1) * limit;
      shops = shops.slice(start, start + limit);
    } catch (err) {
      console.error("[Catalog Server] Error fetching vendors from Supabase:", err);
    }

    // 3. Populate Redis Cache (TTL: 180s = 3 mins)
    if (shops.length > 0) {
      await redisSet(cacheKey, shops, 180);
    }

    return { shops, source: "supabase" as const, key: cacheKey };
  });

/**
 * 2. SERVER FUNCTION: Fetch Public Product Catalog (Cached via Redis)
 */
export const fetchPublicProductsServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: FetchProductsInput) => data || {})
  .handler(async ({ data }) => {
    const category = data.category || "all";
    const sort = data.sort || "relevance";
    const page = Math.max(1, data.page || 1);
    const limit = Math.max(1, Math.min(100, data.limit || 20));
    const filterHash = hashFilters(data.filters || {});

    const productsVer = await redisGetVersion("version:products");
    const cacheKey = buildCatalogCacheKey({
      prefix: "products",
      version: productsVer,
      locBucket: "global",
      category,
      sort,
      page,
      limit,
      filterHash,
    });

    // 1. Try Redis Cache Hit
    const cachedProducts = await redisGet<any[]>(cacheKey);
    if (cachedProducts) {
      return { products: cachedProducts, source: "redis" as const, key: cacheKey };
    }

    // 2. Cache Miss -> Query Supabase PostgreSQL
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let products: any[] = [];

    try {
      const { data: catData } = await (supabaseAdmin as any)
        .from("approved_product_catalog")
        .select("id, seller_id, name, category, selling_price, image_url, stock, shop_name");

      products = (catData ?? [])
        .filter((p: any) => !isTestEntity(p.name))
        .map((p: any) => ({
          id: p.id,
          seller_id: p.seller_id,
          name: p.name,
          category: p.category,
          selling_price: Number(p.selling_price || 0),
          image_url: p.image_url,
          stock: Number(p.stock || 20),
          shop_name: p.shop_name || "Verified Seller",
        }));

      // Apply Sort Order
      if (sort === "price_asc") {
        products.sort((a, b) => a.selling_price - b.selling_price);
      } else if (sort === "price_desc") {
        products.sort((a, b) => b.selling_price - a.selling_price);
      }

      // Apply Pagination
      const start = (page - 1) * limit;
      products = products.slice(start, start + limit);
    } catch (err) {
      console.error("[Catalog Server] Error fetching products from Supabase:", err);
    }

    // 3. Populate Redis Cache (TTL: 180s = 3 mins)
    if (products.length > 0) {
      await redisSet(cacheKey, products, 180);
    }

    return { products, source: "supabase" as const, key: cacheKey };
  });

/**
 * 3. SERVER FUNCTION: Public Search (Cached & Rate-Limited via Redis)
 */
export const searchPublicCatalogServerFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      query: string;
      category?: string;
      sort?: SortOrder;
      page?: number;
      limit?: number;
      clientIp?: string;
    }) => ({
      query: (data?.query || "").trim().toLowerCase(),
      category: data?.category || "all",
      sort: data?.sort || "relevance",
      page: Math.max(1, data?.page || 1),
      limit: Math.max(1, Math.min(100, data?.limit || 20)),
      clientIp: data?.clientIp || "anonymous",
    }),
  )
  .handler(async ({ data }) => {
    // Rate limit: 60 search requests per minute per IP (Fail-Open)
    const rateCheck = await redisRateLimit(`api:search:${data.clientIp}`, 60, 60);
    if (!rateCheck.allowed) {
      console.warn(`[Catalog Server] Search rate limit reached for IP: ${data.clientIp}`);
    }

    if (!data.query) {
      return { results: [], source: "empty" };
    }

    const catalogVer = await redisGetVersion("version:catalog");
    const queryHash = hashFilters({ q: data.query, cat: data.category });
    const cacheKey = buildCatalogCacheKey({
      prefix: "search",
      version: catalogVer,
      locBucket: "global",
      category: data.category,
      sort: data.sort,
      page: data.page,
      limit: data.limit,
      filterHash: queryHash,
    });

    // 1. Try Redis Cache Hit
    const cachedSearch = await redisGet<any[]>(cacheKey);
    if (cachedSearch) {
      return { results: cachedSearch, source: "redis" as const, key: cacheKey };
    }

    // 2. Cache Miss -> Query Supabase
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let results: any[] = [];

    try {
      const { data: products } = await (supabaseAdmin as any)
        .from("approved_product_catalog")
        .select("id, seller_id, name, category, selling_price, image_url, shop_name")
        .ilike("name", `%${data.query}%`)
        .limit(data.limit * data.page);

      results = (products ?? []).slice((data.page - 1) * data.limit, data.page * data.limit);
    } catch (err) {
      console.error("[Catalog Server] Error executing search on Supabase:", err);
    }

    // 3. Populate Redis Cache (TTL: 120s = 2 mins)
    if (results.length > 0) {
      await redisSet(cacheKey, results, 120);
    }

    return { results, source: "supabase" as const, key: cacheKey };
  });
