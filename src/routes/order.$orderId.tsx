import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import {
  useOrdersState,
  orderStatusFlow,
  orderStatusLabel,
  type OrderStatus,
} from "@/lib/orders-store";
import { getStore } from "@/lib/mock-data";
import { DeliveryMap } from "@/components/delivery-map";
import { MessageCircle, Phone, Star } from "lucide-react";
import { toast } from "sonner";
import { m } from "motion/react";
import { OrderSupport } from "@/components/order-support";
import { DeliveryAnimation } from "@/components/delivery-animation";

export const Route = createFileRoute("/order/$orderId")({
  component: OrderPage,
});

function OrderPage() {
  const { orderId } = Route.useParams();
  const { orders, isLoading } = useOrdersState();
  const order = orders.find(
    (o) =>
      o.id === orderId ||
      o.code === orderId ||
      (o.code && o.code.toLowerCase() === orderId.toLowerCase())
  );

  const store = order ? getStore(order.storeId) : undefined;
  const currentIndex = order ? orderStatusFlow.indexOf(order.status) : 0;
  const status = order?.status;

  const destination = useMemo(() => {
    if (order?.destination) return order.destination;
    // Fallback for orders saved before destination coordinates existed.
    if (!store) return { lat: 9.97, lng: 76.26 };
    return { lat: store.lat + 0.01, lng: store.lng + 0.008 };
  }, [order?.destination, store]);
  // Courier position: Real GPS coordinates from partner, or interpolated fallback
  const courier = useMemo(() => {
    if (order?.partner?.lat && order?.partner?.lng) {
      return { lat: order.partner.lat, lng: order.partner.lng, label: order.partner.name };
    }
    const storeLoc = order?.storeCoordinates ?? (store ? { lat: store.lat, lng: store.lng } : undefined);
    if (!storeLoc || !status) return undefined;
    const steps = Math.max(1, orderStatusFlow.length - 1);
    const validIndex = Math.max(0, currentIndex);
    const t = Math.min(0.95, Math.max(0.05, validIndex / steps));
    if (status === "delivered" || status === "new" || status === "accepted") return undefined;
    return {
      lat: storeLoc.lat + (destination.lat - storeLoc.lat) * t,
      lng: storeLoc.lng + (destination.lng - storeLoc.lng) * t,
    };
  }, [order?.partner, order?.storeCoordinates, store, destination, currentIndex, status]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="mx-5 mt-8 rounded-xl border hairline bg-card p-6 text-center">
          <p className="font-display text-lg">Loading your order…</p>
          <p className="mt-1 text-sm text-muted-foreground">Syncing the latest order status.</p>
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

  const progress = ((currentIndex + 1) / orderStatusFlow.length) * 100;

  return (
    <AppShell>
      <div className="px-5 pt-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Order {order.code}
        </p>
        <h1 className="mt-1 font-display text-2xl">{orderStatusLabel[order.status]}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          From {order.storeName} · <span className="font-mono">₹{order.total}</span>
        </p>
      </div>

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
          store={store ? { lat: store.lat, lng: store.lng, label: store.name } : undefined}
          destination={destination}
          courier={courier}
          height={180}
        />
        <p className="mt-2 px-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Live · {order.distanceKm.toFixed(1)} km · ETA {order.etaMin} min
        </p>
      </div>

      {/* Progress */}
      <section className="mx-5 mt-4 rounded-xl bg-card p-4 ring-1 ring-black/[0.04]">
        <div className="h-1 w-full overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--teal)_15%,transparent)]">
          <m.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <ol className="mt-4 space-y-3">
          {orderStatusFlow.map((s, i) => {
            const done = i <= currentIndex;
            const active = i === currentIndex && s !== "delivered";
            return (
              <m.li
                key={s}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.045 }}
                className="flex items-center gap-3"
              >
                <m.span
                  animate={done ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                  transition={{ duration: 0.24 }}
                  className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-mono ${
                    done
                      ? "bg-primary text-primary-foreground"
                      : "bg-[color-mix(in_oklab,var(--teal)_15%,transparent)] text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </m.span>
                <span
                  className={`text-sm ${done ? "text-foreground" : "text-muted-foreground"} ${active ? "font-semibold" : ""}`}
                >
                  {orderStatusLabel[s as OrderStatus]}
                </span>
                {active && (
                  <span className="ml-2 h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--marigold)]" />
                )}
              </m.li>
            );
          })}
        </ol>
      </section>

      {/* Partner */}
      {order.partner ? (
        <section className="mx-5 mt-4 flex items-center gap-3 rounded-xl bg-card p-4 ring-1 ring-black/[0.04]">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--marigold)]/30 font-display text-lg">
            {order.partner.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Your delivery partner</p>
            <p className="font-medium">{order.partner.name}</p>
            <p className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
              <Star
                className="h-3 w-3 fill-[var(--marigold)] text-[var(--marigold)]"
                strokeWidth={0}
              />
              {order.partner.rating.toFixed(1)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              aria-label="Chat"
              className="grid h-10 w-10 place-items-center rounded-full border hairline hover:bg-primary hover:text-primary-foreground"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
            <button
              aria-label="Call"
              className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground hover:bg-teal-deep"
            >
              <Phone className="h-4 w-4" />
            </button>
          </div>
        </section>
      ) : (
        <section className="mx-5 mt-4 rounded-xl bg-card p-4 text-sm text-muted-foreground ring-1 ring-black/[0.04]">
          {order.status === "delivered"
            ? "Delivered successfully. Need help with anything?"
            : order.status === "cancelled"
              ? "This order was cancelled."
              : order.status === "returned"
                ? "This order was returned."
                : `Finding a delivery partner near ${order.storeName}…`}
        </section>
      )}

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
        <div className="mt-3 space-y-1 border-t hairline pt-3 font-mono text-xs">
          <Row label="Subtotal" value={`₹${order.subtotal}`} />
          <Row label="Delivery" value={`₹${order.deliveryFee}`} />
          <Row label="Total" value={`₹${order.total}`} bold />
          <Row label="Paid via" value={order.paymentMethod} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Delivering to {order.address}</p>
      </section>
      {order.status === "delivered" && <OrderSupport order={order} />}
    </AppShell>
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
