import test from "node:test";
import assert from "node:assert/strict";
import { sourceLoader } from "./load-source.mjs";

test("customer GPS accepts a fresh live coarse fix and preserves newer selections and retry state", async () => {
  const saved = Object.fromEntries(["window", "navigator", "localStorage", "fetch", "CustomEvent"].map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)]));
  let success, failure;
  const cleared = [];
  const storage = new Map();
  const install = (key, value) => Object.defineProperty(globalThis, key, { configurable: true, value });
  install("window", { isSecureContext: true, dispatchEvent() {} });
  install("CustomEvent", class {});
  install("localStorage", { getItem: k => storage.get(k), setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k) });
  install("navigator", { geolocation: {
    watchPosition(ok, error) { success = ok; failure = error; return 7; },
    clearWatch(id) { cleared.push(id); },
  } });
  install("fetch", async () => { throw new Error("Address provider offline"); });
  const load = sourceLoader(process.cwd(), {
    "@/lib/geocoding.functions": "export async function reverseGeocode() { throw new Error('offline'); }",
    sonner: "export const toast = { success() {}, error() {} };",
  });
  try {
    const store = await load("src/lib/location-store.ts");
    const fix = accuracy => ({ coords: { latitude: 12.97, longitude: 77.59, accuracy }, timestamp: Date.now() });
    const first = store.detectCurrentGPSLocation({ silent: true });
    success(fix(1200));
    const location = await first;
    assert.equal(location.lat, 12.97);
    assert.equal(store.getGPSStatus().status, "ok");
    assert.ok(cleared.includes(7));

    const denied = store.detectCurrentGPSLocation();
    failure({ code: 1 });
    await assert.rejects(denied, /Allow location access/);
    assert.equal(store.getLocationState(), "LOCATION_SELECTED");
    assert.equal(store.getGPSStatus().status, "denied");

    const pending = store.detectCurrentGPSLocation();
    const manual = { id: "manual", lat: 13, lng: 78, label: "Chosen entrance", area: "Area", city: "City" };
    store.setActiveDeliveryLocation(manual);
    success(fix(20));
    await assert.rejects(pending, /selection changed/);
    assert.equal(store.getActiveDeliveryLocation().id, "manual");
    assert.equal(store.getLocationState(), "LOCATION_SELECTED");
  } finally {
    for (const [key, descriptor] of Object.entries(saved)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
