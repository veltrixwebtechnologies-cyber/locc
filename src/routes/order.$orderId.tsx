import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import {
  useOrdersState,
  orderStatusFlow,
  orderStatusLabel,
  cancelOrder,
  type OrderStatus,
  type Order,
} from "@/lib/orders-store";
import { getStore } from "@/lib/mock-data";
import { DeliveryMap } from "@/components/delivery-map";
import { Clock, MessageCircle, Phone, ShieldCheck, Star, Zap, XCircle } from "lucide-react";
import { toast } from "sonner";
import { m } from "motion/react";
import { OrderSupport } from "@/components/order-support";
import { DeliveryAnimation } from "@/components/delivery-animation";
import { LottieLoading } from "@/components/ui/lottie-loading";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/order/$orderId")({
  component: OrderPage,
});

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const refundStatusLabel = (status: string) =>
  status.replaceAll("_", " ").replace(/^./, (s) => s.toUpperCase());

function RefundRequestPanel({ order }: { order: Order }) {
  const enabled = import.meta.env.VITE_ENABLE_REFUNDS === "true";
  const auth = useAuth();
  const queryClient = useQueryClient();
  const idempotencyKey = useRef("");
  const [amount, setAmount] = useState(String(order.total));
  const [reasonCode, setReasonCode] = useState("CUSTOMER_CANCELLATION");
  const [reason, setReason] = useState("");
  const isCod = ["cod", "cash on delivery"].includes(order.paymentMethod.toLowerCase());
  const canRequest = isCod
    ? order.status === "delivered"
    : ["cancelled", "delivered", "returned"].includes(order.status);

  const refunds = useQuery({
    queryKey: ["order-refunds", auth.id, order.id],
    enabled: enabled && Boolean(auth.id) && isUuid(order.id),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("refunds")
        .select(
          "id,amount,reason_code,status,payment_method,requested_at,approved_at,processed_at,failed_at,failure_reason",
        )
        .eq("order_id", order.id)
        .order("requested_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        amount: number;
        reason_code: string;
        status: string;
        payment_method: string;
        requested_at: string;
        approved_at: string | null;
        processed_at: string | null;
        failed_at: string | null;
        failure_reason: string | null;
      }>;
    },
    refetchInterval: 20_000,
  });

  const request = useMutation({
    mutationFn: async () => {
      if (!auth.id) throw new Error("Sign in to request a refund.");
      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0)
        throw new Error("Enter a valid refund amount.");
      if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();
      const { data, error } = await (supabase as any).rpc("request_order_refund", {
        p_order_id: order.id,
        p_amount: numericAmount,
        p_reason_code: reasonCode,
        p_reason: reason.trim() || null,
        p_idempotency_key: idempotencyKey.current,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      idempotencyKey.current = "";
      toast.success("Refund request submitted for review.");
      await queryClient.invalidateQueries({ queryKey: ["order-refunds", auth.id, order.id] });
      await refunds.refetch();
    },
    onError: (error: any) => {
      const message = String(error?.message ?? "");
      if (/permission denied|authentication required|order not found/i.test(message)) {
        toast.error("Sign in with the account that placed this order, then try again.");
      } else if (/refundable balance|captured payment|COD reimbursement|delivered/i.test(message)) {
        toast.error(message);
      } else {
        toast.error(
          "Refund request could not be submitted. The refund service may not be enabled in this environment yet.",
        );
      }
    },
  });

  if (!enabled) return null;
  return (
    <section
      className="mx-5 mt-4 space-y-3 rounded-2xl border border-border bg-card p-4"
      aria-label="Refund status and request"
    >
      <div>
        <h2 className="font-display text-base font-semibold">Refunds</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Requests are reviewed separately. Amount eligibility is checked against the recorded
          payment on the server. Approval does not mean the payment provider has returned the funds.
        </p>
      </div>
      {!auth.id ? (
        <p className="text-sm text-muted-foreground">
          Sign in to view or request refunds for this order.
        </p>
      ) : refunds.isError ? (
        <p className="text-sm text-muted-foreground">
          Refund status is unavailable in this environment. Contact LocalShore Customer Care for
          help.
        </p>
      ) : refunds.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading refund status…</p>
      ) : refunds.data?.length ? (
        <div className="space-y-2">
          {refunds.data.map((item) => (
            <article key={item.id} className="rounded-xl border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="mr-auto text-sm">
                  ₹{Number(item.amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </strong>
                <span className="rounded-full border px-2 py-1 text-xs capitalize">
                  {refundStatusLabel(item.status)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {refundStatusLabel(item.reason_code)} · Requested{" "}
                {new Date(item.requested_at).toLocaleString("en-IN")}
              </p>
              {item.status === "approved" && item.payment_method !== "cod" && (
                <p className="mt-1 text-xs text-amber-700">
                  Approved; payment-provider processing is still pending.
                </p>
              )}
              {item.status === "refunded" && (
                <p className="mt-1 text-xs text-emerald-700">Refund recorded as completed.</p>
              )}
              {item.failure_reason && (
                <p className="mt-1 text-xs text-destructive">{item.failure_reason}</p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No refund request has been recorded for this order.
        </p>
      )}
      {canRequest && auth.id && (
        <form
          className="space-y-2 border-t pt-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (
              window.confirm(
                "Submit this refund request for review? This does not process a payment refund.",
              )
            )
              request.mutate();
          }}
        >
          <label className="block text-xs font-medium" htmlFor={`refund-amount-${order.id}`}>
            Requested amount (INR)
          </label>
          <input
            id={`refund-amount-${order.id}`}
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            required
          />
          <label className="block text-xs font-medium" htmlFor={`refund-reason-${order.id}`}>
            Reason
          </label>
          <select
            id={`refund-reason-${order.id}`}
            value={reasonCode}
            onChange={(event) => setReasonCode(event.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="CUSTOMER_CANCELLATION">Customer cancellation</option>
            <option value="SELLER_CANCELLATION">Shop cancellation</option>
            <option value="OUT_OF_STOCK">Out of stock</option>
            <option value="DAMAGED_ITEM">Damaged item</option>
            <option value="WRONG_ITEM">Wrong item</option>
            <option value="MISSING_ITEM">Missing item</option>
            <option value="DELIVERY_FAILURE">Delivery failure</option>
            <option value="DUPLICATE_PAYMENT">Duplicate payment</option>
            <option value="OTHER">Other</option>
          </select>
          <label className="block text-xs font-medium" htmlFor={`refund-note-${order.id}`}>
            Note (optional)
          </label>
          <textarea
            id={`refund-note-${order.id}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={1000}
            rows={2}
            className="w-full rounded-lg border border-input bg-background p-3 text-sm"
            placeholder="Add context for the review team"
          />
          <Button
            type="submit"
            disabled={request.isPending || refunds.isLoading}
            className="w-full"
          >
            {request.isPending ? "Submitting…" : "Request refund review"}
          </Button>
          {request.isError && (
            <p role="alert" className="text-xs text-destructive">
              Request failed. Check the amount/reason or contact Customer Care.
            </p>
          )}
        </form>
      )}
    </section>
  );
}

function DeliveryTimingHero({ order }: { order: Order }) {
  const isDelivered = order.status === "delivered";
  const isCancelled = order.status === "cancelled";

  const expectedTimeStr = useMemo(() => {
    const orderTime = new Date(order.createdAt);
    const etaMs = (order.etaMin || 25) * 60 * 1000;
    const arrivalTime = new Date(orderTime.getTime() + etaMs);
    return arrivalTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [order.createdAt, order.etaMin]);

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
                : `Arriving in ~${order.etaMin || 25} Mins`}
          </h2>

          {!isDelivered && !isCancelled && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-300">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span>
                Expected Arrival by{" "}
                <strong className="text-white font-semibold">{expectedTimeStr}</strong>
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
  const { orders, isLoading } = useOrdersState();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const order = orders.find(
    (o) =>
      o.id === orderId ||
      o.code === orderId ||
      (o.code && o.code.toLowerCase() === orderId.toLowerCase()),
  );

  const store = order ? getStore(order.storeId) : undefined;
  const currentIndex = order ? orderStatusFlow.indexOf(order.status) : 0;
  const status = order?.status;
  const canCancel =
    order &&
    order.status !== "delivered" &&
    order.status !== "cancelled" &&
    order.status !== "returned";

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

  const progress = ((currentIndex + 1) / orderStatusFlow.length) * 100;

  return (
    <AppShell>
      <div className="px-5 pt-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Order {order.code}
          </p>
          <h1 className="mt-1 font-display text-2xl">{orderStatusLabel[order.status]}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            From {order.storeName} · <span className="font-mono">₹{order.total}</span>
          </p>
        </div>

        {canCancel && (
          <button
            type="button"
            onClick={() => setIsCancelModalOpen(true)}
            className="shrink-0 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 hover:border-rose-400 active:scale-95 transition-all shadow-xs flex items-center gap-1.5"
          >
            <XCircle className="h-4 w-4 text-rose-600" />
            <span>Cancel Order</span>
          </button>
        )}
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
                Cancellation does not confirm a refund. Refund requests are reviewed separately; any
                approved prepaid refund must be processed by the payment provider. COD reimbursement
                is handled manually.
              </p>
            </div>
          </div>
        </div>
      )}

      <RefundRequestPanel order={order} />

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

        {/* Cancel Order Action Button */}
        {canCancel && (
          <div className="mt-4 border-t hairline pt-3">
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(true)}
              className="w-full rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100 hover:border-rose-300 active:scale-[0.99] transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              <span>Cancel Order</span>
            </button>
            <p className="mt-1.5 text-[10px] text-center text-muted-foreground">
              Cancellation eligibility is checked before pickup. Any refund is reviewed and
              processed separately; provider settlement timing may vary.
            </p>
          </div>
        )}
      </section>

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
            💡 <strong>Note:</strong> Cancelling an order does not mean a refund has been processed.
            Prepaid refunds require review and payment-provider processing; COD reimbursements are
            handled manually. We do not promise a settlement date here.
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
