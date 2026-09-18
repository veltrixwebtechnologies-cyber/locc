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
import { rankShopsWithML } from "@/lib/ml-shop-ranker";
import { LocalShoreOffers } from "@/components/localshore-offers";
import { LiquidGlassCategorySelector } from "@/components/liquid-glass-category-selector";
import { PopularBrandsCarousel } from "@/components/popular-brands-carousel";

const getCategoryDisplayName = (catName?: string | null): string => {
  if (!catName || catName === "all") return "";
  return getCategoryByIdOrSlug(catName).name;
};

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => s,
  component: Home,
});

function Home() {
  const search = Route.useSearch() as Record<string, any>;
  const navigate = Route.useNavigate();

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
  const [query, setQuery] = useState(search.q ?? "");
  const [cat, setCat] = useState<string>(search.category ?? "all");
  const approvedProducts = useQuery({
    queryKey: ["approved-product-catalog"],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      try {
        const { data: catData, error: catError } = await (supabase as any)
          .from("approved_product_catalog")
          .select(
            "id,seller_id,name,category,selling_price,image_url,stock,shop_name,business_type,city,state,address_line1",
          )
          .order("created_at", { ascending: false });
        let data = catData;
        if (catError) {
          const fallback = await (supabase as any)
            .from("products")
            .select("id,seller_id,name,category,selling_price,image_url,stock")
            .in("status", ["active", "approved"])
            .order("created_at", { ascending: false });
          data = fallback.data;
        }
        return (data ?? []).filter((p: any) => !isTestEntity(p.name));
      } catch (err) {
        console.warn("Products query fallback:", err);
        return [];
      }
    },
  });

  const approvedVendors = useQuery({
    queryKey: ["approved-vendors"],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("approved_vendor_catalog")
          .select(
            "id,shop_name,business_type,city,state,address_line1,category,shop_logo_path,shop_banner_path",
          );
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
    // Stage 1: browse without a customer location. Keep this deliberately
    // limited and never attach distance/ETA values from seed data.
    if (!hasConfirmedLocation) {
      const normalizedQuery = query.trim().toLowerCase();
      return stores
        .slice(0, 8)
        .filter((store) => {
          if (activeFilter && !isStoreInCategory(store.category, activeFilter, store.rating)) {
            return false;
          }
          if (!normalizedQuery) return true;
          return `${store.name} ${store.tagline} ${store.category}`
            .toLowerCase()
            .includes(normalizedQuery);
        })
        .map((store) => ({ ...store, distanceKm: undefined }));
    }
    const liveProducts = approvedProducts.data ?? [];
    const normalizedQuery = query.trim().toLowerCase();
    const liveSellerIds = new Set(liveProducts.map((product: any) => product.seller_id));
    const liveVendorStores = (approvedVendors.data ?? [])
      .filter((vendor: any) => liveSellerIds.has(vendor.id))
      .map((vendor: any, index: number) => {
        const vLat = Number(vendor.lat);
        const vLng = Number(vendor.lng);
        if (!isValidCoordinate(vLat, vLng)) return null;
        const dKm = calculateHaversineDistanceKm(locLat, locLng, vLat, vLng);
        return {
          ...APPROVED_STORE,
          id: vendor.id,
          name: vendor.shop_name || APPROVED_STORE.name,
          tagline: vendor.business_type || "Approved local vendor",
          category: toStoreCategory(vendor.category),
          address:
            [vendor.address_line1, vendor.city, vendor.state].filter(Boolean).join(", ") ||
            APPROVED_STORE.address,
          imageUrl: vendor.storefront_image_url || APPROVED_STORE.imageUrl,
          distanceKm: Number(dKm.toFixed(1)),
          etaMin: Math.max(10, Math.round(dKm * 5 + 10)),
        };
      });
    const baseStores = stores.map((s) => {
      const sLat = Number(s.lat);
      const sLng = Number(s.lng);
      if (!isValidCoordinate(sLat, sLng)) return null;
      const dKm = calculateHaversineDistanceKm(locLat, locLng, sLat, sLng);
      return {
        ...s,
        distanceKm: Number(dKm.toFixed(1)),
        etaMin: Math.max(10, Math.round(dKm * 5 + 10)),
      };
    });
    const allStores = (
      liveVendorStores.length > 0 ? [...liveVendorStores, ...baseStores] : baseStores
    ).filter((store): store is NonNullable<typeof store> => store !== null);
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
      image_url: isValidImageUrl(product.image_url)
        ? product.image_url
        : getFallbackProductImage(product.name, product.category),
      created_at: "",
      average_rating: 4.6,
      review_count: 14,
      shop_name: product.shop_name || "Approved local seller",
    }));

    const existingIds = new Set(liveProducts.map((product: MerchandisingProduct) => product.id));
    const localFallback = Object.values(productsByStore)
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

    const allProducts = [...liveProducts, ...localFallback];

    // Filter by category or search query
    const filteredProducts = allProducts.filter((product) => {
      const store = stores.find((s) => s.id === product.seller_id);
      const storeCat = store?.category || toStoreCategory(product.category);
      const prodCat = toStoreCategory(product.category);

      if (activeFilter) {
        const matchesCategory =
          isStoreInCategory(storeCat, activeFilter) ||
          isStoreInCategory(prodCat, activeFilter) ||
          isStoreInCategory(product.category, activeFilter) ||
          (product.category &&
            product.category.toLowerCase().includes(activeFilter.toLowerCase())) ||
          (cat && product.category && product.category.toLowerCase().includes(cat.toLowerCase()));
        if (!matchesCategory) return false;
      }

      if (query.trim()) {
        const qWords = query
          .trim()
          .toLowerCase()
          .split(/[\s&,/]+/)
          .filter(Boolean);
        const pName = product.name.toLowerCase();
        const pCat = (product.category || "").toLowerCase();
        const pShop = product.shop_name.toLowerCase();

        const matchesQuery = qWords.some(
          (w: string) => pName.includes(w) || pCat.includes(w) || pShop.includes(w),
        );
        if (!matchesQuery) return false;
      }

      return true;
    });

    // Intelligent fallback: If specific query returns 0 products under an active category,
    // show all products in that category so the user always sees available products!
    if (filteredProducts.length === 0 && activeFilter) {
      return allProducts.filter((product) => {
        const store = stores.find((s) => s.id === product.seller_id);
        const storeCat = store?.category || toStoreCategory(product.category);
        const prodCat = toStoreCategory(product.category);
        return (
          isStoreInCategory(storeCat, activeFilter) ||
          isStoreInCategory(prodCat, activeFilter) ||
          isStoreInCategory(product.category, activeFilter) ||
          (product.category &&
            product.category.toLowerCase().includes(activeFilter.toLowerCase())) ||
          (cat && product.category && product.category.toLowerCase().includes(cat.toLowerCase()))
        );
      });
    }

    return filteredProducts;
  }, [approvedProducts.data, activeFilter, cat, query]);

  const displayCategoryName = useMemo(() => getCategoryDisplayName(cat), [cat]);

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

      {/* The map is the core nearby-shopping discovery experience. */}
      <div id="shops-section" className="scroll-mt-24 px-5 pt-6 md:px-8">
        <LocalShoreMapExperience
          initialQuery={query}
          initialCategory={cat}
          onQueryChange={(q) => {
            startTransition(() => {
              navigate({
                search: (prev) => ({ ...prev, q: q || undefined }),
                resetScroll: false,
              });
            });
          }}
          onCategoryChange={(c) => {
            startTransition(() => {
              navigate({
                search: (prev) => ({ ...prev, category: c === "all" ? undefined : c }),
                resetScroll: false,
              });
            });
          }}
        />
      </div>

      <section className="px-5 pb-8 md:px-8">
        <h2 className="mb-4 font-display text-xl font-bold text-foreground">
          {hasConfirmedLocation ? "Shops near you" : "Recommended Shops"}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.slice(0, 8).map((store) => (
            <ShopCard
              key={store.id}
              shop={{
                id: store.id,
                name: store.name,
                category: categoryLabel[store.category] ?? store.category,
                imageUrl: store.imageUrl,
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
          {filtered.length === 0 && (
            <div className="col-span-full">
              <EmptyState />
            </div>
          )}
        </div>
      </section>

      {/* Keep the yellow deal rail as the final homepage content before the footer. */}
      <section aria-labelledby="highlighted-deals-heading" className="mt-2 pb-6 pt-2">
        <h2
          id="highlighted-deals-heading"
          className="px-5 pb-1 font-display text-lg font-bold text-foreground md:px-8 md:text-2xl"
        >
          Highlighted deals
        </h2>
        <SwiggyTopDealsStrip />
      </section>

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
          {Array.from(
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
