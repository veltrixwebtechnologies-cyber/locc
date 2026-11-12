import { Tag, Leaf, Radio, Calendar } from "lucide-react";
import { toast } from "sonner";

interface QuickFeatureCardsProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  onOpenLiveMarket?: () => void;
}

export function QuickFeatureCards({
  activeTab,
  onSelectTab,
  onOpenLiveMarket,
}: QuickFeatureCardsProps) {
  const handleTabClick = (tab: string, label: string) => {
    onSelectTab?.(tab);
    toast.success(`Showing ${label}`, {
      duration: 2200,
    });
    const el = document.getElementById("social-feed-container");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const isDealsActive = activeTab === "deals";
  const isFreshActive = activeTab === "fresh";
  const isCommunityActive = activeTab === "community";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      {/* 1. Deals Near You */}
      <button
        type="button"
        onClick={() => handleTabClick("deals", "Neighborhood Deals & Offers")}
        className={`group flex items-center gap-2.5 sm:gap-3 rounded-2xl p-2.5 sm:p-3.5 text-left transition-all hover:border-purple-300 hover:shadow-xs cursor-pointer min-w-0 bg-white ${
          isDealsActive
            ? "border-2 border-[#8B2FC9] shadow-xs"
            : "border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        }`}
      >
        <div
          className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl transition ${
            isDealsActive
              ? "bg-[#8B2FC9] text-white shadow-xs"
              : "bg-purple-50 text-[#8B2FC9] group-hover:scale-105"
          }`}
        >
          <Tag className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="block text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">
              Deals
            </span>
            {isDealsActive && (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#8B2FC9]" />
            )}
          </div>
          <span className="block text-[10px] sm:text-xs font-medium text-slate-500 leading-tight truncate mt-0.5">
            Near You
          </span>
        </div>
      </button>

      {/* 2. Fresh Today */}
      <button
        type="button"
        onClick={() => handleTabClick("fresh", "Fresh Harvest & Daily Bakes")}
        className={`group flex items-center gap-2.5 sm:gap-3 rounded-2xl p-2.5 sm:p-3.5 text-left transition-all hover:border-emerald-300 hover:shadow-xs cursor-pointer min-w-0 bg-white ${
          isFreshActive
            ? "border-2 border-emerald-600 shadow-xs"
            : "border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        }`}
      >
        <div
          className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl transition ${
            isFreshActive
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-emerald-50 text-emerald-600 group-hover:scale-105"
          }`}
        >
          <Leaf className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="block text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">
              Fresh Today
            </span>
            {isFreshActive && (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600" />
            )}
          </div>
          <span className="block text-[10px] sm:text-xs font-medium text-slate-500 leading-tight truncate mt-0.5">
            Farm & Bakes
          </span>
        </div>
      </button>

      {/* 3. Live Market */}
      <button
        type="button"
        onClick={() => {
          onOpenLiveMarket?.();
          toast.success("Opening Live Market Stream", { duration: 2000 });
        }}
        className="group relative flex items-center gap-2.5 sm:gap-3 rounded-2xl bg-white p-2.5 sm:p-3.5 text-left border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:border-rose-300 hover:shadow-xs cursor-pointer min-w-0"
      >
        <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 group-hover:scale-105 transition">
          <Radio className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2]" />
          <span className="absolute -top-1 -right-1 rounded-full bg-rose-500 px-1 py-0.2 text-[8px] font-bold text-white tracking-wider shadow-2xs">
            LIVE
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="block text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">
              Live Market
            </span>
          </div>
          <span className="block text-[10px] sm:text-xs font-medium text-slate-500 leading-tight truncate mt-0.5">
            Stream & Shop
          </span>
        </div>
      </button>

      {/* 4. Local Events */}
      <button
        type="button"
        onClick={() => handleTabClick("community", "Local Community Events")}
        className={`group flex items-center gap-2.5 sm:gap-3 rounded-2xl p-2.5 sm:p-3.5 text-left transition-all hover:border-blue-300 hover:shadow-xs cursor-pointer min-w-0 bg-white ${
          isCommunityActive
            ? "border-2 border-blue-600 shadow-xs"
            : "border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        }`}
      >
        <div
          className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl transition ${
            isCommunityActive
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-blue-50 text-blue-600 group-hover:scale-105"
          }`}
        >
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="block text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">
              Events
            </span>
            {isCommunityActive && (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-600" />
            )}
          </div>
          <span className="block text-[10px] sm:text-xs font-medium text-slate-500 leading-tight truncate mt-0.5">
            In Your Area
          </span>
        </div>
      </button>
    </div>
  );
}
