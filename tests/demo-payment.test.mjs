import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { sourceLoader } from "./load-source.mjs";
const { buildDemoReceipt } = await sourceLoader(process.cwd())("src/lib/demo-payment.ts");
const product = {
  id: "product-1",
  seller_id: "seller-1",
  name: "Real shirt",
  selling_price: 299,
  stock: 4,
};
const input = {
  storeId: "seller-1",
  storeName: "Seller shop",
  lines: [
    {
      productId: product.id,
      storeId: "seller-1",
      name: "Shirt",
      unit: "piece",
      price: 299,
      qty: 2,
    },
  ],
  subtotal: 598,
  deliveryFee: 35,
  total: 633,
  address: "Address",
  destination: { lat: 11, lng: 77 },
  paymentMethod: "Demo",
  etaMin: 25,
  distanceKm: 2,
};
test("demo receipt contains real inventory snapshots and is distinct from live orders", () => {
  const receipt = buildDemoReceipt(input, [product], "12345678");
  assert.equal(receipt.id, "demo-12345678");
  assert.equal(receipt.code, "TEST-12345678");
  assert.equal(receipt.isDemoPayment, true);
  assert.equal(receipt.lines[0].name, product.name);
  assert.equal(receipt.etaMin, 0);
  assert.equal(receipt.total, 633);
  assert.equal(product.stock, 4);
});
test("demo checkout rejects missing, unrelated, duplicate, stale and unavailable products", () => {
  assert.throws(() => buildDemoReceipt(input, [], "id"));
  assert.throws(() => buildDemoReceipt(input, [{ ...product, seller_id: "other" }], "id"));
  for (const change of [{ qty: 5 }, { qty: 0 }, { qty: 1.5 }, { price: 1 }, { storeId: "other" }]) {
    assert.throws(() =>
      buildDemoReceipt({ ...input, lines: [{ ...input.lines[0], ...change }] }, [product], "id"),
    );
  }
  assert.throws(() =>
    buildDemoReceipt({ ...input, lines: [input.lines[0], input.lines[0]] }, [product], "id"),
  );
  assert.throws(() => buildDemoReceipt({ ...input, subtotal: 1 }, [product], "id"));
  assert.throws(() => buildDemoReceipt({ ...input, total: NaN }, [product], "id"));
});
test("demo payment bypasses the gateway and persists separately without a live order RPC", () => {
  const checkout = fs.readFileSync("src/routes/checkout.tsx", "utf8");
  assert.match(checkout, /pay === "cod" \|\| pay === "demo"/);
  assert.match(checkout, /pay === "demo" \? ordersStore.placeDemo : ordersStore.place/);
  const source = fs
    .readFileSync("src/lib/orders-store.ts", "utf8")
    .split("async placeDemo")[1]
    .split("async place(")[0];
  assert.doesNotMatch(source, /\.rpc\(|\.insert\(|\.update\(|updateOrdersCache/);
  assert.match(source, /demoOrdersKey\(user.id\)/);
});
