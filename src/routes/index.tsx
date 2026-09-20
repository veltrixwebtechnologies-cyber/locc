import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, startTransition } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AwningCard } from "@/components/awning-card";
import { ShopCard } from "@/components/shop-card";
import {
  stores,
  deliveryCategories,
  productsByStore,
  APPROVED_STORE,
  type StoreCategory,
  categoryLabel,
} from "@/lib/mock-data";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MerchandisingSections, ProductCard } from "@/components/merchandising-sections";
import { PromoCarousel } from "@/components/promo-carousel";
import { MarketplaceAdStrip } from "@/components/marketplace-ad-strip";
import type { MerchandisingProduct } from "@/lib/merchandising";
import { Reveal } from "@/components/motion/presets";
import { MarketplaceDiscovery } from "@/components/marketplace-discovery";
import { SwiggyShopRow, SwiggyQuickCategories } from "@/components/swiggy-shop-row";
import { CategoryDiscoveryView } from "@/components/category-discovery-view";
import {
  SwiggyTopDealsStrip,
  SwiggyFeaturedBanner,
  Swiggy99StoreSection,
} from "@/components/swiggy-inspiration-sections";
import { ReferenceHomeHero } from "@/components/reference-home-hero";
import { LocalShoreMapExperience } from "@/components/map/localshore-map-experience";
import { isValidCoordinate } from "@/lib/geo";
import {
  FlipkartCategoryStrip,
  FlipkartBannerRow,
  FlipkartBestDealsShowcase,
} from "@/components/flipkart-deals-showcase";
import { getFallbackProductImage, isValidImageUrl } from "@/lib/image-utils";
import { scrollToShops } from "@/lib/scroll-utils";
import { EcosystemMerchandisingStrips } from "@/components/ecosystem-merchandising-strips";
import { isTestEntity } from "@/lib/map-service/store-engine";
import { useDeliveryLocation } from "@/lib/location-store";
import { getCategoryByIdOrSlug, toStoreCategory, isStoreInCategory } from "@/lib/shop-categories";
import { calculateHaversineDistanceKm } from "@/lib/map-service/providers";
import { CUSTOMER_VISIBILITY_RADIUS_KM, hasConfirmedCoordinates } from "@/lib/location-visibility";

const DEMO_SHOP_FEATURES: Partial<Record<StoreCategory, { name: string; imageUrl: string }>> = {
  fruits_veg: { name: "Tomato", imageUrl: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=640&q=80" },
  meat_fish: { name: "Chicken", imageUrl: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=640&q=80" },
  bakery: { name: "Birthday Cake", imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=640&q=80" },
  grocery: { name: "Rice", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=640&q=80" },
  pharmacy: { name: "Paracetamol", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=640&q=80" },
  fashion: { name: "T-Shirts", imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=640&q=80" },
  electronics: { name: "Smartphones", imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=640&q=80" },
  home_kitchen: { name: "Cookware", imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=640&q=80" },
};
import { rankShopsWithML } from "@/lib/ml-shop-ranker";
import { LocalShoreOffers } from "@/components/localshore-offers";
import { LiquidGlassCategorySelector } from "@/components/liquid-glass-category-selector";
import { PopularBrandsCarousel } from "@/components/popular-brands-carousel";

const getCategoryDisplayName = (catName?: string | null): string => {
  if (!catName || catName === "all") return "";
  return getCategoryByIdOrSlug(catName).name;
};

export const Route = createFileRoute("/")({
  head: () => ({
    links: [
      {
        rel: "preload",
        href: "/assets/shoreline-rider-cutout.webp",
        as: "image",
        fetchPriority: "high",
      },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => s,
  component: Home,
});

function Home() {
  const search = Route.useSearch() as Record<string, any>;
  const navigate = Route.useNavigate();
  const [isNearbyMapOpen, setIsNearbyMapOpen] = useState(false);

  useEffect(() => {
    const openMap = () => setIsNearbyMapOpen(true);
    window.addEventListener("localshore_open_nearby_map", openMap);
    return () => window.removeEventListener("localshore_open_nearby_map", openMap);
  }, []);

  useEffect(() => {
    if (
      search.subcategory ||
      search.sub_category ||
      search.productType ||
      search.product_type ||
      (search.category && search.category !== "all" && search.category !== "all-shops")
    ) {
      void navigate({
        to: "/search",
        search: search,
        replace: true,
      });
    }
  }, [search, navigate]);

  const [deliveryLoc] = useDeliveryLocation();
  const locLat = deliveryLoc?.lat;
  const locLng = deliveryLoc?.lng;
  const hasConfirmedLocation =
    typeof locLat === "number" && typeof locLng === "number" && isValidCoordinate(locLat, locLng);
  const operationalZone = useQuery({
    queryKey: ["customer-operational-zone", locLat, locLng],
    enabled: hasConfirmedLocation,
    staleTime: 1000 * 60 * 30,
    retry: false,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_customer_operational_zone", {
        p_lat: locLat,
        p_lng: locLng,
      });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
  const [query, setQuery] = useState(search.q ?? "");
  const [cat, setCat] = useState<string>(search.category ?? "all");
  const approvedProducts = useQuery({
    queryKey: ["homepage-visible-products", locLat, locLng],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!hasConfirmedCoordinates(deliveryLoc)) return [];
      try {
        const { data, error } = await (supabase as any).rpc("get_customer_visible_products", {
          p_lat: deliveryLoc.lat, p_lng: deliveryLoc.lng, p_query: null,
          p_category_slug: null, p_limit: 100, p_offset: 0,
        });
        if (error) throw error;
        return (data ?? []).filter((p: any) => !isTestEntity(p.name));
      } catch (err) {
        console.warn("Products query fallback:", err);
        return [];
      }
    },
  });

  const approvedVendors = useQuery({
    queryKey: ["homepage-visible-shops", locLat, locLng],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!hasConfirmedCoordinates(deliveryLoc)) return [];
      try {
        const { data, error } = await (supabase as any).rpc("get_customer_visible_shops", {
          p_lat: deliveryLoc.lat, p_lng: deliveryLoc.lng, p_query: null,
          p_category_slug: null, p_limit: 100, p_offset: 0,
        });
        if (error) throw error;
        const rows = (data ?? []).filter((v: any) => !isTestEntity(v.shop_name));
        const paths = Array.from(
          new Set(
            rows
              .flatMap((vendor: any) => [vendor.shop_banner_path, vendor.shop_logo_path])
              .filter(Boolean),
          ),
        ) as string[];
        const signedByPath = new Map<string, string>();
        if (paths.length > 0) {
          try {
            const { data: signed } = await supabase.storage
              .from("seller-docs")
              .createSignedUrls(paths, 60 * 60);
            for (const item of signed ?? []) {
              if (item.path && item.signedUrl) signedByPath.set(item.path, item.signedUrl);
            }
          } catch (storageErr) {
            console.warn("Storage signed url query skipped:", storageErr);
          }
        }
        return rows.map((vendor: any) => ({
          ...vendor,
          storefront_image_url:
            signedByPath.get(vendor.shop_banner_path) ??
            signedByPath.get(vendor.shop_logo_path) ??
            null,
        }));
      } catch (err) {
        console.warn("Vendors query fallback:", err);
        return [];
      }
    },
  });

  const [visibleProductLimit, setVisibleProductLimit] = useState(15);

  useEffect(() => {
    setQuery(search.q ?? "");
    setCat(search.category ?? "all");
    setVisibleProductLimit(15);

    if (search.category !== undefined || (search.q && search.q.trim().length > 0)) {
      scrollToShops();
    }
  }, [search.category, search.q]);

  const activeFilter = useMemo(() => {
    if (!cat || cat === "all" || cat === "all-shops") return undefined;
    return cat;
  }, [cat]);

  const filtered = useMemo(() => {
    if (!hasConfirmedLocation) return [];
    const liveProducts = approvedProducts.data ?? [];
    const normalizedQuery = query.trim().toLowerCase();
    // Use each seller's own in-stock catalog image for their nearby shop card.
    // This prevents unrelated category/stock imagery from being presented as that shop's products.
    const featuredProductBySeller = new Map<string, any>();
    for (const product of liveProducts) {
      if (!product?.seller_id || featuredProductBySeller.has(product.seller_id)) continue;
      if (Number(product.stock ?? 1) <= 0) continue;
      featuredProductBySeller.set(product.seller_id, product);
    }
    const liveVendorStores = (approvedVendors.data ?? [])
      .map((vendor: any, index: number) => {
        const vLat = Number(vendor.lat);
        const vLng = Number(vendor.lng);
        if (!isValidCoordinate(vLat, vLng)) return null;
        const dKm = Number(vendor.distance_km ?? 0);
        const featuredProduct = featuredProductBySeller.get(vendor.id);
        // The RPC's `category` is derived from a product row and can be stale or
        // miscategorized. Seller.business_type is the authoritative shop category.
        const storeCategory = toStoreCategory(vendor.business_type || vendor.category);
        const demoFeature = /^localshore\s+(?:demo\s+)?(?:CBE|BLR)-\d{2}\b/i.test(vendor.shop_name || "")
          ? DEMO_SHOP_FEATURES[storeCategory]
          : undefined;
        const productImage = isValidImageUrl(featuredProduct?.image_url) &&
          !String(featuredProduct.image_url).includes("photo-1542838132-92c53300491e")
          ? featuredProduct.image_url
          : null;
        return {
          ...APPROVED_STORE,
          id: vendor.id,
          name: vendor.shop_name || APPROVED_STORE.name,
          tagline: vendor.business_type || "Approved local vendor",
          category: storeCategory,
          address:
            [vendor.address_line1, vendor.city, vendor.state].filter(Boolean).join(", ") ||
            APPROVED_STORE.address,
          imageUrl:
            demoFeature?.imageUrl ||
            productImage ||
            vendor.storefront_image_url ||
            getFallbackProductImage(vendor.shop_name, vendor.category || vendor.business_type),
          featuredProductName: demoFeature?.name || featuredProduct?.name,
          distanceKm: Number(dKm.toFixed(1)),
          etaMin: Math.max(10, Math.round(dKm * 5 + 10)),
        };
      });
    const allStores = liveVendorStores
      .filter((store): store is NonNullable<typeof store> => store !== null)
      .filter((store) => (store.distanceKm ?? Infinity) <= CUSTOMER_VISIBILITY_RADIUS_KM);
    const filteredList = allStores.filter((s) => {
      if (activeFilter && !isStoreInCategory(s.category, activeFilter, s.rating)) return false;
      if (
        normalizedQuery &&
        !s.name.toLowerCase().includes(normalizedQuery) &&
        !s.tagline.toLowerCase().includes(normalizedQuery) &&
        !liveProducts.some(
          (product: any) =>
            product.seller_id === s.id &&
            (product.name?.toLowerCase().includes(normalizedQuery) ||
              product.category?.toLowerCase().includes(normalizedQuery)),
        )
      ) {
        return false;
      }
      return true;
    });

    const mlRanked = rankShopsWithML(
      filteredList.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        lat: s.lat,
        lng: s.lng,
        rating: s.rating,
        is_open: true,
      })),
      locLat,
      locLng,
      query,
    );

    const mlScoreById = new Map(mlRanked.map((r) => [r.id, r.total_ml_score]));

    return filteredList.sort((a, b) => {
      const scoreA = mlScoreById.get(a.id) ?? 50;
      const scoreB = mlScoreById.get(b.id) ?? 50;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return a.distanceKm - b.distanceKm;
    });
  }, [
    activeFilter,
    query,
    approvedProducts.data,
    approvedVendors.data,
    deliveryLoc,
    hasConfirmedLocation,
  ]);

  const homepageProducts = useMemo<MerchandisingProduct[]>(() => {
    const liveProducts = (approvedProducts.data ?? []).map((product: any) => ({
      id: product.id,
      seller_id: product.seller_id,
      name: product.name,
      brand: null,
      brand_id: null,
      brand_name: null,
      category: product.category ?? null,
      selling_price: Number(product.selling_price ?? 0),
      mrp: Number(product.selling_price ?? 0),
      discount_price: null,
      discount_starts_at: null,
      discount_ends_at: null,
      clearance: false,
      stock: Number(product.stock ?? 20),
      image_url: isValidImageUrl(product.image_url) &&
        !product.image_url.includes("photo-1542838132-92c53300491e")
        ? product.image_url
        : getFallbackProductImage(product.name, product.category),
      created_at: "",
      average_rating: 4.6,
      review_count: 14,
      shop_name: product.shop_name || "Approved local seller",
    }));

    const existingIds = new Set(liveProducts.map((product: MerchandisingProduct) => product.id));
    const localFallback = hasConfirmedLocation ? [] : Object.values(productsByStore)
      .flat()
      .filter((product) => !existingIds.has(product.id))
      .map((product: (typeof productsByStore)[string][number]) => {
        const store = stores.find((s) => s.id === product.storeId);
        return {
          id: product.id,
          seller_id: product.storeId,
          name: product.name,
          brand: null,
          brand_id: null,
          brand_name: null,
          category: product.category,
          selling_price: Number(product.price),
          mrp: Number(product.price),
          discount_price: null,
          discount_starts_at: null,
          discount_ends_at: null,
          clearance: false,
          stock: Number(product.stock ?? 20),
          image_url: isValidImageUrl(product.imageUrl)
            ? product.imageUrl!
            : getFallbackProductImage(product.name, product.category),
          created_at: "",
          average_rating: store?.rating ?? 4.5,
          review_count: 18,
          shop_name: store?.name ?? "Local Shore seller",
        };
      });

    const allProducts = hasConfirmedLocation ? liveProducts : [];

    // Recommendations use the complete nearby catalog. Search and category
    // filters narrow the nearby-shop list above, but do not empty this rail.
    return allProducts;
  }, [approvedProducts.data, hasConfirmedLocation]);

  const displayCategoryName = useMemo(() => getCategoryDisplayName(cat), [cat]);
  const nearbyLoading =
    hasConfirmedLocation && (approvedVendors.isLoading || approvedProducts.isLoading);

  return (
    <AppShell>
      {/* Swiggy-Style Hero Landing Section */}
      <ReferenceHomeHero />

      {/* Image-led category navigation sits directly beneath the Orchid hero. */}
      <LiquidGlassCategorySelector />

      {/* Existing promotional ads restored below the coded reference-style front page. */}
      <PromoCarousel />
      <SwiggyFeaturedBanner />
      <PopularBrandsCarousel />

      <LocalShoreOffers />

      {/* Server-filtered nearby shops: always limited to the customer's 5 km radius. */}
      <section id="shops-section" className="px-5 pb-8 md:px-8">
        <h2 className="mb-4 font-display text-xl font-bold text-foreground">
          {hasConfirmedLocation
            ? `Shops within ${CUSTOMER_VISIBILITY_RADIUS_KM} km around you`
            : "Choose your location to see nearby shops"}
        </h2>
        {hasConfirmedLocation && !deliveryLoc?.isGPS && (
          <p className="-mt-2 mb-4 text-xs text-muted-foreground">
            Around {deliveryLoc?.area || deliveryLoc?.label || operationalZone.data?.zone_name || "your selected location"} · based on your selected location.
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {nearbyLoading
            ? Array.from({ length: 8 }, (_, index) => <ShopCardSkeleton key={`shop-skeleton-${index}`} />)
            : filtered.slice(0, 8).map((store) => (
            <ShopCard
              key={store.id}
              shop={{
                id: store.id,
                name: store.name,
                category: categoryLabel[store.category] ?? store.category,
                imageUrl: store.imageUrl,
                featuredProductName: store.featuredProductName,
                rating: store.rating,
                distanceKm: store.distanceKm,
                isOpen: store.isOpen,
                address: store.address,
                description: store.tagline,
              }}
              variant="wide"
              className="h-full max-w-none"
            />
          ))}
          {!nearbyLoading && filtered.length === 0 && (
            <div className="col-span-full">
              <EmptyState />
            </div>
          )}
        </div>
      </section>

      {/* Yellow sliding deals rail */}
      <section aria-labelledby="highlighted-deals-heading" className="mt-2 pb-6 pt-2">
        <h2
          id="highlighted-deals-heading"
          className="px-5 pb-1 font-display text-lg font-bold text-foreground md:px-8 md:text-2xl"
        >
          Highlighted deals
        </h2>
        <SwiggyTopDealsStrip />
      </section>

      {/* Local shop picks below the deals rail */}
      <section aria-labelledby="local-products-heading" className="px-5 pb-8 md:px-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2
              id="local-products-heading"
              className="font-display text-xl font-bold text-foreground"
            >
              Popular picks from local shops
            </h2>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              Fresh products available from different neighborhood sellers
            </p>
          </div>
          <Link
            to="/search"
            search={{ q: undefined, category: undefined }}
            className="shrink-0 text-xs font-bold text-primary hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {nearbyLoading
            ? Array.from({ length: 8 }, (_, index) => (
                <div
                  key={`product-skeleton-${index}`}
                  className="h-52 animate-pulse rounded-2xl bg-muted/70"
                  aria-hidden="true"
                />
              ))
            : Array.from(
            new Map(
              homepageProducts
                .filter((product) => product.stock > 0)
                .map((product) => [product.seller_id, product]),
            ).values(),
          )
            .slice(0, 8)
            .map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
        </div>
      </section>

      {isNearbyMapOpen && (
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-background">
          <button
            type="button"
            onClick={() => setIsNearbyMapOpen(false)}
            className="absolute right-3 top-3 z-[130] hidden rounded-full bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow-md ring-1 ring-slate-200 hover:bg-slate-50 lg:block"
            aria-label="Close nearby shops map"
          >
            Close map
          </button>
          <LocalShoreMapExperience
            initialMapOpen
            onCloseMap={() => setIsNearbyMapOpen(false)}
          />
        </div>
      )}

    </AppShell>
  );
}

function EmptyState() {
  return (
    <Reveal className="rounded-xl border hairline bg-card p-6 text-center">
      <p className="font-display text-lg">No shops match that.</p>
      <p className="mt-1 text-sm text-muted-foreground">
        No stores near you yet — try expanding your search radius or clearing filters.
      </p>
    </Reveal>
  );
}

function ShopCardSkeleton() {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm"
      aria-hidden="true"
    >
      <div className="aspect-[16/10] max-[639px]:aspect-[16/7] bg-muted" />
      <div className="space-y-3 p-4 max-[639px]:p-3">
        <div className="h-3 w-1/3 rounded bg-muted" />
        <div className="h-5 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="h-12 rounded-2xl bg-muted/80" />
        <div className="h-10 rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
