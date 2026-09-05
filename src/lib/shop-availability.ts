/* ============================================================
 * Shop Availability — read-only queries for ShorelineShopper
 * ============================================================ */
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ShopStatusKind = "open" | "closed" | "closed_override" | "open_override" | "holiday";

export interface ShopStatus {
  status: ShopStatusKind;
  isOpen: boolean;
  label: string;
  opensAt: string | null;
  closesAt: string | null;
  overrideReason: string | null;
  checkedAt: string;
}

function dbToStatus(r: any): ShopStatus {
  return {
    status: r.status,
    isOpen: r.is_open,
    label: r.label,
    opensAt: r.opens_at,
    closesAt: r.closes_at,
    overrideReason: r.override_reason,
    checkedAt: r.checked_at,
  };
}

/** Single-shop status (used on store detail page) */
export function useShopStatus(sellerId: string | null | undefined) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["shop-status", sellerId],
    enabled: !!sellerId,
    staleTime: 30_000,
    queryFn: async (): Promise<ShopStatus> => {
      const { data, error } = await (supabase as any).rpc("get_shop_status", {
        _seller_id: sellerId,
      });
      if (error) throw error;
      return dbToStatus(data);
    },
  });

  useEffect(() => {
    if (!sellerId) return;
    const channel = supabase
      .channel(`shop-status-${sellerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shop_overrides",
          filter: `seller_id=eq.${sellerId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["shop-status", sellerId] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shop_hours", filter: `seller_id=eq.${sellerId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["shop-status", sellerId] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sellers", filter: `id=eq.${sellerId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["shop-status", sellerId] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sellerId, queryClient]);

  return query;
}

/** Batch statuses for a list of seller IDs (used on home/listing pages) */
export function useShopsStatus(sellerIds: string[]) {
  const key = sellerIds.slice().sort().join(",");
  return useQuery({
    queryKey: ["shops-status", key],
    enabled: sellerIds.length > 0,
    staleTime: 60_000,
    refetchInterval: 120_000,
    queryFn: async (): Promise<Map<string, ShopStatus>> => {
      const { data, error } = await (supabase as any).rpc("get_shops_status", {
        _seller_ids: sellerIds,
      });
      if (error) {
        // Graceful fallback: treat all as open if function not yet deployed
        console.warn("[shop-availability] get_shops_status not available", error.message);
        return new Map();
      }
      const map = new Map<string, ShopStatus>();
      for (const row of data ?? []) {
        map.set(row.seller_id, dbToStatus(row.status_info));
      }
      return map;
    },
  });
}
