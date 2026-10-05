import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isValidCoordinate } from "@/lib/geo";

/** Fetch the cart shop's pin; never borrow coordinates from a demo placeholder. */
export function useShopCoordinates(id: string | null) {
  return useQuery({
    queryKey: ["shop-coordinates", id],
    enabled: Boolean(id && /^[0-9a-f-]{36}$/i.test(id)),
    staleTime: 60_000,
    retry: 1,
    queryFn: async () => {
      const storefront = await (supabase as any).rpc("get_customer_storefront", {
        p_seller_id: id,
      });
      if (!storefront.error && storefront.data) {
        const { latitude, longitude } = storefront.data;
        if (isValidCoordinate(latitude, longitude)) {
          return { lat: Number(latitude), lng: Number(longitude), source: "store" as const };
        }
      } else if (storefront.error && !["PGRST202", "42883"].includes(storefront.error.code)) {
        throw storefront.error;
      }
      const { data, error } = await (supabase as any)
        .from("approved_vendor_catalog")
        .select("lat,lng")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data && isValidCoordinate(data.lat, data.lng)
        ? { lat: Number(data.lat), lng: Number(data.lng), source: "seller-legacy" as const }
        : null;
    },
  });
}
