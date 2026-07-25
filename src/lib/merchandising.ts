import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";

export type MerchandisingProduct = {
  id: string;
  name: string;
  brand: string | null;
  brand_id: string | null;
  brand_name: string | null;
  category: string | null;
  selling_price: number;
  mrp: number;
  discount_price: number | null;
  discount_starts_at: string | null;
  discount_ends_at: string | null;
  clearance: boolean;
  stock: number;
  image_url: string | null;
  created_at: string;
  average_rating: number;
  review_count: number;
  shop_name: string;
};

const productSelect = "id,name,brand,brand_id,brand_name,category,selling_price,mrp,discount_price,discount_starts_at,discount_ends_at,clearance,stock,image_url,average_rating,review_count,shop_name,created_at";

export function useNewArrivals() {
  return useQuery({
    queryKey: ["merchandising", "new-arrivals"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("public_merchandising_products")
        .select(productSelect)
        .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString())
        .order("created_at", { ascending: false }).limit(12);
      if (error) throw error;
      return (data ?? []) as MerchandisingProduct[];
    },
  });
}

export function useDeals() {
  return useQuery({
    queryKey: ["merchandising", "deals"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await (supabase as any).from("public_merchandising_products")
        .select(productSelect).not("discount_price", "is", null)
        .or(`discount_starts_at.is.null,discount_starts_at.lte.${now}`)
        .or(`discount_ends_at.is.null,discount_ends_at.gt.${now}`)
        .order("discount_price", { ascending: true }).limit(12);
      if (error) throw error;
      return (data ?? []) as MerchandisingProduct[];
    },
  });
}

export function useClearance() {
  return useQuery({
    queryKey: ["merchandising", "clearance"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("public_merchandising_products")
        .select(productSelect).eq("clearance", true).order("discount_price", { ascending: true }).limit(12);
      if (error) throw error;
      return (data ?? []) as MerchandisingProduct[];
    },
  });
}

export function useBestSellers(period: "today" | "this_week" | "this_month" | "all_time" = "all_time") {
  return useQuery({
    queryKey: ["merchandising", "best-sellers", period],
    queryFn: async () => {
      const { data: rankings, error: rankingError } = await (supabase as any).rpc("get_best_sellers", { p_period: period });
      if (rankingError) throw rankingError;
      const ids = (rankings ?? []).map((row: { product_id: string }) => row.product_id);
      if (ids.length === 0) return [] as MerchandisingProduct[];
      const { data, error } = await (supabase as any).from("public_merchandising_products").select(productSelect).in("id", ids);
      if (error) throw error;
      const byId = new Map((data ?? []).map((row: MerchandisingProduct) => [row.id, row]));
      return ids.map((id: string) => byId.get(id)).filter(Boolean) as MerchandisingProduct[];
    },
  });
}

export function useTrending() {
  return useQuery({
    queryKey: ["merchandising", "trending"],
    queryFn: async () => {
      const { data: rankings, error: rankingError } = await (supabase as any).rpc("get_trending_products", { p_limit: 12 });
      if (rankingError) throw rankingError;
      const ids = (rankings ?? []).map((row: { product_id: string }) => row.product_id);
      if (ids.length === 0) return [] as MerchandisingProduct[];
      const { data, error } = await (supabase as any).from("public_merchandising_products").select(productSelect).in("id", ids);
      if (error) throw error;
      const byId = new Map((data ?? []).map((row: MerchandisingProduct) => [row.id, row]));
      return ids.map((id: string) => byId.get(id)).filter(Boolean) as MerchandisingProduct[];
    },
  });
}

export function useFeaturedBrands() {
  return useQuery({
    queryKey: ["merchandising", "featured-brands"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("featured_brands")
        .select("brand_id,display_order,brands(id,name,logo_url)")
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useActiveCollections() {
  return useQuery({
    queryKey: ["merchandising", "collections"],
    queryFn: async () => {
      const [gift, seasonal] = await Promise.all([
        (supabase as any).from("gift_collections").select("id,name,description,image_url").eq("is_active", true).order("display_order").limit(8),
        (supabase as any).from("seasonal_collections").select("id,name,description,image_url").eq("is_active", true).order("display_order").limit(8),
      ]);
      if (gift.error) throw gift.error;
      if (seasonal.error) throw seasonal.error;
      return { gift: gift.data ?? [], seasonal: seasonal.data ?? [] };
    },
  });
}

export function useRecentlyViewed() {
  const auth = useAuth();
  return useQuery({
    queryKey: ["merchandising", "recently-viewed", auth.email || auth.phone],
    enabled: Boolean(auth.email || auth.phone),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("recently_viewed")
        .select("product_id,viewed_at")
        .order("viewed_at", { ascending: false }).limit(30);
      if (error) throw error;
      const ids = (data ?? []).map((row: any) => row.product_id);
      if (!ids.length) return [] as MerchandisingProduct[];
      const products = await (supabase as any).from("public_merchandising_products").select(productSelect).in("id", ids);
      if (products.error) throw products.error;
      const byId = new Map((products.data ?? []).map((row: MerchandisingProduct) => [row.id, row]));
      return ids.map((id: string) => byId.get(id)).filter(Boolean) as MerchandisingProduct[];
    },
  });
}

export function useRecommendedProducts() {
  const recent = useRecentlyViewed();
  const best = useBestSellers();
  return {
    ...recent,
    data: recent.data?.length ? recent.data : best.data,
    isLoading: recent.isLoading || (!recent.data?.length && best.isLoading),
  };
}

export function useWishlist() {
  const auth = useAuth();
  return useQuery({
    queryKey: ["wishlist", auth.email || auth.phone],
    enabled: Boolean(auth.email || auth.phone),
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("wishlist").select("product_id,created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();
  const auth = useAuth();
  return useMutation({
    mutationFn: async ({ productId, active }: { productId: string; active: boolean }) => {
      if (!auth.email && !auth.phone) throw new Error("Sign in to use your wishlist.");
      if (active) {
        const { error } = await (supabase as any).from("wishlist").delete().eq("product_id", productId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("wishlist").insert({ product_id: productId });
        if (error) throw error;
      }
      if (!active) await (supabase as any).from("product_views").insert({ product_id: productId, event_type: "wishlist" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
  });
}

export async function recordProductEvent(productId: string, eventType: "view" | "add_to_cart") {
  await (supabase as any).from("product_views").insert({ product_id: productId, event_type: eventType });
}
