import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { cartStore, useCart, cartTotals } from "@/lib/cart-store";
import { QtyStepper } from "@/components/qty-stepper";
import { getStore, APPROVED_STORE } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-store";
import { useDeliveryLocation } from "@/lib/location-store";
import { isValidCoordinate, haversineDistanceKm } from "@/lib/geo";
import { AVAILABLE_COUPONS, calculateBillBreakdown } from "@/lib/coupons";
import {
  ArrowRight,
  Check,
  Lock,
  MapPin,
  Package,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Tag,
  TicketPercent,
  Trash2,
  Truck,
  Zap,
} from "lucide-react";
import { m, AnimatePresence } from "motion/react";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

// ─── Suggested add-ons (simulated from store catalog) ───────────────────────
const SUGGESTIONS = [
  { id: "s1", name: "Turmeric Powder", unit: "250 g", price: 45, emoji: "🌿" },
  { id: "s2", name: "Red Chilli Powder", unit: "250 g", price: 55, emoji: "🌶️" },
  { id: "s3", name: "Cumin Seeds", unit: "200 g", price: 60, emoji: "🌾" },
  { id: "s4", name: "Mustard Seeds", unit: "200 g", price: 35, emoji: "⚫" },
  { id: "s5", name: "Coriander Seeds", unit: "200 g", price: 40, emoji: "🟢" },
];

function CartPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const cart = useCart();
  const auth = useAuth();
  const totals = cartTotals(cart.lines);
  const navigate = useNavigate();
  const isSignedIn = !!(auth.phone || auth.email);

  const [deliveryLoc] = useDeliveryLocation();
  const locLat = deliveryLoc?.lat ?? 11.0285;
  const locLng = deliveryLoc?.lng ?? 76.9258;

  const knownStore =
    cart.storeId === APPROVED_STORE.id
      ? APPROVED_STORE
      : cart.storeId
        ? getStore(cart.storeId)
        : undefined;
  const store =
    knownStore ??
    (cart.storeId && cart.lines.length > 0
      ? { ...APPROVED_STORE, id: cart.storeId, name: cart.storeName ?? "Local Shore shop" }
      : null);

  const computedDistanceKm =
    store &&
    typeof store.lat === "number" &&
    typeof store.lng === "number" &&
    isValidCoordinate(store.lat, store.lng) &&
    deliveryLoc &&
    typeof deliveryLoc.lat === "number" &&
    typeof deliveryLoc.lng === "number" &&
    isValidCoordinate(deliveryLoc.lat, deliveryLoc.lng)
      ? Math.max(
          0.1,
          Math.round(
            haversineDistanceKm(store.lat, store.lng, locLat, locLng) * 10,
          ) / 10,
        )
      : (store?.distanceKm ?? 1.2);

  const computedEtaMin =
    store &&
    typeof store.lat === "number" &&
    typeof store.lng === "number" &&
    isValidCoordinate(store.lat, store.lng) &&
    deliveryLoc &&
    typeof deliveryLoc.lat === "number" &&
    typeof deliveryLoc.lng === "number" &&
    isValidCoordinate(deliveryLoc.lat, deliveryLoc.lng)
      ? Math.max(10, Math.round(computedDistanceKm * 5 + 10))
      : (store?.etaMin ?? 25);

  const rawDeliveryFee =
    totals.subtotal > 0 ? (store ? Math.round(20 + computedDistanceKm * 6) : 25) : 0;
  const freeDeliveryTarget = 500;
  const freeDeliveryRemaining = Math.max(0, freeDeliveryTarget - totals.subtotal);
  const freeDeliveryProgress = Math.min(
    100,
    Math.round((totals.subtotal / freeDeliveryTarget) * 100),
  );

  const billBreakdown = calculateBillBreakdown({
    subtotal: totals.subtotal,
    rawDeliveryFee,
  });

  const isFreeDelivery = billBreakdown.isFreeDelivery;
  const effectiveDelivery = billBreakdown.deliveryFee;
  const total = billBreakdown.total;

  // Filter out suggestions that are already in cart
  const cartIds = new Set(cart.lines.map((l) => l.productId));
  const visibleSuggestions = SUGGESTIONS.filter((s) => !cartIds.has(s.id));

  return (
    <AppShell>
      {/* ── Purple gradient hero banner ─────────────────────────── */}
      <div className="bg-gradient-to-br from-[#6b1fa0] via-[#8b1fa8] to-[#981495] px-5 py-8 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-5">
            {/* Basket illustration placeholder */}
            <div className="hidden shrink-0 sm:block">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 text-4xl backdrop-blur-sm">
                🛒
              </div>
            </div>
            <div className="flex-1">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/70">
                <Sparkles className="h-3.5 w-3.5" />
                Your local basket
                <Sparkles className="h-3.5 w-3.5" />
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold text-white md:text-3xl">
                All good choices! 😊
              </h1>
              <p className="mt-1 text-sm text-white/75">
                You're supporting local shops and getting the best from around you.
              </p>
            </div>
            {/* Basket total pill */}
            {cart.lines.length > 0 && (
              <div className="shrink-0 rounded-2xl border border-white/25 bg-white/15 px-5 py-3 text-right backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/65">
                  Basket Total
                </p>
                <p className="mt-0.5 font-mono text-2xl font-bold text-[#ffe566]">
                  ₹{totals.subtotal}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Delivery strip ──────────────────────────────────────── */}
      <div className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center gap-8 overflow-x-auto px-5 py-2.5 text-[11px] font-semibold text-muted-foreground md:px-8 [scrollbar-width:none]">
          <span className="inline-flex shrink-0 items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            Delivering to {deliveryLoc?.area || deliveryLoc?.label || "Select your location"}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-primary" />
            ~{computedEtaMin} min delivery
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Trusted local sellers
          </span>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-5 py-6 md:px-8">
        {cart.lines.length === 0 ? (
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 rounded-3xl border border-border bg-card p-14 text-center shadow-sm"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
              🛒
            </div>
            <h2 className="mt-4 font-display text-xl font-bold text-foreground">
              Your basket is empty
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Pick a shop and add a few things — you can only order from one shop at a time.
            </p>
            <Link
              to="/"
              search={{ category: undefined, q: undefined }}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <ShoppingBag className="h-4 w-4" />
              Find a shop
            </Link>
          </m.div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_340px] pb-28 md:pb-0">
            {/* ── LEFT COLUMN ─────────────────────────────────── */}
            <div className="space-y-4">
              {/* Store info card */}
              {store && (
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <ShoppingCart className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-muted-foreground">Ordering from</p>
                      <p className="truncate font-bold text-foreground">{store.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {computedDistanceKm.toFixed(1)} km · est. {computedEtaMin} min
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Open now
                    </span>
                    <button className="ml-1 hidden text-muted-foreground hover:text-foreground sm:block">
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Cart line items */}
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <AnimatePresence initial={false}>
                  {cart.lines.map((l, idx) => (
                    <m.div
                      key={l.productId}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-center gap-3 px-4 py-4 ${idx > 0 ? "border-t border-border/60" : ""}`}
                    >
                      {/* Product thumbnail */}
                      <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                        <div className="flex h-full w-full items-center justify-center text-2xl bg-gradient-to-br from-orange-50 to-amber-50">
                          🌿
                        </div>
                      </div>

                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground line-clamp-1">
                          {l.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {l.unit} · ₹{l.price} each
                        </p>
                        <span className="mt-1 inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-emerald-600">
                          <Check className="h-3 w-3" /> Freshly packed
                        </span>
                      </div>

                      {/* Item Price Total */}
                      <span className="font-bold text-sm sm:text-base text-foreground shrink-0">
                        ₹{l.qty * l.price}
                      </span>

                      {/* Qty stepper */}
                      <QtyStepper
                        qty={l.qty}
                        onAdd={() => {}}
                        onChange={(n) => cartStore.setQty(l.productId, n)}
                        max={l.availableStock}
                      />

                      {/* Delete */}
                      <button
                        onClick={() => cartStore.setQty(l.productId, 0)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </m.div>
                  ))}
                </AnimatePresence>

                {/* Clear cart link */}
                <div className="border-t border-border/60 px-4 py-2.5 flex items-center justify-between">
                  <button
                    onClick={() => cartStore.clear()}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear cart
                  </button>
                  <span className="text-xs font-medium text-muted-foreground">
                    {totals.itemCount} {totals.itemCount === 1 ? "item" : "items"}
                  </span>
                </div>
              </div>

              {/* ── MOBILE ONLY: Detailed Bill Breakdown ── */}
              <div className="block md:hidden rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">Bill Details</p>
                  {isFreeDelivery ? (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Free Delivery Unlocked!
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Add ₹{freeDeliveryRemaining} for Free Delivery
                    </span>
                  )}
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Item subtotal</span>
                    <span className="font-semibold text-foreground">₹{totals.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Govt. Taxes &amp; GST (5% incl.)</span>
                    <span className="font-semibold text-foreground">₹{billBreakdown.gstAmount}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery fee</span>
                    <span
                      className={
                        isFreeDelivery
                          ? "font-semibold text-emerald-600"
                          : "font-semibold text-foreground"
                      }
                    >
                      {isFreeDelivery ? "FREE" : `₹${billBreakdown.deliveryFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Platform &amp; Packaging Fee</span>
                    <span className="font-semibold text-foreground">
                      {billBreakdown.platformFee === 0 ? "FREE" : `₹${billBreakdown.platformFee}`}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between text-sm font-bold text-foreground">
                    <span>Total Amount</span>
                    <span>₹{total}</span>
                  </div>
                </div>
              </div>

              {/* ── You might also need ─────────────────────── */}
              {visibleSuggestions.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                    You might also need
                    <span className="text-primary">✨</span>
                  </p>
                  <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {visibleSuggestions.map((s) => (
                      <div
                        key={s.id}
                        className="flex shrink-0 flex-col items-center gap-2 rounded-xl border border-border bg-background p-3 w-[110px]"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-2xl">
                          {s.emoji}
                        </div>
                        <div className="text-center">
                          <p className="text-[11px] font-semibold text-foreground leading-tight line-clamp-2">
                            {s.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{s.unit}</p>
                        </div>
                        <p className="font-bold text-sm text-foreground">₹{s.price}</p>
                        <button
                          onClick={() => {
                            if (store) {
                              cartStore.add(store.id, store.name, {
                                id: s.id,
                                name: s.name,
                                unit: s.unit,
                                price: s.price,
                              });
                            }
                          }}
                          className="w-full rounded-lg bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Trust badges strip ──────────────────────── */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    icon: <Truck className="h-4 w-4 text-primary" />,
                    title: "Fast local delivery",
                    sub: "20–40 mins",
                  },
                  {
                    icon: <Package className="h-4 w-4 text-primary" />,
                    title: "Freshly packed",
                    sub: "by local shops",
                  },
                  {
                    icon: <ShieldCheck className="h-4 w-4 text-primary" />,
                    title: "Secure checkout",
                    sub: "100% safe",
                  },
                  {
                    icon: <RotateCcw className="h-4 w-4 text-primary" />,
                    title: "Easy returns",
                    sub: "Hassle-free",
                  },
                ].map((b) => (
                  <div
                    key={b.title}
                    className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      {b.icon}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-foreground leading-tight">
                        {b.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{b.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Social proof ────────────────────────────── */}
              <div className="rounded-2xl border border-border bg-card px-4 py-3 text-center">
                <p className="text-xs font-semibold text-muted-foreground">
                  Loved by <span className="text-foreground font-bold">10,000+</span> customers in
                  Coimbatore ❤️
                </p>
                <div className="mt-2 flex items-center justify-center gap-6 text-xs">
                  <span className="flex items-center gap-1.5 border-r border-border pr-6">
                    <span className="text-[#4285F4] font-bold">G</span>
                    <span className="font-bold">4.6</span>
                    <span className="text-amber-400">★★★★★</span>
                  </span>
                  <span className="flex items-center gap-1.5 border-r border-border pr-6">
                    <span className="text-pink-500">✿</span>
                    <span className="font-bold">4.7</span>
                    <span className="text-amber-400">★★★★★</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold">4.5</span>
                  </span>
                  <span className="hidden sm:flex items-center gap-1.5 border-l border-border pl-6">
                    <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                    <span className="font-bold text-foreground">10K+</span>
                    <span className="text-muted-foreground">Orders delivered</span>
                  </span>
                </div>
              </div>
            </div>

            {/* ── RIGHT SIDEBAR (Desktop) ───────────────────────── */}
            <aside className="hidden md:block space-y-3 md:sticky md:top-24 md:self-start">
              {/* Free delivery progress */}
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-sm font-bold text-foreground">Unlock FREE delivery</p>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {freeDeliveryRemaining > 0
                    ? `Add ₹${freeDeliveryRemaining} more to unlock free delivery`
                    : "🎉 You've unlocked free delivery!"}
                </p>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <m.div
                    initial={{ width: 0 }}
                    animate={{ width: `${freeDeliveryProgress}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-primary">
                  <span>₹{totals.subtotal}</span>
                  <span>₹{freeDeliveryTarget}</span>
                </div>
              </div>

              {/* Savings callout */}
              {deliveryFee > 0 && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                  <div>
                    <p className="text-xs font-bold text-amber-800">
                      Yay! You're saving ₹{Math.round(deliveryFee * 0.3)} on delivery 🎉
                    </p>
                    <p className="text-[11px] text-amber-600">
                      Add more items to get FREE delivery!
                    </p>
                  </div>
                  <span className="text-2xl shrink-0">🛵</span>
                </div>
              )}

              {/* Price details */}
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">Price Details</p>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Offers Available
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Item subtotal</span>
                    <span className="font-medium text-foreground">₹{totals.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>Govt. Taxes &amp; GST (5% incl.)</span>
                    <span className="font-medium text-foreground">₹{billBreakdown.gstAmount}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>Delivery Fee</span>
                    <span
                      className={`font-medium ${isFreeDelivery ? "text-emerald-600 font-bold" : "text-foreground"}`}
                    >
                      {isFreeDelivery ? "FREE" : `₹${billBreakdown.deliveryFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>Platform &amp; Packaging Fee</span>
                    <span className="font-medium text-foreground">
                      {billBreakdown.platformFee === 0 ? "FREE" : `₹${billBreakdown.platformFee}`}
                    </span>
                  </div>
                  <div className="my-1 border-t border-border" />
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-foreground">Total Payable</span>
                    <span className="font-bold text-xl text-foreground">₹{total}</span>
                  </div>
                </div>

                {/* Primary CTA */}
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    isSignedIn
                      ? navigate({ to: "/checkout" })
                      : navigate({ to: "/auth", search: { redirect: "/checkout" } })
                  }
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-[0_4px_20px_rgba(152,20,149,0.35)] hover:bg-primary/90 transition-all"
                >
                  <Lock className="h-4 w-4" />
                  {isSignedIn ? "Proceed to checkout" : "Login to proceed"}
                </m.button>

                {/* Secondary OTP CTA */}
                {!isSignedIn && (
                  <div className="mt-3 rounded-xl border border-border p-3 text-center">
                    <button
                      onClick={() => navigate({ to: "/auth", search: { redirect: "/checkout" } })}
                      className="text-sm font-bold text-primary hover:underline"
                    >
                      Sign in with phone
                    </button>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Get fast OTP login to place your order
                    </p>
                  </div>
                )}

                {/* Safe payments badge */}
                <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 p-3">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-[11px] font-bold text-foreground">
                      Safe &amp; Secure Payments
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Your payment information is 100% secure
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* ── STICKY BOTTOM BAR FOR MOBILE ───────────────────────── */}
        {cart.lines.length > 0 && (
          <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 p-3.5 shadow-[0_-4px_25px_rgba(0,0,0,0.12)] backdrop-blur-md md:hidden">
            <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total Amount
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold font-mono text-foreground">₹{total}</span>
                  {isFreeDelivery ? (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                      FREE Del
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">incl. taxes</span>
                  )}
                </div>
              </div>
              <button
                onClick={() =>
                  isSignedIn
                    ? navigate({ to: "/checkout" })
                    : navigate({ to: "/auth", search: { redirect: "/checkout" } })
                }
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
              >
                <span>{isSignedIn ? "Proceed to checkout" : "Login to proceed"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
