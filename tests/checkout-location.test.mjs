import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { sourceLoader } from "./load-source.mjs";
const load = sourceLoader(process.cwd());
const { usableGPS } = await load("src/lib/coordinates.ts");
const { assignmentLocation } = await load("src/lib/tracking-location.ts");
// Execute the actual checkout callbacks with state setters and network calls isolated.
function checkoutCallback(name, scope) {
  const source = ts.createSourceFile(
    "checkout.tsx",
    fs.readFileSync("src/routes/checkout.tsx", "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let expression;
  function walk(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === name)
      expression = node.initializer.getText(source);
    ts.forEachChild(node, walk);
  }
  walk(source);
  assert.ok(expression, name + " must exist");
  const js = ts.transpileModule("const callback = " + expression, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return new Function(...Object.keys(scope), js + "; return callback;")(...Object.values(scope));
}

test("current location selection and unpinned saved address never invent a destination", () => {
  const values = {};
  const choose = checkoutCallback("chooseAddr", {
    stopLiveLocation() {},
    setConfirmedLocation(v) {
      values.confirmed = v;
    },
    setAddr() {},
    setAccuracyMeters() {},
    CURRENT_LOCATION_ID: "current",
    setPinCoords(v) {
      values.pin = v;
    },
    setCurrentAddress() {},
    setManualAddress() {},
    savedAddresses: [{ id: "old", line: "House" }],
    parseCoordinates: (a, b) =>
      Number.isFinite(a) && Number.isFinite(b) ? { lat: a, lng: b } : null,
  });
  choose("current");
  assert.equal(values.pin, null);
  assert.equal(values.confirmed, "");
  choose("old");
  assert.equal(values.pin, null);
});

test("checkout rejects coarse GPS and late callbacks after manual selection", async () => {
  const values = {},
    pending = [];
  const scope = {
    usableGPS,
    acquisitionRevision: { current: 1 },
    geocodeRevision: { current: 0 },
    lastFixAt: { current: 0 },
    lastGeocodeAt: { current: 0 },
    CURRENT_LOCATION_ID: "current",
    reverseGeocodeFn: () => new Promise((resolve) => pending.push(resolve)),
  };
  for (const name of [
    "PinCoords",
    "ConfirmedLocation",
    "AccuracyMeters",
    "Addr",
    "LocStatus",
    "LocError",
    "CurrentAddress",
    "ManualAddress",
  ])
    scope["set" + name] = (v) => {
      values[name] = v;
    };
  const apply = checkoutCallback("applyPosition", scope);
  const position = {
    timestamp: Date.now(),
    coords: { latitude: 11, longitude: 76, accuracy: 5000 },
  };
  apply(position, 1);
  assert.equal(values.PinCoords, undefined);
  assert.match(values.LocError, /approximate/);
  position.coords.accuracy = 5;
  apply(position, 1);
  assert.deepEqual(values.PinCoords, { lat: 11, lng: 76 });
  scope.acquisitionRevision.current++;
  scope.geocodeRevision.current++;
  values.ManualAddress = "Manually selected house";
  pending[0]({ address: "Old geocode" });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(values.ManualAddress, "Manually selected house");
  apply(
    {
      ...position,
      timestamp: position.timestamp + 1,
      coords: { ...position.coords, latitude: 12 },
    },
    1,
  );
  assert.deepEqual(values.PinCoords, { lat: 11, lng: 76 });
});

test("tracked location requires its actual fresh capture time, including valid zero latitude", () => {
  const now = Date.now();
  const row = {
    current_latitude: 0,
    current_longitude: 76,
    last_location_update_at: new Date(now).toISOString(),
  };
  assert.equal(assignmentLocation(row, now).lat, 0);
  assert.equal(
    assignmentLocation(
      { ...row, last_location_update_at: new Date(now - 31000).toISOString() },
      now,
    ),
    null,
  );
  assert.equal(assignmentLocation({ ...row, last_location_update_at: undefined }, now), null);
  assert.equal(assignmentLocation({ ...row, current_latitude: null }, now), null);
});

test("checkout current-location action waits for improving GPS and uses the best fix", async (t) => {
  const { acquireCurrentPosition } = await load("src/lib/acquire-location.ts");
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: Date.now() });
  const windowBefore = Object.getOwnPropertyDescriptor(globalThis, "window");
  const navigatorBefore = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  let receive,
    selected = null,
    stops = 0;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { isSecureContext: true },
  });
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      geolocation: {
        watchPosition(callback) {
          receive = callback;
          return 1;
        },
        clearWatch() {
          stops++;
        },
      },
    },
  });
  const revision = { current: 0 },
    controller = { current: null };
  const locate = checkoutCallback("locateUser", {
    validateGeolocationRuntime: () => true,
    stopLiveLocation: () => {
      controller.current?.abort();
      revision.current++;
    },
    acquisitionRevision: revision,
    acquisitionController: controller,
    acquireCurrentPosition,
    setLocStatus() {},
    setLocError() {},
    applyPosition: (fix) => {
      selected = fix;
    },
  });
  try {
    locate();
    const fix = (accuracy) => ({
      timestamp: Date.now(),
      coords: { latitude: 9.98, longitude: 76.3, accuracy },
    });
    receive(fix(800));
    receive(fix(18));
    assert.equal(selected, null);
    t.mock.timers.tick(1000);
    const best = fix(8);
    receive(best);
    t.mock.timers.tick(2000);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(selected, best);
    assert.equal(stops, 1);
  } finally {
    controller.current?.abort();
    if (windowBefore) Object.defineProperty(globalThis, "window", windowBefore);
    else delete globalThis.window;
    if (navigatorBefore) Object.defineProperty(globalThis, "navigator", navigatorBefore);
    else delete globalThis.navigator;
  }
});

test("frequent live GPS updates do not erase or invalidate the pending address lookup", async () => {
  const values = {},
    pending = [];
  const scope = {
    usableGPS,
    acquisitionRevision: { current: 1 },
    geocodeRevision: { current: 0 },
    lastFixAt: { current: 0 },
    lastGeocodeAt: { current: 0 },
    CURRENT_LOCATION_ID: "current",
    reverseGeocodeFn: () => new Promise((resolve) => pending.push(resolve)),
  };
  for (const name of [
    "PinCoords",
    "ConfirmedLocation",
    "AccuracyMeters",
    "Addr",
    "LocStatus",
    "LocError",
    "CurrentAddress",
    "ManualAddress",
  ])
    scope["set" + name] = (value) => {
      values[name] = value;
    };
  const apply = checkoutCallback("applyPosition", scope);
  const position = {
    timestamp: Date.now(),
    coords: { latitude: 9.98, longitude: 76.3, accuracy: 8 },
  };
  apply(position, 1);
  apply({ ...position, timestamp: position.timestamp + 1 }, 1);
  assert.equal(pending.length, 1);
  pending[0]({ address: "Confirmed lookup address" });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(values.CurrentAddress, "Confirmed lookup address");
  apply({ ...position, timestamp: position.timestamp + 2 }, 1);
  assert.equal(values.CurrentAddress, "Confirmed lookup address");
});
