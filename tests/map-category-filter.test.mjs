import test from "node:test";
import assert from "node:assert/strict";
import { sourceLoader } from "./load-source.mjs";

const { getMapMarkerItems } = await sourceLoader(process.cwd(), {
  "./providers": "export const calculateHaversineDistanceKm = () => 0;",
})("src/lib/map-service/store-engine.ts");

test("map category uses primary shop type and ignores incidental product category", () => {
  const shops = [
    {
      id: "cafe-seller",
      shop_name: "Corner Cafe",
      business_type: "Cafés & Tea Shops",
      category: "grocery",
      lat: 11.01,
      lng: 76.95,
      distance_km: 0.2,
    },
    {
      id: "grocery-seller",
      shop_name: "Daily Grocery",
      business_type: "grocery",
      category: "cafes",
      lat: 11.02,
      lng: 76.96,
      distance_km: 0.3,
    },
  ];
  const products = [
    {
      id: "cafe-product",
      seller_id: "cafe-seller",
      name: "Filter Coffee",
      category: "beverages",
      selling_price: 30,
      stock: 10,
    },
    {
      id: "grocery-product",
      seller_id: "grocery-seller",
      name: "Coffee Powder",
      category: "cafes",
      selling_price: 120,
      stock: 8,
    },
  ];

  const markers = getMapMarkerItems(
    { lat: 11.01, lng: 76.95 },
    { category: "cafes", maxDistanceKm: 5 },
    products,
    shops,
  );

  assert.deepEqual(markers.map((marker) => marker.shopId), ["cafe-seller"]);
  assert.equal(markers[0].category, "cafes");
});
