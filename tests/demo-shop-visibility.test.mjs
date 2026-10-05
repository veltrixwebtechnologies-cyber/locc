import test from "node:test";
import assert from "node:assert/strict";
import { sourceLoader } from "./load-source.mjs";

const { isTestEntity } = await sourceLoader(process.cwd(), {
  "./providers": "export const calculateHaversineDistanceKm = () => 0;",
})("src/lib/map-service/store-engine.ts");

test("generated LocalShore demo shops are excluded from customer discovery", () => {
  assert.equal(isTestEntity("LocalShore Demo CBE-05 Cafes & Tea Market 01"), true);
  assert.equal(isTestEntity("LocalShore Demo CBE-05 Kirana & Grocery Market 02"), true);
  assert.equal(isTestEntity("LocalShore BLR-03 Demo Fashion Store"), true);
});

test("real shop names remain eligible for customer discovery", () => {
  assert.equal(isTestEntity("Raja Stores"), false);
  assert.equal(isTestEntity("Sri Lakshmi Café"), false);
});
