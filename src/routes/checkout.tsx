import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app-shell";
import { cartStore, useCart, cartTotals } from "@/lib/cart-store";
import { getStore, APPROVED_STORE } from "@/lib/mock-data";
import { ordersStore } from "@/lib/orders-store";
import { supabase } from "@/integrations/supabase/client";
import { addressesStore, useAddresses } from "@/lib/addresses-store";
import { DeliveryMap } from "@/components/delivery-map";
import { reverseGeocode } from "@/lib/geocoding.functions";
import { Crosshair, Plus, Check, TicketPercent, X } from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, m } from "motion/react";

const CURRENT_LOCATION_ID = "__current_location";
const isProductUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

type CouponQuote = {
  coupon_id: string;
  code: string;
  discount_type: "percent" | "flat" | "free_shipping";
  discount_amount: number;
  subtotal: number;
  shipping_fee: number;
  total: number;
};

export const Route = createFileRoute("/checkout")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth", search: { redirect: "/checkout" } });
    }
  },
  component: CheckoutPage,
});

function CheckoutPage() {
  const cart = useCart();
  const totals = cartTotals(cart.lines);
  const knownStore = cart.storeId === APPROVED_STORE.id
    ? APPROVED_STORE
    : cart.storeId
      ? getStore(cart.storeId)
      : undefined;
  const store = knownStore ?? (cart.storeId && cart.lines.length > 0 ? {
    ...APPROVED_STORE,
    id: cart.storeId,
    name: cart.storeName ?? "Local Shore shop",
  } : null);
  const navigate = useNavigate();
  const reverseGeocodeFn = useServerFn(reverseGeocode);

  const savedAddresses = useAddresses();
  const [addr, setAddr] = useState<string>(() => savedAddresses[0]?.id ?? CURRENT_LOCATION_ID);
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number }>(() => ({
    lat: savedAddresses[0]?.lat ?? 9.9816,
    lng: savedAddresses[0]?.lng ?? 76.2999,
  }));
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [currentAddress, setCurrentAddress] = useState(() =>
    savedAddresses.length === 0 ? "Map pin location" : "",
  );
  const [pay, setPay] = useState<"upi" | "card" | "cod">("upi");
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newLine, setNewLine] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [isCheckingStock, setIsCheckingStock] = useState(true);
  const [showDemoPayment, setShowDemoPayment] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponQuote, setCouponQuote] = useState<CouponQuote | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!showDemoPayment) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPlacing) setShowDemoPayment(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [isPlacing, showDemoPayment]);

  const chooseAddr = (id: string) => {
    setAddr(id);
    if (id === CURRENT_LOCATION_ID) return;
    const a = savedAddresses.find((x) => x.id === id);
    if (a) setPinCoords({ lat: a.lat, lng: a.lng });
  };

  const updatePin = (coords: { lat: number; lng: number }) => {
    setPinCoords(coords);
    setAccuracyMeters(null);
    if (addr === CURRENT_LOCATION_ID) {
      setCurrentAddress(`Dropped pin · ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
      setManualAddress("");
      setLocStatus("idle");
      setLocError("");
    }
  };

  const saveNewAddress = () => {
    if (!newLabel.trim() || !newLine.trim()) {
      toast.error("Enter an address label and full address.");
      return;
    }
    const created = addressesStore.add({
      label: newLabel.trim(),
      line: newLine.trim(),
      lat: pinCoords.lat,
      lng: pinCoords.lng,
    });
    setAddr(created.id);
    setNewLabel("");
    setNewLine("");
    setShowAdd(false);
  };

  const [locStatus, setLocStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [locError, setLocError] = useState<string>("");
  const [isTracking, setIsTracking] = useState(false);

  const applyCoords = async (coords: { lat: number; lng: number }, accuracy: number | null) => {
    console.info("[geo] coords received", coords);
    console.info("[geo] accuracy", { meters: accuracy });
    setPinCoords(coords);
    setAccuracyMeters(accuracy);
    setAddr(CURRENT_LOCATION_ID);
    setCurrentAddress(`Finding address for ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}…`);
    setManualAddress("");
    try {
      console.info("[geo] reverse geocode requested", coords);
      const result = await reverseGeocodeFn({ data: coords });
      console.info("[geo] geocoded address", result.address);
      setCurrentAddress(result.address);
      setManualAddress(result.address);
      if (showAdd && !newLine.trim()) setNewLine(result.address);
    } catch (error) {
      console.warn("[geo] reverse geocode failed", error);
      const fallback = `Current location · ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
      setCurrentAddress(fallback);
      setManualAddress("");
    }
    setLocStatus("ok");
  };

  const geolocationOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  };

  const stopLiveLocation = () => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      console.info("[geo] live tracking stopped", { watchId: watchIdRef.current });
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  const validateGeolocationRuntime = () => {
    console.info("[geo] permission requested");
    const isLocalhost =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    console.info("[geo] secure context", {
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
    });
    if (!window.isSecureContext && !isLocalhost) {
      setLocStatus("error");
      setLocError("Location requires HTTPS. Open this app over HTTPS or localhost and try again.");
      console.warn("[geo] blocked: insecure origin");
      return false;
    }

    if (!navigator.geolocation) {
      setLocStatus("error");
      setLocError("Location is not supported by this browser.");
      console.warn("[geo] blocked: geolocation unsupported");
      return false;
    }
    return true;
  };

  const handleGeolocationError = (err: GeolocationPositionError, inIframe: boolean) => {
    const iframeHint = inIframe
      ? " (This preview runs inside an iframe — browsers often block the location prompt here. Open the deployed site in a new tab for precise location.)"
      : "";
    const msg =
      err.code === err.PERMISSION_DENIED
        ? "Location permission denied. Allow location access in your browser settings and try again." +
          iframeHint
        : err.code === err.POSITION_UNAVAILABLE
          ? "Precise location is unavailable. Move near a window, enable GPS/Wi-Fi, and try again."
          : err.code === err.TIMEOUT
            ? "Precise location timed out. Try again from an open area with GPS enabled." +
              iframeHint
            : "Couldn't get precise location.";
    setLocStatus("error");
    setLocError(msg);
    setIsTracking(false);
    console.warn("[geo] geolocation failed", {
      code: err.code,
      message: err.message,
      userMessage: msg,
    });
  };

  const locateUser = () => {
    if (!validateGeolocationRuntime()) return;
    const inIframe = typeof window !== "undefined" && window.top !== window.self;
    setLocStatus("loading");
    setLocError("");
    setCurrentAddress("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        void applyCoords(coords, pos.coords.accuracy);
      },
      (err) => handleGeolocationError(err, inIframe),
      geolocationOptions,
    );
  };

  const startLiveLocation = () => {
    if (!validateGeolocationRuntime()) return;
    const inIframe = typeof window !== "undefined" && window.top !== window.self;
    stopLiveLocation();
    setLocStatus("loading");
    setLocError("");
    setCurrentAddress("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        void applyCoords(coords, pos.coords.accuracy);
      },
      (err) => handleGeolocationError(err, inIframe),
      geolocationOptions,
    );

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        console.info("[geo] live position update", {
          ...coords,
          accuracyMeters: pos.coords.accuracy,
        });
        void applyCoords(coords, pos.coords.accuracy);
      },
      (err) => handleGeolocationError(err, inIframe),
      geolocationOptions,
    );
    watchIdRef.current = watchId;
    setIsTracking(true);
    console.info("[geo] live tracking started", { watchId });
  };

  const toggleLiveLocation = () => {
    if (isTracking) {
      stopLiveLocation();
      return;
    }
    startLiveLocation();
  };

  // Auto-detect the user's location on first load so the map opens where they are.
  useEffect(() => {
    if (savedAddresses.length === 0) locateUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => stopLiveLocation();
  }, []);

  const cartProductIds = cart.lines.map((line) => line.productId).sort().join(",");
  const cartSignature = cart.lines
    .map((line) => `${line.productId}:${line.qty}`)
    .sort()
    .join(",");

  useEffect(() => {
    setCouponQuote(null);
  }, [cartSignature]);

  useEffect(() => {
    let active = true;
    if (!cartProductIds) {
      setIsCheckingStock(false);
      return;
    }

    setIsCheckingStock(true);
    const validateStock = async () => {
      const productIds = cartProductIds.split(",");
      const databaseProductIds = productIds.filter(isProductUuid);
      // Demo catalog items do not have a database stock row. They are still
      // valid for the simulated checkout flow, so release the loading guard.
      if (databaseProductIds.length === 0) {
        if (active) setIsCheckingStock(false);
        return;
      }
      let { data, error } = await (supabase as any)
        .from("approved_product_catalog")
        .select("id,stock")
        .in("id", databaseProductIds);

      if (error) {
        const fallback = await (supabase as any)
          .from("products")
          .select("id,stock")
          .in("id", databaseProductIds);
        data = fallback.data;
        error = fallback.error;
      } else {
        const returnedIds = new Set(
          (data ?? []).map((product: { id: string }) => product.id),
        );
        const missingProductIds = databaseProductIds.filter(
          (productId) => !returnedIds.has(productId),
        );

        if (missingProductIds.length > 0) {
          const fallback = await (supabase as any)
            .from("products")
            .select("id,stock")
            .in("id", missingProductIds);

          if (!fallback.error) {
            data = [...(data ?? []), ...(fallback.data ?? [])];
          } else {
            console.warn(
              "[checkout] Could not validate missing catalog products:",
              fallback.error,
            );
          }
        }
      }

      if (!active) return;
      if (error) {
        console.error("[checkout] stock validation failed", error);
        toast.error("Product availability could not be checked. Please try again.");
        return;
      }
      const stockByProduct = Object.fromEntries(
        (data ?? []).flatMap(
          (product: { id: string; stock: number | null }) => {
            const stock = Number(product.stock);
            return Number.isFinite(stock) ? [[product.id, stock]] : [];
          },
        ),
      );
      cart.lines
        .filter((line) => !isProductUuid(line.productId))
        .forEach((line) => {
          stockByProduct[line.productId] = line.availableStock ?? line.qty;
        });
      // Do not clear or rewrite the cart from a client-side stock snapshot.
      // The place_order RPC performs the authoritative inventory check.
      cartStore.reconcileStock(stockByProduct);
    };

    void validateStock()
      .catch((error) => {
        if (!active) return;
        console.error("[checkout] stock validation failed", error);
        toast.error("Product availability could not be checked. Please try again.");
      })
      .finally(() => {
        if (active) setIsCheckingStock(false);
      });

    return () => {
      active = false;
    };
  }, [cartProductIds]);

  const deliveryFee =
    totals.subtotal > 0 ? (store ? Math.round(20 + store.distanceKm * 6) : 25) : 0;
  const total = totals.subtotal + deliveryFee;
  const displayDeliveryFee = couponQuote?.shipping_fee ?? deliveryFee;
  const discountAmount = couponQuote?.discount_amount ?? 0;
  const displayTotal = couponQuote?.total ?? total;

  if (!store || cart.lines.length === 0) {
    return (
      <AppShell>
        <div className="mx-5 mt-8 rounded-xl border hairline bg-card p-6 text-center">
          <p className="font-display text-lg">Nothing to check out.</p>
          <Link
            to="/"
            search={{ category: undefined, q: undefined }}
            className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline"
          >
            Find a shop
          </Link>
        </div>
      </AppShell>
    );
  }

  const selected = savedAddresses.find((a) => a.id === addr);
  const currentAddressLine = manualAddress.trim() || currentAddress;
  const selectedAddressLine = selected
    ? `${selected.label} · ${selected.line}`
    : addr === CURRENT_LOCATION_ID && currentAddress
      ? `Current location · ${currentAddressLine}`
      : "";
  const canPlace = !!selectedAddressLine;

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      toast.error("Enter a coupon code.");
      return;
    }
    if (cart.lines.some((line) => !isProductUuid(line.productId))) {
      toast.error("Coupons are available for approved marketplace products.");
      return;
    }

    setIsApplyingCoupon(true);
    const { data, error } = await (supabase as any).rpc("quote_coupon", {
      p_code: code,
      p_items: cart.lines.map((line) => ({ product_id: line.productId, qty: line.qty })),
    });
    setIsApplyingCoupon(false);

    if (error) {
      console.error("[checkout] quote_coupon failed", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      setCouponQuote(null);
      toast.error(error.message || "This coupon could not be applied.");
      return;
    }

    const quote = data as CouponQuote;
    setCouponCode(quote.code);
    setCouponQuote({
      ...quote,
      discount_amount: Number(quote.discount_amount),
      subtotal: Number(quote.subtotal),
      shipping_fee: Number(quote.shipping_fee),
      total: Number(quote.total),
    });
    toast.success(`Coupon ${quote.code} applied.`);
  };

  const openPaymentConfirmation = () => {
    if (!selectedAddressLine || isPlacing || isCheckingStock) return;
    setShowDemoPayment(true);
  };

  const placeOrder = async () => {
    if (!selectedAddressLine || isPlacing) return;
    setIsPlacing(true);
    try {
      const order = await ordersStore.place({
        storeId: store.id,
        storeName: store.name,
        lines: cart.lines,
        subtotal: totals.subtotal,
        deliveryFee: displayDeliveryFee,
        total: displayTotal,
        address: selectedAddressLine,
        destination: pinCoords,
        paymentMethod: pay === "upi" ? "UPI" : pay === "card" ? "Card" : "Cash on delivery",
        couponCode: couponQuote?.code,
        discountAmount,
        etaMin: store.etaMin,
        distanceKm: store.distanceKm,
      });
      cartStore.clear();
      toast.success(pay === "cod" ? "Order placed. Payment is due on delivery." : "Demo payment completed. Order placed as unpaid/pending.");
      setShowOrderSuccess(true);
      window.setTimeout(() => navigate({ to: "/order/$orderId", params: { orderId: order.id } }), 1000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place the order. Try again.");
      setIsPlacing(false);
      return;
    } finally {
      setIsPlacing(false);
    }
    setShowDemoPayment(false);
  };

  return (
    <AppShell>
      <div className="px-5 pt-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Checkout
        </p>
        <h1 className="mt-1 font-display text-3xl">Almost there</h1>
      </div>

      {/* Delivery */}
      <section className="mx-5 mt-4 rounded-xl bg-card p-4 ring-1 ring-black/[0.04]">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base">Delivery location</h2>
          <button
            onClick={toggleLiveLocation}
            disabled={locStatus === "loading" && !isTracking}
            className="inline-flex items-center gap-1.5 rounded-full border hairline px-2.5 py-1 text-[11px] font-medium hover:border-primary/40 disabled:opacity-60"
          >
            <Crosshair
              className={`h-3 w-3 ${locStatus === "loading" || isTracking ? "animate-spin" : ""}`}
            />
            {isTracking ? "Stop live" : locStatus === "loading" ? "Locating…" : "Live location"}
          </button>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Use your location, or tap/drag the marigold pin when the map is available.
        </p>
        <div className="mt-3">
          <DeliveryMap
            store={store ? { lat: store.lat, lng: store.lng, label: store.name } : undefined}
            destination={pinCoords}
            accuracyMeters={accuracyMeters}
            interactive
            onDestinationChange={updatePin}
            height={200}
          />
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Pin · {pinCoords.lat.toFixed(4)}, {pinCoords.lng.toFixed(4)}
          {typeof accuracyMeters === "number" ? ` · accuracy ±${Math.round(accuracyMeters)} m` : ""}
        </p>
        {locStatus === "ok" && (
          <p className="mt-1 text-[11px] text-primary">
            Location updated — address matched to the pin below.
          </p>
        )}
        {locStatus === "error" && <p className="mt-1 text-[11px] text-destructive">{locError}</p>}

        <div className="mt-3 space-y-2">
          {savedAddresses.length === 0 && (
            <p className="rounded-lg border hairline p-3 text-xs text-muted-foreground">
              No saved addresses yet — add one below to continue.
            </p>
          )}
          {currentAddress && (
            <div
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${addr === CURRENT_LOCATION_ID ? "border-primary bg-primary/5" : "border-transparent hairline"}`}
              onClick={() => chooseAddr(CURRENT_LOCATION_ID)}
            >
              <input
                type="radio"
                name="addr"
                checked={addr === CURRENT_LOCATION_ID}
                onChange={() => chooseAddr(CURRENT_LOCATION_ID)}
                className="mt-1 accent-[var(--teal)]"
              />
              <div className="flex-1">
                <p className="font-medium">Current location</p>
                <p className="text-xs text-muted-foreground">{currentAddress}</p>
                {addr === CURRENT_LOCATION_ID && (
                  <textarea
                    value={manualAddress}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="Correct house, street, area or landmark"
                    rows={2}
                    className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                )}
              </div>
            </div>
          )}
          {savedAddresses.map((a) => (
            <label
              key={a.id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${addr === a.id ? "border-primary bg-primary/5" : "border-transparent hairline"}`}
            >
              <input
                type="radio"
                name="addr"
                checked={addr === a.id}
                onChange={() => chooseAddr(a.id)}
                className="mt-1 accent-[var(--teal)]"
              />
              <div className="flex-1">
                <p className="font-medium">{a.label}</p>
                <p className="text-xs text-muted-foreground">{a.line}</p>
              </div>
            </label>
          ))}

          {showAdd ? (
            <div className="rounded-lg border hairline p-3">
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Label (Home, Office)"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <textarea
                value={newLine}
                onChange={(e) => setNewLine(e.target.value)}
                placeholder="Full address"
                rows={2}
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Uses current pin · {pinCoords.lat.toFixed(4)}, {pinCoords.lng.toFixed(4)}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={saveNewAddress}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  <Check className="h-3.5 w-3.5" /> Save
                </button>
                <button
                  onClick={() => {
                    setShowAdd(false);
                    setNewLabel("");
                    setNewLine("");
                  }}
                  className="rounded-md border hairline px-3 py-1.5 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border hairline px-3 py-2 text-xs font-medium hover:border-primary/40"
            >
              <Plus className="h-3.5 w-3.5" /> Add new address
            </button>
          )}
        </div>
      </section>

      {/* Payment */}
      <section className="mx-5 mt-4 rounded-xl bg-card p-4 ring-1 ring-black/[0.04]">
        <h2 className="font-display text-base">Payment method</h2>
        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
          {[
            { id: "upi" as const, label: "UPI" },
            { id: "card" as const, label: "Card" },
            { id: "cod" as const, label: "Cash" },
          ].map((p) => (
            <m.button
              key={p.id}
              onClick={() => setPay(p.id)}
              className={`rounded-lg border py-2.5 font-medium transition-colors ${pay === p.id ? "border-primary bg-primary text-primary-foreground" : "hairline hover:border-primary/40"}`}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.975 }}
            >
              {p.label}
            </m.button>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          UPI and Card use a demo checkout. They never mark the order as paid; real payment remains pending until a verified provider confirms it.
        </p>
      </section>

      {/* Coupon */}
      <section className="mx-5 mt-4 rounded-xl bg-card p-4 ring-1 ring-black/[0.04]">
        <div className="flex items-center gap-2">
          <TicketPercent className="h-4 w-4 text-primary" />
          <h2 className="font-display text-base">Apply coupon</h2>
        </div>
        {couponQuote ? (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
            <div>
              <p className="text-sm font-semibold">{couponQuote.code}</p>
              <p className="text-xs text-primary">You save ₹{discountAmount}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCouponQuote(null);
                setCouponCode("");
              }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
              aria-label="Remove coupon"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="mt-3 flex gap-2">
            <input
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (event.key === "Enter") void applyCoupon();
              }}
              placeholder="Enter coupon code"
              className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm uppercase"
              aria-label="Coupon code"
            />
            <button
              type="button"
              onClick={() => void applyCoupon()}
              disabled={isApplyingCoupon || !couponCode.trim()}
              className="rounded-lg border border-primary px-4 py-2.5 text-sm font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isApplyingCoupon ? "Applying…" : "Apply"}
            </button>
          </div>
        )}
      </section>

      {/* Summary */}
      <section className="mx-5 mt-4 rounded-xl bg-card p-4 ring-1 ring-black/[0.04] font-mono text-sm">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{store.name}</span>
          <span>
            {store.distanceKm.toFixed(1)} km · ~{store.etaMin} min
          </span>
        </div>
        <Row label={`Items (${totals.itemCount})`} value={`₹${totals.subtotal}`} />
        <Row
          label="Delivery fee"
          value={displayDeliveryFee === 0 ? "FREE" : `₹${displayDeliveryFee}`}
        />
        {couponQuote && discountAmount > 0 && couponQuote.discount_type !== "free_shipping" && (
          <Row label={`Coupon (${couponQuote.code})`} value={`−₹${discountAmount}`} />
        )}
        <div className="my-2 h-px bg-[color-mix(in_oklab,var(--teal)_20%,transparent)]" />
        <Row label="Total" value={`₹${displayTotal}`} bold />
      </section>

      <div className="sticky bottom-16 z-30 mt-5 px-5">
        <button
          type="button"
          onClick={openPaymentConfirmation}
          disabled={!canPlace || isPlacing || isCheckingStock}
          className="w-full rounded-xl bg-[var(--marigold)] py-3.5 font-display text-lg text-ink shadow-lg hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
        >
          {isCheckingStock ? "Checking availability…" : isPlacing ? "Placing order…" : canPlace ? `Place order · ₹${displayTotal}` : "Add a delivery address"}
        </button>
      </div>

      <AnimatePresence>
        {showOrderSuccess && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] grid place-items-center bg-background/80 px-5 backdrop-blur-sm" role="status" aria-live="polite">
            <m.div initial={{ scale: 0.78, y: 12 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 360, damping: 20 }} className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-card p-8 text-center shadow-2xl ring-1 ring-black/[0.06]">
              <div className="success-check mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-9 w-9" strokeWidth={3} /></div>
              <h2 className="mt-5 font-display text-2xl">Order confirmed</h2>
              <p className="mt-2 text-sm text-muted-foreground">Your local shop is getting everything ready.</p>
              <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                {Array.from({ length: 14 }, (_, i) => <i key={i} className="confetti" style={{ left: `${8 + ((i * 37) % 84)}%`, animationDelay: `${(i % 5) * 55}ms`, backgroundColor: i % 2 ? "var(--marigold)" : "var(--coral)" }} />)}
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDemoPayment && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-payment-title"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !isPlacing) setShowDemoPayment(false);
          }}
        >
          <m.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md rounded-xl bg-card p-5 shadow-xl ring-1 ring-black/[0.08]"
          >
            <h2 id="demo-payment-title" className="font-display text-xl">
              {pay === "cod" ? "Confirm cash on delivery" : `Demo ${pay === "upi" ? "UPI" : "card"} payment`}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {pay === "cod"
                ? `Your order total is ₹${displayTotal}. Payment will be collected on delivery.`
                : `Simulate a successful ${pay === "upi" ? "UPI" : "card"} checkout for ₹${displayTotal}. This demo does not record a real payment or mark the order paid.`}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowDemoPayment(false)} className="rounded-lg border hairline px-4 py-2 text-sm">Cancel</button>
              <button type="button" onClick={() => void placeOrder()} disabled={isPlacing} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{isPlacing ? "Processing…" : pay === "cod" ? "Place cash order" : "Complete demo payment"}</button>
            </div>
          </m.div>
        </m.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className={bold ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      <span className={bold ? "text-base font-semibold" : ""}>{value}</span>
    </div>
  );
}
