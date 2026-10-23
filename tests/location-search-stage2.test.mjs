import test from "node:test";
import assert from "node:assert/strict";
import { sourceLoader } from "./load-source.mjs";

const load = sourceLoader(process.cwd());
const { isValidCoordinate } = await load("src/lib/geo.ts");
const { getImportedShopHref } = await load("src/lib/imported-shops.ts");

test("Stage 2: isValidCoordinate validates coordinates strictly", () => {
  assert.equal(isValidCoordinate(11.0168, 76.9558), true);
  assert.equal(isValidCoordinate(0, 0), false); // Specifically rejects Null Island (0, 0)
  assert.equal(isValidCoordinate(-33.8688, 151.2093), true);
  assert.equal(isValidCoordinate(null, 76.9558), false);
  assert.equal(isValidCoordinate(11.0168, undefined), false);
  assert.equal(isValidCoordinate(NaN, 76.9558), false);
  assert.equal(isValidCoordinate(91, 76.9558), false); // Out of bounds lat
  assert.equal(isValidCoordinate(11.0168, 185), false); // Out of bounds lng
});

test("Stage 2: getImportedShopHref generates correct in-app route and coordinates", () => {
  const href = getImportedShopHref("shop-123", 11.0168, 76.9558);
  assert.match(href, /^\/store\/imported%3Ashop-123\?/);
  const url = new URL(href, "http://localhost");
  assert.equal(decodeURIComponent(url.pathname), "/store/imported:shop-123");
  assert.equal(Number(url.searchParams.get("shopLat")), 11.0168);
  assert.equal(Number(url.searchParams.get("shopLng")), 76.9558);

  // Parse extracted parameters matching SwiggyInstantSearchDropdown logic
  const [path, searchStr] = href.split("?");
  const rawStoreId = path.slice("/store/".length);
  const storeId = decodeURIComponent(rawStoreId);
  const sp = new URLSearchParams(searchStr || "");
  const shopLat = Number(sp.get("shopLat"));
  const shopLng = Number(sp.get("shopLng"));

  assert.equal(storeId, "imported:shop-123");
  assert.equal(shopLat, 11.0168);
  assert.equal(shopLng, 76.9558);
});

test("Stage 2: unpinned address check prevents delivery without coordinates", () => {
  const addressWithoutCoords = {
    id: "addr-1",
    label: "Home",
    line: "123 Main St",
    lat: null,
    lng: null,
  };

  const hasValidCoords =
    typeof addressWithoutCoords.lat === "number" &&
    typeof addressWithoutCoords.lng === "number" &&
    isValidCoordinate(addressWithoutCoords.lat, addressWithoutCoords.lng);

  assert.equal(hasValidCoords, false);

  const addressWithCoords = {
    id: "addr-2",
    label: "Office",
    line: "456 Tech Park",
    lat: 11.0168,
    lng: 76.9558,
  };

  const valid =
    typeof addressWithCoords.lat === "number" &&
    typeof addressWithCoords.lng === "number" &&
    isValidCoordinate(addressWithCoords.lat, addressWithCoords.lng);

  assert.equal(valid, true);
});

test("Stage 2: accuracy must be low (<= 100m) for direct delivery confirmation and <= 5000m for preview", async () => {
  const { MAX_CUSTOMER_DELIVERY_ACCURACY_M, MAX_APPROXIMATE_GPS_PREVIEW_ACCURACY_M } =
    await load("src/lib/coordinates.ts");

  assert.equal(MAX_CUSTOMER_DELIVERY_ACCURACY_M, 100);
  assert.equal(MAX_APPROXIMATE_GPS_PREVIEW_ACCURACY_M, 5000);

  // Exact mobile GPS readings (e.g. 15m) are low accuracy values (high precision)
  const preciseFixAccuracy = 15;
  assert.equal(preciseFixAccuracy <= MAX_CUSTOMER_DELIVERY_ACCURACY_M, true);

  // Broad desktop/IP readings (e.g. 100,000m) are NOT low and must be rejected
  const coarseIPAccuracy = 100000;
  assert.equal(coarseIPAccuracy <= MAX_CUSTOMER_DELIVERY_ACCURACY_M, false);
  assert.equal(coarseIPAccuracy <= MAX_APPROXIMATE_GPS_PREVIEW_ACCURACY_M, false);

  // Neighborhood Wi-Fi readings (e.g. 500m) are acceptable for map centering but require manual pin confirmation
  const wifiAccuracy = 500;
  assert.equal(wifiAccuracy <= MAX_CUSTOMER_DELIVERY_ACCURACY_M, false, "Requires manual pin placement");
  assert.equal(wifiAccuracy <= MAX_APPROXIMATE_GPS_PREVIEW_ACCURACY_M, true, "Permitted for map centering preview");
});
