import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Search, Star } from "lucide-react";
import {
  getStore, APPROVED_STORE,
  productsByStore,
  categoryColor,
  categoryLabel,
  type Product,
  type Store,
} from "@/lib/mock-data";
import { cartStore, useCart, cartTotals } from "@/lib/cart-store";
import { QtyStepper } from "@/components/qty-stepper";
import { ProductThumb } from "@/components/product-thumb";

export const Route = createFileRoute("/store/$storeId")({
  loader: ({ params }): { store: Store; products: Product[] } => {
    const store = params.storeId === APPROVED_STORE.id ? APPROVED_STORE : getStore(params.storeId);
    if (!store) throw notFound();
    return { store, products: productsByStore[store.id] ?? [] };
  },
  component: StorePage,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <p className="font-display text-2xl">Shop not found</p>
        <Link
          to="/"
          search={{ category: undefined, q: undefined }}
          className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline"
        >
          Back to shops
        </Link>
      </div>
    </div>
  ),
});

function StorePage() {
  const loaded = Route.useLoaderData() as { store: Store; products: Product[] };
  const approved = useQuery({
    queryKey: ["approved-products"],
    enabled: loaded.store.id === APPROVED_STORE.id,
    queryFn: async () => {
      let { data, error } = await (supabase as any)
        .from("approved_product_catalog")
        .select("id,name,category,selling_price,image_url,stock")
        .order("created_at", { ascending: false });
      // Keep existing deployments working until the catalog view migration is applied.
      if (error) {
        const fallback = await (supabase as any)
          .from("products")
          .select("id,name,category,selling_price,image_url,stock")
          .in("status", ["active", "approved"])
          .order("created_at", { ascending: false });
        data = fallback.data;
        error = fallback.error;
      }
      if (error) throw error;
      return Promise.all((data ?? []).map(async (p: any) => {
        const rawImage = p.image_url ?? "";
        let imageUrl = rawImage;
        if (rawImage && !/^(https?:|data:)/i.test(rawImage)) {
          const { data: signed } = await supabase.storage
            .from("product-images")
            .createSignedUrl(rawImage, 60 * 60);
          imageUrl = signed?.signedUrl ?? "";
        }
        return { id: p.id, storeId: APPROVED_STORE.id, name: p.name, unit: p.category ?? "", price: Number(p.selling_price), imageUrl, category: p.category ?? "Other" };
      }));
    },
  });
  const store = loaded.store;
  const products = (loaded.store.id === APPROVED_STORE.id ? (approved.data ?? []) : loaded.products) as Product[];
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const cart = useCart();
  const totals = cartTotals(cart.lines);

  const grouped = useMemo(() => {
    const q = query.toLowerCase();
    const filtered = query ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
    const g = new Map<string, typeof products>();
    filtered.forEach((p) => {
      if (!g.has(p.category)) g.set(p.category, []);
      g.get(p.category)!.push(p);
    });
    return Array.from(g.entries());
  }, [products, query]);

  const qtyOf = (id: string) => cart.lines.find((l) => l.productId === id)?.qty ?? 0;
  const color = categoryColor[store.category];

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="mx-auto max-w-6xl px-0 md:px-6 md:pt-6">
        {/* Header */}
        <div className="relative overflow-hidden bg-card md:rounded-2xl md:border md:hairline">
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--sand)] md:aspect-[21/7]">
            <img src={store.imageUrl} alt={store.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            <Link
              to="/"
              search={{ category: undefined, q: undefined }}
              className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur"
            >
              <ArrowLeft className="h-4 w-4" /> All shops
            </Link>
            <span className="stamp absolute right-3 top-3 bg-background/90 backdrop-blur">
              Verified Local
            </span>
          </div>
          <div className="awning h-2" style={{ ["--awning-color" as string]: color }} aria-hidden />
          <div className="px-5 pb-5 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl leading-tight">{store.name}</h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  {categoryLabel[store.category]} · {store.tagline}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{store.address}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 text-foreground">
                <Star
                  className="h-3.5 w-3.5 fill-[var(--marigold)] text-[var(--marigold)]"
                  strokeWidth={0}
                />
                <span className="font-mono">{store.rating.toFixed(1)}</span>
              </span>
              <span className="font-mono">{store.distanceKm.toFixed(1)} km</span>
              <span className="font-mono">~{store.etaMin} min</span>
              <span className="ml-auto">
                {store.isOpen ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    Open now
                  </span>
                ) : (
                  <span className="text-destructive">Closed</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="sticky top-0 z-20 bg-background/95 px-5 py-3 backdrop-blur md:top-16 md:px-0 md:pt-6">
          <label className="flex items-center gap-2 rounded-xl bg-card px-3 py-2.5 ring-1 ring-black/[0.04]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search in ${store.name}`}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
        </div>

        {/* Products */}
        <div className="px-5 pb-6 md:px-0">
          {grouped.length === 0 ? (
            <p className="rounded-xl border hairline bg-card p-6 text-center text-sm text-muted-foreground">
              Nothing matches that in this shop. Try another word.
            </p>
          ) : (
            grouped.map(([cat, items]) => (
              <section key={cat} className="mt-5">
                <h2 className="font-display text-sm uppercase tracking-wide text-muted-foreground">
                  {cat}
                </h2>
                <ul className="mt-2 grid grid-cols-1 gap-0 divide-y divide-[color-mix(in_oklab,var(--teal)_15%,transparent)] rounded-xl bg-card ring-1 ring-black/[0.04] md:grid-cols-2 md:divide-y-0 md:gap-3 md:bg-transparent md:ring-0">
                  {items.map((p) => {
                    const q = qtyOf(p.id);
                    return (
                      <li
                        key={p.id}
                        className="flex items-center gap-3 p-3 md:rounded-xl md:bg-card md:ring-1 md:ring-black/[0.04]"
                      >
                        <ProductThumb src={p.imageUrl} alt={p.name} category={store.category} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.unit}</p>
                        </div>
                        <span className="font-mono text-sm">₹{p.price}</span>
                        <QtyStepper
                          qty={q}
                          onAdd={() => cartStore.add(store.id, store.name, p)}
                          onChange={(n) => cartStore.setQty(p.id, n)}
                        />
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>

      {/* Sticky cart bar */}
      {totals.itemCount > 0 && cart.storeId === store.id && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t hairline bg-primary text-primary-foreground">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 md:px-6">
            <div className="text-sm">
              <p className="font-mono text-[10px] uppercase tracking-widest opacity-80">
                {totals.itemCount} item{totals.itemCount > 1 ? "s" : ""} · from {store.name}
              </p>
              <p className="font-display text-lg">₹{totals.subtotal}</p>
            </div>
            <button
              onClick={() => navigate({ to: "/cart" })}
              className="rounded-lg bg-[var(--marigold)] px-4 py-2 text-sm font-semibold text-ink hover:brightness-105"
            >
              Review cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
