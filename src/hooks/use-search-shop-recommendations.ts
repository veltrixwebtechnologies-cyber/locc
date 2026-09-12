import { useMemo } from "react";
import { useLiveSearchResults } from "./use-live-search-results";
import {
  rankAndGroupShopsBySearchQuery,
  type ShopRecommendation,
} from "@/lib/search-recommendations";

export function useSearchShopRecommendations(
  searchQuery: string,
  currentShopId?: string,
) {
  const trimmed = (searchQuery || "").trim();
  const { results, isLoading, error } = useLiveSearchResults(trimmed);

  const recommendations: ShopRecommendation[] = useMemo(() => {
    if (!trimmed) return [];
    return rankAndGroupShopsBySearchQuery(results, currentShopId);
  }, [results, trimmed, currentShopId]);

  return {
    recommendations,
    isLoading: trimmed.length > 0 && isLoading,
    error,
    searchQuery: trimmed,
  };
}
