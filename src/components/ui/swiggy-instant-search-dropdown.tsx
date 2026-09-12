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
    const targetUrl = item.url || "";
    if (targetUrl.startsWith("/store/")) {
      const storeId = item.storeId || targetUrl.replace("/store/", "");
      void navigate({ to: "/store/$storeId", params: { storeId }, search: { sq: query, category: undefined } });
    } else if (targetUrl.startsWith("/product/")) {
      const productId = item.id.replace(/^prod-/, "") || targetUrl.replace("/product/", "");
      void navigate({ to: "/product/$productId", params: { productId }, search: { sq: query } });
    } else {
      void navigate({ to: item.url as any });
    }
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

  const shopsList = results.filter((item) => item.type === "Shop");
  const productsList = results.filter((item) => item.type === "Product");
  const brandsList = results.filter((item) => item.type === "Brand");
  const categoriesList = results.filter((item) => item.type === "Category");

  return (
    <div
      className={`w-full bg-background rounded-2xl border hairline shadow-2xl overflow-hidden max-h-[520px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 ${className}`}
    >
      <div className="sticky top-0 bg-background/95 backdrop-blur-md px-4 py-2.5 border-b border-border/50 flex items-center justify-between z-10">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Matches ({results.length})
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

      <div className="p-2 space-y-3">
        {/* 🏪 SHOPS SECTION */}
        {shopsList.length > 0 && (
          <div>
            <div className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/40 rounded-lg mb-1">
              <Store className="w-3.5 h-3.5" />
              <span>Shops ({shopsList.length})</span>
            </div>
            {shopsList.map((item) => (
              <SearchResultRow key={item.id} item={item} query={query} onClick={() => handleResultClick(item)} />
            ))}
          </div>
        )}

        {/* 🛍️ PRODUCTS SECTION */}
        {productsList.length > 0 && (
          <div>
            <div className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-primary flex items-center gap-1.5 bg-primary/10 rounded-lg mb-1">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Products ({productsList.length})</span>
            </div>
            {productsList.map((item) => (
              <SearchResultRow key={item.id} item={item} query={query} onClick={() => handleResultClick(item)} />
            ))}
          </div>
        )}

        {/* 🏷️ BRANDS SECTION */}
        {brandsList.length > 0 && (
          <div>
            <div className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 rounded-lg mb-1">
              <span>🏷️ Brands ({brandsList.length})</span>
            </div>
            {brandsList.map((item) => (
              <SearchResultRow key={item.id} item={item} query={query} onClick={() => handleResultClick(item)} />
            ))}
          </div>
        )}

        {/* 📁 CATEGORIES SECTION */}
        {categoriesList.length > 0 && (
          <div>
            <div className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg mb-1">
              <span>📁 Categories ({categoriesList.length})</span>
            </div>
            {categoriesList.map((item) => (
              <SearchResultRow key={item.id} item={item} query={query} onClick={() => handleResultClick(item)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SearchResultRow({
  item,
  query,
  onClick,
}: {
  item: SearchResultItem;
  query: string;
  onClick: () => void;
}) {
  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted/80 active:bg-muted transition-colors cursor-pointer group"
    >
      <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/40 shadow-xs">
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

      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
          <HighlightText text={item.title} query={query} />
        </h4>
        <p className="text-[11px] font-medium text-muted-foreground truncate">
          {item.subtitle}
          {item.price ? ` • ₹${item.price}` : ""}
        </p>
      </div>

      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
    </div>
  );
}
