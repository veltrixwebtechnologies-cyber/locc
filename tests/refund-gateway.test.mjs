import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import { sourceLoader } from "./load-source.mjs";

const load = sourceLoader(process.cwd());
const gateway = await load("src/lib/razorpay-refunds.server.ts");

test("refund adapter validates minor-unit amount and maps provider states without a real request", async () => {
  let received;
  const result = await gateway.submitApprovedRefund(
    {
      localRefundId: "local-refund",
      paymentId: "payment-id",
      amountPaise: 1250,
      idempotencyKey: "stable-key",
    },
    {
      async createRefund(request) {
        received = request;
        return { id: "mock-provider-refund", status: "processed" };
      },
    },
  );
  assert.equal(received.amountPaise, 1250);
  assert.deepEqual(result, { gatewayRefundId: "mock-provider-refund", status: "processing" });
  await assert.rejects(
    () =>
      gateway.submitApprovedRefund(
        {
          localRefundId: "r",
          paymentId: "p",
          amountPaise: 1.2,
          idempotencyKey: "k",
        },
        {
          createRefund: async () => {
            throw new Error("must not be called");
          },
        },
      ),
    /integer paise/,
  );
});

test("approved refund orchestration persists processing but never claims webhook completion", async () => {
  const calls = [];
  const result = await gateway.processApprovedRefund(
    "local-id",
    {
      async getApprovedRefund(refundId) {
        calls.push(["load", refundId]);
        return {
          localRefundId: refundId,
          paymentId: "pay-id",
          amountPaise: 500,
          idempotencyKey: "idem",
          status: "approved",
        };
      },
      async markProcessing(refundId, gatewayRefundId) {
        calls.push(["processing", refundId, gatewayRefundId]);
      },
      async markFailed() {
        assert.fail("success path must not mark failed");
      },
    },
    {
      async createRefund(request) {
        calls.push(["submit", request.idempotencyKey]);
        return { id: "rf-mock", status: "processed" };
      },
    },
  );
  assert.equal(result.status, "processing");
  assert.deepEqual(calls, [
    ["load", "local-id"],
    ["submit", "idem"],
    ["processing", "local-id", "rf-mock"],
  ]);
  await assert.rejects(
    () =>
      gateway.processApprovedRefund(
        "x",
        {
          getApprovedRefund: async () => ({
            localRefundId: "x",
            paymentId: "p",
            amountPaise: 10,
            idempotencyKey: "i",
            status: "rejected",
          }),
          markProcessing: async () => {},
          markFailed: async () => {},
        },
        {
          createRefund: async () => {
            assert.fail("unapproved refund reached provider");
          },
        },
      ),
    /Only approved/,
  );
});

test("refund webhook signature verification is fail-closed and constant-time compared", () => {
  const body = JSON.stringify({ event: "refund.processed" });
  const secret = "test-secret-only";
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  assert.equal(gateway.verifyRazorpayWebhookSignature(body, signature, secret), true);
  assert.equal(gateway.verifyRazorpayWebhookSignature(body, "bad", secret), false);
  assert.equal(gateway.verifyRazorpayWebhookSignature(body, "zz".repeat(32), secret), false);
  assert.equal(gateway.verifyRazorpayWebhookSignature(body, signature, undefined), false);
});

test("refund webhook mapping and idempotent state guard reject duplicates and invalid transitions", () => {
  const parsed = gateway.parseRefundWebhook({
    event: "refund.failed",
    payload: { refund: { entity: { id: "rf_123", error_description: "provider decline" } } },
  });
  assert.deepEqual(parsed, {
    event: "refund.failed",
    gatewayRefundId: "rf_123",
    status: "failed",
    failureReason: "provider decline",
  });
  assert.equal(gateway.parseRefundWebhook({ event: "payment.captured" }), null);
  assert.equal(
    gateway.canApplyRefundWebhook({
      eventId: "event-1",
      seenEventIds: new Set(["event-1"]),
      currentStatus: "processing",
      incomingStatus: "refunded",
    }),
    false,
  );
  assert.equal(
    gateway.canApplyRefundWebhook({
      eventId: "event-2",
      seenEventIds: new Set(),
      currentStatus: "approved",
      incomingStatus: "processing",
    }),
    true,
  );
  assert.equal(
    gateway.canApplyRefundWebhook({
      eventId: "event-3",
      seenEventIds: new Set(),
      currentStatus: "refunded",
      incomingStatus: "failed",
    }),
    false,
  );
});

test("customer refund UI is explicitly opt-in, production-guarded, and uses owner-checked RPCs", async () => {
  const panel = await readFile(
    new URL("../src/components/order-refund-panel.tsx", import.meta.url),
    "utf8",
  );
  const orderPage = await readFile(
    new URL("../src/routes/order.$orderId.tsx", import.meta.url),
    "utf8",
  );
  assert.match(panel, /VITE_ENABLE_REFUNDS === "true"/);
  assert.match(panel, /flbygucibbrfcwcgzyea/);
  assert.match(panel, /get_customer_refund_eligibility/);
  assert.match(panel, /request_order_refund/);
  assert.match(panel, /sessionStorage/);
  assert.match(orderPage, /<OrderRefundPanel order=\{order\} \/>/);
  assert.doesNotMatch(orderPage, /automatically refunded to your original payment method/);
});
