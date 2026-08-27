import { useState, useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Star,
  MapPin,
  Filter,
  ChevronDown,
  BookOpen,
  ShoppingBag,
  Sparkles,
  Shirt,
  Wheat,
  Apple,
  Drumstick,
  Pill,
  Home,
  CookingPot,
  Gem,
  Building,
  Grid,
  CheckCircle2,
  Tag,
  Headphones,
  ShieldCheck,
  Clock,
  X,
  Search,
  Plus,
} from "lucide-react";
import type { Store, StoreCategory } from "@/lib/mock-data";
import { WishlistButton } from "@/components/wishlist-button";
import { scrollToShops } from "@/lib/scroll-utils";
import { getFallbackProductImage, resolveImageUrl } from "@/lib/image-utils";

interface CategoryMeta {
  id: StoreCategory | "all";
  label: string;
  shortLabel: string;
  icon: any;
  emoji: string;
  description: string;
  subCategories: string[];
}

export const CATEGORY_REGISTRY: Record<string, CategoryMeta> = {
  all: {
    id: "all",
    label: "All Shops",
    shortLabel: "All Shops",
    icon: Grid,
    emoji: "📊",
    description: "Explore all local businesses, specialized shops, and stores near your location.",
    subCategories: ["Local Stores", "Everything"],
  },
  showrooms: {
    id: "showrooms",
    label: "Showrooms",
    shortLabel: "Showrooms",
    icon: Building,
    emoji: "📺",
    description: "Explore grand textile showrooms, branded electronics, televisions, smart gadgets & home appliances.",
    subCategories: ["Textile Showroom", "Electronics & Appliances", "Jewellery Showroom"],
  },
  boutiques: {
    id: "boutiques",
    label: "Boutiques",
    shortLabel: "Boutiques",
    icon: Sparkles,
    emoji: "👗",
    description: "Explore designer boutiques, handloom silk sarees, custom kurti stitching, bridal wear & bespoke tailoring.",
    subCategories: ["Silk Sarees", "Designer Kurtis", "Bridal Tailoring"],
  },
  fast_fashion: {
    id: "fast_fashion",
    label: "Fast Fashion (Branded)",
    shortLabel: "Fast Fashion",
    icon: Tag,
    emoji: "🛍️",
    description: "Explore branded youth apparel, modern western tops, denim jeans, casual tees & trendy outfits.",
    subCategories: ["Youth Denim", "Branded Outlets", "Western Wear"],
  },
  individual_fashion: {
    id: "individual_fashion",
    label: "Individual Shops (Fashion)",
    shortLabel: "Individual Fashion",
    icon: Shirt,
    emoji: "👔",
    description: "Explore local menswear shops, pure cotton dhotis, readymade shirts, traditional attire & family clothing.",
    subCategories: ["Menswear", "Cotton Dhotis", "Family Readymades"],
  },
  flour_mill: {
    id: "flour_mill",
    label: "Flour & Masala Mill (மாவு & மசாலா ஆலை)",
    shortLabel: "Flour Shops",
    icon: Wheat,
    emoji: "🌾",
    description: "Explore local flour mills, freshly ground idli/dosa batter, sambar podi, turmeric powder, individual masalas & whole spices.",
    subCategories: ["Fresh Batter", "Pure Flour", "Individual Masalas"],
  },
  palamuthir: {
    id: "palamuthir",
    label: "Palamuthir Nilayam (பழமுதிர்)",
    shortLabel: "Palamuthir Nilayam",
    icon: Apple,
    emoji: "🍎",
    description: "Explore fresh fruit stalls, organic vegetables, fresh coconut water, green leafy greens & farm produce.",
    subCategories: ["Fresh Fruits", "Organic Veggies", "Tender Coconut"],
  },
  meat_fish: {
    id: "meat_fish",
    label: "Meat, Fish & Chicken",
    shortLabel: "Meat & Fish",
    icon: Drumstick,
    emoji: "🍗",
    description: "Explore fresh mutton, tender farm chicken, sea fish, prawns, eggs & daily fresh poultry stalls near you.",
    subCategories: ["Tender Mutton", "Country Chicken", "Fresh Sea Fish"],
  },
  pharmacy: {
    id: "pharmacy",
    label: "Pharmacy Individual",
    shortLabel: "Pharmacy",
    icon: Pill,
    emoji: "💊",
    description: "Explore local medical shops, 24/7 individual chemists, OTC healthcare, wellness supplements & surgical supplies.",
    subCategories: ["24/7 Chemist", "OTC Medicines", "Wellness Care"],
  },
  stationery: {
    id: "stationery",
    label: "Book Stalls & Stationery",
    shortLabel: "Book Stalls & Stationery",
    icon: BookOpen,
    emoji: "📖",
    description: "Explore book stalls, textbooks, notebooks, office supplies, greeting cards, art materials & school guides.",
    subCategories: ["Book Stall", "Stationery Shop", "Cards & Gifts"],
  },
  home_decor: {
    id: "home_decor",
    label: "Interior & Home Decor",
    shortLabel: "Home Decor",
    icon: Home,
    emoji: "🏺",
    description: "Explore interior decor studios, brass Agal lamps, wallpapers, designer curtains & handspun home furnishings.",
    subCategories: ["Interior Decor", "Brass Lamps", "Curtains & Blinds"],
  },
  kitchen_appliances: {
    id: "kitchen_appliances",
    label: "Kitchen Appliances",
    shortLabel: "Kitchen Appliances",
    icon: CookingPot,
    emoji: "🍳",
    description: "Explore pressure cookers, mixer grinders, stainless steel utensils, non-stick cookware & kitchen gas stoves.",
    subCategories: ["Utensils", "Mixer Grinders", "Cookware"],
  },
  fashion_accessories: {
    id: "fashion_accessories",
    label: "Fashion Accessories & Gifts",
    shortLabel: "Fashion Accessories",
    icon: Gem,
    emoji: "💎",
    description: "Explore gold-plated kammal, thoadu, chain, bangles, hair accessories, fancy jewellery & gift box sets.",
    subCategories: ["Kammal & Earrings", "Chain & Bangles", "Gift Box Sets"],
  },
  bakery: {
    id: "bakery",
    label: "Bakery & Confectionery",
    shortLabel: "Bakery",
    icon: CookingPot,
    emoji: "🥐",
    description: "Explore fresh oven bakes, butter pastries, hot chicken puffs, tea rusks, cream cakes & traditional biscuits.",
    subCategories: ["Bakes & Pastries", "Hot Puffs", "Cakes & Rusks"],
  },
  grocery: {
    id: "grocery",
    label: "Super Groceries & Provisions",
    shortLabel: "Grocery",
    icon: ShoppingBag,
    emoji: "🛒",
    description: "Explore monthly ration staples, Sona Masoori rice, cold pressed sesame oils, pulses & daily household provisions.",
    subCategories: ["Staples & Rice", "Oils & Ghee", "Pulses & Spices"],
  },
};

const CATEGORY_TABS = [
  "all",
  "showrooms",
  "boutiques",
  "fast_fashion",
  "flour_mill",
  "stationery",
  "palamuthir",
  "meat_fish",
  "pharmacy",
  "individual_fashion",
  "home_decor",
  "kitchen_appliances",
  "fashion_accessories",
  "bakery",
  "grocery",
];

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
  const [selectedSort, setSelectedSort] = useState<"popular" | "rating" | "distance" | "fast">("popular");
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [filterTopRated, setFilterTopRated] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Form states for Request Shop
  const [requestShopName, setRequestShopName] = useState("");
  const [requestArea, setRequestArea] = useState("");
  const [requestDetails, setRequestDetails] = useState("");
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const meta = CATEGORY_REGISTRY[activeCategory] || CATEGORY_REGISTRY.all;
  const CategoryIcon = meta.icon;

  const handleSelectTab = (catId: string) => {
    if (onCategoryChange) {
      onCategoryChange(catId);
    } else {
      navigate({
        search: (prev: Record<string, any>) => ({
          ...prev,
          category: catId === "all" ? undefined : catId,
        }),
        resetScroll: false,
      } as any);
      scrollToShops();
    }
  };

  const filteredStores = useMemo(() => {
    let result = stores;
    if (activeCategory && activeCategory !== "all") {
      result = result.filter((s) => s.category === activeCategory);
    }
    if (filterOpenNow) {
      result = result.filter((s) => s.isOpen);
    }
    if (filterTopRated) {
      result = result.filter((s) => s.rating >= 4.5);
    }

    return [...result].sort((a, b) => {
      if (selectedSort === "rating") return b.rating - a.rating;
      if (selectedSort === "distance") return a.distanceKm - b.distanceKm;
      if (selectedSort === "fast") return a.etaMin - b.etaMin;
      return (b.rating ?? 4.5) - (a.rating ?? 4.5);
    });
  }, [stores, activeCategory, filterOpenNow, filterTopRated, selectedSort]);

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
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* 1. Category Filter Pill Strip Header (Mobile responsive smooth touch scroll) */}
      <div className="relative">
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1 touch-pan-x">
          {CATEGORY_TABS.map((catKey) => {
            const item = CATEGORY_REGISTRY[catKey];
            if (!item) return null;
            const isSelected = activeCategory === catKey;
            const IconComponent = item.icon;

            return (
              <button
                key={catKey}
                type="button"
                onClick={() => handleSelectTab(catKey)}
                className={`shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs font-bold transition-all duration-200 shadow-2xs ${
                  isSelected
                    ? "bg-[#981495] text-white shadow-md ring-2 ring-[#981495]/30 scale-102"
                    : "bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <IconComponent className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isSelected ? "text-white" : "text-[#981495]"}`} />
                <span className="whitespace-nowrap">{item.shortLabel}</span>
              </button>
            );
          })}

          {/* More Categories Dropdown Button */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs font-bold bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 transition-all"
            >
              <span>More</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            </button>

            {/* Dropdown Menu for Extra Categories */}
            {showMoreMenu && (
              <div className="absolute right-0 mt-2 w-60 sm:w-64 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 p-2 space-y-1 max-h-80 overflow-y-auto">
                <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                  All Marketplace Categories
                </div>
                {Object.keys(CATEGORY_REGISTRY).map((key) => {
                  const item = CATEGORY_REGISTRY[key];
                  const IconC = item.icon;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        handleSelectTab(key);
                        setShowMoreMenu(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors ${
                        activeCategory === key
                          ? "bg-purple-50 text-[#981495]"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <IconC className="h-4 w-4 text-[#981495]" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Category Header Banner Card */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-100 bg-gradient-to-r from-[#f5f3ff] via-[#faf5ff] to-white p-4 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5">
          <div className="flex items-start gap-3.5 sm:gap-4">
            {/* Category Icon Circle Badge */}
            <div className="flex h-11 w-11 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-[#981495]/10 text-[#981495] shadow-2xs">
              <CategoryIcon className="h-5 w-5 sm:h-7 sm:w-7 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <h1 className="font-display text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {activeCategory === "all" ? "All Marketplace Shops" : `Shops in ${meta.label}`}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                {meta.description}
              </p>
            </div>
          </div>

          {/* Near Me Action Pill Button */}
          <div className="shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setFilterOpenNow(false);
                setSelectedSort("distance");
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-white px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-extrabold text-[#981495] shadow-2xs hover:bg-purple-50 transition-colors"
            >
              <MapPin className="h-3.5 w-3.5 text-[#981495]" />
              <span>Near Me</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Filter & Sort Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-1">
        {/* Left Filter & Sort Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter Trigger Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                filterOpenNow || filterTopRated
                  ? "border-[#981495] bg-purple-50 text-[#981495]"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <span>Filter</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {/* Filter Toggle Menu */}
            {showFilterMenu && (
              <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-2xl z-40 p-3 space-y-2">
                <div className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">
                  Filter Options
                </div>
                <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={filterOpenNow}
                    onChange={(e) => setFilterOpenNow(e.target.checked)}
                    className="rounded border-slate-300 text-[#981495] focus:ring-[#981495]"
                  />
                  <span>Open Now Only</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={filterTopRated}
                    onChange={(e) => setFilterTopRated(e.target.checked)}
                    className="rounded border-slate-300 text-[#981495] focus:ring-[#981495]"
                  />
                  <span>Top Rated (4.5★ +)</span>
                </label>
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-slate-400 hidden xs:inline">Sort:</span>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value as any)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer text-xs"
            >
              <option value="popular">Popular</option>
              <option value="rating">Rating: High to Low</option>
              <option value="distance">Distance: Nearest First</option>
              <option value="fast">Fast Delivery</option>
            </select>
          </div>
        </div>

        {/* Right Shop Count */}
        <div className="text-xs font-extrabold text-slate-500">
          {filteredStores.length} Shop{filteredStores.length === 1 ? "" : "s"} Found
        </div>
      </div>

      {/* 4. Shops Grid Cards (Responsive 1 col mobile, 2 col tablet, 4 col desktop) */}
      {filteredStores.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 sm:p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-[#981495]">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">No shops found matching your criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your filters or search for another local business category.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterOpenNow(false);
              setFilterTopRated(false);
              handleSelectTab("all");
            }}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#981495] hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredStores.map((store, index) => {
            const storeSubcategory =
              meta?.subCategories?.length
                ? meta.subCategories[index % meta.subCategories.length]
                : meta?.shortLabel || "Local Shop";

            return (
              <Link
                key={store.id}
                to="/store/$storeId"
                params={{ storeId: store.id }}
                className="group relative flex flex-col rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* Shop Image Container */}
                <div className="relative h-40 sm:h-44 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={resolveImageUrl(store.imageUrl, store.name, store.category)}
                    alt={store.name}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getFallbackProductImage(store.name, store.category);
                    }}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Featured Badge (Top Left) */}
                  {(store.rating >= 4.7 || index === 0) && (
                    <div className="absolute top-2.5 left-2.5 bg-[#981495] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-md shadow-sm">
                      Featured
                    </div>
                  )}

                  {/* Wishlist Button (Top Right) */}
                  <div
                    className="absolute top-2.5 right-2.5 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <WishlistButton productId={store.id} productName={store.name} />
                  </div>
                </div>

                {/* Shop Card Content */}
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {/* Title */}
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base line-clamp-1 group-hover:text-[#981495] transition-colors">
                      {store.name}
                    </h3>

                    {/* Rating & Review line */}
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="flex items-center gap-0.5 font-extrabold text-emerald-700">
                        <Star className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" />
                        {store.rating.toFixed(1)}
                      </span>
                      <span className="text-slate-400">({75 + index * 18})</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-medium text-slate-500 truncate max-w-[110px]">
                        {storeSubcategory}
                      </span>
                    </div>

                    {/* Tagline / Description */}
                    <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {store.tagline || meta.description}
                    </p>
                  </div>

                  {/* Bottom Meta Row (Distance + Open Status) */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{store.distanceKm} km</span>
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                        store.isOpen
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {store.isOpen ? "Open" : "Closed"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* 5. "Can't find what you need?" Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/60 to-purple-50 border border-purple-100 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-[#981495]/10 text-[#981495]">
            <Tag className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
              Can't find what you need?
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Tell us what you're looking for and we'll help you find the best shops.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsRequestModalOpen(true)}
          className="w-full sm:w-auto shrink-0 rounded-xl bg-[#981495] hover:bg-[#6D28D9] text-white font-extrabold text-xs px-5 py-2.5 shadow-md hover:shadow-lg transition-all active:scale-95 text-center"
        >
          Request a Shop
        </button>
      </div>

      {/* 6. Bottom Trust / Features Strip (2 cols on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
        <div className="flex items-center gap-3 rounded-2xl bg-white border border-slate-100 p-3.5 sm:p-4 shadow-2xs">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#981495]">
            <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-xs sm:text-sm">Verified Shops</div>
            <div className="text-[10px] sm:text-[11px] text-slate-500">All shops are verified</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white border border-slate-100 p-3.5 sm:p-4 shadow-2xs">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#981495]">
            <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-xs sm:text-sm">Nearby & Easy</div>
            <div className="text-[10px] sm:text-[11px] text-slate-500">Shops near location</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white border border-slate-100 p-3.5 sm:p-4 shadow-2xs">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#981495]">
            <Star className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-xs sm:text-sm">Top Rated</div>
            <div className="text-[10px] sm:text-[11px] text-slate-500">Best rated by users</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white border border-slate-100 p-3.5 sm:p-4 shadow-2xs">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#981495]">
            <Headphones className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-xs sm:text-sm">Need Help?</div>
            <div className="text-[10px] sm:text-[11px] text-slate-500">We're here to assist</div>
          </div>
        </div>
      </div>

      {/* 7. Interactive Request a Shop Modal (Mobile bottom sheet or centered dialog) */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 relative animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-[#981495]">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Request a Shop</h3>
                <p className="text-xs text-slate-500">Can't find a store? We'll onboard them for you!</p>
              </div>
            </div>

            {requestSubmitted ? (
              <div className="py-6 text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-base">Request Received!</h4>
                <p className="text-xs text-slate-500">
                  Thank you! Our local agent will verify and contact this store.
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
                    placeholder="e.g. Higginbothams Book Stall, Amman Mill..."
                    value={requestShopName}
                    onChange={(e) => setRequestShopName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#981495] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Area / Street / Landmark
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bazaar Street, Near Bus Stand..."
                    value={requestArea}
                    onChange={(e) => setRequestArea(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#981495] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Items You are Looking For
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe specific products or masalas..."
                    value={requestDetails}
                    onChange={(e) => setRequestDetails(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#981495] focus:outline-none"
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
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#981495] hover:bg-[#6D28D9] text-white shadow-md"
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
