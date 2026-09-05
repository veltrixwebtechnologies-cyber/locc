import React, { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { SearchResultItem } from "@/lib/search-service";
import { Store, Utensils, ShoppingBag, ChevronRight, X, Search } from "lucide-react";
import { useLiveSearchResults } from "@/hooks/use-live-search-results";

interface SwiggyInstantSearchDropdownProps {
  query: string;
  onSelectResult?: () => void;
  onClearQuery?: () => void;
  className?: string;
}

export function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim()) return <>{text}</>;

  const trimmed = query.trim();
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <strong
            key={index}
            className="font-extrabold text-foreground underline decoration-primary/40 underline-offset-2"
          >
            {part}
          </strong>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

export function SwiggyInstantSearchDropdown({
  query,
  onSelectResult,
  onClearQuery,
  className = "",
}: SwiggyInstantSearchDropdownProps) {
  const navigate = useNavigate();

  const { results, isLoading } = useLiveSearchResults(query);

  const handleResultClick = (item: SearchResultItem) => {
    if (onSelectResult) onSelectResult();
    void navigate({ to: item.url as any });
  };

  if (!query.trim()) {
    return (
      <div
        className={`w-full bg-background rounded-2xl border hairline shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150 ${className}`}
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Popular Searches
          </span>
        </div>
        <div className="space-y-1">
          {[
            { label: "Haribhavanam", cat: "Restaurant" },
            { label: "Chicken Harissa", cat: "Dish" },
            { label: "Paneer Hariyali", cat: "Dish" },
            { label: "Flour & Masala Mill", cat: "Shop" },
            { label: "Fresh Bakery & Puffs", cat: "Shop" },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                void navigate({ to: "/search", search: { q: item.label } });
              }}
              className="flex items-center justify-between w-full px-3 py-2 text-left rounded-xl hover:bg-muted/80 transition-colors text-sm group"
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="font-medium text-foreground">{item.label}</span>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                {item.cat}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={`w-full bg-background rounded-2xl border hairline shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-150 ${className}`}
      >
        <Search className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50 stroke-1 animate-pulse" />
        <p className="text-sm font-semibold text-foreground">Searching live catalog...</p>
        <p className="text-xs text-muted-foreground mt-1">Checking approved shops and products</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div
        className={`w-full bg-background rounded-2xl border hairline shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-150 ${className}`}
      >
        <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50 stroke-1" />
        <p className="text-sm font-semibold text-foreground">No matches found for "{query}"</p>
        <p className="text-xs text-muted-foreground mt-1">
          Try searching for restaurants like "Haribhavanam" or dishes like "Harissa"
        </p>
      </div>
    );
  }

  return (
    <div
      className={`w-full bg-background rounded-2xl border hairline shadow-2xl overflow-hidden max-h-[480px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 ${className}`}
    >
      <div className="sticky top-0 bg-background/95 backdrop-blur-md px-4 py-2.5 border-b border-border/50 flex items-center justify-between z-10">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Results ({results.length})
        </span>
        {onClearQuery && (
          <button
            type="button"
            onClick={onClearQuery}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      <div className="p-2 space-y-1">
        {results.map((item) => (
          <div
            key={item.id}
            onMouseDown={(e) => {
              e.preventDefault();
              handleResultClick(item);
            }}
            className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-muted/80 active:bg-muted transition-colors cursor-pointer group"
          >
            {/* Square Thumbnail Image */}
            <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/40 shadow-xs">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=75";
                }}
              />
            </div>

            {/* Title and Subtitle */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                <HighlightText text={item.title} query={query} />
              </h4>
              <p className="text-xs font-normal text-muted-foreground truncate mt-0.5">
                {item.subtitle}
                {item.price ? ` • ₹${item.price}` : ""}
              </p>
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </div>
        ))}
      </div>
    </div>
  );
}
