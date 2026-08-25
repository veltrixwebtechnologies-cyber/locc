import { Map, List } from "lucide-react";

interface Props {
  view: "map" | "list";
  onViewChange: (view: "map" | "list") => void;
  itemCount: number;
  productQuery?: string;
}

export function MapListToggle({ view, onViewChange, itemCount, productQuery }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-2 shadow-xs">
      {/* Search status caption */}
      <div className="flex items-center gap-2 pl-2">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <p className="text-xs font-semibold text-foreground">
          {productQuery ? (
            <>
              Showing results for <strong className="text-primary">"{productQuery}"</strong>
            </>
          ) : (
            "Explore nearby verified shops"
          )}
        </p>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-bold text-primary">
          {itemCount} {itemCount === 1 ? "shop" : "shops"}
        </span>
      </div>

      {/* Segmented Control */}
      <div className="flex items-center rounded-xl bg-muted p-1">
        <button
          onClick={() => onViewChange("map")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
            view === "map"
              ? "bg-primary text-primary-foreground shadow-sm scale-105"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Map className="h-3.5 w-3.5" />
          <span>🗺️ Map</span>
        </button>

        <button
          onClick={() => onViewChange("list")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
            view === "list"
              ? "bg-primary text-primary-foreground shadow-sm scale-105"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <List className="h-3.5 w-3.5" />
          <span>📋 List</span>
        </button>
      </div>
    </div>
  );
}
