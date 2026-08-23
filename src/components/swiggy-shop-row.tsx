import { Link } from "@tanstack/react-router";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { m, AnimatePresence } from "motion/react";
import { useRef, useState, useCallback } from "react";
import type { Store } from "@/lib/mock-data";
import { categoryLabel } from "@/lib/mock-data";
import { useShopsStatus } from "@/lib/shop-availability";

/* ─── offer config per store category ─────────────────────────────────── */
const CATEGORY_OFFERS: Record<string, { primary: string; bank: string }> = {
  grocery: {
    primary: "Flat 10% off on pre-booking",
    bank: "Up to 10% off with bank offers",
  },
  pharmacy: {
    primary: "Free delivery above ₹199",
    bank: "Up to 5% off with bank offers",
  },
  bakery: {
    primary: "Buy 2 get 1 free",
    bank: "Up to 8% off with bank offers",
  },
  stationery: {
    primary: "10% off on ₹300+",
    bank: "Up to 6% off with bank offers",
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
  const offers = getOffers(store.category);
  const catLabel = categoryLabel[store.category] ?? store.category;
  const isOpen = liveIsOpen !== undefined ? liveIsOpen : store.isOpen;

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.36,
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group shrink-0 w-[260px] sm:w-[273px]"
    >
      <Link
        to="/store/$storeId"
        params={{ storeId: store.id }}
        className="block overflow-hidden rounded-[24px] bg-white transition-shadow duration-300 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.18)]"
      >
        {/* ── Image area ── */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#f0f0f5]">
          <img
            src={store.imageUrl}
            alt={store.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Bottom gradient — Swiggy style: dark gradient strip at bottom */}
          <div
            className="absolute inset-x-0 bottom-0 h-[52%]"
            style={{
              background:
                "linear-gradient(to top, rgba(27,27,27,0.75) 0%, transparent 100%)",
            }}
          />

          {/* ETA — bottom-left, bold white, Swiggy exact */}
          <div className="absolute bottom-2.5 left-3">
            <p className="text-[22px] font-extrabold leading-none text-white drop-shadow-lg">
              {store.etaMin} MINS
            </p>
            <p className="text-[12px] font-medium text-white/80 mt-0.5">
              {store.distanceKm.toFixed(1)} km
            </p>
          </div>

          {/* Closed overlay */}
          {!isOpen && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px]">
              <p className="text-[15px] font-bold text-white">Currently closed</p>
              <p className="mt-0.5 text-[12px] text-white/70">Opens tomorrow at 8 AM</p>
            </div>
          )}

          {/* Offer ribbon — Swiggy style diagonal */}
          <div className="absolute left-0 top-3">
            <div className="rounded-r-lg bg-[#981495] px-2.5 py-1 shadow-md">
              <p className="text-[12px] font-extrabold uppercase tracking-wide text-white">
                {offers.primary.length > 22
                  ? offers.primary.slice(0, 22) + "…"
                  : offers.primary}
              </p>
            </div>
          </div>
        </div>

        {/* ── Card body ── */}
        <div className="px-3.5 pt-3 pb-3.5">
          {/* Name + Rating row — exactly like Swiggy */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-[17px] font-bold leading-tight text-[#1a1a2e]">
              {store.name}
            </h3>
            <span className="flex shrink-0 items-center gap-0.5 rounded-lg bg-[#1a8d3f] px-1.5 py-[3px] text-[13px] font-bold text-white">
              {store.rating.toFixed(1)}
              <Star
                className="h-[11px] w-[11px] fill-white text-white"
                strokeWidth={0}
              />
            </span>
          </div>

          {/* Subtitle — Swiggy shows cuisine · area */}
          <p className="mt-1 truncate text-[14px] text-[#686b78]">
            {catLabel} · {store.address}
          </p>

          {/* Thin divider */}
          <div className="mt-2.5 mb-2 h-px bg-[#f0f0f5]" />

          {/* Bank offer */}
          <div className="flex items-center gap-1.5">
            <svg
              width="15"
              height="15"
              viewBox="0 0 20 20"
              fill="none"
              className="shrink-0"
            >
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
            <p className="truncate text-[13px] font-medium text-[#686b78]">
              {offers.bank}
            </p>
          </div>
        </div>
      </Link>
    </m.div>
  );
}

/* ─── main shop row ────────────────────────────────────────────────────── */
export function SwiggyShopRow({
  stores,
  title = "Top shops near you",
}: {
  stores: Store[];
  title?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const realIds = stores
    .map((s) => s.id)
    .filter((id) => !id.startsWith("mock-"));
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

  if (!stores.length) return null;

  return (
    <section className="mt-8 px-5 md:px-8" aria-label={title}>
      {/* header row */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-extrabold text-[#1a1a2e] md:text-[24px]">
            {title}
          </h2>
          <div className="mt-0.5 h-[3px] w-8 rounded-full bg-[#981495]" />
        </div>
        <div className="flex items-center gap-2">
          <NavArrow
            dir="left"
            visible={canLeft}
            onClick={() => scroll("left")}
          />
          <NavArrow
            dir="right"
            visible={canRight}
            onClick={() => scroll("right")}
          />
        </div>
      </div>

      {/* scrollable row */}
      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
      >
        {stores.map((store, index) => {
          const liveStatus = statusQ.data?.get(store.id);
          return (
            <div key={store.id} className="snap-start">
              <SwiggyShopCard
                store={store}
                index={index}
                liveIsOpen={liveStatus?.isOpen}
              />
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
    id: "fresh",
    label: "Fresh Produce",
    imageUrl:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "bakery",
    label: "Bakery",
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    imageUrl:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "stationery",
    label: "Stationery",
    imageUrl:
      "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "snacks",
    label: "Snacks",
    imageUrl:
      "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "personal",
    label: "Personal Care",
    imageUrl:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "home",
    label: "Home Essentials",
    imageUrl:
      "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "electronics",
    label: "Electronics",
    imageUrl:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "fashion",
    label: "Fashion",
    imageUrl:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "kitchen",
    label: "Kitchen",
    imageUrl:
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "accessories",
    label: "Accessories",
    imageUrl:
      "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "footwear",
    label: "Footwear",
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "ready",
    label: "Ready to Cook",
    imageUrl:
      "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=200&q=80",
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
              <CategoryCircle
                key={cat.id}
                cat={cat}
                index={ROW1.length + i}
              />
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
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: index * 0.035,
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="shrink-0"
    >
      <Link
        to="/"
        search={{ category: cat.id, q: undefined }}
        className="group flex flex-col items-center gap-1.5"
      >
        <div className="h-[90px] w-[90px] overflow-hidden rounded-full bg-[#f0f0f5] transition-transform duration-200 group-hover:scale-105 md:h-[100px] md:w-[100px]">
          <img
            src={cat.imageUrl}
            alt={cat.label}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
        <span className="w-[90px] text-center text-[13px] font-semibold leading-tight text-[#1a1a2e]/80 md:w-[100px]">
          {cat.label}
        </span>
      </Link>
    </m.div>
  );
}
