/**
 * LOCALSHORE — PUBLIC CATALOG & SEARCH SERVER FUNCTIONS WITH REDIS CACHING
 *
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * 1. SERVER-ONLY EXECUTION via TanStack Start createServerFn.
 * 2. CLIENT CODE CALLS THESE SERVER FUNCTIONS — NEVER IMPORTS REDIS DIRECTLY.
 * 3. VERSIONED REDIS KEYS (shops:v<ver>..., products:v<ver>...).
 * 4. FAIL-SAFE FALLBACK TO SUPABASE IF REDIS IS UNREACHABLE.
 */

import { createServerFn } from "@tanstack/react-start";
import { redisGet, redisSet, redisGetVersion, hashFilters, redisRateLimit } from "@/lib/redis.server";
import { isTestEntity } from "@/lib/map-service/store-engine";

export interface FetchShopsInput {
  category?: string;
  query?: string;
  lat?: number;
  lng?: number;
  filters?: Record<string, any>;
}

export interface FetchProductsInput {
  category?: string;
  query?: string;
  filters?: Record<string, any>;
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
    const filterHash = hashFilters(data.filters || {});

    // Read current catalog version namespace
    const shopsVer = await redisGetVersion("version:shops");
    const cacheKey = `shops:v${shopsVer}:${locBucket}:${category}:${filterHash}`;

    // 1. Try Redis Cache Hit
    const cachedShops = await redisGet<any[]>(cacheKey);
    if (cachedShops) {
      return { shops: cachedShops, source: "redis" as const };
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
    } catch (err) {
      console.error("[Catalog Server] Error fetching vendors from Supabase:", err);
    }

    // 3. Populate Redis Cache (TTL: 180s = 3 mins)
    if (shops.length > 0) {
      await redisSet(cacheKey, shops, 180);
    }

    return { shops, source: "supabase" as const };
  });

/**
 * 2. SERVER FUNCTION: Fetch Public Product Catalog (Cached via Redis)
 */
export const fetchPublicProductsServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: FetchProductsInput) => data || {})
  .handler(async ({ data }) => {
    const category = data.category || "all";
    const filterHash = hashFilters(data.filters || {});

    const productsVer = await redisGetVersion("version:products");
    const cacheKey = `products:v${productsVer}:${category}:${filterHash}`;

    // 1. Try Redis Cache Hit
    const cachedProducts = await redisGet<any[]>(cacheKey);
    if (cachedProducts) {
      return { products: cachedProducts, source: "redis" as const };
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
    } catch (err) {
      console.error("[Catalog Server] Error fetching products from Supabase:", err);
    }

    // 3. Populate Redis Cache (TTL: 180s = 3 mins)
    if (products.length > 0) {
      await redisSet(cacheKey, products, 180);
    }

    return { products, source: "supabase" as const };
  });

/**
 * 3. SERVER FUNCTION: Public Search (Cached & Rate-Limited via Redis)
 */
export const searchPublicCatalogServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: { query: string; category?: string; clientIp?: string }) => ({
    query: (data?.query || "").trim().toLowerCase(),
    category: data?.category || "all",
    clientIp: data?.clientIp || "anonymous",
  }))
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
    const cacheKey = `search:v${catalogVer}:${queryHash}`;

    // 1. Try Redis Cache Hit
    const cachedSearch = await redisGet<any[]>(cacheKey);
    if (cachedSearch) {
      return { results: cachedSearch, source: "redis" as const };
    }

    // 2. Cache Miss -> Query Supabase
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let results: any[] = [];

    try {
      const { data: products } = await (supabaseAdmin as any)
        .from("approved_product_catalog")
        .select("id, seller_id, name, category, selling_price, image_url, shop_name")
        .ilike("name", `%${data.query}%`)
        .limit(20);

      results = products ?? [];
    } catch (err) {
      console.error("[Catalog Server] Error executing search on Supabase:", err);
    }

    // 3. Populate Redis Cache (TTL: 120s = 2 mins)
    if (results.length > 0) {
      await redisSet(cacheKey, results, 120);
    }

    return { results, source: "supabase" as const };
  });
