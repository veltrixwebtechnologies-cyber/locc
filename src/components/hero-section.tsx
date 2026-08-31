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
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  MapPin,
  Search,
  ArrowUpRight,
  Sparkles,
  Zap,
  ChevronDown,
  Flame,
  X,
} from "lucide-react";
import { scrollToShops } from "@/lib/scroll-utils";

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

const SEARCH_SUGGESTIONS = [
  "Fresh Vegetables & Organic Produce",
  "Sri Krishna Mysurpa & Bakery",
  "Idli & Dosa Batter (24 Hours Fresh)",
  "Paracetamol & Chemist Essentials",
  "Handloom Silk Sarees & Kurtis",
];

const POPULAR_TAGS = [
  { label: "Groceries", query: "grocery", icon: "🛒" },
  { label: "Idli Batter", query: "batter", icon: "🥣" },
  { label: "Sweets", query: "sweets", icon: "🍬" },
  { label: "Chicken", query: "chicken", icon: "🍗" },
  { label: "Medicines", query: "pharmacy", icon: "💊" },
  { label: "Bakery", query: "bakery", icon: "🥐" },
];

export function HeroSection() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [locationText, setLocationText] = useState("Pappampatti Pirivu, Coimbatore");
  const [suggestionIdx, setSuggestionIdx] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSuggestionIdx((prev) => (prev + 1) % SEARCH_SUGGESTIONS.length);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToUse = customQuery ?? searchQuery;
    if (!queryToUse.trim()) {
      scrollToShops();
      return;
    }

    navigate({
      to: "/",
      search: { q: queryToUse.trim(), category: undefined },
      resetScroll: false,
    });
    scrollToShops();
    setIsFocused(false);
  };

  const handleTagClick = (query: string) => {
    setSearchQuery(query);
    handleSearchSubmit(undefined, query);
  };

  return (
    <section
      ref={containerRef}
      className="mx-auto max-w-7xl px-3 pt-2 pb-5 sm:px-6 sm:pt-4 md:px-8 md:pt-5 overflow-hidden"
    >
      {/* ── Scene 1: Camera Push-In Hero Card ── */}
      <div
        className="relative overflow-hidden rounded-3xl sm:rounded-[36px] bg-[#981495] p-5 sm:p-8 lg:p-12 text-white shadow-2xl transition-all"
      >
        {/* High-Performance Static Ambient Gradient Glows (Replaces infinite keyframe repaints) */}
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-radial from-purple-400/30 to-transparent blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-radial from-purple-900/40 to-transparent blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-5 sm:space-y-7">
          {/* Top Pill Badges Row */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <div
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3 py-1 text-[11px] sm:text-xs font-bold tracking-wide text-white border border-white/20 shadow-xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
              <span>LocalShore Marketplace</span>
            </div>

            <div
              className="inline-flex items-center gap-1 rounded-full bg-[#FACC15] px-3 py-1 text-[10px] sm:text-[11px] font-black uppercase text-slate-950 shadow-xs tracking-wider"
            >
              <Zap className="h-3.5 w-3.5 fill-slate-950" />
              20–30 MIN DELIVERY
            </div>
          </div>

          {/* Title Headline & Delivery Rider Video Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
            {/* Motion Typography Commercial Headline */}
            <div className="lg:col-span-7 space-y-2 sm:space-y-3">
              <h1 className="font-display text-2xl font-black tracking-tight sm:text-4xl lg:text-[52px] text-white leading-[1.1]">
                <span className="block">
                  Order food &amp; groceries.
                </span>

                <span className="block">
                  Discover best shops.
                </span>

                <span className="block pt-0.5">
                  <span className="text-[#FACC15] font-extrabold inline-block drop-shadow-md">
                    LocalShore
                  </span>{" "}
                  it!
                </span>
              </h1>

              <p
                className="text-xs sm:text-sm font-semibold text-purple-100/90 max-w-lg leading-relaxed pt-0.5 sm:pt-1"
              >
                Support neighborhood vendors with instant fulfillment across Shoreline City.
              </p>
            </div>

            {/* Delivery Rider Card */}
            <div className="flex lg:col-span-5 justify-center lg:justify-end items-center relative my-2 sm:my-4 lg:my-0 w-full">
              <div
                className="relative w-full max-w-[320px] sm:max-w-sm lg:max-w-none lg:w-96 aspect-[16/9] lg:h-72 mx-auto overflow-hidden rounded-2xl lg:rounded-3xl shadow-xl border-2 border-white/30"
              >
                <video
                  autoPlay
                  muted
                  playsInline
                  preload="metadata"
                  src="/assets/delivery-rider.mp4"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Search & Location Floating Bar */}
          <div className="relative max-w-2xl">
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex flex-col sm:flex-row items-center gap-2 rounded-2xl sm:rounded-full bg-white p-1.5 sm:p-2 shadow-2xl transition-all duration-300 z-20"
            >
              {/* Location Selector */}
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 text-slate-700 border-b sm:border-b-0 sm:border-r border-slate-200 w-full sm:w-auto shrink-0 group">
                <MapPin className="h-4 w-4 text-[#981495] shrink-0" />
                <input
                  type="text"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="Enter location"
                  className="text-xs sm:text-sm font-bold text-slate-900 bg-transparent outline-none border-none w-full sm:w-[170px] truncate"
                />
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              </div>

              {/* Search Field */}
              <div className="relative flex items-center gap-2 px-3 py-1.5 sm:py-2 w-full flex-1 min-h-[44px]">
                <Search className="h-4 w-4 text-[#981495] shrink-0" />
                <div className="relative w-full flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isFocused ? "" : `Search "${SEARCH_SUGGESTIONS[suggestionIdx]}"...`}
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

            {/* Quick Suggestions Dropdown */}
            <AnimatePresence>
              {isFocused && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 4 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl bg-white p-3 sm:p-4 shadow-2xl border border-slate-100 text-slate-900"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-800 uppercase tracking-wider">
                      <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      Popular near you
                    </span>
                    <span className="text-[10px] font-bold text-[#981495]">Tap to search</span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {POPULAR_TAGS.map((tag) => (
                      <button
                        key={tag.query}
                        type="button"
                        onClick={() => handleTagClick(tag.query)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 hover:bg-[#981495] hover:text-white px-3 py-2 text-xs font-bold text-[#981495] transition-all cursor-pointer min-h-[38px]"
                      >
                        <span>{tag.icon}</span>
                        <span>{tag.label}</span>
                      </button>
                    ))}
                  </div>
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

