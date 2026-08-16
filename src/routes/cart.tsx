import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { cartStore, useCart, cartTotals } from "@/lib/cart-store";
import { QtyStepper } from "@/components/qty-stepper";
import { getStore, APPROVED_STORE } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-store";
import {
  ArrowRight,
  Check,
  Lock,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
} from "lucide-react";
import { m } from "motion/react";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const cart = useCart();
  const auth = useAuth();
  const totals = cartTotals(cart.lines);
  const knownStore =
    cart.storeId === APPROVED_STORE.id
      ? APPROVED_STORE
      : cart.storeId
        ? getStore(cart.storeId)
        : undefined;
  const store =
    knownStore ??
    (cart.storeId && cart.lines.length > 0
      ? {
          ...APPROVED_STORE,
          id: cart.storeId,
          name: cart.storeName ?? "Local Shore shop",
        }
      : null);
  const navigate = useNavigate();
  const isSignedIn = !!(auth.phone || auth.email);

  const deliveryFee =
    totals.subtotal > 0 ? (store ? Math.round(20 + store.distanceKm * 6) : 25) : 0;
  const total = totals.subtotal + deliveryFee;
  const freeDeliveryTarget = 500;
  const freeDeliveryRemaining = Math.max(0, freeDeliveryTarget - totals.subtotal);
  const freeDeliveryProgress = Math.min(
    100,
    Math.round((totals.subtotal / freeDeliveryTarget) * 100),
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-5 pb-10 pt-8 md:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--orchid-deep)] via-[var(--orchid)] to-[var(--orchid-light)] p-6 text-primary-foreground shadow-glow md:p-8">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full border-[24px] border-white/10" />
          <div className="relative flex items-end justify-between gap-5">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
                <ShoppingBag className="h-4 w-4" /> Your local basket
              </p>
              <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">Review and place</h1>
              <p className="mt-2 max-w-lg text-sm text-primary-foreground/80">
                A few good things from a shop near you, ready for the next doorstep trip.
              </p>
            </div>
            <div className="hidden rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-right backdrop-blur sm:block">
              <p className="text-[11px] uppercase tracking-widest text-primary-foreground/65">
                Basket total
              </p>
              <p className="mt-1 font-mono text-2xl font-bold">₹{totals.subtotal}</p>
            </div>
          </div>
        </div>
      </div>

      {cart.lines.length === 0 ? (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-2 max-w-2xl rounded-2xl border border-[#ead9a8] bg-card p-10 text-center shadow-sm"
        >
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
            <ShoppingBag className="h-6 w-6" />
          </span>
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
        </m.div>
      ) : (
        <>
          <div className="mx-auto grid max-w-6xl gap-6 px-5 md:grid-cols-[1fr_340px] md:px-8">
            <div>
              <div className="rounded-2xl border border-[#ead9a8] bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Ordering from</p>
                    <p className="font-display text-lg font-bold">
                      {store?.name ?? cart.storeName}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Open now
                  </span>
                </div>
                {store && (
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {store.distanceKm.toFixed(1)} km · est. {store.etaMin} min
                  </p>
                )}
              </div>
              <m.ul initial="hidden" animate="visible" className="mt-4 space-y-3">
                {cart.lines.map((l) => (
                  <m.li
                    key={l.productId}
                    variants={{ hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0 } }}
                    className="flex items-center gap-3 rounded-2xl border border-[#ead9a8] bg-card p-3 shadow-sm transition-shadow hover:shadow-md md:p-4"
                  >
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <ShoppingBag className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{l.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.unit} · ₹{l.price} each
                      </p>
                    </div>
                    <span className="hidden font-mono text-sm font-bold sm:block">
                      ₹{l.qty * l.price}
                    </span>
                    <QtyStepper
                      qty={l.qty}
                      onAdd={() => {}}
                      onChange={(n) => cartStore.setQty(l.productId, n)}
                    />
                  </m.li>
                ))}
              </m.ul>
              <button
                onClick={() => cartStore.clear()}
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-destructive hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear cart
              </button>
            </div>

            <aside className="space-y-4 md:sticky md:top-28 md:self-start">
              <div className="rounded-2xl border border-[#ead9a8] bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="text-sm font-bold">Unlock free delivery</p>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {freeDeliveryRemaining > 0
                    ? `Add ₹${freeDeliveryRemaining} more to unlock free delivery.`
                    : "You unlocked free delivery!"}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <m.div
                    initial={{ width: 0 }}
                    animate={{ width: `${freeDeliveryProgress}%` }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
                <p className="mt-2 text-right text-[10px] font-semibold text-primary">
                  ₹{totals.subtotal} / ₹{freeDeliveryTarget}
                </p>
              </div>
              <div className="space-y-1.5 rounded-2xl border border-[#ead9a8] bg-card p-5 font-mono text-sm shadow-sm">
                <Row label="Items subtotal" value={`₹${totals.subtotal}`} />
                <Row
                  label="Delivery fee"
                  value={freeDeliveryRemaining === 0 ? "FREE" : `₹${deliveryFee}`}
                />
                <div className="my-3 h-px bg-border" />
                <Row
                  label="Total"
                  value={`₹${freeDeliveryRemaining === 0 ? totals.subtotal : total}`}
                  bold
                />
              </div>
            </aside>
          </div>

          <div className="mx-auto mt-5 flex max-w-6xl items-center justify-between gap-3 px-5 md:px-8">
            <button className="hidden"></button>
            {isSignedIn ? (
              <button
                onClick={() => navigate({ to: "/checkout" })}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:bg-teal-deep"
              >
                Continue to checkout <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => navigate({ to: "/auth", search: { redirect: "/checkout" } })}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:bg-teal-deep"
              >
                <Lock className="h-4 w-4" /> Login to proceed
              </button>
            )}
          </div>
          {!isSignedIn && (
            <p className="mx-auto mt-2 max-w-6xl px-5 text-right text-xs text-muted-foreground md:px-8">
              Sign in with your phone to place this order.
            </p>
          )}
          <div className="mx-auto mt-4 flex max-w-6xl items-center gap-5 px-5 pb-8 text-[11px] text-muted-foreground md:px-8">
            <span className="inline-flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-primary" /> Fast local delivery
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Secure checkout
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-primary" /> Freshly packed
            </span>
          </div>
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
