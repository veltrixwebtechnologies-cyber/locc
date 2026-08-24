/**
 * Swiggy-Inspired Creative Hero Landing Section for Local Shore Marketplace
 * Replicates Swiggy's iconic landing hero:
 * 1. Bold brand gradient banner with "Order groceries & essentials... Shoreline it!"
 * 2. Location & Instant Search inputs floating inside the hero
 * 3. 3 Signature Floating Feature Cards (Grocery Instamart, Express Chemist, Fresh Bakes & Tech)
 */
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { m } from "motion/react";
import {
  MapPin,
  Search,
  ArrowUpRight,
  ShoppingBag,
  Zap,
  Sparkles,
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
    arrowBg: "bg-[#fc8019]", // Swiggy iconic orange arrow
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
    arrowBg: "bg-[#981495]", // Local Shore signature purple
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
    arrowBg: "bg-[#284a75]", // Shoreline navy accent
  },
];

export function HeroSection() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationText, setLocationText] = useState("Beach Road, Shoreline City");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate({
      to: "/",
      search: { q: searchQuery.trim(), category: undefined },
    });
    scrollToShops();
  };

  return (
    <section className="mx-auto max-w-7xl px-4 pt-3 pb-4 md:px-8 md:pt-5">
      {/* ── Main Hero Container with Original Brand Color Code #981495 (Solid, No Gradient) ── */}
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
              Order food &amp; groceries. Discover best shops.{" "}
              <span className="underline decoration-amber-400 decoration-wavy decoration-2">
                Shoreline it!
              </span>
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-purple-100 max-w-lg">
              Support neighborhood vendors with instant fulfillment across Shoreline City.
            </p>
          </div>

          {/* Location & Search Bar floating in Hero */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col sm:flex-row items-center gap-2.5 rounded-2xl bg-white p-2 shadow-lg max-w-3xl"
          >
            {/* Location selector */}
            <div className="flex items-center gap-2 px-3 py-2 text-slate-700 border-b sm:border-b-0 sm:border-r border-slate-200 w-full sm:w-auto shrink-0">
              <MapPin className="h-4 w-4 text-[#981495] shrink-0" />
              <input
                type="text"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="Enter delivery location"
                className="text-xs sm:text-sm font-bold text-slate-800 bg-transparent focus:outline-none w-full sm:w-[170px] truncate"
              />
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2 px-3 py-2 w-full flex-1">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for restaurant, grocery, pharmacy or items..."
                className="text-xs sm:text-sm font-semibold text-slate-800 bg-transparent focus:outline-none w-full placeholder:text-slate-400"
              />
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="w-full sm:w-auto rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 text-xs font-black uppercase tracking-wider transition active:scale-95 shrink-0 flex items-center justify-center gap-1.5"
            >
              <span>FIND SHOPS</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </form>

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
