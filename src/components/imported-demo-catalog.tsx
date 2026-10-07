import { useState } from "react";
import { ProductThumb } from "@/components/product-thumb";
import { QtyStepper } from "@/components/qty-stepper";
import {
  getImportedDemoTotal,
  type ImportedDemoItem,
  type ImportedDemoQuantities,
} from "@/lib/imported-demo-cart";

/** Intentionally separate from cartStore and payment/order services. */
export function ImportedDemoCatalog({
  shopId,
  shopName,
  items,
  search,
  category,
}: {
  shopId: string;
  shopName: string;
  items: ImportedDemoItem[];
  search: string;
  category: string;
}) {
  const [quantities, setQuantities] = useState<ImportedDemoQuantities>({});
  const [checkout, setCheckout] = useState(false);
  const [receipt, setReceipt] = useState<{ code: string; total: number } | null>(null);
  const total = getImportedDemoTotal(items, quantities);
  const count = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  const change = (id: string, delta: number) => {
    setReceipt(null);
    setQuantities((current) => ({
      ...current,
      [id]: Math.max(0, Math.min(99, (current[id] ?? 0) + delta)),
    }));
  };
  const visible = items.filter((item) =>
    item.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {visible.map((item) => (
          <article
            key={item.id}
            className="group overflow-hidden rounded-2xl border border-slate-200/90 bg-[#fffafd] p-3 shadow-sm transition-colors hover:border-[#f0abfc]"
          >
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50/90 p-2">
              <ProductThumb
                src={item.imageUrl.replace("w=320", "w=640")}
                alt={`${item.name} representative image`}
                category={/bakery|baker/i.test(category) ? "bakery" : /furniture/i.test(category) ? "home_decor" : "individual_fashion"}
                size="lg"
              />
              <span className="absolute bottom-2 left-2 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-white">
                1 unit
              </span>
              <div
                className="absolute bottom-2 right-2 z-20"
                aria-label={`Quantity for ${item.name}`}
              >
                <QtyStepper
                  qty={quantities[item.id] ?? 0}
                  max={99}
                  onAdd={() => change(item.id, 1)}
                  onChange={(qty) => change(item.id, qty - (quantities[item.id] ?? 0))}
                  addClassName="rounded-lg border border-emerald-600 bg-[#fffafd] px-3.5 py-1 text-xs font-black uppercase text-emerald-700 shadow-sm hover:bg-emerald-600 hover:text-white"
                />
              </div>
            </div>
            <div className="mt-2.5 space-y-1">
              <p className="text-base font-black text-slate-900">
                ₹{item.price.toLocaleString("en-IN")}
              </p>
              <h3 className="line-clamp-2 text-sm font-bold text-slate-800">{item.name}</h3>
              <p className="truncate text-[11px] text-slate-500">Catalog for {shopName}</p>
              <p className="text-[10px] text-muted-foreground">Prototype item · sample price</p>
              <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                {category}
              </span>
            </div>
          </article>
        ))}
      </div>
      {!visible.length && <p className="mt-4">No demo products match your search.</p>}
      {count > 0 && (
        <section id="imported-shop-cart" className="mt-6 scroll-mt-24 rounded-2xl border bg-card p-5" aria-label="Demo cart">
          <h3 className="font-bold">Demo cart · {shopName}</h3>
          <p className="my-2">
            {count} items · sample total ₹{total.toLocaleString("en-IN")}
          </p>
          <p className="mb-4 text-xs text-muted-foreground">
            Separate from your real cart. No charge, stock reservation, or delivery.
          </p>
          <button
            type="button"
            onClick={() => setCheckout(true)}
            className="rounded-xl bg-primary px-5 py-3 text-primary-foreground"
          >
            Checkout demo cart
          </button>
        </section>
      )}
      {count > 0 && <div className="fixed bottom-20 right-4 z-40 flex max-w-[calc(100vw-2rem)] items-center gap-4 rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-xl sm:bottom-5" role="status">
        <div className="min-w-0"><p className="truncate text-xs font-semibold">{count} items · {shopName}</p><p className="font-bold">₹{total.toLocaleString("en-IN")}</p><p className="text-[10px]">Prototype cart · test checkout</p></div>
        <button type="button" onClick={() => document.getElementById("imported-shop-cart")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="shrink-0 rounded-xl bg-yellow-300 px-4 py-2 text-xs font-bold text-slate-900">View Cart</button>
      </div>}
      {checkout && count > 0 && (
        <section
          className="mt-5 rounded-2xl border border-amber-300 bg-card p-5"
          aria-label="Demo checkout"
        >
          <h3 className="text-lg font-bold">Demo checkout</h3>
          <ul className="my-3 space-y-2">
            {items
              .filter((item) => quantities[item.id])
              .map((item) => (
                <li key={item.id}>
                  {item.name} × {quantities[item.id]} — ₹
                  {(item.price * quantities[item.id]).toLocaleString("en-IN")}
                </li>
              ))}
          </ul>
          <p>Simulated total: ₹{total.toLocaleString("en-IN")} · Amount charged: ₹0</p>
          <p className="my-3 text-sm text-muted-foreground">
            These are representative demo products, not inventory confirmed by this business. No
            order is sent to the shop.
          </p>
          <button
            type="button"
            onClick={() => {
              const next = { code: `TEST-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, total };
              try {
                localStorage.setItem(
                  `localshore.imported-demo-receipt.${shopId}`,
                  JSON.stringify({
                    ...next,
                    shopId,
                    shopName,
                    items: items
                      .filter((item) => quantities[item.id])
                      .map((item) => ({ ...item, qty: quantities[item.id] })),
                    amountCharged: 0,
                  }),
                );
              } catch {
                /* Receipt can still be shown when browser storage is unavailable. */
              }
              setReceipt(next);
              setQuantities({});
              setCheckout(false);
            }}
            className="rounded-xl bg-primary px-5 py-3 text-primary-foreground"
          >
            Simulate payment · ₹0 charged
          </button>
          <button type="button" onClick={() => setCheckout(false)} className="ml-3 px-4 py-3">
            Back to cart
          </button>
        </section>
      )}
      {receipt && (
        <section role="status" className="mt-6 rounded-2xl border border-emerald-300 bg-card p-5">
          <h3 className="text-lg font-bold">Demo payment completed</h3>
          <p>
            {receipt.code} · {shopName}
          </p>
          <p>Simulated total ₹{receipt.total.toLocaleString("en-IN")} · Charged ₹0</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Test receipt only. No real order or delivery created.
          </p>
        </section>
      )}
    </>
  );
}
