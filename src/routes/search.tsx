import { useState, useEffect, useMemo, startTransition } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ChevronLeft, X, Search as SearchIcon, SlidersHorizontal, Sparkles, Store as StoreIcon, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useMLTracker } from "@/hooks/use-ml-tracker";
import { parseQueryIntent } from "@/lib/ml-shop-ranker";
import { LottieLoading } from "@/components/ui/lottie-loading";
import { parseFilterParams, serializeFilterParams } from "@/lib/filter-utils";
import { useFilterDefinitions } from "@/hooks/use-filter-definitions";
import { useProductFilters } from "@/hooks/use-product-filters";
import { useShopDiscovery } from "@/hooks/use-shop-discovery";
import { ShopCard } from "@/components/shop-card";
import { DynamicFilterPanel } from "@/components/filters/dynamic-filter-panel";
import { FilterBottomSheet } from "@/components/filters/filter-bottom-sheet";
import { FilterChips } from "@/components/filters/filter-chips";
import { SortDropdown } from "@/components/filters/sort-dropdown";
import { ProductCard } from "@/components/merchandising-sections";

export const Route = createFileRoute("/search")({
  component: SwiggySearchPage,
  validateSearch: (search: Record<string, unknown>) => search,
});

const PREFERRED_CATEGORIES = [
  { id: "all", label: "All Categories", imageUrl: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=160&q=80" },
  { id: "fresh", label: "Fresh Produce", imageUrl: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=160&q=80" },
  { id: "meat-fish", label: "Meat & Fish", imageUrl: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=160&q=80" },
  { id: "bakery", label: "Bakery & Sweets", imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=160&q=80" },
  { id: "fashion", label: "Fashion & Apparel", imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=160&q=80" },
  { id: "beauty", label: "Beauty & Care", imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=160&q=80" },
  { id: "electronics", label: "Electronics & Tech", imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=160&q=80" },
  { id: "home-decor", label: "Home & Kitchen", imageUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=160&q=80" },
  { id: "pharmacy", label: "Pharmacy", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=160&q=80" },
  { id: "kids-sports", label: "Kids & Sports", imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=160&q=80" },
  { id: "local-favorites", label: "Local Favorites ⭐", imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=160&q=80" },
];

function getCategoryShopHeading(categorySlug?: string): string {
  const norm = (categorySlug || "").toLowerCase();
  if (norm.includes("fashion")) return "🏪 Fashion Shops Near You";
  if (norm.includes("elec") || norm.includes("mobile")) return "🏪 Electronics & Tech Shops Near You";
  if (norm.includes("meat")) return "🏪 Meat & Fish Shops Near You";
  if (norm.includes("bakery") || norm.includes("sweet")) return "🏪 Bakeries & Sweet Shops Near You";
  if (norm.includes("home") || norm.includes("decor") || norm.includes("furniture")) return "🏪 Home & Decor Shops Near You";
  if (norm.includes("pharmacy")) return "🏪 Pharmacies Near You";
  if (norm.includes("fresh")) return "🏪 Fresh Produce Markets Near You";
  if (norm.includes("beauty")) return "🏪 Beauty & Care Boutiques Near You";
  return "🏪 Shops Near You";
}

function SwiggySearchPage() {
  const rawSearch = Route.useSearch();
  const navigate = useNavigate();
  const filterState = useMemo(() => parseFilterParams(rawSearch), [rawSearch]);

  const [query, setQuery] = useState(filterState.query || "");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const { trackSearch } = useMLTracker();

  const { data: filterDefs = [] } = useFilterDefinitions(
    filterState.category,
    filterState.productType
  );

  // Shop Discovery Engine (Local Shops matching search/filters)
  const { data: shopData, isLoading: shopsLoading } = useShopDiscovery(filterState);
  const shops = shopData?.shops ?? [];

  // Product Filters Engine
  const { products, total, loading, facets } = useProductFilters(filterState);

  const intent = parseQueryIntent(query);

  useEffect(() => {
    setQuery(filterState.query || "");
    if (filterState.query && filterState.query.trim().length > 1) {
      trackSearch(filterState.query, undefined, undefined, total);
    }
  }, [filterState.query]);

  useEffect(() => {
    if (query === (filterState.query || "")) return;
    const timer = setTimeout(() => {
      updateFilterState({ query: query.trim(), page: 1 });
    }, 220);
    return () => clearTimeout(timer);
  }, [query]);

  const updateFilterState = (patch: Partial<typeof filterState>) => {
    const nextState = { ...filterState, ...patch };
    const serialized = serializeFilterParams(nextState);

    startTransition(() => {
      void navigate({
        to: "/search",
        search: serialized,
        resetScroll: false,
      });
    });
  };

  const handleClearAll = () => {
    setQuery("");
    void navigate({ to: "/search", search: {} });
  };

  const handleRemoveAttribute = (key: string, value: string) => {
    const currentVals = filterState.attributes[key] || [];
    const updated = currentVals.filter((v) => v !== value);
    const nextAttributes = { ...filterState.attributes };
    if (updated.length > 0) {
      nextAttributes[key] = updated;
    } else {
      delete nextAttributes[key];
    }
    updateFilterState({ attributes: nextAttributes, page: 1 });
  };

  const handleRemoveBrand = (brandName: string) => {
    const updated = filterState.brands.filter((b) => b !== brandName);
    updateFilterState({ brands: updated, page: 1 });
  };

  const handleRemovePrice = () => {
    updateFilterState({ minPrice: undefined, maxPrice: undefined, page: 1 });
  };

  const handleRemoveRating = () => {
    updateFilterState({ minRating: undefined, page: 1 });
  };

  const handleRemoveBoolean = (key: "inStock" | "onSale" | "openNow") => {
    updateFilterState({ [key]: false, page: 1 });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilterState({ query: query.trim(), page: 1 });
  };

  const shopHeading = getCategoryShopHeading(filterState.category);

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-20 pt-4 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Search Bar Header */}
        <form onSubmit={handleSearchSubmit} className="relative mb-4">
          <div className="flex items-center gap-3 bg-background border border-border/80 rounded-2xl px-4 py-3 shadow-md focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all">
            <button
              type="button"
              onClick={() => {
                if (query) {
                  handleClearAll();
                } else {
                  window.history.back();
                }
              }}
              className="p-1 hover:bg-muted rounded-full text-foreground/80 transition-colors"
              title="Back"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search local shops, products, brands..."
              className="flex-1 bg-transparent text-base md:text-lg font-medium text-foreground outline-none placeholder:text-muted-foreground/70"
              autoFocus
            />

            {query && (
              <button
                type="button"
                onClick={handleClearAll}
                className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
                title="Clear"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            )}

            <button
              type="submit"
              className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              title="Search"
            >
              <SearchIcon className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Preferred Category Pills Bar */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 mb-4 scrollbar-none max-w-full">
          {PREFERRED_CATEGORIES.map((cat) => {
            const isSelected =
              cat.id === "all"
                ? !filterState.category || filterState.category === "all"
                : Boolean(
                    filterState.category &&
                      (filterState.category.toLowerCase() === cat.id.toLowerCase() ||
                        filterState.category.toLowerCase().includes(cat.id.toLowerCase())),
                  );

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  const catVal = cat.id === "all" ? undefined : cat.id;
                  updateFilterState({ category: catVal, attributes: {}, brands: [], page: 1 });
                }}
                className={`rounded-full pl-1.5 pr-4 py-1.5 text-xs font-extrabold whitespace-nowrap transition-all duration-200 flex items-center gap-2 border ${
                  isSelected
                    ? "bg-gradient-to-r from-primary via-purple-600 to-indigo-600 text-white border-primary shadow-md shadow-primary/25 scale-[1.03]"
                    : "bg-card text-foreground/80 hover:text-foreground border-border/80 hover:bg-muted/80 hover:scale-[1.01]"
                }`}
              >
                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-white/50 shadow-2xs">
                  <img
                    src={cat.imageUrl}
                    alt={cat.label}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Intent Detection Banner */}
        {intent.category_intent && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-300 mb-4">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              Detected intent: <strong className="font-semibold text-foreground">{intent.category_intent}</strong>
            </span>
          </div>
        )}

        {/* Active Filter Chips */}
        <FilterChips
          filterState={filterState}
          onRemoveAttribute={handleRemoveAttribute}
          onRemoveBrand={handleRemoveBrand}
          onRemovePrice={handleRemovePrice}
          onRemoveRating={handleRemoveRating}
          onRemoveBoolean={handleRemoveBoolean}
          onClearAll={handleClearAll}
        />

        {/* Results Header & Summary Bar: "8 Local Shops · 32 Products" */}
        <div className="flex items-center justify-between gap-3 border-b border-border/80 pb-3 mb-6">
          <div>
            <h1 className="text-lg sm:text-xl font-black text-foreground">
              {query ? `Results for "${query}"` : filterState.category ? `Local Marketplace` : "Local Marketplace"}
            </h1>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              <span className="text-primary font-bold">{shops.length} Local Shops</span>
              {" · "}
              <span className="text-foreground font-bold">{total} Products</span>
              {loading && <span className="animate-pulse text-primary ml-2 font-extrabold">• Updating...</span>}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Filter Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMobileFilterOpen(true)}
              className="md:hidden flex items-center gap-1.5 rounded-xl h-9 text-xs font-bold border-border bg-card shadow-xs"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
              <span>Filters</span>
            </Button>

            {/* Sort Dropdown */}
            <SortDropdown
              value={filterState.sortBy}
              onChange={(sortVal) => updateFilterState({ sortBy: sortVal, page: 1 })}
            />
          </div>
        </div>

        {/* Main Content: Desktop Split View */}
        <div className="flex items-start gap-6">
          {/* Desktop Left Sidebar: Dynamic Filter Panel (3 Logical Filter Groups) */}
          <div className="hidden md:block w-64 lg:w-72 shrink-0 sticky top-20">
            <DynamicFilterPanel
              filterDefinitions={filterDefs}
              filterState={filterState}
              facets={facets}
              onUpdateState={updateFilterState}
              onClearAll={handleClearAll}
            />
          </div>

          {/* Right Main Discovery Area: Shop-First Hierarchy */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* ============================================================ */}
            {/* 1. SHOPS NEAR YOU (MUST APPEAR BEFORE PRODUCTS)               */}
            {/* ============================================================ */}
            <section className="space-y-4" aria-label="Shops Near You">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-foreground flex items-center gap-2">
                    <span>{shopHeading}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                      {shops.length}
                    </span>
                  </h2>
                  <div className="mt-1 h-0.5 w-10 bg-primary rounded-full" />
                </div>

                <Link
                  to="/best-shops"
                  className="text-xs font-extrabold text-primary hover:underline flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 transition-all"
                >
                  <span>View All Shops</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {shopsLoading ? (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-[280px] h-64 rounded-3xl bg-muted animate-pulse shrink-0 border hairline" />
                  ))}
                </div>
              ) : shops.length === 0 ? (
                <div className="bg-card border hairline rounded-2xl p-6 text-center">
                  <StoreIcon className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2 stroke-1" />
                  <h4 className="text-sm font-bold text-foreground">No matching local shops found</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try expanding distance radius or clearing active shop filters.
                  </p>
                </div>
              ) : (
                /* Horizontal Scrollable Shop Row for Mobile/Tablet, Responsive Grid on Desktop */
                <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-x-auto pb-2 md:pb-0 scrollbar-none snap-x snap-mandatory">
                  {shops.map((shop) => (
                    <div key={shop.id} className="snap-start shrink-0 md:shrink">
                      <ShopCard shop={shop} searchQuery={query} variant="compact" className="md:w-full md:max-w-none" />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ============================================================ */}
            {/* 2. PRODUCTS FROM LOCAL SHOPS (APPEARS AFTER SHOPS)            */}
            {/* ============================================================ */}
            <section className="space-y-4 pt-4 border-t border-border/60" aria-label="Products From Local Shops">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-foreground flex items-center gap-2">
                    <span>🛍️ Products From Local Shops</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
                      {total}
                    </span>
                  </h2>
                  <div className="mt-1 h-0.5 w-10 bg-primary/60 rounded-full" />
                </div>
              </div>

              {loading ? (
                <div className="py-12 flex justify-center">
                  <LottieLoading
                    show={loading}
                    delayMs={150}
                    message={`Filtering products...`}
                    subtext="Applying category attributes & verified shop filters"
                    size="md"
                  />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 bg-card border hairline rounded-2xl p-8">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                    <SearchIcon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    {shops.length > 0
                      ? "Shops found, but no matching products listed"
                      : "No products match your filters"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                    Try broadening price range or clearing attribute filters to view available local inventory.
                  </p>
                  <Button
                    type="button"
                    onClick={handleClearAll}
                    className="mt-4 rounded-xl text-xs font-bold"
                  >
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {products.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={{
                        id: prod.id,
                        seller_id: prod.seller_id,
                        name: prod.name,
                        brand: prod.brand,
                        brand_id: prod.brand_id,
                        brand_name: prod.brand_name,
                        category: prod.category,
                        selling_price: Number(prod.selling_price),
                        mrp: Number(prod.mrp),
                        discount_price: prod.discount_price ? Number(prod.discount_price) : null,
                        discount_starts_at: null,
                        discount_ends_at: null,
                        clearance: false,
                        stock: Number(prod.stock),
                        image_url: prod.image_url,
                        created_at: "",
                        average_rating: Number(prod.rating),
                        review_count: Number(prod.review_count),
                        shop_name: prod.shop_name,
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Mobile Filter Bottom Sheet */}
        <FilterBottomSheet
          open={mobileFilterOpen}
          onOpenChange={setMobileFilterOpen}
          filterDefinitions={filterDefs}
          filterState={filterState}
          facets={facets}
          totalProducts={total}
          onUpdateState={updateFilterState}
          onClearAll={handleClearAll}
        />
      </div>
    </AppShell>
  );
}
