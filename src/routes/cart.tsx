import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { cartStore, useCart, cartTotals } from "@/lib/cart-store";
import { QtyStepper } from "@/components/qty-stepper";
import { getStore } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-store";
import { Trash2, Lock } from "lucide-react";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  const auth = useAuth();
  const totals = cartTotals(cart.lines);
  const store = cart.storeId ? getStore(cart.storeId) : null;
  const navigate = useNavigate();
  const isSignedIn = !!(auth.phone || auth.email);

  const deliveryFee =
    totals.subtotal > 0 ? (store ? Math.round(20 + store.distanceKm * 6) : 25) : 0;
  const total = totals.subtotal + deliveryFee;

  return (
    <AppShell>
      <div className="px-5 pt-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Your cart
        </p>
        <h1 className="mt-1 font-display text-3xl">Review and place</h1>
      </div>

      {cart.lines.length === 0 ? (
        <div className="mx-5 mt-8 rounded-xl border hairline bg-card p-8 text-center">
          <p className="font-display text-lg">Cart is empty.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a shop and add a few things — you can only order from one shop at a time.
          </p>
          <Link
            to="/"
            search={{ category: undefined, q: undefined }}
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Find a shop
          </Link>
        </div>
      ) : (
        <>
          <div className="mx-5 mt-4 rounded-xl bg-card p-4 ring-1 ring-black/[0.04]">
            <p className="text-xs text-muted-foreground">Ordering from</p>
            <p className="font-display text-lg">{store?.name ?? cart.storeName}</p>
            {store && (
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {store.distanceKm.toFixed(1)} km · est. {store.etaMin} min
              </p>
            )}
          </div>

          <ul className="mx-5 mt-4 divide-y divide-[color-mix(in_oklab,var(--teal)_15%,transparent)] rounded-xl bg-card ring-1 ring-black/[0.04]">
            {cart.lines.map((l) => (
              <li key={l.productId} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{l.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {l.unit} · ₹{l.price}
                  </p>
                </div>
                <span className="font-mono text-sm">₹{l.qty * l.price}</span>
                <QtyStepper
                  qty={l.qty}
                  onAdd={() => {}}
                  onChange={(n) => cartStore.setQty(l.productId, n)}
                />
              </li>
            ))}
          </ul>

          <div className="mx-5 mt-4 space-y-1.5 rounded-xl bg-card p-4 ring-1 ring-black/[0.04] font-mono text-sm">
            <Row label="Items subtotal" value={`₹${totals.subtotal}`} />
            <Row label="Delivery fee" value={`₹${deliveryFee}`} />
            <div className="my-2 h-px bg-[color-mix(in_oklab,var(--teal)_20%,transparent)]" />
            <Row label="Total" value={`₹${total}`} bold />
          </div>

          <div className="mx-5 mt-4 flex items-center justify-between">
            <button
              onClick={() => cartStore.clear()}
              className="inline-flex items-center gap-1.5 text-xs text-destructive hover:underline"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear cart
            </button>
            {isSignedIn ? (
              <button
                onClick={() => navigate({ to: "/checkout" })}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-teal-deep"
              >
                Continue to checkout
              </button>
            ) : (
              <button
                onClick={() => navigate({ to: "/auth", search: { redirect: "/checkout" } })}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-teal-deep"
              >
                <Lock className="h-4 w-4" /> Login to proceed
              </button>
            )}
          </div>
          {!isSignedIn && (
            <p className="mx-5 mt-2 text-right text-xs text-muted-foreground">
              Sign in with your phone to place this order.
            </p>
          )}
        </>
      )}
    </AppShell>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      <span className={bold ? "text-base font-semibold" : ""}>{value}</span>
    </div>
  );
}
