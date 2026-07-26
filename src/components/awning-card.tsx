import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { categoryLabel, type Store } from "@/lib/mock-data";
import { m } from "motion/react";

export function AwningCard({ store }: { store: Store }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to="/store/$storeId"
        params={{ storeId: store.id }}
        className="group block overflow-hidden rounded-xl border border-black/[0.06] bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--sand)]">
        <img
          src={store.imageUrl}
          alt={store.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="stamp absolute left-3 top-3">Verified Local</span>
        <span className="absolute right-3 top-3 rounded-full bg-background/95 px-2 py-0.5 text-[11px] font-medium shadow-sm">
          {store.isOpen ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Open
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-destructive">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" /> Closed
            </span>
          )}
        </span>
        </div>

        <div className="p-4">
        <h3 className="truncate font-display text-lg font-bold leading-tight text-foreground">
          {store.name}
        </h3>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {categoryLabel[store.category]} · {store.tagline}
        </p>

        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-foreground">
            <Star
              className="h-3.5 w-3.5 fill-[var(--marigold)] text-[var(--marigold)]"
              strokeWidth={0}
            />
            <span className="font-mono">{store.rating.toFixed(1)}</span>
          </span>
          <span aria-hidden>·</span>
          <span className="font-mono">{store.distanceKm.toFixed(1)} km</span>
          <span aria-hidden>·</span>
          <span className="font-mono">~{store.etaMin} min</span>
        </div>
        </div>
      </Link>
    </m.div>
  );
}
