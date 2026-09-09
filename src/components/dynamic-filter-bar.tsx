import React, { useState } from "react";
import { SlidersHorizontal, ChevronDown, X, Sparkles, RotateCcw, Check } from "lucide-react";
import type { DynamicAttributeFilter, FilterOption } from "@/lib/category-taxonomy";
import type { ActiveFilterState } from "@/lib/dynamic-filter-engine";

interface DynamicFilterBarProps {
  filters: DynamicAttributeFilter[];
  activeState: ActiveFilterState;
  onChange: (newState: ActiveFilterState) => void;
  className?: string;
}

export function DynamicFilterBar({
  filters,
  activeState,
  onChange,
  className = "",
}: DynamicFilterBarProps) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Count total active attribute filters
  const activeAttributeCount = Object.values(activeState.selectedAttributes).reduce(
    (acc, arr) => acc + (arr ? arr.length : 0),
    0
  );

  const handleToggleOption = (filterId: string, value: string) => {
    const current = activeState.selectedAttributes[filterId] || [];
    const exists = current.includes(value);
    const updated = exists ? current.filter((v) => v !== value) : [...current, value];

    const nextAttributes = { ...activeState.selectedAttributes };
    if (updated.length > 0) {
      nextAttributes[filterId] = updated;
    } else {
      delete nextAttributes[filterId];
    }

    onChange({
      ...activeState,
      selectedAttributes: nextAttributes,
    });
  };

  const handleClearAll = () => {
    onChange({
      ...activeState,
      selectedAttributes: {},
    });
    setOpenDropdownId(null);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Scrollable Filter Chips Container */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* All Filters Button */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer ${
            activeAttributeCount > 0
              ? "border-purple-700 bg-purple-900 text-white shadow-purple-200"
              : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-purple-400" />
          <span>Filters</span>
          {activeAttributeCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#F3D053] text-[10px] font-black text-purple-950">
              {activeAttributeCount}
            </span>
          )}
        </button>

        {/* Clear Filters Button (If active) */}
        {activeAttributeCount > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset ({activeAttributeCount})</span>
          </button>
        )}

        <div className="h-4 w-px bg-slate-200 shrink-0" />

        {/* Dynamic Category Filter Dropdown Pills */}
        {filters.map((filter) => {
          const selectedForThisFilter = activeState.selectedAttributes[filter.id] || [];
          const isOpen = openDropdownId === filter.id;
          const hasSelection = selectedForThisFilter.length > 0;

          return (
            <div key={filter.id} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setOpenDropdownId(isOpen ? null : filter.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  hasSelection
                    ? "border-purple-700 bg-purple-50 text-purple-900 shadow-2xs ring-1 ring-purple-500/20"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{filter.name}</span>
                {hasSelection && (
                  <span className="rounded-full bg-purple-700 text-white text-[10px] font-bold px-1.5 py-0.2">
                    {selectedForThisFilter.length}
                  </span>
                )}
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180 text-purple-700" : ""}`}
                />
              </button>

              {/* Dropdown Popover */}
              {isOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setOpenDropdownId(null)}
                  />
                  <div className="absolute left-0 top-full mt-2 z-40 w-56 rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 space-y-1.5 animate-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-1">
                      <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                        {filter.name}
                      </span>
                      {hasSelection && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = { ...activeState.selectedAttributes };
                            delete next[filter.id];
                            onChange({ ...activeState, selectedAttributes: next });
                          }}
                          className="text-[10px] text-purple-700 font-bold hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {filter.options.map((opt) => {
                        const checked = selectedForThisFilter.includes(opt.value);
                        return (
                          <label
                            key={opt.value}
                            className={`flex items-center justify-between text-xs font-semibold p-2 rounded-xl cursor-pointer transition-colors ${
                              checked ? "bg-purple-50 text-purple-900" : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleToggleOption(filter.id, opt.value)}
                                className="rounded border-slate-300 text-purple-700 focus:ring-purple-700"
                              />
                              <span>{opt.label}</span>
                            </span>
                            {checked && <Check className="h-3.5 w-3.5 text-purple-700" />}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Slide-over Filter Drawer (Mobile & Tablet) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between p-5 space-y-4 animate-in slide-in-from-right duration-250">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-900">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Category Filters</h3>
                    <p className="text-[11px] text-slate-500">Refine by product attributes</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="rounded-full p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-5 overflow-y-auto max-h-[calc(100vh-140px)] pr-1">
                {filters.map((filter) => {
                  const selectedForThisFilter = activeState.selectedAttributes[filter.id] || [];
                  return (
                    <div key={filter.id} className="space-y-2 border-b border-slate-100 pb-4">
                      <h4 className="font-extrabold text-slate-900 text-xs tracking-wide">
                        {filter.name}
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {filter.options.map((opt) => {
                          const checked = selectedForThisFilter.includes(opt.value);
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleToggleOption(filter.id, opt.value)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                checked
                                  ? "bg-purple-900 text-white shadow-xs"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClearAll}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-2/3 py-2.5 rounded-xl bg-purple-900 text-white font-extrabold text-xs shadow-md hover:bg-purple-950"
              >
                Apply Filters ({activeAttributeCount})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
