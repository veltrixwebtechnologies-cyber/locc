import { Link } from "@tanstack/react-router";
import { Star, ChevronLeft, ChevronRight, Heart, MapPin } from "lucide-react";
import { m, AnimatePresence } from "motion/react";
import { useRef, useState, useCallback } from "react";
import type { Store } from "@/lib/mock-data";
import { categoryLabel } from "@/lib/mock-data";
import { useShopsStatus } from "@/lib/shop-availability";
import { WishlistButton } from "@/components/wishlist-button";
import { scrollToShops } from "@/lib/scroll-utils";

/* ─── offer config per store category ─────────────────────────────────── */
const CATEGORY_OFFERS: Record<string, { primary: string; bank: string; overlayTag: string }> = {
  flour_mill: {
    primary: "Freshly ground batter & flour",
    bank: "Flat ₹20 off on batter",
    overlayTag: "FRESH BATTER ₹45",
  },
  palamuthir: {
    primary: "Farm fresh fruits & veggies",
    bank: "Up to 15% off on fruits",
    overlayTag: "FARM FRESH | 20 MIN",
  },
  meat_fish: {
    primary: "Tender Mutton & Fresh Sea Fish",
    bank: "Free cleaning & cutting",
    overlayTag: "100% FRESH MEAT",
  },
  fashion_accessories: {
    primary: "Chains, Kammal & Gift Box Sets",
    bank: "Buy 1 Get 1 Free on Earrings",
    overlayTag: "GIFTS & JEWELLERY",
  },
  boutiques: {
    primary: "Handloom Silks & Kurti Sets",
    bank: "Up to 20% off on stitching",
    overlayTag: "DESIGNER BOUTIQUE",
  },
  showrooms: {
    primary: "Electronics & Textile Showroom",
    bank: "No Cost EMI available",
    overlayTag: "SHOWROOM DEALS",
  },
  fast_fashion: {
    primary: "Branded youth denim & tees",
    bank: "Flat 30% off on ₹999+",
    overlayTag: "BRANDED OUTLET",
  },
  individual_fashion: {
    primary: "Cotton shirts & pure dhotis",
    bank: "Flat ₹100 off on readymades",
    overlayTag: "LOCAL FASHION",
  },
  kitchen_appliances: {
    primary: "Cookers, Mixers & Utensils",
    bank: "1 Year free warranty",
    overlayTag: "VESSELS & APPLIANCES",
  },
  home_decor: {
    primary: "Curtains, Brass Lamps & Decor",
    bank: "Up to 15% off on decor",
    overlayTag: "HOME INTERIORS",
  },
  pharmacy: {
    primary: "Free delivery above ₹199",
    bank: "Up to 10% off with bank offers",
    overlayTag: "24/7 CHEMIST",
  },
  stationery: {
    primary: "10% off on ₹300+",
    bank: "Up to 8% off with bank offers",
    overlayTag: "BOOK STALL",
  },
  bakery: {
    primary: "Buy 2 get 1 free",
    bank: "Up to 8% off with bank offers",
    overlayTag: "50% OFF | OVEN FRESH",
  },
  grocery: {
    primary: "Flat 10% off on pre-booking",
    bank: "Up to 10% off with bank offers",
    overlayTag: "ITEMS AT ₹39",
  },
};

function getOffers(category: string) {
  return CATEGORY_OFFERS[category] ?? CATEGORY_OFFERS.grocery;
}

/* ─── Swiggy-exact shop card ──────────────────────────────────────────── */
function SwiggyShopCard({
  store,
  index,
  liveIsOpen,
}: {
  store: Store;
  index: number;
  liveIsOpen?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const offers = getOffers(store.category);
  const catLabel = categoryLabel[store.category] ?? store.category;
  const isOpen = liveIsOpen !== undefined ? liveIsOpen : store.isOpen;

  return (
    <div className="group shrink-0 w-[260px] sm:w-[273px] transition-all duration-200">
      <div className="relative overflow-hidden rounded-[24px] bg-white shadow-xs transition-shadow duration-300 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.18)]">
        {/* Wishlist Button in Top Right */}
        <div className="absolute right-3 top-3 z-20">
          <WishlistButton
            productId={`store-${store.id}`}
            productName={store.name}
            item={{
              productId: `store-${store.id}`,
              name: store.name,
              shopName: store.name,
              category: catLabel,
              price: 0,
              imageUrl: store.imageUrl,
              sellerId: store.id,
            }}
          />
        </div>

        <Link to="/store/$storeId" params={{ storeId: store.id }} className="block">
          {/* ── Image area ── */}
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#f0f0f5]">
            <img
              src={
                imgError
                  ? "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=75"
                  : store.imageUrl
              }
              alt={store.name}
              loading="lazy"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Bottom gradient — Swiggy style dark gradient */}
            <div
              className="absolute inset-x-0 bottom-0 h-[60%]"
              style={{
                background:
                  "linear-gradient(to top, rgba(15,15,20,0.85) 0%, rgba(15,15,20,0.4) 50%, transparent 100%)",
              }}
            />

            {/* Bottom Left Bold Overlay Offer Text (Swiggy Exact) */}
            <div className="absolute bottom-2.5 left-3">
              <p className="text-[16px] sm:text-[18px] font-black uppercase tracking-tight text-white drop-shadow-md">
                {offers.overlayTag}
              </p>
              <p className="text-[11px] font-semibold text-white/80">
                {store.etaMin} MINS · {store.distanceKm.toFixed(1)} km
              </p>
            </div>

            {/* Closed overlay */}
            {!isOpen && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px]">
                <p className="text-[15px] font-bold text-white">Currently closed</p>
                <p className="mt-0.5 text-[12px] text-white/70">Opens tomorrow at 8 AM</p>
              </div>
            )}
          </div>

          {/* ── Card body ── */}
          <div className="px-3.5 pt-3 pb-3.5">
            {/* Name + Rating row — Swiggy style */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate text-[16px] sm:text-[17px] font-extrabold leading-tight text-[#1a1a2e]">
                {store.name}
              </h3>
            </div>

            {/* Rating + ETA line */}
            <div className="mt-1 flex items-center gap-1.5 text-[13px] font-bold text-[#282c3f]">
              <span className="flex items-center gap-0.5 rounded-md bg-[#1a8d3f] px-1.5 py-[2px] text-[12px] font-black text-white">
                <Star className="h-3 w-3 fill-white text-white" />
                {store.rating.toFixed(1)}
              </span>
              <span>•</span>
              <span>
                {store.etaMin}-{store.etaMin + 5} mins
              </span>
            </div>

            {/* Subtitle — Cuisine/Category */}
            <p className="mt-1 truncate text-[13px] text-[#686b78] font-medium">
              {catLabel} · {store.address}
            </p>

            {/* Thin divider */}
            <div className="mt-2.5 mb-2 h-px bg-[#f0f0f5]" />

            {/* Bank offer */}
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="shrink-0">
                <rect
                  x="1"
                  y="3"
                  width="18"
                  height="14"
                  rx="2"
                  stroke="#981495"
                  strokeWidth="1.5"
                />
                <path d="M1 8h18" stroke="#981495" strokeWidth="1.5" />
              </svg>
              <p className="truncate text-[12px] font-semibold text-[#686b78]">{offers.bank}</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

/* ─── main shop row ────────────────────────────────────────────────────── */
export function SwiggyShopRow({
  stores,
  title = "Top shops near you",
  activeCategory,
  onSelectCategory,
}: {
  stores: Store[];
  title?: string;
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const [internalTab, setInternalTab] = useState<string>("all");

  const activeFilterTab = activeCategory && activeCategory !== "all" ? activeCategory : internalTab;

  const handleTabClick = (catId: string) => {
    const nextTab = activeFilterTab === catId ? "all" : catId;
    setInternalTab(nextTab);
    if (onSelectCategory) {
      onSelectCategory(nextTab);
    }
  };

  const realIds = stores.map((s) => s.id).filter((id) => !id.startsWith("mock-"));
  const statusQ = useShopsStatus(realIds);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 290 : -290, behavior: "smooth" });
    setTimeout(updateArrows, 350);
  };

  const filteredStores = stores.filter((s) => {
    if (activeFilterTab === "all") return true;
    if (activeFilterTab === "min100") return true;
    if (activeFilterTab === "fast") return s.etaMin <= 25;
    if (activeFilterTab === "ratings") return s.rating >= 4.7;
    return s.category === activeFilterTab;
  });

  if (!stores.length) return null;

  return (
    <section className="mt-8 px-5 md:px-8" aria-label={title}>
      {/* Filter Tabs Bar (Swiggy exact) */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => handleTabClick("all")}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition-all ${
            activeFilterTab === "all"
              ? "bg-[#101c42] text-white shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          ALL SHOPS ({stores.length})
        </button>
        <button
          type="button"
          onClick={() => handleTabClick("palamuthir")}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase transition-all ${
            activeFilterTab === "palamuthir"
              ? "bg-[#981495] text-white shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          🍎 PALAMUTHIR NILAYAM
        </button>
        <button
          type="button"
          onClick={() => handleTabClick("flour_mill")}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase transition-all ${
            activeFilterTab === "flour_mill"
              ? "bg-[#981495] text-white shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          🌾🌶️ FLOUR & MASALA MILL (மாவு & மசாலா ஆலை)
        </button>
        <button
          type="button"
          onClick={() => handleTabClick("meat_fish")}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase transition-all ${
            activeFilterTab === "meat_fish"
              ? "bg-[#981495] text-white shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          🍗 MEAT, FISH & CHICKEN
        </button>
        <button
          type="button"
          onClick={() => handleTabClick("fashion_accessories")}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase transition-all ${
            activeFilterTab === "fashion_accessories"
              ? "bg-[#981495] text-white shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          💎 CHAIN & KAMMAL GIFTS
        </button>
        <button
          type="button"
          onClick={() => handleTabClick("boutiques")}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase transition-all ${
            activeFilterTab === "boutiques"
              ? "bg-[#981495] text-white shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          👗 BOUTIQUES
        </button>
        <button
          type="button"
          onClick={() => handleTabClick("showrooms")}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase transition-all ${
            activeFilterTab === "showrooms"
              ? "bg-[#981495] text-white shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          📺 SHOWROOMS
        </button>
        <button
          type="button"
          onClick={() => handleTabClick("fast_fashion")}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase transition-all ${
            activeFilterTab === "fast_fashion"
              ? "bg-[#981495] text-white shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          🛍️ FAST FASHION (BRANDED)
        </button>
        <button
          type="button"
          onClick={() => handleTabClick("individual_fashion")}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase transition-all ${
            activeFilterTab === "individual_fashion"
              ? "bg-[#981495] text-white shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          👔 INDIVIDUAL FASHION SHOPS
        </button>
        <button
          type="button"
          onClick={() => handleTabClick("kitchen_appliances")}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase transition-all ${
            activeFilterTab === "kitchen_appliances"
              ? "bg-[#981495] text-white shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          🍳 KITCHEN APPLIANCES
        </button>
        <button
          type="button"
          onClick={() => handleTabClick("home_decor")}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase transition-all ${
            activeFilterTab === "home_decor"
              ? "bg-[#981495] text-white shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          🏺 INTERIOR & HOME DECOR
        </button>
        <button
          type="button"
          onClick={() => handleTabClick("pharmacy")}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase transition-all ${
            activeFilterTab === "pharmacy"
              ? "bg-[#981495] text-white shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          💊 PHARMACY INDIVIDUAL
        </button>
        <button
          type="button"
          onClick={() => handleTabClick("stationery")}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase transition-all ${
            activeFilterTab === "stationery"
              ? "bg-[#981495] text-white shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          📚 BOOKS & STATIONERY
        </button>
      </div>

      {/* Header row */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[20px] sm:text-[22px] font-black text-[#1a1a2e] md:text-[24px]">
            {title}
          </h2>
          <div className="mt-0.5 h-[3px] w-8 rounded-full bg-[#981495]" />
        </div>
        <div className="flex items-center gap-2">
          <NavArrow dir="left" visible={canLeft} onClick={() => scroll("left")} />
          <NavArrow dir="right" visible={canRight} onClick={() => scroll("right")} />
        </div>
      </div>

      {/* scrollable row */}
      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
      >
        {filteredStores.map((store, index) => {
          const liveStatus = statusQ.data?.get(store.id);
          return (
            <div key={store.id} className="snap-start">
              <SwiggyShopCard store={store} index={index} liveIsOpen={liveStatus?.isOpen} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─── reusable nav arrow button ────────────────────────────────────────── */
function NavArrow({
  dir,
  visible,
  onClick,
}: {
  dir: "left" | "right";
  visible: boolean;
  onClick: () => void;
}) {
  const Icon = dir === "left" ? ChevronLeft : ChevronRight;
  return (
    <AnimatePresence>
      {visible && (
        <m.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          type="button"
          onClick={onClick}
          className="hidden md:grid h-9 w-9 place-items-center rounded-full bg-[#e2e2e7] transition hover:bg-[#d5d5da]"
          aria-label={`Scroll ${dir}`}
        >
          <Icon className="h-5 w-5 text-[#1a1a2e]" />
        </m.button>
      )}
    </AnimatePresence>
  );
}

/* ─── Swiggy category strip — 2-row scrollable circles ─────────────────── */
const SHOP_CATEGORIES = [
  {
    id: "palamuthir",
    label: "Palamuthir",
    imageUrl:
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "flour_mill",
    label: "Flour Mill (மாவு ஆலை)",
    imageUrl:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "meat_fish",
    label: "Meat & Fish",
    imageUrl:
      "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "fashion_accessories",
    label: "Chain & Kammal",
    imageUrl:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "boutiques",
    label: "Boutiques",
    imageUrl:
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "showrooms",
    label: "Showrooms",
    imageUrl:
      "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "fast_fashion",
    label: "Fast Fashion",
    imageUrl:
      "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "individual_fashion",
    label: "Local Fashion",
    imageUrl:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "kitchen_appliances",
    label: "Kitchen Utensils",
    imageUrl:
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "home_decor",
    label: "Home Decor",
    imageUrl:
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    imageUrl:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "stationery",
    label: "Book Stall",
    imageUrl:
      "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "bakery",
    label: "Bakery",
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "grocery",
    label: "Grocery",
    imageUrl:
      "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=200&q=80",
  },
];

const ROW1 = SHOP_CATEGORIES.slice(0, 7);
const ROW2 = SHOP_CATEGORIES.slice(7);

export function SwiggyQuickCategories() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 400 : -400, behavior: "smooth" });
    setTimeout(updateArrows, 350);
  };

  return (
    <section className="mt-6 px-5 md:px-8" aria-label="Shop by category">
      {/* header with underline */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-extrabold text-[#1a1a2e] md:text-[22px]">
            What's on your mind?
          </h2>
          <div className="mt-0.5 h-[3px] w-8 rounded-full bg-[#981495]" />
        </div>
        <div className="flex items-center gap-2">
          <NavArrow dir="left" visible={canLeft} onClick={() => scroll("left")} />
          <NavArrow dir="right" visible={canRight} onClick={() => scroll("right")} />
        </div>
      </div>

      {/* 2-row grid filling full width across desktop viewports */}
      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className="w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex min-w-full flex-col gap-4">
          <div className="flex w-full items-center justify-between gap-4 md:gap-6">
            {ROW1.map((cat, i) => (
              <CategoryCircle key={cat.id} cat={cat} index={i} />
            ))}
          </div>
          <div className="flex w-full items-center justify-between gap-4 md:gap-6">
            {ROW2.map((cat, i) => (
              <CategoryCircle key={cat.id} cat={cat} index={ROW1.length + i} />
            ))}
          </div>
        </div>
      </div>

      {/* Swiggy-style full-width divider */}
      <div className="mt-6 h-px bg-[#e2e2e7]" />
    </section>
  );
}

function CategoryCircle({
  cat,
  index,
}: {
  cat: { id: string; label: string; imageUrl: string };
  index: number;
}) {
  const [hasError, setHasError] = useState(false);
  const fallback =
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80";

  return (
    <div className="shrink-0">
      <Link
        to="/"
        search={{ category: cat.id, q: undefined }}
        resetScroll={false}
        onClick={scrollToShops}
        className="group flex flex-col items-center gap-1.5"
      >
        <div className="h-[90px] w-[90px] overflow-hidden rounded-full bg-[#f0f0f5] transition-transform duration-200 group-hover:scale-105 md:h-[100px] md:w-[100px]">
          <img
            src={hasError ? fallback : cat.imageUrl}
            alt={cat.label}
            loading="lazy"
            onError={() => setHasError(true)}
            className="h-full w-full object-cover"
          />
        </div>
        <span className="w-[90px] text-center text-[13px] font-semibold leading-tight text-[#1a1a2e]/80 md:w-[100px]">
          {cat.label}
        </span>
      </Link>
    </div>
  );
}
