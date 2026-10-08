import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { sourceLoader } from "./load-source.mjs";

const load = sourceLoader(process.cwd());
const { importedStorefront, importedCatalogProducts } = await load(
  "src/modules/shopper/services/imported-storefront.ts",
);
const { cartStore, sanitizeCart } = await load("src/modules/shopper/services/cart-store.ts");
const { buildDemoReceipt } = await load("src/modules/shopper/services/demo-payment.ts");
test("public shop identity, coordinates and category survive the shared shopping flow", () => {
  const shop = {
    id: "shop-a",
    business_name: "Bakery A",
    category: "Bakery",
    latitude: 11.02,
    longitude: 76.98,
    rating: 4.3,
    review_count: 37,
    formatted_address: "Coimbatore",
  };
  const catalog = importedStorefront(shop);
  assert.equal(catalog.store.name, shop.business_name);
  assert.equal(catalog.store.lat, 11.02);
  assert.equal(catalog.store.lng, 76.98);
  assert.equal(catalog.reviewCount, 37);
  assert.equal(catalog.products.length, 10);
  const product = catalog.products[0];
  assert.equal(product.name, "Birthday Cake");
  cartStore.clear();
  cartStore.add(catalog.store.id, catalog.store.name, product);
  cartStore.setQty(product.id, 2);
  const cart = sanitizeCart(cartStore.getSnapshot());
  assert.equal(cart.storeName, shop.business_name);
  assert.equal(cart.lines[0].imageUrl, product.imageUrl);
  assert.equal(cart.lines[0].category, product.category);
  assert.equal(cart.lines[0].qty, 2);
  const input = {
    storeId: cart.storeId,
    storeName: cart.storeName,
    lines: cart.lines,
    subtotal: product.price * 2,
    deliveryFee: 0,
    total: product.price * 2,
    address: "Entrance",
    destination: { lat: 11.02, lng: 76.98 },
  };
  const verified = catalog.products.map((p) => ({
    id: p.id,
    seller_id: p.storeId,
    name: p.name,
    selling_price: p.price,
    stock: p.stock,
  }));
  const receipt = buildDemoReceipt(input, verified, "receipt");
  assert.equal(receipt.isDemoPayment, true);
  assert.equal(receipt.storeName, "Bakery A");
  assert.equal(receipt.etaMin, 0);
  const other = importedCatalogProducts("imported:shop-b", "Bakery B", "Bakery");
  assert.notEqual(other[0].id, product.id);
  assert.throws(() =>
    buildDemoReceipt(
      input,
      other.map((p) => ({
        id: p.id,
        seller_id: p.storeId,
        name: p.name,
        selling_price: p.price,
        stock: p.stock,
      })),
      "receipt",
    ),
  );
  cartStore.clear();
});
test("map shop opens the existing storefront and sample carts cannot enter live payment", () => {
  const store = fs.readFileSync("src/routes/store.$storeId.tsx", "utf8");
  assert.match(store, /StorePage catalog=\{importedStorefront\(shop.data\)\}/);
  assert.doesNotMatch(store, /import \{ ImportedShopPage \}/);
  const checkout = fs.readFileSync("src/routes/checkout.tsx", "utf8");
  assert.match(checkout, /filter\(p => !isImportedCart \|\| p.id === "demo"\)/);
  assert.match(checkout, /isImportedCart \|\| pay === "demo" \? ordersStore.placeDemo/);
  assert.match(checkout, /isImportedCart \? await createImportedTestOrder/);
  assert.match(checkout, /!isImportedCart && \(pay === "cod" \|\| pay === "demo"\)/);
  const orders = fs.readFileSync("src/modules/shopper/services/orders-store.ts", "utf8");
  assert.match(orders, /if \(order.storeId.startsWith\("imported:"\)\)\s+throw new Error/);
});
