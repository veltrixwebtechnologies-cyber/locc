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

const DEFAULT_OPEN_STATUS: ShopStatus = {
  status: "open",
  isOpen: true,
  label: "Open now",
  opensAt: null,
  closesAt: null,
  overrideReason: null,
  checkedAt: new Date().toISOString(),
};

function dbToStatus(r: any): ShopStatus {
  if (!r) return DEFAULT_OPEN_STATUS;
  return {
    status: r.status ?? "open",
    isOpen: r.is_open ?? true,
    label: r.label ?? "Open now",
    opensAt: r.opens_at ?? null,
    closesAt: r.closes_at ?? null,
    overrideReason: r.override_reason ?? null,
    checkedAt: r.checked_at ?? new Date().toISOString(),
  };
}

let isGetShopStatusMissing = false;
let isGetShopsStatusMissing = false;

/** Single-shop status (used on store detail page) */
export function useShopStatus(sellerId: string | null | undefined) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["shop-status", sellerId],
    enabled: Boolean(sellerId) && !isGetShopStatusMissing,
    staleTime: 300_000,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<ShopStatus> => {
      if (isGetShopStatusMissing || !sellerId) return DEFAULT_OPEN_STATUS;
      try {
        const { data, error } = await (supabase as any).rpc("get_shop_status", {
          _seller_id: sellerId,
        });
        if (error) {
          if (error.code === "PGRST202" || String(error.message).includes("Could not find")) {
            isGetShopStatusMissing = true;
          }
          return DEFAULT_OPEN_STATUS;
        }
        return dbToStatus(data);
      } catch {
        return DEFAULT_OPEN_STATUS;
      }
    },
  });

  useEffect(() => {
    if (!sellerId || isGetShopStatusMissing) return;
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
    enabled: sellerIds.length > 0 && !isGetShopsStatusMissing,
    staleTime: 300_000,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<Map<string, ShopStatus>> => {
      if (isGetShopsStatusMissing || sellerIds.length === 0) return new Map();
      try {
        const { data, error } = await (supabase as any).rpc("get_shops_status", {
          _seller_ids: sellerIds,
        });
        if (error) {
          if (error.code === "PGRST202" || String(error.message).includes("Could not find")) {
            isGetShopsStatusMissing = true;
          }
          return new Map();
        }
        const map = new Map<string, ShopStatus>();
        for (const row of data ?? []) {
          map.set(row.seller_id, dbToStatus(row.status_info));
        }
        return map;
      } catch {
        return new Map();
      }
    },
  });
}
