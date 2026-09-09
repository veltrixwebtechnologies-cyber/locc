import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDeliveryLocation } from "@/lib/location-store";
import { getInstantSearchResults, type SearchResultItem } from "@/lib/search-service";

export function useLiveSearchResults(query: string) {
  const trimmedQuery = query.trim();
  const [debouncedQuery, setDebouncedQuery] = useState(trimmedQuery);
  const [deliveryLocation] = useDeliveryLocation();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(trimmedQuery), 150);
    return () => window.clearTimeout(timer);
  }, [trimmedQuery]);

  const search = useQuery({
    queryKey: ["marketplace-search-v2", debouncedQuery, deliveryLocation?.lat, deliveryLocation?.lng],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: debouncedQuery.length > 0,
    queryFn: async () => {
      // 1. Try ML Search RPC first
      try {
        const { data: mlData, error: mlError } = await (supabase as any).rpc(
          "search_marketplace_catalog_ml",
          {
            p_query: debouncedQuery,
            p_lat: deliveryLocation?.lat ?? null,
            p_lng: deliveryLocation?.lng ?? null,
            p_limit: 24,
            p_offset: 0,
            p_scope: "all",
          },
        );

        if (!mlError && mlData && mlData.length > 0) {
          return mlData as any[];
        }
      } catch (e) {}

      // 2. Try basic search RPC
      try {
        const { data, error } = await (supabase as any).rpc("search_marketplace_catalog", {
          p_query: debouncedQuery,
          p_lat: deliveryLocation?.lat ?? null,
          p_lng: deliveryLocation?.lng ?? null,
          p_limit: 24,
          p_offset: 0,
          p_scope: "all",
        });
        if (!error && data && data.length > 0) {
          return (data ?? []) as any[];
        }
      } catch (e) {}

      // 3. Fallback to direct Supabase DB queries for products and shops
      try {
        const [prodRes, shopRes] = await Promise.all([
          (supabase as any)
            .from("approved_product_catalog")
            .select("id, seller_id, name, category, selling_price, image_url, shop_name")
            .or(
              `name.ilike.%${debouncedQuery}%,category.ilike.%${debouncedQuery}%,shop_name.ilike.%${debouncedQuery}%`,
            )
            .limit(20),
          (supabase as any)
            .from("sellers")
            .select("id, business_name, business_type, city, status")
            .or(
              `business_name.ilike.%${debouncedQuery}%,business_type.ilike.%${debouncedQuery}%,city.ilike.%${debouncedQuery}%`,
            )
            .limit(10),
        ]);

        const dbResults: any[] = [];

        if (prodRes.data && prodRes.data.length > 0) {
          for (const p of prodRes.data) {
            dbResults.push({
              result_kind: "product",
              result_id: p.id,
              title: p.name,
              subtitle: p.shop_name || p.category || "Product",
              image_url: p.image_url,
              url: `/product/${p.id}`,
              shop_id: p.seller_id,
              shop_name: p.shop_name,
              price: p.selling_price,
              match_score: 90,
            });
          }
        }

        if (shopRes.data && shopRes.data.length > 0) {
          for (const s of shopRes.data) {
            dbResults.push({
              result_kind: "shop",
              result_id: s.id,
              title: s.business_name || "Local Shop",
              subtitle: s.business_type || s.city || "Shop",
              image_url: null,
              url: `/store/${s.id}`,
              shop_id: s.id,
              shop_name: s.business_name,
              match_score: 95,
            });
          }
        }

        if (dbResults.length > 0) {
          return dbResults;
        }
      } catch (e) {}

      return [];
    },
  });

  const rawResults: SearchResultItem[] = (search.data ?? []).map((row: any) => ({
    id: `${row.result_kind}-${row.result_id}`,
    title: row.title,
    subtitle: row.subtitle || row.shop_name || row.result_kind,
    type:
      row.result_kind === "shop"
        ? "Shop"
        : row.result_kind === "brand"
          ? "Brand"
          : row.result_kind === "category"
            ? "Category"
            : "Product",
    imageUrl:
      row.image_url ||
      (row.result_kind === "shop"
        ? "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=75"
        : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=75"),
    url: row.url,
    storeId: row.shop_id ?? undefined,
    storeName: row.shop_name ?? undefined,
    price: row.price == null ? undefined : Number(row.price),
    discountPrice: row.discount_price == null ? undefined : Number(row.discount_price),
    distanceKm: row.distance_km == null ? undefined : Number(row.distance_km),
    rating: row.rating == null ? undefined : Number(row.rating),
    reviewCount: row.review_count ?? undefined,
    isOpen: row.is_open ?? undefined,
    availableShopCount: row.available_shop_count ?? undefined,
    brandName: row.brand_name ?? undefined,
    categoryName: row.category_name ?? undefined,
    metadata: row.metadata ?? undefined,
    matchScore: Number(row.match_score ?? 0),
    mlScore: row.ml_score != null ? Number(row.ml_score) : undefined,
    explainabilityTags: Array.isArray(row.explainability_tags) ? row.explainability_tags : undefined,
  }));

  // Always merge with local catalog search so user ALWAYS gets rich results for products and shops!
  const localCatalogResults = trimmedQuery.length > 0 ? getInstantSearchResults(trimmedQuery) : [];

  const resultMap = new Map<string, SearchResultItem>();
  for (const r of rawResults) {
    if (r.title) resultMap.set(r.title.toLowerCase(), r);
  }
  for (const r of localCatalogResults) {
    if (r.title && !resultMap.has(r.title.toLowerCase())) {
      resultMap.set(r.title.toLowerCase(), r);
    }
  }

  const results = Array.from(resultMap.values());

  return {
    results,
    isLoading:
      trimmedQuery.length > 0 &&
      results.length === 0 &&
      (debouncedQuery !== trimmedQuery || search.isLoading),
    error: search.error,
  };
}

