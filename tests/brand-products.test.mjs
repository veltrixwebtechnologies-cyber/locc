import test from "node:test";
import assert from "node:assert/strict";
import { sourceLoader } from "./load-source.mjs";

const load = sourceLoader(process.cwd());

const {
  BRAND_PRODUCTS_CATALOG,
  BRAND_PRODUCTS_BY_BRAND,
  getBrandProducts,
  getBrandProductBySlug,
  getBrandCatalogProducts,
} = await load("src/lib/brand-products-catalog.ts");

const {
  POPULAR_BRANDS,
  BRAND_STORES_CATALOG,
  getBrandStoreById,
} = await load("src/lib/brand-stores-registry.ts");

const {
  importedStorefront,
} = await load("src/modules/shopper/services/imported-storefront.ts");

const {
  parseImportedProductId,
  importedProductDetails,
} = await load("src/modules/shopper/services/imported-product-details.ts");

test("All 13 brands have at least 10 genuine distinct products in catalog", () => {
  const brandIds = POPULAR_BRANDS.map((b) => b.id);
  assert.equal(brandIds.length, 13, "Must have exactly 13 popular brands");

  for (const brandId of brandIds) {
    const prods = BRAND_PRODUCTS_BY_BRAND[brandId];
    assert.ok(
      prods && prods.length >= 10,
      `Brand '${brandId}' must have at least 10 products, but found ${prods?.length || 0}`,
    );

    // Verify all slugs are unique within brand
    const slugs = new Set(prods.map((p) => p.slug));
    assert.equal(slugs.size, prods.length, `Brand '${brandId}' has duplicate slugs`);
  }
});

test("Total distinct brand products across all 13 shops meets target (>= 130)", () => {
  assert.ok(
    BRAND_PRODUCTS_CATALOG.length >= 130,
    `Expected at least 130 products, but found ${BRAND_PRODUCTS_CATALOG.length}`,
  );
  // Verify all slugs globally unique
  const globalSlugs = new Set(BRAND_PRODUCTS_CATALOG.map((p) => p.slug));
  assert.equal(
    globalSlugs.size,
    BRAND_PRODUCTS_CATALOG.length,
    "All product slugs in BRAND_PRODUCTS_CATALOG must be globally unique",
  );
});

test("Every product has complete, authentic, and verified attributes", () => {
  for (const product of BRAND_PRODUCTS_CATALOG) {
    assert.ok(product.slug && product.slug.length > 2, `Product missing slug: ${product.name}`);
    assert.ok(product.name && product.name.length > 5, `Product missing name: ${product.slug}`);
    assert.ok(product.brandId, `Product missing brandId: ${product.slug}`);
    assert.ok(product.brandName, `Product missing brandName: ${product.slug}`);
    assert.ok(product.category, `Product missing category: ${product.slug}`);
    assert.ok(product.subcategory, `Product missing subcategory: ${product.slug}`);
    assert.ok(Number.isFinite(product.price) && product.price > 0, `Invalid price for ${product.slug}: ${product.price}`);
    assert.ok(Number.isFinite(product.mrp) && product.mrp >= product.price, `Invalid MRP for ${product.slug}: MRP ${product.mrp} < Price ${product.price}`);
    assert.ok(product.unit && product.unit.length > 1, `Product missing unit: ${product.slug}`);
    assert.ok(product.imageUrl && product.imageUrl.startsWith("https://"), `Invalid image URL for ${product.slug}: ${product.imageUrl}`);
    assert.ok(Number.isSafeInteger(product.stock) && product.stock > 0, `Invalid stock for ${product.slug}: ${product.stock}`);
    assert.ok(product.sku && product.sku.length > 3, `Product missing SKU: ${product.slug}`);
    assert.ok(product.description && product.description.length > 30, `Product description too short for ${product.slug}`);
    assert.ok(Array.isArray(product.variants) && product.variants.length > 0, `Product missing variants: ${product.slug}`);
    assert.ok(product.specifications && Object.keys(product.specifications).length >= 2, `Product missing specifications: ${product.slug}`);
    assert.ok(Array.isArray(product.checks) && product.checks.length >= 3, `Product missing checks: ${product.slug}`);
  }
});

test("getBrandCatalogProducts returns authentic products for all 13 brand shops", () => {
  const brandIds = POPULAR_BRANDS.map((b) => b.id);

  for (const brandId of brandIds) {
    // Find a registered store for this brand
    const store = BRAND_STORES_CATALOG.find((s) => s.brandId === brandId);
    assert.ok(store, `Missing registered store for brand '${brandId}'`);

    const products = getBrandCatalogProducts(
      `imported:${store.id}`,
      store.name,
      store.category,
    );

    assert.ok(
      products.length >= 10,
      `Store '${store.name}' returned ${products.length} products; expected >= 10`,
    );

    // Verify product fields
    for (const p of products) {
      assert.ok(p.id.startsWith(`sample:imported:${store.id}:`), `Product ID formatted incorrectly: ${p.id}`);
      assert.equal(p.storeId, `imported:${store.id}`);
      assert.ok(p.name.length > 0);
      assert.ok(p.price > 0);
      assert.ok(p.imageUrl && p.imageUrl.startsWith("https://"));
      assert.ok(p.unit.length > 0);
      assert.ok(p.stock && p.stock > 0);

      // Verify parseImportedProductId can parse it
      const parsed = parseImportedProductId(p.id);
      assert.ok(parsed, `parseImportedProductId failed on ${p.id}`);
      assert.equal(parsed.shopId, `imported:${store.id}`);

      // Verify details lookup works
      const details = importedProductDetails(p.name, p.category, parsed.slug);
      assert.ok(details.description.length > 30, `Missing description for ${p.name}`);
      assert.ok(details.checks.length >= 3, `Missing checks for ${p.name}`);
      assert.ok(details.mrp && details.mrp >= p.price, `Missing or invalid MRP for ${p.name}`);
    }
  }
});

test("Brand products integrate seamlessly with imported storefront metadata", () => {
  const sampleStore = BRAND_STORES_CATALOG[0]; // Peter England Cross Cut Road
  const shopRow = getBrandStoreById(sampleStore.id);
  assert.ok(shopRow, "Store row should exist");

  const storefront = importedStorefront(shopRow);
  assert.equal(storefront.imported, true);
  assert.equal(storefront.store.name, sampleStore.name);
  assert.equal(storefront.store.id, `imported:${sampleStore.id}`);

  const products = getBrandCatalogProducts(storefront.store.id, storefront.store.name, storefront.store.category);
  assert.ok(products.length >= 10, "Storefront should contain at least 10 brand products");
  assert.equal(products[0].name, "Peter England Men White Slim Fit Formal Cotton Shirt");
  assert.equal(products[0].price, 1499);
});
