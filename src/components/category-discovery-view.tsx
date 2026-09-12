import { useState, useMemo, startTransition, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Star,
  MapPin,
  Filter,
  ChevronDown,
  Clock,
  CheckCircle2,
  Tag,
  ShieldCheck,
  Headphones,
  X,
  Sparkles,
  ArrowRight,
  Store as StoreIcon,
  Layers,
  Package,
} from "lucide-react";
import type { Store } from "@/lib/mock-data";
import { WishlistButton } from "@/components/wishlist-button";
import { scrollToShops } from "@/lib/scroll-utils";
import { getFallbackProductImage, resolveImageUrl } from "@/lib/image-utils";
import { useDeliveryLocation } from "@/lib/location-store";
import { SmartLottieLoader } from "@/components/ui/smart-lottie-loader";
import {
  getCategoryByIdOrSlug,
  isStoreInCategory,
  ShopCategoryConfig,
} from "@/lib/shop-categories";
import { ShopCategoryNavBar } from "@/components/shop-category-nav-bar";
import { calculateHaversineDistanceKm } from "@/lib/map-service/providers";
import {
  getSubcategoriesForCategory,
  getProductTypesForSubcategory,
  getActiveAttributeFilters,
  filterStoreByState,
  INITIAL_FILTER_STATE,
  type ActiveFilterState,
} from "@/lib/dynamic-filter-engine";
import { DynamicFilterBar } from "@/components/dynamic-filter-bar";

export function CategoryDiscoveryView({
  stores,
  activeCategory = "all",
  onCategoryChange,
}: {
  stores: Store[];
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
}) {
  const navigate = useNavigate();
  const [deliveryLoc] = useDeliveryLocation();
  const locLat = deliveryLoc?.lat ?? 11.0285;
  const locLng = deliveryLoc?.lng ?? 76.9258;

  // Active filter state
  const [activeSubcategoryId, setActiveSubcategoryId] = useState<string>("all");
  const [activeProductTypeId, setActiveProductTypeId] = useState<string>("all");
  const [activeFilterState, setActiveFilterState] = useState<ActiveFilterState>(INITIAL_FILTER_STATE);

  const [selectedSort, setSelectedSort] = useState<"popular" | "rating" | "distance" | "fast">(
    "distance",
  );
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [filterTopRated, setFilterTopRated] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Request Shop modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestShopName, setRequestShopName] = useState("");
  const [requestArea, setRequestArea] = useState("");
  const [requestDetails, setRequestDetails] = useState("");
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // Shop discovery loading state
  const [isDiscoveringShops, setIsDiscoveringShops] = useState(false);

  // Current category config
  const categoryConfig = useMemo(() => {
    return getCategoryByIdOrSlug(activeCategory);
  }, [activeCategory]);

  const CategoryIcon = categoryConfig.icon;

  // Reset subcategory & product type when main category changes
  useEffect(() => {
    setActiveSubcategoryId("all");
    setActiveProductTypeId("all");
    setActiveFilterState(INITIAL_FILTER_STATE);
  }, [activeCategory]);

  useEffect(() => {
    setIsDiscoveringShops(true);
    const timer = setTimeout(() => {
      setIsDiscoveringShops(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [
    activeCategory,
    activeSubcategoryId,
    activeProductTypeId,
    activeFilterState,
    deliveryLoc?.area,
    selectedSort,
    filterOpenNow,
    filterTopRated,
  ]);

  // Subcategories & Product types available
  const subcategories = useMemo(() => {
    return getSubcategoriesForCategory(categoryConfig.id);
  }, [categoryConfig.id]);

  const productTypes = useMemo(() => {
    return getProductTypesForSubcategory(categoryConfig.id, activeSubcategoryId);
  }, [categoryConfig.id, activeSubcategoryId]);

  // Dynamic Attribute Filters available for current Category + Subcategory + ProductType
  const dynamicAttributeFilters = useMemo(() => {
    return getActiveAttributeFilters(
      categoryConfig.id,
      activeSubcategoryId,
      activeProductTypeId
    );
  }, [categoryConfig.id, activeSubcategoryId, activeProductTypeId]);

  const handleCategorySelect = (category: ShopCategoryConfig) => {
    startTransition(() => {
      if (onCategoryChange) {
        onCategoryChange(category.id);
      } else {
        navigate({
          search: (prev: Record<string, any>) => ({
            ...prev,
            category: category.id === "all" ? undefined : category.slug,
            subcategory: undefined,
          }),
          resetScroll: false,
        } as any);
        scrollToShops();
      }
    });
  };

  const handleSubcategorySelect = (subId: string) => {
    startTransition(() => {
      setActiveSubcategoryId(subId);
      setActiveProductTypeId("all");
    });
  };

  const handleProductTypeSelect = (pTypeId: string) => {
    startTransition(() => {
      setActiveProductTypeId(pTypeId);
    });
  };

  // Filtered & Distance-Calculated Shops List
  const filteredStores = useMemo(() => {
    let result = stores.map((s, idx) => {
      const storeLat = Number(s.lat) || locLat + idx * 0.005;
      const storeLng = Number(s.lng) || locLng + idx * 0.005;
      const computedDistanceKm = calculateHaversineDistanceKm(
        locLat,
        locLng,
        storeLat,
        storeLng,
      );
      const computedEta = Math.max(10, Math.round(computedDistanceKm * 5 + 10));

      return {
        ...s,
        distanceKm: Number(computedDistanceKm.toFixed(1)),
        etaMin: computedEta,
      };
    });

    // Filter by Shop Category using centralized matching engine
    if (activeCategory && activeCategory !== "all" && activeCategory !== "all-shops") {
      result = result.filter((s) => isStoreInCategory(s.category, activeCategory, s.rating));
    }

    // Filter by Dynamic State
    const evalState: ActiveFilterState = {
      ...activeFilterState,
      categoryId: activeCategory,
      subcategoryId: activeSubcategoryId,
      productTypeId: activeProductTypeId,
      openNowOnly: filterOpenNow,
      minRating: filterTopRated ? 4.5 : undefined,
    };

    result = result.filter((s) => filterStoreByState(s, evalState));

    return [...result].sort((a, b) => {
      if (selectedSort === "distance") return a.distanceKm - b.distanceKm;
      if (selectedSort === "fast") return a.etaMin - b.etaMin;
      if (selectedSort === "rating") return b.rating - a.rating;
      return a.distanceKm - b.distanceKm;
    });
  }, [
    stores,
    activeCategory,
    activeSubcategoryId,
    activeProductTypeId,
    activeFilterState,
    filterOpenNow,
    filterTopRated,
    selectedSort,
    deliveryLoc,
  ]);

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestShopName.trim()) return;
    setRequestSubmitted(true);
    setTimeout(() => {
      setRequestSubmitted(false);
      setIsRequestModalOpen(false);
      setRequestShopName("");
      setRequestArea("");
      setRequestDetails("");
    }, 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6">
      {/* 1. TOP HORIZONTAL CATEGORY & SUBCATEGORY NAVIGATION BAR */}
      <ShopCategoryNavBar
        activeCategorySlug={activeCategory}
        activeSubcategoryId={activeSubcategoryId}
        onSelectCategory={handleCategorySelect}
        onSelectSubcategory={handleSubcategorySelect}
        className="-mx-3 sm:-mx-6 lg:-mx-8 rounded-2xl shadow-xs border-purple-100"
      />

      {/* 2. DYNAMIC CATEGORY HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-200/70 bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 p-5 sm:p-7 text-white shadow-xl">
        <div className="absolute right-0 top-0 w-64 h-64 opacity-15 bg-radial from-[#F3D053] to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#F3D053] backdrop-blur-md border border-white/15 shadow-inner">
              <CategoryIcon className="h-6 w-6 sm:h-7 sm:w-7 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F3D053]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#F3D053] uppercase tracking-wider backdrop-blur-xs border border-[#F3D053]/30">
                  <Sparkles className="h-3 w-3" /> Hyperlocal Shop Category
                </span>
                {activeSubcategoryId !== "all" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/30 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider border border-purple-400/30">
                    <Layers className="h-3 w-3 text-purple-300" /> Subcategory Active
                  </span>
                )}
              </div>
              <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                {categoryConfig.heading}
              </h1>
              <p className="text-xs sm:text-sm text-purple-200 leading-relaxed max-w-2xl">
                {categoryConfig.subheading} around{" "}
                <span className="font-bold text-[#F3D053] underline underline-offset-2">
                  {deliveryLoc?.area || deliveryLoc?.city || "your location"}
                </span>
              </p>
            </div>
          </div>

          <div className="shrink-0 self-start sm:self-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFilterOpenNow(false);
                setSelectedSort("distance");
              }}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-white/15 hover:bg-white/25 px-4 py-2 text-xs font-bold text-white border border-white/20 backdrop-blur-md transition-all shadow-xs"
            >
              <MapPin className="h-3.5 w-3.5 text-[#F3D053]" />
              <span>Nearest Shops</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. PRODUCT TYPES HORIZONTAL STRIP (3rd Tier Navigation) */}
      {productTypes.length > 0 && activeCategory !== "all" && (
        <div className="bg-white rounded-2xl border border-purple-100 p-3 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-purple-900/70 flex items-center gap-1.5 tracking-wider">
              <Package className="h-3.5 w-3.5 text-purple-700" />
              Select Product Type
            </span>
            {activeProductTypeId !== "all" && (
              <button
                type="button"
                onClick={() => handleProductTypeSelect("all")}
                className="text-[11px] font-bold text-purple-700 hover:underline"
              >
                Clear product type
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1">
            <button
              type="button"
              onClick={() => handleProductTypeSelect("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border ${
                activeProductTypeId === "all"
                  ? "bg-purple-900 text-white border-purple-900 shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50 hover:border-purple-300"
              }`}
            >
              All Product Types
            </button>

            {productTypes.map((pt) => {
              const isSelected = activeProductTypeId === pt.id || activeProductTypeId === pt.slug;
              return (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => handleProductTypeSelect(pt.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    isSelected
                      ? "bg-purple-900 text-white border-purple-900 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50 hover:border-purple-300"
                  }`}
                >
                  {pt.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. DYNAMIC ATTRIBUTE FILTER BAR (4th Tier Dynamic Attribute Filters) */}
      {dynamicAttributeFilters.length > 0 && (
        <DynamicFilterBar
          filters={dynamicAttributeFilters}
          activeState={activeFilterState}
          onChange={(newState) => startTransition(() => setActiveFilterState(newState))}
          className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-2xs"
        />
      )}

      {/* 5. FILTER & SORT CONTROLS ROW */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-1 border-b border-slate-100 pb-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Filter Badges */}
          <button
            onClick={() => startTransition(() => setFilterOpenNow(!filterOpenNow))}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              filterOpenNow
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            🟢 Open Shops Only
          </button>

          <button
            onClick={() => startTransition(() => setFilterTopRated(!filterTopRated))}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              filterTopRated
                ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            ⭐ Highly Rated (4.5★+)
          </button>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-slate-400 hidden xs:inline">Sort:</span>
            <select
              value={selectedSort}
              onChange={(e) => {
                const val = e.target.value as any;
                startTransition(() => setSelectedSort(val));
              }}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer text-xs"
            >
              <option value="popular">Popularity</option>
              <option value="rating">Rating: High to Low</option>
              <option value="distance">Distance: Nearest First</option>
              <option value="fast">Fast Delivery Time</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-extrabold text-slate-500">
          Showing <span className="text-purple-900 font-extrabold">{filteredStores.length}</span>{" "}
          Local Shops
        </div>
      </div>

      {/* 6. SHOP GRID CARDS */}
      {isDiscoveringShops ? (
        <div className="py-12 flex justify-center items-center rounded-3xl bg-white border border-purple-100 shadow-xs">
          <SmartLottieLoader
            message={`Finding verified shops near ${deliveryLoc?.area || deliveryLoc?.city || "you"}...`}
            size="md"
          />
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-purple-200 bg-white p-8 sm:p-12 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
            <StoreIcon className="h-7 w-7" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-lg">
            No shops found in "{categoryConfig.name}"
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            We couldn't find any stores matching this specific category and dynamic filters around{" "}
            {deliveryLoc?.area || "your area"}. Try resetting your filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterOpenNow(false);
              setFilterTopRated(false);
              setActiveSubcategoryId("all");
              setActiveProductTypeId("all");
              setActiveFilterState(INITIAL_FILTER_STATE);
              handleCategorySelect(getCategoryByIdOrSlug("all"));
            }}
            className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-900 hover:underline pt-2"
          >
            Explore All Shops Near You →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredStores.map((store) => (
            <Link
              key={store.id}
              to="/store/$storeId"
              params={{ storeId: store.id }}
              className="group relative flex flex-col rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* Shop Cover Image */}
              <div className="relative h-44 sm:h-48 w-full bg-slate-100 overflow-hidden">
                <img
                  src={resolveImageUrl(store.imageUrl, store.name, store.category)}
                  alt={store.name}
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getFallbackProductImage(
                      store.name,
                      store.category,
                    );
                  }}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                {/* Top Badge */}
                <div className="absolute top-3 left-3 bg-slate-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md border border-white/20">
                  {store.category.replace("_", " ").toUpperCase()}
                </div>

                <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
                  <WishlistButton productId={store.id} productName={store.name} />
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-bold">
                  <span className="flex items-center gap-1 bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                    <Clock className="h-3 w-3 text-amber-300" /> {store.etaMin} mins
                  </span>
                  <span className="flex items-center gap-1 bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                    <MapPin className="h-3 w-3 text-amber-300" /> {store.distanceKm} km away
                  </span>
                </div>
              </div>

              {/* Shop Content */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-extrabold text-slate-900 text-base line-clamp-1 group-hover:text-purple-700 transition-colors">
                      {store.name}
                    </h3>

                    <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg text-xs font-extrabold shrink-0 border border-emerald-200/60">
                      <Star className="h-3 w-3 fill-emerald-600 text-emerald-600" />
                      <span>{store.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                    {store.tagline || categoryConfig.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                      store.isOpen
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${store.isOpen ? "bg-emerald-600 animate-pulse" : "bg-slate-400"}`}
                    />
                    {store.isOpen ? "Open Now" : "Closed"}
                  </span>

                  <span className="text-xs font-bold text-purple-700 group-hover:text-purple-900 flex items-center gap-1">
                    Visit Shop{" "}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 7. REQUEST A SHOP BANNER */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 p-5 sm:p-7 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-amber-300 border border-white/15 backdrop-blur-sm">
            <Tag className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="font-extrabold text-white text-base sm:text-lg">
              Don't see your favorite neighborhood shop listed?
            </h4>
            <p className="text-xs sm:text-sm text-purple-200 mt-0.5 max-w-xl">
              Submit a shop request! Our LocalShoree ground operations team will onboard your trusted
              local store so you can order delivery.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsRequestModalOpen(true)}
          className="w-full sm:w-auto shrink-0 rounded-2xl bg-gold-gradient text-slate-950 font-black text-xs px-6 py-3 shadow-md hover:shadow-xl hover:scale-105 transition-all active:scale-95 text-center border border-white/40"
        >
          Request Shop Onboarding
        </button>
      </div>

      {/* TRUST & VERIFICATION STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
        <div className="flex items-center gap-3 rounded-2xl bg-white border border-slate-100 p-4 shadow-2xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-xs sm:text-sm">100% Local Shops</div>
            <div className="text-[11px] text-slate-500">Verified neighborhood sellers</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white border border-slate-100 p-4 shadow-2xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
              Hyperlocal Radius
            </div>
            <div className="text-[11px] text-slate-500">Direct from nearby streets</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white border border-slate-100 p-4 shadow-2xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
            <Star className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-xs sm:text-sm">Real Ratings</div>
            <div className="text-[11px] text-slate-500">Community verified reviews</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white border border-slate-100 p-4 shadow-2xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
            <Headphones className="h-5 w-5" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-xs sm:text-sm">Local Support</div>
            <div className="text-[11px] text-slate-500">Fast customer assistance</div>
          </div>
        </div>
      </div>

      {/* REQUEST SHOP MODAL */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-purple-800">
                <Tag className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Request a Shop</h3>
                <p className="text-xs text-slate-500">
                  Can't find a store? We'll onboard them for you!
                </p>
              </div>
            </div>

            {requestSubmitted ? (
              <div className="py-6 text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-base">Request Received!</h4>
                <p className="text-xs text-slate-500">
                  Thank you! Our local team will contact this store.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Shop / Store Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sri Krishna Sweets & Bakery..."
                    value={requestShopName}
                    onChange={(e) => setRequestShopName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Area / Landmark
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pappampatti Pirivu, Trichy Road..."
                    value={requestArea}
                    onChange={(e) => setRequestArea(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Items You are Looking For
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe specific products..."
                    value={requestDetails}
                    onChange={(e) => setRequestDetails(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-700 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-md"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
