import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isValidCoordinate } from "@/lib/geo";

/** Fetch the cart shop's pin; never borrow coordinates from a demo placeholder. */
export function useShopCoordinates(id: string | null) {
  return useQuery({
    queryKey: ["shop-coordinates", id],
    enabled: Boolean(id && (/^[0-9a-f-]{36}$/i.test(id) || /^imported:[0-9a-f-]{36}$/i.test(id))),
    staleTime: 60_000,
    retry: 1,
    queryFn: async () => {
      if (id?.startsWith("imported:")) {
        const { data, error } = await (supabase as any).from("imported_shops")
          .select("latitude,longitude").eq("id", id.slice(9)).maybeSingle();
        if (error) throw error;
        return data && isValidCoordinate(data.latitude, data.longitude)
          ? { lat: Number(data.latitude), lng: Number(data.longitude) } : null;
      }
      const {data, error} = await (supabase as any).from("approved_vendor_catalog")
        .select("lat,lng").eq("id", id).maybeSingle();
      if (error) throw error;
      return data && isValidCoordinate(data.lat, data.lng)
        ? {lat: Number(data.lat), lng: Number(data.lng)} : null;
    },
  });
}
