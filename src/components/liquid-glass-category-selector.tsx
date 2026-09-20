import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Grid,
  Apple,
  Drumstick,
  Cake,
  Utensils,
  Coffee,
  Pill,
  Shirt,
  Sparkles,
  Footprints,
  Gem,
  Tv,
  Smartphone,
  Heart,
  CookingPot,
  Armchair,
  Hammer,
  BookOpen,
  Dumbbell,
  Baby,
  Gift,
  Flower2,
  Dog,
  Flame,
  Bike,
  Wrench,
  Briefcase,
  Star,
  ChevronRight,
  Store,
  type LucideIcon,
} from "lucide-react";
import { LayoutGroup } from "motion/react";

export type LiquidCategory = {
  id: string;
  label: string;
  icon: LucideIcon;
  imageUrl: string;
  searchCategory?: string;
  to?: string;
  badge?: string;
};

export const LIQUID_CATEGORIES: LiquidCategory[] = [
  {
    id: "all",
    label: "All Categories",
    icon: Grid,
    imageUrl:
      "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=240&q=80",
  },
  {
    id: "fresh",
    label: "Fresh Produce",
    icon: Apple,
    imageUrl:
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=240&q=80",
    searchCategory: "fruits_veg",
  },
  {
    id: "meat_fish",
    label: "Meat & Fish",
    icon: Drumstick,
    imageUrl:
      "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=240&q=80",
    searchCategory: "meat_fish",
  },
  {
    id: "bakery_sweets",
    label: "Bakery & Sweets",
    icon: Cake,
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=240&q=80",
    searchCategory: "bakery",
  },
  {
    id: "grocery",
    label: "Kirana & Grocery",
    icon: Store,
    imageUrl:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=240&q=80",
    searchCategory: "grocery",
  },
  {
    id: "pharmacy",
    label: "Pharmacy & Care",
    icon: Pill,
    imageUrl:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=240&q=80",
    searchCategory: "pharmacy",
  },
  {
    id: "restaurants",
    label: "Restaurants & Dining",
    icon: Utensils,
    imageUrl:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=240&q=80",
    searchCategory: "restaurants",
  },
  {
    id: "cafes",
    label: "Cafés & Tea",
    icon: Coffee,
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=240&q=80",
    searchCategory: "cafes",
  },
  {
    id: "fashion",
    label: "Fashion & Apparel",
    icon: Shirt,
    imageUrl:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=240&q=80",
    searchCategory: "fashion",
  },
  {
    id: "boutiques",
    label: "Boutiques",
    icon: Sparkles,
    imageUrl:
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=240&q=80",
    searchCategory: "boutiques",
  },
  {
    id: "footwear",
    label: "Footwear",
    icon: Footprints,
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=240&q=80",
    searchCategory: "footwear",
  },
  {
    id: "jewellery",
    label: "Jewellery & Gifts",
    icon: Gem,
    imageUrl:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=240&q=80",
    searchCategory: "jewellery",
  },
  {
    id: "electronics",
    label: "Electronics",
    icon: Tv,
    imageUrl:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=240&q=80",
    searchCategory: "electronics",
  },
  {
    id: "mobile",
    label: "Mobile & Accessories",
    icon: Smartphone,
    imageUrl:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=240&q=80",
    searchCategory: "mobile",
  },
  {
    id: "beauty",
    label: "Beauty & Personal Care",
    icon: Heart,
    imageUrl:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=240&q=80",
    searchCategory: "beauty",
  },
  {
    id: "home_kitchen",
    label: "Home & Kitchen",
    icon: CookingPot,
    imageUrl:
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=240&q=80",
    searchCategory: "home_kitchen",
  },
  {
    id: "furniture",
    label: "Furniture & Decor",
    icon: Armchair,
    imageUrl:
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=240&q=80",
    searchCategory: "furniture",
  },
  {
    id: "hardware",
    label: "Home & Hardware",
    icon: Hammer,
    imageUrl:
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=240&q=80",
    searchCategory: "hardware",
  },
  {
    id: "books_stationery",
    label: "Books & Stationery",
    icon: BookOpen,
    imageUrl:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=240&q=80",
    searchCategory: "books_stationery",
  },
  {
    id: "sports",
    label: "Sports & Fitness",
    icon: Dumbbell,
    imageUrl:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=240&q=80",
    searchCategory: "sports",
  },
  {
    id: "kids_sports",
    label: "Toys & Baby Care",
    icon: Baby,
    imageUrl:
      "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=240&q=80",
    searchCategory: "toys",
  },
  {
    id: "gifts",
    label: "Gift Shops",
    icon: Gift,
    imageUrl:
      "https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=240&q=80",
    searchCategory: "gifts",
  },
  {
    id: "flowers",
    label: "Flower Shops",
    icon: Flower2,
    imageUrl:
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=240&q=80",
    searchCategory: "flowers",
  },
  {
    id: "pet_shops",
    label: "Pet Care & Shops",
    icon: Dog,
    imageUrl:
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=240&q=80",
    searchCategory: "pet_shops",
  },
  {
    id: "pooja",
    label: "Pooja & Divine",
    icon: Flame,
    imageUrl:
      "https://images.unsplash.com/photo-1604608672516-f1b9f2f8f7f8?auto=format&fit=crop&w=240&q=80",
    searchCategory: "pooja",
  },
  {
    id: "auto",
    label: "Auto & Bike Spares",
    icon: Bike,
    imageUrl:
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=240&q=80",
    searchCategory: "auto",
  },
  {
    id: "repair",
    label: "Repair Shops",
    icon: Wrench,
    imageUrl:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=240&q=80",
    searchCategory: "repair",
  },
  {
    id: "local_services",
    label: "Local Services",
    icon: Briefcase,
    imageUrl:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=240&q=80",
    searchCategory: "local_services",
  },
  {
    id: "local_favorites",
    label: "Local Favorites",
    icon: Star,
    imageUrl:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=240&q=80",
    to: "/best-shops",
    badge: "TOP",
  },
];

export function LiquidGlassCategorySelector({ variant = "image" }: { variant?: "image" | "pill" }) {
  const isPillLayout = variant === "pill";
  const routerLocation = useRouterState({
    select: (s) => ({
      pathname: s.location.pathname,
      search: (s.location.search || {}) as Record<string, any>,
    }),
  });

  const [showAll, setShowAll] = useState(false);
  // Determine active category based on URL
  const currentCategoryParam = routerLocation.search?.category;
  const currentPath = routerLocation.pathname;

  let activeId = "all";
  if (currentPath.startsWith("/best-shops")) {
    activeId = "local_favorites";
  } else if (currentCategoryParam) {
    const found = LIQUID_CATEGORIES.find(
      (c) => c.searchCategory === currentCategoryParam || c.id === currentCategoryParam,
    );
    if (found) {
      activeId = found.id;
    }
  }

  const visibleCategories = isPillLayout
    ? showAll
      ? LIQUID_CATEGORIES
      : LIQUID_CATEGORIES.slice(0, 20)
    : showAll
      ? LIQUID_CATEGORIES.slice(1)
      : LIQUID_CATEGORIES.slice(1, 13);

  return (
    <div
      className={`${isPillLayout ? "sticky top-[53px] md:top-[74px] my-1.5 z-40" : "relative z-30 my-7"} px-3 transform-gpu sm:px-6 lg:px-8`}
    >
      <div
        className={`relative mx-auto w-full ${isPillLayout ? "max-w-[calc(100vw-1rem)] rounded-full border border-[#f0abfc]/60 bg-white/75 p-1 shadow-[0_8px_32px_rgba(60,20,70,0.10)] backdrop-blur-xl sm:p-1.5" : "max-w-[1710px]"}`}
      >
        {!isPillLayout && (
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="font-display text-xl font-black tracking-tight text-[#211735] sm:text-3xl">
              Shop by category
            </h2>
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#981495] transition-colors hover:text-[#700b6e] sm:text-sm"
            >
              {showAll ? "Show less" : "View all"}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <LayoutGroup id="liquid-glass-category-bar">
          {/* 
            Swipeable Track with Edge Fade Mask & Native Touch/Mouse Drag Scrolling
          */}
          <div
            className={
              isPillLayout
                ? "flex items-center gap-1.5 overflow-x-auto select-none px-3 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2 md:px-7"
                : "grid grid-cols-2 gap-3 select-none px-1 py-1 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6"
            }
          >
            {visibleCategories.map((cat) => {
              const isActive = activeId === cat.id;
              const Icon = cat.icon;

              const targetLink = cat.to
                ? { to: cat.to, search: {} }
                : {
                    to: currentPath.startsWith("/search") ? "/search" : "/",
                    search:
                      cat.searchCategory || cat.id !== "all"
                        ? { category: cat.searchCategory || cat.id }
                        : { category: undefined, q: undefined },
                  };

              return (
                <Link
                  key={cat.id}
                  to={targetLink.to as any}
                  search={targetLink.search as any}
                  className={`group relative inline-flex ${isPillLayout ? "h-auto min-w-max flex-row rounded-full border-0 px-3 py-1.5 text-xs sm:px-3.5" : "h-[104px] w-full flex-col rounded-xl border px-2 py-2 text-[11px] sm:h-[156px] sm:rounded-[18px] sm:px-2.5"} items-center justify-center gap-1.5 text-center font-semibold transition-all duration-200 outline-none touch-manipulation ${
                    isActive
                      ? isPillLayout
                        ? "z-10 bg-[#981495]/15 text-[#700b6e] font-extrabold shadow-[0_2px_12px_rgba(76,16,116,0.18)]"
                        : "z-10 border-[#d6af3d] bg-[#fbf2ff] text-[#700b6e] font-extrabold shadow-[0_4px_16px_rgba(214,175,61,0.25)]"
                      : isPillLayout
                        ? "text-slate-700 hover:text-[#981495]"
                        : "border-transparent bg-white text-slate-700 hover:-translate-y-0.5 hover:border-[#d6af3d] hover:text-[#981495] hover:shadow-[0_4px_16px_rgba(214,175,61,0.16)]"
                  }`}
                >
                  {isPillLayout ? (
                    <>
                      <Icon className="relative z-10 h-4 w-4 shrink-0 text-[#981495]/70" />
                      <span className="relative z-10 whitespace-nowrap">{cat.label}</span>
                    </>
                  ) : (
                    <>
                      <span className="absolute inset-0 overflow-hidden rounded-[inherit] bg-[#f8f3fb] shadow-inner">
                        <img
                          src={cat.imageUrl}
                          alt=""
                          loading="lazy"
                          fetchPriority="low"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <span className="absolute inset-0 bg-transparent" />
                      </span>
                      <span className="absolute left-3 top-2.5 z-10 max-w-[86%] text-left text-sm font-bold leading-[1.05] text-white drop-shadow-md sm:left-4 sm:top-3 sm:text-xl">
                        {cat.label}
                      </span>
                    </>
                  )}
                  {cat.badge && (
                    <span className="absolute right-1 top-1 z-10 rounded-full bg-[#981495] px-1 text-[7px] font-black uppercase tracking-wide text-white">
                      {cat.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </LayoutGroup>
        {isPillLayout && null}
      </div>
    </div>
  );
}
