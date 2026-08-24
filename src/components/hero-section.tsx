/**
 * Relatable, Seamless Hero Section for Local Shore Marketplace
 * Fits harmoniously with the App Shell header above and Marketplace Ad Strip below.
 */
import { useNavigate } from "@tanstack/react-router";
import { m } from "motion/react";
import { ArrowRight, Sparkles, Truck, ShieldCheck } from "lucide-react";
import { scrollToShops } from "@/lib/scroll-utils";

interface ServiceCard {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  tagBg: string;
  tagTextColor: string;
  category: string;
  image: string;
  gradient: string;
  borderColor: string;
  iconBg: string;
}

const SERVICES: ServiceCard[] = [
  {
    id: "grocery",
    title: "Daily Grocery",
    subtitle: "Fresh produce & everyday staples",
    tag: "UP TO 50% OFF",
    tagBg: "bg-emerald-400",
    tagTextColor: "text-emerald-950",
    category: "grocery",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80",
    gradient: "from-emerald-700/95 via-teal-800/85 to-slate-950/95",
    borderColor: "border-emerald-400/25 hover:border-emerald-400/60 hover:shadow-emerald-950/50",
    iconBg: "bg-emerald-400 text-emerald-950",
  },
  {
    id: "pharmacy",
    title: "Pharmacy & Care",
    subtitle: "Medicines & wellness delivered fast",
    tag: "EXPRESS DELIVERY",
    tagBg: "bg-sky-400",
    tagTextColor: "text-sky-950",
    category: "pharmacy",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80",
    gradient: "from-sky-700/95 via-blue-800/85 to-slate-950/95",
    borderColor: "border-sky-400/25 hover:border-sky-400/60 hover:shadow-sky-950/50",
    iconBg: "bg-sky-400 text-sky-950",
  },
  {
    id: "bakery",
    title: "Fresh Bakery",
    subtitle: "Artisanal breads, snacks & treats",
    tag: "BAKED TODAY",
    tagBg: "bg-amber-400",
    tagTextColor: "text-amber-950",
    category: "bakery",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
    gradient: "from-amber-700/95 via-orange-800/85 to-slate-950/95",
    borderColor: "border-amber-400/25 hover:border-amber-400/60 hover:shadow-amber-950/50",
    iconBg: "bg-amber-400 text-amber-950",
  },
  {
    id: "stationery",
    title: "Home & Tech",
    subtitle: "Stationery, utilities & essentials",
    tag: "LOCAL STORES",
    tagBg: "bg-violet-400",
    tagTextColor: "text-violet-950",
    category: "stationery",
    image: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=400&q=80",
    gradient: "from-violet-700/95 via-indigo-800/85 to-slate-950/95",
    borderColor: "border-violet-400/25 hover:border-violet-400/60 hover:shadow-violet-950/50",
    iconBg: "bg-violet-400 text-violet-950",
  },
];

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-7xl px-4 pt-4 pb-2 md:px-8 md:pt-6">
      {/* ── Main Ambient Hero Card (Light Modern Theme) ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-50/80 via-white to-amber-50/60 p-6 text-slate-900 shadow-xs border border-purple-100 md:p-8">
        {/* Subtle background ambient glows */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-purple-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />

        {/* Top Header info */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-100/80 px-3 py-1 text-xs font-bold text-purple-900">
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              <span>Local Shore Marketplace</span>
            </div>
            <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl text-slate-900">
              Everything you need, delivered from{" "}
              <span className="bg-gradient-to-r from-purple-700 via-pink-600 to-amber-600 bg-clip-text text-transparent">
                shops near you
              </span>
            </h1>
            <p className="mt-1.5 max-w-xl text-xs text-slate-600 sm:text-sm font-medium">
              Support local merchants with instant 20–40 min doorstep delivery across your city.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-3 shrink-0 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 shadow-xs">
              <Truck className="h-4 w-4 text-emerald-600" />
              <span>Fast Delivery</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 shadow-xs">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              <span>Verified Sellers</span>
            </div>
          </div>
        </div>

        {/* ── 4 Relatable Service Cards Grid ── */}
        <div className="relative z-10 mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 md:mt-8 md:gap-4">
          {SERVICES.map((item, index) => (
            <m.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: index * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -4, scale: 1.02 }}
              onClick={() => {
                navigate({
                  to: "/",
                  search: { category: item.category, q: undefined },
                });
                scrollToShops();
              }}
              className="group relative cursor-pointer overflow-hidden rounded-2xl p-4 shadow-sm border border-slate-200/80 transition-all duration-300 hover:shadow-md"
            >
              {/* Background card image with gradient overlay */}
              <div className="absolute inset-0 z-0 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${item.gradient}`} />
              </div>

              {/* Card content */}
              <div className="relative z-10 flex h-full min-h-[140px] flex-col justify-between">
                {/* Top tag */}
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-sm ${item.tagBg} ${item.tagTextColor}`}>
                    {item.tag}
                  </span>
                </div>

                {/* Bottom title & arrow */}
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <h3 className="font-display text-lg font-bold leading-tight text-white drop-shadow-sm">
                      {item.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-100/90 line-clamp-1 font-medium">
                      {item.subtitle}
                    </p>
                  </div>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-lg transition-transform duration-300 group-hover:scale-110 ${item.iconBg}`}>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}

