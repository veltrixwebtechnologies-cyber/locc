import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { sourceLoader } from "./load-source.mjs";
const load = sourceLoader(process.cwd());
const { parseImportedProductId, importedProductDetails } = await load(
  "src/modules/shopper/services/imported-product-details.ts",
);
test("sample product identity retains its actual imported shop", () => {
  const id = "sample:imported:19e26d4a-1955-4e7c-a53b-2afb93232f57:birthday-cake";
  assert.deepEqual(parseImportedProductId(id), {
    shopId: "imported:19e26d4a-1955-4e7c-a53b-2afb93232f57",
    slug: "birthday-cake",
  });
  assert.equal(parseImportedProductId("sample:other:birthday-cake"), null);
  assert.equal(parseImportedProductId("sample:imported:not-a-uuid:cake"), null);
});
test("descriptions distinguish product types without invented shop specifications", () => {
  const cake = importedProductDetails("Birthday Cake", "bakery");
  const table = importedProductDetails("Dining Table", "furniture");
  assert.match(cake.description, /celebration cake/i);
  assert.ok(cake.checks.includes("Ingredients and allergens"));
  assert.match(table.description, /seating capacity/i);
  assert.ok(table.checks.includes("Dimensions and available sizes"));
  assert.notEqual(cake.description, table.description);
});
test("store product clicks open details rather than shop search", () => {
  const store = fs.readFileSync("src/routes/store.$storeId.tsx", "utf8");
  assert.doesNotMatch(store, /sq: p\.name/);
  assert.match(store, /aria-label=\{`View details for \$\{p\.name\}`\}/);
  const detail = fs.readFileSync(
    "src/modules/shopper/components/imported-product-detail.tsx",
    "utf8",
  );
  assert.match(detail, /About this product/);
  assert.match(detail, /cartStore\.add\(catalog\.store\.id, catalog\.store\.name, product\)/);
  assert.match(detail, /Not provided by this business yet/);
});
