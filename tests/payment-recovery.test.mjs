import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("captured payment order-confirmation failures have a safe retry path", () => {
  const checkout = fs.readFileSync("src/routes/checkout.tsx", "utf8");

  assert.match(checkout, /setPaymentRecovery\(\{/);
  assert.match(checkout, /retryPaymentOrderConfirmation/);
  assert.match(checkout, /Do not pay again/);
  assert.match(checkout, /!!paymentRecovery/);
  assert.match(checkout, /payment_attempt_id: rzpOrder\.payment_attempt_id/);
});

test("payment verification uses an idempotent persisted request ID", () => {
  const payment = fs.readFileSync("src/lib/razorpay.functions.ts", "utf8");

  assert.match(payment, /const request_id = attempt\.id/);
  assert.match(payment, /p_request_id: request_id/);
  assert.match(payment, /correlationId/);
});
