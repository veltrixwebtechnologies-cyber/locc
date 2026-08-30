import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ChevronRight, BadgeCheck, Search, ArrowRight, Sparkles, ShoppingBag, Star } from "lucide-react";
import { m } from "motion/react";
import { BRANDS } from "@/lib/platform-data";

export const Route = createFileRoute("/brands")({ component: BrandsPage });

function BrandsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "featured">("all");

  const filtered = BRANDS.filter((b) => {
    const matchSearch = !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filter === "all" || (filter === "featured" && b.featured);
    return matchSearch && matchFilter;
  });

  const featuredBrands = BRANDS.filter((b) => b.featured);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 pb-12">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" search={{ category: undefined, q: undefined }} className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-foreground">Brand Stores</span>
        </div>

        {/* Hero */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900 p-6 text-white shadow-xl sm:p-8"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-purple-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-purple-300">LocalShore Brand Stores</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
            Shop directly from brands you love
          </h1>
          <p className="mt-2 max-w-lg text-sm text-slate-300">
            Authentic products from verified brands, delivered with LocalShore's local delivery speed.
          </p>

          {/* Search */}
          <div className="mt-4 flex max-w-lg items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
            <Search className="h-4 w-4 text-purple-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search brands..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-purple-300"
            />
          </div>
        </m.div>

        {/* Featured Brands Banner */}
        {filter !== "featured" && featuredBrands.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" /> Featured Brands
            </h2>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
              {featuredBrands.map((brand) => (
                <Link
                  key={brand.id}
                  to="/brand/$brandId"
                  params={{ brandId: brand.id }}
                  className="group shrink-0 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md hover:border-purple-300"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img src={brand.coverUrl} alt={brand.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-slate-900">{brand.name}</p>
                      {brand.verified && <BadgeCheck className="h-3.5 w-3.5 text-blue-500 fill-blue-100" />}
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-500">{brand.productCount} products</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <div className="mt-6 flex gap-2">
          {(["all", "featured"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-xs font-bold capitalize transition ${
                filter === f ? "bg-purple-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-purple-50"
              }`}
            >
              {f === "all" ? "All Brands" : "Featured"}
            </button>
          ))}
        </div>

        {/* All Brands Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((brand, i) => (
            <m.div
              key={brand.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to="/brand/$brandId"
                params={{ brandId: brand.id }}
                className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md hover:border-purple-300"
              >
                <div className="relative aspect-[2/1] overflow-hidden">
                  <img src={brand.coverUrl} alt={brand.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-lg font-extrabold text-white">{brand.name}</h3>
                        {brand.verified && <BadgeCheck className="h-4 w-4 text-sky-300 fill-sky-100" />}
                      </div>
                      <p className="text-xs text-white/70">{brand.tagline}</p>
                    </div>
                    {brand.featured && (
                      <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black text-slate-900">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">{brand.category}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{brand.productCount} products</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 group-hover:bg-purple-700 group-hover:text-white transition">
                      Visit Store <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </Link>
            </m.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500">No brands match your search.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
