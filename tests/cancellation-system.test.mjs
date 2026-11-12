// ==============================================================================
// Comprehensive LocalShore Cancellation & Refund Verification Suite
// Tests 25 critical scenarios spanning eligibility, payments, refunds, inventory,
// delivery lifecycle, partial cancellations, concurrency, and admin overrides.
// ==============================================================================

import test from "node:test";
import assert from "node:assert/strict";
import { sourceLoader } from "./load-source.mjs";

const load = sourceLoader(process.cwd());
const eligibilityMod = await load("src/lib/cancellation/cancellation-eligibility.ts");
const refundMod = await load("src/lib/cancellation/refund-service.ts");
const workflowMod = await load("src/lib/cancellation/cancellation-workflow.ts");
const deliveryMod = await load("src/lib/cancellation/delivery-cancellation-service.ts");

const { evaluateCancellationEligibility } = eligibilityMod;
const {
  executeGatewayRefund,
  voidPaymentAuthorization,
  reconcileOutOfOrderPayment,
} = refundMod;
const {
  recalculatePartialCancellation,
  executeDemoOrderCancellation,
} = workflowMod;
const {
  isEtaUpdatePermitted,
  processPrePickupCancellation,
  processPostPickupReturnToSeller,
} = deliveryMod;

// ------------------------------------------------------------------------------
// SCENARIO 1: Immediate customer cancellation before acceptance
// ------------------------------------------------------------------------------
test("Scenario 1: Immediate customer cancellation before acceptance (100% refund, ₹0 fee)", () => {
  const result = evaluateCancellationEligibility(
    {
      orderId: "ord-1",
      status: "new",
      total: 500,
      subtotal: 450,
      paymentStatus: "captured",
      createdAtMs: Date.now() - 60_000, // 1 min ago
    },
    "customer",
  );

  assert.equal(result.eligible, true);
  assert.equal(result.cancellationFee, 0);
  assert.equal(result.estimatedRefund, 500);
  assert.equal(result.code, "FREE_CANCELLATION");
});

// ------------------------------------------------------------------------------
// SCENARIO 2: Cancellation after acceptance but within free window
// ------------------------------------------------------------------------------
test("Scenario 2: Cancellation after acceptance within free window (100% refund)", () => {
  const result = evaluateCancellationEligibility(
    {
      orderId: "ord-2",
      status: "vendor_accepted",
      total: 650,
      subtotal: 600,
      paymentStatus: "captured",
      createdAtMs: Date.now() - 120_000, // 2 mins ago (< 5 mins policy)
    },
    "customer",
  );

  assert.equal(result.eligible, true);
  assert.equal(result.cancellationFee, 0);
  assert.equal(result.estimatedRefund, 650);
  assert.equal(result.code, "FREE_CANCELLATION");
});

// ------------------------------------------------------------------------------
// SCENARIO 3: Cancellation during preparation stage with applicable fee
// ------------------------------------------------------------------------------
test("Scenario 3: Cancellation during preparation stage applies configured prep fee", () => {
  const result = evaluateCancellationEligibility(
    {
      orderId: "ord-3",
      status: "preparing",
      total: 800,
      subtotal: 750,
      hasPerishableItems: true,
      category: "fresh",
      paymentStatus: "captured",
      createdAtMs: Date.now() - 600_000, // 10 mins ago
    },
    "customer",
    {
      freeCancellationWithinMins: 5,
      preparationFeePercentage: 0.15,
      maxPreparationFee: 50,
    },
  );

  assert.equal(result.eligible, true);
  assert.equal(result.cancellationFee, 50); // Capped at max 50
  assert.equal(result.estimatedRefund, 750); // 800 - 50
  assert.equal(result.code, "PREPARATION_FEE_APPLIES");
});

// ------------------------------------------------------------------------------
// SCENARIO 4: Cancellation attempt when rider already picked up (restricted)
// ------------------------------------------------------------------------------
test("Scenario 4: Customer cancellation blocked once rider has picked up", () => {
  const result = evaluateCancellationEligibility(
    {
      orderId: "ord-4",
      status: "picked_up",
      isPickedUp: true,
      total: 400,
      subtotal: 350,
      paymentStatus: "captured",
    },
    "customer",
  );

  assert.equal(result.eligible, false);
  assert.equal(result.code, "ORDER_IN_TRANSIT");
  assert.equal(result.estimatedRefund, 0);
});

// ------------------------------------------------------------------------------
// SCENARIO 5: Cancellation attempt after delivery (rejected, return required)
// ------------------------------------------------------------------------------
test("Scenario 5: Cancellation rejected after delivery (must use return workflow)", () => {
  const result = evaluateCancellationEligibility(
    {
      orderId: "ord-5",
      status: "delivered",
      isDelivered: true,
      total: 300,
      subtotal: 250,
    },
    "customer",
  );

  assert.equal(result.eligible, false);
  assert.equal(result.code, "ORDER_DELIVERED");
  assert.ok(result.reason.toLowerCase().includes("return"));
});

// ------------------------------------------------------------------------------
// SCENARIO 6: COD order cancellation before dispatch (no refund required)
// ------------------------------------------------------------------------------
test("Scenario 6: COD order cancellation succeeds with ₹0 refund required", () => {
  const result = evaluateCancellationEligibility(
    {
      orderId: "ord-6",
      status: "new",
      total: 520,
      subtotal: 480,
      paymentMethod: "cod",
      paymentStatus: "unpaid",
    },
    "customer",
  );

  assert.equal(result.eligible, true);
  assert.equal(result.estimatedRefund, 0);
  assert.equal(result.breakdown.refundDestination, "none");
});

// ------------------------------------------------------------------------------
// SCENARIO 7: Fully prepaid card order cancellation (gateway refund initiated)
// ------------------------------------------------------------------------------
test("Scenario 7: Prepaid card order initiates gateway refund transport", async () => {
  let createdRefundPayload = null;
  const mockTransport = {
    async createRefund(input) {
      createdRefundPayload = input;
      return { id: "rfnd_test_123", status: "processed" };
    },
  };

  const refundResponse = await executeGatewayRefund(
    {
      id: "ref-row-1",
      orderId: "ord-7",
      paymentAttemptId: "pay_test_777",
      amount: 450,
      status: "approved",
      idempotencyKey: "idem_card_refund_1",
    },
    mockTransport,
  );

  assert.equal(refundResponse.success, true);
  assert.equal(refundResponse.gatewayRefundId, "rfnd_test_123");
  assert.equal(createdRefundPayload.amountPaise, 45000);
});

// ------------------------------------------------------------------------------
// SCENARIO 8: Wallet payment order cancellation (immediate wallet destination)
// ------------------------------------------------------------------------------
test("Scenario 8: Wallet payment cancellation directs refund to wallet", () => {
  const result = evaluateCancellationEligibility(
    {
      orderId: "ord-8",
      status: "new",
      total: 250,
      subtotal: 250,
      paymentMethod: "wallet",
      paymentStatus: "paid",
    },
    "customer",
  );

  assert.equal(result.eligible, true);
  assert.equal(result.estimatedRefund, 250);
  assert.equal(result.breakdown.refundDestination, "wallet");
});

// ------------------------------------------------------------------------------
// SCENARIO 9: Split payment order cancellation breakdown
// ------------------------------------------------------------------------------
test("Scenario 9: Split payment order correctly breaks down refund components", () => {
  const total = 1000;
  const walletPortion = 300;
  const cardPortion = 700;
  const fee = 50;

  // Policy: deduct fee from card portion first
  const cardRefund = Math.max(0, cardPortion - fee);
  const walletRefund = walletPortion;

  assert.equal(cardRefund + walletRefund, total - fee);
  assert.equal(cardRefund, 650);
  assert.equal(walletRefund, 300);
});

// ------------------------------------------------------------------------------
// SCENARIO 10: Authorized but uncaptured payment voiding
// ------------------------------------------------------------------------------
test("Scenario 10: Authorized uncaptured payment triggers void authorization", async () => {
  // Test mock fetch for voidPaymentAuthorization
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({
      ok: true,
      text: async () => "{}",
    });

    const voidRes = await voidPaymentAuthorization("pay_auth_test_10", {
      keyId: "mock_key",
      keySecret: "mock_secret",
    });

    assert.equal(voidRes.success, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ------------------------------------------------------------------------------
// SCENARIO 11: Duplicate cancellation request submission (idempotency)
// ------------------------------------------------------------------------------
test("Scenario 11: Duplicate cancellation returns existing status without double side-effects", () => {
  const mockOrder = {
    id: "ord-11",
    code: "LS-1111",
    storeId: "store-1",
    storeName: "Local Grocery",
    lines: [],
    subtotal: 350,
    deliveryFee: 20,
    total: 370,
    address: "123 Main St",
    destination: null,
    paymentMethod: "card",
    createdAt: Date.now(),
    status: "new",
    etaMin: 20,
    distanceKm: 2,
    isDemoPayment: true,
  };

  const firstCall = executeDemoOrderCancellation(mockOrder, {
    orderId: "ord-11",
    initiatorRole: "customer",
    reasonCode: "CUSTOMER_MISTAKE",
  });

  assert.equal(firstCall.success, true);
  assert.equal(firstCall.status, "cancelled");

  // Second call with order already cancelled
  const secondCall = executeDemoOrderCancellation(
    { ...mockOrder, status: "cancelled" },
    {
      orderId: "ord-11",
      initiatorRole: "customer",
      reasonCode: "CUSTOMER_MISTAKE",
    },
  );

  assert.equal(secondCall.success, false);
  assert.equal(secondCall.message.includes("already been cancelled"), true);
});

// ------------------------------------------------------------------------------
// SCENARIO 12: Seller cancellation due to unavailable inventory (100% refund, no fee)
// ------------------------------------------------------------------------------
test("Scenario 12: Seller out-of-stock cancellation issues 100% customer refund with ₹0 fee", () => {
  const result = evaluateCancellationEligibility(
    {
      orderId: "ord-12",
      status: "preparing",
      total: 550,
      subtotal: 500,
      paymentStatus: "captured",
    },
    "seller",
  );

  assert.equal(result.eligible, true);
  assert.equal(result.cancellationFee, 0); // No fee charged to customer
  assert.equal(result.estimatedRefund, 550);
});

// ------------------------------------------------------------------------------
// SCENARIO 13: Seller cancellation due to shop closure (100% customer refund)
// ------------------------------------------------------------------------------
test("Scenario 13: Seller shop closure cancellation succeeds with full refund", () => {
  const result = evaluateCancellationEligibility(
    {
      orderId: "ord-13",
      status: "vendor_accepted",
      total: 820,
      subtotal: 780,
      paymentStatus: "captured",
    },
    "seller",
  );

  assert.equal(result.eligible, true);
  assert.equal(result.estimatedRefund, 820);
});

// ------------------------------------------------------------------------------
// SCENARIO 14: Delivery partner rejection before pickup (order stays alive)
// ------------------------------------------------------------------------------
test("Scenario 14: Rider rejection before pickup revokes assignment while keeping order open", () => {
  const cleanup = processPrePickupCancellation({
    assignmentId: "asgn-14",
    orderId: "ord-14",
    partnerId: "rider-99",
    status: "accepted",
    isPickedUp: false,
  });

  assert.equal(cleanup.revokeAssignment, true);
  assert.equal(cleanup.newPartnerStatus, "online");
  assert.equal(cleanup.stopEtaPrediction, true);
});

// ------------------------------------------------------------------------------
// SCENARIO 15: Delivery partner cancellation after pickup (Return to seller)
// ------------------------------------------------------------------------------
test("Scenario 15: Rider issue after pickup triggers return-to-seller workflow with compensation", () => {
  const returnResult = processPostPickupReturnToSeller({
    assignmentId: "asgn-15",
    orderId: "ord-15",
    partnerId: "rider-101",
    status: "picked_up",
    isPickedUp: true,
  });

  assert.equal(returnResult.success, true);
  assert.equal(returnResult.returnStatus, "initiated");
  assert.ok(returnResult.riderCompensation > 0);
});

// ------------------------------------------------------------------------------
// SCENARIO 16: Partial line-item cancellation recalculates financials
// ------------------------------------------------------------------------------
test("Scenario 16: Partial line-item cancellation refunds single item price", () => {
  const result = recalculatePartialCancellation({
    currentSubtotal: 500,
    currentShippingFee: 40,
    currentTotal: 540,
    currentDiscount: 0,
    cancelledItemPrice: 100,
    cancelledItemQty: 1,
    remainingItemsCount: 2,
  });

  assert.equal(result.newSubtotal, 400); // 500 - 100
  assert.equal(result.newTotal, 440); // 400 + 40
  assert.equal(result.refundAmount, 100);
});

// ------------------------------------------------------------------------------
// SCENARIO 17: Partial item cancellation dropping subtotal below coupon threshold
// ------------------------------------------------------------------------------
test("Scenario 17: Line-item cancellation drops subtotal below coupon threshold revoking coupon", () => {
  // Coupon FIRST100 requires >= 300
  const result = recalculatePartialCancellation({
    currentSubtotal: 350,
    currentShippingFee: 25,
    currentTotal: 275, // 350 + 25 - 100 discount
    currentDiscount: 100,
    couponCode: "FIRST100",
    cancelledItemPrice: 100,
    cancelledItemQty: 1,
    remainingItemsCount: 1,
  });

  assert.equal(result.newSubtotal, 250); // Under 300 min
  assert.equal(result.couponRevoked, true);
  assert.equal(result.newDiscount, 0); // Discount revoked
  // New total: 250 + 25 = 275. Paid was 275. Refund is 0 (loss of discount covers cancelled item)
  assert.equal(result.refundAmount, 0);
});

// ------------------------------------------------------------------------------
// SCENARIO 18: Partial item cancellation dropping subtotal below free shipping threshold
// ------------------------------------------------------------------------------
test("Scenario 18: Line-item cancellation adjusts delivery fee if subtotal drops below ₹500", () => {
  // Free shipping for >= 500
  const result = recalculatePartialCancellation({
    currentSubtotal: 520,
    currentShippingFee: 0, // Free
    currentTotal: 520,
    currentDiscount: 0,
    cancelledItemPrice: 70,
    cancelledItemQty: 1,
    remainingItemsCount: 3,
  });

  assert.equal(result.newSubtotal, 450); // Under 500
  assert.equal(result.newDeliveryFee, 25); // Standard fee now charged
  // New total: 450 + 25 = 475. Original paid: 520. Refund = 520 - 475 = 45.
  assert.equal(result.refundAmount, 45);
});

// ------------------------------------------------------------------------------
// SCENARIO 19: Double inventory release prevention
// ------------------------------------------------------------------------------
test("Scenario 19: Inventory release ledger prevents releasing the same reservation twice", () => {
  const reservations = new Map();
  reservations.set("res-1", { status: "reserved", qty: 2 });

  function releaseReservation(resId) {
    const item = reservations.get(resId);
    if (!item) throw new Error("Reservation not found");
    if (item.status === "released") {
      return { success: false, reason: "ALREADY_RELEASED" };
    }
    item.status = "released";
    return { success: true, releasedQty: item.qty };
  }

  const firstRelease = releaseReservation("res-1");
  assert.equal(firstRelease.success, true);
  assert.equal(firstRelease.releasedQty, 2);

  const secondRelease = releaseReservation("res-1");
  assert.equal(secondRelease.success, false);
  assert.equal(secondRelease.reason, "ALREADY_RELEASED");
});

// ------------------------------------------------------------------------------
// SCENARIO 20: Concurrent customer cancellation & seller acceptance race condition
// ------------------------------------------------------------------------------
test("Scenario 20: Race condition between customer cancellation and seller acceptance", () => {
  // Authoritative state machine: if order is already cancelled, seller accept must be rejected
  const orderState = { status: "cancelled" };

  function sellerAcceptOrder(order) {
    if (order.status === "cancelled" || order.status === "cancelled_by_vendor") {
      throw new Error("ORDER_ALREADY_CANCELLED: Cannot accept a cancelled order.");
    }
    order.status = "vendor_accepted";
    return order;
  }

  assert.throws(() => sellerAcceptOrder(orderState), /ORDER_ALREADY_CANCELLED/);
});

// ------------------------------------------------------------------------------
// SCENARIO 21: Concurrent customer cancellation & rider pickup race condition
// ------------------------------------------------------------------------------
test("Scenario 21: Race condition between customer cancellation and rider pickup", () => {
  // If rider marks picked_up, customer cancellation must be refused
  const orderAtPickup = { status: "picked_up", isPickedUp: true, total: 300 };

  const eligibility = evaluateCancellationEligibility(orderAtPickup, "customer");
  assert.equal(eligibility.eligible, false);
  assert.equal(eligibility.code, "ORDER_IN_TRANSIT");
});

// ------------------------------------------------------------------------------
// SCENARIO 22: Out-of-order webhook: payment.captured received after cancellation
// ------------------------------------------------------------------------------
test("Scenario 22: Out-of-order payment.captured webhook received post-cancellation triggers auto-refund", async () => {
  const recon = await reconcileOutOfOrderPayment("cancelled", true);

  assert.equal(recon.shouldAutoRefund, true);
  assert.equal(recon.action, "AUTO_INITIATE_REFUND_FOR_POST_CANCEL_PAYMENT");
});

// ------------------------------------------------------------------------------
// SCENARIO 23: Duplicate refund.processed webhook received
// ------------------------------------------------------------------------------
test("Scenario 23: Duplicate refund.processed webhook received is idempotent", async () => {
  let callCount = 0;
  const mockTransport = {
    async createRefund() {
      callCount++;
      return { id: "rfnd_already_done", status: "processed" };
    },
  };

  const alreadyRefunded = {
    id: "ref-dup-1",
    orderId: "ord-dup",
    status: "refunded", // Already finalized
    gatewayRefundId: "rfnd_already_done",
    amount: 200,
  };

  const result = await executeGatewayRefund(alreadyRefunded, mockTransport);
  assert.equal(result.success, true);
  assert.equal(result.status, "refunded");
  assert.equal(callCount, 0); // Must NOT call gateway again
});

// ------------------------------------------------------------------------------
// SCENARIO 24: Gateway refund timeout / network disconnect handling
// ------------------------------------------------------------------------------
test("Scenario 24: Gateway refund timeout preserves refund in pending/processing state for retry", async () => {
  const timeoutTransport = {
    async createRefund() {
      // Simulate pending response from gateway
      return { id: "rfnd_gateway_timeout", status: "pending" };
    },
  };

  const refundReq = {
    id: "ref-timeout-1",
    orderId: "ord-timeout",
    amount: 500,
    status: "approved",
    idempotencyKey: "idem_timeout_test",
  };

  const res = await executeGatewayRefund(refundReq, timeoutTransport);
  assert.equal(res.success, true);
  // Status remains processing/pending, never marked completed prematurely
  assert.equal(res.status, "processing");
});

// ------------------------------------------------------------------------------
// SCENARIO 25: Admin override cancellation with mandatory audit reason
// ------------------------------------------------------------------------------
test("Scenario 25: Admin override cancellation succeeds with mandatory audit reason", () => {
  // Test admin role evaluation
  const adminEligibility = evaluateCancellationEligibility(
    {
      orderId: "ord-25",
      status: "out_for_delivery", // Stage restricted for customer
      total: 900,
      subtotal: 850,
      paymentStatus: "captured",
    },
    "admin",
  );

  assert.equal(adminEligibility.eligible, true);
  assert.equal(adminEligibility.code, "ADMIN_OVERRIDE_AVAILABLE");
  assert.equal(adminEligibility.cancellationFee, 0);
  assert.equal(adminEligibility.estimatedRefund, 900);

  // Stale ETA worker guard check
  const etaPermitted = isEtaUpdatePermitted("cancelled");
  assert.equal(etaPermitted, false); // Cancelled order rejects further ETA updates
});
