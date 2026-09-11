import { useState, useEffect, useMemo, startTransition } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { type SearchResultItem } from "@/lib/search-service";
import { useLiveSearchResults } from "@/hooks/use-live-search-results";
import { HighlightText } from "@/components/ui/swiggy-instant-search-dropdown";
import { ChevronLeft, X, Search as SearchIcon, SlidersHorizontal, Sparkles, Filter } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMLTracker } from "@/hooks/use-ml-tracker";
import { parseQueryIntent } from "@/lib/ml-shop-ranker";
import { LottieLoading } from "@/components/ui/lottie-loading";
import { parseFilterParams, serializeFilterParams } from "@/lib/filter-utils";
import { useFilterDefinitions } from "@/hooks/use-filter-definitions";
import { useProductFilters } from "@/hooks/use-product-filters";
import { DynamicFilterPanel } from "@/components/filters/dynamic-filter-panel";
import { FilterBottomSheet } from "@/components/filters/filter-bottom-sheet";
import { FilterChips } from "@/components/filters/filter-chips";
import { SortDropdown } from "@/components/filters/sort-dropdown";
import { ProductCard } from "@/components/merchandising-sections";

export const Route = createFileRoute("/search")({
  component: SwiggySearchPage,
  validateSearch: (search: Record<string, unknown>) => search,
});

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

  const {
    products,
    total,
    loading,
    facets,
  } = useProductFilters(filterState);

  const { results: liveResults, isLoading: liveLoading } = useLiveSearchResults(query);
  const [activeTab, setActiveTab] = useState<string>("All");

  const intent = parseQueryIntent(query);

  useEffect(() => {
    setQuery(filterState.query || "");
    if (filterState.query && filterState.query.trim().length > 1) {
      trackSearch(filterState.query, undefined, undefined, total);
    }
  }, [filterState.query]);

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

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-20 pt-4 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Swiggy Style Search Bar Container */}
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
              onChange={(e) => {
                const val = e.target.value;
                setQuery(val);
                updateFilterState({ query: val, page: 1 });
              }}
              placeholder="Search shops, t-shirts, smartphones, groceries..."
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

        {/* Hyper-Local Category Pills Bar */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 mb-4 scrollbar-none max-w-full">
          {[
            {
              id: "all",
              label: "All Categories",
              imageUrl: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=160&q=80",
            },
            {
              id: "fashion",
              label: "Fashion & Apparel",
              imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=160&q=80",
            },
            {
              id: "mobile-accessories",
              label: "Mobile & Tech",
              imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=160&q=80",
            },
            {
              id: "grocery",
              label: "Grocery & Ration",
              imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=160&q=80",
            },
            {
              id: "bakery",
              label: "Bakery & Sweets",
              imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=160&q=80",
            },
            {
              id: "food-restaurants",
              label: "Food & Dining",
              imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=160&q=80",
            },
            {
              id: "footwear",
              label: "Footwear",
              imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=160&q=80",
            },
            {
              id: "furniture-home-decor",
              label: "Home & Decor",
              imageUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=160&q=80",
            },
          ].map((cat) => {
            const isSelected =
              cat.id === "all"
                ? !filterState.category || filterState.category === "all"
                : Boolean(
                    filterState.category &&
                      (filterState.category.toLowerCase() === cat.id.toLowerCase() ||
                        filterState.category.toLowerCase().includes(cat.id.toLowerCase()) ||
                        cat.id.toLowerCase().includes(filterState.category.toLowerCase())),
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

        {/* Results Header & Controls Bar */}
        <div className="flex items-center justify-between gap-3 border-b border-border/80 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-foreground">Marketplace Products</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              {total}
            </span>
            {loading && <span className="animate-pulse text-xs font-semibold text-primary ml-2">Updating...</span>}
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
          {/* Desktop Left Sidebar: Dynamic Filter Panel */}
          <div className="hidden md:block w-64 lg:w-72 shrink-0 sticky top-20">
            <DynamicFilterPanel
              filterDefinitions={filterDefs}
              filterState={filterState}
              facets={facets}
              onUpdateState={updateFilterState}
              onClearAll={handleClearAll}
            />
          </div>

          {/* Right Area: Products Grid */}
          <div className="flex-1 min-w-0">
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
              <div className="text-center py-16 bg-card border hairline rounded-2xl p-8">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                  <SearchIcon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-foreground">No products match your filters</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                  Try removing some filters or broadening your price range to see available local items.
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
