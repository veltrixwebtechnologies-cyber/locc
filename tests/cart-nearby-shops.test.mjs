import test from "node:test";
import assert from "node:assert/strict";
import { sourceLoader } from "./load-source.mjs";
const load = sourceLoader(process.cwd());
const { nearbyCartShops } = await load("src/modules/shopper/services/cart-nearby-shops.ts");
const { importedCatalogProducts } = await load(
  "src/modules/shopper/services/imported-storefront.ts",
);
const line = {
  productId: "table",
  storeId: "current",
  name: "Dining Table",
  category: "furniture",
  unit: "1 unit",
  price: 100,
  qty: 1,
};
const product = {
  id: "chair",
  seller_id: "near",
  shop_name: "Nearby Furniture",
  name: "Dining Chairs",
  category: "furniture",
  stock: 5,
  selling_price: 200,
  distance_km: 2,
};
const listing = {
  id: "public",
  business_name: "Furniture Listing",
  category: "Furniture",
  latitude: 11,
  longitude: 77,
  distance_km: 6,
};
test("nearby suggestions respect category, stock, identities and the separate 5/7 km radii", () => {
  const result = nearbyCartShops(
    [line],
    "current",
    [
      product,
      product,
      { ...product, id: "same", seller_id: "current" },
      { ...product, id: "far", seller_id: "far", distance_km: 5.1 },
      { ...product, id: "empty", seller_id: "empty", stock: 0 },
      { ...product, id: "other", seller_id: "other", category: "Bakery" },
    ],
    [
      listing,
      { ...listing, id: "far-public", distance_km: 7.1 },
      { ...listing, id: "invalid", latitude: null },
    ],
  );
  assert.deepEqual(
    result.map((shop) => shop.id),
    ["near", "imported:public"],
  );
  assert.equal(result[0].products.length, 1);
  assert.equal(result[1].products.length, 0);
  assert.equal(result[1].imported, true);
  assert.match(result[1].href, /shopLat=11&shopLng=77/);
});
test("catalog product images no longer collapse to a category-wide photo", () => {
  for (const category of ["Furniture", "Fashion & Apparel", "Bakery"]) {
    const products = importedCatalogProducts("imported:photos", "Shop", category);
    assert.equal(new Set(products.map((product) => product.imageUrl)).size, products.length);
  }
});
