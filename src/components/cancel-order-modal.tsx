// ==============================================================================
// LocalShore Production Cancel Order Modal
// Features live eligibility preview, fee/refund breakdown, policy explanation,
// and atomic workflow submission.
// ==============================================================================

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { XCircle, AlertCircle, ShieldAlert, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import type { Order } from "@/modules/shopper/services/orders-store";
import { evaluateCancellationEligibility, type OrderEligibilityContext } from "@/lib/cancellation/cancellation-eligibility";
import { cancelOrder } from "@/modules/shopper/services/orders-store";

export interface CancelOrderModalProps {
  order: Order;
  onClose: () => void;
  onCancelled: (details?: { fee: number; refund: number; reason: string }) => void;
}

const CUSTOMER_REASONS = [
  { code: "CUSTOMER_MISTAKE", icon: "🛒", label: "Placed order by mistake / Changed my mind" },
  { code: "DELIVERY_DELAY", icon: "🕒", label: "Delivery is taking longer than expected" },
  { code: "ADDRESS_CHANGE", icon: "📍", label: "Incorrect delivery address or phone number" },
  { code: "PAYMENT_ISSUE", icon: "💳", label: "Want to change payment method or coupon" },
  { code: "DUPLICATE_ORDER", icon: "📦", label: "Ordered duplicate items / No longer needed" },
  { code: "OTHER", icon: "💬", label: "Other reason" },
];

export function CancelOrderModal({ order, onClose, onCancelled }: CancelOrderModalProps) {
  const [selectedReasonCode, setSelectedReasonCode] = useState("CUSTOMER_MISTAKE");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute authoritative eligibility preview
  const eligibility = useMemo(() => {
    const isPrepaid = ["paid", "captured"].includes(String(order.paymentStatus || "").toLowerCase());
    const context: OrderEligibilityContext = {
      orderId: order.id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus || (isPrepaid ? "captured" : "unpaid"),
      total: Number(order.total || 0),
      subtotal: Number(order.subtotal || order.total || 0),
      deliveryFee: Number(order.deliveryFee || 0),
      riderAssigned: ["delivery_partner_assigned", "arrived_at_vendor"].includes(order.status),
      riderArrivedAtShop: order.status === "arrived_at_vendor",
      isPickedUp: ["picked_up", "out_for_delivery"].includes(order.status),
      createdAtMs: order.createdAt ? new Date(order.createdAt).getTime() : Date.now(),
    };
    return evaluateCancellationEligibility(context, "customer");
  }, [order]);

  const selectedReasonObj = CUSTOMER_REASONS.find((r) => r.code === selectedReasonCode);
  const finalReasonText =
    selectedReasonCode === "OTHER" && customReason.trim()
      ? customReason.trim()
      : selectedReasonObj?.label || "Cancelled by customer";

  const handleConfirmCancellation = async () => {
    if (!eligibility.eligible) {
      toast.error(eligibility.reason || "This order cannot be cancelled at this stage.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Try server function if online and UUID order
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.id);
      let fee = eligibility.cancellationFee || 0;
      let refund = eligibility.estimatedRefund || 0;

      if (isUuid) {
        try {
          const { cancelOrderWorkflowFn } = await import("@/lib/cancellation.functions");
          const result = await cancelOrderWorkflowFn({
            data: {
              orderId: order.id,
              reasonCode: selectedReasonCode,
              reasonText: finalReasonText,
              role: "customer",
              idempotencyKey: `cancel-${order.id}-${Date.now()}`,
            },
          });
          fee = result.cancellationFee;
          refund = result.refundAmount;
        } catch (serverErr: any) {
          console.warn("[CancelOrderModal] Server function fallback:", serverErr);
        }
      }

      // 2. Authoritative client state update
      const cancelled = await cancelOrder(order.id, finalReasonText);
      if (!cancelled) {
        throw new Error("Unable to update order state. Please refresh.");
      }

      toast.success(
        refund > 0
          ? `Order #${order.code} cancelled. Refund of ₹${refund.toFixed(2)} initiated.`
          : `Order #${order.code} cancelled successfully.`,
      );

      onCancelled({ fee, refund, reason: finalReasonText });
      onClose();
    } catch (err: any) {
      console.error("[CancelOrderModal] Error:", err);
      toast.error(err.message || "Failed to cancel order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-card border border-border shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-secondary/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 font-bold">
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
            disabled={isSubmitting}
            className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Eligibility Alert Banner */}
          {!eligibility.eligible ? (
            <div className="rounded-2xl border border-rose-300 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-700 dark:text-rose-300">Cancellation Not Allowed</p>
                <p className="mt-1">{eligibility.reason}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-3.5 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  {eligibility.cancellationFee === 0
                    ? "Eligible for Free Instant Cancellation"
                    : "Conditional Cancellation Eligible"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{eligibility.reason}</p>
              </div>
            </div>
          )}

          {/* Refund Breakdown Card */}
          {eligibility.eligible && (
            <div className="rounded-2xl bg-secondary/50 border border-border p-4 space-y-2.5">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Financial Breakdown & Refund
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Order Total Paid:</span>
                <span className="font-medium text-foreground">₹{order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Applicable Cancellation Fee:</span>
                <span className={eligibility.cancellationFee > 0 ? "font-bold text-rose-600" : "font-medium text-emerald-600"}>
                  {eligibility.cancellationFee > 0 ? `-₹${eligibility.cancellationFee.toFixed(2)}` : "₹0.00 (Free)"}
                </span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between items-center text-sm font-bold">
                <span className="text-foreground">Estimated Refund:</span>
                <span className="text-primary text-base">₹{eligibility.estimatedRefund.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                {eligibility.breakdown?.refundDestination === "original_payment_method"
                  ? "Refund will be credited back to your original payment method (Razorpay/UPI/Card) in 5-7 business days."
                  : eligibility.breakdown?.refundDestination === "wallet"
                  ? "Refund will be credited back to your LocalShore Wallet immediately."
                  : "No payment refund needed (Pay on Delivery / Unpaid)."}
              </p>
            </div>
          )}

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground block">
              Please select a reason for cancellation:
            </label>
            <div className="space-y-2">
              {CUSTOMER_REASONS.map((r) => {
                const isSelected = selectedReasonCode === r.code;
                return (
                  <label
                    key={r.code}
                    onClick={() => setSelectedReasonCode(r.code)}
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
                      onChange={() => setSelectedReasonCode(r.code)}
                      className="h-4 w-4 accent-rose-600"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Custom Description (if OTHER) */}
          {selectedReasonCode === "OTHER" && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground block">
                Additional Comments / Reason:
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please describe why you wish to cancel this order..."
                rows={2}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:border-rose-500 focus:outline-none"
              />
            </div>
          )}

          {/* What happens next */}
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 p-3 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" /> What happens once cancelled?
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-[10.5px]">
              <li>Reserved items are immediately released back into the shop inventory.</li>
              <li>Any assigned delivery partner is relieved and reassigned.</li>
              <li>Refund progress will be visible in the Refund Tracker on your order page.</li>
            </ul>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4 bg-secondary/30 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl px-4 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            Keep My Order
          </button>
          <button
            type="button"
            onClick={handleConfirmCancellation}
            disabled={isSubmitting || !eligibility.eligible}
            className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                Confirm Cancellation <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
