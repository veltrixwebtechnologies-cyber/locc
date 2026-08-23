/**
 * Relatable, Seamless Hero Section for Local Shore Marketplace
 * Fits harmoniously with the App Shell header above and Marketplace Ad Strip below.
 */
import { useNavigate, Link } from "@tanstack/react-router";
import { m } from "motion/react";
import { ArrowRight, Sparkles, ShoppingBag, Truck, ShieldCheck } from "lucide-react";

interface ServiceCard {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  category: string;
  image: string;
  gradient: string;
}

const SERVICES: ServiceCard[] = [
  {
    id: "grocery",
    title: "Daily Grocery",
    subtitle: "Fresh produce & everyday staples",
    tag: "UP TO 50% OFF",
    category: "grocery",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80",
    gradient: "from-emerald-600/90 to-emerald-900/90",
  },
  {
    id: "pharmacy",
    title: "Pharmacy & Care",
    subtitle: "Medicines & wellness delivered fast",
    tag: "EXPRESS DELIVERY",
    category: "pharmacy",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80",
    gradient: "from-blue-600/90 to-indigo-900/90",
  },
  {
    id: "bakery",
    title: "Fresh Bakery",
    subtitle: "Artisanal breads, snacks & treats",
    tag: "BAKED TODAY",
    category: "bakery",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
    gradient: "from-amber-600/90 to-orange-900/90",
  },
  {
    id: "stationery",
    title: "Home & Tech",
    subtitle: "Stationery, utilities & essentials",
    tag: "LOCAL STORES",
    category: "stationery",
    image: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=400&q=80",
    gradient: "from-purple-600/90 to-[#981495]/90",
  },
];

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="px-5 pt-4 pb-4 md:px-8 md:pt-6 md:pb-6">
      {/* ── Main Ambient Hero Card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7d0d76] via-[#981495] to-[#4a0647] p-6 text-white shadow-xl md:p-8">
        {/* Subtle background glow circles */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-[#fde68a]/15 blur-3xl" />

        {/* Top Header info */}
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-[#fde68a]" />
              <span>Local Shore Marketplace</span>
            </div>
            <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl text-white">
              Everything you need, delivered from{" "}
              <span className="text-[#fde68a]">shops near you</span>
            </h1>
            <p className="mt-1.5 max-w-xl text-xs text-white/80 sm:text-sm">
              Support local merchants with instant 20–40 min doorstep delivery across your city.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-3 shrink-0 text-xs font-medium text-white/90">
            <div className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
              <Truck className="h-4 w-4 text-[#fde68a]" />
              <span>Fast Delivery</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-[#fde68a]" />
              <span>Verified Sellers</span>
            </div>
          </div>
        </div>

        {/* ── 4 Relatable Service Cards Grid ── */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 md:mt-8 md:gap-4">
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
              onClick={() =>
                navigate({
                  to: "/",
                  search: { category: item.category, q: undefined },
                })
              }
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:shadow-lg"
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
                  <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-gray-900 shadow-sm">
                    {item.tag}
                  </span>
                </div>

                {/* Bottom title & arrow */}
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <h3 className="font-display text-lg font-bold leading-tight text-white">
                      {item.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-white/80 line-clamp-1">
                      {item.subtitle}
                    </p>
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#981495] shadow-md transition-transform duration-300 group-hover:scale-110">
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
