import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { useOrders, orderStatusFlow, orderStatusLabel, type OrderStatus } from "@/lib/orders-store";
import { getStore } from "@/lib/mock-data";
import { DeliveryMap } from "@/components/delivery-map";
import { MessageCircle, Phone, Star } from "lucide-react";

export const Route = createFileRoute("/order/$orderId")({
  component: OrderPage,
});

function OrderPage() {
  const { orderId } = Route.useParams();
  const orders = useOrders();
  const order = orders.find((o) => o.id === orderId);

  const store = order ? getStore(order.storeId) : undefined;
  const currentIndex = order ? orderStatusFlow.indexOf(order.status) : 0;
  const status = order?.status;

  const destination = useMemo(() => {
    if (order?.destination) return order.destination;
    // Fallback for orders saved before destination coordinates existed.
    if (!store) return { lat: 9.97, lng: 76.26 };
    return { lat: store.lat + 0.01, lng: store.lng + 0.008 };
  }, [order?.destination, store]);
  // Courier position interpolated along store -> destination as status progresses.
  const courier = useMemo(() => {
    if (!store || !status) return undefined;
    const steps = orderStatusFlow.length - 1;
    const t = Math.min(0.95, Math.max(0.05, currentIndex / steps));
    if (status === "delivered" || status === "new" || status === "accepted") return undefined;
    return {
      lat: store.lat + (destination.lat - store.lat) * t,
      lng: store.lng + (destination.lng - store.lng) * t,
    };
  }, [store, destination, currentIndex, status]);

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
          <div
            className="progress-fill h-full bg-primary"
            style={{ ["--w" as string]: `${progress}%` }}
          />
        </div>
        <ol className="mt-4 space-y-3">
          {orderStatusFlow.map((s, i) => {
            const done = i <= currentIndex;
            const active = i === currentIndex && s !== "delivered";
            return (
              <li key={s} className="flex items-center gap-3">
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-mono ${
                    done
                      ? "bg-primary text-primary-foreground"
                      : "bg-[color-mix(in_oklab,var(--teal)_15%,transparent)] text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={`text-sm ${done ? "text-foreground" : "text-muted-foreground"} ${active ? "font-semibold" : ""}`}
                >
                  {orderStatusLabel[s as OrderStatus]}
                </span>
                {active && (
                  <span className="ml-2 h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--marigold)]" />
                )}
              </li>
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
          Finding a delivery partner near {order.storeName}…
        </section>
      )}

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
