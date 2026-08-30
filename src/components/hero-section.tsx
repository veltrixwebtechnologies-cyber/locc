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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile, { passive: true });
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const disableHeavyMotion = shouldReduceMotion || isMobile;

  // ── Scene 10: Scroll Transformation Hooks ──
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.96]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.8]);
  const scooterScrollX = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const headlineScrollY = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const cardsScrollY = useTransform(scrollYProgress, [0, 1], [0, 20]);

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
      className="mx-auto max-w-7xl px-4 pt-3 pb-6 md:px-8 md:pt-5 overflow-hidden"
    >
      {/* ── Scene 1 & 10: Camera Push-In Hero Card with Scroll Transformation ── */}
      <motion.div
        style={
          disableHeavyMotion
            ? {}
            : {
                scale: heroScale,
                opacity: heroOpacity,
              }
        }
        initial={{ opacity: 0, scale: disableHeavyMotion ? 1 : 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[36px] bg-[#981495] p-6 sm:p-8 lg:p-12 text-white shadow-2xl"
      >
        {/* Slow Animated Ambient Glows */}
        <motion.div
          animate={
            disableHeavyMotion
              ? {}
              : {
                  y: [0, 14, 0],
                  opacity: [0.2, 0.35, 0.2],
                  scale: [1, 1.05, 1],
                }
          }
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-purple-400/25 blur-3xl pointer-events-none"
        />
        <motion.div
          animate={
            disableHeavyMotion
              ? {}
              : {
                  y: [0, -14, 0],
                  opacity: [0.3, 0.45, 0.3],
                  scale: [1, 1.08, 1],
                }
          }
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-purple-900/40 blur-3xl pointer-events-none"
        />

        <div className="relative z-10 space-y-7">
          {/* Top Pill Badges Row (Scene 1: Energetic Badges Arrival) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* LocalShore Marketplace Badge */}
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3.5 py-1 text-xs font-bold tracking-wide text-white border border-white/20 shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
              <span>LocalShore Marketplace</span>
            </motion.div>

            {/* "20–30 MIN DELIVERY" Badge with Energetic Spring Overshoot */}
            <motion.div
              initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -30, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: [0.8, 1.12, 1] }}
              transition={{ duration: 0.5, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-1 rounded-full bg-[#FACC15] px-3.5 py-1 text-[11px] font-black uppercase text-slate-950 shadow-md tracking-wider"
            >
              <Zap className="h-3.5 w-3.5 fill-slate-950" />
              20–30 MIN DELIVERY
            </motion.div>
          </div>

          {/* Title Headline & 3D Rider Illustration Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Scene 2: Motion Typography Commercial Headline */}
            <motion.div
              style={shouldReduceMotion ? {} : { y: headlineScrollY }}
              className="lg:col-span-7 space-y-3"
            >
              <h1 className="font-display text-3xl font-black tracking-tight sm:text-5xl lg:text-[54px] text-white leading-[1.08]">
                {/* Line 1: Slides in from left with overshoot */}
                <motion.span
                  initial={{
                    opacity: 0,
                    x: shouldReduceMotion ? 0 : -60,
                    filter: shouldReduceMotion ? "none" : "blur(6px)",
                  }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.55, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="block"
                >
                  Order food &amp; groceries.
                </motion.span>

                {/* Line 2: Follows naturally */}
                <motion.span
                  initial={{
                    opacity: 0,
                    x: shouldReduceMotion ? 0 : -50,
                    filter: shouldReduceMotion ? "none" : "blur(6px)",
                  }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.55, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
                  className="block"
                >
                  Discover best shops.
                </motion.span>

                {/* Line 3: Commercial Pop Emphasis on "LocalShore" */}
                <motion.span
                  initial={{
                    opacity: 0,
                    x: shouldReduceMotion ? 0 : -40,
                    filter: shouldReduceMotion ? "none" : "blur(6px)",
                  }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.55, delay: 0.50, ease: [0.16, 1, 0.3, 1] }}
                  className="block pt-0.5"
                >
                  <motion.span
                    initial={{
                      opacity: 0,
                      scale: 0.75,
                      rotate: shouldReduceMotion ? 0 : -4,
                    }}
                    animate={{
                      opacity: 1,
                      scale: [0.75, 1.15, 1],
                      rotate: shouldReduceMotion ? 0 : [-4, 2, 0],
                    }}
                    transition={{
                      duration: 0.6,
                      delay: 0.55,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="text-[#FACC15] font-extrabold inline-block drop-shadow-md"
                  >
                    LocalShore
                  </motion.span>{" "}
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.65 }}
                  >
                    it!
                  </motion.span>
                </motion.span>
              </h1>

              {/* Subtitle Description */}
              <motion.p
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.65, ease: "easeOut" }}
                className="text-xs sm:text-sm font-semibold text-purple-100/90 max-w-lg leading-relaxed pt-1"
              >
                Support neighborhood vendors with instant fulfillment across Shoreline City.
              </motion.p>
            </motion.div>

            {/* ── Scene 3, 4, 8 & 10: Scooter Entrance & Pristine Delivery Rider Video ── */}
            <div className="flex lg:col-span-5 justify-center lg:justify-end items-center relative my-4 lg:my-0 w-full">
              <motion.div
                initial={{
                  opacity: 0,
                  x: shouldReduceMotion ? 0 : 40,
                  scale: 0.9,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: 1,
                }}
                transition={{
                  duration: 0.8,
                  delay: 0.3,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative w-full max-w-[340px] sm:max-w-sm lg:max-w-none lg:w-96 aspect-[16/9] lg:h-72 mx-auto overflow-hidden rounded-2xl lg:rounded-3xl shadow-xl lg:shadow-2xl border-2 border-white/30"
              >
                {/* High-Fidelity Animated Delivery Rider Video (Plays Once) */}
                <motion.video
                  autoPlay
                  muted
                  playsInline
                  animate={
                    shouldReduceMotion
                      ? {}
                      : {
                          y: [0, -4, 0, -2, 0],
                        }
                  }
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  src="/assets/delivery-rider.mp4"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>
          </div>

          {/* ── Scene 5: Search & Location Floating Bar Unfold ── */}
          <div className="relative max-w-2xl">
            <motion.form
              onSubmit={handleSearchSubmit}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: isFocused ? 1.005 : 1 }}
              transition={{
                duration: 0.6,
                delay: 0.7,
                ease: [0.16, 1, 0.3, 1],
                scale: { type: "spring", stiffness: 400, damping: 25 },
              }}
              className="relative flex flex-col sm:flex-row items-center gap-2 rounded-2xl sm:rounded-full bg-white p-2 shadow-2xl transition-all duration-300 z-20"
            >
              {/* Location Selector (Slides in from left) */}
              <motion.div
                initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.75 }}
                className="flex items-center gap-2 px-4 py-2 text-slate-700 border-b sm:border-b-0 sm:border-r border-slate-200 w-full sm:w-auto shrink-0 group"
              >
                <MapPin className="h-4 w-4 text-[#981495] shrink-0" />
                <input
                  type="text"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="Enter location"
                  className="text-xs sm:text-sm font-bold text-slate-900 bg-transparent outline-none border-none w-full sm:w-[170px] truncate"
                />
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              </motion.div>

              {/* Search Field */}
              <div className="relative flex items-center gap-2 px-3 py-2 w-full flex-1">
                <Search className="h-4 w-4 text-[#981495] shrink-0" />
                <div className="relative w-full flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="relative z-10 text-xs sm:text-sm font-semibold text-slate-900 bg-transparent outline-none border-none w-full"
                  />

                  {!searchQuery && (
                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none overflow-hidden h-full w-full">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={suggestionIdx}
                          initial={{ y: 14, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -14, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="text-xs sm:text-sm font-medium text-slate-400 truncate"
                        >
                          Search &quot;{SEARCH_SUGGESTIONS[suggestionIdx]}&quot;...
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Scene 9: FIND SHOPS Button with Hover Advance */}
              <motion.button
                type="submit"
                initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 25, scale: 0.92 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="group w-full sm:w-auto rounded-full bg-[#1e293b] hover:bg-[#0f172a] text-white px-6 py-3 text-xs font-black uppercase tracking-wider transition-colors duration-200 shadow-lg flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>FIND SHOPS</span>
                <ArrowUpRight className="h-4 w-4 stroke-[2.5] transition-transform duration-200 group-hover:translate-x-1.5 group-hover:-translate-y-0.5" />
              </motion.button>
            </motion.form>

            {/* Quick Suggestions Dropdown */}
            <AnimatePresence>
              {isFocused && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 6 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl bg-white p-4 shadow-2xl border border-slate-100 text-slate-900"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-800 uppercase tracking-wider">
                      <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      Popular near you
                    </span>
                    <span className="text-[10px] font-bold text-[#981495]">Tap to search</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {POPULAR_TAGS.map((tag) => (
                      <button
                        key={tag.query}
                        type="button"
                        onClick={() => handleTagClick(tag.query)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 hover:bg-[#981495] hover:text-white px-3 py-1.5 text-xs font-bold text-[#981495] transition-all cursor-pointer"
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

          {/* ── Scene 6, 7 & 9: Sequential Promotional Cards with Inner Image Parallax ── */}
          <motion.div
            style={shouldReduceMotion ? {} : { y: cardsScrollY }}
            className="pt-2 flex sm:grid grid-cols-1 sm:grid-cols-3 gap-4 overflow-x-auto snap-x scrollbar-none pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 sm:pb-0"
          >
            {FEATURE_CARDS.map((card, index) => {
              const cardDelay = 0.85 + index * 0.12;
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 40, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: cardDelay,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  whileHover={{ y: -8, scale: 1.025 }}
                  onClick={() => {
                    navigate({
                      to: "/",
                      search: { category: card.category, q: undefined },
                      resetScroll: false,
                    });
                    scrollToShops();
                  }}
                  className="group cursor-pointer rounded-2xl bg-white p-4.5 shadow-xl transition-shadow duration-300 hover:shadow-2xl relative overflow-hidden flex items-center justify-between min-h-[125px] border border-white/20 shrink-0 w-[270px] sm:w-auto snap-start"
                >
                  {/* Left Text Info */}
                  <div className="flex-1 pr-2 space-y-1 z-10 flex flex-col justify-between h-full">
                    <div>
                      {/* Discount Badge Entrance */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, delay: cardDelay + 0.1 }}
                        className={`inline-block rounded-md px-2 py-0.5 text-[9px] font-black tracking-wider uppercase ${card.badgeBg} ${card.badgeText}`}
                      >
                        {card.badge}
                      </motion.div>

                      <h3 className="text-sm font-black text-slate-900 leading-tight pt-1">
                        {card.title}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 tracking-tight">
                        {card.subtitle}
                      </p>
                    </div>

                    {/* Purple Circle Arrow Button */}
                    <div className="pt-3">
                      <div className="h-7 w-7 rounded-full bg-[#981495] text-white flex items-center justify-center shadow-md transition-all duration-200 group-hover:scale-115 group-hover:bg-[#800f7d]">
                        <ArrowUpRight className="h-4 w-4 stroke-[2.5] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Scene 7: Right Cutout Image with Parallax Depth Entrance & Hover Zoom */}
                  <div className="relative shrink-0 w-24 h-24 sm:w-26 sm:h-26 flex items-center justify-center overflow-hidden rounded-xl">
                    <motion.img
                      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.5, delay: cardDelay + 0.15 }}
                      src={card.image}
                      alt={card.title}
                      className="h-full w-full object-contain filter drop-shadow-md transition-transform duration-500 group-hover:scale-108 group-hover:-translate-y-1"
                    />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Carousel Dot Indicators */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {[0, 1, 2, 3].map((dot) => (
              <button
                key={dot}
                type="button"
                onClick={() => setActiveSlide(dot)}
                className="relative p-1 focus:outline-none cursor-pointer"
                aria-label={`Slide ${dot + 1}`}
              >
                <motion.div
                  animate={{
                    width: activeSlide === dot ? 24 : 8,
                    opacity: activeSlide === dot ? 1 : 0.4,
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="h-2 rounded-full bg-white"
                />
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
