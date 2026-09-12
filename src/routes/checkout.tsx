import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app-shell";
import { cartStore, useCart, cartTotals } from "@/lib/cart-store";
import { getStore, APPROVED_STORE } from "@/lib/mock-data";
import { ordersStore, addPlacedOrderToCache } from "@/lib/orders-store";
import { supabase } from "@/integrations/supabase/client";
import { addressesStore, useAddresses } from "@/lib/addresses-store";
import { DeliveryMap } from "@/components/delivery-map";
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
  Landmark,
  ShoppingBag,
  MapPin,
  ChevronRight,
  Lock,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, m } from "motion/react";
import type { Order } from "@/lib/orders-store";
import { createRazorpayOrderFn, verifyRazorpayPaymentFn } from "@/lib/razorpay.functions";

function loadRazorpaySDK(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }

    const start = Date.now();
    const timer = setInterval(() => {
      if ((window as any).Razorpay) {
        clearInterval(timer);
        resolve(true);
      } else if (Date.now() - start > 10000) {
        clearInterval(timer);
        console.error("[Razorpay SDK] Timed out waiting for window.Razorpay after 10s");
        resolve(false);
      }
    }, 100);
  });
}

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

  // Payment Selection state
  const [payGroup, setPayGroup] = useState<"upi" | "card" | "online" | "cod">("upi");
  const [upiSubOption, setUpiSubOption] = useState<"gpay" | "phonepe" | "paytm" | "upi">("gpay");

  const [showAdd, setShowAdd] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newLine, setNewLine] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [isCheckingStock, setIsCheckingStock] = useState(true);

  // Coupon state
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponQuote, setCouponQuote] = useState<CouponQuote | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const geocodeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Razorpay server function hooks
  const createRazorpayOrder = useServerFn(createRazorpayOrderFn);
  const verifyRazorpayPayment = useServerFn(verifyRazorpayPaymentFn);
  const [razorpayAttempt, setRazorpayAttempt] = useState<any>(null);
  const [paymentStatusText, setPaymentStatusText] = useState("");

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

  const [paymentStep, setPaymentStep] = useState<"idle" | "authorizing">("idle");
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [txnRef, setTxnRef] = useState("");
  const [countdown, setCountdown] = useState(4);

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
    setPinCoords(coords);
    setPinConfirmed(true);
    setAccuracyMeters(accuracy);
    setAddr(CURRENT_LOCATION_ID);

    if (geocodeDebounceRef.current) clearTimeout(geocodeDebounceRef.current);
    geocodeDebounceRef.current = setTimeout(async () => {
      setCurrentAddress(`Finding address for ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}…`);
      setManualAddress("");
      try {
        const result = await reverseGeocodeFn({ data: coords });
        setCurrentAddress(result.address);
        setManualAddress(result.address);
        if (showAdd && !newLine.trim()) setNewLine(result.address);
      } catch (error) {
        setCurrentAddress(`${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
        setManualAddress("");
      }
      setLocStatus("ok");
    }, 5000);

    setCurrentAddress(`${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
    setLocStatus("ok");
  };

  const geolocationOptions: PositionOptions = {
    enableHighAccuracy: false,
    timeout: 15000,
    maximumAge: 10000,
  };

  const stopLiveLocation = () => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (geocodeDebounceRef.current) {
      clearTimeout(geocodeDebounceRef.current);
      geocodeDebounceRef.current = null;
    }
    setIsTracking(false);
  };

  const validateGeolocationRuntime = () => {
    const isLocalhost =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (!window.isSecureContext && !isLocalhost) {
      setLocStatus("error");
      setLocError("Location requires HTTPS. Open this app over HTTPS or localhost.");
      return false;
    }
    if (!navigator.geolocation) {
      setLocStatus("error");
      setLocError("Location is not supported by this browser.");
      return false;
    }
    return true;
  };

  const handleGeolocationError = (err: GeolocationPositionError, inIframe: boolean) => {
    const iframeHint = inIframe
      ? " (This preview runs inside an iframe — open site in a new tab for precise location.)"
      : "";
    const msg =
      err.code === err.PERMISSION_DENIED
        ? "Location permission denied. Allow location access in browser settings." + iframeHint
        : err.code === err.POSITION_UNAVAILABLE
          ? "Precise location unavailable. Move near a window and enable GPS."
          : err.code === err.TIMEOUT
            ? "Precise location timed out. Try again in an open area." + iframeHint
            : "Couldn't get precise location.";
    setLocStatus("error");
    setLocError(msg);
    setIsTracking(false);
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

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (err) => {
        if (err.code === err.TIMEOUT) {
          navigator.geolocation.getCurrentPosition(
            onSuccess,
            (fallbackErr) => handleGeolocationError(fallbackErr, inIframe),
            geolocationOptions,
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

    const onInitialFix = (pos: GeolocationPosition) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      void applyCoords(coords, pos.coords.accuracy);
    };
    navigator.geolocation.getCurrentPosition(
      onInitialFix,
      (err) => {
        if (err.code === err.TIMEOUT) {
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
        void applyCoords(coords, pos.coords.accuracy);
      },
      (err) => handleGeolocationError(err, inIframe),
      geolocationOptions,
    );
    watchIdRef.current = watchId;
    setIsTracking(true);
  };

  const toggleLiveLocation = () => {
    if (isTracking) {
      stopLiveLocation();
      return;
    }
    startLiveLocation();
  };

  useEffect(() => {
    void loadRazorpaySDK();
  }, []);

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
        <div className="mx-auto max-w-md mt-16 rounded-2xl border border-slate-200 bg-card p-8 text-center shadow-xs">
          <ShoppingBag className="mx-auto h-12 w-12 text-slate-300" />
          <p className="font-display text-xl font-bold text-foreground mt-3">Your cart is empty</p>
          <p className="text-sm text-muted-foreground mt-1">Add items from local stores to proceed with checkout.</p>
          <Link
            to="/"
            search={{ category: undefined, q: undefined }}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:brightness-105 transition-all"
          >
            Explore Local Stores
            <ArrowRight className="h-4 w-4" />
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

  const openPaymentConfirmation = async () => {
    if (!selectedAddressLine || isPlacing || isCheckingStock) return;
    if (!canPlace) {
      toast.error("Confirm the delivery location before continuing.");
      return;
    }
    if (payGroup === "cod") {
      void placeOrder();
      return;
    }
    await initiateRazorpayCheckout();
  };

  const initiateRazorpayCheckout = async () => {
    const destinationCoords = pinCoords || { lat: store?.lat ?? 11.0168, lng: store?.lng ?? 76.9558 };
    if (!selectedAddressLine || isPlacing || !store) return;
    setIsPlacing(true);
    setPaymentStep("authorizing");
    setPaymentStatusText("Creating secure Razorpay order...");

    try {
      const rzpOrder = await createRazorpayOrder({
        data: {
          items: cart.lines.map((line) => ({ product_id: line.productId, qty: line.qty })),
          address: selectedAddressLine,
          coupon_code: couponQuote?.code,
          customer_latitude: destinationCoords.lat,
          customer_longitude: destinationCoords.lng,
        },
      });

      setRazorpayAttempt(rzpOrder);
      setPaymentStatusText("Opening Payment Gateway...");

      const isLoaded = await loadRazorpaySDK();

      if (isLoaded && (window as any).Razorpay) {
        const { data: session } = await supabase.auth.getSession();
        const user = session.session?.user;
        const keyToUse = rzpOrder.key_id || "rzp_test_TZuWMII8yHQgzt";

        // Map payGroup/upiSubOption to human description
        const selectedMethodLabel =
          payGroup === "upi"
            ? upiSubOption === "gpay"
              ? "Google Pay (UPI)"
              : upiSubOption === "phonepe"
                ? "PhonePe (UPI)"
                : upiSubOption === "paytm"
                  ? "Paytm (UPI)"
                  : "UPI"
            : payGroup === "card"
              ? "Credit/Debit Card"
              : "Netbanking / Wallet";

        const options: any = {
          key: keyToUse,
          amount: rzpOrder.amount_paise,
          currency: rzpOrder.currency || "INR",
          name: "LocalShore Marketplace",
          description: `Order from ${store.name}`,
          config: {
            display: {
              blocks: {
                upi_block: {
                  name: "Pay via UPI",
                  instruments: [{ method: "upi" }],
                },
                other_block: {
                  name: "Cards & Netbanking",
                  instruments: [{ method: "card" }, { method: "netbanking" }, { method: "wallet" }],
                },
              },
              sequence: ["block.upi_block", "block.other_block"],
              preferences: {
                show_default_blocks: true,
              },
            },
          },
          prefill: {
            name: user?.user_metadata?.display_name || "Customer",
            email: user?.email || "customer@localshore.in",
            contact: user?.phone || "9876543210",
            method: payGroup === "upi" ? "upi" : payGroup === "card" ? "card" : payGroup === "online" ? "netbanking" : undefined,
          },
          theme: { color: "#2A6F77" },
          handler: async function (response: any) {
            setPaymentStatusText("Verifying cryptographic signature...");
            try {
              const verifyRes = await verifyRazorpayPayment({
                data: {
                  payment_attempt_id: rzpOrder.payment_attempt_id,
                  razorpay_order_id: response.razorpay_order_id || rzpOrder.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
                  razorpay_signature: response.razorpay_signature || "sig_test_verified",
                  buyer_name: user?.user_metadata?.display_name || user?.email || "Customer",
                  buyer_phone: user?.phone,
                  buyer_address: selectedAddressLine,
                  items: cart.lines.map((l) => ({ product_id: l.productId, qty: l.qty })),
                  coupon_code: couponQuote?.code,
                  customer_latitude: destinationCoords.lat,
                  customer_longitude: destinationCoords.lng,
                  payment_method: selectedMethodLabel,
                },
              });

              if (verifyRes.success && verifyRes.order) {
                cartStore.clear();
                setTxnRef(response.razorpay_payment_id);
                const newOrderObj = {
                  id: verifyRes.order.id,
                  code: verifyRes.order.code,
                  storeId: verifyRes.order.seller_id,
                  storeName: store.name,
                  lines: cart.lines,
                  subtotal: totals.subtotal,
                  deliveryFee: displayDeliveryFee,
                  total: verifyRes.order.total,
                  address: selectedAddressLine,
                  destination: destinationCoords,
                  paymentMethod: selectedMethodLabel,
                  createdAt: Date.now(),
                  status: "new" as const,
                  etaMin: computedEtaMin,
                  distanceKm: computedDistanceKm,
                };
                addPlacedOrderToCache(newOrderObj);
                setPlacedOrder(newOrderObj);
                playPaymentSuccessSound();
                toast.success(`Payment of ₹${verifyRes.order.total} verified!`);
                setPaymentStep("idle");
                setShowOrderSuccess(true);
              }
            } catch (err: any) {
              console.error("[razorpay checkout verification failed]", err);
              toast.error(err.message || "Payment signature verification failed.");
            } finally {
              setIsPlacing(false);
              setPaymentStep("idle");
            }
          },
          modal: {
            ondismiss: function () {
              toast.info("Payment process cancelled.");
              setIsPlacing(false);
              setPaymentStep("idle");
            },
          },
        };

        const razorpayInstance = new (window as any).Razorpay(options);
        razorpayInstance.on("payment.failed", function (response: any) {
          toast.error(response.error?.description || "Payment process failed.");
          setIsPlacing(false);
          setPaymentStep("idle");
        });

        razorpayInstance.open();
        setIsPlacing(false);
        setPaymentStep("idle");
      } else {
        toast.error("Failed to load Razorpay payment SDK.");
        setIsPlacing(false);
        setPaymentStep("idle");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to launch payment checkout.");
      setIsPlacing(false);
      setPaymentStep("idle");
    }
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

    await new Promise((resolve) => setTimeout(resolve, 650));

    try {
      const generatedTxn = `COD-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const order = await ordersStore.place({
        storeId: store.id,
        storeName: store.name,
        lines: cart.lines,
        subtotal: totals.subtotal,
        deliveryFee: displayDeliveryFee,
        total: displayTotal,
        address: selectedAddressLine,
        destination: destinationCoords,
        paymentMethod: "Cash on delivery",
        couponCode: couponQuote?.code,
        discountAmount,
        etaMin: computedEtaMin,
        distanceKm: computedDistanceKm,
      });

      cartStore.clear();
      setTxnRef(generatedTxn);
      setPlacedOrder(order);

      playPaymentSuccessSound();
      toast.success("Order placed! Pay cash on delivery.");

      setPaymentStep("idle");
      setShowOrderSuccess(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place order. Try again.");
      setPaymentStep("idle");
      setIsPlacing(false);
      return;
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <AppShell>
      {/* Fullscreen Lottie Loader */}
      <SmartLottieLoader
        show={isPlacing}
        delayMs={0}
        mode="fullscreen"
        size="xl"
        message={`Connecting to secure gateway for ${store?.name || "LocalShore"}...`}
        subtext="Verifying item availability & establishing 256-bit encrypted session"
      />

      {/* Page Header */}
      <div className="bg-slate-50/70 border-b border-slate-200/60 py-4 sm:py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Checkout</p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Complete Your Order
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs self-start sm:self-auto">
            <Lock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>256-bit Encrypted Checkout</span>
          </div>
        </div>
      </div>

      {/* Two-Column Responsive Layout */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 pb-36 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* ==================================================== */}
          {/* LEFT / MAIN COLUMN (8 cols on Desktop) */}
          {/* ==================================================== */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">

            {/* 1. DELIVERY LOCATION CARD */}
            <section className="rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-teal-50 text-[var(--teal)] font-bold">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-bold text-foreground">Delivery address</h2>
                    <p className="text-xs text-muted-foreground">Select doorstep location for drop-off</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleLiveLocation}
                    disabled={locStatus === "loading" && !isTracking}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-primary/40 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    <Crosshair className={`h-3.5 w-3.5 ${locStatus === "loading" || isTracking ? "animate-spin text-primary" : ""}`} />
                    {isTracking ? "Tracking" : locStatus === "loading" ? "Locating…" : "GPS"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMap((prev) => !prev)}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 px-3 py-1 text-xs font-bold transition-all cursor-pointer"
                  >
                    <span>{showMap ? "Hide map" : "Pin map"}</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showMap ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </div>

              {showMap && (
                <div className="mt-3 rounded-xl overflow-hidden border border-slate-200">
                  <DeliveryMap
                    store={store ? { lat: store.lat, lng: store.lng, label: store.name } : undefined}
                    destination={pinCoords}
                    accuracyMeters={accuracyMeters}
                    interactive
                    onDestinationChange={updatePin}
                    height={200}
                  />
                  <p className="p-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground bg-slate-50 border-t border-slate-200">
                    Pin · {pinCoords ? `${pinCoords.lat.toFixed(4)}, ${pinCoords.lng.toFixed(4)}` : "unavailable"}
                    {typeof accuracyMeters === "number" ? ` · accuracy ±${Math.round(accuracyMeters)} m` : ""}
                  </p>
                </div>
              )}

              {locStatus === "error" && <p className="text-xs text-destructive">{locError}</p>}

              <div className="space-y-2 pt-1">
                {savedAddresses.length === 0 && (
                  <p className="rounded-xl border border-slate-200/60 p-3 text-xs text-muted-foreground">
                    No saved addresses yet — select current location or add new.
                  </p>
                )}

                {currentAddress && (
                  <div
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-all ${
                      addr === CURRENT_LOCATION_ID ? "border-primary bg-primary/5 shadow-2xs" : "border-slate-200/70 hover:border-slate-300"
                    }`}
                    onClick={() => chooseAddr(CURRENT_LOCATION_ID)}
                  >
                    <input
                      type="radio"
                      name="addr"
                      checked={addr === CURRENT_LOCATION_ID}
                      onChange={() => chooseAddr(CURRENT_LOCATION_ID)}
                      className="mt-1 h-4 w-4 accent-primary"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-foreground">Current GPS location</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{currentAddress}</p>
                      {addr === CURRENT_LOCATION_ID && (
                        <textarea
                          value={manualAddress}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            setManualAddress(e.target.value);
                            setCurrentAddress(e.target.value);
                            setPinConfirmed(true);
                          }}
                          placeholder="House / Flat / Door No., Street or Landmark"
                          rows={2}
                          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      )}
                    </div>
                  </div>
                )}

                {savedAddresses.map((a) => (
                  <label
                    key={a.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-all ${
                      addr === a.id ? "border-primary bg-primary/5 shadow-2xs" : "border-slate-200/70 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="addr"
                      checked={addr === a.id}
                      onChange={() => chooseAddr(a.id)}
                      className="mt-1 h-4 w-4 accent-primary"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-foreground">{a.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.line}</p>
                    </div>
                  </label>
                ))}

                {showAdd ? (
                  <div className="rounded-xl border border-slate-200 p-3.5 space-y-2 bg-slate-50/50">
                    <input
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="Label (Home, Office, Friend's Place)"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                    />
                    <textarea
                      value={newLine}
                      onChange={(e) => setNewLine(e.target.value)}
                      placeholder="Full street address"
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={saveNewAddress}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-2xs"
                      >
                        <Check className="h-3.5 w-3.5" /> Save Address
                      </button>
                      <button
                        onClick={() => {
                          setShowAdd(false);
                          setNewLabel("");
                          setNewLine("");
                        }}
                        className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAdd(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-primary hover:text-primary transition-colors cursor-pointer mt-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add new address
                  </button>
                )}
              </div>
            </section>

            {/* 2. ORDER ITEMS CARD */}
            <section className="rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-purple-50 text-purple-900 font-bold">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-bold text-foreground">Items from {store?.name}</h2>
                    <p className="text-xs text-muted-foreground">{totals.itemCount} items · ~{computedEtaMin} min delivery</p>
                  </div>
                </div>
                <span className="font-mono font-extrabold text-sm text-foreground">₹{totals.subtotal}</span>
              </div>

              <div className="mt-3 space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {cart.lines.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between gap-3 text-xs py-1.5 border-b border-slate-100 last:border-none">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
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

            {/* 3. OFFERS & COUPONS COMPACT TRIGGER ROW */}
            <section className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-700 font-bold">
                    <TicketPercent className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-sm font-bold text-foreground">Offers & coupons</h2>
                    <p className="text-xs text-muted-foreground">Save more with available offers</p>
                  </div>
                </div>

                {couponQuote ? (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        {couponQuote.code}
                      </span>
                      <p className="text-[11px] font-bold text-emerald-600">-₹{discountAmount}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCouponQuote(null);
                        setCouponCode("");
                        toast.info("Coupon removed.");
                      }}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline underline-offset-2"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCouponModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    <span>Apply Coupon</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </section>

            {/* 4. VERTICAL PAYMENT METHOD GROUP SELECTOR */}
            <section className="rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4">
              <div>
                <h2 className="font-display text-base font-bold text-foreground">Select Payment Method</h2>
                <p className="text-xs text-muted-foreground">100% Secure & Cryptographically Verified</p>
              </div>

              <div className="space-y-3" role="radiogroup" aria-label="Payment method">
                
                {/* 4.1 UPI (RECOMMENDED) */}
                <div
                  onClick={() => setPayGroup("upi")}
                  className={`rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                    payGroup === "upi"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-2xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className={`grid h-10 w-10 place-items-center rounded-xl transition-colors ${
                        payGroup === "upi" ? "bg-primary text-white" : "bg-slate-100 text-slate-700"
                      }`}>
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm font-bold text-foreground">UPI (Instant & Free)</span>
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Recommended
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Google Pay · PhonePe · Paytm · BHIM</p>
                      </div>
                    </div>

                    <div className={`h-5 w-5 rounded-full border-2 grid place-items-center transition-colors ${
                      payGroup === "upi" ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"
                    }`}>
                      {payGroup === "upi" && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </div>

                  {/* Progressive Disclosure: UPI Apps sub-options */}
                  {payGroup === "upi" && (
                    <div className="border-t border-primary/10 bg-white/80 p-3.5 space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                        Select UPI App:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "gpay" as const, name: "Google Pay", icon: "🟢" },
                          { id: "phonepe" as const, name: "PhonePe", icon: "🟣" },
                          { id: "paytm" as const, name: "Paytm UPI", icon: "🔵" },
                          { id: "upi" as const, name: "Other UPI / QR", icon: "⚡" },
                        ].map((app) => (
                          <label
                            key={app.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setUpiSubOption(app.id);
                            }}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                              upiSubOption === app.id
                                ? "border-primary bg-primary/10 text-primary shadow-2xs font-bold"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <input
                              type="radio"
                              name="upiApp"
                              checked={upiSubOption === app.id}
                              onChange={() => setUpiSubOption(app.id)}
                              className="h-3.5 w-3.5 accent-primary"
                            />
                            <span>{app.icon}</span>
                            <span>{app.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4.2 CREDIT & DEBIT CARDS */}
                <div
                  onClick={() => setPayGroup("card")}
                  className={`rounded-2xl border transition-all cursor-pointer p-4 ${
                    payGroup === "card"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-2xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`grid h-10 w-10 place-items-center rounded-xl transition-colors ${
                        payGroup === "card" ? "bg-primary text-white" : "bg-slate-100 text-slate-700"
                      }`}>
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-display text-sm font-bold text-foreground">Credit / Debit Cards</span>
                        <p className="text-xs text-muted-foreground">Visa · Mastercard · RuPay · Diners</p>
                      </div>
                    </div>

                    <div className={`h-5 w-5 rounded-full border-2 grid place-items-center transition-colors ${
                      payGroup === "card" ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"
                    }`}>
                      {payGroup === "card" && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </div>

                {/* 4.3 NETBANKING & WALLETS */}
                <div
                  onClick={() => setPayGroup("online")}
                  className={`rounded-2xl border transition-all cursor-pointer p-4 ${
                    payGroup === "online"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-2xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`grid h-10 w-10 place-items-center rounded-xl transition-colors ${
                        payGroup === "online" ? "bg-primary text-white" : "bg-slate-100 text-slate-700"
                      }`}>
                        <Landmark className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-display text-sm font-bold text-foreground">Netbanking & Wallets</span>
                        <p className="text-xs text-muted-foreground">HDFC, ICICI, SBI, Axis, Mobikwik & more</p>
                      </div>
                    </div>

                    <div className={`h-5 w-5 rounded-full border-2 grid place-items-center transition-colors ${
                      payGroup === "online" ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"
                    }`}>
                      {payGroup === "online" && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </div>

                {/* 4.4 CASH ON DELIVERY */}
                <div
                  onClick={() => setPayGroup("cod")}
                  className={`rounded-2xl border transition-all cursor-pointer p-4 ${
                    payGroup === "cod"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-2xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`grid h-10 w-10 place-items-center rounded-xl transition-colors ${
                        payGroup === "cod" ? "bg-primary text-white" : "bg-slate-100 text-slate-700"
                      }`}>
                        <Banknote className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-display text-sm font-bold text-foreground">Cash on Delivery</span>
                        <p className="text-xs text-muted-foreground">Pay with cash or UPI to partner at doorstep</p>
                      </div>
                    </div>

                    <div className={`h-5 w-5 rounded-full border-2 grid place-items-center transition-colors ${
                      payGroup === "cod" ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"
                    }`}>
                      {payGroup === "cod" && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </div>

              </div>
            </section>

          </div>

          {/* ==================================================== */}
          {/* RIGHT / STICKY COLUMN (4 cols on Desktop) */}
          {/* ==================================================== */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 space-y-4">
            
            {/* SAVINGS HIGHLIGHT BANNER */}
            {discountAmount > 0 && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Total Savings Unlocked</p>
                <p className="font-display text-2xl font-extrabold text-emerald-950 mt-0.5">
                  🎉 You saved ₹{discountAmount} on this order!
                </p>
              </div>
            )}

            {/* BILL SUMMARY CARD */}
            <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs space-y-3 font-sans">
              <h3 className="font-display text-base font-bold text-foreground border-b border-slate-100 pb-2">
                Order Summary
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Item Total ({totals.itemCount} items)</span>
                  <span className="font-mono font-medium text-foreground">₹{totals.subtotal}</span>
                </div>

                {couponQuote && discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Coupon Savings ({couponQuote.code})</span>
                    <span className="font-mono">-₹{discountAmount}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Delivery Partner Fee</span>
                  <span className="font-mono font-medium text-foreground">
                    {displayDeliveryFee === 0 ? "FREE" : `₹${displayDeliveryFee}`}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Platform & Packaging Fee</span>
                  <span className="font-mono font-medium text-foreground">
                    {billBreakdown.platformFee === 0 ? "FREE" : `₹${billBreakdown.platformFee}`}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Govt. Taxes & GST (5% incl.)</span>
                  <span className="font-mono font-medium text-foreground">₹{billBreakdown.gstAmount}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 flex items-baseline justify-between">
                <div>
                  <span className="font-display text-sm font-bold text-foreground block">To Pay</span>
                  {discountAmount > 0 && (
                    <span className="text-[11px] font-bold text-emerald-600">Total savings: ₹{discountAmount}</span>
                  )}
                </div>
                <span className="font-display text-2xl font-extrabold text-foreground font-mono">
                  ₹{displayTotal}
                </span>
              </div>

              {/* PRIMARY PAY BUTTON ON DESKTOP */}
              <button
                type="button"
                onClick={openPaymentConfirmation}
                disabled={!canPlace || isPlacing || isCheckingStock}
                className="w-full rounded-xl bg-primary py-3.5 px-4 font-display text-base font-extrabold text-primary-foreground shadow-md hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {isCheckingStock ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Checking availability…</span>
                  </>
                ) : isPlacing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing order…</span>
                  </>
                ) : canPlace ? (
                  <>
                    <span>Pay ₹{displayTotal} securely</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                ) : (
                  "Confirm Delivery Location"
                )}
              </button>

              <div className="pt-2 text-center">
                <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Secure 256-bit SSL encrypted payment powered by Razorpay</span>
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ==================================================== */}
      {/* MOBILE STICKY BOTTOM PAYMENT BAR */}
      {/* ==================================================== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3.5 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
        <div className="mx-auto max-w-md flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">To Pay</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-xl font-extrabold text-foreground font-mono">₹{displayTotal}</span>
              {discountAmount > 0 && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Saved ₹{discountAmount}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={openPaymentConfirmation}
            disabled={!canPlace || isPlacing || isCheckingStock}
            className="flex-1 rounded-xl bg-primary py-3 px-4 font-display text-sm font-extrabold text-primary-foreground shadow-md hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isCheckingStock ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Checking availability…</span>
              </>
            ) : isPlacing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing…</span>
              </>
            ) : canPlace ? (
              <>
                <span>Pay ₹{displayTotal} securely</span>
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              "Confirm Location"
            )}
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* COUPON BOTTOM SHEET / MODAL */}
      {/* ==================================================== */}
      <AnimatePresence>
        {showCouponModal && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
            onClick={() => setShowCouponModal(false)}
          >
            <m.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <TicketPercent className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-lg font-bold text-foreground">Offers & coupons</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Input box */}
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void applyCoupon().then(() => {
                        if (couponQuote) setShowCouponModal(false);
                      });
                    }
                  }}
                  placeholder="Enter coupon code (e.g. LOCALSHORE50)"
                  className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm uppercase font-mono tracking-wider focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={async () => {
                    await applyCoupon();
                    setShowCouponModal(false);
                  }}
                  disabled={isApplyingCoupon || !couponCode.trim()}
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-105 disabled:opacity-50 cursor-pointer"
                >
                  {isApplyingCoupon ? "Applying..." : "Apply"}
                </button>
              </div>

              {/* Available coupons list */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Best offers for you</p>
                <div className="space-y-2.5">
                  {AVAILABLE_COUPONS.map((c) => {
                    const isEligible = totals.subtotal >= c.minOrder;
                    const isApplied = couponQuote?.code === c.code;

                    return (
                      <div
                        key={c.code}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isApplied
                            ? "border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500/30"
                            : isEligible
                              ? "border-slate-200 bg-white hover:border-primary/40 shadow-2xs"
                              : "border-slate-200/60 bg-slate-50 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-extrabold text-sm text-primary tracking-wide">{c.code}</span>
                              {c.badge && (
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                  {c.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-foreground mt-1">{c.description}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">On orders above ₹{c.minOrder}</p>
                          </div>

                          <button
                            type="button"
                            onClick={async () => {
                              await applyCoupon(c.code);
                              setShowCouponModal(false);
                            }}
                            disabled={isApplyingCoupon || isApplied || !isEligible}
                            className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                              isApplied
                                ? "bg-emerald-600 text-white cursor-default"
                                : isEligible
                                  ? "bg-primary text-white hover:brightness-105 shadow-2xs cursor-pointer"
                                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
                            }`}
                          >
                            {isApplied ? "Applied ✓" : "Apply"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* ==================================================== */}
      {/* ORDER SUCCESS MODAL */}
      {/* ==================================================== */}
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
            <div
              className="pointer-events-none absolute inset-0 overflow-hidden"
              aria-hidden="true"
            >
              {Array.from({ length: 28 }, (_, i) => {
                const colors = [
                  "#10B981",
                  "var(--marigold)",
                  "var(--coral)",
                  "#3B82F6",
                  "#8B5CF6",
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
                {payGroup === "cod" ? "Order Confirmed" : "Payment Verified"}
              </div>

              <h2 className="mt-3 font-display text-2xl font-bold text-foreground">
                {payGroup === "cod" ? "Order Placed Successfully!" : "Payment Successful!"}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {payGroup === "cod"
                  ? `₹${placedOrder?.total ?? displayTotal} due on delivery`
                  : `₹${placedOrder?.total ?? displayTotal} paid to LocalShore`}
              </p>

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

              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => {
                    if (placedOrder) {
                      navigate({ to: "/order/$orderId", params: { orderId: placedOrder.id } });
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-sm font-semibold text-primary-foreground shadow-lg hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
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
    </AppShell>
  );
}
