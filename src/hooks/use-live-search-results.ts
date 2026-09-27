import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDeliveryLocation } from "@/lib/location-store";
import { hasConfirmedCoordinates } from "@/lib/location-visibility";
import { searchLiveCatalog } from "@/lib/live-search";

export function useLiveSearchResults(query: string) {
  const trimmedQuery = query.trim().replace(/\s+/g, " ");
  const [debouncedQuery, setDebouncedQuery] = useState(trimmedQuery);
  const [location] = useDeliveryLocation();
  const needsLocation = !hasConfirmedCoordinates(location);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(trimmedQuery), 200);
    return () => window.clearTimeout(timer);
  }, [trimmedQuery]);
  const search = useQuery({
    queryKey: ["live-catalog-search-v3", debouncedQuery, location?.lat, location?.lng],
    enabled: !!debouncedQuery && !needsLocation,
    staleTime: 60_000,
    retry: false,
    queryFn: async () => {
      if (!hasConfirmedCoordinates(location)) return [];
      return searchLiveCatalog((name, args) => (supabase as any).rpc(name, args), {
        lat: location.lat, lng: location.lng, query: debouncedQuery,
      });
    },
  });
  const pending = trimmedQuery !== debouncedQuery;
  return {
    results: trimmedQuery && !needsLocation && !pending ? search.data ?? [] : [],
    isLoading: !!trimmedQuery && !needsLocation && (pending || search.isFetching),
    error: pending ? null : search.error,
    needsLocation,
    retry: search.refetch,
  };
}
