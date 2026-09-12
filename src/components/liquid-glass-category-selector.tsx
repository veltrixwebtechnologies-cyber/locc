import { useRef, useEffect, useCallback, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Grid,
  Apple,
  Drumstick,
  Cake,
  Candy,
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
  ChevronLeft,
  ChevronRight,
  Store,
  type LucideIcon,
} from "lucide-react";
import { m, LayoutGroup } from "motion/react";

export type LiquidCategory = {
  id: string;
  label: string;
  icon: LucideIcon;
  searchCategory?: string;
  to?: string;
  badge?: string;
};

export const LIQUID_CATEGORIES: LiquidCategory[] = [
  {
    id: "all",
    label: "All Categories",
    icon: Grid,
  },
  {
    id: "fresh",
    label: "Fresh Produce",
    icon: Apple,
    searchCategory: "fruits_veg",
  },
  {
    id: "meat_fish",
    label: "Meat & Fish",
    icon: Drumstick,
    searchCategory: "meat_fish",
  },
  {
    id: "bakery_sweets",
    label: "Bakery & Sweets",
    icon: Cake,
    searchCategory: "bakery",
  },
  {
    id: "grocery",
    label: "Kirana & Grocery",
    icon: Store,
    searchCategory: "grocery",
  },
  {
    id: "pharmacy",
    label: "Pharmacy & Care",
    icon: Pill,
    searchCategory: "pharmacy",
  },
  {
    id: "restaurants",
    label: "Restaurants & Dining",
    icon: Utensils,
    searchCategory: "restaurants",
  },
  {
    id: "cafes",
    label: "Cafés & Tea",
    icon: Coffee,
    searchCategory: "cafes",
  },
  {
    id: "fashion",
    label: "Fashion & Apparel",
    icon: Shirt,
    searchCategory: "fashion",
  },
  {
    id: "boutiques",
    label: "Boutiques",
    icon: Sparkles,
    searchCategory: "boutiques",
  },
  {
    id: "footwear",
    label: "Footwear",
    icon: Footprints,
    searchCategory: "footwear",
  },
  {
    id: "jewellery",
    label: "Jewellery & Gifts",
    icon: Gem,
    searchCategory: "jewellery",
  },
  {
    id: "electronics",
    label: "Electronics",
    icon: Tv,
    searchCategory: "electronics",
  },
  {
    id: "mobile",
    label: "Mobile & Accessories",
    icon: Smartphone,
    searchCategory: "mobile",
  },
  {
    id: "beauty",
    label: "Beauty & Personal Care",
    icon: Heart,
    searchCategory: "beauty",
  },
  {
    id: "home_kitchen",
    label: "Home & Kitchen",
    icon: CookingPot,
    searchCategory: "home_kitchen",
  },
  {
    id: "furniture",
    label: "Furniture & Decor",
    icon: Armchair,
    searchCategory: "furniture",
  },
  {
    id: "hardware",
    label: "Home & Hardware",
    icon: Hammer,
    searchCategory: "hardware",
  },
  {
    id: "books_stationery",
    label: "Books & Stationery",
    icon: BookOpen,
    searchCategory: "books_stationery",
  },
  {
    id: "sports",
    label: "Sports & Fitness",
    icon: Dumbbell,
    searchCategory: "sports",
  },
  {
    id: "kids_sports",
    label: "Toys & Baby Care",
    icon: Baby,
    searchCategory: "toys",
  },
  {
    id: "gifts",
    label: "Gift Shops",
    icon: Gift,
    searchCategory: "gifts",
  },
  {
    id: "flowers",
    label: "Flower Shops",
    icon: Flower2,
    searchCategory: "flowers",
  },
  {
    id: "pet_shops",
    label: "Pet Care & Shops",
    icon: Dog,
    searchCategory: "pet_shops",
  },
  {
    id: "pooja",
    label: "Pooja & Divine",
    icon: Flame,
    searchCategory: "pooja",
  },
  {
    id: "auto",
    label: "Auto & Bike Spares",
    icon: Bike,
    searchCategory: "auto",
  },
  {
    id: "repair",
    label: "Repair Shops",
    icon: Wrench,
    searchCategory: "repair",
  },
  {
    id: "local_services",
    label: "Local Services",
    icon: Briefcase,
    searchCategory: "local_services",
  },
  {
    id: "local_favorites",
    label: "Local Favorites",
    icon: Star,
    to: "/best-shops",
    badge: "TOP",
  },
];

export function LiquidGlassCategorySelector() {
  const routerLocation = useRouterState({
    select: (s) => ({
      pathname: s.location.pathname,
      search: (s.location.search || {}) as Record<string, any>,
    }),
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Non-rendering Refs for Mouse Drag tracking
  const isPointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const isDraggingRef = useRef(false);

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

  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
  }, []);

  const scrollByAmount = (amount: number) => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: amount, behavior: "smooth" });
      setTimeout(updateScrollState, 300);
    }
  };

  // Smoothly center active category horizontally without causing vertical page scroll
  const centerActiveItem = useCallback((id: string, behavior: ScrollBehavior = "smooth") => {
    const container = scrollContainerRef.current;
    const activeEl = itemRefs.current[id];
    if (container && activeEl) {
      const scrollGoal = activeEl.offsetLeft - container.clientWidth / 2 + activeEl.clientWidth / 2;
      container.scrollTo({ left: Math.max(0, scrollGoal), behavior });
      setTimeout(updateScrollState, 300);
    }
  }, [updateScrollState]);

  useEffect(() => {
    centerActiveItem(activeId, "smooth");
  }, [activeId, centerActiveItem]);

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [updateScrollState]);

  // Pointer event handlers for desktop mouse dragging
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    if (!scrollContainerRef.current) return;

    isPointerDownRef.current = true;
    isDraggingRef.current = false;
    startXRef.current = e.clientX - scrollContainerRef.current.offsetLeft;
    scrollLeftRef.current = scrollContainerRef.current.scrollLeft;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current || e.pointerType !== "mouse" || !scrollContainerRef.current) return;

    const x = e.clientX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.4;

    if (Math.abs(walk) > 8) {
      isDraggingRef.current = true;
    }
    scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
    updateScrollState();
  };

  const handlePointerUpOrLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    isPointerDownRef.current = false;
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 80);
  };

  return (
    <div className="sticky top-[53px] md:top-[74px] z-40 my-1.5 px-2 sm:px-4 lg:px-6 transform-gpu">
      {/* 
        Single Floating Translucent Frosted Liquid-Glass Surface
        High-Performance GPU Accelerated Glass for both Mobile & Desktop
      */}
      <div className="relative mx-auto w-full max-w-[calc(100vw-1rem)] sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl rounded-full bg-white/75 backdrop-blur-xl backdrop-saturate-[160%] border border-purple-200/60 shadow-[0_8px_32px_rgba(60,20,70,0.10),inset_0_1px_0_rgba(255,255,255,0.90)] p-1 sm:p-1.5 transition-all duration-200">
        
        {/* Desktop Left Scroll Button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollByAmount(-280)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-7 w-7 items-center justify-center rounded-full bg-purple-900/90 text-white shadow-md hover:bg-purple-950 transition-transform active:scale-95"
            aria-label="Scroll categories left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {/* Desktop Right Scroll Button */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollByAmount(280)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-7 w-7 items-center justify-center rounded-full bg-purple-900/90 text-white shadow-md hover:bg-purple-950 transition-transform active:scale-95"
            aria-label="Scroll categories right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        <LayoutGroup id="liquid-glass-category-bar">
          {/* 
            Swipeable Track with Edge Fade Mask & Native Touch/Mouse Drag Scrolling
          */}
          <div
            ref={scrollContainerRef}
            onScroll={updateScrollState}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUpOrLeave}
            onPointerLeave={handlePointerUpOrLeave}
            className="flex items-center gap-1.5 overflow-x-auto select-none py-0.5 px-3 md:px-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-pan-x cursor-grab active:cursor-grabbing transform-gpu"
            style={{
              WebkitOverflowScrolling: "touch",
              maskImage:
                "linear-gradient(to right, transparent 0px, black 16px, black calc(100% - 16px), transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0px, black 16px, black calc(100% - 16px), transparent 100%)",
            }}
          >
            {LIQUID_CATEGORIES.map((cat) => {
              const isActive = activeId === cat.id;
              const Icon = cat.icon;

              const targetLink = cat.to
                ? { to: cat.to, search: {} }
                : {
                    to: "/search",
                    search: cat.searchCategory
                      ? { category: cat.searchCategory }
                      : { category: undefined, q: undefined },
                  };

              return (
                <Link
                  key={cat.id}
                  ref={(el) => {
                    itemRefs.current[cat.id] = el;
                  }}
                  to={targetLink.to as any}
                  search={targetLink.search as any}
                  onClick={(e) => {
                    if (isDraggingRef.current) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  className={`relative inline-flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 outline-none touch-manipulation ${
                    isActive
                      ? "text-purple-950 font-extrabold z-10"
                      : "text-slate-700 hover:text-purple-900 opacity-85 hover:opacity-100"
                  }`}
                >
                  {/* Active Category Translucent Purple Glass Highlight */}
                  {isActive && (
                    <m.span
                      layoutId="liquidGlassActiveHighlight"
                      className="absolute inset-0 rounded-full bg-purple-900/15 border border-purple-800/30 shadow-[0_2px_12px_rgba(76,16,116,0.18)] z-0"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                        mass: 0.8,
                      }}
                    />
                  )}

                  {/* Category Icon & Label */}
                  <span className="relative z-10 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                    <Icon
                      className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 transition-transform duration-150 ${
                        isActive
                          ? "text-purple-900 scale-110"
                          : "text-purple-700/70 group-hover:scale-105"
                      }`}
                    />
                    <span className="text-xs sm:text-[13px]">{cat.label}</span>
                    {cat.badge && (
                      <span
                        className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wide ${
                          isActive
                            ? "bg-purple-900 text-white"
                            : "bg-purple-100 text-purple-900"
                        }`}
                      >
                        {cat.badge}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </LayoutGroup>
      </div>
    </div>
  );
}


