import { Link } from "@tanstack/react-router";
import { m } from "motion/react";
import {
  Trophy,
  Sparkles,
  Gift,
  MapPin,
  Plane,
  Newspaper,
  ChevronRight,
  BadgeCheck,
  ShoppingBag,
  Star,
  ArrowRight,
  Zap,
} from "lucide-react";
import { BRANDS, BEST_SHOPS, CITIES, NEWS_ARTICLES } from "@/lib/platform-data";
import { USER_REWARDS } from "@/lib/rewards-data";

export function EcosystemMerchandisingStrips() {
  const featuredBrands = BRANDS.filter((b) => b.featured).slice(0, 4);
  const topShops = BEST_SHOPS.slice(0, 3);
  const recentArticles = NEWS_ARTICLES.slice(0, 2);
  const activeCitiesCount = CITIES.filter((c) => c.status === "active").length;

  return (
    <div className="space-y-8 py-6">
      {/* 1. Rewards & Loyalty Hero Banner */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 p-6 text-white shadow-xl border border-purple-200/50"
      >
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-[#F3D053] backdrop-blur-sm border border-white/20">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-gold-gradient px-2.5 py-0.5 text-[10px] font-black uppercase text-slate-950 shadow-xs border border-white/30">
                  {USER_REWARDS.tier} Member
                </span>
                <span className="text-xs text-purple-200">LocalShore Club</span>
              </div>
              <h3 className="mt-1 font-display text-xl font-bold">
                You have {USER_REWARDS.pointsBalance.toLocaleString()} Rewards Points!
              </h3>
              <p className="mt-0.5 text-xs text-purple-200">
                Redeem for ₹{USER_REWARDS.cashbackEquivalent} instant cashback, free delivery, or
                brand vouchers.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/rewards"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gold-gradient px-4 py-2.5 text-xs font-black text-slate-950 shadow-md transition hover:scale-105 active:scale-95 border border-white/30"
            >
              <Sparkles className="h-4 w-4" /> Redeem Points
            </Link>
            <Link
              to="/gift-cards"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <Gift className="h-4 w-4" /> Gift Cards
            </Link>
          </div>
        </div>
      </m.div>

      {/* 2. Direct Brand Stores Merchandising Strip */}
      <section>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4 text-purple-600" />
              <h2 className="font-display text-lg font-bold text-slate-900">
                Official Brand Stores
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Authentic products shipped directly from verified brand hubs
            </p>
          </div>
          <Link
            to="/brands"
            className="flex items-center gap-1 text-xs font-bold text-purple-700 hover:underline"
          >
            View all brands <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {featuredBrands.map((brand) => (
            <Link
              key={brand.id}
              to="/brand/$brandId"
              params={{ brandId: brand.id }}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-xs transition hover:border-purple-300 hover:shadow-md"
            >
              <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={brand.coverUrl}
                  alt={brand.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-900">{brand.name}</span>
                    {brand.verified && <BadgeCheck className="h-3.5 w-3.5 text-blue-500" />}
                  </div>
                  <p className="text-[10px] text-slate-400">{brand.category}</p>
                </div>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                  {brand.productCount}+
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Best Shops & Best Sellers Strip */}
      <section className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-[#FBF4BE]/40 via-amber-50/40 to-orange-50/30 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gold-gradient text-slate-900 font-black text-sm shadow-xs">
              🏆
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Best of LocalShore
              </h2>
              <p className="text-xs text-slate-500">Highest rated shops & top customer choices</p>
            </div>
          </div>
          <Link
            to="/best-shops"
            className="flex items-center gap-1 rounded-xl bg-gold-gradient px-3.5 py-1.5 text-xs font-black text-slate-950 transition hover:scale-105 shadow-xs border border-white/40"
          >
            Explore Leaderboard <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {topShops.map((shop, i) => (
            <Link
              key={shop.shopId}
              to="/store/$storeId"
              params={{ storeId: shop.shopId }}
              className="group flex items-center gap-3 rounded-2xl bg-white p-3 shadow-xs border border-slate-200 transition hover:shadow-md"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={shop.imageUrl}
                  alt={shop.shopName}
                  className="h-full w-full object-cover"
                />
                <span className="absolute top-1 left-1 rounded-md bg-slate-900/80 px-1 py-0.2 text-[9px] font-bold text-white">
                  #{i + 1}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900">{shop.shopName}</p>
                <p className="text-[10px] text-slate-500">{shop.category}</p>
                <div className="mt-1 flex items-center gap-2 text-[10px]">
                  <span className="flex items-center gap-0.5 font-bold text-emerald-700">
                    <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" /> {shop.rating}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500">{shop.avgDeliveryMins} min delivery</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Travel & Explore + News Dual Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Travel Banner */}
        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900 via-emerald-900 to-slate-900 p-5 text-white shadow-md">
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300 uppercase tracking-wider">
            <Plane className="h-4 w-4" /> Travel Opportunities
          </div>
          <h3 className="mt-2 font-display text-lg font-extrabold">
            Shop local around the globe with LocalShore Explore
          </h3>
          <p className="mt-1 text-xs text-teal-100 leading-relaxed">
            Duty-free perks, international local discovery, and exclusive shopping experiences in
            Dubai, Singapore & London.
          </p>
          <div className="mt-4">
            <Link
              to="/explore"
              className="inline-flex items-center gap-1 rounded-xl bg-teal-400 px-3.5 py-2 text-xs font-extrabold text-slate-900 transition hover:bg-teal-300"
            >
              Explore Destinations <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Cities & News Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Newspaper className="h-4 w-4 text-purple-600" />
                <h3 className="font-display text-base font-bold text-slate-900">
                  LocalShore Stories
                </h3>
              </div>
              <Link to="/news" className="text-xs font-bold text-purple-700 hover:underline">
                Read all
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {recentArticles.map((article) => (
                <div key={article.id} className="flex items-start gap-2.5">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-800">{article.title}</p>
                    <p className="text-[10px] text-slate-400">
                      {article.readingTime} min read · {article.author}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl bg-emerald-50 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-950">
                Delivering to {activeCitiesCount} active cities in South India
              </span>
            </div>
            <Link
              to="/cities"
              className="text-xs font-extrabold text-emerald-800 hover:underline shrink-0"
            >
              View Cities →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
