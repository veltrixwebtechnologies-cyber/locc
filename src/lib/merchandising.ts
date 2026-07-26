import { useEffect, useId } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";

export type MerchandisingProduct = {
  id: string;
  seller_id: string;
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

export type WishlistCatalogItem = {
  productId: string;
  name: string;
  shopName: string;
  category: string;
  price: number;
  imageUrl?: string;
  sellerId?: string;
};

const productSelect = "id,seller_id,name,brand,brand_id,brand_name,category,selling_price,mrp,discount_price,discount_starts_at,discount_ends_at,clearance,stock,image_url,average_rating,review_count,shop_name,created_at";

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
  const queryClient = useQueryClient();
  const channelId = useId();
  const accountKey = auth.email || auth.phone || "signed-out";

  useEffect(() => {
    if (!auth.email && !auth.phone) return;

    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ["wishlist", accountKey] });
    };
    const channel = supabase
      .channel(`wishlist-sync-${accountKey}-${channelId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "wishlist" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "wishlist_entries" }, refresh)
      .subscribe();

    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      void supabase.removeChannel(channel);
    };
  }, [accountKey, auth.email, auth.phone, queryClient, channelId]);

  return useQuery({
    queryKey: ["wishlist", accountKey],
    enabled: Boolean(auth.email || auth.phone),
    refetchInterval: 10_000,
    queryFn: async () => {
      const [savedProducts, savedEntries] = await Promise.all([
        (supabase as any).from("wishlist").select("product_id,created_at").order("created_at", { ascending: false }),
        (supabase as any).from("wishlist_entries").select("item_key,created_at").order("created_at", { ascending: false }),
      ]);
      if (savedProducts.error) throw savedProducts.error;
      if (savedEntries.error) throw savedEntries.error;
      return [
        ...(savedProducts.data ?? []).map((row: { product_id: string; created_at: string }) => ({ product_id: row.product_id, created_at: row.created_at })),
        ...(savedEntries.data ?? []).map((row: { item_key: string; created_at: string }) => ({ product_id: row.item_key, created_at: row.created_at })),
      ].sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
  });
}

export function useWishlistProducts() {
  const wishlist = useWishlist();
  return useQuery({
    queryKey: ["wishlist-products", wishlist.data?.map((item: { product_id: string }) => item.product_id).join(",")],
    enabled: Boolean(wishlist.data?.length),
    queryFn: async () => {
      const ids = (wishlist.data ?? []).map((item: { product_id: string }) => item.product_id);
      if (!ids.length) return [] as MerchandisingProduct[];
      const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      const liveIds = ids.filter(isUuid);
      const catalogIds = ids.filter((id: string) => !isUuid(id));
      const [liveProducts, catalogEntries] = await Promise.all([
        liveIds.length
          ? (supabase as any).from("public_merchandising_products").select(productSelect).in("id", liveIds)
          : Promise.resolve({ data: [], error: null }),
        catalogIds.length
          ? (supabase as any).from("wishlist_entries").select("item_key,product_name,shop_name,category,price,image_url,seller_id,created_at").in("item_key", catalogIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (liveProducts.error) throw liveProducts.error;
      if (catalogEntries.error) throw catalogEntries.error;
      const byId = new Map<string, MerchandisingProduct>();
      for (const product of liveProducts.data ?? []) byId.set(product.id, product as MerchandisingProduct);
      for (const entry of catalogEntries.data ?? []) {
        byId.set(entry.item_key, {
          id: entry.item_key,
          seller_id: entry.seller_id ?? entry.item_key.split("-p")[0],
          name: entry.product_name,
          brand: null,
          brand_id: null,
          brand_name: null,
          category: entry.category,
          selling_price: Number(entry.price),
          mrp: Number(entry.price),
          discount_price: null,
          discount_starts_at: null,
          discount_ends_at: null,
          clearance: false,
          stock: 1,
          image_url: entry.image_url,
          created_at: entry.created_at,
          average_rating: 0,
          review_count: 0,
          shop_name: entry.shop_name,
        });
      }
      return ids.map((id: string) => byId.get(id)).filter(Boolean) as MerchandisingProduct[];
    },
  });
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();
  const auth = useAuth();
  return useMutation({
    mutationFn: async ({ productId, active, item }: { productId: string; active: boolean; item?: WishlistCatalogItem }) => {
      if (!auth.email && !auth.phone) throw new Error("Sign in to use your wishlist.");
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(productId);
      if (active) {
        const result = isUuid
          ? await (supabase as any).from("wishlist").delete().eq("product_id", productId)
          : await (supabase as any).from("wishlist_entries").delete().eq("item_key", productId);
        if (result.error) throw result.error;
      } else {
        if (isUuid) {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError || !userData.user) throw userError ?? new Error("Sign in to use your wishlist.");
          const { error } = await (supabase as any).from("wishlist").insert({ user_id: userData.user.id, product_id: productId });
          if (error) throw error;
        } else {
          if (!item) throw new Error("Product details are required for this catalog item.");
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError || !userData.user) throw userError ?? new Error("Sign in to use your wishlist.");
          const { error } = await (supabase as any).from("wishlist_entries").insert({
            user_id: userData.user.id,
            item_key: productId,
            product_name: item.name,
            shop_name: item.shopName,
            category: item.category,
            price: item.price,
            image_url: item.imageUrl ?? null,
            seller_id: item.sellerId ?? null,
          });
          if (error) throw error;
        }
      }
      if (!active && isUuid) await (supabase as any).from("product_views").insert({ product_id: productId, event_type: "wishlist" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist-products"] });
    },
  });
}

export async function recordProductEvent(productId: string, eventType: "view" | "add_to_cart") {
  await (supabase as any).from("product_views").insert({ product_id: productId, event_type: eventType });
}
