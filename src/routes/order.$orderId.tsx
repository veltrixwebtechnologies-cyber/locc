import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  useOrdersState,
  getCachedOrder,
  orderStatusFlow,
  orderStatusLabel,
  cancelOrder,
  type OrderStatus,
  type Order,
} from "@/modules/shopper/services/orders-store";
import { cartStore } from "@/modules/shopper/services/cart-store";
import { getStore } from "@/lib/mock-data";
import { DeliveryMap } from "@/components/delivery-map";
import {
  Clock,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  Zap,
  XCircle,
  Printer,
  FileText,
  RotateCcw,
  X,
  ShoppingBag,
  Check,
  PackageCheck,
  Store,
  Bike,
  Navigation,
  Sparkles,
  Play,
  Pause,
  FastForward,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { m } from "motion/react";
import { OrderSupport } from "@/components/order-support";
import { DeliveryAnimation } from "@/components/delivery-animation";
import { LottieLoading } from "@/components/ui/lottie-loading";
import { OrderRefundPanel } from "@/components/order-refund-panel";
import { getOrderProgressIndex } from "@/lib/order-progress";

export const Route = createFileRoute("/order/$orderId")({
  component: OrderRoutePage,
});

function OrderRoutePage() {
  return <OrderPage />;
}

const stepDetails: Record<
  string,
  { label: string; desc: string; icon: any; timeEstimate: string }
> = {
  new: {
    label: "Order Placed & Confirmed",
    desc: "Payment verified. Order forwarded directly to neighborhood shop.",
    icon: ShoppingBag,
    timeEstimate: "Just now",
  },
  vendor_accepted: {
    label: "Shop Accepted & Preparing",
    desc: "The merchant has accepted your order and fresh packing is underway.",
    icon: Store,
    timeEstimate: "~3 mins",
  },
  ready_for_pickup: {
    label: "Packed & Ready for Pickup",
    desc: "Order packed with quality check and sealed with tamper-proof tape.",
    icon: PackageCheck,
    timeEstimate: "~8 mins",
  },
  delivery_partner_assigned: {
    label: "Delivery Partner Assigned",
    desc: "Dedicated top-rated rider assigned and navigating toward the shop.",
    icon: ShieldCheck,
    timeEstimate: "~10 mins",
  },
  arrived_at_vendor: {
    label: "Partner Arrived at Shop",
    desc: "Rider reached store counter to collect your sealed package.",
    icon: MapPin,
    timeEstimate: "~14 mins",
  },
  picked_up: {
    label: "Order Picked Up",
    desc: "Rider collected your order after verifying the items and OTP.",
    icon: Bike,
    timeEstimate: "~17 mins",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    desc: "Your rider is en route to your address. Live GPS tracking active.",
    icon: Navigation,
    timeEstimate: "~22 mins",
  },
  delivered: {
    label: "Delivered Successfully",
    desc: "Package handed over with care. Thank you for shopping local!",
    icon: Sparkles,
    timeEstimate: "Complete",
  },
};

function getDemoOrderFallback(orderId: string): Order | undefined {
  if (!orderId) return undefined;
  return {
    id: orderId,
    code: orderId.startsWith("demo-") ? `LS-${orderId.slice(5, 9).toUpperCase()}` : "LS-9926",
    storeId: "coimbatore-central",
    storeName: "M Yum Cakes",
    lines: [
      {
        productId: "p-cake-1",
        orderItemId: "item-1",
        storeId: "coimbatore-central",
        name: "Chocolate Cake",
        unit: "1 kg",
        price: 680,
        qty: 1,
      },
    ],
    subtotal: 680,
    deliveryFee: 45,
    total: 755,
    address: "15/210, NSR Rd, Saibaba Colony, Coimbatore, Tamil Nadu 641011",
    destination: { lat: 11.025, lng: 76.945 },
    paymentMethod: "Razorpay Test Checkout",
    isDemoPayment: true,
    createdAt: Date.now() - 180000,
    status: "vendor_accepted",
    etaMin: 22,
    distanceKm: 2.1,
    partner: {
      name: "Murugan Selvam",
      rating: 4.9,
      vehicle: "Hero Electric Optima",
      deliveriesCount: 412,
      lat: 11.022,
      lng: 76.948,
    },
    deliveryOtp: "4928",
  };
}

function DeliveryTimingHero({ order }: { order: Order }) {
  const isDelivered = order.status === "delivered";
  const isCancelled = order.status === "cancelled";

  // Re-evaluate periodically so remaining minutes decrement in real-time
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (isDelivered || isCancelled) return;
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, [isDelivered, isCancelled]);

  const timing = useMemo(() => {
    const orderCreatedAtMs = new Date(order.createdAt).getTime();
    const initialEtaMins = order.etaMin || 25;
    const initialEtaMs = initialEtaMins * 60 * 1000;
    const targetArrivalMs = orderCreatedAtMs + initialEtaMs;

    // Remaining minutes until delivery
    const remainingMs = targetArrivalMs - now;
    const remainingMins = Math.round(remainingMs / 60000);

    const arrivalDate = new Date(targetArrivalMs);
    const expectedTimeStr = arrivalDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (remainingMins <= 0) {
      return {
        title: "Arriving Any Moment",
        isDelayed: true,
        expectedTimeStr,
      };
    }

    return {
      title: remainingMins === 1 ? "Arriving in ~1 Min" : `Arriving in ~${remainingMins} Mins`,
      isDelayed: false,
      expectedTimeStr,
    };
  }, [order.createdAt, order.etaMin, now]);

  return (
    <div className="mx-5 mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 p-5 text-white shadow-xl ring-1 ring-white/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {isDelivered
                ? "Order Completed"
                : isCancelled
                  ? "Order Cancelled"
                  : "Live Delivery Status"}
            </span>
          </div>

          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white">
            {isDelivered
              ? "Delivered Successfully 🎉"
              : isCancelled
                ? "Order Cancelled"
                : timing.title}
          </h2>

          {!isDelivered && !isCancelled && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-300">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span>
                {timing.isDelayed ? (
                  <>
                    Estimated Arrival ~<strong className="text-white font-semibold">{timing.expectedTimeStr}</strong>
                    {" "}<span className="text-emerald-300 font-medium">(Arriving any moment)</span>
                  </>
                ) : (
                  <>
                    Expected Arrival by{" "}
                    <strong className="text-white font-semibold">{timing.expectedTimeStr}</strong>
                  </>
                )}
              </span>
            </p>
          )}
        </div>

        <div className="flex flex-col items-end">
          <div className="rounded-xl bg-white/10 px-3 py-1.5 backdrop-blur-md border border-white/10 text-right">
            <p className="font-mono text-[10px] uppercase text-emerald-300">Distance</p>
            <p className="font-mono text-sm font-bold text-white">
              {order.distanceKm.toFixed(1)} km
            </p>
          </div>
        </div>
      </div>

      {!isDelivered && !isCancelled && (
        <div className="mt-4 border-t border-white/10 pt-3 flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
            <Zap className="h-3.5 w-3.5" />
            Express Direct Local Dispatch
          </span>
          <span className="font-mono text-[11px] text-slate-400">Order #{order.code}</span>
        </div>
      )}
    </div>
  );
}

function DeliveryPartnerCard({
  partner,
  orderStatus,
}: {
  partner?: Order["partner"];
  orderStatus: OrderStatus;
}) {
  const [userRating, setUserRating] = useState<number | null>(partner?.userRating ?? null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleRate = (rating: number) => {
    setUserRating(rating);
    toast.success(`Thank you! You rated the delivery partner ${rating} ★`);
  };

  if (!partner) {
    if (orderStatus === "delivered" || orderStatus === "cancelled" || orderStatus === "returned") {
      return null;
    }
    return (
      <div className="mx-5 mt-4 rounded-2xl bg-card p-4 border border-dashed border-primary/30 ring-1 ring-black/[0.04] text-center shadow-sm">
        <div className="flex items-center justify-center gap-2 text-primary font-semibold text-sm">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Assigning Top-Rated Local Rider
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          All Local Shore delivery partners maintain a 4.8★+ safety and speed rating.
        </p>
      </div>
    );
  }

  const ratingValue = userRating ?? partner.rating ?? 4.9;

  return (
    <section className="mx-5 mt-4 rounded-2xl bg-card p-5 ring-1 ring-black/[0.06] shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-600 text-white font-display text-lg font-bold shadow-md">
              {partner.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div
              className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-amber-400 text-slate-950 ring-2 ring-card"
              title="Verified Partner"
            >
              <ShieldCheck className="h-3 w-3" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground">{partner.name}</p>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                Verified Rider
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {partner.vehicle ?? "Hero Electric Scooter"}
            </p>
            <div className="mt-1 flex items-center gap-1 font-mono text-xs">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 stroke-amber-400" />
              <span className="font-bold text-foreground">{ratingValue.toFixed(1)}</span>
              <span className="text-muted-foreground">
                ({partner.deliveriesCount ?? 340}+ orders)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toast.info(`Connecting phone call to ${partner.name}...`)}
            aria-label="Call Rider"
            className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm hover:brightness-110 active:scale-95 transition-all"
          >
            <Phone className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => toast.info(`Opening chat with ${partner.name}...`)}
            aria-label="Message Rider"
            className="grid h-10 w-10 place-items-center rounded-full border hairline bg-card text-foreground hover:bg-muted active:scale-95 transition-all"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Interactive Rider Star Rating Block */}
      <div className="mt-4 border-t hairline pt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {userRating ? "Your Rating for Rider:" : "Rate Rider Experience:"}
          </span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                onClick={() => handleRate(star)}
                className="p-1 hover:scale-125 transition-transform"
                title={`Rate ${star} star${star > 1 ? "s" : ""}`}
              >
                <Star
                  className={`h-4 w-4 transition-colors ${
                    (hoverRating ?? userRating ?? 0) >= star
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function OrderPage() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const { orders, isLoading } = useOrdersState();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const fallbackOrder = useMemo(() => {
    if (orderId && (orderId.startsWith("demo-") || orderId.startsWith("LS-"))) {
      return getDemoOrderFallback(orderId);
    }
    return undefined;
  }, [orderId]);

  const baseOrder =
    orders.find(
      (o) =>
        o.id === orderId ||
        o.code === orderId ||
        (o.code && o.code.toLowerCase() === orderId.toLowerCase()),
    ) || getCachedOrder(orderId) || fallbackOrder;

  const [simulatedStatus, setSimulatedStatus] = useState<OrderStatus | null>(null);
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);

  const isDemo = Boolean(baseOrder && (baseOrder.isDemoPayment || baseOrder.id.startsWith("demo-")));
  const currentStatus = (simulatedStatus && isDemo) ? simulatedStatus : (baseOrder?.status ?? "new");
  const order: Order | undefined = baseOrder ? { ...baseOrder, status: currentStatus } : undefined;

  useEffect(() => {
    if (!isAutoSimulating || !isDemo || !order) return;
    const currentIdx = orderStatusFlow.indexOf(currentStatus);
    if (currentIdx === -1 || currentIdx >= orderStatusFlow.length - 1) {
      setIsAutoSimulating(false);
      return;
    }
    const timer = setTimeout(() => {
      const nextStatus = orderStatusFlow[currentIdx + 1];
      setSimulatedStatus(nextStatus);
      toast.info(`📦 Status: ${orderStatusLabel[nextStatus]}`, {
        icon: "🛵",
        duration: 4000,
      });
      if (nextStatus === "delivered") {
        toast.success("🎉 Order delivered successfully! Enjoy your items.");
      }
    }, 4500);
    return () => clearTimeout(timer);
  }, [isAutoSimulating, isDemo, currentStatus, order]);

  const handleSimulateNextStep = () => {
    const currentIdx = orderStatusFlow.indexOf(currentStatus);
    if (currentIdx < orderStatusFlow.length - 1) {
      const nextStatus = orderStatusFlow[currentIdx + 1];
      setSimulatedStatus(nextStatus);
      toast.success(`Advancing to: ${orderStatusLabel[nextStatus]}`);
    } else {
      toast.info("Order is already delivered! Click Reset to restart.");
    }
  };

  const handleResetSimulation = () => {
    setSimulatedStatus("new");
    setIsAutoSimulating(false);
    toast.info("Simulation reset to Order Placed.");
  };

  const repeatOrder = () => {
    if (!order || !order.lines || order.lines.length === 0) return;
    order.lines.forEach((l) => {
      cartStore.add(order.storeId, order.storeName, {
        id: l.productId,
        name: l.name,
        unit: l.unit,
        price: l.price,
        stock: l.availableStock,
        imageUrl: l.imageUrl,
      });
    });
    toast.success(`Added ${order.lines.length} items from Order #${order.code} to basket!`);
    navigate({ to: "/cart" });
  };

  const store = order ? getStore(order.storeId) : undefined;
  const currentIndex = order ? getOrderProgressIndex(order.status) : 0;
  const status = order?.status;
  const canCancel =
    order &&
    ["new", "accepted", "vendor_accepted", "preparing", "packed", "ready_for_pickup"].includes(
      order.status,
    );

  const destination = useMemo(() => {
    return order?.destination ?? null;
  }, [order?.destination]);

  const courier = useMemo(() => {
    if (order?.partner?.lat && order?.partner?.lng && destination) {
      return { lat: order.partner.lat, lng: order.partner.lng, label: order.partner.name };
    }
    // Never interpolate a fake rider position from order status. The map gets
    // the authoritative live position from delivery_assignments.
    return undefined;
  }, [order?.partner, order?.storeCoordinates, store, destination, currentIndex, status]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl py-16 px-4 flex justify-center">
          <LottieLoading
            message="Loading your order details..."
            subtext="Syncing live order tracking & delivery location"
            size="lg"
          />
        </div>
      </AppShell>
    );
  }

  if (!order) {
    return (
      <AppShell>
        <div className="mx-5 mt-8 rounded-xl border hairline bg-card p-6 text-center">
          <p className="font-display text-lg">Order not found</p>
          <Link
            to="/orders"
            className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline"
          >
            All orders
          </Link>
        </div>
      </AppShell>
    );
  }

  const progress = currentIndex < 0 ? 0 : ((currentIndex + 1) / orderStatusFlow.length) * 100;

  return (
    <AppShell>
      <div className="px-5 pt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Order {order.code}
          </p>
          <h1 className="mt-1 font-display text-2xl">{orderStatusLabel[order.status]}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            From {order.storeName} · <span className="font-mono">₹{order.total}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsInvoiceModalOpen(true)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground hover:bg-muted/80 active:scale-95 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span>Tax Invoice</span>
          </button>

          <button
            type="button"
            onClick={repeatOrder}
            className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Re-Order</span>
          </button>

          {canCancel && (
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(true)}
              className="shrink-0 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 hover:border-rose-400 active:scale-95 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <XCircle className="h-3.5 w-3.5 text-rose-600" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {order.status === "cancelled" && (
        <div className="mx-5 mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/50 dark:bg-rose-950/40">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <h3 className="font-display text-sm font-bold text-rose-900 dark:text-rose-200">
                This Order Has Been Cancelled
              </h3>
              {order.cancellationReason && (
                <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
                  <strong>Reason:</strong> {order.cancellationReason}
                </p>
              )}
              <p className="mt-1 text-[11px] text-rose-600/80 dark:text-rose-400/80">
                If a payment was captured, check the refund status below or contact Customer Care.
                Cancellation alone does not confirm a refund.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Prominent High-Visibility Delivery Timing Hero */}
      <DeliveryTimingHero order={order} />

      {order.status === "delivered" && (
        <section
          className="mx-5 mt-4 overflow-hidden rounded-2xl bg-primary/5 ring-1 ring-primary/15"
          aria-label="Delivery completed"
        >
          <DeliveryAnimation className="h-32 w-full" />
          <div className="-mt-2 px-4 pb-4 text-center">
            <p className="font-display text-lg font-semibold text-primary">Delivered with care</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Thanks for shopping local with Local Shore.
            </p>
          </div>
        </section>
      )}

      {/* Live delivery map */}
      <div className="mx-5 mt-4">
        <DeliveryMap
          orderId={order.id}
          orderStatus={order.status}
          store={store ? { lat: store.lat, lng: store.lng, label: store.name } : undefined}
          destination={destination}
          courier={courier}
          height={220}
        />
      </div>

      {/* Delivery Partner & Rider Star Rating Card */}
      <DeliveryPartnerCard partner={order.partner} orderStatus={order.status} />

      {/* Live Order Journey - 7-8 Step Interactive Animated Timeline */}
      <section className="mx-5 mt-5 rounded-2xl bg-card p-5 sm:p-6 shadow-sm border hairline">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary"></span>
              </span>
              <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
                Live Order Journey
              </h2>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                Step {Math.min(currentIndex + 1, orderStatusFlow.length)} of {orderStatusFlow.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Real-time milestone progression from kitchen counter to your doorstep
            </p>
          </div>

          {/* Interactive Simulation Controls for Demo & Test Orders */}
          {isDemo && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSimulateNextStep}
                disabled={currentIndex >= orderStatusFlow.length - 1}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                title="Advance to next delivery status step"
              >
                <FastForward className="h-3.5 w-3.5" />
                <span>Next Step</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAutoSimulating((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  isAutoSimulating
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-600 animate-pulse"
                    : "bg-muted/70 border-border text-foreground hover:bg-muted"
                }`}
                title="Auto-play all 7 steps with animated delivery"
              >
                {isAutoSimulating ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span>{isAutoSimulating ? "Pause Simulation" : "Auto-Play Steps"}</span>
              </button>

              <button
                type="button"
                onClick={handleResetSimulation}
                className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
                title="Reset simulation to initial placed state"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>

        {/* Global Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-1.5">
            <span>Overall Progress</span>
            <span className="font-mono font-bold text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <m.div
              className="h-full bg-gradient-to-r from-teal-500 via-primary to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        {/* Vertical Step Timeline */}
        <div className="relative pl-1 sm:pl-2">
          {orderStatusFlow.map((s, i) => {
            const step = stepDetails[s] || {
              label: orderStatusLabel[s as OrderStatus] || s,
              desc: "Status update confirmed.",
              icon: Clock,
              timeEstimate: "",
            };
            const StepIcon = step.icon;
            const done = currentIndex >= 0 && i <= currentIndex;
            const active = i === currentIndex && s !== "delivered";
            const isLast = i === orderStatusFlow.length - 1;

            return (
              <m.div
                key={s}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="relative flex items-start gap-4 pb-6 last:pb-2 group"
              >
                {/* Connecting Line */}
                {!isLast && (
                  <div
                    className={`absolute left-[19px] top-10 bottom-0 w-0.5 transition-colors duration-500 ${
                      done && currentIndex > i
                        ? "bg-emerald-500"
                        : "bg-border/60"
                    }`}
                  />
                )}

                {/* Step Circle Badge */}
                <div className="relative z-10 shrink-0">
                  {done && !active ? (
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 transition-transform group-hover:scale-105">
                      <Check className="h-5 w-5 stroke-[3]" />
                    </div>
                  ) : active ? (
                    <div className="relative grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-primary/20 animate-pulse transition-transform">
                      <StepIcon className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className="grid h-10 w-10 place-items-center rounded-2xl border-2 border-border/80 bg-muted/40 text-muted-foreground/60 transition-colors">
                      <span className="font-mono text-xs font-bold">{i + 1}</span>
                    </div>
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3
                      className={`text-sm sm:text-base font-bold transition-colors ${
                        active
                          ? "text-primary"
                          : done
                            ? "text-foreground"
                            : "text-muted-foreground/80"
                      }`}
                    >
                      {step.label}
                    </h3>
                    <div className="flex items-center gap-2">
                      {active && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                          Live Status
                        </span>
                      )}
                      {done && !active && (
                        <span className="text-[11px] font-mono font-medium text-emerald-600">
                          Completed ✓
                        </span>
                      )}
                      {!done && (
                        <span className="text-[11px] font-mono text-muted-foreground/60">
                          {step.timeEstimate}
                        </span>
                      )}
                    </div>
                  </div>
                  <p
                    className={`mt-1 text-xs leading-relaxed transition-colors ${
                      active ? "text-foreground/90 font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {step.desc}
                  </p>
                </div>
              </m.div>
            );
          })}
        </div>
      </section>

      {order.deliveryOtp &&
      order.status !== "delivered" &&
      order.status !== "cancelled" &&
      order.status !== "returned" ? (
        <section className="mx-5 mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Delivery OTP
          </p>
          <p className="mt-2 font-mono text-3xl font-bold tracking-[0.35em] text-foreground">
            {order.deliveryOtp}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Share this code with the delivery partner when your order arrives.
          </p>
        </section>
      ) : null}

      {/* Items */}
      <section className="mx-5 mt-4 mb-8 rounded-xl bg-card p-4 ring-1 ring-black/[0.04]">
        <h2 className="font-display text-base">Order details</h2>
        <ul className="mt-2 divide-y divide-[color-mix(in_oklab,var(--teal)_15%,transparent)]">
          {order.lines.map((l) => (
            <li key={l.productId} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="flex-1 truncate">
                <span className="font-mono text-xs text-muted-foreground">{l.qty}×</span> {l.name}
              </span>
              <span className="font-mono">₹{l.qty * l.price}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1.5 border-t hairline pt-3 font-mono text-xs">
          <Row label="Item subtotal" value={`₹${order.subtotal}`} />
          <Row
            label="Govt. Taxes & GST (5% incl.)"
            value={`₹${Math.round(order.subtotal * 0.05)}`}
          />
          <Row
            label="Delivery fee"
            value={order.deliveryFee === 0 ? "FREE" : `₹${order.deliveryFee}`}
          />
          <Row label="Platform & packaging fee" value={order.subtotal > 500 ? "FREE" : "₹5"} />
          {order.discountAmount && order.discountAmount > 0 ? (
            <div className="flex items-center justify-between text-xs text-emerald-600 font-bold py-0.5">
              <span>Coupon savings ({order.couponCode || "DISCOUNT"})</span>
              <span>−₹{order.discountAmount}</span>
            </div>
          ) : null}
          <div className="my-1 border-t border-border" />
          <Row label="Total Amount" value={`₹${order.total}`} bold />
          <Row label="Payment mode" value={order.paymentMethod} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Delivering to {order.address}</p>

        {/* Quick Reorder and Invoice Action Bar */}
        <div className="mt-4 border-t hairline pt-3 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={repeatOrder}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 px-4 font-display text-xs font-bold text-primary-foreground shadow-xs hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Repeat This Order</span>
          </button>

          <button
            type="button"
            onClick={() => setIsInvoiceModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 px-4 text-xs font-bold text-foreground hover:bg-muted active:scale-[0.98] transition-all shadow-2xs cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-primary" />
            <span>Download Invoice</span>
          </button>
        </div>

        {/* Cancel Order Action Button */}
        {canCancel && (
          <div className="mt-3 border-t hairline pt-3">
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(true)}
              className="w-full rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100 hover:border-rose-300 active:scale-[0.99] transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              <span>Cancel Order</span>
            </button>
            <p className="mt-1.5 text-[10px] text-center text-muted-foreground">
              Cancellation availability depends on order progress. Any eligible refund is reviewed
              and tracked separately.
            </p>
          </div>
        )}
      </section>

      <OrderRefundPanel order={order} />

      {order.status === "delivered" && <OrderSupport order={order} />}

      {/* Cancel Order Modal */}
      {isCancelModalOpen && (
        <CancelOrderModal
          order={order}
          onClose={() => setIsCancelModalOpen(false)}
          onCancelled={() => {
            setIsCancelModalOpen(false);
          }}
        />
      )}

      {/* Printable Tax Invoice Modal */}
      {isInvoiceModalOpen && (
        <TaxInvoiceModal order={order} onClose={() => setIsInvoiceModalOpen(false)} />
      )}
    </AppShell>
  );
}

const CANCEL_REASONS = [
  { id: "delay", icon: "🕒", label: "Delivery is taking longer than expected" },
  { id: "mistake", icon: "🛒", label: "Placed order by mistake / Changed my mind" },
  { id: "address", icon: "📍", label: "Incorrect delivery address or phone number" },
  { id: "payment", icon: "💳", label: "Want to change payment method or coupon" },
  { id: "duplicate", icon: "📦", label: "Ordered duplicate items / No longer needed" },
  { id: "modify", icon: "✏️", label: "Need to change items or quantities" },
  { id: "other", icon: "💬", label: "Other reason" },
];

function CancelOrderModal({
  order,
  onClose,
  onCancelled,
}: {
  order: Order;
  onClose: () => void;
  onCancelled: () => void;
}) {
  const [selectedReason, setSelectedReason] = useState(CANCEL_REASONS[0].label);
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmCancel = async () => {
    const finalReason =
      selectedReason === "Other reason" && customReason.trim()
        ? customReason.trim()
        : selectedReason;

    setIsSubmitting(true);
    try {
      const cancelled = await cancelOrder(order.id, finalReason);
      if (!cancelled) {
        throw new Error("This order can no longer be cancelled or was not found.");
      }
      toast.success(`Order #${order.code} cancelled successfully`);
      onCancelled();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-card border border-border shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-secondary/30">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 font-bold">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-foreground">Cancel Order</h3>
              <p className="text-[11px] text-muted-foreground font-mono">Order #{order.code}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Modal Content - Reasons */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <p className="text-xs font-semibold text-foreground">
            Please select a reason for cancelling your order:
          </p>

          <div className="space-y-2">
            {CANCEL_REASONS.map((r) => {
              const isSelected = selectedReason === r.label;
              return (
                <label
                  key={r.id}
                  onClick={() => setSelectedReason(r.label)}
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 ring-1 ring-rose-500/30"
                      : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{r.icon}</span>
                    <span className="text-xs font-medium text-foreground">{r.label}</span>
                  </div>
                  <input
                    type="radio"
                    name="cancel_reason"
                    checked={isSelected}
                    onChange={() => setSelectedReason(r.label)}
                    className="h-4 w-4 accent-rose-600"
                  />
                </label>
              );
            })}
          </div>

          {selectedReason === "Other reason" && (
            <div className="pt-2">
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Tell us more about your reason:
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter custom cancellation reason..."
                rows={2}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:border-rose-500 focus:outline-none"
              />
            </div>
          )}

          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 p-3 text-[11px] text-amber-800 dark:text-amber-300">
            💡 <strong>Note:</strong> Cancellation does not itself process a payment refund. Any
            refund request and its status are shown separately on the order page.
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4 bg-secondary/30">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl px-4 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            Keep Order
          </button>
          <button
            type="button"
            onClick={handleConfirmCancel}
            disabled={isSubmitting}
            className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Cancelling..." : "Confirm Cancellation"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "text-sm font-semibold text-foreground" : ""}>{value}</span>
    </div>
  );
}

function TaxInvoiceModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = `INV-${order.code}`;
  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const gstAmount = Math.round(order.subtotal * 0.05);
  const halfGst = (gstAmount / 2).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-card border border-border shadow-2xl p-4 sm:p-6 lg:p-8">
        {/* Print & Close Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-4 print:hidden">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-sm font-bold text-foreground truncate">Tax Invoice / Receipt</h3>
              <p className="text-[10px] text-muted-foreground font-mono truncate">{invoiceNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:brightness-110 active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border/80 p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet Content */}
        <div className="pt-6 font-sans text-xs space-y-5">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-dashed border-border/80 pb-4">
            <div className="min-w-0">
              <h2 className="font-display text-base sm:text-lg font-black text-foreground">LocalShore Marketplace</h2>
              <p className="text-[11px] text-muted-foreground">Hyperlocal Neighborhood Quick-Commerce</p>
              <p className="text-[10px] text-muted-foreground font-mono mt-1">GSTIN: 33AAACL1234F1Z5</p>
            </div>
            <div className="text-right font-mono text-[11px] shrink-0">
              <span className="rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold uppercase inline-block mb-1">
                PAID &amp; CONFIRMED
              </span>
              <p className="text-muted-foreground">Invoice: <strong className="text-foreground">{invoiceNumber}</strong></p>
              <p className="text-muted-foreground">{formattedDate}</p>
            </div>
          </div>

          {/* Vendor and Customer Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Fulfilled By:
              </span>
              <p className="font-bold text-foreground">{order.storeName}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Verified Local Vendor Partner</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Delivered To:
              </span>
              <p className="font-semibold text-foreground line-clamp-2">{order.address}</p>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Method: {order.paymentMethod}</p>
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <div className="rounded-2xl border border-border/80 overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border/80 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono text-xs">
                {order.lines.map((item) => (
                  <tr key={item.productId} className="hover:bg-muted/10">
                    <td className="py-2.5 px-3 font-sans font-medium text-foreground">{item.name}</td>
                    <td className="py-2.5 px-3 text-center">{item.qty}</td>
                    <td className="py-2.5 px-3 text-right">₹{item.price}</td>
                    <td className="py-2.5 px-3 text-right font-bold">₹{item.qty * item.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tax Breakdown & Totals */}
          <div className="space-y-1.5 font-mono text-xs border-t border-dashed border-border/80 pt-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Items Subtotal:</span>
              <span>₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>CGST (2.5% incl.):</span>
              <span>₹{halfGst}</span>
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>SGST (2.5% incl.):</span>
              <span>₹{halfGst}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Partner Fee:</span>
              <span>{order.deliveryFee === 0 ? "FREE" : `₹${order.deliveryFee}`}</span>
            </div>
            {order.discountAmount && order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Coupon Savings ({order.couponCode || "COUPON"}):</span>
                <span>−₹{order.discountAmount}</span>
              </div>
            )}
            <div className="border-t border-border/80 my-1.5" />
            <div className="flex justify-between text-sm font-bold text-foreground">
              <span className="font-sans">Grand Total:</span>
              <span className="text-base text-primary">₹{order.total}</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-2 text-center text-[10px] text-muted-foreground border-t border-border/40">
            <p>This is a computer-generated tax invoice. No physical signature required.</p>
            <p className="mt-0.5">Thank you for supporting your local neighbourhood businesses!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
