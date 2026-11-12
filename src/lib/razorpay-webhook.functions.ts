import { createServerFn } from "@tanstack/react-start";
import { createHmac, timingSafeEqual } from "crypto";

export interface WebhookProcessingInput {
  rawBody: string;
  signature: string;
}

export interface WebhookProcessingResult {
  success: boolean;
  event?: string;
  message: string;
}

/**
 * SERVER-SIDE RAZORPAY WEBHOOK HANDLER
 * Cryptographically verifies Razorpay webhook signatures against RAZORPAY_WEBHOOK_SECRET
 * and idempotently reconciles payment attempts and order statuses.
 */
export const processRazorpayWebhookFn = createServerFn({ method: "POST" })
  .inputValidator((data: WebhookProcessingInput) => {
    if (!data?.rawBody || !data?.signature) {
      throw new Error("Missing webhook body or X-Razorpay-Signature header.");
    }
    return data;
  })
  .handler(async ({ data }): Promise<WebhookProcessingResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "localshore_webhook_secret_demo";

    // 1. Cryptographic HMAC SHA256 Signature Verification
    let isValidSignature = false;
    try {
      const expectedSignature = createHmac("sha256", webhookSecret)
        .update(data.rawBody)
        .digest("hex");

      const expectedBuf = Buffer.from(expectedSignature, "utf-8");
      const actualBuf = Buffer.from(data.signature, "utf-8");

      if (expectedBuf.length === actualBuf.length) {
        isValidSignature = timingSafeEqual(expectedBuf, actualBuf);
      }
    } catch (err) {
      console.error("[razorpay-webhook] Signature verification exception:", err);
      isValidSignature = false;
    }

    if (!isValidSignature && process.env.NODE_ENV === "production") {
      console.error("[razorpay-webhook] Invalid webhook signature detected!");
      throw new Error("Invalid Razorpay webhook signature.");
    }

    // 2. Parse Event Payload
    let payload: any = null;
    try {
      payload = JSON.parse(data.rawBody);
    } catch (err) {
      throw new Error("Invalid JSON payload in webhook request.");
    }

    const event = payload?.event as string;
    const paymentEntity = payload?.payload?.payment?.entity;
    const orderEntity = payload?.payload?.order?.entity;

    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
    const razorpayPaymentId = paymentEntity?.id;

    if (!event || !razorpayOrderId) {
      return {
        success: true,
        message: "Webhook received but ignored (no relevant payment/order entity).",
      };
    }

    console.info(`[razorpay-webhook] Processing event: ${event} for order: ${razorpayOrderId}`);

    // 3. Idempotent Processing of Razorpay Payment & Refund Events
    switch (event) {
      case "payment.captured":
      case "order.paid": {
        // Fetch existing attempt
        const { data: attempt } = await admin
          .from("payment_attempts")
          .select("*")
          .eq("provider_order_id", razorpayOrderId)
          .maybeSingle();

        if (attempt) {
          // If already captured, handle idempotently without duplicate side-effects
          if (attempt.status === "captured") {
            return {
              success: true,
              event,
              message: "Payment already processed and captured (idempotent skip).",
            };
          }

          // Check if the order was already cancelled before payment success webhook arrived
          // (Race condition 4: Payment success webhook arrives after cancellation)
          if (attempt.order_id) {
            const { data: currentOrder } = await admin
              .from("orders")
              .select("status, total")
              .eq("id", attempt.order_id)
              .maybeSingle();

            if (currentOrder && (currentOrder.status === "cancelled" || currentOrder.status === "cancelled_by_vendor")) {
              console.warn(
                `[razorpay-webhook] Out-of-order payment captured after cancellation for order ${attempt.order_id}. Auto-initiating refund.`
              );

              // Update payment attempt to captured for audit
              await admin.from("payment_attempts").update({
                status: "captured",
                provider_payment_id: razorpayPaymentId || attempt.provider_payment_id,
              }).eq("id", attempt.id);

              // Auto-reconcile refund via reconciliation helper
              const { reconcileOutOfOrderPayment } = await import("./cancellation/refund-service");
              await reconcileOutOfOrderPayment(
                attempt.order_id,
                razorpayPaymentId || attempt.provider_payment_id || "pay_unknown",
                Number(currentOrder.total || 0),
                admin
              );

              return {
                success: true,
                event,
                message: "Order already cancelled; out-of-order payment captured and auto-refund initiated.",
              };
            }
          }

          // Finalize payment attempt & update linked order to paid
          await admin.rpc("finalize_verified_payment", {
            p_provider_order_id: razorpayOrderId,
            p_provider_payment_id: razorpayPaymentId || attempt.provider_payment_id,
            p_provider_signature: "webhook_verified",
            p_order_id: attempt.order_id,
            p_status: "captured",
          });
        }
        break;
      }

      case "payment.failed": {
        const { data: attempt } = await admin
          .from("payment_attempts")
          .select("*")
          .eq("provider_order_id", razorpayOrderId)
          .maybeSingle();

        if (attempt && attempt.status !== "captured") {
          await admin.rpc("finalize_verified_payment", {
            p_provider_order_id: razorpayOrderId,
            p_provider_payment_id: razorpayPaymentId || attempt.provider_payment_id,
            p_provider_signature: "webhook_failed",
            p_order_id: attempt.order_id,
            p_status: "failed",
          });
        }
        break;
      }

      case "refund.processed": {
        const refundEntity = payload?.payload?.refund?.entity;
        const refundId = refundEntity?.id;
        const localReceipt = refundEntity?.receipt; // Localshore refund UUID
        console.info(`[razorpay-webhook] Refund processed: ${refundId}, receipt: ${localReceipt}`);

        if (localReceipt) {
          await admin
            .from("refunds")
            .update({
              status: "refunded",
              gateway_refund_id: refundId,
              processed_at: new Date().toISOString(),
              gateway_response: refundEntity,
            })
            .eq("id", localReceipt);
        } else if (refundId) {
          await admin
            .from("refunds")
            .update({
              status: "refunded",
              processed_at: new Date().toISOString(),
              gateway_response: refundEntity,
            })
            .eq("gateway_refund_id", refundId);
        }
        break;
      }

      case "refund.failed": {
        const refundEntity = payload?.payload?.refund?.entity;
        const refundId = refundEntity?.id;
        const localReceipt = refundEntity?.receipt;
        const failureReason = refundEntity?.error_description || "Gateway marked refund as failed";
        console.error(`[razorpay-webhook] Refund failed: ${refundId}, reason: ${failureReason}`);

        if (localReceipt) {
          await admin
            .from("refunds")
            .update({
              status: "failed",
              failure_reason: failureReason,
              failed_at: new Date().toISOString(),
              gateway_response: refundEntity,
            })
            .eq("id", localReceipt);
        }
        break;
      }

      default:
        break;
    }

    return {
      success: true,
      event,
      message: `Webhook event ${event} processed successfully.`,
    };
  });
