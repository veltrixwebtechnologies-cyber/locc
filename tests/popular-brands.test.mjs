import test from "node:test";
import assert from "node:assert/strict";
import { POPULAR_BRANDS, getNearestStoreForBrand, getBrandStoreById, toRoadDistanceKm } from "../src/lib/brand-stores-registry.ts";

test("POPULAR_BRANDS contains all 13 popular brands", () => {
  assert.equal(POPULAR_BRANDS.length, 13);
  const ids = POPULAR_BRANDS.map((b) => b.id);
  assert.ok(ids.includes("peter-england"));
  assert.ok(ids.includes("raymond"));
  assert.ok(ids.includes("max"));
  assert.ok(ids.includes("trends"));
  assert.ok(ids.includes("allen-solly"));
  assert.ok(ids.includes("louis-philippe"));
  assert.ok(ids.includes("indian-terrain"));
  assert.ok(ids.includes("jockey"));
  assert.ok(ids.includes("bata"));
  assert.ok(ids.includes("woodland"));
  assert.ok(ids.includes("kalyan-jewellers"));
  assert.ok(ids.includes("jos-alukkas"));
  assert.ok(ids.includes("joyalukkas"));
});

test("getNearestStoreForBrand resolves closest store in Coimbatore for Coimbatore coordinates", () => {
  // Gandhipuram, Coimbatore coords: (11.0168, 76.9558)
  const peNearest = getNearestStoreForBrand("peter-england", 11.0168, 76.9558);
  assert.ok(peNearest.store.city === "Coimbatore");
  assert.ok(peNearest.distanceKm < 5);
  assert.ok(peNearest.href.startsWith("/store/imported%3Aa1000001-0001-4000-8000-000000000001"));
  assert.ok(peNearest.href.includes("shopLat=11.018312"));
  assert.ok(peNearest.href.includes("shopLng=76.964721"));

  const itNearest = getNearestStoreForBrand("indian-terrain", 11.0168, 76.9558);
  assert.ok(itNearest.store.city === "Coimbatore");
  assert.ok(itNearest.distanceKm < 5);
  assert.ok(itNearest.href.startsWith("/store/imported%3A"));
});

test("getNearestStoreForBrand calculates realistic road distance from Kalapatti to Oppanakara Street", () => {
  // Kalapatti coords: (11.0827, 77.0345)
  const bataNearest = getNearestStoreForBrand("bata", 11.0827, 77.0345);
  assert.ok(bataNearest.store.name.includes("Oppanakara"));
  // Aerial distance is ~12.6 km; realistic road driving distance matches Google Maps ~17.5 km (+/- 0.5km)
  assert.ok(bataNearest.aerialDistanceKm >= 12 && bataNearest.aerialDistanceKm <= 13);
  assert.ok(bataNearest.distanceKm >= 17 && bataNearest.distanceKm <= 18);
});

test("getNearestStoreForBrand resolves closest store in Bangalore for Bangalore coordinates", () => {
  // Indiranagar, Bangalore coords: (12.9716, 77.6412)
  const peNearest = getNearestStoreForBrand("peter-england", 12.9716, 77.6412);
  assert.ok(peNearest.store.city === "Bengaluru");
  assert.ok(peNearest.distanceKm < 15);
  assert.ok(peNearest.href.includes("a1000001-0001-4000-8000-000000000002"));

  const raymondNearest = getNearestStoreForBrand("raymond", 12.9716, 77.6412);
  assert.ok(raymondNearest.store.city === "Bengaluru");
  assert.ok(raymondNearest.distanceKm < 15);
});

test("getBrandStoreById returns matching ImportedShopRow for store fallback", () => {
  const store = getBrandStoreById("a1000001-0001-4000-8000-000000000001");
  assert.ok(store !== null);
  assert.equal(store.business_name, "Peter England - Cross Cut Road, Coimbatore");
  assert.equal(store.city, "Coimbatore");
  assert.equal(store.claim_status, "unclaimed");
});
