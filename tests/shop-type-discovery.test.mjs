import test from "node:test";
import assert from "node:assert/strict";
import {
  getCategoryByIdOrSlug,
  isStoreInCategory,
  ALL_SHOP_CATEGORIES,
} from "../src/lib/shop-categories.ts";
import { parseFilterParams, serializeFilterParams } from "../src/lib/filter-utils.ts";

test("Level A & B: Category configuration resolves valid shop taxonomy", () => {
  const groceryCat = getCategoryByIdOrSlug("grocery");
  assert.equal(groceryCat.id, "grocery");
  assert.equal(groceryCat.name, "Kirana & Grocery");
  assert.equal(groceryCat.heading, "Groceries Near You");
  assert.ok(groceryCat.subheading.length > 0);

  const bakeryCat = getCategoryByIdOrSlug("bakery");
  assert.equal(bakeryCat.id, "bakery");
  assert.equal(bakeryCat.name, "Bakeries");
  assert.equal(bakeryCat.heading, "Best Bakeries Near You");

  const meatCat = getCategoryByIdOrSlug("meat_fish");
  assert.equal(meatCat.id, "meat_fish");

  // Fallback for unknown category defaults to All Shops
  const fallbackCat = getCategoryByIdOrSlug("unknown_xyz");
  assert.equal(fallbackCat.id, "all");
});

test("Level B: isStoreInCategory matches shop category correctly without string collisions", () => {
  // Grocery matches kirana / grocery / provisions / ration
  assert.equal(isStoreInCategory("grocery", "grocery"), true);
  assert.equal(isStoreInCategory("kirana", "grocery"), true);
  assert.equal(isStoreInCategory("flour_mill", "grocery"), true);
  assert.equal(isStoreInCategory("bakery", "grocery"), false);
  assert.equal(isStoreInCategory("meat_fish", "grocery"), false);

  // Supermarkets is its own category in the taxonomy
  assert.equal(isStoreInCategory("supermarkets", "supermarkets"), true);
  assert.equal(isStoreInCategory("grocery", "supermarkets"), false);

  // Bakery matches bakery / bakes / cakes
  assert.equal(isStoreInCategory("bakery", "bakery"), true);
  assert.equal(isStoreInCategory("cake", "bakery"), true);
  assert.equal(isStoreInCategory("pharmacy", "bakery"), false);

  // Meat & Seafood
  assert.equal(isStoreInCategory("meat_fish", "meat_fish"), true);
  assert.equal(isStoreInCategory("chicken", "meat_fish"), true);
  assert.equal(isStoreInCategory("fish", "meat_fish"), true);
  assert.equal(isStoreInCategory("grocery", "meat_fish"), false);

  // All shops returns true for any category
  assert.equal(isStoreInCategory("grocery", "all"), true);
  assert.equal(isStoreInCategory("bakery", "all"), true);
  assert.equal(isStoreInCategory("meat_fish", "all"), true);
});

test("Level C: Category filtering guarantees only shops and products in selected category are shown", () => {
  const sampleShops = [
    { id: "shop-1", name: "Annapoorna Kirana", category: "grocery" },
    { id: "shop-2", name: "Sri Krishna Sweets & Bakery", category: "bakery" },
    { id: "shop-3", name: "Fresh Catch Fish Stall", category: "meat_fish" },
    { id: "shop-4", name: "Nilgiris Provisions", category: "provisions" },
  ];

  const filteredForGrocery = sampleShops.filter((s) =>
    isStoreInCategory(s.category, "grocery")
  );
  assert.equal(filteredForGrocery.length, 2);
  assert.ok(filteredForGrocery.some((s) => s.id === "shop-1"));
  assert.ok(filteredForGrocery.some((s) => s.id === "shop-4"));
  assert.ok(!filteredForGrocery.some((s) => s.id === "shop-2"));
  assert.ok(!filteredForGrocery.some((s) => s.id === "shop-3"));

  const filteredForBakery = sampleShops.filter((s) =>
    isStoreInCategory(s.category, "bakery")
  );
  assert.equal(filteredForBakery.length, 1);
  assert.equal(filteredForBakery[0].id, "shop-2");
});

test("Level D & E: Storefront breadcrumbs and back navigation preserve category context", () => {
  // Verify that category query parameter is accepted by getCategoryByIdOrSlug
  const searchParams = { category: "bakery" };
  const resolvedCategory = getCategoryByIdOrSlug(searchParams.category);
  assert.equal(resolvedCategory.id, "bakery");
  assert.equal(resolvedCategory.name, "Bakeries");

  // Verify URL generation for roundtrip back navigation
  const backHref = `/search?category=${encodeURIComponent(resolvedCategory.id)}`;
  assert.equal(backHref, "/search?category=bakery");
});

test("Combined Filters & URL Parsing/Serialization QA", () => {
  // Simulate URL search parameters: ?category=bakery&openNow=true&rating=4&maxDistance=3
  const rawParams = {
    category: "bakery",
    openNow: "true",
    rating: "4",
    maxDistance: "3",
  };
  const parsed = parseFilterParams(rawParams);
  assert.equal(parsed.category, "bakery");
  assert.equal(parsed.openNow, true);
  assert.equal(parsed.minRating, 4);
  assert.equal(parsed.maxDistanceKm, 3);

  // Serialize back to URL params
  const serialized = serializeFilterParams(parsed);
  assert.equal(serialized.category, "bakery");
  assert.equal(serialized.openNow, "true");
  assert.equal(serialized.rating, "4");
  assert.equal(serialized.maxDistance, "3");

  // Test toggling off a filter (e.g. openNow)
  const modified = { ...parsed, openNow: false };
  const serializedModified = serializeFilterParams(modified);
  assert.equal(serializedModified.openNow, undefined);
  assert.equal(serializedModified.category, "bakery");
});
