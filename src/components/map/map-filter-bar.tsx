import { useState } from "react";
import { SlidersHorizontal, MapPin, Star, Clock, CheckCircle2, Truck, ShoppingBag, X } from "lucide-react";
import type { MapFilterOptions } from "@/lib/map-service/types";
import { deliveryCategories, type StoreCategory, categoryLabel } from "@/lib/mock-data";

interface Props {
  filters: MapFilterOptions;
  onChange: (updated: MapFilterOptions) => void;
  onClear: () => void;
}

export function MapFilterBar({ filters, onChange, onClear }: Props) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const distances = [
    { label: "1 km", value: 1 },
    { label: "3 km", value: 3 },
    { label: "5 km", value: 5 },
    { label: "10 km", value: 10 },
  ];

  const categories: Array<{ id: StoreCategory | "all"; label: string }> = [
    { id: "all", label: "All Categories" },
    ...deliveryCategories.map((c) => ({
      id: c.filter || ("grocery" as StoreCategory),
      label: c.label.split("(")[0].trim(),
    })),
  ];

  const hasActiveFilters =
    Boolean(filters.maxDistanceKm) ||
    Boolean(filters.category && filters.category !== "all") ||
    Boolean(filters.openNow) ||
    Boolean(filters.inStockOnly) ||
    Boolean(filters.minRating) ||
    Boolean(filters.maxPrice);

  return (
    <div className="w-full space-y-3">
      {/* Primary Scrollable Filter Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {/* Category Selector */}
        <select
          value={filters.category || "all"}
          onChange={(e) =>
            onChange({
              ...filters,
              category: e.target.value === "all" ? undefined : (e.target.value as StoreCategory),
            })
          }
          className="h-9 cursor-pointer rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground shadow-2xs hover:bg-muted focus:outline-none ring-primary/20 focus:ring-2"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>

        {/* Distance Pills */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-2xs">
          <MapPin className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
          <button
            onClick={() => onChange({ ...filters, maxDistanceKm: undefined })}
            className={`rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
              !filters.maxDistanceKm
                ? "bg-primary text-primary-foreground font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Any
          </button>
          {distances.map((d) => (
            <button
              key={d.value}
              onClick={() => onChange({ ...filters, maxDistanceKm: d.value })}
              className={`rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
                filters.maxDistanceKm === d.value
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Open Now Pill */}
        <button
          onClick={() => onChange({ ...filters, openNow: !filters.openNow })}
          className={`flex items-center gap-1.5 h-9 rounded-xl border px-3 text-xs font-bold shadow-2xs transition-colors shrink-0 ${
            filters.openNow
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Open Now</span>
        </button>

        {/* In Stock Pill */}
        <button
          onClick={() => onChange({ ...filters, inStockOnly: !filters.inStockOnly })}
          className={`flex items-center gap-1.5 h-9 rounded-xl border px-3 text-xs font-bold shadow-2xs transition-colors shrink-0 ${
            filters.inStockOnly
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>In Stock</span>
        </button>

        {/* 4.0+ Rating Pill */}
        <button
          onClick={() =>
            onChange({
              ...filters,
              minRating: filters.minRating === 4.0 ? undefined : 4.0,
            })
          }
          className={`flex items-center gap-1.5 h-9 rounded-xl border px-3 text-xs font-bold shadow-2xs transition-colors shrink-0 ${
            filters.minRating === 4.0
              ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span>4.0+</span>
        </button>

        {/* More Filters Modal/Panel Toggle */}
        <button
          onClick={() => setShowMoreFilters(!showMoreFilters)}
          className={`flex items-center gap-1.5 h-9 rounded-xl border px-3 text-xs font-bold shadow-2xs transition-colors shrink-0 ${
            showMoreFilters || hasActiveFilters
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:bg-muted"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Filters</span>
        </button>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 h-9 rounded-xl border border-destructive/30 bg-destructive/10 px-3 text-xs font-bold text-destructive hover:bg-destructive/20 shrink-0"
          >
            <X className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Expanded Filters Drawer */}
      {showMoreFilters && (
        <div className="animate-in fade-in-50 duration-200 rounded-2xl border border-border bg-card p-4 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h4 className="font-display text-xs font-bold text-foreground uppercase tracking-wider">
              Refine Search Criteria
            </h4>
            <button
              onClick={() => setShowMoreFilters(false)}
              className="text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              Done
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Price Max Filter */}
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase">
                Max Price (₹)
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={filters.maxPrice ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      maxPrice: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold outline-none ring-primary/20 focus:ring-2"
                />
              </div>
            </div>

            {/* Delivery Option */}
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase">
                Fulfillment Mode
              </label>
              <div className="mt-1 flex items-center gap-2">
                <button
                  onClick={() =>
                    onChange({
                      ...filters,
                      deliveryAvailable: !filters.deliveryAvailable,
                    })
                  }
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-1.5 text-xs font-bold ${
                    filters.deliveryAvailable
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  <Truck className="h-3.5 w-3.5" />
                  <span>Home Delivery</span>
                </button>
                <button
                  onClick={() =>
                    onChange({
                      ...filters,
                      pickupAvailable: !filters.pickupAvailable,
                    })
                  }
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-1.5 text-xs font-bold ${
                    filters.pickupAvailable
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Self Pickup</span>
                </button>
              </div>
            </div>

            {/* Minimum Rating Selection */}
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase">
                Minimum Rating
              </label>
              <div className="mt-1 flex items-center gap-1">
                {[3.5, 4.0, 4.5, 4.8].map((r) => (
                  <button
                    key={r}
                    onClick={() =>
                      onChange({
                        ...filters,
                        minRating: filters.minRating === r ? undefined : r,
                      })
                    }
                    className={`flex-1 rounded-xl border py-1.5 text-xs font-bold ${
                      filters.minRating === r
                        ? "border-amber-500 bg-amber-500 text-white"
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {r}+ ⭐
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
