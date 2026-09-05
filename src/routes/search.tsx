import { useState, useMemo, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { getInstantSearchResults, SearchResultItem } from "@/lib/search-service";
import { HighlightText } from "@/components/ui/swiggy-instant-search-dropdown";
import { ChevronLeft, X, Search as SearchIcon, Utensils, Store } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/search")({
  component: SwiggySearchPage,
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || "",
  }),
});

function SwiggySearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [query, setQuery] = useState(q || "");

  useEffect(() => {
    setQuery(q || "");
  }, [q]);

  const results = useMemo(() => {
    return getInstantSearchResults(query);
  }, [query]);

  const handleClear = () => {
    setQuery("");
    void navigate({ to: "/search", search: { q: "" } });
  };

  const handleBack = () => {
    if (query) {
      handleClear();
    } else {
      window.history.back();
    }
  };

  const handleResultClick = (item: SearchResultItem) => {
    void navigate({ to: item.url as any });
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-20 pt-4 px-4 sm:px-6 max-w-4xl mx-auto">
        {/* Swiggy Style Search Bar Container */}
        <div className="relative mb-6">
          <div className="flex items-center gap-3 bg-background border border-border/80 rounded-2xl px-4 py-3 shadow-md focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all">
            <button
              type="button"
              onClick={handleBack}
              className="p-1 hover:bg-muted rounded-full text-foreground/80 transition-colors"
              title="Back"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>

            <input
              type="text"
              value={query}
              onChange={(e) => {
                const val = e.target.value;
                setQuery(val);
                void navigate({ to: "/search", search: { q: val } });
              }}
              placeholder="Search for restaurants, shops, dishes or products"
              className="flex-1 bg-transparent text-base md:text-lg font-medium text-foreground outline-none placeholder:text-muted-foreground/70"
              autoFocus
            />

            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
                title="Clear"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>

        {/* Results Section */}
        {query.trim() === "" ? (
          <div className="max-w-xl mx-auto mt-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Popular Searches
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: "Haribhavanam", sub: "Restaurant", q: "har" },
                { name: "Chicken Harissa", sub: "Dish", q: "harissa" },
                { name: "Paneer Hariyali", sub: "Dish", q: "hariyali" },
                { name: "Flour & Masala Mill", sub: "Shop", q: "flour" },
                { name: "Palamuthir Nilayam", sub: "Shop", q: "palamuthir" },
                { name: "Mutton & Farm Chicken", sub: "Meat & Seafood", q: "mutton" },
              ].map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    setQuery(item.q);
                    void navigate({ to: "/search", search: { q: item.q } });
                  }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border hairline hover:bg-muted/70 transition-colors text-left group shadow-xs"
                >
                  <div className="p-2 rounded-xl bg-muted group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary transition-colors">
                    <SearchIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
              <SearchIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No matches found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              We couldn't find anything matching "{query}". Try searching for "Haribhavanam" or "Harissa".
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-2">
            <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
              <span>Search Results ({results.length})</span>
            </div>

            <div className="bg-card border hairline rounded-2xl overflow-hidden divide-y divide-border/40 shadow-sm">
              {results.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleResultClick(item)}
                  className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/70 active:bg-muted transition-colors cursor-pointer group"
                >
                  {/* Square Image Thumbnail */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/40 shadow-xs">
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

                  {/* Title & Subtitle */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      <HighlightText text={item.title} query={query} />
                    </h4>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {item.subtitle}
                      {item.price ? ` • ₹${item.price}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
