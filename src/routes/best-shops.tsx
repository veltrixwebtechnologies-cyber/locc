import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  ChevronRight,
  Trophy,
  Star,
  MapPin,
  Clock,
  Users,
  TrendingUp,
  Zap,
  Heart,
  ShoppingBag,
} from "lucide-react";
import { m } from "motion/react";
import { BEST_SHOPS, BEST_SELLERS, type ShopMetrics } from "@/lib/platform-data";

export const Route = createFileRoute("/best-shops")({ component: BestShopsPage });

const badgeColor: Record<ShopMetrics["badge"], string> = {
  top_rated: "bg-amber-100 text-amber-800",
  rising_star: "bg-purple-100 text-purple-800",
  most_loved: "bg-rose-100 text-rose-800",
  fastest: "bg-sky-100 text-sky-800",
  best_value: "bg-emerald-100 text-emerald-800",
};

function BestShopsPage() {
  const [tab, setTab] = useState<"shops" | "sellers">("shops");

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 pb-12">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            to="/"
            search={{ category: undefined, q: undefined }}
            className="hover:text-primary"
          >
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-foreground">Best Shops</span>
        </div>

        {/* Hero */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-3xl bg-gradient-to-br from-amber-600 via-orange-600 to-rose-600 p-6 text-white shadow-xl sm:p-8"
        >
          <Trophy className="h-8 w-8 text-amber-200" />
          <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
            Best of LocalShore
          </h1>
          <p className="mt-2 max-w-lg text-sm text-amber-100">
            Discover the highest-rated shops and bestselling products near you. Rankings are based
            on ratings, delivery speed, and customer satisfaction.
          </p>
        </m.div>

        {/* Tabs */}
        <div className="mt-6 flex gap-2">
          {[
            { id: "shops" as const, label: "Best Shops", icon: Trophy },
            { id: "sellers" as const, label: "Best Sellers", icon: ShoppingBag },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                tab === t.id ? "bg-purple-700 text-white" : "text-slate-600 hover:bg-purple-50"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "shops" ? (
          <div className="mt-6 space-y-4">
            {BEST_SHOPS.map((shop, i) => (
              <m.div
                key={shop.shopId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="relative aspect-[16/10] sm:aspect-auto sm:w-48 shrink-0 overflow-hidden">
                    <img
                      src={shop.imageUrl}
                      alt={shop.shopName}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 text-white text-[11px] font-bold backdrop-blur-sm">
                        #{i + 1}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 p-4 sm:p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${badgeColor[shop.badge]}`}
                        >
                          {shop.badgeLabel}
                        </span>
                        <h3 className="mt-1.5 text-base font-bold text-slate-900">
                          {shop.shopName}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500">{shop.category}</p>
                      </div>
                      <div className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1">
                        <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
                        <span className="text-sm font-bold text-emerald-800">{shop.rating}</span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        {
                          label: "Orders",
                          value: shop.totalOrders.toLocaleString(),
                          icon: ShoppingBag,
                        },
                        { label: "Repeat Rate", value: `${shop.repeatCustomerRate}%`, icon: Users },
                        {
                          label: "Avg Delivery",
                          value: `${shop.avgDeliveryMins} min`,
                          icon: Clock,
                        },
                        { label: "Satisfaction", value: `${shop.satisfactionScore}%`, icon: Heart },
                      ].map((s) => (
                        <div key={s.label} className="rounded-xl bg-slate-50 p-2 text-center">
                          <p className="text-xs font-bold text-slate-900">{s.value}</p>
                          <p className="text-[10px] text-slate-500">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" /> {shop.distanceKm} km away
                        <span className="text-slate-300">·</span>
                        <TrendingUp className="h-3 w-3" /> Popular: {shop.popularProduct}
                      </div>
                      <Link
                        to="/store/$storeId"
                        params={{ storeId: shop.shopId }}
                        className="rounded-xl bg-purple-700 px-4 py-2 text-xs font-bold text-white hover:bg-purple-800 transition"
                      >
                        Visit Shop →
                      </Link>
                    </div>
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {BEST_SELLERS.map((item, i) => (
              <m.div
                key={item.productId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {item.trending && (
                    <span className="absolute top-2 left-2 rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-bold text-white flex items-center gap-0.5">
                      <Zap className="h-2.5 w-2.5" /> Trending
                    </span>
                  )}
                  <span className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-800 backdrop-blur-sm">
                    {item.soldCount.toLocaleString()} sold
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold text-slate-900 line-clamp-2">{item.name}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{item.shopName}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-slate-900">₹{item.price}</span>
                    <span className="text-[10px] text-slate-400">{item.category}</span>
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
