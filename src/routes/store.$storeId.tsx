import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Search,
  Star,
  MapPin,
  Clock,
  SlidersHorizontal,
  Grid,
  List,
  ChevronRight,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Package,
} from "lucide-react";
import {
  getStore,
  APPROVED_STORE,
  productsByStore,
  categoryColor,
  categoryLabel,
  stores,
  type Product,
  type Store,
} from "@/lib/mock-data";
import { cartStore, useCart, cartTotals } from "@/lib/cart-store";
import { QtyStepper } from "@/components/qty-stepper";
import { ProductThumb } from "@/components/product-thumb";
import { recordProductEvent, recordRecentProductView } from "@/lib/merchandising";
import { WishlistButton } from "@/components/wishlist-button";
import { flyProductToCart } from "@/lib/fly-to-cart";
import { resolveImageUrl } from "@/lib/image-utils";
import { useDeliveryLocation } from "@/lib/location-store";
import { isValidCoordinate, haversineDistanceKm } from "@/lib/geo";
import { m } from "motion/react";
import { SearchShopRecommendations } from "@/components/search-shop-recommendations";
import { calculateDynamicETA } from "@/lib/ml-eta-engine";
import { useMLTracker } from "@/hooks/use-ml-tracker";
import { ComplementaryShopsWidget } from "@/components/complementary-shops-widget";
import { NearbySimilarShopsWidget } from "@/components/nearby-similar-shops-widget";
import { scrollToShops } from "@/lib/scroll-utils";

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

import { toStoreCategory } from "@/lib/shop-categories";
import { isTestEntity } from "@/lib/map-service/store-engine";
import { LottieLoading } from "@/components/ui/lottie-loading";

export const Route = createFileRoute("/store/$storeId")({
  validateSearch: (search: Record<string, unknown>): { sq?: string; category?: string } => ({
    sq: (search.sq as string) || (search.q as string) || undefined,
    category: (search.category as string) || undefined,
  }),
  loader: ({ params }): { store: Store; products: Product[] } => {
    const store =
      params.storeId === APPROVED_STORE.id
        ? APPROVED_STORE
        : (getStore(params.storeId) ??
          (isUuid(params.storeId) ? { ...APPROVED_STORE, id: params.storeId } : undefined));
    if (!store) throw notFound();
    return { store, products: productsByStore[store.id] ?? [] };
  },
  component: StorePage,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <p className="font-display text-2xl">Shop not found</p>
        <Link
          to="/"
          search={{ category: undefined, q: undefined }}
          className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline"
        >
          Back to shops
        </Link>
      </div>
    </div>
  ),
});

function getCategoryIcon(_catName: string) {
  return <Package className="h-4 w-4 text-slate-400" />;
}

function StorePage() {
  const loaded = Route.useLoaderData() as { store: Store; products: Product[] };
  const approved = useQuery({
    queryKey: ["approved-store", loaded.store.id],
    enabled: loaded.store.id === APPROVED_STORE.id || isUuid(loaded.store.id),
    queryFn: async () => {
      let productQuery = (supabase as any)
        .from("approved_product_catalog")
        .select("id,seller_id,name,category,selling_price,image_url,stock")
        .order("created_at", { ascending: false });
      if (loaded.store.id !== APPROVED_STORE.id) {
        productQuery = productQuery.eq("seller_id", loaded.store.id);
      }
      let { data, error } = await productQuery;
      if (error) {
        let fallbackQuery = (supabase as any)
          .from("products")
          .select("id,seller_id,name,category,selling_price,image_url,stock")
          .in("status", ["active", "approved"])
          .order("created_at", { ascending: false });
        if (loaded.store.id !== APPROVED_STORE.id) {
          fallbackQuery = fallbackQuery.eq("seller_id", loaded.store.id);
        }
        const fallback = await fallbackQuery;
        data = fallback.data;
        error = fallback.error;
      }
      if (error) throw error;
      const validRows = (data ?? []).filter((p: any) => !isTestEntity(p.name));
      const products = await Promise.all(
        validRows.map(async (p: any) => {
          const rawImage = p.image_url ?? "";
          let imageUrl = rawImage;
          if (rawImage && !/^(https?:|data:)/i.test(rawImage)) {
            const { data: signed } = await supabase.storage
              .from("product-images")
              .createSignedUrl(rawImage, 60 * 60);
            imageUrl = signed?.signedUrl ?? "";
          }
          return {
            id: p.id,
            storeId: p.seller_id ?? APPROVED_STORE.id,
            name: p.name,
            unit: p.unit || p.category || "1 unit",
            price: Number(p.selling_price),
            imageUrl,
            category: p.category ?? "Other",
            stock: Number(p.stock ?? 20),
          };
        }),
      );

      if (loaded.store.id === APPROVED_STORE.id) return { products, store: null };

      let { data: vendor } = await (supabase as any)
        .from("approved_vendor_catalog")
        .select(
          "id,shop_name,business_type,city,state,address_line1,category,shop_logo_path,shop_banner_path",
        )
        .eq("id", loaded.store.id)
        .maybeSingle();

      let storeName = vendor?.shop_name;
      let storeCategory = vendor?.category;
      let storeTagline = vendor?.business_type || "Approved local vendor";
      let storeAddress = [vendor?.address_line1, vendor?.city, vendor?.state].filter(Boolean).join(", ");
      let imageUrl = APPROVED_STORE.imageUrl;

      const storefrontPath = vendor?.shop_banner_path || vendor?.shop_logo_path;
      if (storefrontPath) {
        const { data: signed } = await supabase.storage
          .from("seller-docs")
          .createSignedUrl(storefrontPath, 60 * 60);
        imageUrl = signed?.signedUrl ?? imageUrl;
      }

      if (!vendor) {
        const { data: rawSellerData } = await (supabase as any)
          .from("sellers")
          .select("*")
          .eq("id", loaded.store.id)
          .maybeSingle();

        const sellerData = rawSellerData as any;
        if (sellerData) {
          const w = sellerData.wizard_data || {};
          storeName = sellerData.business_name || storeName;
          storeCategory = w.category || sellerData.business_type || storeCategory;
          storeTagline = w.description || sellerData.business_name || storeTagline;
          storeAddress = [sellerData.address_line1, sellerData.city, sellerData.state].filter(Boolean).join(", ");
          imageUrl = w.documents?.shopBanner?.url || w.documents?.shopBanner?.dataUrl || imageUrl;

          vendor = {
            id: sellerData.id,
            shop_name: storeName,
          };
        }
      }

      return {
        products,
        store: vendor
          ? ({
              ...APPROVED_STORE,
              id: vendor.id,
              name: storeName || APPROVED_STORE.name,
              category: toStoreCategory(storeCategory),
              tagline: storeTagline || "Approved local vendor",
              address: storeAddress || APPROVED_STORE.address,
              imageUrl,
            } as Store)
          : null,
      };
    },
  });

  const store = approved.data?.store ?? loaded.store;
  const liveProds = approved.data?.products ?? [];
  const products = (
    liveProds.length > 0
      ? liveProds
      : (loaded.products && loaded.products.length > 0
          ? loaded.products
          : (productsByStore[store.id] ?? productsByStore["s_roja_mart"] ?? []))
  ) as Product[];

  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const sq = searchParams.sq || "";
  const [query, setQuery] = useState(sq);
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.category || "all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "price-asc" | "price-desc">("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (sq && sq !== query) {
      setQuery(sq);
    }
  }, [sq]);

  const cart = useCart();
  const totals = cartTotals(cart.lines);
  const [deliveryLoc] = useDeliveryLocation();

  const computedDistanceKm =
    store &&
    typeof store.lat === "number" &&
    typeof store.lng === "number" &&
    isValidCoordinate(store.lat, store.lng) &&
    deliveryLoc &&
    typeof deliveryLoc.lat === "number" &&
    typeof deliveryLoc.lng === "number" &&
    isValidCoordinate(deliveryLoc.lat, deliveryLoc.lng)
      ? Math.max(
          0.1,
          Math.round(
            haversineDistanceKm(store.lat, store.lng, deliveryLoc.lat, deliveryLoc.lng) * 10,
          ) / 10,
        )
      : (store.distanceKm ?? 1.2);

  const { trackShopView } = useMLTracker();

  useEffect(() => {
    if (store?.id) {
      trackShopView(store.id, store.category, deliveryLoc?.lat, deliveryLoc?.lng);
    }
  }, [store?.id]);

  const dynamicEta = calculateDynamicETA({
    userLat: deliveryLoc?.lat,
    userLng: deliveryLoc?.lng,
    shopLat: store?.lat,
    shopLng: store?.lng,
    avgPrepTimeMins: 12,
  });

  const computedEtaMin = dynamicEta.minMins;

  // Categories extracted from available products
  const productCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const cat = p.category || "Other";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const catList = Object.entries(counts).map(([name, count]) => ({
      id: name,
      name,
      count,
    }));
    return [
      { id: "all", name: "All Products", count: products.length },
      ...catList,
    ];
  }, [products]);

  // Filtered & Sorted products list
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (selectedCategory && selectedCategory !== "all") {
      list = list.filter(
        (p) => (p.category || "Other").toLowerCase() === selectedCategory.toLowerCase(),
      );
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
      );
    }

    if (minPrice !== "") {
      const min = Number(minPrice);
      if (!isNaN(min)) list = list.filter((p) => p.price >= min);
    }

    if (maxPrice !== "") {
      const max = Number(maxPrice);
      if (!isNaN(max)) list = list.filter((p) => p.price <= max);
    }

    if (sortBy === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      list.reverse();
    }

    return list;
  }, [products, selectedCategory, query, minPrice, maxPrice, sortBy]);

  const qtyOf = (id: string) => cart.lines.find((l) => l.productId === id)?.qty ?? 0;

  return (
    <div className="min-h-screen bg-[#fcfbfa] pb-32 pt-3 sm:pt-5">
      <div className="mx-auto max-w-[1500px] px-3 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link
            to="/"
            search={{ category: "all-shops", q: undefined }}
            onClick={scrollToShops}
            className="flex items-center gap-1 hover:text-[#981495] transition-colors cursor-pointer"
          >
            <span className="text-slate-400">🏠</span>
            <span>Shops</span>
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="text-slate-900 font-bold truncate max-w-[280px] sm:max-w-none">
            {store.name}
          </span>
        </nav>

        {/* ── STORE HERO BANNER (Horizontal Full-Width Design matching Image 2) ── */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 gold-metallic-border-dark gold-glow-md shadow-xl mb-6 min-h-[210px] sm:min-h-[230px] flex items-center group">
          {/* Full-width Background Image */}
          <img
            src={resolveImageUrl(store.imageUrl, store.name, store.category)}
            alt={store.name}
            className="absolute inset-0 h-full w-full object-cover object-center opacity-95 transition-transform duration-700 group-hover:scale-105"
          />

          {/* Smooth Light Fade Gradient on Left (Zero blank white space) */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#fdfbf9] via-[#fdfbf9]/95 via-80% to-transparent w-full md:w-[62%] z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30 z-10 md:hidden" />

          {/* Verified Store Top-Right Badge */}
          <div className="absolute top-4 right-4 z-20">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-3.5 py-1.5 text-xs font-black text-slate-900 shadow-xl border border-amber-300/80">
              <ShieldCheck className="h-4 w-4 text-[#981495] fill-[#981495]/20" />
              <span>Verified Store</span>
            </div>
          </div>

          {/* All Shops Top-Left Pill */}
          <Link
            to="/"
            search={{ category: "all-shops", q: undefined }}
            onClick={() => {
              scrollToShops();
            }}
            className="absolute top-4 left-4 z-40 pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/95 hover:bg-white text-slate-900 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold transition-all shadow-md border border-amber-300/80 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All shops</span>
          </Link>

          {/* Bottom Right Handwritten Watermark (Traditional Elegance Modern Living) */}
          <div className="absolute bottom-4 right-6 z-20 text-right hidden sm:block">
            <p className="font-['Caveat'] text-2xl sm:text-3xl font-extrabold text-amber-200 tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] leading-tight">
              Traditional Elegance
            </p>
            <p className="font-['Caveat'] text-xl sm:text-2xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              Modern Living
            </p>
          </div>

          {/* Left Content Area (Logo Box + Store Details) */}
          <div className="relative z-20 p-5 sm:p-7 md:p-8 max-w-3xl flex flex-col sm:flex-row items-start sm:items-center gap-4.5 pt-12 sm:pt-7">
            {/* Store Brand Emblem Logo Box */}
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-[#310938] text-[#f5d061] flex flex-col items-center justify-center gold-metallic-border-dark gold-glow-sm shrink-0">
              <Sparkles className="h-7 w-7 text-amber-400 fill-amber-400/30 mb-0.5" />
              <span className="font-display font-black text-[9px] uppercase tracking-widest text-amber-200">
                STORE
              </span>
            </div>

            {/* Store Info & Ratings */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100/90 px-2.5 py-0.5 text-[10px] font-bold text-[#981495] border border-purple-200">
                  Verified Shoreline Merchant
                </span>
              </div>

              <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-black text-slate-900 leading-tight tracking-tight">
                {store.name}
              </h1>

              <p className="text-xs sm:text-sm font-semibold text-slate-600 truncate mt-0.5">
                {store.tagline || "Showrooms. Multistorey showroom for silk, smart TV's & appliances"}
              </p>

              {/* Info Badges Row */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-1 text-slate-600 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-full border border-slate-200/80 shadow-2xs">
                  <MapPin className="h-3.5 w-3.5 text-[#981495] shrink-0" />
                  <span className="truncate max-w-[200px] sm:max-w-[280px]">{store.address}</span>
                </div>

                <div className="flex items-center gap-1 rounded-full bg-emerald-50/90 px-2.5 py-1 text-emerald-800 border border-emerald-200/70 shadow-2xs">
                  <Clock className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{store.isOpen ? "Open now · 9:00 AM – 9:30 PM" : "Closed"}</span>
                </div>

                <div className="flex items-center gap-1 rounded-full bg-amber-50/90 px-2.5 py-1 text-amber-900 border border-amber-200/80 shadow-2xs">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span>{store.rating.toFixed(1)}</span>
                  <span className="text-amber-700/80 font-normal">
                    ({Math.floor(store.rating * 240)} reviews)
                  </span>
                </div>

                <div className="flex items-center gap-1 rounded-full bg-purple-50/90 px-2.5 py-1 text-[#981495] border border-purple-200/80 shadow-2xs">
                  <span>🚀 {computedEtaMin} mins ({computedDistanceKm} km)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FULL-WIDTH SEARCH + CATEGORIES + COMPACT FILTER TOOLBAR ── */}
        <div className="mb-4 space-y-2.5">
          {/* Search bar + Filter Toggle */}
          <div className="relative z-10 rounded-2xl bg-white border-2 border-amber-300/70 p-2.5 shadow-sm shadow-amber-500/5 flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2.5 px-3 py-1">
              <Search className="h-5 w-5 text-slate-400 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search products in ${store.name}...`}
                className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-900 outline-none placeholder:text-slate-400"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2"
                >
                  Clear
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((f) => !f)}
              className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all cursor-pointer border ${
                showFilters || minPrice || maxPrice || sortBy !== "popular"
                  ? "bg-[#981495] text-white border-[#981495]"
                  : "bg-purple-50 text-[#981495] hover:bg-[#981495] hover:text-white border-purple-200/60"
              }`}
              title="Toggle filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {(minPrice || maxPrice || sortBy !== "popular") && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-[9px] font-black text-slate-900 ring-2 ring-white">
                  !
                </span>
              )}
            </button>
          </div>

          {/* Horizontal Scrollable Category Chips for fast mobile browsing */}
          {productCategories.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
              {productCategories.map((cat) => {
                const active =
                  selectedCategory.toLowerCase() === cat.id.toLowerCase() ||
                  (cat.id === "all" && selectedCategory === "all");
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
                      active
                        ? "bg-[#981495] text-white border-[#981495] shadow-xs"
                        : "bg-white text-slate-700 hover:bg-purple-50 border-slate-200/80 hover:border-purple-200"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                        active ? "bg-white/20 text-white" : "bg-purple-100 text-[#981495]"
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Collapsible compact inline filters */}
          {showFilters && (
            <div className="rounded-2xl bg-white border-2 border-amber-300/70 p-4 shadow-md shadow-purple-950/5 flex flex-wrap items-end gap-4">
              {/* Price Range */}
              <div className="flex items-end gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Min ₹</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-24 rounded-xl border border-amber-300/70 px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-[#981495] bg-slate-50/50"
                  />
                </div>
                <span className="text-slate-400 font-bold text-sm mb-1.5">–</span>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Max ₹</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-24 rounded-xl border border-amber-300/70 px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-[#981495] bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Sort By */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "popular", label: "Popular" },
                  { id: "newest", label: "Newest" },
                  { id: "price-asc", label: "↑ Price" },
                  { id: "price-desc", label: "↓ Price" },
                ].map((opt) => {
                  const active = sortBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSortBy(opt.id as any)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                        active
                          ? "bg-[#981495] text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Reset filters */}
              {(minPrice || maxPrice || sortBy !== "popular" || selectedCategory !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setMinPrice("");
                    setMaxPrice("");
                    setSortBy("popular");
                    setSelectedCategory("all");
                  }}
                  className="text-xs font-bold text-[#981495] hover:underline ml-auto"
                >
                  Reset filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── FULL-WIDTH PRODUCT SECTION ── */}
        <div>
          {/* Header Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200/80">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {query.trim()
                  ? `Products matching "${query.trim()}"`
                  : "All Products"}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Discover the best deals from <strong className="text-slate-900">{store.name}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500">
                {filteredProducts.length} item{filteredProducts.length !== 1 ? "s" : ""}
              </span>

              {/* View Mode Toggle */}
              <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === "grid"
                      ? "bg-white text-purple-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === "list"
                      ? "bg-white text-purple-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Product List Loading / Empty State */}
          {approved.isLoading ? (
            <div className="rounded-3xl border border-purple-100 bg-white p-12 text-center flex justify-center">
              <LottieLoading
                message={`Loading catalog for ${store.name}...`}
                subtext="Fetching live inventory & neighborhood prices"
                size="md"
              />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-amber-300/80 bg-white p-12 text-center">
              <div className="mx-auto text-4xl mb-3">🔍</div>
              <p className="font-bold text-slate-900 text-base">No products found</p>
              <p className="mt-1 text-xs text-slate-500">
                Try clearing your search or price filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setMinPrice("");
                  setMaxPrice("");
                  setSortBy("popular");
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#981495] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-purple-800"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            /* Product Cards Grid — full width, more columns available now */
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4"
                  : "space-y-4"
              }
            >
                {filteredProducts.map((p) => {
                  const q = qtyOf(p.id);
                  const mrp = Math.round(p.price * 1.25);
                  const discountPct = Math.round(((mrp - p.price) / mrp) * 100);
                  const unit = p.unit || "1 unit";

                  return (
                    <m.div
                      key={p.id}
                      data-product-id={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.15 }}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs hover:border-purple-300 hover:shadow-md transition-all duration-200"
                    >
                      <div>
                        {/* Top Image Frame with floating badges */}
                        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-50/90 border border-slate-100 p-2 flex items-center justify-center">
                          {/* Wishlist Button top-right */}
                          <div className="absolute right-2 top-2 z-10">
                            <WishlistButton
                              productId={p.id}
                              productName={p.name}
                              item={{
                                productId: p.id,
                                name: p.name,
                                shopName: store.name,
                                category: p.category,
                                price: p.price,
                                imageUrl: p.imageUrl,
                                sellerId: p.storeId,
                              }}
                            />
                          </div>

                          {/* Unit weight tag bottom-left inside image frame */}
                          <div className="absolute bottom-2 left-2 z-10 rounded-md bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                            {unit}
                          </div>

                          <ProductThumb
                            src={p.imageUrl}
                            alt={p.name}
                            category={store.category}
                            size="lg"
                          />

                          {/* ADD Button positioned at bottom-right corner of image frame (Matching Image 2 position!) */}
                          <div className="absolute right-2 bottom-2 z-20">
                            {q === 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  void recordProductEvent(p.id, "add_to_cart");
                                  flyProductToCart(p.id);
                                  cartStore.add(p.storeId, store.name, p);
                                }}
                                className="rounded-lg bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white px-3.5 py-1 text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                              >
                                <span>ADD</span>
                              </button>
                            ) : (
                              <QtyStepper
                                qty={q}
                                max={p.stock}
                                onAdd={() => {
                                  void recordProductEvent(p.id, "add_to_cart");
                                  flyProductToCart(p.id);
                                  cartStore.add(p.storeId, store.name, p);
                                }}
                                onChange={(n) => cartStore.setQty(p.id, n)}
                                addClassName="rounded-lg bg-emerald-700 text-white px-2 py-0.5 text-xs font-bold shadow-sm"
                              />
                            )}
                          </div>
                        </div>

                        {/* Product details section */}
                        <Link
                          to="/product/$productId"
                          params={{ productId: p.id }}
                          onClick={() => {
                            void recordProductEvent(p.id, "view");
                            void recordRecentProductView(p.id);
                          }}
                          className="mt-2.5 block space-y-1"
                        >
                          {/* Price line with strikethrough MRP */}
                          <div className="flex items-baseline gap-2">
                            <span className="text-base font-black text-slate-900">
                              ₹{p.price.toLocaleString("en-IN")}
                            </span>
                            {mrp > p.price && (
                              <span className="text-xs font-semibold text-slate-400 line-through">
                                ₹{mrp.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>

                          {discountPct > 0 && (
                            <p className="text-[11px] font-extrabold text-blue-600 uppercase tracking-tight">
                              {discountPct}% OFF ON MRP
                            </p>
                          )}

                          {/* Title */}
                          <h3 className="line-clamp-2 text-xs sm:text-sm font-bold text-slate-800 leading-snug group-hover:text-[#981495] transition-colors">
                            {p.name}
                          </h3>

                          {/* Rating & ETA */}
                          <div className="flex items-center gap-2 pt-0.5 text-[11px] font-bold text-slate-600">
                            <span className="flex items-center gap-0.5 text-amber-600">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              4.8
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500">⏱ {computedEtaMin} mins</span>
                          </div>

                          {/* Category pill with arrow */}
                          <div className="pt-1">
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 group-hover:bg-purple-50 group-hover:text-[#981495] transition-colors">
                              <span>All {p.category || "Item"}</span>
                              <span className="text-[8px]">▶</span>
                            </span>
                          </div>
                        </Link>
                      </div>
                    </m.div>
                  );
                })}
              </div>
            )}
          </div>

        {/* ── STORE TRUST & ASSURANCE BANNER ── */}
        <div className="mt-12 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-[#310938] text-white p-6 sm:p-8 shadow-xl border-2 border-amber-300/80">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-black text-amber-300 border border-amber-300/40">
                <ShieldCheck className="h-4 w-4" />
                <span>LocalShore Shoreline Protection</span>
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                Directly from {store.name} to your doorstep
              </h3>
              <p className="text-xs sm:text-sm text-purple-200 font-medium max-w-xl">
                Every order is fulfilled straight from verified local inventory with instant delivery, active tracking, and doorstep return support.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto shrink-0">
              <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3 border border-white/10 text-center">
                <p className="text-lg font-black text-amber-300">⚡ 30 MIN</p>
                <p className="text-[10px] font-bold text-slate-200">Express Delivery</p>
              </div>
              <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3 border border-white/10 text-center">
                <p className="text-lg font-black text-amber-300">💯 GENUINE</p>
                <p className="text-[10px] font-bold text-slate-200">Physical Store Shelf</p>
              </div>
              <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3 border border-white/10 text-center col-span-2 sm:col-span-1">
                <p className="text-lg font-black text-amber-300">🔄 EASY</p>
                <p className="text-[10px] font-bold text-slate-200">Doorstep Returns</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── SEARCH-BASED RECOMMENDED SHOPS ("Other Shops Selling What You Searched For") ── */}
        <SearchShopRecommendations
          searchQuery={query || sq || ""}
          currentShopId={store.id}
          currentShopName={store.name}
        />

        {/* ── NEARBY RECOMMENDED SHOPS ── */}
        {!(query || sq).trim() && (
          <div className="mt-12 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  Explore Other Top Local Shops Nearby
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Verified merchants in your delivery neighborhood
                </p>
              </div>
            <Link
              to="/"
              search={{ category: undefined, q: undefined }}
              className="text-xs font-bold text-[#981495] hover:underline flex items-center gap-1"
            >
              <span>View all shops</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {stores
              .filter((s) => s.id !== store.id)
              .slice(0, 4)
              .map((otherStore) => (
                <Link
                  key={otherStore.id}
                  to="/store/$storeId"
                  params={{ storeId: otherStore.id }}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl bg-white border-2 border-amber-300/70 p-3 shadow-xs hover:border-amber-400 hover:shadow-md transition-all"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-100 mb-2.5">
                    <img
                      src={resolveImageUrl(otherStore.imageUrl, otherStore.name, otherStore.category)}
                      alt={otherStore.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 rounded-full bg-white/90 backdrop-blur-xs px-2 py-0.5 text-[9px] font-black text-slate-900 border border-amber-200">
                      ★ {otherStore.rating.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 truncate group-hover:text-[#981495] transition-colors">
                      {otherStore.name}
                    </h4>
                    <p className="text-[10px] font-medium text-slate-500 truncate mt-0.5">
                      {otherStore.tagline}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] font-extrabold text-slate-700">
                      <span>🚀 {otherStore.etaMin} mins</span>
                      <span className="text-[#981495]">View Shop &rarr;</span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
        )}

        <NearbySimilarShopsWidget
          currentCategory={store.category}
          currentStoreId={store.id}
          searchQuery={query || sq}
          title="Shops & Products Near Your Home"
          subtitle={`Verified local merchants near your address with matching products in ${store.category}`}
        />

        <ComplementaryShopsWidget
          currentCategory={store.category}
          userLat={deliveryLoc?.lat}
          userLng={deliveryLoc?.lng}
          shops={[
            { id: "store-2", business_name: "Nilgiris Supermarket", business_type: "Groceries & Gourmet", rating: 4.6, lat: store.lat ? store.lat + 0.008 : null, lng: store.lng ? store.lng + 0.005 : null, matching_reason: "Popular for daily organic groceries nearby" },
            { id: "store-3", business_name: "Local Electronics Hub", business_type: "Electronics & Accessories", rating: 4.8, lat: store.lat ? store.lat - 0.005 : null, lng: store.lng ? store.lng - 0.008 : null, matching_reason: "High customer satisfaction for accessories" }
          ]}
        />
      </div>

      {/* Sticky Cart Footer Bar when items are present */}
      {totals.itemCount > 0 && (cart.storeId === store.id || store.id === APPROVED_STORE.id) && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-purple-200 bg-[#981495] text-white shadow-2xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 md:px-6">
            <div className="text-sm">
              <p className="font-mono text-[10px] uppercase tracking-widest text-purple-200 font-bold">
                {totals.itemCount} item{totals.itemCount > 1 ? "s" : ""} · from {store.name}
              </p>
              <p className="font-display text-xl font-extrabold text-white">₹{totals.subtotal}</p>
            </div>
            <button
              onClick={() => navigate({ to: "/cart" })}
              className="rounded-full bg-amber-400 hover:bg-amber-300 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              Review Cart &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
