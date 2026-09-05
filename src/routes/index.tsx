import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AwningCard } from "@/components/awning-card";
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
import { HeroSection } from "@/components/hero-section";
import { LocalShoreMapExperience } from "@/components/map/localshore-map-experience";
import {
  FlipkartCategoryStrip,
  FlipkartBannerRow,
  FlipkartBestDealsShowcase,
} from "@/components/flipkart-deals-showcase";
import { getFallbackProductImage, isValidImageUrl } from "@/lib/image-utils";
import { scrollToShops } from "@/lib/scroll-utils";
import { EcosystemMerchandisingStrips } from "@/components/ecosystem-merchandising-strips";
import { isTestEntity } from "@/lib/map-service/store-engine";

const getCategoryDisplayName = (catName?: string | null): string => {
  if (!catName) return "";
  const lower = catName.toLowerCase();
  if (categoryLabel[lower as StoreCategory]) return categoryLabel[lower as StoreCategory];
  if (lower === "flour_mill") return "Flour & Masala Mill (மாவு & மசாலா ஆலை)";
  if (lower === "palamuthir") return "Palamuthir Nilayam";
  if (lower === "meat_fish") return "Meat, Fish & Chicken";
  if (lower === "fashion_accessories") return "Chain & Kammal Gifts";
  if (lower === "boutiques") return "Designer Boutiques";
  if (lower === "showrooms") return "Showrooms";
  if (lower === "fast_fashion") return "Fast Fashion (Branded)";
  if (lower === "individual_fashion") return "Individual Fashion";
  if (lower === "kitchen_appliances") return "Kitchen Utensils & Appliances";
  if (lower === "home_decor") return "Home Interior Decor";
  if (lower === "grocery" || lower === "fresh" || lower === "ready") return "Daily Grocery";
  if (lower === "pharmacy" || lower === "wellness" || lower === "personal" || lower === "care" || lower.includes("pharm")) return "Pharmacy & Care";
  if (lower === "bakery" || lower === "snacks" || lower.includes("bake")) return "Fresh Bakery";
  if (lower === "stationery" || lower === "electronics" || lower === "tech") return "Books & Tech";
  return catName.replace(/_/g, " ").replace(/-/g, " ");
};

const toStoreCategory = (value?: string | null): StoreCategory => {
  const category = (value ?? "").toLowerCase();
  if (category.includes("palamuthir") || category.includes("fruit") || category.includes("veggie")) return "palamuthir";
  if (category.includes("flour") || category.includes("mill") || category.includes("maavu") || category.includes("batter")) return "flour_mill";
  if (category.includes("meat") || category.includes("fish") || category.includes("chicken") || category.includes("mutton")) return "meat_fish";
  if (category.includes("kammal") || category.includes("chain") || category.includes("accessory") || category.includes("gift") || category.includes("earring")) return "fashion_accessories";
  if (category.includes("boutique") || category.includes("silk") || category.includes("saree") || category.includes("stitching")) return "boutiques";
  if (category.includes("showroom") || category.includes("appliance")) return "showrooms";
  if (category.includes("fast_fashion") || category.includes("brand") || category.includes("zudio")) return "fast_fashion";
  if (category.includes("individual_fashion") || category.includes("cloth") || category.includes("garment") || category.includes("dhoti")) return "individual_fashion";
  if (category.includes("kitchen") || category.includes("vessel") || category.includes("cooker") || category.includes("mixer")) return "kitchen_appliances";
  if (category.includes("decor") || category.includes("interior") || category.includes("curtain") || category.includes("brass")) return "home_decor";
  if (
    category.includes("pharm") ||
    category.includes("pharam") ||
    category.includes("wellness") ||
    category.includes("care") ||
    category.includes("med") ||
    category.includes("health")
  ) {
    return "pharmacy";
  }
  if (
    category.includes("station") ||
    category.includes("book") ||
    category.includes("office") ||
    category.includes("paper")
  ) {
    return "stationery";
  }
  if (
    category.includes("bake") ||
    category.includes("cake") ||
    category.includes("bread") ||
    category.includes("pastry")
  ) {
    return "bakery";
  }
  return "grocery";
};

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => ({
    category: typeof s.category === "string" ? s.category : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  component: Home,
});

function Home() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
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
        let { data, error } = await (supabase as any)
          .from("approved_product_catalog")
          .select(
            "id,seller_id,name,category,selling_price,image_url,stock,shop_name,business_type,city,state,address_line1",
          )
          .order("created_at", { ascending: false });
        if (error) {
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

  const activeFilter: StoreCategory | undefined = useMemo(() => {
    if (!cat || cat === "all") return undefined;
    const catLower = cat.toLowerCase();
    if (catLower === "grocery" || catLower === "pharmacy" || catLower === "stationery" || catLower === "bakery") {
      return catLower as StoreCategory;
    }
    if (catLower === "tech" || catLower === "electronics" || catLower === "home") {
      return "stationery";
    }
    if (catLower === "wellness" || catLower === "personal" || catLower === "care" || catLower === "meds") {
      return "pharmacy";
    }
    if (catLower === "snacks" || catLower === "bakes") {
      return "bakery";
    }
    const found = deliveryCategories.find((c) => c.id.toLowerCase() === catLower)?.filter;
    if (found) return found;
    return toStoreCategory(catLower);
  }, [cat]);

  const filtered = useMemo(() => {
    const liveProducts = approvedProducts.data ?? [];
    const normalizedQuery = query.trim().toLowerCase();
    const liveSellerIds = new Set(liveProducts.map((product: any) => product.seller_id));
    const liveVendorStores = (approvedVendors.data ?? [])
      .filter((vendor: any) => liveSellerIds.has(vendor.id))
      .map((vendor: any, index: number) => ({
        ...APPROVED_STORE,
        id: vendor.id,
        name: vendor.shop_name || APPROVED_STORE.name,
        tagline: vendor.business_type || "Approved local vendor",
        category: toStoreCategory(vendor.category),
        address:
          [vendor.address_line1, vendor.city, vendor.state].filter(Boolean).join(", ") ||
          APPROVED_STORE.address,
        imageUrl: vendor.storefront_image_url || APPROVED_STORE.imageUrl,
        distanceKm: 2 + index * 0.2,
      }));
    const allStores = liveVendorStores.length > 0 ? [...liveVendorStores, ...stores] : stores;
    return allStores.filter((s) => {
      if (activeFilter && s.category !== activeFilter) return false;
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
  }, [activeFilter, query, approvedProducts.data, approvedVendors.data]);

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
          storeCat === activeFilter ||
          prodCat === activeFilter ||
          (product.category && product.category.toLowerCase().includes(activeFilter.toLowerCase())) ||
          (cat && product.category && product.category.toLowerCase().includes(cat.toLowerCase()));
        if (!matchesCategory) return false;
      }

      if (query.trim()) {
        const qWords = query.trim().toLowerCase().split(/[\s&,/]+/).filter(Boolean);
        const pName = product.name.toLowerCase();
        const pCat = (product.category || "").toLowerCase();
        const pShop = product.shop_name.toLowerCase();

        const matchesQuery = qWords.some((w) =>
          pName.includes(w) || pCat.includes(w) || pShop.includes(w)
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
          storeCat === activeFilter ||
          prodCat === activeFilter ||
          (product.category && product.category.toLowerCase().includes(activeFilter.toLowerCase())) ||
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
      <HeroSection />

      {/* Main Promo Carousel (Swiggy / Local Shore Banners) */}
      <PromoCarousel />

      {/* 1. Swiggy Top Yellow Deals Carousel Strip */}
      <SwiggyTopDealsStrip />

      {/* 2. Swiggy Featured Merchant Ad Banner */}
      <SwiggyFeaturedBanner />

      {/* Shops section — full-width split view matching reference design */}
      <div id="shops-section" className="scroll-mt-24 px-5 pt-6 md:px-8">
        <LocalShoreMapExperience
          initialQuery={query}
          initialCategory={cat}
          onQueryChange={(q) => {
            navigate({
              search: (prev) => ({ ...prev, q: q || undefined }),
              resetScroll: false,
            });
          }}
          onCategoryChange={(c) => {
            navigate({
              search: (prev) => ({ ...prev, category: c === "all" ? undefined : c }),
              resetScroll: false,
            });
          }}
        />
      </div>

      {/* Swiggy-style quick category icon strip - Placed right after Map View */}
      <SwiggyQuickCategories />

      <div className="px-5 md:px-8">
        {/* Active category filter bar */}
        {((cat && cat !== "all") || query) && (
          <div className="mx-5 mb-4 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 md:mx-8">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground md:text-sm">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span>
                {cat && cat !== "all" ? (
                  <>Filtering by: <strong className="text-primary">{displayCategoryName}</strong></>
                ) : null}
                {query ? (
                  <>{cat && cat !== "all" ? " · " : ""}Matching: <strong className="text-primary">"{query}"</strong></>
                ) : null}
              </span>
            </div>
            <Link
              to="/"
              search={{ category: undefined, q: undefined }}
              className="rounded-lg bg-background px-3 py-1 text-xs font-bold text-primary shadow-xs hover:bg-muted"
            >
              Clear filter ×
            </Link>
          </div>
        )}

        {/* 3. Comprehensive Category Discovery & Shop Grid View matching UI design */}
        <CategoryDiscoveryView
          stores={stores}
          activeCategory={activeFilter || "all"}
          onCategoryChange={(catId) => {
            navigate({
              search: (prev) => ({
                category: catId === "all" ? undefined : catId,
                q: prev.q,
              }),
              resetScroll: false,
            });
            scrollToShops();
          }}
        />

        {/* 4. Swiggy ₹99 Store / Budget Meals Section */}
        <Swiggy99StoreSection products={homepageProducts} />

        {/* Flipkart-Style Signature "Best Deals on..." Container */}
        <FlipkartBestDealsShowcase
          products={homepageProducts}
          title={activeFilter ? `Best Deals on ${displayCategoryName}` : "Best Deals on Local Shore"}
        />

        {/* Category Products Grid */}
        <div className="mx-5 my-6 md:mx-8 md:my-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-foreground md:text-xl">
                {activeFilter
                  ? `Products in ${displayCategoryName}`
                  : query.trim()
                    ? `Products matching "${query}"`
                    : "Popular products near you"}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {homepageProducts.length} item{homepageProducts.length === 1 ? "" : "s"} available for instant 20-40 min delivery
              </p>
            </div>
            {activeFilter && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {homepageProducts.length} items
              </span>
            )}
          </div>

          {homepageProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <p className="text-sm font-medium text-foreground">No products found in this category.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try selecting a different category or clearing search filters.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {homepageProducts.slice(0, visibleProductLimit).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {homepageProducts.length > visibleProductLimit && (
                <div className="mt-5 flex justify-center">
                  <button
                    onClick={() => setVisibleProductLimit((prev) => prev + 20)}
                    className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-card px-6 py-2.5 text-xs font-bold text-foreground shadow-sm transition hover:bg-amber-500/10 active:scale-95"
                  >
                    <span>Show more products ({homepageProducts.length - visibleProductLimit} remaining)</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <MarketplaceDiscovery products={homepageProducts} />

      {/* Mobile search — floats below the hero, not sticky */}
      <div className="px-5 pb-2 pt-1 md:hidden">
        <label className="flex items-center gap-2 rounded-xl bg-card px-3 py-2.5 ring-1 ring-black/[0.04]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, categories or shops"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
      </div>

      <MerchandisingSections fallbackProducts={homepageProducts} />

      {/* Ecosystem Merchandising Strips (Rewards, Brands, Best Shops, Travel, Cities, News) */}
      <div className="px-5 md:px-8">
        <EcosystemMerchandisingStrips />
      </div>

      {/* All shops grid — shown below the Swiggy row as secondary listing */}
      <div className="mt-6 flex items-center justify-between px-5 pt-2 md:mt-8 md:px-8">
        <h2 className="font-display text-base font-bold text-foreground md:text-xl">
          All verified shops
        </h2>
        <span className="font-mono text-[10px] uppercase text-muted-foreground md:text-xs">
          {filtered.length} shops
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 px-5 pb-8 md:mt-4 md:grid-cols-2 md:gap-5 md:px-8 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3">
            <EmptyState />
          </div>
        ) : (
          filtered.map((s) => <AwningCard key={s.id} store={s} />)
        )}
      </div>

      <p className="px-5 pb-6 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        · Local Shore · Coastal India ·
      </p>

      {/* Auth CTA (mock) */}
      <div className="px-5 pb-4">
        <Link
          to="/auth"
          search={{ redirect: undefined }}
          className="block text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Sign in with phone number
        </Link>
        <a
          href={import.meta.env.VITE_SELLER_HUB_URL || "/seller"}
          className="mt-2 block text-center text-xs text-primary underline-offset-4 hover:underline"
        >
          Become a seller
        </a>
      </div>
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
