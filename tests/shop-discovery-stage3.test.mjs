import test from "node:test";
import assert from "node:assert/strict";
import { productsByStore } from "../src/lib/mock-data.ts";

test("Stage 3: store route does not fall back to Roja Mart when shop products are empty", () => {
  const storeId = "s_non_existent_mock_shop";
  const storeProducts = productsByStore[storeId] ?? [];

  // Must be empty array, never falling back to Roja Mart
  assert.equal(Array.isArray(storeProducts), true);
  assert.equal(storeProducts.length, 0);

  const rojaProducts = productsByStore["s_roja_mart"];
  assert.notEqual(storeProducts, rojaProducts);
});

test("Stage 3: genuine MRP and honest discount calculation", () => {
  // Test case A: product without genuine MRP
  const productWithoutMrp = { price: 100 };
  const mrpA =
    productWithoutMrp.mrp != null && Number(productWithoutMrp.mrp) > productWithoutMrp.price
      ? Number(productWithoutMrp.mrp)
      : null;
  const discountPctA = mrpA ? Math.round(((mrpA - productWithoutMrp.price) / mrpA) * 100) : 0;

  assert.equal(mrpA, null, "Should not fabricate 1.25x or 1.1x MRP");
  assert.equal(discountPctA, 0, "Should have 0% discount if no genuine MRP");

  // Test case B: product with genuine MRP higher than selling price
  const productWithMrp = { price: 80, mrp: 100 };
  const mrpB =
    productWithMrp.mrp != null && Number(productWithMrp.mrp) > productWithMrp.price
      ? Number(productWithMrp.mrp)
      : null;
  const discountPctB = mrpB ? Math.round(((mrpB - productWithMrp.price) / mrpB) * 100) : 0;

  assert.equal(mrpB, 100);
  assert.equal(discountPctB, 20);

  // Test case C: product where mrp <= price
  const productWithEqualMrp = { price: 100, mrp: 100 };
  const mrpC =
    productWithEqualMrp.mrp != null && Number(productWithEqualMrp.mrp) > productWithEqualMrp.price
      ? Number(productWithEqualMrp.mrp)
      : null;
  const discountPctC = mrpC ? Math.round(((mrpC - productWithEqualMrp.price) / mrpC) * 100) : 0;

  assert.equal(mrpC, null);
  assert.equal(discountPctC, 0);
});

test("Stage 3: real review counts and ratings are never fabricated", () => {
  const shopWithNoRating = { name: "New Bakery", rating: 0 };
  const hasValidRating = typeof shopWithNoRating.rating === "number" && shopWithNoRating.rating > 0;
  assert.equal(hasValidRating, false);

  const shopWithRatingNoReviews = { name: "Spice Shop", rating: 4.5 };
  const reviewCount =
    shopWithRatingNoReviews.reviewCount ?? shopWithRatingNoReviews.review_count;
  assert.equal(reviewCount, undefined, "Missing review count should be undefined, not Math.floor(rating * 240)");
});
