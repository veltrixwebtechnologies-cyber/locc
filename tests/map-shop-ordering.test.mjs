import test from "node:test";
import assert from "node:assert/strict";
import { sourceLoader } from "./load-source.mjs";

const { getMapMarkerItems } = await sourceLoader(process.cwd())("src/lib/map-service/store-engine.ts");
const { toImportedMapMarker } = await sourceLoader(process.cwd())("src/lib/imported-shops.ts");
const { calculateHaversineDistanceKm } = await sourceLoader(process.cwd())("src/lib/map-service/providers.ts");

test("map shops are ordered strictly from nearest to farthest across 0 to 10 km", () => {
  const userLoc = { lat: 11.0168, lng: 76.9558 };

  // Coordinates approximately:
  // shopA ~ 0.4 km, shopB ~ 2.2 km, shopC ~ 7.1 km, shopD ~ 8.5 km, shopE ~ 9.4 km, shopFar ~ 14.5 km
  const testShops = [
    {
      id: "shop-8km",
      shop_name: "Sri Murugan Store (8.5 km)",
      business_type: "grocery",
      lat: 11.08,
      lng: 76.99, // ~8.5 km
      category: "grocery",
    },
    {
      id: "shop-0km",
      shop_name: "Fresh Veggie Corner (0.4 km)",
      business_type: "grocery",
      lat: 11.018,
      lng: 76.958, // ~0.4 km
      category: "grocery",
    },
    {
      id: "shop-9km",
      shop_name: "Vasanth Electronics (9.4 km)",
      business_type: "grocery",
      lat: 11.09,
      lng: 77.00, // ~9.4 km
      category: "grocery",
    },
    {
      id: "shop-7km",
      shop_name: "Kovai Sweets & Bakery (7.1 km)",
      business_type: "grocery",
      lat: 11.07,
      lng: 76.98, // ~7.1 km
      category: "grocery",
    },
    {
      id: "shop-2km",
      shop_name: "Annapoorna Mart (2.2 km)",
      business_type: "grocery",
      lat: 11.03,
      lng: 76.97, // ~2.2 km
      category: "grocery",
    },
    {
      id: "shop-14km",
      shop_name: "Faraway Outlet (14.5 km)",
      business_type: "grocery",
      lat: 11.13,
      lng: 77.03, // ~14.5 km
      category: "grocery",
    },
  ];

  const markers = getMapMarkerItems(
    userLoc,
    { maxDistanceKm: 10 },
    [],
    testShops,
  );

  // Far shop (> 10 km) must be excluded
  assert.equal(markers.some((m) => m.shopId === "shop-14km"), false);

  // 5 shops within 10 km must be included
  assert.equal(markers.length, 5);

  // Ordering must be strictly monotonically increasing by distanceKm (nearest to farthest)
  for (let i = 0; i < markers.length - 1; i++) {
    assert.ok(
      markers[i].distanceKm <= markers[i + 1].distanceKm,
      `Expected marker[${i}] (${markers[i].shopName}: ${markers[i].distanceKm} km) <= marker[${i + 1}] (${markers[i + 1].shopName}: ${markers[i + 1].distanceKm} km)`,
    );
  }

  // First must be the 0.4 km shop, last must be the 9.4 km shop
  assert.equal(markers[0].shopId, "shop-0km");
  assert.equal(markers[markers.length - 1].shopId, "shop-9km");
});

test("combined seller and imported shop listings maintain unified nearest-to-farthest ordering", () => {
  const userLoc = { lat: 11.0168, lng: 76.9558 };

  // Seller markers
  const sellerMarkers = [
    {
      id: "marker-seller-2km",
      shopId: "seller-2km",
      shopName: "Seller Shop (2.1 km)",
      category: "grocery",
      lat: 11.03,
      lng: 76.97,
      rating: 4.8,
      isOpen: true,
      distanceKm: 2.1,
    },
    {
      id: "marker-seller-8km",
      shopId: "seller-8km",
      shopName: "Seller Shop (8.5 km)",
      category: "grocery",
      lat: 11.08,
      lng: 76.99,
      rating: 4.7,
      isOpen: true,
      distanceKm: 8.5,
    },
  ];

  // Imported directory shops
  const importedShops = [
    {
      id: "imp-1",
      business_name: "Imported Grocery (0.4 km)",
      category: "grocery",
      latitude: 11.018,
      longitude: 76.958,
      distance_km: 0.4,
      formatted_address: "Street 1",
      rating: 4.5,
      review_count: 10,
      claim_status: "unclaimed",
    },
    {
      id: "imp-2",
      business_name: "Imported Bakery (7.2 km)",
      category: "grocery",
      latitude: 11.07,
      longitude: 76.98,
      distance_km: 7.2,
      formatted_address: "Street 2",
      rating: 4.2,
      review_count: 5,
      claim_status: "unclaimed",
    },
    {
      id: "imp-3",
      business_name: "Imported Hardware (9.1 km)",
      category: "grocery",
      latitude: 11.09,
      longitude: 76.995,
      distance_km: 9.1,
      formatted_address: "Street 3",
      rating: 4.0,
      review_count: 3,
      claim_status: "unclaimed",
    },
  ];

  const importedMarkers = importedShops
    .map(toImportedMapMarker)
    .filter((m) => m !== null);

  // Recalculate distance from userLoc and sort as in localshore-map-experience
  const allMarkers = [...sellerMarkers, ...importedMarkers].map((marker) => {
    const distanceKm = Number(
      calculateHaversineDistanceKm(
        userLoc.lat,
        userLoc.lng,
        marker.lat,
        marker.lng,
      ).toFixed(1),
    );
    return { ...marker, distanceKm };
  });

  const sorted = allMarkers.sort((a, b) => {
    if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
    return a.shopName.localeCompare(b.shopName);
  });

  const expectedOrder = [
    "Imported Grocery (0.4 km)",
    "Seller Shop (2.1 km)",
    "Imported Bakery (7.2 km)",
    "Seller Shop (8.5 km)",
    "Imported Hardware (9.1 km)",
  ];

  assert.deepEqual(
    sorted.map((m) => m.shopName),
    expectedOrder,
  );

  // Verify distance progression: 0.4 < 2.1 < 7.2 < 8.5 < 9.1
  for (let i = 0; i < sorted.length - 1; i++) {
    assert.ok(sorted[i].distanceKm <= sorted[i + 1].distanceKm);
  }
});
