import { useState } from "react";
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
}: {
  shopId: string;
  shopName: string;
  items: ImportedDemoItem[];
  search: string;
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
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
        {visible.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <img
              src={item.imageUrl.replace("w=320", "w=640")}
              alt={`${item.name} representative demo image`}
              loading="lazy"
              className="aspect-square w-full bg-muted object-cover"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = "/placeholder.svg";
              }}
            />
            <div className="space-y-2 p-4">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-xs text-muted-foreground">
                Demo product · sample price · not shop stock
              </p>
              <p className="font-bold">₹{item.price.toLocaleString("en-IN")}</p>
              {quantities[item.id] ? (
                <div className="flex items-center justify-between rounded-xl border">
                  <button
                    type="button"
                    aria-label={`Remove one ${item.name}`}
                    onClick={() => change(item.id, -1)}
                    className="px-4 py-2"
                  >
                    −
                  </button>
                  <span>{quantities[item.id]}</span>
                  <button
                    type="button"
                    aria-label={`Add one ${item.name}`}
                    onClick={() => change(item.id, 1)}
                    disabled={quantities[item.id] >= 99}
                    className="px-4 py-2"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => change(item.id, 1)}
                  className="w-full rounded-xl bg-primary px-4 py-2 text-primary-foreground"
                >
                  Add to demo cart
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {!visible.length && <p className="mt-4">No demo products match your search.</p>}
      {count > 0 && (
        <section className="mt-6 rounded-2xl border bg-card p-5" aria-label="Demo cart">
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
