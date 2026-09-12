import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Star, MapPin, ChevronRight, ChevronLeft, Store as StoreIcon, Sparkles, Tag } from "lucide-react";
import { useSearchShopRecommendations } from "@/hooks/use-search-shop-recommendations";
import { resolveImageUrl } from "@/lib/image-utils";
import { m } from "motion/react";

interface SearchShopRecommendationsProps {
  searchQuery: string;
  currentShopId?: string;
  currentShopName?: string;
  className?: string;
}

export function SearchShopRecommendations({
  searchQuery,
  currentShopId,
  currentShopName,
  className = "",
}: SearchShopRecommendationsProps) {
  const { recommendations, isLoading } = useSearchShopRecommendations(searchQuery, currentShopId);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!searchQuery || !searchQuery.trim()) return null;
  if (!isLoading && (!recommendations || recommendations.length === 0)) return null;

  const scroll = (direction: "left" | "right") => {
    if (containerRef.current) {
      const amount = direction === "left" ? -340 : 340;
      containerRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  const formattedQuery = searchQuery.trim();

  return (
    <section className={`mt-10 mb-8 border-t border-slate-200/80 pt-8 ${className}`}>
      {/* Contextual Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100/90 px-3 py-1 text-xs font-black text-[#981495] border border-purple-200 shadow-2xs mb-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
            <span>Search Match Engine</span>
          </div>

          <h3 className="font-display text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
            🛍️ Other Shops Selling What You Searched For
          </h3>

          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Compare nearby local stores matching <strong className="text-purple-900">"{formattedQuery}"</strong>
            {currentShopName ? ` besides ${currentShopName}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/search"
            search={{ q: formattedQuery }}
            className="text-xs font-extrabold text-[#981495] hover:text-purple-800 hover:underline flex items-center gap-1 bg-purple-50 px-3.5 py-2 rounded-full border border-purple-200/70 transition-all"
          >
            <span>View All Shops ({recommendations.length})</span>
            <ChevronRight className="h-4 w-4" />
          </Link>

          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="grid h-9 w-9 place-items-center rounded-full border border-amber-300/80 bg-white text-slate-700 hover:bg-purple-50 hover:text-[#981495] transition-all shadow-2xs cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="grid h-9 w-9 place-items-center rounded-full border border-amber-300/80 bg-white text-slate-700 hover:bg-purple-50 hover:text-[#981495] transition-all shadow-2xs cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Shop Cards Slider / Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-3xl bg-slate-100 animate-pulse border border-slate-200"
            />
          ))}
        </div>
      ) : (
        <div
          ref={containerRef}
          className="flex gap-4.5 overflow-x-auto pb-4 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth snap-x snap-mandatory"
        >
          {recommendations.map((rec, index) => (
            <m.div
              key={rec.shopId}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="snap-start group flex w-[280px] sm:w-[310px] shrink-0 flex-col justify-between overflow-hidden rounded-3xl bg-white border-2 border-amber-300/80 p-4 shadow-sm hover:shadow-xl hover:border-amber-400 transition-all duration-300 relative"
            >
              {/* Top Banner & Rating */}
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-100 mb-3 border border-amber-200/60">
                <img
                  src={resolveImageUrl(rec.imageUrl, rec.shopName)}
                  alt={rec.shopName}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                {/* Rating Badge top-left */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-md px-2.5 py-1 text-[11px] font-black text-slate-900 border border-amber-300 shadow-sm">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span>{rec.rating.toFixed(1)}</span>
                  {rec.reviewCount ? (
                    <span className="text-slate-400 font-normal text-[10px]">({rec.reviewCount})</span>
                  ) : null}
                </div>

                {/* Distance Badge top-right */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-slate-900/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-amber-200 border border-amber-300/40">
                  <MapPin className="h-3 w-3 text-amber-300" />
                  <span>{rec.distanceKm ? `${rec.distanceKm} km away` : "Nearby"}</span>
                </div>

                {/* Store Name Overlay inside banner if needed */}
                <div className="absolute bottom-2.5 left-3 right-3 text-white">
                  <h4 className="font-display font-black text-base truncate leading-tight drop-shadow-md">
                    {rec.shopName}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-200 truncate opacity-90">
                    {rec.shopTagline}
                  </p>
                </div>
              </div>

              {/* Match Highlights */}
              <div className="space-y-2.5 my-1 flex-1">
                {/* Specific Matching Products Count Badge */}
                <div className="flex items-center justify-between rounded-xl bg-purple-50 px-3 py-2 border border-purple-200/80">
                  <span className="flex items-center gap-1.5 text-xs font-black text-[#981495]">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                    <span>{rec.matchingProductCount} matching product{rec.matchingProductCount > 1 ? "s" : ""}</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md">
                    In Stock
                  </span>
                </div>

                {/* Price starting from */}
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5 text-amber-600" />
                    <span>Starting from</span>
                  </span>
                  <strong className="text-sm font-black text-slate-900">
                    ₹{rec.startingPrice.toLocaleString("en-IN")}
                  </strong>
                </div>

                {/* Matching Product Preview Pills */}
                {rec.matchingProductNames && rec.matchingProductNames.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {rec.matchingProductNames.map((name, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 truncate max-w-[130px] border border-slate-200/60"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* View Shop Action Button */}
              <div className="mt-3 pt-2.5 border-t border-slate-100">
                <Link
                  to="/store/$storeId"
                  params={{ storeId: rec.shopId }}
                  search={{ sq: formattedQuery, category: undefined }}
                  className="w-full rounded-2xl bg-[#981495] hover:bg-[#7e107b] text-white py-2.5 px-4 text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-purple-900/15 active:scale-95 transition-all cursor-pointer group/btn"
                >
                  <StoreIcon className="h-3.5 w-3.5" />
                  <span>View Shop</span>
                  <ChevronRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </m.div>
          ))}
        </div>
      )}
    </section>
  );
}
