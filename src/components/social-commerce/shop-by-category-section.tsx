import { useState, useRef, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, ChevronLeft, Layers, X, Search, Sparkles } from "lucide-react";
import { CATEGORY_PHOTOS } from "@/lib/shop-categories";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  emoji?: string;
  description: string;
}

export const ALL_CATEGORIES_LIST: CategoryItem[] = [
  {
    id: "fruits_veg",
    name: "Fresh Produce",
    slug: "fruits_veg",
    imageUrl: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=300&q=80",
    emoji: "🥬",
    description: "Farm-fresh fruits, organic vegetables & daily greens",
  },
  {
    id: "meat_fish",
    name: "Meat & Fish",
    slug: "meat_fish",
    imageUrl: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=300&q=80",
    emoji: "🥩",
    description: "Tender chicken, mutton, seafood & fresh cuts",
  },
  {
    id: "bakery",
    name: "Bakery & Sweets",
    slug: "bakery",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80",
    emoji: "🥐",
    description: "Artisan breads, cakes, pastries & traditional sweets",
  },
  {
    id: "pharmacy",
    name: "Pharmacy & Care",
    slug: "pharmacy",
    imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=300&q=80",
    emoji: "💊",
    description: "24/7 medicines, wellness essentials & healthcare",
  },
  {
    id: "restaurants",
    name: "Restaurants & Dining",
    slug: "restaurants",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80",
    emoji: "🍽️",
    description: "Authentic tiffin, biryani & local neighborhood dining",
  },
  {
    id: "fashion",
    name: "Fashion & Apparel",
    slug: "fashion",
    imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=300&q=80",
    emoji: "👕",
    description: "Local clothing, sarees, ethnic wear & modern apparel",
  },
  {
    id: "electronics",
    name: "Electronics",
    slug: "electronics",
    imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=300&q=80",
    emoji: "🎧",
    description: "Smartphones, headphones, gadgets & accessories",
  },
  {
    id: "home_kitchen",
    name: "Home & Living",
    slug: "home_kitchen",
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80",
    emoji: "🛋️",
    description: "Cookware, decor, furnishings & living essentials",
  },
  {
    id: "beauty",
    name: "Beauty & Wellness",
    slug: "beauty",
    imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=300&q=80",
    emoji: "🧴",
    description: "Skincare, cosmetics, personal grooming & ayurveda",
  },
  {
    id: "footwear",
    name: "Footwear",
    slug: "footwear",
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=300&q=80",
    emoji: "👟",
    description: "Casual shoes, formal shoes, sandals, sneakers & more",
  },
  {
    id: "jewellery",
    name: "Jewellery & Gifts",
    slug: "jewellery",
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=300&q=80",
    emoji: "💍",
    description: "Silver, gold, traditional jewels, watches & gift items",
  },
  {
    id: "grocery",
    name: "Kirana & Grocery",
    slug: "grocery",
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
    emoji: "🌾",
    description: "Daily ration, staples, cold-pressed oils & provisions",
  },
  {
    id: "books_stationery",
    name: "Books & Stationery",
    slug: "books_stationery",
    imageUrl: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=300&q=80",
    emoji: "📚",
    description: "School supplies, books, craft materials & office items",
  },
  {
    id: "sports",
    name: "Sports & Outdoors",
    slug: "sports",
    imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&w=300&q=80",
    emoji: "⚽",
    description: "Cricket gear, fitness equipment & outdoor games",
  },
  {
    id: "flowers",
    name: "Flowers & Plants",
    slug: "flowers",
    imageUrl: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=300&q=80",
    emoji: "💐",
    description: "Fresh flower garlands, indoor plants & bouquets",
  },
  {
    id: "pet_shops",
    name: "Pet Care",
    slug: "pet_shops",
    imageUrl: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=300&q=80",
    emoji: "🐾",
    description: "Pet food, accessories, toys & pet care supplies",
  },
];

interface ShopByCategorySectionProps {
  onSelectCategory?: (categorySlug: string) => void;
  selectedCategory?: string;
}

export function ShopByCategorySection({
  onSelectCategory,
  selectedCategory,
}: ShopByCategorySectionProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAllCategoriesOpen, setIsAllCategoriesOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");

  const handleCategoryClick = (catSlug: string) => {
    const isSelected = selectedCategory === catSlug;
    const targetSlug = isSelected ? "" : catSlug;
    if (onSelectCategory) {
      onSelectCategory(targetSlug);
    } else {
      void navigate({
        to: "/",
        search: { category: targetSlug || undefined, q: undefined },
      });
    }
  };

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -280, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 280, behavior: "smooth" });
  };

  const filteredCategories = useMemo(() => {
    if (!categorySearchQuery.trim()) return ALL_CATEGORIES_LIST;
    const q = categorySearchQuery.toLowerCase();
    return ALL_CATEGORIES_LIST.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        (cat.description && cat.description.toLowerCase().includes(q))
    );
  }, [categorySearchQuery]);

  return (
    <section className="relative rounded-3xl bg-white p-4 sm:p-5 md:p-6 border border-[#E2E8F0] shadow-xs group/carousel">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8B2FC9]/10 text-[#8B2FC9]">
            <Layers className="h-4 w-4" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[#0F172A] tracking-tight">
            Shop by Category
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Scroll Navigation Arrows (Desktop) */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={scrollLeft}
              aria-label="Scroll left"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] hover:bg-[#8B2FC9] hover:text-white transition cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={scrollRight}
              aria-label="Scroll right"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] hover:bg-[#8B2FC9] hover:text-white transition cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAllCategoriesOpen(true)}
            className="group inline-flex items-center gap-1 text-xs font-bold text-[#8B2FC9] hover:text-[#581C87] transition cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Categories Horizontal Carousel Rail */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-1 -mx-1 px-1"
      >
        {ALL_CATEGORIES_LIST.map((cat) => {
          const isSelected = selectedCategory === cat.slug;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryClick(cat.slug)}
              className={`group flex flex-col items-center shrink-0 w-20 sm:w-24 p-1.5 sm:p-2 rounded-2xl transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#8B2FC9] text-white shadow-md shadow-[#8B2FC9]/25"
                  : "bg-transparent text-[#0F172A] hover:bg-[#F8FAFC]"
              }`}
            >
              {/* Category Circular Image matching Reference Image Screen 1 */}
              <div
                className={`relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center overflow-hidden rounded-full mb-1.5 transition-transform group-hover:scale-105 shadow-xs ${
                  isSelected ? "ring-2 ring-white" : "border-2 border-white ring-1 ring-[#E2E8F0]"
                }`}
              >
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Title */}
              <div className="text-center w-full px-0.5">
                <span
                  className={`block text-[11px] sm:text-xs font-bold leading-tight line-clamp-2 ${
                    isSelected ? "text-white" : "text-[#0F172A]"
                  }`}
                >
                  {cat.name}
                </span>
              </div>
            </button>
          );
        })}

        {/* 'More' / View All Categories Trigger Button */}
        <button
          type="button"
          onClick={() => setIsAllCategoriesOpen(true)}
          className="group flex flex-col items-center justify-center shrink-0 w-20 sm:w-24 p-2 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#8B2FC9] transition cursor-pointer"
        >
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-white shadow-xs border border-[#E2E8F0] mb-1.5 group-hover:scale-105 transition-transform">
            <div className="grid grid-cols-2 gap-1 p-1">
              <span className="h-2 w-2 rounded-full bg-[#8B2FC9]" />
              <span className="h-2 w-2 rounded-full bg-[#8B2FC9]" />
              <span className="h-2 w-2 rounded-full bg-[#8B2FC9]" />
              <span className="h-2 w-2 rounded-full bg-[#8B2FC9]" />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-[#0F172A] leading-tight">
            More
          </span>
        </button>
      </div>

      {/* ── View All Categories Modal (Matching exact design reference) ── */}
      <Dialog
        open={isAllCategoriesOpen}
        onOpenChange={(open) => {
          setIsAllCategoriesOpen(open);
          if (!open) setCategorySearchQuery("");
        }}
      >
        <DialogContent
          hideCloseButton
          className="max-w-5xl xl:max-w-6xl w-[94vw] p-0 overflow-hidden border border-[#E2E8F0] rounded-[32px] bg-white shadow-2xl z-[130]"
        >
          {/* Header with Shop Awning Icon, Title, Subtitle, Search bar, and Close button */}
          <div className="relative p-5 sm:p-6 pb-4 border-b border-[#F5EDFD] bg-white">
            {/* Top-Right Decorative Yellow-Purple Wave Gradient */}
            <div className="pointer-events-none absolute right-0 top-0 h-24 w-44 overflow-hidden rounded-tr-[32px]">
              <div className="absolute -top-10 -right-10 h-32 w-44 rounded-full bg-gradient-to-bl from-purple-400/25 via-amber-300/30 to-transparent blur-lg" />
              <svg
                className="absolute top-0 right-0 h-14 w-32 opacity-40"
                viewBox="0 0 140 60"
                fill="none"
              >
                <path
                  d="M0 20C40 20 60 0 100 0C120 0 135 15 140 25V0H0V20Z"
                  fill="url(#header-wave-grad)"
                />
                <defs>
                  <linearGradient
                    id="header-wave-grad"
                    x1="0"
                    y1="0"
                    x2="140"
                    y2="30"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#F59E0B" />
                    <stop offset="1" stopColor="#8B2FC9" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Left Title with Store Awning Icon */}
              <div className="flex items-center gap-3.5">
                {/* 3D Awning Shop Icon */}
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B2FC9] to-[#581C87] text-white shadow-md shadow-[#8B2FC9]/25">
                  <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none">
                    {/* Shop Body */}
                    <rect
                      x="7"
                      y="23"
                      width="34"
                      height="18"
                      rx="3"
                      fill="#FFFFFF"
                      stroke="#F8FAFC"
                      strokeWidth="1.5"
                    />
                    <rect x="18" y="27" width="12" height="14" rx="2" fill="#F59E0B" />
                    <rect x="10" y="27" width="5" height="7" rx="1.5" fill="#E2E8F0" />
                    <rect x="33" y="27" width="5" height="7" rx="1.5" fill="#E2E8F0" />

                    {/* Awning Stripes */}
                    <path
                      d="M5 21L9 8H39L43 21C43 23 41.5 24.5 39.5 24.5C37.5 24.5 36 23 36 21C36 23 34.5 24.5 32.5 24.5C30.5 24.5 29 23 29 21C29 23 27.5 24.5 25.5 24.5C23.5 24.5 22 23 22 21C22 23 20.5 24.5 18.5 24.5C16.5 24.5 15 23 15 21C15 23 13.5 24.5 11.5 24.5C9.5 24.5 8 23 8 21C8 23 6.5 24.5 5 24.5C4 24.5 5 22.5 5 21Z"
                      fill="#581C87"
                    />
                    <path
                      d="M11.5 8L15 21C15 23 16.5 24.5 18.5 24.5C20.5 24.5 22 23 22 21L18.5 8H11.5Z"
                      fill="#F59E0B"
                    />
                    <path
                      d="M25.5 8L29 21C29 23 30.5 24.5 32.5 24.5C34.5 24.5 36 23 36 21L32.5 8H25.5Z"
                      fill="#F59E0B"
                    />
                  </svg>
                </div>

                <div>
                  <DialogTitle className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
                    Explore all categories
                  </DialogTitle>
                  <p className="text-xs sm:text-[13px] text-[#746A85] mt-0.5">
                    Find what you need from trusted local shops
                  </p>
                </div>
              </div>

              {/* Right Side: Search Box + Single Clean Close Button */}
              <div className="flex items-center gap-3">
                {/* Pill Search Input */}
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#581C87]" />
                  <input
                    type="text"
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    placeholder="Search categories"
                    className="w-full pl-9 pr-8 py-2 rounded-full border border-purple-200/90 bg-white text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B2FC9] focus:border-[#8B2FC9] shadow-2xs transition"
                  />
                  {categorySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCategorySearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Single Clean Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsAllCategoriesOpen(false);
                    setCategorySearchQuery("");
                  }}
                  className="h-9 w-9 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-black flex items-center justify-center transition shadow-2xs cursor-pointer shrink-0"
                  aria-label="Close categories dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Categories Grid (Exact 4x4, 16 Category Cards) */}
          <div className="p-5 sm:p-6 max-h-[72vh] overflow-y-auto">
            {filteredCategories.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Search className="h-8 w-8 mx-auto text-purple-300 mb-2" />
                <p className="text-sm font-bold text-[#0F172A]">No categories match your search</p>
                <p className="text-xs text-[#746A85] mt-1">Try another keyword like grocery, bakery, or medicine.</p>
                <button
                  type="button"
                  onClick={() => setCategorySearchQuery("")}
                  className="mt-3 px-4 py-1.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#8B2FC9] hover:bg-[#8B2FC9] hover:text-white transition"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {filteredCategories.map((cat) => {
                  const isSelected = selectedCategory === cat.slug;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        handleCategoryClick(cat.slug);
                        setIsAllCategoriesOpen(false);
                        setCategorySearchQuery("");
                      }}
                      className={`group relative flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl text-left transition-all duration-200 cursor-pointer bg-white ${
                        isSelected
                          ? "border-2 border-[#8B2FC9] shadow-sm ring-2 ring-[#8B2FC9]/20 bg-purple-50/20"
                          : "border border-slate-100 hover:border-purple-200 hover:shadow-md"
                      }`}
                    >
                      {/* Left Thumbnail Image */}
                      <div className="h-16 w-16 sm:h-18 sm:w-18 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-100">
                        <img
                          src={cat.imageUrl}
                          alt={cat.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>

                      {/* Right Info */}
                      <div className="min-w-0 flex-1">
                        <h3
                          className={`text-xs sm:text-[13px] font-bold leading-tight line-clamp-1 ${
                            isSelected
                              ? "text-[#8B2FC9]"
                              : "text-[#0F172A] group-hover:text-[#8B2FC9]"
                          }`}
                        >
                          {cat.name}
                        </h3>
                        <p className="text-[10px] sm:text-[11px] text-[#746A85] mt-1 line-clamp-2 leading-snug">
                          {cat.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
