import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ChevronRight, Plane, Globe, MapPin, Calendar, Sparkles, ExternalLink, Star } from "lucide-react";
import { m } from "motion/react";
import { TRAVEL_OPPORTUNITIES, type TravelOpportunity } from "@/lib/platform-data";

export const Route = createFileRoute("/explore")({ component: ExplorePage });

const typeLabel: Record<TravelOpportunity["type"], { label: string; color: string }> = {
  culture: { label: "Culture & Heritage", color: "bg-amber-100 text-amber-800" },
  retail: { label: "Retail & Shopping", color: "bg-purple-100 text-purple-800" },
  business: { label: "Business & Trade", color: "bg-blue-100 text-blue-800" },
  food: { label: "Food & Markets", color: "bg-orange-100 text-orange-800" },
  tech: { label: "Tech & Innovation", color: "bg-cyan-100 text-cyan-800" },
};

function ExplorePage() {
  const [filter, setFilter] = useState<"all" | TravelOpportunity["type"]>("all");
  const types: ("all" | TravelOpportunity["type"])[] = ["all", "culture", "retail", "business", "food", "tech"];

  const filtered = filter === "all"
    ? TRAVEL_OPPORTUNITIES
    : TRAVEL_OPPORTUNITIES.filter((t) => t.type === filter);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 pb-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" search={{ category: undefined, q: undefined }} className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-foreground">Explore</span>
        </div>

        {/* Hero */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-800 via-blue-900 to-indigo-900 p-6 text-white shadow-xl sm:p-8"
        >
          <div className="absolute top-0 right-0 w-48 h-48 opacity-10 text-8xl flex items-center justify-center">✈️</div>
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-sky-300" />
              <span className="text-xs font-bold uppercase tracking-widest text-sky-200">LocalShore Explore</span>
            </div>
            <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
              International travel with LocalShore
            </h1>
            <p className="mt-2 max-w-xl text-sm text-sky-200">
              Explore the world's best local shopping cultures, markets, and retail experiences. Curated travel opportunities from our travel partners.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm">
                🌏 5 Destinations
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm">
                ✈️ Partner Travel Agencies
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm">
                🪙 Earn Shore Points
              </span>
            </div>
          </div>
        </m.div>

        {/* Filters */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold capitalize transition ${
                filter === t ? "bg-purple-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-purple-50"
              }`}
            >
              {t === "all" ? "All Destinations" : typeLabel[t].label}
            </button>
          ))}
        </div>

        {/* Destination Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((dest, i) => (
            <m.div
              key={dest.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`group overflow-hidden rounded-2xl border bg-white shadow-xs transition hover:shadow-md ${
                dest.available ? "border-slate-200" : "border-dashed border-slate-300 opacity-70"
              }`}
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={dest.imageUrl}
                  alt={dest.destination}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{dest.flag}</span>
                    <div>
                      <p className="text-lg font-extrabold text-white">{dest.destination}</p>
                      <p className="text-xs text-white/80">{dest.country}</p>
                    </div>
                  </div>
                </div>
                {dest.sponsored && (
                  <span className="absolute top-2 right-2 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-bold text-slate-900">
                    Sponsored
                  </span>
                )}
                {!dest.available && (
                  <span className="absolute top-2 left-2 rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-white">
                    Coming Soon
                  </span>
                )}
              </div>
              <div className="p-4">
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${typeLabel[dest.type].color}`}>
                  {typeLabel[dest.type].label}
                </span>
                <p className="mt-2 text-sm font-semibold text-slate-900">{dest.tagline}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Starting from</p>
                    <p className="text-sm font-bold text-slate-900">{dest.priceRange}</p>
                  </div>
                  {dest.available ? (
                    <button className="rounded-xl bg-purple-700 px-4 py-2 text-xs font-bold text-white hover:bg-purple-800 transition flex items-center gap-1">
                      Explore <ExternalLink className="h-3 w-3" />
                    </button>
                  ) : (
                    <button className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
                      Notify Me
                    </button>
                  )}
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  via {dest.partner}
                </p>
              </div>
            </m.div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 rounded-2xl border border-purple-200 bg-purple-50 p-6 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-purple-600" />
          <h3 className="mt-2 font-display text-lg font-bold text-purple-900">Earn Shore Points on travel!</h3>
          <p className="mt-1 text-sm text-purple-700">Book through LocalShore Explore and earn up to 5x Shore Points on your travel bookings.</p>
          <Link
            to="/rewards"
            className="mt-4 inline-flex items-center gap-1 rounded-xl bg-purple-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-800"
          >
            <Star className="h-3.5 w-3.5" /> View Your Rewards
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
