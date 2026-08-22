import { Link } from "@tanstack/react-router";
import { Star, ChevronLeft, ChevronRight, Zap, Clock } from "lucide-react";
import { m, AnimatePresence } from "motion/react";
import { useRef, useState, useCallback } from "react";
import type { Store } from "@/lib/mock-data";
import { categoryLabel } from "@/lib/mock-data";

/* ─── offer config per store category ─────────────────────────────────── */
const CATEGORY_OFFERS: Record<string, { primary: string; bank: string; extra: string }> = {
  grocery: {
    primary: "Flat 10% off on pre-booking",
    bank: "Up to 10% off with bank offers",
    extra: "Get extra ₹75 off using PAYTMUPI",
  },
  pharmacy: {
    primary: "Free delivery above ₹199",
    bank: "Up to 5% off with bank offers",
    extra: "Get extra ₹50 off using PAYTMUPI",
  },
  bakery: {
    primary: "Buy 2 get 1 free",
    bank: "Up to 8% off with bank offers",
    extra: "Get extra ₹40 off using PAYTMUPI",
  },
  stationery: {
    primary: "10% off on ₹300+",
    bank: "Up to 6% off with bank offers",
    extra: "Get extra ₹30 off using PAYTMUPI",
  },
};

function getOffers(category: string) {
  return CATEGORY_OFFERS[category] ?? CATEGORY_OFFERS.grocery;
}

/* ─── individual shop card (Swiggy style) ─────────────────────────────── */
function SwiggyShopCard({ store, index }: { store: Store; index: number }) {
  const offers = getOffers(store.category);
  const catLabel = categoryLabel[store.category] ?? store.category;

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group shrink-0 w-[270px] sm:w-[290px]"
    >
      <Link
        to="/store/$storeId"
        params={{ storeId: store.id }}
        className="block overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      >
        {/* Store image */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#f5f5f5]">
          <img
            src={store.imageUrl}
            alt={store.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Closed overlay */}
          {!store.isOpen && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                Currently Closed
              </span>
            </div>
          )}

          {/* ETA badge */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 shadow-sm">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="text-[13px] font-bold text-foreground">{store.etaMin} min</span>
          </div>

          {/* Verified badge */}
          {store.isOpen && (
            <span className="absolute right-2 top-2 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow">
              ✓ Open
            </span>
          )}
        </div>

        {/* Card body */}
        <div className="px-3.5 pt-3 pb-1">
          {/* Name row */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-display text-[17px] font-bold leading-tight text-foreground">
              {store.name}
            </h3>
            {/* Rating pill */}
            <span className="flex shrink-0 items-center gap-1 rounded-md bg-[#48c479] px-2 py-1 text-[13px] font-bold text-white">
              <Star className="h-3 w-3 fill-white text-white" strokeWidth={0} />
              {store.rating.toFixed(1)}
            </span>
          </div>

          {/* Subtitle row */}
          <p className="mt-0.5 truncate text-sm text-[#686b78]">
            {catLabel} · {store.address}
          </p>
          <p className="mt-0.5 text-[12px] text-[#a0a0a0]">
            {store.distanceKm.toFixed(1)} km away
          </p>
        </div>

        {/* Divider */}
        <div className="mx-3.5 my-2 border-t border-dashed border-[#e8e8e8]" />

        {/* Offer section */}
        <div className="px-3.5 pb-3 space-y-1.5">
          {/* Primary offer chip */}
          <div className="flex items-center gap-1.5">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10">
              <Zap className="h-3 w-3 text-primary" />
            </span>
            <span className="text-[13px] font-semibold text-primary">{offers.primary}</span>
            <span className="ml-auto rounded-sm bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold text-primary">
              +1 more
            </span>
          </div>

          {/* Bank offer chip */}
          <p className="rounded-md bg-[#e8f5e9] px-2.5 py-1.5 text-[13px] font-medium text-[#2d7a47]">
            {offers.bank}
          </p>

          {/* Extra offer link */}
          <p className="text-[12px] font-medium text-blue-600 hover:underline">{offers.extra}</p>
        </div>
      </Link>
    </m.div>
  );
}

/* ─── main section ─────────────────────────────────────────────────────── */
export function SwiggyShopRow({
  stores,
  title = "Discover best shops near you",
}: {
  stores: Store[];
  title?: string;
}) {
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
    el.scrollBy({ left: dir === "right" ? 310 : -310, behavior: "smooth" });
    setTimeout(updateArrows, 350);
  };

  if (!stores.length) return null;

  return (
    <section className="mt-6 px-5 md:px-8" aria-label={title}>
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-[22px] font-black text-foreground md:text-2xl">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {/* Nav arrows (desktop) */}
          <AnimatePresence>
            {canLeft && (
              <m.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="button"
                onClick={() => scroll("left")}
                className="hidden md:grid h-9 w-9 place-items-center rounded-full border border-[#e8e8e8] bg-white shadow-sm transition hover:shadow-md"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4 text-foreground" />
              </m.button>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {canRight && (
              <m.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="button"
                onClick={() => scroll("right")}
                className="hidden md:grid h-9 w-9 place-items-center rounded-full border border-[#e8e8e8] bg-white shadow-sm transition hover:shadow-md"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4 text-foreground" />
              </m.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Horizontal scrollable row */}
      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className="flex gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2 snap-x snap-mandatory"
      >
        {stores.map((store, index) => (
          <div key={store.id} className="snap-start">
            <SwiggyShopCard store={store} index={index} />
          </div>
        ))}
      </div>

      {/* Bottom gradient fade indicator */}
      <div className="pointer-events-none mt-1 h-2 w-full" />
    </section>
  );
}

/* ─── Swiggy-style 2-row category grid with circular images ────────────── */
const SHOP_CATEGORIES = [
  {
    id: "fresh",
    label: "Fresh Produce",
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "bakery",
    label: "Bakery",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "stationery",
    label: "Stationery",
    imageUrl: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "snacks",
    label: "Snacks",
    imageUrl: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "personal",
    label: "Personal Care",
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "home",
    label: "Home Essentials",
    imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "electronics",
    label: "Electronics",
    imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "fashion",
    label: "Fashion",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "kitchen",
    label: "Kitchen",
    imageUrl: "https://images.unsplash.com/photo-1584990347449-716c15a3a17a?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "accessories",
    label: "Accessories",
    imageUrl: "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "footwear",
    label: "Footwear",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "ready",
    label: "Ready to Cook",
    imageUrl: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "grocery",
    label: "Grocery",
    imageUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=200&q=80",
  },
];

// Split into two rows of 7 each
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
      {/* Section header */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-[20px] font-black text-foreground md:text-2xl">
          Shop by category
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={!canLeft}
            className="grid h-9 w-9 place-items-center rounded-full border border-[#e8e8e8] bg-white shadow-sm transition hover:shadow-md disabled:opacity-30"
            aria-label="Scroll categories left"
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={!canRight}
            className="grid h-9 w-9 place-items-center rounded-full border border-[#e8e8e8] bg-white shadow-sm transition hover:shadow-md disabled:opacity-30"
            aria-label="Scroll categories right"
          >
            <ChevronRight className="h-4 w-4 text-foreground" />
          </button>
        </div>
      </div>

      {/* 2-row grid, horizontally scrollable */}
      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex flex-col gap-5">
          {/* Row 1 */}
          <div className="flex gap-6">
            {ROW1.map((cat, index) => (
              <CategoryPill key={cat.id} cat={cat} index={index} />
            ))}
          </div>
          {/* Row 2 */}
          <div className="flex gap-6">
            {ROW2.map((cat, index) => (
              <CategoryPill key={cat.id} cat={cat} index={ROW1.length + index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryPill({
  cat,
  index,
}: {
  cat: { id: string; label: string; imageUrl: string };
  index: number;
}) {
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="shrink-0"
    >
      <Link
        to="/"
        search={{ category: cat.id, q: undefined }}
        className="group flex flex-col items-center gap-2"
      >
        {/* Circular image */}
        <div className="h-[100px] w-[100px] overflow-hidden rounded-full border-2 border-transparent bg-[#f5f5f5] shadow-sm ring-2 ring-transparent transition-all duration-200 group-hover:border-primary/30 group-hover:ring-primary/20 group-hover:scale-105 group-hover:shadow-md">
          <img
            src={cat.imageUrl}
            alt={cat.label}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>
        {/* Label */}
        <span className="w-[100px] text-center text-[13px] font-semibold leading-tight text-foreground/85">
          {cat.label}
        </span>
      </Link>
    </m.div>
  );
}
