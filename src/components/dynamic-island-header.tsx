import { useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles, ChevronDown, X, Search, Layers, Check, Compass, Grid } from "lucide-react";
import { m, AnimatePresence, LayoutGroup } from "motion/react";
import { menuGroups } from "@/components/category-mega-menu";
import { getCategoryByIdOrSlug } from "@/lib/shop-categories";

export function CategoryDynamicIsland() {
  const search = useRouterState({ select: (s) => s.location.search }) as Record<string, any>;
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");

  const currentCategorySlug = search?.category;
  const currentCategoryName = currentCategorySlug
    ? getCategoryByIdOrSlug(currentCategorySlug).name
    : null;

  const filteredGroups = menuGroups.filter((g) =>
    g.label.toLowerCase().includes(filterQuery.toLowerCase()),
  );

  return (
    <div className="sticky top-2 z-50 flex justify-center px-3 py-1 pointer-events-none md:hidden">
      <LayoutGroup id="apple-dynamic-island">
        {!isExpanded ? (
          <m.div
            layoutId="category-island-container"
            transition={{ type: "spring", stiffness: 450, damping: 32 }}
            className="pointer-events-auto flex items-center justify-between gap-3 rounded-full bg-black border border-white/15 px-4 py-2 text-white shadow-[0_16px_40px_rgba(0,0,0,0.85)] backdrop-blur-2xl ring-1 ring-white/10 cursor-pointer hover:scale-105 active:scale-95"
            onClick={() => setIsExpanded(true)}
            role="button"
            tabIndex={0}
          >
            {/* Left side: Live Pulsing Camera Lens Dot & Category Label */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative flex h-2.5 w-2.5 items-center justify-center shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              </div>

              <m.span layoutId="category-island-title" className="text-xs font-black text-white truncate flex items-center gap-1.5">
                {currentCategoryName ? (
                  <>
                    <span className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">
                      Cat:
                    </span>
                    <span className="text-amber-300 font-extrabold">{currentCategoryName}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                    <span>Select Category</span>
                  </>
                )}
              </m.span>
            </div>

            {/* Right side: Apple Waveform bars & Chevron */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-end gap-0.5 h-3">
                <m.span animate={{ height: [4, 12, 6, 12, 4] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-0.5 bg-amber-400 rounded-full" />
                <m.span animate={{ height: [10, 4, 12, 4, 10] }} transition={{ repeat: Infinity, duration: 1.4 }} className="w-0.5 bg-amber-300 rounded-full" />
                <m.span animate={{ height: [6, 12, 4, 12, 6] }} transition={{ repeat: Infinity, duration: 1.1 }} className="w-0.5 bg-amber-400 rounded-full" />
              </div>

              <span className="grid h-4 w-4 place-items-center rounded-full bg-white/20 text-slate-200">
                <ChevronDown className="h-3 w-3 stroke-[2.5]" />
              </span>
            </div>
          </m.div>
        ) : (
          <m.div
            layoutId="category-island-container"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="pointer-events-auto w-full max-w-sm rounded-[32px] bg-black border border-white/20 p-4 text-white shadow-[0_24px_70px_rgba(0,0,0,0.95)] backdrop-blur-3xl ring-1 ring-white/15"
          >
            {/* Expanded Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-3 w-3 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                </div>
                <m.div layoutId="category-island-title">
                  <h3 className="text-xs font-black text-white leading-none tracking-tight flex items-center gap-1.5">
                    <span>Dynamic Category Island</span>
                    <span className="text-[9px] font-mono font-extrabold uppercase bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded-full border border-amber-300/40">
                      LIVE
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    Tap any category to switch marketplace feed
                  </p>
                </m.div>
              </div>

              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="grid h-7 w-7 place-items-center rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Category Search Input */}
            <div className="mt-3 relative">
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 border border-white/15 focus-within:border-amber-400/80 transition-colors">
                <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Search categories (e.g. Kirana, Bakery, Fashion)..."
                  className="w-full bg-transparent text-xs font-medium text-white outline-none placeholder:text-slate-500"
                />
                {filterQuery && (
                  <button onClick={() => setFilterQuery("")} className="text-slate-400 hover:text-white text-xs">
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Quick Category Chips Grid */}
            <div className="mt-3 max-h-60 overflow-y-auto pr-1 space-y-2 [scrollbar-width:none]">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/search"
                  search={{ category: undefined, q: undefined }}
                  onClick={() => setIsExpanded(false)}
                  className={`flex items-center justify-between rounded-2xl p-2.5 text-xs font-black transition-all border ${
                    !currentCategorySlug
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400 text-white shadow-lg ring-1 ring-purple-300/40"
                      : "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  <span className="truncate">🛍️ All Categories</span>
                  {!currentCategorySlug && <Check className="h-3.5 w-3.5 text-amber-300 shrink-0" />}
                </Link>

                {filteredGroups.map((group) => {
                  const isActive = currentCategorySlug === group.categoryId;
                  return (
                    <Link
                      key={group.id}
                      to="/search"
                      search={{ category: group.categoryId }}
                      onClick={() => setIsExpanded(false)}
                      className={`flex items-center justify-between rounded-2xl p-2.5 text-xs font-bold transition-all border truncate ${
                        isActive
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400 text-white shadow-lg ring-1 ring-purple-300/40"
                          : "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10"
                      }`}
                    >
                      <span className="truncate">{group.label}</span>
                      {isActive && <Check className="h-3.5 w-3.5 text-amber-300 shrink-0" />}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Footer Directory Action */}
            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Grid className="h-3 w-3 text-purple-400" />
                31 Categories Available
              </span>
              <Link
                to="/search"
                search={{ category: undefined, q: undefined }}
                onClick={() => setIsExpanded(false)}
                className="text-xs font-black text-amber-300 hover:text-amber-200 flex items-center gap-1 hover:underline"
              >
                <span>Full Directory &rarr;</span>
              </Link>
            </div>
          </m.div>
        )}
      </LayoutGroup>
    </div>
  );
}
