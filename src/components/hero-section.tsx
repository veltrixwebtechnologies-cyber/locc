/**
 * Swiggy-Inspired Creative Hero Landing Section for Local Shore Marketplace
 * Replicates Swiggy's iconic landing hero:
 * 1. Bold brand gradient banner with "Order groceries & essentials... Shoreline it!"
 * 2. Location & Instant Search inputs floating inside the hero
 * 3. 3 Signature Floating Feature Cards (Grocery Instamart, Express Chemist, Fresh Bakes & Tech)
 */
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { m, AnimatePresence } from "motion/react";
import {
  MapPin,
  Search,
  ArrowUpRight,
  Sparkles,
  Zap,
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
  arrowBg: string;
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
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80",
    arrowBg: "bg-[#fc8019]",
  },
  {
    id: "pharmacy",
    title: "INSTANT PHARMACY",
    subtitle: "24x7 MEDICINES IN 15 MINS",
    badge: "UP TO 40% OFF",
    badgeBg: "bg-sky-100",
    badgeText: "text-sky-800",
    category: "pharmacy",
    image:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80",
    arrowBg: "bg-[#981495]",
  },
  {
    id: "bakery-tech",
    title: "BAKERY & TECH",
    subtitle: "OVEN FRESH BAKES & UTILITIES",
    badge: "UP TO 60% OFF",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-950",
    category: "bakery",
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
    arrowBg: "bg-[#284a75]",
  },
];

const SEARCH_SUGGESTIONS = [
  "Jhumka & Gold Kammal",
  "Fresh Idli & Dosa Batter",
  "Pappampatti Mysurpa & Bakery",
  "Nattu Kozhi & Country Mutton",
  "Paracetamol & 24/7 Chemist",
  "Handloom Silk Sarees & Kurtis",
  "Stainless Steel Cookers & Utensils",
];

const POPULAR_TAGS = [
  { label: "Jhumka", query: "jhumka", icon: "✨" },
  { label: "Idli Batter", query: "batter", icon: "🥣" },
  { label: "Mysurpa", query: "sweets", icon: "🍬" },
  { label: "Country Chicken", query: "chicken", icon: "🍗" },
  { label: "Medicals", query: "medical", icon: "💊" },
  { label: "Silk Sarees", query: "saree", icon: "👗" },
];

export function HeroSection() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationText, setLocationText] = useState("Pappampatti Pirivu, Coimbatore");
  const [suggestionIdx, setSuggestionIdx] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  // Cycle animated placeholder suggestions
  useEffect(() => {
    const timer = setInterval(() => {
      setSuggestionIdx((prev) => (prev + 1) % SEARCH_SUGGESTIONS.length);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToUse = customQuery ?? searchQuery;
    if (!queryToUse.trim()) return;

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
    <section className="mx-auto max-w-7xl px-4 pt-3 pb-4 md:px-8 md:pt-5">
      {/* ── Main Hero Container with Original Brand Color Code #981495 ── */}
      <div className="relative overflow-hidden rounded-[32px] bg-[#981495] p-6 sm:p-8 md:p-10 text-white shadow-lg">
        <div className="relative z-10 space-y-6">
          {/* Top Brand Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-bold tracking-wide text-white border border-white/30">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Shoreline Local Shore Marketplace</span>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-black uppercase text-slate-950">
              <Zap className="h-3 w-3" />
              20-30 MIN DELIVERY
            </div>
          </div>

          {/* Main Swiggy Catchphrase Title */}
          <div className="max-w-2xl space-y-2">
            <h1 className="font-display text-2xl font-black tracking-tight sm:text-4xl md:text-5xl text-white leading-[1.15]">
              Order food &amp; groceries. Discover best shops. Shoreline it!
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-purple-100 max-w-lg">
              Support neighborhood vendors with instant fulfillment across Shoreline City.
            </p>
          </div>

          {/* ── Location & Search Bar Container ── */}
          <div className="relative max-w-3xl">
            <m.form
              onSubmit={handleSearchSubmit}
              animate={{ scale: isFocused ? 1.005 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="relative flex flex-col sm:flex-row items-center gap-2.5 rounded-2xl bg-white p-2.5 shadow-xl transition-all duration-300 z-20"
            >
              {/* Location Selector Section */}
              <div className="flex items-center gap-2 px-3 py-2 text-slate-700 border-b sm:border-b-0 sm:border-r border-slate-200 w-full sm:w-auto shrink-0 group">
                <m.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                  <MapPin className="h-4 w-4 text-[#981495] shrink-0" />
                </m.div>
                <input
                  type="text"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="Enter delivery location"
                  className="text-xs sm:text-sm font-bold text-slate-800 bg-transparent outline-none focus:outline-none focus:ring-0 border-none w-full sm:w-[180px] truncate shadow-none"
                />
              </div>

              {/* Search Input Section with Animated Cycling Placeholder */}
              <div className="relative flex items-center gap-2 px-3 py-2 w-full flex-1">
                <m.div animate={{ rotate: searchQuery ? 90 : 0 }}>
                  <Search className="h-4 w-4 text-[#981495] shrink-0" />
                </m.div>

                <div className="relative w-full flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="relative z-10 text-xs sm:text-sm font-semibold text-slate-900 bg-transparent outline-none focus:outline-none focus:ring-0 border-none w-full shadow-none"
                  />

                  {/* Animated Rotating Placeholder when input is empty */}
                  {!searchQuery && (
                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none overflow-hidden h-full w-full">
                      <AnimatePresence mode="wait">
                        <m.span
                          key={suggestionIdx}
                          initial={{ y: 16, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -16, opacity: 0 }}
                          transition={{ duration: 0.35, ease: "easeOut" }}
                          className="text-xs sm:text-sm font-medium text-slate-400 truncate"
                        >
                          Search &quot;{SEARCH_SUGGESTIONS[suggestionIdx]}&quot;...
                        </m.span>
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Animated FIND SHOPS Button */}
              <m.button
                type="submit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                className="group relative overflow-hidden w-full sm:w-auto rounded-xl bg-slate-900 hover:bg-[#981495] text-white px-6 py-3 text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-md shrink-0 flex items-center justify-center gap-2 cursor-pointer"
              >
                {/* Shimmer Light Beam Effect */}
                <m.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "linear", repeatDelay: 1 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12"
                />
                <span className="relative z-10">FIND SHOPS</span>
                <ArrowUpRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
              </m.button>
            </m.form>

            {/* ── Animated Quick Search Suggestions Dropdown ── */}
            <AnimatePresence>
              {isFocused && (
                <m.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 4, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl bg-white p-4 shadow-2xl border border-purple-100 backdrop-blur-md text-slate-900"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider">
                      <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500 animate-pulse" />
                      Popular in Pappampatti Pirivu
                    </span>
                    <span className="text-[10px] font-bold text-[#981495]">Tap to search</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {POPULAR_TAGS.map((tag) => (
                      <m.button
                        key={tag.query}
                        type="button"
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleTagClick(tag.query)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 hover:bg-[#981495] hover:text-white px-3 py-1.5 text-xs font-bold text-[#981495] transition-all duration-200 border border-purple-100 shadow-xs cursor-pointer"
                      >
                        <span>{tag.icon}</span>
                        <span>{tag.label}</span>
                      </m.button>
                    ))}
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── 3 Swiggy Signature Feature Cards overlapping bottom of Hero ── */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {FEATURE_CARDS.map((card, index) => (
              <m.div
                key={card.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: index * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -4, scale: 1.02 }}
                onClick={() => {
                  navigate({
                    to: "/",
                    search: { category: card.category, q: undefined },
                    resetScroll: false,
                  });
                  scrollToShops();
                }}
                className="group cursor-pointer rounded-2xl bg-white p-4 shadow-md transition-all duration-300 hover:shadow-xl relative overflow-hidden border border-purple-100 flex items-center justify-between min-h-[120px]"
              >
                {/* Left Text Content */}
                <div className="flex-1 pr-2 space-y-1 z-10">
                  <div
                    className={`inline-block rounded-md px-2 py-0.5 text-[9px] font-black tracking-wider uppercase ${card.badgeBg} ${card.badgeText}`}
                  >
                    {card.badge}
                  </div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    {card.title}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 tracking-tight">
                    {card.subtitle}
                  </p>

                  {/* Swiggy Iconic Circular Arrow Button */}
                  <div className="pt-2">
                    <div
                      className={`h-7 w-7 rounded-full ${card.arrowBg} text-white flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-110`}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Right Image Cutout Preview */}
                <div className="relative shrink-0 w-[85px] h-[85px] sm:w-[95px] sm:h-[95px] rounded-xl overflow-hidden bg-slate-100 shadow-inner">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
