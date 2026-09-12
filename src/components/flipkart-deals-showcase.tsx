import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { m } from "motion/react";
import { useState, useRef, useCallback } from "react";
import { SafeProductImage } from "@/lib/image-utils";
import type { MerchandisingProduct } from "@/lib/merchandising";
import { scrollToShops } from "@/lib/scroll-utils";

/* ─── 1. Flipkart Category Icons Configuration ────────────────────────── */
export type FlipkartCategory = {
  id: string;
  label: string;
  categoryParam?: string;
  iconUrl: string;
};

const FLIPKART_CATEGORIES: FlipkartCategory[] = [
  {
    id: "for-you",
    label: "For You",
    categoryParam: "all",
    iconUrl:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=120&q=80",
  },
  {
    id: "grocery",
    label: "Grocery",
    categoryParam: "grocery",
    iconUrl:
      "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=120&q=80",
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    categoryParam: "pharmacy",
    iconUrl:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=120&q=80",
  },
  {
    id: "bakery",
    label: "Fresh Bakery",
    categoryParam: "bakery",
    iconUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=120&q=80",
  },
  {
    id: "electronics",
    label: "Electronics",
    categoryParam: "electronics",
    iconUrl:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=120&q=80",
  },
  {
    id: "home",
    label: "Home & Furniture",
    categoryParam: "home",
    iconUrl:
      "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=120&q=80",
  },
  {
    id: "beauty",
    label: "Beauty & Personal",
    categoryParam: "personal",
    iconUrl:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=120&q=80",
  },
  {
    id: "toys",
    label: "Toys, Baby Care",
    categoryParam: "stationery",
    iconUrl:
      "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=120&q=80",
  },
  {
    id: "stationery",
    label: "Books & Tech",
    categoryParam: "stationery",
    iconUrl:
      "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=120&q=80",
  },
];

/* ─── 2. Top Flipkart Category Strip ─────────────────────────────────── */
export function FlipkartCategoryStrip({ activeCategory }: { activeCategory?: string }) {
  return (
    <div className="w-full border-b border-slate-200 bg-white shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:justify-between md:gap-4 md:px-8">
        {FLIPKART_CATEGORIES.map((cat) => {
          const isActive =
            !activeCategory || activeCategory === "all"
              ? cat.id === "for-you"
              : cat.categoryParam === activeCategory.toLowerCase();

          return (
            <Link
              key={cat.id}
              to="/"
              search={{ category: cat.categoryParam, q: undefined }}
              onClick={scrollToShops}
              className="group relative flex shrink-0 flex-col items-center justify-center gap-1.5 px-3 py-1 transition-all"
            >
              <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-slate-100 transition-transform duration-200 group-hover:scale-105 md:h-14 md:w-14">
                <img
                  src={cat.iconUrl}
                  alt={cat.label}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              </div>
              <span
                className={`text-[12px] font-bold tracking-tight transition-colors ${
                  isActive ? "text-blue-600" : "text-slate-700 group-hover:text-blue-600"
                }`}
              >
                {cat.label}
              </span>
              {/* Active Tab Blue Underline */}
              {isActive && (
                <m.div
                  layoutId="flipkart-active-tab"
                  className="absolute bottom-0 h-[3px] w-full rounded-full bg-blue-600"
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ─── 3. Flipkart Banner Cards Row (Custom Local Shop Ads - Light Theme) ─────── */
export function FlipkartBannerRow() {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      shopName: "Sagar Medicals",
      title: "24/7 Wellness & OTC Care",
      subtitle: "Medicines, healthcare & personal wellness",
      tag: "Flat 15% OFF",
      image:
        "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=600&q=80",
      category: "pharmacy",
    },
    {
      shopName: "Coastline Bakes",
      title: "Fresh Wood-Fired Breads",
      subtitle: "Artisanal cakes, cookies & daily treats",
      tag: "Fresh at 6 AM",
      image:
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
      category: "bakery",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 pt-4 md:px-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 items-stretch">
        {/* Banner 1: Left - Anand Kirana Store Ad */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FBF4BE] via-amber-100/60 to-[#F3D053]/40 p-5 text-slate-900 shadow-sm md:col-span-4 flex flex-col justify-between h-full min-h-[220px] border border-[#D4AF37]/40">
          <div className="relative z-10">
            <span className="inline-block rounded-full bg-gold-gradient px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-950 border border-white/40 shadow-xs">
              Anand Kirana Store
            </span>
            <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              Fresh Daily Ration
            </h3>
            <p className="mt-0.5 text-base font-black text-[#945700]">Up to 30% OFF</p>
            <p className="mt-1 text-[11px] font-bold text-slate-800">
              Since 1978 · Instant 20 min delivery
            </p>
          </div>

          <Link
            to="/"
            search={{ category: "grocery", q: undefined }}
            onClick={() => {
              setTimeout(() => {
                const el = document.getElementById("shops-section");
                if (el) {
                  const yOffset = -90;
                  const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
                  window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
                }
              }, 80);
            }}
            className="relative z-10 mt-4 inline-flex items-center gap-1.5 self-start rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 shadow-sm"
          >
            Shop Grocery <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80"
            alt="Anand Kirana Store Produce"
            className="absolute bottom-1 right-1 h-32 w-32 object-cover rounded-xl shadow-md transition-transform duration-300 hover:scale-105 opacity-90"
          />
        </div>

        {/* Banner 2: Center Hero Carousel - Sagar Medicals & Coastline Bakes */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 text-white shadow-md md:col-span-5 flex flex-col justify-between h-full min-h-[220px] border border-teal-500/30">
          <div className="p-5 relative z-10">
            <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-teal-50 border border-white/30 backdrop-blur-md">
              {slides[activeSlide]?.shopName}
            </span>
            <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
              {slides[activeSlide]?.title}
            </h3>
            <p className="mt-1 text-xs font-medium text-teal-100">
              {slides[activeSlide]?.subtitle}
            </p>
            <span className="mt-3 inline-block rounded-lg bg-gold-gradient px-3 py-1 text-xs font-black text-slate-950 shadow-xs border border-white/40">
              {slides[activeSlide]?.tag}
            </span>
          </div>

          <img
            src={slides[activeSlide]?.image}
            alt={slides[activeSlide]?.shopName}
            className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-overlay"
          />

          {/* Carousel navigation & dots */}
          <div className="relative z-10 flex items-center justify-between p-5 pt-0">
            <Link
              to="/"
              search={{ category: slides[activeSlide]?.category, q: undefined }}
              onClick={() => {
                setTimeout(() => {
                  const el = document.getElementById("shops-section");
                  if (el) {
                    const yOffset = -90;
                    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
                  }
                }, 80);
              }}
              className="rounded-lg bg-white px-3.5 py-1.5 text-xs font-extrabold text-teal-950 transition hover:bg-slate-100 shadow-sm"
            >
              Explore Shop Offers
            </Link>

            <div className="flex items-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveSlide(i)}
                  className={`h-2 rounded-full transition-all ${
                    activeSlide === i ? "w-6 bg-white" : "w-2 bg-white/40"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Banner 3: Right - Kavya Book & Stationery Ad */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-5 text-white shadow-md md:col-span-3 flex flex-col justify-between h-full min-h-[220px] border border-purple-500/30">
          <div className="relative z-10">
            <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-purple-100 border border-white/30 backdrop-blur-md">
              Kavya Stationery
            </span>
            <h3 className="mt-2 text-lg font-black text-white sm:text-xl">School & Art Supplies</h3>
            <p className="mt-0.5 text-sm font-black text-[#F3D053]">Starting ₹49</p>
            <p className="mt-1 text-[11px] text-purple-100 font-medium">
              Classroom packs & craft kits
            </p>
          </div>

          <Link
            to="/"
            search={{ category: "stationery", q: undefined }}
            onClick={() => {
              setTimeout(() => {
                const el = document.getElementById("shops-section");
                if (el) {
                  const yOffset = -90;
                  const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
                  window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
                }
              }, 80);
            }}
            className="relative z-10 mt-4 inline-flex items-center gap-1.5 self-start rounded-xl bg-white px-3.5 py-2 text-xs font-extrabold text-purple-950 transition hover:bg-slate-100 shadow-sm"
          >
            Order Supplies <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── 4. Flipkart Signature "Best Deals on..." Container ────────────── */
export function FlipkartBestDealsShowcase({
  products = [],
  title = "Best Deals on Local Shore",
}: {
  products?: MerchandisingProduct[];
  title?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fallback items with real local product IDs
  const displayItems =
    products.length > 0
      ? products.slice(0, 8)
      : [
          {
            id: "s1-p0",
            name: "Sona Masoori Rice 5kg",
            deal: "Special Deal: 20% Off",
            imageUrl:
              "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
            selling_price: 420,
            mrp: 525,
          },
          {
            id: "s1-p2",
            name: "Cold-pressed Coconut Oil",
            deal: "Min. 15% Off",
            imageUrl:
              "https://images.unsplash.com/photo-1590332763361-c73dc0e0dd8b?auto=format&fit=crop&w=400&q=80",
            selling_price: 280,
            mrp: 350,
          },
          {
            id: "s3-p0",
            name: "Artisan Sourdough Loaf",
            deal: "Bakery Fresh",
            imageUrl:
              "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
            selling_price: 180,
            mrp: 220,
          },
          {
            id: "s4-p0",
            name: "A4 Ruled Notebook (200 pgs)",
            deal: "Best Seller",
            imageUrl:
              "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=400&q=80",
            selling_price: 85,
            mrp: 110,
          },
        ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-4 md:px-8">
      {/* Signature Light Luxury Card Container matching website footer grid */}
      <div className="rounded-3xl border border-purple-200/80 bg-gradient-to-br from-purple-50/70 via-slate-50 to-purple-50/40 p-5 sm:p-6 shadow-xs text-slate-900">
        {/* Header with Title + Arrow Button */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-6 w-1.5 rounded-full bg-purple-600" />
            <h2 className="text-xl font-black text-slate-900 md:text-2xl tracking-tight">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("shops-section");
              if (el) {
                const y = el.getBoundingClientRect().top + window.pageYOffset - 90;
                window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
              }
            }}
            className="grid h-9 w-9 place-items-center rounded-full bg-white border border-slate-200 text-purple-700 shadow-xs transition hover:bg-purple-600 hover:text-white hover:scale-105"
            aria-label="View all deals"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Product Cards Row */}
        <div ref={scrollRef} className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
          {displayItems.map((item: any) => {
            const price = item.selling_price ?? item.price ?? 0;
            const mrp = item.mrp ?? (price ? Math.round(price * 1.25) : 0);
            const dealTag =
              item.deal ??
              (mrp && price ? `${Math.round(((mrp - price) / mrp) * 100)}% OFF` : "Best Deal");

            return (
              <m.div
                key={item.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#ead9a8] bg-white p-3.5 shadow-xs transition hover:border-[#d9bd70] hover:shadow-md"
              >
                <Link
                  to="/product/$productId"
                  params={{ productId: item.id }}
                  className="flex flex-col h-full"
                >
                  {/* Image container */}
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-50 p-2 flex items-center justify-center border border-[#ead9a8]/40">
                    <SafeProductImage
                      src={item.imageUrl ?? item.image_url}
                      productName={item.name}
                      category={item.category}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Body info */}
                  <div className="mt-3 flex flex-col justify-between flex-1">
                    <h3 className="line-clamp-1 text-sm font-bold text-slate-800 group-hover:text-purple-700 transition-colors">
                      {item.name}
                    </h3>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-sm font-black text-slate-900">₹{price}</span>
                      {mrp > price && (
                        <span className="text-[11px] font-medium text-slate-400 line-through">
                          ₹{mrp}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs font-black text-purple-700">{dealTag}</p>
                  </div>
                </Link>
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
