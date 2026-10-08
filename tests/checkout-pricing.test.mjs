import assert from "node:assert/strict";
import test from "node:test";
import { sourceLoader } from "./load-source.mjs";

const { calculateBillBreakdown } = await sourceLoader(process.cwd(), {
  "@/integrations/supabase/client": "export const supabase = {};",
})("src/lib/coupons.ts");

test("checkout base total matches the persisted order RPC quote", () => {
  const bill = calculateBillBreakdown({ subtotal: 500, rawDeliveryFee: 79 });

  assert.equal(bill.deliveryFee, 25);
  assert.equal(bill.platformFee, 0);
  assert.equal(bill.total, 525);
});

test("checkout uses the authoritative coupon quote total", () => {
  const bill = calculateBillBreakdown({
    subtotal: 500,
    rawDeliveryFee: 79,
    couponQuote: {
      code: "FREESHIP",
      discountType: "free_shipping",
      discountAmount: 25,
      shippingFee: 0,
      total: 500,
    },
  });

  assert.equal(bill.deliveryFee, 0);
  assert.equal(bill.total, 500);
});
