import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Search, Star } from "lucide-react";
import {
  getStore,
  APPROVED_STORE,
  productsByStore,
  categoryColor,
  categoryLabel,
  type Product,
  type Store,
} from "@/lib/mock-data";
import { cartStore, useCart, cartTotals } from "@/lib/cart-store";
import { QtyStepper } from "@/components/qty-stepper";
import { ProductThumb } from "@/components/product-thumb";
import { recordProductEvent, recordRecentProductView } from "@/lib/merchandising";
import { WishlistButton } from "@/components/wishlist-button";
import { flyProductToCart } from "@/lib/fly-to-cart";
import { m } from "motion/react";

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const toStoreCategory = (value?: string | null): Store["category"] => {
  const category = (value ?? "").toLowerCase();
  if (category.includes("pharma") || category.includes("wellness")) return "pharmacy";
  if (category.includes("station") || category.includes("book")) return "stationery";
  if (category.includes("bake") || category.includes("food")) return "bakery";
  return "grocery";
};

export const Route = createFileRoute("/store/$storeId")({
  loader: ({ params }): { store: Store; products: Product[] } => {
    const store =
      params.storeId === APPROVED_STORE.id
        ? APPROVED_STORE
        : (getStore(params.storeId) ??
          (isUuid(params.storeId) ? { ...APPROVED_STORE, id: params.storeId } : undefined));
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
    queryKey: ["approved-store", loaded.store.id],
    enabled: loaded.store.id === APPROVED_STORE.id || isUuid(loaded.store.id),
    queryFn: async () => {
      let productQuery = (supabase as any)
        .from("approved_product_catalog")
        .select("id,seller_id,name,category,selling_price,image_url,stock")
        .order("created_at", { ascending: false });
      if (loaded.store.id !== APPROVED_STORE.id) {
        productQuery = productQuery.eq("seller_id", loaded.store.id);
      }
      let { data, error } = await productQuery;
      // Keep existing deployments working until the catalog view migration is applied.
      if (error) {
        let fallbackQuery = (supabase as any)
          .from("products")
          .select("id,seller_id,name,category,selling_price,image_url,stock")
          .in("status", ["active", "approved"])
          .order("created_at", { ascending: false });
        if (loaded.store.id !== APPROVED_STORE.id) {
          fallbackQuery = fallbackQuery.eq("seller_id", loaded.store.id);
        }
        const fallback = await fallbackQuery;
        data = fallback.data;
        error = fallback.error;
      }
      if (error) throw error;
      const products = await Promise.all(
        (data ?? []).map(async (p: any) => {
          const rawImage = p.image_url ?? "";
          let imageUrl = rawImage;
          if (rawImage && !/^(https?:|data:)/i.test(rawImage)) {
            const { data: signed } = await supabase.storage
              .from("product-images")
              .createSignedUrl(rawImage, 60 * 60);
            imageUrl = signed?.signedUrl ?? "";
          }
          return {
            id: p.id,
            storeId: p.seller_id ?? APPROVED_STORE.id,
            name: p.name,
            unit: p.category ?? "",
            price: Number(p.selling_price),
            imageUrl,
            category: p.category ?? "Other",
            stock: Number(p.stock),
          };
        }),
      );

      if (loaded.store.id === APPROVED_STORE.id) return { products, store: null };

      const { data: vendor, error: vendorError } = await (supabase as any)
        .from("approved_vendor_catalog")
        .select(
          "id,shop_name,business_type,city,state,address_line1,category,shop_logo_path,shop_banner_path",
        )
        .eq("id", loaded.store.id)
        .maybeSingle();
      if (vendorError) throw vendorError;

      let imageUrl = APPROVED_STORE.imageUrl;
      const storefrontPath = vendor?.shop_banner_path || vendor?.shop_logo_path;
      if (storefrontPath) {
        const { data: signed } = await supabase.storage
          .from("seller-docs")
          .createSignedUrl(storefrontPath, 60 * 60);
        imageUrl = signed?.signedUrl ?? imageUrl;
      }

      return {
        products,
        store: vendor
          ? ({
            ...APPROVED_STORE,
            id: vendor.id,
            name: vendor.shop_name || APPROVED_STORE.name,
            category: toStoreCategory(vendor.category),
            tagline: vendor.business_type || "Approved local vendor",
            address:
              [vendor.address_line1, vendor.city, vendor.state].filter(Boolean).join(", ") ||
              APPROVED_STORE.address,
            imageUrl,
          } as Store)
          : null,
      };
    },
  });
  const store = approved.data?.store ?? loaded.store;
  const products = (
    loaded.store.id === APPROVED_STORE.id || isUuid(loaded.store.id)
      ? (approved.data?.products ?? [])
      : loaded.products
  ) as Product[];
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
  const catalogItems = useMemo(() => grouped.flatMap(([, items]) => items), [grouped]);

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
        <div className="relative z-10 bg-background px-5 py-3 md:px-0 md:pt-4">
          <label className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2.5 shadow-sm">
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
        <div className="grid gap-5 px-5 pb-6 md:grid-cols-[150px_minmax(0,1fr)] md:px-0">
          <aside className="hidden md:block">
            <div className="sticky top-28 rounded-xl border border-purple-200 bg-card p-2">
              <p className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Categories
              </p>
              <nav className="space-y-1">
                {grouped.map(([cat, items]) => (
                  <a
                    key={`rail-${cat}`}
                    href="#catalog"
                    className="block rounded-lg px-2 py-2 text-xs font-medium text-foreground/75 hover:bg-muted hover:text-primary"
                  >
                    {cat}
                    <span className="mt-0.5 block text-[10px] text-muted-foreground">
                      {items.length} items
                    </span>
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <main>
            {grouped.length === 0 ? (
              <p className="rounded-xl border hairline bg-card p-6 text-center text-sm text-muted-foreground">
                Nothing matches that in this shop. Try another word.
              </p>
            ) : (
              [{ cat: "All products", items: catalogItems }].map(({ cat, items }) => (
                <section key={cat} id="catalog" className="mt-5 scroll-mt-28">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-sm uppercase tracking-wide text-muted-foreground">
                      {cat}
                    </h2>
                    <span className="text-[10px] text-muted-foreground">{items.length} items</span>
                  </div>
                  <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {items.map((p) => {
                      const q = qtyOf(p.id);
                      const mrp = Math.round(p.price * 1.25);
                      return (
                        <m.li
                          key={p.id}
                          data-product-id={p.id}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, amount: 0.15 }}
                          whileHover={{ y: -4, scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-purple-200 bg-white p-3.5 shadow-xs transition-all duration-300 hover:border-purple-400 hover:shadow-md"
                        >
                          <div className="absolute right-2.5 top-2.5 z-10">
                            <WishlistButton
                              productId={p.id}
                              productName={p.name}
                              item={{
                                productId: p.id,
                                name: p.name,
                                shopName: store.name,
                                category: p.category,
                                price: p.price,
                                imageUrl: p.imageUrl,
                                sellerId: p.storeId,
                              }}
                            />
                          </div>

                          <Link
                            to="/product/$productId"
                            params={{ productId: p.id }}
                            onClick={() => {
                              void recordProductEvent(p.id, "view");
                              void recordRecentProductView(p.id);
                            }}
                            className="flex flex-col h-full"
                          >
                            <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-50 p-2 flex items-center justify-center border border-purple-200/40 relative">
                              <ProductThumb
                                src={p.imageUrl}
                                alt={p.name}
                                category={store.category}
                                size="lg"
                              />
                            </div>
                            <div className="mt-3 flex flex-col justify-between flex-1">
                              <div>
                                <h3 className="line-clamp-1 text-sm font-bold text-slate-800 group-hover:text-purple-700 transition-colors">
                                  {p.name}
                                </h3>
                                <div className="mt-1 flex items-baseline gap-2">
                                  <span className="text-sm font-black text-slate-900">
                                    ₹{p.price}
                                  </span>
                                  <span className="text-[11px] font-medium text-slate-400 line-through">
                                    ₹{mrp}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-xs font-black text-purple-700">
                                  20% OFF
                                </p>
                              </div>
                            </div>
                          </Link>

                          <div className="mt-3 pt-2 border-t border-slate-100">
                            <QtyStepper
                              qty={q}
                              max={p.stock}
                              onAdd={() => {
                                void recordProductEvent(p.id, "add_to_cart");
                                flyProductToCart(p.id);
                                cartStore.add(p.storeId, store.name, p);
                              }}
                              onChange={(n) => cartStore.setQty(p.id, n)}
                              addClassName="w-full rounded-xl bg-purple-50 py-1.5 text-xs font-bold text-purple-700 border border-purple-200/60 transition hover:bg-purple-700 hover:text-white"
                            />
                          </div>
                        </m.li>
                      );
                    })}
                  </ul>
                </section>
              ))
            )}
          </main>
        </div>
      </div>

      {/* Sticky cart bar */}
      {totals.itemCount > 0 && (cart.storeId === store.id || store.id === APPROVED_STORE.id) && (
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
