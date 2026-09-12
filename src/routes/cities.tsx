import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ChevronRight, MapPin, Bell, CheckCircle2, Clock } from "lucide-react";
import { m } from "motion/react";
import { CITIES } from "@/lib/platform-data";

export const Route = createFileRoute("/cities")({ component: CitiesPage });

function CitiesPage() {
  const [filter, setFilter] = useState<"all" | "active" | "coming_soon">("all");

  const activeCities = CITIES.filter((c) => c.status === "active");
  const comingSoon = CITIES.filter((c) => c.status === "coming_soon");
  const totalShops = activeCities.reduce((sum, c) => sum + (c.shopCount ?? 0), 0);

  const filtered = filter === "all" ? CITIES : CITIES.filter((c) => c.status === filter);

  // Group by region
  const regions = [...new Set(filtered.map((c) => c.region))];

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
          <span className="font-semibold text-foreground">Cities We Deliver</span>
        </div>

        {/* Hero */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-3xl bg-gradient-to-br from-teal-700 via-emerald-700 to-green-800 p-6 text-white shadow-xl sm:p-8"
        >
          <MapPin className="h-8 w-8 text-emerald-300" />
          <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
            Cities we deliver
          </h1>
          <p className="mt-2 text-sm text-emerald-100">
            LocalShore is growing across South India. Here's where you can shop local, delivered
            fast.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm">
              🏙️ {activeCities.length} active cities
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm">
              🏪 {totalShops.toLocaleString()}+ partner shops
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm">
              🚀 {comingSoon.length} coming soon
            </span>
          </div>
        </m.div>

        {/* Filters */}
        <div className="mt-6 flex gap-2">
          {(["all", "active", "coming_soon"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                filter === f
                  ? "bg-purple-700 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-purple-50"
              }`}
            >
              {f === "all" ? "All Cities" : f === "active" ? "Active" : "Coming Soon"}
            </button>
          ))}
        </div>

        {/* City Grid by Region */}
        {regions.map((region) => {
          const regionCities = filtered.filter((c) => c.region === region);
          return (
            <section key={region} className="mt-6">
              <h2 className="text-sm font-bold text-slate-900">{region}</h2>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {regionCities.map((city, i) => (
                  <m.div
                    key={city.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`overflow-hidden rounded-2xl border bg-white shadow-xs transition hover:shadow-md ${
                      city.status === "active"
                        ? "border-slate-200"
                        : "border-dashed border-slate-300"
                    }`}
                  >
                    <div className="relative aspect-[2/1] overflow-hidden">
                      <img
                        src={city.imageUrl}
                        alt={city.name}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <h3 className="text-lg font-extrabold text-white">{city.name}</h3>
                        <p className="text-xs text-white/70">{city.state}</p>
                      </div>
                      <span
                        className={`absolute top-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          city.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {city.status === "active" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {city.status === "active" ? "Active" : "Coming Soon"}
                      </span>
                    </div>
                    <div className="p-4">
                      {city.status === "active" ? (
                        <>
                          <p className="text-xs text-slate-600">
                            <strong>{city.shopCount?.toLocaleString()}</strong> shops available
                          </p>
                          {city.popularCategories && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {city.popularCategories.map((cat) => (
                                <span
                                  key={cat}
                                  className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                                >
                                  {cat}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <button className="mt-1 flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 transition w-full justify-center">
                          <Bell className="h-3.5 w-3.5" /> Notify me when available
                        </button>
                      )}
                    </div>
                  </m.div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
