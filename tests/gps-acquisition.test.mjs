import test from "node:test";
import assert from "node:assert/strict";
import { sourceLoader } from "./load-source.mjs";

globalThis.window = undefined;
globalThis.locationToasts = [];

const load = sourceLoader(process.cwd(), {
  sonner:
    "export const toast = { success(...args) { globalThis.locationToasts.push(['success', ...args]); }, error(...args) { globalThis.locationToasts.push(['error', ...args]); } };",
});
const { acquireCurrentPosition, LocationAcquisitionError } = await load(
  "src/lib/acquire-location.ts",
);
const store = await load("src/lib/location-store.ts");
const position = (accuracy = 5, timestamp = Date.now()) => ({
  timestamp,
  coords: { latitude: 9.9816, longitude: 76.2999, accuracy },
});

function replaceGlobal(t, key, value) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  });
}

function setup(t) {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: Date.now() });
  let success, failure;
  const cleared = [];
  const requests = [];
  replaceGlobal(t, "window", { isSecureContext: true, dispatchEvent() {} });
  replaceGlobal(t, "navigator", {
    geolocation: {
      watchPosition(onSuccess, onError, options) {
        success = onSuccess;
        failure = onError;
        requests.push(options);
        return requests.length;
      },
      clearWatch(id) {
        cleared.push(id);
      },
    },
  });
  replaceGlobal(t, "locationToasts", []);
  t.mock.method(globalThis, "fetch", () => new Promise(() => {}));
  store.clearActiveDeliveryLocation();
  t.after(() => store.cancelCurrentGPSLocation());
  return { emit: (p) => success(p), error: (e) => failure(e), cleared, requests };
}

test("first approximate fix can improve without silently failing the location request", async (t) => {
  const env = setup(t),
    progress = [];
  const pending = acquireCurrentPosition({ onProgress: (message) => progress.push(message) });
  env.emit(position(2500));
  assert.match(progress[0], /2.5 km/);
  assert.deepEqual(env.cleared, []);
  env.emit(position(12));
  t.mock.timers.tick(3000);
  assert.equal((await pending).coords.accuracy, 12);
  assert.deepEqual(env.cleared, [1]);
  assert.deepEqual(env.requests[0], { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
});

test("approximate-only results are rejected without changing the selected location", async (t) => {
  const env = setup(t);
  const pending = store.detectCurrentGPSLocation();
  const checked = assert.rejects(pending, (error) => {
    assert.ok(error instanceof LocationAcquisitionError);
    assert.match(error.message, /approximate.*2.5 km/);
    assert.equal(store.getActiveDeliveryLocation(), null);
    assert.equal(typeof store.confirmApproximateGPSLocation, "undefined");
    assert.match(error.message, /required 25 m accuracy/);
    return true;
  });
  env.emit(position(2500));
  t.mock.timers.tick(20000);
  await checked;
  assert.equal(globalThis.locationToasts[0][0], "error");
});

test("deadline stops a browser that never calls back, including an unanswered permission prompt", async (t) => {
  const env = setup(t);
  const pending = acquireCurrentPosition();
  const checked = assert.rejects(pending, /permission prompt/);
  t.mock.timers.tick(20000);
  await checked;
  assert.deepEqual(env.cleared, [1]);
});

test("denied permission reports the real cause immediately without another request", async (t) => {
  const env = setup(t);
  const pending = store.detectCurrentGPSLocation();
  const checked = assert.rejects(pending, /Location access is blocked/);
  env.error({ code: 1 });
  await checked;
  assert.equal(store.getGPSStatus().status, "denied");
  assert.match(store.getGPSStatus().errorMessage, /Allow location/);
  assert.equal(globalThis.locationToasts[0][0], "error");
  assert.equal(env.requests.length, 1);
});

test("coordinates update without waiting for a stalled reverse-geocoding service", async (t) => {
  const env = setup(t);
  let signal;
  t.mock.method(globalThis, "fetch", (_url, options) => {
    signal = options.signal;
    return new Promise(() => {});
  });
  const pending = store.detectCurrentGPSLocation();
  env.emit(position());
  t.mock.timers.tick(3000);
  const location = await pending;
  assert.equal(location.lat, 9.9816);
  assert.equal(store.getGPSStatus().status, "ok");
  assert.equal(store.getActiveDeliveryLocation().lng, 76.2999);
  assert.doesNotMatch(location.label, /Coimbatore|Tamil Nadu/);
  t.mock.timers.tick(4000);
  assert.equal(signal.aborted, true);
});

test("manual area selection cancels acquisition and ignores late GPS callbacks", async (t) => {
  const env = setup(t);
  const pending = store.detectCurrentGPSLocation();
  const checked = assert.rejects(pending, { name: "AbortError" });
  store.setActiveDeliveryLocation(store.PRESET_LOCATIONS[0]);
  await checked;
  env.emit(position());
  assert.equal(store.getActiveDeliveryLocation().id, "kovilmedu");
  assert.equal(store.getGPSStatus().status, "idle");
  assert.equal(globalThis.locationToasts.length, 0);
});

test("late address lookup cannot overwrite a newer manually selected area", async (t) => {
  const env = setup(t);
  let finish;
  t.mock.method(
    globalThis,
    "fetch",
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const pending = store.detectCurrentGPSLocation();
  env.emit(position());
  t.mock.timers.tick(3000);
  await pending;
  store.setActiveDeliveryLocation(store.PRESET_LOCATIONS[0]);
  finish({ ok: true, json: async () => ({ display_name: "Late area, Wrong city" }) });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(store.getActiveDeliveryLocation().id, "kovilmedu");
});

test("invalid/stale readings never become approximate candidates", async (t) => {
  const env = setup(t);
  const pending = acquireCurrentPosition();
  const checked = assert.rejects(pending, (error) => {
    assert.equal(error.approximatePosition, undefined);
    return true;
  });
  env.emit(position(5, Date.now() - 31000));
  env.emit(position(NaN));
  env.emit({ ...position(), coords: { latitude: 0, longitude: 0, accuracy: 5 } });
  t.mock.timers.tick(20000);
  await checked;
});

test("readings worse than 25 metres keep waiting until a sufficiently accurate fix arrives", async (t) => {
  const env = setup(t);
  const pending = store.detectCurrentGPSLocation();
  env.emit(position(50));
  await Promise.resolve();
  assert.equal(store.getActiveDeliveryLocation(), null);
  env.emit(position(25));
  t.mock.timers.tick(3000);
  assert.equal((await pending).accuracy, 25);
});

test("the global store cannot reselect coarse GPS through the public setter", (t) => {
  setup(t);
  assert.throws(
    () =>
      store.setActiveDeliveryLocation({ ...store.PRESET_LOCATIONS[0], isGPS: true, accuracy: 50 }),
    /precise/,
  );
  assert.equal(store.getActiveDeliveryLocation(), null);
});

test("cached GPS from the previous approximate policy is discarded on startup", async (t) => {
  setup(t);
  for (const [index, stored] of [
    { isGPS: true, accuracy: 2500, isApproximate: true },
    { isGPS: true, accuracy: 50 },
    { isGPS: true, accuracy: null },
  ].entries()) {
    replaceGlobal(t, "localStorage", {
      getItem(key) {
        return key === "localshore_location_confirmed"
          ? "1"
          : JSON.stringify({ ...store.PRESET_LOCATIONS[0], ...stored });
      },
    });
    const isolated = sourceLoader(process.cwd(), {
      sonner: "export const toast={success(){},error(){}};",
      react: `export const useState=()=>{}; export const useEffect=()=>{}; // startup case ${index}`,
    });
    const freshStore = await isolated("src/lib/location-store.ts");
    assert.equal(freshStore.getActiveDeliveryLocation(), null);
  }
});
