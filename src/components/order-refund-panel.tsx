import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import type { Order } from "@/lib/orders-store";

const REASONS = [
  ["CUSTOMER_CANCELLATION", "Cancellation"],
  ["SELLER_CANCELLATION", "Seller cancelled"],
  ["OUT_OF_STOCK", "Item unavailable"],
  ["DAMAGED_ITEM", "Damaged item"],
  ["WRONG_ITEM", "Wrong item"],
  ["MISSING_ITEM", "Missing item"],
  ["DELIVERY_FAILURE", "Delivery issue"],
  ["DUPLICATE_PAYMENT", "Duplicate payment"],
  ["OTHER", "Other"],
] as const;

const STATUS_LABEL: Record<string, string> = {
  requested: "Requested",
  reviewing: "Under review",
  approved: "Approved — payment not yet confirmed",
  processing: "Processing",
  refunded: "Refunded",
  partially_refunded: "Partially refunded",
  rejected: "Rejected",
  failed: "Failed",
  cancelled: "Cancelled",
};

const ACTIVE = new Set(["requested", "reviewing", "approved", "processing"]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const money = (amount: number) =>
  `₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const idempotencyStorageKey = (orderId: string) => `localshore.refund-request.${orderId}.v1`;

function isRestrictedProductionProject() {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  if (projectId === "flbygucibbrfcwcgzyea") return true;
  try {
    return new URL(import.meta.env.VITE_SUPABASE_URL ?? "").hostname.startsWith(
      "flbygucibbrfcwcgzyea.",
    );
  } catch {
    return false;
  }
}

type RefundRow = {
  id: string;
  amount: number;
  status: string;
  reason_code: string;
  reason: string | null;
  decision_reason: string | null;
  failure_reason: string | null;
  requested_at: string;
  approved_at: string | null;
  processed_at: string | null;
  failed_at: string | null;
};
type RefundStatusEvent = { id: string; status: string; created_at: string };

type Eligibility = {
  eligible: boolean;
  mode: "gateway" | "manual" | null;
  refundableAmount: number;
  reasons: string[];
};

function formatRequestError(error: unknown) {
  const message = String((error as { message?: string })?.message ?? "");
  if (message.includes("Refund requests are not available")) return message;
  if (message.includes("not found") || message.includes("42501"))
    return "This order could not be verified for your account.";
  if (message.includes("exceeds the remaining refundable balance"))
    return "The refundable balance changed. Refresh and try again.";
  if (message.includes("open refund"))
    return "A refund request for this order is already being reviewed.";
  return "We couldn’t load or submit this refund request. Please try again or contact Customer Care.";
}

export function OrderRefundPanel({ order }: { order: Order }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [reasonCode, setReasonCode] = useState<(typeof REASONS)[number][0]>("OTHER");
  const [explanation, setExplanation] = useState("");
  const enabled =
    import.meta.env.VITE_ENABLE_REFUNDS === "true" && !isRestrictedProductionProject();
  const safeOrderId = uuid.test(order.id);

  const requestQuery = useQuery({
    queryKey: ["customer-refunds", auth.id, order.id],
    enabled: enabled && Boolean(auth.id) && safeOrderId,
    queryFn: async () => {
      // Both calls are scoped again by database auth.uid()/RLS. Never use cached
      // order data as proof that the signed-in customer owns this order.
      const { data: eligibilityData, error: eligibilityError } = await (supabase as any).rpc(
        "get_customer_refund_eligibility",
        { p_order_id: order.id },
      );
      if (eligibilityError) throw eligibilityError;
      const { data: refunds, error: refundsError } = await (supabase as any)
        .from("refunds")
        .select(
          "id,amount,status,reason_code,reason,decision_reason,failure_reason,requested_at,approved_at,processed_at,failed_at",
        )
        .eq("order_id", order.id)
        .order("requested_at", { ascending: false });
      if (refundsError) throw refundsError;
      const { data: events, error: eventsError } = await (supabase as any)
        .from("refund_status_events")
        .select("id,status,created_at")
        .eq("order_id", order.id)
        .order("created_at", { ascending: false });
      if (eventsError) throw eventsError;
      return {
        eligibility: eligibilityData as Eligibility,
        refunds: (refunds ?? []) as RefundRow[],
        events: (events ?? []) as RefundStatusEvent[],
      };
    },
    refetchOnWindowFocus: true,
  });

  const requestMutation = useMutation({
    mutationFn: async () => {
      const resolvedAmount = Number(amount);
      if (!auth.id) throw new Error("Sign in to request a refund");
      if (!Number.isFinite(resolvedAmount) || resolvedAmount <= 0)
        throw new Error("Enter a valid amount");
      const currentEligibility = requestQuery.data?.eligibility;
      if (!currentEligibility?.eligible || resolvedAmount > currentEligibility.refundableAmount) {
        throw new Error("The refundable balance changed. Refresh and try again.");
      }

      let idempotencyKey: string | null = null;
      try {
        idempotencyKey = sessionStorage.getItem(idempotencyStorageKey(order.id));
      } catch {}
      if (!idempotencyKey || !uuid.test(idempotencyKey)) {
        idempotencyKey = crypto.randomUUID();
        try {
          sessionStorage.setItem(idempotencyStorageKey(order.id), idempotencyKey);
        } catch {}
      }

      const { error } = await (supabase as any).rpc("request_order_refund", {
        p_order_id: order.id,
        p_amount: resolvedAmount,
        p_reason_code: reasonCode,
        p_reason: explanation.trim() || null,
        p_idempotency_key: idempotencyKey,
      });
      if (error) throw error;
      try {
        sessionStorage.removeItem(idempotencyStorageKey(order.id));
      } catch {}
    },
    onSuccess: async () => {
      setExplanation("");
      setAmount("");
      await queryClient.invalidateQueries({ queryKey: ["customer-refunds", auth.id, order.id] });
    },
  });

  if (!enabled) return null;
  const data = requestQuery.data;
  const hasOpenRequest = data?.refunds.some((refund) => ACTIVE.has(refund.status)) ?? false;
  const maxRefund = data?.eligibility.refundableAmount ?? 0;
  const timelineRows = (data?.events ?? []).map((event) => ({
    at: event.created_at,
    label: STATUS_LABEL[event.status] ?? event.status,
    key: event.id,
  }));

  return (
    <section
      className="mx-5 mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
      aria-labelledby="refund-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="refund-heading" className="font-display text-base font-semibold">
            Refunds
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Refund approval does not confirm that funds have reached your bank.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void requestQuery.refetch()}
          className="text-xs font-medium text-primary underline underline-offset-4"
          disabled={requestQuery.isFetching}
        >
          {requestQuery.isFetching ? "Refreshing…" : "Refresh status"}
        </button>
      </div>

      {!auth.id ? (
        <p className="mt-4 rounded-lg bg-muted p-3 text-sm">
          Sign in to view or request a refund for this order.
        </p>
      ) : null}
      {auth.id && !safeOrderId ? (
        <p className="mt-4 rounded-lg bg-muted p-3 text-sm">
          Refund requests are available for verified orders only. Contact Customer Care for help.
        </p>
      ) : null}
      {requestQuery.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Checking refund eligibility…</p>
      ) : null}
      {requestQuery.isError ? (
        <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {formatRequestError(requestQuery.error)}
        </p>
      ) : null}

      {data ? (
        <>
          <div className="mt-4 rounded-xl bg-muted/60 p-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Requested amount limit</span>
              <span className="font-mono font-semibold">{money(maxRefund)}</span>
            </div>
            {data.eligibility.mode === "manual" ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Cash-on-delivery reimbursements require manual review; no gateway refund will be
                claimed.
              </p>
            ) : null}
          </div>

          {data.refunds.map((refund) => (
            <article key={refund.id} className="mt-3 rounded-xl border border-border p-3">
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <strong>{STATUS_LABEL[refund.status] ?? refund.status}</strong>
                <strong className="font-mono">{money(Number(refund.amount))}</strong>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Requested {new Date(refund.requested_at).toLocaleString()}
              </p>
              {refund.decision_reason || refund.failure_reason ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Update: {refund.failure_reason ?? refund.decision_reason}
                </p>
              ) : null}
            </article>
          ))}

          {data.eligibility.eligible && !hasOpenRequest ? (
            <form
              className="mt-4 space-y-3 border-t border-border pt-4"
              onSubmit={(event) => {
                event.preventDefault();
                requestMutation.mutate();
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs font-medium">
                  Requested amount (max {money(maxRefund)})
                  <input
                    aria-label="Requested refund amount"
                    type="number"
                    min="0.01"
                    max={maxRefund}
                    step="0.01"
                    required
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 text-xs font-medium">
                  Reason
                  <select
                    aria-label="Refund reason"
                    value={reasonCode}
                    onChange={(event) => setReasonCode(event.target.value as typeof reasonCode)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    {REASONS.map(([code, label]) => (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block space-y-1 text-xs font-medium">
                Explanation (optional)
                <textarea
                  maxLength={1000}
                  rows={3}
                  value={explanation}
                  onChange={(event) => setExplanation(event.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Add details to help us review your request."
                />
              </label>
              {requestMutation.isError ? (
                <p role="alert" className="text-xs text-destructive">
                  {formatRequestError(requestMutation.error)}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={requestMutation.isPending || !amount || Number(amount) > maxRefund}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {requestMutation.isPending ? "Submitting…" : "Request refund"}
              </button>
            </form>
          ) : null}
          {!data.eligibility.eligible && data.eligibility.reasons.length ? (
            <p className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              A refund request is not currently available for this order.{" "}
              {hasOpenRequest
                ? "Your existing request is being reviewed."
                : "Contact Customer Care if you believe this is incorrect."}
            </p>
          ) : null}

          {timelineRows.length ? (
            <div className="mt-4 border-t border-border pt-3">
              <h3 className="text-xs font-semibold">Request timeline</h3>
              <ol className="mt-2 space-y-2">
                {timelineRows.map((entry) => (
                  <li key={entry.key} className="flex items-start justify-between gap-3 text-xs">
                    <span>{entry.label}</span>
                    <time className="shrink-0 text-muted-foreground">
                      {new Date(entry.at).toLocaleString()}
                    </time>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
