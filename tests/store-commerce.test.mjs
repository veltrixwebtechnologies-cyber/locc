import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sourceLoader } from "./load-source.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const load = sourceLoader(root);
const { checkStoreDeliveryEligibility, getStoreCommerceStatus, resolveOperatingHours,
  resolvePickupLocation, resolveProductStore, resolveSingleStoreFulfillment,
  resolveStoreCoordinates } = await load("src/lib/store-commerce.ts");

const seller = { id: "seller-a", status: "approved", accepts_orders: true, lat: 11, lng: 76 };
const store = { id: "store-a", seller_id: "seller-a", is_default: true,
  status: "active", accepts_orders: true, latitude: 12, longitude: 77, service_radius_km: 4 };

test("product Store resolution prefers explicit owned Store and refuses bad ownership", () => {
  assert.equal(resolveProductStore({ productSellerId: "seller-a", productStoreId: "store-a", stores: [store] }), store);
  assert.equal(resolveProductStore({ productSellerId: "seller-a", productStoreId: "other", stores: [store] }), null);
  assert.equal(resolveProductStore({ productSellerId: "seller-a", stores: [store] }), store);
  assert.equal(resolveProductStore({ productSellerId: "seller-a", stores: [store, { ...store, id: "store-b", is_default: true }] }), null);
});

test("Store coordinates win, with safe Seller fallback only when needed", () => {
  assert.deepEqual(resolveStoreCoordinates(store, seller), { lat: 12, lng: 77, source: "store" });
  assert.deepEqual(resolveStoreCoordinates({ ...store, latitude: null, longitude: null }, seller), { lat: 11, lng: 76, source: "seller-legacy" });
  assert.equal(resolveStoreCoordinates({ ...store, latitude: null, longitude: null }, { ...seller, lat: 0, lng: 0 }), null);
});

test("operating hours prefer Store snapshot and otherwise use legacy Seller hours", () => {
  assert.equal(resolveOperatingHours({ ...store, operating_hours: [{ day: 1 }] }, seller).source, "store");
  assert.equal(resolveOperatingHours(store, { ...seller, shop_hours: [{ day: 2 }] }).source, "seller-legacy");
  assert.equal(resolveOperatingHours(store, seller).source, "unconfigured");
});

test("availability distinguishes browse from ordering and respects closed status", () => {
  assert.deepEqual(getStoreCommerceStatus({ store, seller, isOpen: false }), { canBrowse: true, canOrder: false, reason: "STORE_CLOSED" });
  assert.equal(getStoreCommerceStatus({ store: { ...store, status: "suspended" }, seller }).canBrowse, false);
  assert.equal(getStoreCommerceStatus({ store, seller }).canOrder, true);
});

test("assigned Store zones are restrictive; otherwise configured Store radius applies", () => {
  assert.equal(checkStoreDeliveryEligibility({ store, seller, customer: { lat: 12.01, lng: 77.01 } }).eligible, true);
  assert.equal(checkStoreDeliveryEligibility({ store, seller, customer: { lat: 13, lng: 78 } }).reason, "OUTSIDE_DELIVERY_RADIUS");
  const zone = { is_active: true, latitude: 12, longitude: 77, radius_km: 2 };
  assert.equal(checkStoreDeliveryEligibility({ store, seller, customer: { lat: 12.01, lng: 77.01 }, zones: [zone] }).eligible, true);
  assert.equal(checkStoreDeliveryEligibility({ store, seller, customer: { lat: 12.1, lng: 77.1 }, zones: [zone] }).reason, "OUTSIDE_SERVICE_ZONE");
  assert.equal(checkStoreDeliveryEligibility({ store, seller, customer: null }).reason, "CUSTOMER_LOCATION_UNAVAILABLE");
});

test("single fulfillment grouping rejects mixed seller or physical Store", () => {
  assert.deepEqual(resolveSingleStoreFulfillment([{ sellerId: "a", storeId: "x" }, { sellerId: "a", storeId: "x" }]), { sellerId: "a", storeId: "x" });
  assert.equal(resolveSingleStoreFulfillment([{ sellerId: "a", storeId: "x" }, { sellerId: "a", storeId: "y" }]), null);
  assert.equal(resolveSingleStoreFulfillment([{ sellerId: "a", storeId: "x" }, { sellerId: "b", storeId: "x" }]), null);
});

test("pickup location prefers Store and rejects cross-seller Store references", () => {
  assert.equal(resolvePickupLocation({ store: { ...store, address: "Store address", name: "Shop" }, seller, expectedSellerId: "seller-a" }).name, "Shop");
  assert.equal(resolvePickupLocation({ store: { ...store, seller_id: "seller-b" }, seller, expectedSellerId: "seller-a" }), null);
  assert.equal(resolvePickupLocation({ seller: { ...seller, address: "Legacy" }, expectedSellerId: "seller-a" }).source, "seller-legacy");
});
