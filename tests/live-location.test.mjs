import test from "node:test";
import assert from "node:assert/strict";
import { sourceLoader } from "./load-source.mjs";

test("customer GPS waits for a fresh precise fix and preserves newer selections and retry state", async () => {
  const saved = Object.fromEntries(
    [
      "window",
      "navigator",
      "localStorage",
      "sessionStorage",
      "fetch",
      "CustomEvent",
      "setTimeout",
      "clearTimeout",
    ].map((k) => [k, Object.getOwnPropertyDescriptor(globalThis, k)]),
  );
  let success, failure;
  let watches = 0;
  const timers = new Map();
  let nextTimer = 0;
  const cleared = [];
  const storage = new Map();
  const install = (key, value) =>
    Object.defineProperty(globalThis, key, { configurable: true, value });
  install("setTimeout", (callback, delay) => {
    const id = ++nextTimer;
    timers.set(id, { callback, delay });
    return id;
  });
  install("clearTimeout", (id) => timers.delete(id));
  const expireGPS = () => {
    const timer = [...timers.values()].find((entry) => entry.delay === 15000);
    assert.ok(timer, "GPS has a bounded acquisition deadline");
    timer.callback();
  };
  install("window", { isSecureContext: true, dispatchEvent() {} });
  install("CustomEvent", class {});
  install("sessionStorage", { getItem: () => "1", setItem() {} });
  install("localStorage", {
    getItem: (k) => storage.get(k),
    setItem: (k, v) => storage.set(k, v),
    removeItem: (k) => storage.delete(k),
  });
  install("navigator", {
    geolocation: {
      watchPosition(ok, error, options) {
        watches++;
        assert.equal(options.enableHighAccuracy, true);
        assert.equal(options.maximumAge, 0);
        success = ok;
        failure = error;
        return 7;
      },
      clearWatch(id) {
        cleared.push(id);
      },
    },
  });
  install("fetch", async () => {
    throw new Error("Address provider offline");
  });
  const load = sourceLoader(process.cwd(), {
    "@/lib/geocoding.functions":
      "export async function reverseGeocode() { throw new Error('offline'); }",
    sonner: "export const toast = { success() {}, error() {} };",
  });
  try {
    const store = await load("src/lib/location-store.ts");
    const fix = (accuracy) => ({
      coords: { latitude: 12.97, longitude: 77.59, accuracy },
      timestamp: Date.now(),
    });
    const first = store.detectCurrentGPSLocation({ silent: true });
    const joined = store.detectCurrentGPSLocation();
    assert.equal(watches, 1, "automatic and manual requests share the same watcher");
    success({ ...fix(10), timestamp: Date.now() - 60000 });
    assert.equal(store.getGPSStatus().fix, null, "stale positions are ignored");
    success(fix(110));
    assert.equal(store.getGPSStatus().status, "detecting");
    assert.equal(store.getGPSStatus().fix.accuracy, 110);
    assert.equal(store.getActiveDeliveryLocation(), null);
    failure({ code: 3 });
    assert.equal(
      store.getGPSStatus().status,
      "detecting",
      "transient watch timeout allows recovery",
    );
    success(fix(8));
    const location = await first;
    assert.deepEqual(await joined, location);
    assert.equal(location.lat, 12.97);
    assert.equal(store.getGPSStatus().status, "ok");
    assert.ok(cleared.includes(7));

    const liveCallback = success;
    const latestTimestamp = location.capturedAt + 1;
    liveCallback({ ...fix(8), timestamp: latestTimestamp });
    assert.equal(store.getActiveDeliveryLocation().capturedAt, latestTimestamp);
    liveCallback({ ...fix(5), timestamp: location.capturedAt });
    assert.equal(store.getActiveDeliveryLocation().accuracy, 8, "older readings cannot replace a newer live fix");
    liveCallback({ ...fix(16000), timestamp: latestTimestamp + 1 });
    assert.equal(store.getActiveDeliveryLocation().accuracy, 8, "coarse live estimates cannot replace precise coordinates");

    const denied = store.detectCurrentGPSLocation();
    liveCallback({ ...fix(5), timestamp: latestTimestamp + 2 });
    assert.equal(store.getGPSStatus().status, "detecting", "callbacks from a stopped watch cannot interrupt a fresh acquisition");
    failure({ code: 1 });
    await assert.rejects(denied, /Allow location access/);
    assert.equal(store.getLocationState(), "LOCATION_SELECTED");
    assert.equal(store.getGPSStatus().status, "denied");

    store.clearActiveDeliveryLocation();
    const previewRequest = store.detectCurrentGPSLocation({ silent: true, commit: false });
    success(fix(8));
    const previewLocation = await previewRequest;
    assert.equal(previewLocation.lat, 12.97);
    assert.equal(store.getActiveDeliveryLocation(), null, "GPS preview is not saved before confirmation");

    const coarse = store.detectCurrentGPSLocation();
    success(fix(1500));
    success(fix(4000));
    assert.equal(store.getGPSStatus().fix.accuracy, 1500, "retain the best available fix");
    const coarseRejected = assert.rejects(coarse, /approximate area/);
    expireGPS();
    await coarseRejected;
    assert.equal(store.getGPSStatus().status, "imprecise");
    assert.equal(
      store.getActiveDeliveryLocation(),
      null,
      "coarse estimate is never saved as precise",
    );
    assert.equal(timers.size, 0);

    const noFix = store.detectCurrentGPSLocation();
    const noFixRejected = assert.rejects(noFix, /did not return a current location/);
    expireGPS();
    await noFixRejected;
    assert.equal(store.getGPSStatus().status, "timeout");

    const previousWatches = watches;
    store.initAutoGPSLocation();
    assert.equal(watches, previousWatches, "startup must not request location permission");
    store.initAutoGPSLocation();
    assert.equal(watches, previousWatches, "repeated startup does not request location permission");
    const autoRequest = store.detectCurrentGPSLocation();
    success(fix(8));
    await autoRequest;
    assert.equal(store.getGPSStatus().status, "ok");
    assert.equal(timers.size, 0);
    const pending = store.detectCurrentGPSLocation();
    const manual = {
      id: "manual",
      lat: 13,
      lng: 78,
      label: "Chosen entrance",
      area: "Area",
      city: "City",
    };
    store.setActiveDeliveryLocation(manual);
    assert.equal(store.getGPSStatus().fix, null, "a manual selection discards the previous GPS estimate");
    success(fix(8));
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
