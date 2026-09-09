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
import { DeliveryAnimation } from "@/components/delivery-animation";
import { reverseGeocode } from "@/lib/geocoding.functions";
import { isValidCoordinate, haversineDistanceKm } from "@/lib/geo";
import { AVAILABLE_COUPONS, calculateBillBreakdown, evaluateCoupon } from "@/lib/coupons";
import { SmartLottieLoader } from "@/components/ui/smart-lottie-loader";
import {
  Crosshair,
  Plus,
  Check,
  TicketPercent,
  X,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Loader2,
  CreditCard,
  Smartphone,
  Banknote,
  Tag,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, m } from "motion/react";
import type { Order } from "@/lib/orders-store";

const CURRENT_LOCATION_ID = "__current_location";
const isProductUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function playPaymentSuccessSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.22);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
    gain2.gain.setValueAtTime(0.22, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.5);
  } catch {
    // Ignore audio errors if blocked by browser policy
  }
}

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
  const reverseGeocodeFn = useServerFn(reverseGeocode);

  const savedAddresses = useAddresses();
  const [addr, setAddr] = useState<string>(() => savedAddresses[0]?.id ?? CURRENT_LOCATION_ID);
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number } | null>(() => {
    const first = savedAddresses[0];
    return first &&
      typeof first.lat === "number" &&
      typeof first.lng === "number" &&
      isValidCoordinate(first.lat, first.lng)
      ? { lat: first.lat, lng: first.lng }
      : null;
  });
  const [pinConfirmed, setPinConfirmed] = useState<boolean>(() => {
    const first = savedAddresses[0];
    return (
      !!first &&
      typeof first.lat === "number" &&
      typeof first.lng === "number" &&
      isValidCoordinate(first.lat, first.lng)
    );
  });
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
  const geocodeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const computedDistanceKm =
    store &&
    typeof store.lat === "number" &&
    typeof store.lng === "number" &&
    isValidCoordinate(store.lat, store.lng) &&
    pinCoords &&
    isValidCoordinate(pinCoords.lat, pinCoords.lng)
      ? Math.max(
          0.1,
          Math.round(haversineDistanceKm(store.lat, store.lng, pinCoords.lat, pinCoords.lng) * 10) /
            10,
        )
      : (store?.distanceKm ?? 1.2);

  const computedEtaMin =
    store &&
    typeof store.lat === "number" &&
    typeof store.lng === "number" &&
    isValidCoordinate(store.lat, store.lng) &&
    pinCoords &&
    isValidCoordinate(pinCoords.lat, pinCoords.lng)
      ? Math.max(10, Math.round(computedDistanceKm * 5 + 10))
      : (store?.etaMin ?? 25);

  // New states for payment gateway flow
  const [paymentStep, setPaymentStep] = useState<"idle" | "authorizing">("idle");
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [txnRef, setTxnRef] = useState("");
  const [countdown, setCountdown] = useState(4);

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
    if (id === CURRENT_LOCATION_ID) {
      if (!pinCoords) {
        setPinCoords({ lat: store?.lat ?? 11.0168, lng: store?.lng ?? 76.9558 });
      }
      setPinConfirmed(true);
      return;
    }
    const a = savedAddresses.find((x) => x.id === id);
    if (
      a &&
      typeof a.lat === "number" &&
      typeof a.lng === "number" &&
      isValidCoordinate(a.lat, a.lng)
    ) {
      setPinCoords({ lat: a.lat, lng: a.lng });
      setPinConfirmed(true);
    } else {
      setPinCoords({ lat: store?.lat ?? 11.0168, lng: store?.lng ?? 76.9558 });
      setPinConfirmed(true);
      if (a?.line) setCurrentAddress(a.line);
    }
  };

  const updatePin = (coords: { lat: number; lng: number }) => {
    setPinCoords(coords);
    setPinConfirmed(true);
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
      lat: pinCoords?.lat ?? null,
      lng: pinCoords?.lng ?? null,
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
    setPinConfirmed(true);
    setAccuracyMeters(accuracy);
    setAddr(CURRENT_LOCATION_ID);

    // Debounce reverse geocoding — during live tracking watchPosition can fire
    // multiple times per second. Only geocode once the position has stabilized
    // for 5 seconds to avoid hammering the server function.
    if (geocodeDebounceRef.current) clearTimeout(geocodeDebounceRef.current);
    geocodeDebounceRef.current = setTimeout(async () => {
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
        setCurrentAddress(`${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
        setManualAddress("");
      }
      setLocStatus("ok");
    }, 5000);

    // Show approximate coords immediately while geocoding is debounced
    setCurrentAddress(`${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
    setLocStatus("ok");
  };

  const geolocationOptions: PositionOptions = {
    enableHighAccuracy: false,
    timeout: 15000,
    maximumAge: 10000, // Accept cached position up to 10s old – reduces hardware thrash & improves reliability on desktop/WiFi
  };

  const stopLiveLocation = () => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      console.info("[geo] live tracking stopped", { watchId: watchIdRef.current });
      watchIdRef.current = null;
    }
    if (geocodeDebounceRef.current) {
      clearTimeout(geocodeDebounceRef.current);
      geocodeDebounceRef.current = null;
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

    const onSuccess = (pos: GeolocationPosition) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      void applyCoords(coords, pos.coords.accuracy);
    };

    // Two-pass: try high accuracy first, fall back to low accuracy on timeout
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (err) => {
        if (err.code === err.TIMEOUT) {
          console.info("[geo] high-accuracy timed out, falling back to low accuracy");
          navigator.geolocation.getCurrentPosition(
            onSuccess,
            (fallbackErr) => handleGeolocationError(fallbackErr, inIframe),
            geolocationOptions, // low accuracy, 15s timeout
          );
        } else {
          handleGeolocationError(err, inIframe);
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 },
    );
  };

  const startLiveLocation = () => {
    if (!validateGeolocationRuntime()) return;
    const inIframe = typeof window !== "undefined" && window.top !== window.self;
    stopLiveLocation();
    setLocStatus("loading");
    setLocError("");
    setCurrentAddress("");

    // Two-pass initial fix: try high accuracy first, fall back on timeout
    const onInitialFix = (pos: GeolocationPosition) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      void applyCoords(coords, pos.coords.accuracy);
    };
    navigator.geolocation.getCurrentPosition(
      onInitialFix,
      (err) => {
        if (err.code === err.TIMEOUT) {
          console.info("[geo] live: high-accuracy timed out, falling back to low accuracy");
          navigator.geolocation.getCurrentPosition(
            onInitialFix,
            (fallbackErr) => handleGeolocationError(fallbackErr, inIframe),
            geolocationOptions,
          );
        } else {
          handleGeolocationError(err, inIframe);
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 },
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
  }, []);

  useEffect(() => {
    return () => stopLiveLocation();
  }, []);

  const cartProductIds = cart.lines
    .map((line) => line.productId)
    .sort()
    .join(",");
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
        const returnedIds = new Set((data ?? []).map((product: { id: string }) => product.id));
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
            console.warn("[checkout] Could not validate missing catalog products:", fallback.error);
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
        (data ?? []).flatMap((product: { id: string; stock: number | null }) => {
          const stock = Number(product.stock);
          return Number.isFinite(stock) ? [[product.id, stock]] : [];
        }),
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

  useEffect(() => {
    if (!showOrderSuccess || !placedOrder) return;
    setCountdown(4);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate({ to: "/order/$orderId", params: { orderId: placedOrder.id } });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showOrderSuccess, placedOrder, navigate]);

  const rawDeliveryFee =
    totals.subtotal > 0 ? (store ? Math.round(20 + computedDistanceKm * 6) : 25) : 0;

  const billBreakdown = calculateBillBreakdown({
    subtotal: totals.subtotal,
    rawDeliveryFee,
    couponQuote: couponQuote
      ? {
          code: couponQuote.code,
          discountType: couponQuote.discount_type,
          discountAmount: couponQuote.discount_amount,
          shippingFee: couponQuote.shipping_fee,
        }
      : null,
  });

  const displayDeliveryFee = billBreakdown.deliveryFee;
  const discountAmount = billBreakdown.discountAmount;
  const displayTotal = billBreakdown.total;

  if ((!store || cart.lines.length === 0) && !showOrderSuccess) {
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
  const currentAddressLine = manualAddress.trim() || currentAddress || "Selected delivery address";
  const selectedAddressLine = selected
    ? `${selected.label} · ${selected.line}`
    : addr === CURRENT_LOCATION_ID
      ? `Current location · ${currentAddressLine}`
      : currentAddressLine;
  const canPlace =
    !!selectedAddressLine &&
    (pinConfirmed || !!pinCoords || savedAddresses.length > 0 || !!manualAddress.trim() || !!currentAddress);

  const applyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) {
      toast.error("Enter a coupon code.");
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const quote = await evaluateCoupon({
        code,
        subtotal: totals.subtotal,
        rawDeliveryFee,
        items: cart.lines.map((line) => ({ product_id: line.productId, qty: line.qty })),
      });

      const updatedBreakdown = calculateBillBreakdown({
        subtotal: totals.subtotal,
        rawDeliveryFee,
        couponQuote: quote,
      });

      setCouponCode(quote.code);
      setCouponQuote({
        coupon_id: quote.code,
        code: quote.code,
        discount_type: quote.discountType,
        discount_amount: quote.discountAmount,
        subtotal: totals.subtotal,
        shipping_fee: updatedBreakdown.deliveryFee,
        total: updatedBreakdown.total,
      });

      toast.success(
        quote.description || `Coupon ${quote.code} applied! You saved ₹${quote.discountAmount}`,
      );
    } catch (error: any) {
      setCouponQuote(null);
      toast.error(error.message || "This coupon could not be applied.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const openPaymentConfirmation = () => {
    if (!selectedAddressLine || isPlacing || isCheckingStock) return;
    if (!canPlace) {
      toast.error("Confirm the delivery location before continuing.");
      return;
    }
    setShowDemoPayment(true);
  };

  const placeOrder = async () => {
    const destinationCoords = pinCoords || { lat: store?.lat ?? 11.0168, lng: store?.lng ?? 76.9558 };
    if (!selectedAddressLine || isPlacing || !store) return;
    if (!canPlace) {
      toast.error("Confirm the delivery location before placing the order.");
      return;
    }
    setIsPlacing(true);
    setPaymentStep("authorizing");

    // Simulate realistic payment gateway processing delay
    await new Promise((resolve) => setTimeout(resolve, 950));

    try {
      const generatedTxn = `TXN-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const order = await ordersStore.place({
        storeId: store.id,
        storeName: store.name,
        lines: cart.lines,
        subtotal: totals.subtotal,
        deliveryFee: displayDeliveryFee,
        total: displayTotal,
        address: selectedAddressLine,
        destination: destinationCoords,
        paymentMethod: pay === "upi" ? "UPI" : pay === "card" ? "Card" : "Cash on delivery",
        couponCode: couponQuote?.code,
        discountAmount,
        etaMin: computedEtaMin,
        distanceKm: computedDistanceKm,
      });

      cartStore.clear();
      setTxnRef(generatedTxn);
      setPlacedOrder(order);

      // Play audio chime and trigger success UI
      playPaymentSuccessSound();

      toast.success(
        pay === "cod"
          ? "Order placed! Pay cash on delivery."
          : `Payment of ₹${displayTotal} completed successfully!`,
      );

      setShowDemoPayment(false);
      setPaymentStep("idle");
      setShowOrderSuccess(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place the order. Try again.");
      setPaymentStep("idle");
      setIsPlacing(false);
      return;
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <AppShell>
      {/* Order Placement Lottie Loader */}
      <SmartLottieLoader
        show={isPlacing}
        delayMs={0}
        mode="fullscreen"
        size="xl"
        message={`Placing your order with ${store?.name || "LocalShore"}...`}
        subtext="Verifying item availability & assigning nearest delivery partner"
      />

      <div className="px-3 sm:px-5 pt-4 sm:pt-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Checkout
        </p>
        <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-foreground">Almost there</h1>
      </div>

      {/* Items in Order Summary Card */}
      <section className="mx-3 sm:mx-5 mt-4 rounded-2xl bg-card p-3.5 sm:p-4 ring-1 ring-black/[0.05] shadow-xs">
        <div className="flex items-center justify-between border-b hairline pb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm sm:text-base font-bold text-foreground">
              Items in Order ({totals.itemCount})
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-primary">
            ₹{totals.subtotal}
          </span>
        </div>

        <div className="mt-3 space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {cart.lines.map((item) => (
            <div key={item.productId} className="flex items-center justify-between gap-3 text-xs py-1 border-b border-border/40 last:border-none">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-purple-50 text-purple-900 font-bold text-xs border border-purple-200/60 shadow-2xs">
                  {item.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">{item.name}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {item.unit} · Qty: {item.qty} × ₹{item.price}
                  </p>
                </div>
              </div>
              <span className="font-mono font-bold text-foreground shrink-0">
                ₹{item.qty * item.price}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Delivery */}
      <section className="mx-3 sm:mx-5 mt-4 rounded-2xl bg-card p-3.5 sm:p-4 ring-1 ring-black/[0.04]">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm sm:text-base font-bold">Delivery location</h2>
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
          Pin ·{" "}
          {pinCoords ? `${pinCoords.lat.toFixed(4)}, ${pinCoords.lng.toFixed(4)}` : "unavailable"}
          {typeof accuracyMeters === "number" ? ` · accuracy ±${Math.round(accuracyMeters)} m` : ""}
        </p>
        {!pinConfirmed && (
          <p className="mt-1 text-[11px] text-amber-700">
            Previous pin is invalid until you confirm the delivery location again.
          </p>
        )}
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
                    onChange={(e) => {
                      setManualAddress(e.target.value);
                      setCurrentAddress(e.target.value);
                      setPinConfirmed(true);
                    }}
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
                Uses current pin ·{" "}
                {pinCoords
                  ? `${pinCoords.lat.toFixed(4)}, ${pinCoords.lng.toFixed(4)}`
                  : "unavailable"}
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
      <section className="mx-3 sm:mx-5 mt-4 rounded-2xl bg-card p-3.5 sm:p-4 ring-1 ring-black/[0.04]">
        <h2 className="font-display text-sm sm:text-base font-bold">Payment method</h2>
        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
          {[
            { id: "upi" as const, label: "UPI" },
            { id: "card" as const, label: "Card" },
            { id: "cod" as const, label: "Cash" },
          ].map((p) => (
            <m.button
              key={p.id}
              onClick={() => setPay(p.id)}
              className={`rounded-xl border py-2.5 font-bold transition-colors ${pay === p.id ? "border-primary bg-primary text-primary-foreground shadow-xs" : "hairline hover:border-primary/40 bg-white"}`}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.975 }}
            >
              {p.label}
            </m.button>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          UPI and Card use a demo checkout. Real payment remains pending until verified by provider.
        </p>
      </section>

      {/* Coupon & Promotions */}
      <section className="mx-3 sm:mx-5 mt-4 rounded-2xl bg-card p-3.5 sm:p-4 ring-1 ring-black/[0.04] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TicketPercent className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm sm:text-base font-bold">Apply coupon &amp; offers</h2>
          </div>
          {couponQuote && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Coupon Active 🎉
            </span>
          )}
        </div>

        {couponQuote ? (
          <div className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50/70 p-3">
            <div>
              <p className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                <span>{couponQuote.code}</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </p>
              <p className="text-xs text-emerald-700 font-medium">
                You saved ₹{discountAmount} on this order!
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCouponQuote(null);
                setCouponCode("");
                toast.info("Coupon removed.");
              }}
              className="rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              aria-label="Remove coupon"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (event.key === "Enter") void applyCoupon();
              }}
              placeholder="Enter code (e.g. LOCALSHORE50)"
              className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm uppercase"
              aria-label="Coupon code"
            />
            <button
              type="button"
              onClick={() => void applyCoupon()}
              disabled={isApplyingCoupon || !couponCode.trim()}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {isApplyingCoupon ? "Applying…" : "Apply"}
            </button>
          </div>
        )}

        {/* Available Coupons List */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-primary" />
            Available Offers for You:
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {AVAILABLE_COUPONS.map((c) => {
              const isEligible = totals.subtotal >= c.minOrder;
              const isApplied = couponQuote?.code === c.code;

              return (
                <div
                  key={c.code}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                    isApplied
                      ? "border-emerald-500 bg-emerald-50/50"
                      : isEligible
                        ? "border-border bg-card hover:border-primary/40"
                        : "border-border/50 bg-muted/30 opacity-70"
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-primary">{c.code}</span>
                      {c.badge && (
                        <span className="text-[9px] font-extrabold uppercase tracking-widest bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                          {c.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{c.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void applyCoupon(c.code)}
                    disabled={isApplyingCoupon || isApplied}
                    className={`shrink-0 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                      isApplied
                        ? "bg-emerald-600 text-white cursor-default"
                        : isEligible
                          ? "border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                          : "border border-muted text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    {isApplied ? "Applied ✓" : "Apply"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Summary */}
      <section className="mx-3 sm:mx-5 mt-4 mb-28 md:mb-6 rounded-2xl bg-card p-3.5 sm:p-4 ring-1 ring-black/[0.04] font-mono text-sm space-y-1.5">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground font-sans">
          <span className="font-bold text-foreground">{store?.name}</span>
          <span>
            {computedDistanceKm.toFixed(1)} km · ~{computedEtaMin} min
          </span>
        </div>
        <Row label={`Item subtotal (${totals.itemCount})`} value={`₹${totals.subtotal}`} />
        <Row label="Govt. Taxes & GST (5% incl.)" value={`₹${billBreakdown.gstAmount}`} />
        <Row
          label="Delivery fee"
          value={displayDeliveryFee === 0 ? "FREE" : `₹${displayDeliveryFee}`}
        />
        <Row
          label="Platform & packaging fee"
          value={billBreakdown.platformFee === 0 ? "FREE" : `₹${billBreakdown.platformFee}`}
        />
        {couponQuote && discountAmount > 0 && (
          <div className="flex items-center justify-between text-xs text-emerald-600 font-bold py-0.5">
            <span>Coupon savings ({couponQuote.code})</span>
            <span>−₹{discountAmount}</span>
          </div>
        )}
        <div className="my-2 h-px bg-[color-mix(in_oklab,var(--teal)_20%,transparent)]" />
        <Row label="Total Payable" value={`₹${displayTotal}`} bold />
      </section>

      {/* Mobile & Desktop Fixed Checkout Action Bar */}
      <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] md:static md:bg-transparent md:border-none md:p-0 md:shadow-none md:mt-6 md:mx-5">
        <div className="mx-auto max-w-[1600px] flex items-center justify-between gap-3">
          <div className="md:hidden flex flex-col pl-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total Payable
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-lg font-black text-purple-900 font-mono">
                ₹{displayTotal}
              </span>
              {discountAmount > 0 && (
                <span className="text-[10px] font-bold text-emerald-600">
                  (Saved ₹{discountAmount})
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={openPaymentConfirmation}
            disabled={!canPlace || isPlacing || isCheckingStock}
            className="flex-1 md:w-full rounded-xl bg-[var(--marigold)] py-3 px-4 font-display text-base sm:text-lg font-extrabold text-ink shadow-lg hover:brightness-105 active:scale-[0.98] transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isCheckingStock ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Checking availability…</span>
              </>
            ) : isPlacing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Placing order…</span>
              </>
            ) : canPlace ? (
              <>
                <span>Place order</span>
                <span className="hidden md:inline">· ₹{displayTotal}</span>
                <ArrowRight className="h-5 w-5" />
              </>
            ) : (
              "Confirm Delivery Address"
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showOrderSuccess && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] grid place-items-center bg-black/75 px-5 backdrop-blur-md"
            role="status"
            aria-live="polite"
          >
            {/* Confetti particles */}
            <div
              className="pointer-events-none absolute inset-0 overflow-hidden"
              aria-hidden="true"
            >
              {Array.from({ length: 28 }, (_, i) => {
                const colors = [
                  "#10B981", // Emerald
                  "var(--marigold)",
                  "var(--coral)",
                  "#3B82F6", // Blue
                  "#8B5CF6", // Purple
                ];
                const cx = ((i % 7) - 3) * 55;
                return (
                  <i
                    key={i}
                    className="confetti"
                    style={{
                      left: `${6 + ((i * 31) % 88)}%`,
                      animationDelay: `${(i % 6) * 60}ms`,
                      backgroundColor: colors[i % colors.length],
                      ["--cx" as any]: `${cx}px`,
                    }}
                  />
                );
              })}
            </div>

            <m.div
              initial={{ scale: 0.82, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-card p-6 text-center shadow-2xl ring-1 ring-white/10"
            >
              <div className="relative mx-auto mt-2 grid h-20 w-20 place-items-center rounded-full bg-emerald-500 text-white shadow-[0_0_50px_rgba(16,185,129,0.45)] success-check">
                <Check className="h-11 w-11" strokeWidth={3.5} />
              </div>

              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
                <Sparkles className="h-3.5 w-3.5" />
                {pay === "cod" ? "Order Confirmed" : "Payment Verified"}
              </div>

              <h2 className="mt-3 font-display text-2xl font-bold text-foreground">
                {pay === "cod" ? "Order Placed Successfully!" : "Payment Successful!"}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {pay === "cod"
                  ? `₹${placedOrder?.total ?? displayTotal} due on delivery`
                  : `₹${placedOrder?.total ?? displayTotal} paid to LocalShore`}
              </p>

              {/* Receipt snippet card */}
              <div className="mt-5 rounded-2xl bg-muted/40 p-3.5 text-left ring-1 ring-black/[0.04]">
                <div className="flex justify-between border-b pb-2 text-[11px]">
                  <span className="text-muted-foreground">Ref / Txn ID</span>
                  <span className="font-mono font-medium text-foreground">
                    {txnRef || "TXN-8492019"}
                  </span>
                </div>
                <div className="flex justify-between border-b py-2 text-[11px]">
                  <span className="text-muted-foreground">Order Code</span>
                  <span className="font-mono font-semibold text-primary">
                    #{placedOrder?.code || "LS-1024"}
                  </span>
                </div>
                <div className="flex justify-between border-b py-2 text-[11px]">
                  <span className="text-muted-foreground">Shop</span>
                  <span className="font-medium text-foreground">
                    {placedOrder?.storeName || store?.name || "Local Shore shop"}
                  </span>
                </div>
                <div className="flex justify-between pt-2 text-[11px]">
                  <span className="text-muted-foreground">Estimated Delivery</span>
                  <span className="font-semibold text-emerald-600">
                    ~{placedOrder?.etaMin || computedEtaMin} mins
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => {
                    if (placedOrder) {
                      navigate({ to: "/order/$orderId", params: { orderId: placedOrder.id } });
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-sm font-semibold text-primary-foreground shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  Track Order Live
                  <ArrowRight className="h-4 w-4" />
                </button>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Auto-redirecting in{" "}
                  <span className="font-bold text-foreground">{countdown}s</span>...
                </p>
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
            className="fixed inset-0 z-[80] grid place-items-center bg-black/60 px-5 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-payment-title"
            onMouseDown={(event) => {
              if (event.currentTarget === event.target && !isPlacing) setShowDemoPayment(false);
            }}
          >
            <m.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md overflow-hidden rounded-2xl bg-card p-6 shadow-2xl ring-1 ring-black/[0.08]"
            >
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    {pay === "upi" ? (
                      <Smartphone className="h-5 w-5" />
                    ) : pay === "card" ? (
                      <CreditCard className="h-5 w-5" />
                    ) : (
                      <Banknote className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h2 id="demo-payment-title" className="font-display text-lg font-semibold">
                      {pay === "upi"
                        ? "UPI Instant Payment"
                        : pay === "card"
                          ? "Card Authorization"
                          : "Cash on Delivery"}
                    </h2>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      256-bit SSL Secure Checkout
                    </p>
                  </div>
                </div>
                {!isPlacing && (
                  <button
                    onClick={() => setShowDemoPayment(false)}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Order amount breakdown */}
              <div className="my-5 rounded-xl bg-muted/40 p-4 ring-1 ring-black/[0.04]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Paying to</span>
                  <span className="text-xs font-semibold">
                    {store?.name || placedOrder?.storeName || "Local Shore shop"}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-sm font-medium">Total Payable</span>
                  <span className="font-display text-2xl font-bold text-primary">
                    ₹{displayTotal}
                  </span>
                </div>
              </div>

              {/* Step state */}
              {paymentStep === "authorizing" ? (
                <div className="py-6 text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
                    <Loader2 className="h-7 w-7 animate-spin" />
                  </div>
                  <h3 className="mt-3 font-display text-base font-semibold">
                    Authorizing Payment...
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Verifying transaction details with your provider
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDemoPayment(false)}
                    disabled={isPlacing}
                    className="rounded-xl border hairline px-4 py-2.5 text-sm font-medium hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void placeOrder()}
                    disabled={isPlacing}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:brightness-110 disabled:opacity-60"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {pay === "cod" ? "Confirm Order" : `Pay ₹${displayTotal}`}
                  </button>
                </div>
              )}
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
