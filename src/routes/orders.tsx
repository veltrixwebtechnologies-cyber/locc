import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useOrdersState, orderStatusLabel } from "@/modules/shopper/services/orders-store";
import { useAuth } from "@/lib/auth-store";
import { useMemo, useState } from "react";
import { Clock, Search, Star } from "lucide-react";
import { LottieLoading } from "@/components/ui/lottie-loading";

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
});

function OrdersSkeleton() {
  return (
    <div className="mx-5 mt-4 space-y-4 pb-6">
      <LottieLoading
        message="Fetching your order history..."
        subtext="Checking live status & delivery updates"
        size="sm"
      />
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl bg-card p-4 ring-1 ring-black/[0.05] shadow-sm">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="mt-3 h-5 w-44 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="mt-4 flex items-center justify-between border-t hairline pt-2">
              <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersPage() {
  const auth = useAuth();
  const { orders, isLoading } = useOrdersState();
  const [filter, setFilter] = useState<
    "all" | "processing" | "shipped" | "delivered" | "cancelled"
  >("all");
  const [query, setQuery] = useState("");

  const signedIn = Boolean(auth.id || auth.phone || auth.email);
  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const status = order.status;
        const matchesFilter =
          filter === "all" ||
          (filter === "processing" &&
            ["new", "confirmed", "preparing", "ready_for_pickup"].includes(status)) ||
          (filter === "shipped" &&
            ["out_for_delivery", "assigned", "picked_up"].includes(status)) ||
          (filter === "delivered" && status === "delivered") ||
          (filter === "cancelled" && ["cancelled", "refunded"].includes(status));
        const needle = query.trim().toLowerCase();
        return (
          matchesFilter &&
          (!needle ||
            order.code.toLowerCase().includes(needle) ||
            order.storeName.toLowerCase().includes(needle))
        );
      }),
    [orders, filter, query],
  );

  if (!signedIn) {
    return (
      <AppShell>
        <div className="mx-5 mt-12 rounded-2xl border hairline bg-card p-6 text-center shadow-xs">
          <p className="font-display text-xl font-bold text-foreground">Sign in required</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Please sign in to view your order history and track live 20-minute neighborhood
            deliveries.
          </p>
          <Link
            to="/auth"
            search={{ redirect: "/orders" }}
            className="mt-5 inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90"
          >
            Sign in to your account
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-5 pt-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Your orders
        </p>
        <h1 className="mt-1 font-display text-3xl">My Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track every local purchase in one place.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-xl border hairline bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search order number or shop"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <div
          className="mt-3 flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Order status filters"
        >
          {[
            ["all", "All"],
            ["processing", "Processing"],
            ["shipped", "Shipped"],
            ["delivered", "Delivered"],
            ["cancelled", "Cancelled"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              onClick={() => setFilter(value as typeof filter)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${filter === value ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground ring-1 ring-black/[0.06]"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs font-semibold text-muted-foreground">
          {filteredOrders.length} order{filteredOrders.length === 1 ? "" : "s"}
        </p>
      </div>

      {isLoading && orders.length === 0 ? (
        <OrdersSkeleton />
      ) : orders.length === 0 ? (
        <div className="mx-5 mt-8 rounded-xl border hairline bg-card p-6 text-center">
          <p className="font-display text-lg">No orders yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            When you place an order, it'll show up here.
          </p>
          <Link
            to="/"
            search={{ category: undefined, q: undefined }}
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Find a shop
          </Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="mx-5 mt-8 rounded-xl border hairline bg-card p-6 text-center text-sm text-muted-foreground">
          No orders match this search or status.
        </div>
      ) : (
        <ul className="mx-5 mt-4 space-y-3 pb-6">
          {filteredOrders.map((o) => {
            const isDelivered = o.status === "delivered";
            const isCancelled = o.status === "cancelled";
            return (
              <li key={o.id}>
                <Link
                  to="/order/$orderId"
                  params={{ orderId: o.id }}
                  className="block rounded-xl bg-card p-4 ring-1 ring-black/[0.05] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Order #{o.code}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 font-display text-lg leading-tight">{o.storeName}</p>

                  {!isDelivered && !isCancelled && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-700">
                        <Clock className="h-3.5 w-3.5" />
                        {(() => {
                          const targetMs = new Date(o.createdAt).getTime() + (o.etaMin || 25) * 60000;
                          const rem = Math.round((targetMs - Date.now()) / 60000);
                          if (rem <= 0) return "Arriving soon";
                          return `~${rem} mins left`;
                        })()}
                      </span>
                      {o.partner && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-400/10 px-2 py-1 font-mono text-xs text-amber-800">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-500 stroke-amber-500" />
                          {o.partner.name.split(" ")[0]} ({o.partner.rating.toFixed(1)}★)
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between text-xs border-t hairline pt-2">
                    <span className="text-muted-foreground">
                      {o.lines.length} item{o.lines.length > 1 ? "s" : ""} ·{" "}
                      <span className="font-mono font-semibold text-foreground">₹{o.total}</span>
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        isDelivered
                          ? "bg-emerald-600/10 text-emerald-700"
                          : isCancelled
                            ? "bg-rose-500/10 text-rose-700"
                            : "bg-primary/10 text-primary"
                      }`}
                    >
                      {orderStatusLabel[o.status]}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
