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
    const timer = window.setTimeout(() => setDebouncedQuery(trimmedQuery), 220);
    return () => window.clearTimeout(timer);
  }, [trimmedQuery]);

  const search = useQuery({
    queryKey: ["marketplace-search", debouncedQuery, deliveryLocation.lat, deliveryLocation.lng],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: debouncedQuery.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("search_marketplace_catalog", {
        p_query: debouncedQuery,
        p_lat: deliveryLocation.lat ?? null,
        p_lng: deliveryLocation.lng ?? null,
        p_limit: 24,
        p_offset: 0,
        p_scope: "all",
      });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const results: SearchResultItem[] = (search.data ?? []).map((row: any) => ({
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
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=75",
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
  }));

  const fallbackResults = search.isError ? getInstantSearchResults(trimmedQuery) : [];

  return {
    results: results.length ? results : fallbackResults,
    isLoading: trimmedQuery.length > 0 && (debouncedQuery !== trimmedQuery || search.isLoading),
    error: search.error,
  };
}
