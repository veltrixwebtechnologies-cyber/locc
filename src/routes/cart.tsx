import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { cartStore, useCart, cartTotals } from "@/modules/shopper/services/cart-store";
import { persistentCart } from "@/modules/shopper/services/persistent-cart";
import { QtyStepper } from "@/components/qty-stepper";
import { getStore, APPROVED_STORE, productsByStore, type StoreCategory } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-store";
import { useDeliveryLocation } from "@/lib/location-store";
import { isValidCoordinate, haversineDistanceKm } from "@/lib/geo";
import { calculateDynamicETA } from "@/lib/ml-eta-engine";
import { AVAILABLE_COUPONS, calculateBillBreakdown } from "@/lib/coupons";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Lock,
  MapPin,
  Package,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Tag,
  TicketPercent,
  Trash2,
  Truck,
  Zap,
  Store,
  Sparkles,
  ChevronRight,
  BadgePercent,
  Shield,
  Plus,
} from "lucide-react";
import { m, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { CartRelatedProducts } from "@/components/related-products-section";
import { CartNearbyShops } from "@/modules/shopper/components/cart-nearby-shops";
import { useShopCoordinates } from "@/hooks/use-shop-coordinates";
import { ProductThumb } from "@/components/product-thumb";
import { getFallbackProductImage } from "@/lib/image-utils";

const cartCatalog = Object.values(productsByStore).flat();

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const cart = useCart();
  const isImportedCart = Boolean(cart.storeId?.startsWith("imported:"));
  const auth = useAuth();
  const totals = cartTotals(cart.lines);
  const navigate = useNavigate();
  const isSignedIn = !!(auth.phone || auth.email);

  const [deliveryLoc] = useDeliveryLocation();

  const knownStore =
    cart.storeId === APPROVED_STORE.id
      ? APPROVED_STORE
      : cart.storeId
        ? getStore(cart.storeId)
        : undefined;
  const store =
    knownStore ??
    (cart.storeId && cart.lines.length > 0
      ? { ...APPROVED_STORE, id: cart.storeId, name: cart.storeName ?? "Local Shore shop", lat: NaN, lng: NaN }
      : null);

  const shopCoordinates = useShopCoordinates(cart.storeId);
  const shopPin = shopCoordinates.data ?? knownStore;

  const computedDistanceKm =
    shopPin &&
    isValidCoordinate(shopPin.lat, shopPin.lng) &&
    deliveryLoc &&
    typeof deliveryLoc.lat === "number" &&
    typeof deliveryLoc.lng === "number" &&
    isValidCoordinate(deliveryLoc.lat, deliveryLoc.lng)
      ? haversineDistanceKm(shopPin.lat, shopPin.lng, deliveryLoc.lat, deliveryLoc.lng)
      : NaN;

  const dynamicEta =
    Number.isFinite(computedDistanceKm) &&
    deliveryLoc &&
    typeof deliveryLoc.lat === "number" &&
    typeof deliveryLoc.lng === "number" &&
    isValidCoordinate(deliveryLoc.lat, deliveryLoc.lng) &&
    shopPin
      ? calculateDynamicETA({
          userLat: deliveryLoc.lat,
          userLng: deliveryLoc.lng,
          shopLat: shopPin.lat,
          shopLng: shopPin.lng,
          itemCount: cart.lines.reduce((acc, l) => acc + l.qty, 0) || 1,
        })
      : null;

  const computedEtaMin = dynamicEta ? dynamicEta.minMins : NaN;

  const rawDeliveryFee =
    totals.subtotal > 0 ? (Number.isFinite(computedDistanceKm) ? Math.round(20 + computedDistanceKm * 6) : 25) : 0;
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

  const bestCoupon = AVAILABLE_COUPONS.filter((c) => totals.subtotal >= c.minOrder)
    .sort((a, b) => (b.maxDiscount || b.discountValue) - (a.maxDiscount || a.discountValue))[0] || null;

  const inCartIds = new Set(cart.lines.map((l) => l.productId));
  const storeProducts = (store?.id && productsByStore[store.id]) || [];
  const availableStoreAddOns = storeProducts.filter((p) => !inCartIds.has(p.id));

  const fallbackImpulse = [
    { id: `${store?.id || "local"}-impulse-lemon`, name: "Fresh Juicy Lemons", unit: "4 pcs", price: 20, imageUrl: "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=300&q=75" },
    { id: `${store?.id || "local"}-impulse-mint`, name: "Fresh Mint & Coriander", unit: "1 bunch", price: 15, imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=75" },
    { id: `${store?.id || "local"}-impulse-curd`, name: "Fresh Farm Curd / Dahi", unit: "400g pouch", price: 35, imageUrl: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=300&q=75" },
    { id: `${store?.id || "local"}-impulse-chips`, name: "Classic Salted Crisps", unit: "50g pack", price: 20, imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=300&q=75" },
  ];

  const impulseItems = availableStoreAddOns.length >= 4
    ? availableStoreAddOns.slice(0, 4)
    : [...availableStoreAddOns, ...fallbackImpulse.filter((f) => !inCartIds.has(f.id))].slice(0, 4);

  return (
    <AppShell>
      {/* ── Stepper & Header ────────────────────────────────── */}
      <div className="border-b border-border/80 bg-gradient-to-r from-primary/[0.06] via-card to-primary/[0.02] px-4 py-6 sm:px-6 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
            <span className="font-bold text-primary">1. Basket Review</span>
            <span>/</span>
            <span className="text-muted-foreground/60">2. Checkout &amp; Address</span>
            <span>/</span>
            <span className="text-muted-foreground/60">3. Payment</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Your Shopping Basket
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Review your items from your local neighborhood vendor
              </p>
            </div>

            {store && cart.lines.length > 0 && (
              <div className="inline-flex items-center gap-3 rounded-2xl bg-card border border-border/80 px-4 py-2.5 shadow-2xs">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-base">
                  {store.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display text-xs sm:text-sm font-bold text-foreground truncate max-w-[170px]">
                      {store.name}
                    </span>
                    <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <Zap className="h-3 w-3 fill-emerald-600 text-emerald-600" />
                      ~{computedEtaMin || 20}m
                    </span>
                    <span>·</span>
                    <span>{Number.isFinite(computedDistanceKm) ? `${computedDistanceKm.toFixed(1)} km` : "Express"}</span>
                  </div>
                </div>
                <Link
                  to="/store/$storeId"
                  params={{ storeId: store.id }}
                  search={{ shopLat: shopPin?.lat, shopLng: shopPin?.lng }}
                  className="ml-2 hidden sm:inline-flex items-center gap-1 rounded-lg border border-border/70 hover:border-primary/40 px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
                >
                  <span>Shop more</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Delivery Info Bar ──────────────────────────────────────── */}
      <div className="border-b border-border/70 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 overflow-x-auto px-4 py-2 text-xs font-medium text-muted-foreground sm:px-6 md:px-8 [scrollbar-width:none]">
          <div className="flex items-center gap-6 shrink-0">
            <span className="inline-flex items-center gap-1.5 text-foreground font-semibold">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>Delivering to {deliveryLoc?.area || deliveryLoc?.label || "Select your location"}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
              <Zap className="h-3.5 w-3.5 text-emerald-600" />
              <span>{Number.isFinite(computedEtaMin) ? `~${computedEtaMin} min estimated delivery` : "Express doorstep dispatch"}</span>
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>100% Genuine Local Storefront</span>
            </span>
          </div>

          {cart.lines.length > 0 && (
            <span className="font-mono text-xs font-bold text-primary shrink-0">
              {totals.itemCount} {totals.itemCount === 1 ? "item" : "items"} in basket
            </span>
          )}
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:px-8">
        {cart.lines.length === 0 ? (
          !persistentCart.isRestored() ? (
            <div className="mt-8 rounded-3xl border border-border bg-card p-14 text-center shadow-xs animate-pulse">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10" />
              <div className="mx-auto mt-4 h-6 w-48 rounded-md bg-muted" />
              <div className="mx-auto mt-2 h-4 w-72 rounded-md bg-muted" />
            </div>
          ) : (
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-lg mt-8 rounded-3xl border border-border/80 bg-card p-8 sm:p-12 text-center shadow-xs"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary ring-8 ring-primary/5 shadow-inner">
                <ShoppingBag className="h-10 w-10" strokeWidth={1.75} />
              </div>
              <h2 className="mt-5 font-display text-2xl font-black text-foreground">
                Your basket is empty
              </h2>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Explore nearby verified neighborhood shops, pick your favorite items, and enjoy lightning fast delivery to your doorstep.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/"
                  search={{ category: undefined, q: undefined }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-display text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Store className="h-4 w-4" />
                  <span>Discover Nearby Shops</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Quick Category Jump Chips */}
              <div className="mt-8 pt-6 border-t border-border/60">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Popular Categories:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    { label: "🥦 Groceries", cat: "Groceries" },
                    { label: "🥖 Bakery", cat: "Bakery" },
                    { label: "👗 Fashion", cat: "Clothing" },
                    { label: "📱 Tech", cat: "Electronics" },
                    { label: "💊 Care", cat: "Pharmacy" },
                  ].map((chip) => (
                    <Link
                      key={chip.label}
                      to="/"
                      search={{ category: chip.cat, q: undefined }}
                      className="rounded-full border border-border/80 bg-background/80 hover:border-primary/40 px-3 py-1 text-xs font-semibold text-foreground/80 hover:text-primary transition-all"
                    >
                      {chip.label}
                    </Link>
                  ))}
                </div>
              </div>
            </m.div>
          )
        ) : (
          <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-12 pb-36 lg:pb-12">
            {/* ── LEFT COLUMN ─────────────────────────────────── */}
            <div className="min-w-0 lg:col-span-7 xl:col-span-8 space-y-5">
              {/* Free delivery progress card */}
              <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${isFreeDelivery ? "bg-emerald-100 text-emerald-700" : "bg-primary/10 text-primary"}`}>
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-foreground">
                        {isFreeDelivery ? "Free Delivery Unlocked! 🎉" : "Free Delivery Milestone"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {freeDeliveryRemaining > 0
                          ? `Add ₹${freeDeliveryRemaining} more to get FREE express delivery`
                          : "Your order qualifies for zero delivery fee!"}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                    isFreeDelivery
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                      : "bg-primary/5 border-primary/20 text-primary"
                  }`}>
                    {isFreeDelivery ? "FREE DEL" : `₹${freeDeliveryRemaining} left`}
                  </span>
                </div>

                {/* Animated Progress Bar */}
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted/60 p-0.5 border border-border/40">
                  <m.div
                    initial={{ width: 0 }}
                    animate={{ width: `${freeDeliveryProgress}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      isFreeDelivery
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                        : "bg-gradient-to-r from-primary to-primary/80"
                    }`}
                  />
                </div>

                <div className="mt-2 flex justify-between text-[10px] font-mono font-semibold text-muted-foreground">
                  <span>Current: ₹{totals.subtotal}</span>
                  <span>Target: ₹{freeDeliveryTarget}</span>
                </div>
              </div>

              {/* Cart line items container */}
              <div className="rounded-3xl border border-border/80 bg-card shadow-xs overflow-hidden">
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3.5 sm:px-6">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                    <h2 className="font-display text-sm sm:text-base font-bold text-foreground">
                      Items from {store?.name || "Local Shop"}
                    </h2>
                  </div>
                  <span className="font-mono text-xs font-bold text-muted-foreground">
                    Subtotal: <span className="text-foreground font-black">₹{totals.subtotal}</span>
                  </span>
                </div>

                <div className="divide-y divide-border/50">
                  <AnimatePresence initial={false}>
                    {cart.lines.map((l) => (
                      <m.div
                        key={`${l.storeId}:${l.productId}`}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-6 hover:bg-muted/[0.04] transition-colors"
                      >
                        {/* Product info with image */}
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-muted/40 shadow-2xs">
                            <ProductThumb
                              src={isImportedCart && l.productId.startsWith("sample:")
                                ? getFallbackProductImage(l.name, l.category)
                                : l.imageUrl ?? cartCatalog.find((product) => product.id === l.productId)?.imageUrl}
                              alt={l.name}
                              category={(l.category ?? "grocery") as StoreCategory}
                              fit="contain"
                              className="h-full w-full rounded-2xl bg-gradient-to-br from-orange-50/50 to-amber-50/50"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-xs sm:text-sm leading-snug text-foreground line-clamp-1">
                              {l.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                              {l.unit} · ₹{l.price} each
                            </p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                                {isImportedCart ? "Sample catalog" : "Freshly packed"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quantity stepper & Price */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pl-16 sm:pl-0">
                          <QtyStepper
                            qty={l.qty}
                            onAdd={() => {}}
                            onChange={(n) => cartStore.setQty(l.productId, n)}
                            max={l.availableStock}
                          />

                          <span className="font-mono font-bold text-sm sm:text-base text-foreground w-16 text-right">
                            ₹{l.qty * l.price}
                          </span>

                          <button
                            type="button"
                            onClick={() => cartStore.setQty(l.productId, 0)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                            aria-label={`Remove ${l.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </m.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Footer action bar */}
                <div className="border-t border-border/60 bg-muted/[0.08] px-4 py-3 sm:px-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => cartStore.clear()}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear whole basket</span>
                  </button>

                  {store && (
                    <Link
                      to="/store/$storeId"
                      params={{ storeId: store.id }}
                      search={{ shopLat: shopPin?.lat, shopLng: shopPin?.lng }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add more items</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Feature C: Best Coupon Banner / Teaser */}
              {bestCoupon ? (
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                        <span>Unlocked Coupon: {bestCoupon.code}</span>
                        <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-900">
                          Save {bestCoupon.discountType === "percent" ? `${bestCoupon.discountValue}%` : `₹${bestCoupon.discountValue}`}
                        </span>
                      </p>
                      <p className="text-[11px] text-emerald-800 font-medium">
                        {bestCoupon.description} · Ready to apply on checkout
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/checkout"
                    className="shrink-0 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 sm:px-3.5 sm:py-2 shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>Redeem</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <TicketPercent className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-foreground">
                        Coupons &amp; Bank Offers Available
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Add items worth ₹{Math.max(0, 199 - totals.subtotal)} more to unlock code <span className="font-mono font-bold text-primary">FRESH50</span>.
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/checkout"
                    className="shrink-0 text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>View Offers</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}

              {/* Feature B: "Did you forget anything?" Impulse Add-ons */}
              {store && impulseItems.length > 0 && (
                <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-display text-sm font-bold text-foreground">
                          Did you forget anything?
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Quick popular essentials from {store.name}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      1-Tap Add
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {impulseItems.map((item) => (
                      <div
                        key={item.id}
                        className="group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-background/50 hover:bg-card hover:border-primary/40 hover:shadow-2xs p-3 transition-all"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-muted/40 border border-border/40">
                            <ProductThumb
                              src={item.imageUrl}
                              alt={item.name}
                              category="grocery"
                              fit="contain"
                              className="h-full w-full"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {item.name}
                            </h4>
                            <p className="text-[10px] text-muted-foreground font-mono truncate">{item.unit}</p>
                            <p className="text-xs font-mono font-black text-foreground mt-0.5">₹{item.price}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            cartStore.add(store.id, store.name, {
                              id: item.id,
                              name: item.name,
                              unit: item.unit,
                              price: item.price,
                              imageUrl: item.imageUrl,
                            });
                            toast.success(`Added ${item.name} to basket!`);
                          }}
                          className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary hover:text-primary-foreground py-1.5 text-xs font-bold text-primary transition-all cursor-pointer shadow-2xs active:scale-95"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Contextual Recommendations & Trust Strip ── */}
              <CartRelatedProducts />
              <CartNearbyShops />

              {/* Trust Badges Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    icon: <Truck className="h-4 w-4 text-primary" />,
                    title: "Fast Local Delivery",
                    sub: "15–35 mins",
                  },
                  {
                    icon: <Package className="h-4 w-4 text-primary" />,
                    title: "Handpicked Fresh",
                    sub: "Direct from shop",
                  },
                  {
                    icon: <ShieldCheck className="h-4 w-4 text-primary" />,
                    title: "Razorpay Secure",
                    sub: "256-bit SSL encrypted",
                  },
                  {
                    icon: <RotateCcw className="h-4 w-4 text-primary" />,
                    title: "Hassle-free Support",
                    sub: "Instant resolution",
                  },
                ].map((b) => (
                  <div
                    key={b.title}
                    className="flex items-center gap-2.5 rounded-2xl border border-border/80 bg-card p-3 shadow-2xs"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      {b.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {b.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{b.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Proof */}
              <div className="rounded-2xl border border-border/80 bg-card px-4 py-3 text-center shadow-2xs">
                <p className="text-xs font-semibold text-muted-foreground">
                  Loved by <span className="text-foreground font-bold">10,000+</span> happy local neighborhood shoppers ❤️
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="text-[#4285F4]">G</span>
                    <span>4.6</span>
                    <span className="text-amber-400">★★★★★</span>
                  </span>
                  <span className="flex items-center gap-1.5 border-l border-border/70 pl-5">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold">4.8</span>
                    <span className="text-muted-foreground text-[11px]">Customer Rating</span>
                  </span>
                  <span className="hidden sm:flex items-center gap-1.5 border-l border-border/70 pl-5">
                    <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                    <span className="font-bold text-foreground">100%</span>
                    <span className="text-muted-foreground text-[11px]">Local Storefronts</span>
                  </span>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Sticky Order Summary Rail ────────── */}
            <div className="min-w-0 lg:col-span-5 xl:col-span-4 space-y-4 lg:sticky lg:top-24">
              {/* Price details card */}
              <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-border/60 pb-2.5 font-sans">
                  <h3 className="font-display text-sm sm:text-base font-bold text-foreground">
                    Bill Summary
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {isFreeDelivery ? "FREE Delivery" : "Best Rates"}
                  </span>
                </div>

                <div className="space-y-2 font-mono">
                  <div className="flex justify-between text-muted-foreground font-sans">
                    <span>Item Total ({totals.itemCount} items)</span>
                    <span className="font-semibold text-foreground font-mono">₹{totals.subtotal}</span>
                  </div>

                  <div className="flex justify-between text-muted-foreground font-sans">
                    <span>Delivery Partner Fee</span>
                    <span className={`font-semibold font-mono ${isFreeDelivery ? "text-emerald-600 font-bold" : "text-foreground"}`}>
                      {isFreeDelivery ? "FREE" : `₹${billBreakdown.deliveryFee}`}
                    </span>
                  </div>

                  <div className="flex justify-between text-muted-foreground font-sans">
                    <span>Govt. Taxes &amp; GST (5% incl.)</span>
                    <span className="font-semibold text-foreground font-mono">₹{billBreakdown.gstAmount}</span>
                  </div>

                  <div className="flex justify-between text-muted-foreground font-sans">
                    <span>Platform &amp; Packaging</span>
                    <span className="font-semibold text-foreground font-mono">
                      {billBreakdown.platformFee === 0 ? "FREE" : `₹${billBreakdown.platformFee}`}
                    </span>
                  </div>

                  <div className="my-2 h-px bg-border/80" />

                  <div className="flex justify-between items-baseline pt-1">
                    <div className="font-sans">
                      <span className="font-display text-sm font-bold text-foreground block">Total Amount</span>
                      <span className="text-[10px] text-muted-foreground">Inclusive of taxes &amp; fees</span>
                    </div>
                    <span className="font-mono text-xl sm:text-2xl font-black text-primary">
                      ₹{total}
                    </span>
                  </div>
                </div>

                {/* Primary Checkout CTA Button */}
                <div className="pt-3 font-sans">
                  <m.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      isSignedIn
                        ? navigate({ to: "/checkout" })
                        : navigate({ to: "/auth", search: { redirect: "/checkout" } })
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--marigold)] py-3.5 px-4 font-display text-base font-extrabold text-ink shadow-lg shadow-[var(--marigold)]/20 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Lock className="h-4 w-4" />
                    <span>{isSignedIn ? "Proceed to Checkout" : "Login to Proceed"}</span>
                    <span>· ₹{total}</span>
                    <ArrowRight className="h-4 w-4" />
                  </m.button>
                  <p className="mt-2 text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1.5">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    <span>Safe &amp; Encrypted 256-Bit Checkout</span>
                  </p>
                </div>

                {/* Secondary OTP CTA if guest */}
                {!isSignedIn && (
                  <div className="mt-2 rounded-2xl border border-primary/20 bg-primary/[0.02] p-3 text-center font-sans">
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/auth", search: { redirect: "/checkout" } })}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      Sign in with phone OTP
                    </button>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Access saved addresses &amp; real-time order tracking
                    </p>
                  </div>
                )}
              </div>

              {/* LocalShore Neighborhood Guarantee Card */}
              <div className="rounded-3xl border border-border/70 bg-card p-4 text-xs space-y-2 text-muted-foreground shadow-2xs">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Shield className="h-4 w-4 text-primary shrink-0" />
                  <span>LocalShore Guarantee</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Your order is prepared and packed directly by your local shop. Courier partners follow contactless safety guidelines.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── STICKY BOTTOM BAR FOR MOBILE ───────────────────────── */}
        {cart.lines.length > 0 && (
          <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] inset-x-0 z-50 border-t border-border/80 bg-card/95 p-3.5 shadow-[0_-6px_25px_rgba(0,0,0,0.12)] backdrop-blur-xl lg:hidden">
            <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
              <div className="flex flex-col pl-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total Payable
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold font-mono text-primary">₹{total}</span>
                  {isFreeDelivery ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                      FREE Del
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">incl. taxes</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  isSignedIn
                    ? navigate({ to: "/checkout" })
                    : navigate({ to: "/auth", search: { redirect: "/checkout" } })
                }
                className="flex items-center gap-2 rounded-2xl bg-[var(--marigold)] px-5 py-3 text-sm font-extrabold text-ink shadow-md hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>{isSignedIn ? "Proceed to Checkout" : "Login to Proceed"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
