import test from "node:test";
import assert from "node:assert/strict";
import { sourceLoader } from "./load-source.mjs";
const load = sourceLoader(process.cwd());
const { deliveryLocationSignature: signature, isConfirmedDeliveryLocation: confirmed } = await load(
  "src/lib/delivery-location.ts",
);
const routing = await load("src/lib/map-service/delivery-routing.ts");
test("checkout confirmation belongs to the exact address and pin, never the default map centre", () => {
  const pin = { lat: 11, lng: 76 },
    token = signature("House A", pin);
  assert.equal(confirmed("House A", pin, true, token), true);
  assert.equal(confirmed("House B", pin, true, token), false);
  assert.equal(confirmed("House A", { lat: 12, lng: 76 }, true, token), false);
  assert.equal(confirmed("House A", pin, false, token), false);
  assert.equal(confirmed("House A", { lat: NaN, lng: 76 }, true, ""), false);
  assert.equal(confirmed("", pin, true, ""), false);
});
test("customer tracking never substitutes a direct line when road routing fails", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("offline");
  };
  try {
    await assert.rejects(
      routing.fetchDeliveryRoute({ lat: 11, lng: 76 }, { lat: 12, lng: 77 }, "to_customer", 0),
      /offline/,
    );
  } finally {
    globalThis.fetch = original;
  }
});
test("customer map uses segment distance, not distance to vertices", () => {
  assert.ok(
    routing.distanceToPolylineMeters({ lat: 11, lng: 76.005 }, [
      [76, 11],
      [76.01, 11],
    ]) < 0.01,
  );
});
