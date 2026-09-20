/**
 * LocalShore Web Front Page Signature Hero Landing Section
 * Cinematic Motion-Design Animation inspired by high-energy delivery commercials:
 * - Scene 1: Camera push-in arrival & energetic badge overshoots
 * - Scene 2: Commercial motion typography with line-by-line slide & yellow word emphasis
 * - Scene 3 & 4: Scooter drive-in from right with deceleration tilt & delivery box momentum
 * - Scene 5: Location & Search bar horizontal unfold
 * - Scene 6 & 7: Sequential 3D card arrival with inner image parallax & depth
 * - Scene 8: Realistic engine idle & suspension micro-vibration
 * - Scene 9: Premium micro-interactions & arrow shifts
 * - Scene 10: Smooth scroll transformations hooked to scroll progress
 *
 * Respects prefers-reduced-motion, mobile responsiveness, zero layout shift, and 100% LocalShore branding.
 */
import { useState, useRef, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  MapPin,
  Search,
  ArrowUpRight,
  Sparkles,
  Zap,
  ChevronDown,
  Flame,
  X,
  ShoppingBag,
  Store,
  ChevronRight,
} from "lucide-react";
import { scrollToShops } from "@/lib/scroll-utils";
import { useDeliveryLocation } from "@/lib/location-store";
import { LocationModal } from "@/components/ui/location-modal";
import { type SearchResultItem } from "@/lib/search-service";
import { useLiveSearchResults } from "@/hooks/use-live-search-results";
import { AnimatedSearchPlaceholder } from "@/components/ui/animated-search-placeholder";

interface SwiggyFeatureCard {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeBg: string;
  badgeText: string;
  category: string;
  image: string;
}

const FEATURE_CARDS: SwiggyFeatureCard[] = [
  {
    id: "grocery",
    title: "LOCAL GROCERY",
    subtitle: "STAPLES & FRESH PRODUCE",
    badge: "UP TO 50% OFF",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800",
    category: "grocery",
    image: "/assets/grocery-basket.png",
  },
  {
    id: "pharmacy",
    title: "INSTANT PHARMACY",
    subtitle: "24x7 MEDICINES IN 15 MINS",
    badge: "UP TO 40% OFF",
    badgeBg: "bg-sky-100",
    badgeText: "text-sky-800",
    category: "pharmacy",
    image: "/assets/pharmacy-medicines.png",
  },
  {
    id: "bakery-tech",
    title: "BAKERY & TECH",
    subtitle: "OVEN FRESH BAKES & UTILITIES",
    badge: "UP TO 60% OFF",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-950",
    category: "bakery",
    image: "/assets/chocolate-cake.png",
  },
];

const SEARCH_PLACEHOLDERS = [
  "Search for shops, products and more",
  "Search for fresh vegetables",
  "Search for nearby bakeries",
  "Search for fashion stores",
  "Search for electronics shops",
  "Search for pharmacies",
  "Search for local favorites",
];

const POPULAR_TAGS = [
  { label: "Nearby Shops", query: "nearby shops", icon: "🏪" },
  { label: "Bakeries", query: "bakeries", icon: "🥐" },
  { label: "Clothing Stores", query: "clothing stores", icon: "👗" },
  { label: "Mobile Shops", query: "mobile shops", icon: "📱" },
  { label: "Salons", query: "salons", icon: "💇" },
  { label: "Meat & Fish", query: "meat fish", icon: "🥩" },
  { label: "Home & Kitchen", query: "home kitchen", icon: "🏠" },
  { label: "Local Favorites", query: "local favorites", icon: "⭐" },
];

export function HeroSection() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const containerRef = useRef<HTMLDivElement>(null);

  const [deliveryLocation] = useDeliveryLocation();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const handleSearchSubmit = (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToUse = customQuery ?? searchQuery;
    if (!queryToUse.trim()) {
      scrollToShops();
      return;
    }

    navigate({
      to: "/search",
      search: { q: queryToUse.trim() },
      resetScroll: false,
    });
    setIsFocused(false);
  };

  const handleTagClick = (query: string) => {
    setSearchQuery(query);
    handleSearchSubmit(undefined, query);
  };

  const { results: searchResults, isLoading: isSearchLoading } = useLiveSearchResults(searchQuery);

  const productResults: SearchResultItem[] = useMemo(() => {
    return searchResults.filter((r: SearchResultItem) => r.type === "Product" || r.type === "Dish");
  }, [searchResults]);

  const shopResults: SearchResultItem[] = useMemo(() => {
    return searchResults.filter(
      (r: SearchResultItem) => r.type === "Shop" || r.type === "Restaurant",
    );
  }, [searchResults]);

  return (
    <section
      ref={containerRef}
      className="mx-auto max-w-7xl px-3 pt-2 pb-5 sm:px-6 sm:pt-4 md:px-8 md:pt-5"
    >
      {/* ── Scene 1: Camera Push-In Hero Card ── */}
      <div className="relative overflow-x-hidden rounded-3xl sm:rounded-[36px] bg-[#981495] p-5 sm:p-8 lg:p-12 text-white shadow-2xl transition-all">
        {/* Isolated Overflow-Hidden Layer for Background Glows (Prevents search dropdown clipping) */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl sm:rounded-[36px] pointer-events-none z-0">
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-radial from-[#c026d3]/30 to-transparent blur-2xl" />
          <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-radial from-[#981495]/40 to-transparent blur-2xl" />
        </div>

        <div className="relative z-10 space-y-5 sm:space-y-7">
          {/* Top Pill Badges Row */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3 py-1 text-[11px] sm:text-xs font-bold tracking-wide text-white border border-white/20 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-[#F3D053] fill-[#F3D053]" />
              <span>LocalShore Marketplace</span>
            </div>

            <div className="inline-flex items-center gap-1 rounded-full bg-gold-gradient px-3.5 py-1 text-[10px] sm:text-[11px] font-black uppercase text-slate-950 shadow-md tracking-wider border border-white/30">
              <Zap className="h-3.5 w-3.5 fill-slate-950" />
              20–30 MIN DELIVERY
            </div>
          </div>

          {/* Title Headline & Delivery Rider Video Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
            {/* Motion Typography Commercial Headline */}
            <div className="lg:col-span-7 space-y-2 sm:space-y-3">
              <h1 className="font-display text-2xl font-black tracking-tight sm:text-4xl lg:text-[52px] text-white leading-[1.1]">
                <span className="block">Shop everything local.</span>

                <span className="block">From fashion to fresh produce.</span>

                <span className="block pt-0.5">
                  <span className="text-gold-gradient font-black inline-block drop-shadow-md">
                    LocalShore
                  </span>{" "}
                  it!
                </span>
              </h1>

              <p className="text-xs sm:text-sm font-semibold text-[var(--sand)]/90 max-w-lg leading-relaxed pt-0.5 sm:pt-1">
                Support neighborhood vendors with instant fulfillment across Shoreline City.
              </p>
            </div>

            {/* Delivery Rider Card */}
            <div className="flex min-w-0 lg:col-span-5 justify-center lg:justify-end items-center relative my-2 sm:my-4 lg:my-0 w-full max-w-full group">
              <motion.div
                initial={shouldReduceMotion ? false : { y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  y: { type: "spring", stiffness: 85, damping: 20, mass: 0.8, delay: 0.08 },
                  opacity: { duration: 0.45, ease: "easeOut", delay: 0.08 },
                }}
                className="relative min-w-0 w-full max-w-[320px] sm:max-w-sm lg:max-w-full pt-7 sm:pt-8"
              >
                {/* The full suspension assembly enters together; the board floats after settling. */}
                <div className="pointer-events-none absolute left-[19%] top-0 h-8 w-[2px] bg-gradient-to-b from-[#fff6bf] via-[#F3D053] to-[#9f7b13] opacity-95" />
                <div className="pointer-events-none absolute right-[19%] top-0 h-8 w-[2px] bg-gradient-to-b from-[#fff6bf] via-[#F3D053] to-[#9f7b13] opacity-95" />
                <div className="pointer-events-none absolute left-[calc(19%-4px)] -top-1 h-2.5 w-2.5 rounded-full border border-[#fff1a8] bg-[#d7a92e] shadow-[0_0_10px_rgba(243,208,83,0.8)]" />
                <div className="pointer-events-none absolute right-[calc(19%-4px)] -top-1 h-2.5 w-2.5 rounded-full border border-[#fff1a8] bg-[#d7a92e] shadow-[0_0_10px_rgba(243,208,83,0.8)]" />

                <div>
                  <motion.div
                    animate={
                      shouldReduceMotion
                        ? { y: 0, rotate: 0 }
                        : { y: [0, -2, 0, 2, 0], rotate: [-0.45, 0.35, -0.45] }
                    }
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      repeatType: "mirror",
                      ease: "easeInOut",
                    }}
                    className="relative mx-auto aspect-[16/9] w-full max-w-full transform-gpu rounded-2xl border border-[#F3D053]/90 bg-gradient-to-r from-[#F3D053] via-amber-300 to-[#F3D053] p-[3.5px] shadow-[0_0_30px_rgba(243,208,83,0.45),0_18px_28px_rgba(20,10,48,0.28)] transition-transform duration-300 group-hover:scale-[1.02] lg:h-72 lg:rounded-3xl"
                  >
                    {/* These lower mounts travel with the suspended board. */}
                    <div className="pointer-events-none absolute -top-2 left-[calc(19%-5px)] z-20 h-3.5 w-3.5 rounded-full border-2 border-[#fff1a8] bg-[#c8951f] shadow-[0_0_12px_rgba(243,208,83,0.85)]" />
                    <div className="pointer-events-none absolute -top-2 right-[calc(19%-5px)] z-20 h-3.5 w-3.5 rounded-full border-2 border-[#fff1a8] bg-[#c8951f] shadow-[0_0_12px_rgba(243,208,83,0.85)]" />
                    <div className="relative h-full w-full overflow-hidden rounded-[13px] lg:rounded-[21px] bg-[#160a2b] ring-1 ring-white/15">
                      {/* Static hero artwork replaces the animated rider video. */}
                      <img
                        src="/assets/shoreline-hero-reference.png"
                        alt="LocalShore marketplace delivery scene"
                        loading="eager"
                        decoding="async"
                        {...({ fetchPriority: "high" } as Record<string, string>)}
                        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                      />
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Search & Location Floating Bar */}
          <div className="relative max-w-2xl z-40">
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex flex-col sm:flex-row items-center gap-2 rounded-2xl sm:rounded-full bg-white p-1.5 sm:p-2 shadow-2xl transition-all duration-300 z-20"
            >
              {/* Location Selector */}
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("localshore_open_location_modal"));
                  }
                }}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-slate-700 border-b sm:border-b-0 sm:border-r border-slate-200 w-full sm:w-auto shrink-0 group cursor-pointer hover:bg-[var(--sand)]/50 transition-colors rounded-2xl sm:rounded-l-full text-left"
              >
                <MapPin className="h-4 w-4 text-[#981495] shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-slate-900 w-full sm:w-[170px] truncate">
                  {deliveryLocation?.area ||
                    deliveryLocation?.label?.split(",")?.[0] ||
                    "Select location"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 group-hover:text-[#981495] transition-colors" />
              </button>

              {/* Search Field */}
              <div className="relative flex items-center gap-2 px-3 py-1.5 sm:py-2 w-full flex-1 min-h-[44px]">
                <Search className="h-4 w-4 text-[#981495] shrink-0" />
                <div className="relative w-full flex items-center">
                  <AnimatedSearchPlaceholder
                    phrases={SEARCH_PLACEHOLDERS}
                    active={!isFocused && !searchQuery}
                    className="right-0 text-xs font-semibold text-slate-400 sm:text-sm"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 250)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearchQuery(val);
                      setIsFocused(true);
                    }}
                    placeholder=""
                    className="relative z-10 text-xs sm:text-sm font-semibold text-slate-900 bg-transparent outline-none border-none w-full"
                  />
                </div>

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* FIND SHOPS Button */}
              <button
                type="submit"
                className="group w-full sm:w-auto rounded-full bg-[#1e293b] hover:bg-[#0f172a] active:scale-95 text-white px-6 py-3 text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0 min-h-[44px]"
              >
                <span>FIND SHOPS</span>
                <ArrowUpRight className="h-4 w-4 stroke-[2.5] transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-0.5" />
              </button>
            </form>

            {/* Live Instant Search Dropdown */}
            <AnimatePresence>
              {(isFocused || searchQuery.trim().length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 4 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl bg-white p-3 sm:p-4 shadow-2xl border border-[var(--sand)]/80 text-slate-900 max-h-[440px] overflow-y-auto"
                >
                  {!searchQuery.trim() ? (
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="flex items-center gap-1 text-xs font-bold text-slate-800 uppercase tracking-wider">
                          <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          Popular search categories
                        </span>
                        <span className="text-[10px] font-bold text-[#981495]">Tap to filter</span>
                      </div>

                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {POPULAR_TAGS.map((tag) => (
                          <button
                            key={tag.query}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleTagClick(tag.query)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--sand)] hover:bg-[#981495] hover:text-white px-3 py-2 text-xs font-bold text-[#981495] transition-all cursor-pointer min-h-[38px]"
                          >
                            <span>{tag.icon}</span>
                            <span>{tag.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {isSearchLoading ? (
                        <div className="py-6 text-center text-slate-500">
                          <Search className="h-8 w-8 text-slate-300 mx-auto mb-2 animate-pulse" />
                          <p className="text-xs font-bold text-slate-700">
                            Searching live catalog...
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Checking approved shops and products
                          </p>
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="py-6 text-center text-slate-500">
                          <ShoppingBag className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-700">
                            No matching products or shops found
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Try searching for "Batter", "Chicken", "Bakery", "Pharmacy", or "Sweets"
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* 1. Products Section */}
                          {productResults.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-2">
                                <span className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                                  <ShoppingBag className="h-3.5 w-3.5 text-[#c026d3]" />
                                  Products in local shops ({productResults.length})
                                </span>
                                <span className="text-[10px] font-bold text-[#981495]">
                                  Instant Delivery
                                </span>
                              </div>

                              <div className="space-y-1.5">
                                {productResults.slice(0, 5).map((item: SearchResultItem) => (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                      setIsFocused(false);
                                      navigate({ to: item.url as any });
                                    }}
                                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--sand)]/80 transition-colors text-left group"
                                  >
                                    <img
                                      src={item.imageUrl}
                                      alt={item.title}
                                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#981495] truncate">
                                        {item.title}
                                      </h4>
                                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                        <span className="font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/50">
                                          ₹{item.price}
                                        </span>
                                        <span className="truncate text-slate-600 font-semibold">
                                          {item.subtitle}
                                        </span>
                                      </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#c026d3] shrink-0" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 2. Shops Section */}
                          {shopResults.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-2">
                                <span className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                                  <Store className="h-3.5 w-3.5 text-[#c026d3]" />
                                  Matching Local Shops ({shopResults.length})
                                </span>
                              </div>

                              <div className="space-y-1.5">
                                {shopResults.slice(0, 3).map((item: SearchResultItem) => (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                      setIsFocused(false);
                                      navigate({ to: item.url as any });
                                    }}
                                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--sand)]/80 transition-colors text-left group"
                                  >
                                    <img
                                      src={item.imageUrl}
                                      alt={item.title}
                                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#981495] truncate">
                                        {item.title}
                                      </h4>
                                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium truncate">
                                        {item.subtitle}
                                      </p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#c026d3] shrink-0" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* View all button */}
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSearchSubmit(undefined, searchQuery)}
                            className="w-full mt-2 py-2 px-3 rounded-xl bg-[#981495] hover:bg-[#700b6e] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                          >
                            <span>View all product & shop results for "{searchQuery}"</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Promotional Cards Strip */}
          <div className="pt-2 flex sm:grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overscroll-x-contain touch-pan-x pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 sm:pb-0">
            {FEATURE_CARDS.map((card) => {
              return (
                <div
                  key={card.id}
                  onClick={() => {
                    navigate({
                      to: "/",
                      search: { category: card.category, q: undefined },
                      resetScroll: false,
                    });
                    scrollToShops();
                  }}
                  className="group cursor-pointer rounded-2xl bg-white p-4 shadow-lg transition-all duration-200 hover:shadow-xl relative overflow-hidden flex items-center justify-between min-h-[120px] border border-white/20 shrink-0 w-[260px] sm:w-auto snap-start active:scale-[0.99]"
                >
                  <div className="flex-1 pr-2 space-y-1 z-10 flex flex-col justify-between h-full">
                    <div>
                      <div
                        className={`inline-block rounded-md px-2 py-0.5 text-[9px] font-black tracking-wider uppercase ${card.badgeBg} ${card.badgeText}`}
                      >
                        {card.badge}
                      </div>

                      <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight pt-1">
                        {card.title}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 tracking-tight">
                        {card.subtitle}
                      </p>
                    </div>

                    <div className="pt-2">
                      <div className="h-7 w-7 rounded-full bg-[#981495] text-white flex items-center justify-center shadow-xs transition-all duration-200 group-hover:scale-110 group-hover:bg-[#800f7d]">
                        <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                      </div>
                    </div>
                  </div>

                  <div className="relative shrink-0 w-22 h-22 sm:w-24 sm:h-24 flex items-center justify-center overflow-hidden rounded-xl">
                    <img
                      src={card.image}
                      alt={card.title}
                      loading="lazy"
                      className="h-full w-full object-contain filter drop-shadow-xs transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Carousel Indicators */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {[0, 1, 2, 3].map((dot) => (
              <button
                key={dot}
                type="button"
                onClick={() => setActiveSlide(dot)}
                className="relative p-1 focus:outline-none cursor-pointer min-h-[24px]"
                aria-label={`Slide ${dot + 1}`}
              >
                <div
                  className={`h-2 rounded-full bg-white transition-all duration-300 ${
                    activeSlide === dot ? "w-6 opacity-100" : "w-2 opacity-40"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
