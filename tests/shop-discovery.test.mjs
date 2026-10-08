import test from "node:test";
import assert from "node:assert/strict";
import { sourceLoader } from "./load-source.mjs";

const { discoverShops } = await sourceLoader(process.cwd())("src/modules/shopper/services/shop-discovery.ts");
const input = { lat: 11.0183, lng: 76.9725, category: "grocery", query: null, radiusKm: 7 };
const row = (id, distance, category = "grocery", fallback = false) => ({
  id, shop_name: id, business_type: category, category,
  distance_km: distance, lat: 11.01727, lng: 76.965581, is_fallback: fallback,
});

test("distances reject missing measurements and invalid shop/customer pins", async () => {
  const result = await discoverShops(async () => ({ data: [
    row("missing", null), row("empty", ""), row("negative", -1), row("nan", NaN),
    { ...row("bad-pin", 1), lat: 100 }, row("zero", 0), row("precise", 0.849123),
  ], error: null }), input);
  assert.deepEqual(result.shops.map(s => s.id), ["zero", "precise"]);
  assert.equal(result.shops[1].distance_km, 0.849123);
  await assert.rejects(discoverShops(async () => { throw new Error("Must not query"); },
    { ...input, lat: NaN }), /valid delivery location/);
});

test("changed customer coordinates are forwarded without rounding or defaults", async () => {
  const calls = [];
  const rpc = async (_, args) => { calls.push(args); return {data: [], error: null}; };
  await discoverShops(rpc, { ...input, lat: 12.93023, lng: 77.585 });
  await discoverShops(rpc, { ...input, lat: 12.95959, lng: 77.74741 });
  assert.equal(calls[0].p_lat, 12.93023);
  assert.equal(calls[0].p_lng, 77.585);
  assert.equal(calls[1].p_lat, 12.95959);
  assert.equal(calls[1].p_lng, 77.74741);
});

test("missing discovery migration preserves existing nearby shops and reports five km coverage", async () => {
  const calls = [];
  const result = await discoverShops(async (name, args) => {
    calls.push({ name, args });
    return name === "discover_nearby_shops"
      ? { data: null, error: { code: "PGRST202", message: "Missing function" } }
      : { data: [row("far", 5.001), row("wrong-category", 1, "footwear"), row("near", 0.3), row("edge", 5)], error: null };
  }, input);
  assert.deepEqual(result.shops.map(s => s.id), ["near", "edge"]);
  assert.equal(result.effectiveRadiusKm, 5);
  assert.equal(result.legacyMode, true);
  assert.deepEqual(calls.map(c => c.name), ["discover_nearby_shops", "get_customer_visible_shops"]);
  assert.equal(calls[1].args.p_category_slug, "grocery");
  assert.equal(calls[1].args.p_lat, input.lat);
  assert.equal("p_radius_km" in calls[1].args, false);
});

test("installed RPC preserves explicit zone fallback without calling the legacy endpoint", async () => {
  let calls = 0;
  const result = await discoverShops(async () => {
    calls++;
    return { data: [row("zone", 9, "grocery", true), row("near", 2), row("unmarked", 8)], error: null };
  }, input);
  assert.equal(calls, 1);
  assert.deepEqual(result.shops.map(s => s.id), ["near", "zone"]);
  assert.equal(result.effectiveRadiusKm, 7);
  assert.equal(result.legacyMode, false);
});

test("selected shop category keeps only matching primary business categories", async () => {
  const result = await discoverShops(async () => ({ data: [
    { ...row("cafe-primary", 0.4, "grocery"), business_type: "Cafés & Tea Shops", category: "grocery" },
    { ...row("grocery-primary", 0.5, "cafes"), business_type: "grocery", category: "cafes" },
    { ...row("coffee-primary", 0.8, "restaurants"), business_type: "coffee shop", category: "restaurants" },
  ], error: null }), { ...input, category: "cafes" });

  assert.deepEqual(result.shops.map((shop) => shop.id), ["cafe-primary", "coffee-primary"]);
});

test("empty results do not trigger fallback; real errors remain errors", async () => {
  let calls = 0;
  const empty = await discoverShops(async () => { calls++; return { data: [], error: null }; }, input);
  assert.deepEqual(empty.shops, []);
  assert.equal(calls, 1);
  await assert.rejects(discoverShops(async () => ({ data: null, error: { code: "42501", message: "Permission denied" } }), input), /Permission denied/);
  await assert.rejects(discoverShops(async () => { throw new Error("Offline"); }, input), /Offline/);
  await assert.rejects(discoverShops(async () => ({ data: null, error: { code: "PGRST202", message: "Missing both functions" } }), input), /Missing both/);
});
