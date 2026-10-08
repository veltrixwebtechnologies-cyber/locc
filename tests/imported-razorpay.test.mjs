import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import fs from "node:fs";
import { sourceLoader } from "./load-source.mjs";

const admin = {
  from(table) {
    assert.equal(table, "imported_shops");
    return {
      select() {
        return this;
      },
      eq(column, id) {
        assert.equal(column, "id");
        assert.equal(id, shopId.slice(9));
        return this;
      },
      async maybeSingle() {
        return {
          data: { id: shopId.slice(9), business_name: "Bakery A", category: "Bakery" },
          error: null,
        };
      },
    };
  },
};
const load = sourceLoader(process.cwd(), {
  "@tanstack/react-start": `export function createServerFn(){return {middleware(){return this},validator(fn){this.validate=fn;return this},handler(fn){return {handler:fn,validate:this.validate}}}}`,
  "@/integrations/supabase/auth-middleware": "export const requireSupabaseAuth = {};",
  "@/integrations/supabase/client": "export const supabase = {};",
  "@/integrations/supabase/client.server": "export const supabaseAdmin = globalThis.__testSupabaseAdmin;",
});
globalThis.__testSupabaseAdmin = admin;
const security = await load("src/lib/imported-payment-security.server.ts");
const { createImportedTestOrderFn: createOrder, verifyImportedTestPaymentFn: verifyPayment } =
  await load("src/lib/imported-razorpay.functions.ts");
const shopId = "imported:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const itemId = `sample:${shopId}:birthday-cake`;
const input = {
  shopId,
  items: [{ product_id: itemId, qty: 2 }],
  address: "Confirmed entrance",
  latitude: 11.02,
  longitude: 76.98,
};

test("prototype credentials never accept live or incomplete key pairs", () => {
  assert.throws(() =>
    security.testCredentials({
      RAZORPAY_KEY_ID: "rzp_live_example",
      RAZORPAY_KEY_SECRET: "secret",
    }),
  );
  assert.throws(() =>
    security.testCredentials({
      RAZORPAY_TEST_KEY_ID: "rzp_test_example",
      RAZORPAY_KEY_SECRET: "secret",
    }),
  );
  assert.equal(
    security.testCredentials({ RAZORPAY_KEY_ID: "rzp_test_example", RAZORPAY_KEY_SECRET: "secret" })
      .keyId,
    "rzp_test_example",
  );
});
test("signed checkout tokens reject modification, other users, expiry and false signatures", () => {
  const token = security.signTestCheckout(
    {
      userId: "u",
      orderId: "order_1",
      amountPaise: 100,
      expiresAt: 200,
      receipt: { storeId: shopId },
    },
    "secret",
  );
  assert.equal(security.readTestCheckout(token, "secret", "u", 100).orderId, "order_1");
  assert.throws(() => security.readTestCheckout(token, "secret", "other", 100));
  assert.throws(() => security.readTestCheckout(token, "secret", "u", 200));
  assert.throws(() => security.readTestCheckout(`x${token}`, "secret", "u", 100));
  assert.throws(() => security.verifyTestSignature("order_1", "pay_1", "0".repeat(64), "secret"));
});
test("official test gateway flow prices the selected catalog and verifies captured payments without live writes", async () => {
  const previousFetch = globalThis.fetch;
  const oldId = process.env.RAZORPAY_TEST_KEY_ID;
  const oldSecret = process.env.RAZORPAY_TEST_KEY_SECRET;
  process.env.RAZORPAY_TEST_KEY_ID = "rzp_test_example";
  process.env.RAZORPAY_TEST_KEY_SECRET = "test-secret";
  const requests = [];
  const context = {
    userId: "user-a",
  };
  let amount;
  let status = "captured";
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    if (url.endsWith("/orders")) {
      amount = JSON.parse(options.body).amount;
      return { ok: true, json: async () => ({ id: "order_test1", amount, currency: "INR" }) };
    }
    return {
      ok: true,
      json: async () => ({
        id: "pay_test1",
        order_id: "order_test1",
        amount,
        currency: "INR",
        status: url.endsWith("/capture") ? "captured" : status,
      }),
    };
  };
  try {
    createOrder.validate(input);
    assert.throws(() => createOrder.validate({ ...input, latitude: 200 }));
    for (const items of [
      [input.items[0], input.items[0]],
      [{ product_id: "other", qty: 1 }],
      [{ product_id: itemId, qty: -1 }],
      [{ product_id: itemId, qty: 100 }],
    ])
      await assert.rejects(createOrder.handler({ data: { ...input, items }, context }));
    const order = await createOrder.handler({ data: input, context });
    assert.equal(order.amount_paise, 132500); // 2 × ₹650 + existing ₹25 checkout fee
    assert.equal(requests.length, 1);
    const verification = {
      token: order.test_checkout_token,
      orderId: order.razorpay_order_id,
      paymentId: "pay_test1",
      signature: createHmac("sha256", "test-secret").update("order_test1|pay_test1").digest("hex"),
    };
    const receipt = await verifyPayment.handler({ data: verification, context });
    assert.equal(receipt.storeName, "Bakery A");
    assert.equal(receipt.isDemoPayment, true);
    assert.equal(receipt.paymentReference, "pay_test1");
    assert.equal(receipt.total, 1325);
    assert.equal(receipt.etaMin, 0);
    const retry = await verifyPayment.handler({ data: verification, context });
    assert.equal(retry.id, receipt.id);
    status = "authorized";
    assert.equal((await verifyPayment.handler({ data: verification, context })).id, receipt.id);
    assert.ok(requests.some((request) => request.url.endsWith("/capture")));
    amount += 1;
    await assert.rejects(verifyPayment.handler({ data: verification, context }));
    amount -= 1;
    status = "failed";
    await assert.rejects(verifyPayment.handler({ data: verification, context }));
    await assert.rejects(
      verifyPayment.handler({ data: verification, context: { ...context, userId: "other" } }),
    );
    const source = fs.readFileSync("src/lib/imported-razorpay.functions.ts", "utf8");
    assert.doesNotMatch(source, /\.rpc\(|\.insert\(|\.update\(|place_order/);
    assert.match(source, /supabaseAdmin/);
  } finally {
    globalThis.fetch = previousFetch;
    if (oldId === undefined) delete process.env.RAZORPAY_TEST_KEY_ID;
    else process.env.RAZORPAY_TEST_KEY_ID = oldId;
    if (oldSecret === undefined) delete process.env.RAZORPAY_TEST_KEY_SECRET;
    else process.env.RAZORPAY_TEST_KEY_SECRET = oldSecret;
  }
});
