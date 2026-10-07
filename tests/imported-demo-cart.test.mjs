import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { sourceLoader } from "./load-source.mjs";
const { getDemoPrice, getImportedDemoTotal } = await sourceLoader(process.cwd())(
  "src/lib/imported-demo-cart.ts",
);
test("category demo prices and cart totals are deterministic", () => {
  assert.equal(getDemoPrice("Jeans", "Fashion & Apparel"), 1299);
  assert.equal(getDemoPrice("Sofas", "Furniture"), 14999);
  const items = [
    { id: "shop-a:1", price: 799 },
    { id: "shop-a:2", price: 1299 },
  ];
  assert.equal(getImportedDemoTotal(items, { "shop-a:1": 2, "shop-a:2": 1 }), 2897);
  assert.equal(getImportedDemoTotal(items, { "other-shop": 9 }), 0);
  for (const qty of [-1, 0.5, 100, NaN])
    assert.throws(() => getImportedDemoTotal(items, { "shop-a:1": qty }));
});
test("public shop demo cart has no live cart, order, payment or dispatch integration", () => {
  const source = fs.readFileSync("src/components/imported-demo-catalog.tsx", "utf8");
  assert.doesNotMatch(source, /from ["'].*(?:orders-store|cart-store|razorpay|supabase)/);
  assert.match(source, /amountCharged: 0/);
  assert.match(source, /ProductThumb/);
  assert.match(source, /QtyStepper/);
  assert.match(source, /key=\{item.id\}/);
});
