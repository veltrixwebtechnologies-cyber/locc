import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FilterRangeSlider } from "./filter-range-slider";
import {
  type FilterDefinition,
  type ProductFilterState,
  type FacetResult,
} from "@/lib/filter-types";
import { Star, RotateCcw, Check, Search, ShieldCheck, MapPin, Store, Truck, ShoppingBag } from "lucide-react";

interface DynamicFilterPanelProps {
  filterDefinitions: FilterDefinition[];
  filterState: ProductFilterState;
  facets: FacetResult;
  onUpdateState: (patch: Partial<ProductFilterState>) => void;
  onClearAll: () => void;
  className?: string;
}

export function DynamicFilterPanel({
  filterDefinitions,
  filterState,
  facets,
  onUpdateState,
  onClearAll,
  className = "",
}: DynamicFilterPanelProps) {
  const [brandSearch, setBrandSearch] = useState("");

  // Toggle attribute option
  const toggleAttributeOption = (key: string, value: string) => {
    const currentVals = filterState.attributes[key] || [];
    const exists = currentVals.includes(value);
    const updated = exists
      ? currentVals.filter((v) => v !== value)
      : [...currentVals, value];

    const nextAttributes = { ...filterState.attributes };
    if (updated.length > 0) {
      nextAttributes[key] = updated;
    } else {
      delete nextAttributes[key];
    }

    onUpdateState({ attributes: nextAttributes, page: 1 });
  };

  // Toggle brand
  const toggleBrand = (brandName: string) => {
    const exists = filterState.brands.includes(brandName);
    const updated = exists
      ? filterState.brands.filter((b) => b !== brandName)
      : [...filterState.brands, brandName];

    onUpdateState({ brands: updated, page: 1 });
  };

  // Count total active filters
  const activeAttributeCount = Object.values(filterState.attributes).reduce(
    (acc, arr) => acc + (arr ? arr.length : 0),
    0
  );
  const totalActiveCount =
    (filterState.brands.length || 0) +
    activeAttributeCount +
    (filterState.minPrice !== undefined || filterState.maxPrice !== undefined ? 1 : 0) +
    (filterState.minRating ? 1 : 0) +
    (filterState.maxDistanceKm ? 1 : 0) +
    (filterState.verifiedShopOnly ? 1 : 0) +
    (filterState.localFavoriteOnly ? 1 : 0) +
    (filterState.inStockOnly ? 1 : 0) +
    (filterState.openNowOnly ? 1 : 0);

  const activeAccordionKeys = [
    "price",
    "brand",
    "distance",
    "shop_trust",
    "delivery_options",
  ].concat(filterDefinitions.map((d) => d.key));

  const filteredBrandFacets = (facets.brand_facets || []).filter((b) =>
    b.label.toLowerCase().includes(brandSearch.toLowerCase().trim())
  );

  return (
    <div className={`bg-card/95 backdrop-blur-md border border-primary/10 rounded-2xl p-4 shadow-lg shadow-black/5 space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-foreground">Filters</h3>
          {totalActiveCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-primary text-primary-foreground shadow-xs">
              {totalActiveCount}
            </span>
          )}
        </div>
        {totalActiveCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-xs font-bold text-destructive hover:bg-destructive/10 h-7 px-2.5 rounded-full"
          >
            <RotateCcw className="h-3 w-3 mr-1" /> Clear All
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* 🛍️ GROUP 1: PRODUCT FILTERS */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-primary mb-1.5 px-1">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Product Filters</span>
          </div>

          <Accordion type="multiple" defaultValue={activeAccordionKeys} className="w-full divide-y divide-border/60">
            {/* Price Range */}
            <AccordionItem value="price" className="border-b-0 py-1">
              <AccordionTrigger className="text-xs font-bold text-foreground py-2 hover:no-underline">
                Price Range
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-3">
                <FilterRangeSlider
                  min={facets.min_price || 0}
                  max={facets.max_price || 10000}
                  currentMin={filterState.minPrice}
                  currentMax={filterState.maxPrice}
                  onChange={(minP, maxP) => onUpdateState({ minPrice: minP, maxPrice: maxP, page: 1 })}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Brand with Search Box */}
            {facets.brand_facets && facets.brand_facets.length > 0 && (
              <AccordionItem value="brand" className="border-b-0 py-1">
                <AccordionTrigger className="text-xs font-bold text-foreground py-2 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span>Brand</span>
                    {filterState.brands.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary/20 text-primary">
                        {filterState.brands.length}
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-3 space-y-2">
                  {facets.brand_facets.length > 5 && (
                    <div className="relative mb-2">
                      <Search className="h-3.5 w-3.5 absolute left-2.5 top-1.5 text-muted-foreground" />
                      <input
                        type="text"
                        value={brandSearch}
                        onChange={(e) => setBrandSearch(e.target.value)}
                        placeholder="Search brands..."
                        className="w-full rounded-lg border border-input bg-background pl-8 pr-2 py-1 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {filteredBrandFacets.map((b) => {
                      const isChecked = filterState.brands.includes(b.value);
                      const disabled = b.count === 0 && !isChecked;

                      return (
                        <div
                          key={`brand-${b.value}`}
                          className={`flex items-center justify-between py-1 text-xs ${
                            disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                          }`}
                        >
                          <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                            <Checkbox
                              checked={isChecked}
                              disabled={disabled}
                              onCheckedChange={() => toggleBrand(b.value)}
                            />
                            <span className="truncate font-medium text-foreground">{b.label}</span>
                          </label>
                          <span className="text-[11px] text-muted-foreground font-mono shrink-0 ml-2">
                            ({b.count})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Dynamic Category & Product Type Attributes */}
            {filterDefinitions.map((def) => {
              if (def.is_universal && (def.key === "brand" || def.key === "price")) {
                return null;
              }

              const facetOptions = facets.attributes[def.key] || [];
              const selectedValues = filterState.attributes[def.key] || [];

              const optionsToRender = (def.options || []).map((opt) => {
                const foundFacet = facetOptions.find((f) => f.value.toLowerCase() === opt.value.toLowerCase());
                return {
                  ...opt,
                  count: foundFacet ? foundFacet.count : 0,
                };
              });

              for (const facetOpt of facetOptions) {
                if (!optionsToRender.some((o) => o.value.toLowerCase() === facetOpt.value.toLowerCase())) {
                  optionsToRender.push({
                    id: `opt-${def.key}-${facetOpt.value}`,
                    value: facetOpt.value,
                    label: facetOpt.label,
                    display_order: 99,
                    count: facetOpt.count,
                  });
                }
              }

              const isColorType =
                def.type === "color" || def.key === "color" || def.key === "color_family";

              const isPillType =
                def.type === "single_select" ||
                def.type === "chip_group" ||
                def.key === "size" ||
                def.key === "apparel_size" ||
                def.key === "footwear_size" ||
                def.key === "fit" ||
                def.key === "ram" ||
                def.key === "storage";

              return (
                <AccordionItem key={def.id} value={def.key} className="border-b-0 py-1">
                  <AccordionTrigger className="text-xs font-bold text-foreground py-2 hover:no-underline capitalize">
                    <div className="flex items-center gap-2">
                      <span>{def.label} {def.unit ? `(${def.unit})` : ""}</span>
                      {selectedValues.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary/20 text-primary">
                          {selectedValues.length}
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-3">
                    {isColorType ? (
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        {optionsToRender.map((opt) => {
                          const isSelected = selectedValues.includes(opt.value);
                          const hex = getColorHex(opt.value);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => toggleAttributeOption(def.key, opt.value)}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                                isSelected
                                  ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/30"
                                  : "border-border/80 bg-background text-foreground hover:bg-muted/80"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-2xs"
                                  style={{ backgroundColor: hex }}
                                />
                                <span className="truncate">{opt.label}</span>
                              </div>
                              {opt.count !== undefined && (
                                <span className="text-[10px] font-mono text-muted-foreground ml-1">
                                  ({opt.count})
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : isPillType ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {optionsToRender.map((opt) => {
                          const isSelected = selectedValues.includes(opt.value);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => toggleAttributeOption(def.key, opt.value)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
                                isSelected
                                  ? "bg-gradient-to-r from-primary to-indigo-600 text-white border-primary shadow-xs"
                                  : "bg-muted/60 text-foreground border-border/80 hover:bg-muted"
                              }`}
                            >
                              <span>{opt.label}</span>
                              {opt.count !== undefined && (
                                <span className={`text-[10px] font-mono ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                                  ({opt.count})
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {optionsToRender.map((opt) => {
                          const isChecked = selectedValues.includes(opt.value);
                          const disabled = opt.count === 0 && !isChecked;

                          return (
                            <div
                              key={opt.id}
                              className={`flex items-center justify-between py-1 text-xs ${
                                disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                              }`}
                            >
                              <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                                <Checkbox
                                  checked={isChecked}
                                  disabled={disabled}
                                  onCheckedChange={() => toggleAttributeOption(def.key, opt.value)}
                                />
                                <span className="truncate font-medium text-foreground">{opt.label}</span>
                              </label>
                              <span className="text-[11px] text-muted-foreground font-mono shrink-0 ml-2">
                                ({opt.count ?? 0})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        {/* 🏪 GROUP 2: SHOP FILTERS */}
        <div className="pt-2 border-t border-border/60">
          <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-purple-600 mb-1.5 px-1">
            <Store className="h-3.5 w-3.5" />
            <span>Shop &amp; Location Filters</span>
          </div>

          <Accordion type="multiple" defaultValue={["distance", "shop_trust"]} className="w-full divide-y divide-border/60">
            {/* Distance Radius */}
            <AccordionItem value="distance" className="border-b-0 py-1">
              <AccordionTrigger className="text-xs font-bold text-foreground py-2 hover:no-underline">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Max Distance</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-3">
                <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                  {[1, 2, 5, 10].map((dist) => {
                    const isSelected = filterState.maxDistanceKm === dist;
                    return (
                      <button
                        key={`dist-${dist}`}
                        type="button"
                        onClick={() =>
                          onUpdateState({
                            maxDistanceKm: isSelected ? undefined : dist,
                            page: 1,
                          })
                        }
                        className={`py-1.5 rounded-lg border text-center transition-all ${
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-card text-foreground hairline hover:bg-muted"
                        }`}
                      >
                        {dist} km
                      </button>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Shop Trust & Verification */}
            <AccordionItem value="shop_trust" className="border-b-0 py-1">
              <AccordionTrigger className="text-xs font-bold text-foreground py-2 hover:no-underline">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  <span>Shop Trust &amp; Status</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-3 space-y-2 text-xs">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-medium text-foreground">Verified Local Store Only</span>
                  <Checkbox
                    checked={filterState.verifiedShopOnly ?? false}
                    onCheckedChange={(c) => onUpdateState({ verifiedShopOnly: !!c, page: 1 })}
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-medium text-foreground">Community Favorite ⭐</span>
                  <Checkbox
                    checked={filterState.localFavoriteOnly ?? false}
                    onCheckedChange={(c) => onUpdateState({ localFavoriteOnly: !!c, page: 1 })}
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-medium text-foreground">Open Now Only</span>
                  <Checkbox
                    checked={filterState.openNowOnly ?? false}
                    onCheckedChange={(c) => onUpdateState({ openNowOnly: !!c, page: 1 })}
                  />
                </label>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* 🛵 GROUP 3: DELIVERY & LOCAL FILTERS */}
        <div className="pt-2 border-t border-border/60">
          <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-600 mb-1.5 px-1">
            <Truck className="h-3.5 w-3.5" />
            <span>Delivery &amp; Fulfilment</span>
          </div>

          <div className="space-y-2 text-xs p-1">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium text-foreground">In Stock Only</span>
              <Checkbox
                checked={filterState.inStockOnly ?? false}
                onCheckedChange={(c) => onUpdateState({ inStockOnly: !!c, page: 1 })}
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium text-foreground">Delivery Available</span>
              <Checkbox
                checked={filterState.deliveryAvailableOnly ?? false}
                onCheckedChange={(c) => onUpdateState({ deliveryAvailableOnly: !!c, page: 1 })}
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium text-foreground">Self-Pickup Available</span>
              <Checkbox
                checked={filterState.pickupAvailableOnly ?? false}
                onCheckedChange={(c) => onUpdateState({ pickupAvailableOnly: !!c, page: 1 })}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}


function getColorHex(colorName: string): string {
  const name = colorName.toLowerCase();
  if (name.includes("black")) return "#000000";
  if (name.includes("white")) return "#ffffff";
  if (name.includes("blue")) return "#1d4ed8";
  if (name.includes("red")) return "#dc2626";
  if (name.includes("green")) return "#16a34a";
  if (name.includes("yellow")) return "#eab308";
  if (name.includes("grey") || name.includes("gray")) return "#6b7280";
  if (name.includes("pink")) return "#ec4899";
  if (name.includes("purple")) return "#a855f7";
  if (name.includes("orange")) return "#f97316";
  return "#94a3b8";
}
