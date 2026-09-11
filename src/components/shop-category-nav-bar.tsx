import { useState, useMemo, startTransition } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ALL_SHOP_CATEGORIES,
  DESKTOP_PRIORITY_CATEGORIES,
  MOBILE_PRIORITY_CATEGORIES,
  CATEGORY_PHOTOS,
  getCategoryByIdOrSlug,
  type ShopCategoryConfig,
} from "@/lib/shop-categories";
import { getSubcategoriesForCategory } from "@/lib/dynamic-filter-engine";
import { ChevronDown, Search, X, Sparkles, Check, Store, Layers } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ShopCategoryNavBarProps {
  activeCategorySlug?: string;
  activeSubcategoryId?: string;
  onSelectCategory?: (category: ShopCategoryConfig) => void;
  onSelectSubcategory?: (subcategoryId: string) => void;
  className?: string;
}

export function ShopCategoryNavBar({
  activeCategorySlug,
  activeSubcategoryId = "all",
  onSelectCategory,
  onSelectSubcategory,
  className = "",
}: ShopCategoryNavBarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Get current active category configuration
  const currentCategory = useMemo(() => {
    return getCategoryByIdOrSlug(activeCategorySlug);
  }, [activeCategorySlug]);

  // Retrieve 2nd-level subcategories for active category
  const subcategories = useMemo(() => {
    return getSubcategoriesForCategory(currentCategory.id);
  }, [currentCategory.id]);

  const handleCategorySelect = (category: ShopCategoryConfig) => {
    setIsDrawerOpen(false);
    startTransition(() => {
      if (onSelectCategory) {
        onSelectCategory(category);
      } else {
        const newCategoryParam = category.id === "all" ? undefined : category.slug;
        navigate({
          search: ((prev: any) => ({
            ...prev,
            category: newCategoryParam,
            subcategory: undefined,
          })) as any,
          resetScroll: false,
        });
      }
    });
  };

  const handleSubcategorySelect = (subId: string) => {
    startTransition(() => {
      if (onSelectSubcategory) {
        onSelectSubcategory(subId);
      } else {
        navigate({
          search: ((prev: any) => ({
            ...prev,
            subcategory: subId === "all" ? undefined : subId,
          })) as any,
          resetScroll: false,
        });
      }
    });
  };

  // Filter categories inside drawer search
  const filteredDrawerCategories = useMemo(() => {
    if (!searchQuery.trim()) return ALL_SHOP_CATEGORIES;
    const q = searchQuery.toLowerCase().trim();
    return ALL_SHOP_CATEGORIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.keywords.some((k) => k.toLowerCase().includes(q)),
    );
  }, [searchQuery]);

  // Group categories for drawer display
  const categoryGroups = useMemo(() => {
    return [
      {
        title: "Essentials & Daily Shopping",
        categories: ALL_SHOP_CATEGORIES.filter((c) =>
          [
            "all",
            "favorites",
            "grocery",
            "supermarkets",
            "pharmacy",
            "fruits_veg",
            "meat_fish",
          ].includes(c.id),
        ),
      },
      {
        title: "Food, Bakeries & Sweets",
        categories: ALL_SHOP_CATEGORIES.filter((c) =>
          ["bakery", "sweet_shops", "restaurants", "cafes"].includes(c.id),
        ),
      },
      {
        title: "Fashion, Accessories & Beauty",
        categories: ALL_SHOP_CATEGORIES.filter((c) =>
          ["fashion", "boutiques", "footwear", "jewellery", "beauty"].includes(c.id),
        ),
      },
      {
        title: "Electronics, Gadgets & Spares",
        categories: ALL_SHOP_CATEGORIES.filter((c) =>
          ["electronics", "mobile", "auto", "repair"].includes(c.id),
        ),
      },
      {
        title: "Home, Hardware & Supplies",
        categories: ALL_SHOP_CATEGORIES.filter((c) =>
          ["home_kitchen", "furniture", "hardware", "pooja"].includes(c.id),
        ),
      },
      {
        title: "Books, Leisure & Services",
        categories: ALL_SHOP_CATEGORIES.filter((c) =>
          [
            "books_stationery",
            "sports",
            "toys",
            "gifts",
            "flowers",
            "pet_shops",
            "local_services",
          ].includes(c.id),
        ),
      },
    ];
  }, []);

  return (
    <div
      className={`w-full bg-white/95 backdrop-blur-md border-b border-purple-100/80 sticky top-[64px] z-30 transition-all ${className}`}
    >
      {/* 1st Level Shop Category Navigation Bar */}
      <div className="mx-auto max-w-7xl px-3 sm:px-6 flex items-center gap-2 py-2">
        <div className="flex-1 overflow-x-auto scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex items-center gap-2 py-0.5 px-0.5">
          {/* Desktop Visibility */}
          <div className="hidden lg:flex items-center gap-1.5">
            {DESKTOP_PRIORITY_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = currentCategory.id === cat.id;
              const label =
                cat.id === "all"
                  ? "All Categories"
                  : cat.id === "fruits_veg"
                    ? "Fresh"
                    : cat.id === "meat_fish"
                      ? "Meat & Fish"
                      : cat.id === "bakery"
                        ? "Bakery & Sweets"
                        : cat.id === "fashion"
                          ? "Fashion"
                          : cat.id === "beauty"
                            ? "Beauty & Care"
                            : cat.id === "electronics"
                              ? "Electronics"
                              : cat.id === "home_kitchen"
                                ? "Home & Kitchen"
                                : cat.id === "pharmacy"
                                  ? "Pharmacy"
                                  : cat.id === "toys"
                                    ? "Kids & Sports"
                                    : cat.id === "favorites"
                                      ? "Local Favorites"
                                      : cat.name;

              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat)}
                  className={`group inline-flex items-center gap-1.5 rounded-full pl-1 pr-3 py-1 text-xs font-semibold whitespace-nowrap transition-all shrink-0 border ${
                    isSelected
                      ? "bg-purple-900 text-white font-bold shadow-xs border-purple-900 ring-1 ring-purple-900/40"
                      : "text-slate-700 bg-white hover:bg-purple-50 hover:text-purple-900 border-slate-200"
                  }`}
                >
                  {CATEGORY_PHOTOS[cat.id] ? (
                    <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-white/50 shadow-2xs">
                      <img
                        src={CATEGORY_PHOTOS[cat.id]}
                        alt={label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : cat.id === "all" ? (
                    <Layers className="h-3.5 w-3.5 text-[#F3D053]" />
                  ) : cat.id === "favorites" ? (
                    <span className="text-amber-500 text-xs">⭐</span>
                  ) : null}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Visibility */}
          <div className="flex lg:hidden items-center gap-1.5">
            {MOBILE_PRIORITY_CATEGORIES.map((cat) => {
              const isSelected = currentCategory.id === cat.id;
              const label =
                cat.id === "all"
                  ? "All Categories"
                  : cat.id === "fruits_veg"
                    ? "Fresh"
                    : cat.id === "meat_fish"
                      ? "Meat & Fish"
                      : cat.id === "bakery"
                        ? "Bakery & Sweets"
                        : cat.id === "fashion"
                          ? "Fashion"
                          : cat.id === "beauty"
                            ? "Beauty & Care"
                            : cat.id === "electronics"
                              ? "Electronics"
                              : cat.id === "home_kitchen"
                                ? "Home & Kitchen"
                                : cat.id === "pharmacy"
                                  ? "Pharmacy"
                                  : cat.id === "toys"
                                    ? "Kids & Sports"
                                    : cat.id === "favorites"
                                      ? "Local Favorites"
                                      : cat.name;

              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat)}
                  className={`group inline-flex items-center gap-1.5 rounded-full pl-1 pr-3 py-1 text-xs font-semibold whitespace-nowrap transition-all shrink-0 border ${
                    isSelected
                      ? "bg-purple-900 text-white font-bold shadow-xs border-purple-900 ring-1 ring-purple-900/40"
                      : "text-slate-700 bg-white hover:bg-purple-50 hover:text-purple-900 border-slate-200"
                  }`}
                >
                  {CATEGORY_PHOTOS[cat.id] ? (
                    <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-white/50 shadow-2xs">
                      <img
                        src={CATEGORY_PHOTOS[cat.id]}
                        alt={label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : cat.id === "all" ? (
                    <Layers className="h-3.5 w-3.5 text-[#F3D053]" />
                  ) : cat.id === "favorites" ? (
                    <span className="text-amber-500 text-xs">⭐</span>
                  ) : null}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Active fallback pill */}
          {!DESKTOP_PRIORITY_CATEGORIES.some((c) => c.id === currentCategory.id) && (
            <button
              onClick={() => handleCategorySelect(currentCategory)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap bg-purple-900 text-white shadow-md shrink-0"
            >
              <currentCategory.icon className="h-3.5 w-3.5 text-[#F3D053]" />
              <span>{currentCategory.name}</span>
            </button>
          )}

          {/* More Pill */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold whitespace-nowrap bg-purple-100/80 text-purple-900 hover:bg-purple-200 border border-purple-200/60 shrink-0 shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-700" />
            <span>More</span>
            <ChevronDown className="h-3.5 w-3.5 text-purple-700" />
          </button>
        </div>
      </div>

      {/* 2nd-LEVEL SUBCATEGORY FILTER STRIP */}
      {subcategories.length > 0 && currentCategory.id !== "all" && (
        <div className="bg-purple-50/60 border-t border-purple-100/70 py-1.5 px-3 sm:px-6">
          <div className="mx-auto max-w-7xl flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="text-[11px] font-black uppercase text-purple-900/60 shrink-0 flex items-center gap-1">
              <Layers className="h-3 w-3 text-purple-700" />
              Subcategory:
            </span>

            {/* All Subcategories Pill */}
            <button
              type="button"
              onClick={() => handleSubcategorySelect("all")}
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeSubcategoryId === "all"
                  ? "bg-purple-900 text-white shadow-2xs"
                  : "bg-white text-slate-700 hover:bg-purple-100 border border-purple-200/60"
              }`}
            >
              All {currentCategory.name}
            </button>

            {subcategories.map((sub) => {
              const isSelected = activeSubcategoryId === sub.id || activeSubcategoryId === sub.slug;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleSubcategorySelect(sub.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-purple-900 text-white shadow-2xs"
                      : "bg-white text-slate-700 hover:bg-purple-100 border border-purple-200/60"
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Drawer Modal */}
      <Dialog open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-3xl border-purple-100">
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 p-6 text-white shrink-0 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                  <Store className="h-5 w-5 text-[#F3D053]" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">
                    All Shop Categories
                  </DialogTitle>
                  <p className="text-xs text-purple-200 mt-0.5">
                    Browse all 30+ specialized local business types in your neighborhood
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search shop category (e.g. Bakery, Pharmacy, Flower Shop, Hardware)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl bg-white/95 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            {searchQuery ? (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Search Results ({filteredDrawerCategories.length})
                </h4>
                {filteredDrawerCategories.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <p className="text-sm font-medium">
                      No shop categories found matching "{searchQuery}"
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredDrawerCategories.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = currentCategory.id === cat.id;

                      return (
                        <button
                          key={cat.id}
                          onClick={() => handleCategorySelect(cat)}
                          className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? "bg-purple-900 text-white border-purple-900 shadow-md ring-2 ring-purple-900/20"
                              : "bg-white text-slate-800 border-slate-200 hover:border-purple-300 hover:shadow-sm"
                          }`}
                        >
                          <div
                            className={`p-2.5 rounded-xl shrink-0 ${isSelected ? "bg-white/10 text-[#F3D053]" : "bg-purple-50 text-purple-700"}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-bold truncate">{cat.name}</h5>
                              {isSelected && <Check className="h-3.5 w-3.5 text-[#F3D053]" />}
                            </div>
                            <p
                              className={`text-[11px] mt-0.5 line-clamp-2 leading-relaxed ${isSelected ? "text-purple-200" : "text-slate-500"}`}
                            >
                              {cat.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              categoryGroups.map((group) => (
                <div key={group.title}>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                    {group.title}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.categories.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = currentCategory.id === cat.id;
                      const photo = CATEGORY_PHOTOS[cat.id];

                      return (
                        <button
                          key={cat.id}
                          onClick={() => handleCategorySelect(cat)}
                          className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? "bg-purple-900 text-white border-purple-900 shadow-md ring-2 ring-purple-900/20"
                              : "bg-white text-slate-800 border-slate-200 hover:border-purple-300 hover:shadow-sm"
                          }`}
                        >
                          {photo ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/60 shadow-xs">
                              <img src={photo} alt={cat.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div
                              className={`p-2.5 rounded-xl shrink-0 ${isSelected ? "bg-white/10 text-[#F3D053]" : "bg-purple-50 text-purple-700"}`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-bold truncate">{cat.name}</h5>
                              {isSelected && <Check className="h-3.5 w-3.5 text-[#F3D053]" />}
                            </div>
                            <p
                              className={`text-[11px] mt-0.5 line-clamp-2 leading-relaxed ${isSelected ? "text-purple-200" : "text-slate-500"}`}
                            >
                              {cat.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
