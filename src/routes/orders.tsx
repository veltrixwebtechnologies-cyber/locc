import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useOrders, orderStatusLabel } from "@/lib/orders-store";
import { Clock, Star } from "lucide-react";

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const orders = useOrders();
  return (
    <AppShell>
      <div className="px-5 pt-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Your orders
        </p>
        <h1 className="mt-1 font-display text-3xl">History</h1>
      </div>

      {orders.length === 0 ? (
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
      ) : (
        <ul className="mx-5 mt-4 space-y-3 pb-6">
          {orders.map((o) => {
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
                      {new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="mt-1 font-display text-lg leading-tight">{o.storeName}</p>

                  {!isDelivered && !isCancelled && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-700">
                        <Clock className="h-3.5 w-3.5" />
                        ETA ~{o.etaMin || 25} mins
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
