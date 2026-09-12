import React from "react";
import { X, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type ProductFilterState } from "@/lib/filter-types";

interface FilterChipsProps {
  filterState: ProductFilterState;
  onRemoveAttribute: (key: string, value: string) => void;
  onRemoveBrand: (brand: string) => void;
  onRemovePrice: () => void;
  onRemoveRating: () => void;
  onRemoveBoolean: (key: "inStock" | "onSale" | "openNow") => void;
  onClearAll: () => void;
}

export function FilterChips({
  filterState,
  onRemoveAttribute,
  onRemoveBrand,
  onRemovePrice,
  onRemoveRating,
  onRemoveBoolean,
  onClearAll,
}: FilterChipsProps) {
  const hasPrice =
    (filterState.minPrice !== undefined && filterState.minPrice > 0) ||
    (filterState.maxPrice !== undefined && filterState.maxPrice < 10000);
  const hasRating = filterState.minRating !== undefined && filterState.minRating > 0;
  const hasBrands = filterState.brands.length > 0;
  const hasBooleans = filterState.inStock || filterState.onSale || filterState.openNow;
  const hasAttributes = Object.values(filterState.attributes).some((vals) => vals && vals.length > 0);

  const hasAnyFilter = hasPrice || hasRating || hasBrands || hasBooleans || hasAttributes;

  if (!hasAnyFilter) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-2 mb-3">
      <span className="text-xs font-semibold text-muted-foreground mr-1">Active filters:</span>

      {/* Brands */}
      {filterState.brands.map((b) => (
        <Badge
          key={`brand-${b}`}
          variant="secondary"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
        >
          <span>Brand: {b}</span>
          <button
            type="button"
            onClick={() => onRemoveBrand(b)}
            className="hover:text-destructive transition-colors"
            title={`Remove brand filter ${b}`}
          >
            <X className="h-3 w-3 stroke-[2.5]" />
          </button>
        </Badge>
      ))}

      {/* Price Range */}
      {hasPrice && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
        >
          <span>
            ₹{filterState.minPrice ?? 0} – ₹{filterState.maxPrice ?? "10,000+"}
          </span>
          <button
            type="button"
            onClick={onRemovePrice}
            className="hover:text-destructive transition-colors"
            title="Remove price range filter"
          >
            <X className="h-3 w-3 stroke-[2.5]" />
          </button>
        </Badge>
      )}

      {/* Rating */}
      {hasRating && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 border border-yellow-500/20"
        >
          <span>★ {filterState.minRating}+ Rating</span>
          <button
            type="button"
            onClick={onRemoveRating}
            className="hover:text-destructive transition-colors"
            title="Remove rating filter"
          >
            <X className="h-3 w-3 stroke-[2.5]" />
          </button>
        </Badge>
      )}

      {/* Booleans */}
      {filterState.inStock && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20"
        >
          <span>In Stock</span>
          <button
            type="button"
            onClick={() => onRemoveBoolean("inStock")}
            className="hover:text-destructive transition-colors"
          >
            <X className="h-3 w-3 stroke-[2.5]" />
          </button>
        </Badge>
      )}

      {filterState.onSale && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/20"
        >
          <span>On Sale</span>
          <button
            type="button"
            onClick={() => onRemoveBoolean("onSale")}
            className="hover:text-destructive transition-colors"
          >
            <X className="h-3 w-3 stroke-[2.5]" />
          </button>
        </Badge>
      )}

      {filterState.openNow && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-purple-500/10 text-purple-800 dark:text-purple-300 border border-purple-500/20"
        >
          <span>Open Now</span>
          <button
            type="button"
            onClick={() => onRemoveBoolean("openNow")}
            className="hover:text-destructive transition-colors"
          >
            <X className="h-3 w-3 stroke-[2.5]" />
          </button>
        </Badge>
      )}

      {/* Distance Radius Chip */}
      {filterState.maxDistanceKm !== undefined && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20"
        >
          <span>Within {filterState.maxDistanceKm} km</span>
          <button
            type="button"
            onClick={() => onRemoveBoolean("maxDistanceKm" as any)}
            className="hover:text-destructive transition-colors"
          >
            <X className="h-3 w-3 stroke-[2.5]" />
          </button>
        </Badge>
      )}

      {/* Attribute Chips */}
      {Object.entries(filterState.attributes).map(([attrKey, values]) =>
        values.map((v) => (
          <Badge
            key={`attr-${attrKey}-${v}`}
            variant="secondary"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-foreground border border-border"
          >
            <span className="capitalize">{attrKey}: {v}</span>
            <button
              type="button"
              onClick={() => onRemoveAttribute(attrKey, v)}
              className="hover:text-destructive transition-colors"
              title={`Remove ${attrKey} filter ${v}`}
            >
              <X className="h-3 w-3 stroke-[2.5]" />
            </button>
          </Badge>
        ))
      )}

      {/* Clear All Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-7 text-xs font-bold text-destructive hover:bg-destructive/10 px-2.5 rounded-full"
      >
        <RotateCcw className="h-3 w-3 mr-1" />
        Clear All
      </Button>
    </div>
  );
}
