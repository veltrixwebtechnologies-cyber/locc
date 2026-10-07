import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sourceLoader } from "./load-source.mjs";
import { collectGeoJsonRows, importRows, isSameNamedAddress } from "../scripts/import-geojson-shops.mjs";
import {
  cleanText,
  normalizeFeature,
  normalizePhone,
  stablePlaceKey,
} from "../scripts/geojson-shop-normalizer.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const shopsDir = path.resolve(projectRoot, "../Shops");

test("cleans scrape labels and rejects postal codes as phone numbers", () => {
  assert.equal(cleanText("\uE0C8 12 Main Rd \uE0B0"), "12 Main Rd");
  assert.equal(cleanText("4.0JS:4"), null);
  assert.equal(normalizePhone("560045"), null);
  assert.equal(normalizePhone("+91 98765 43210"), "+919876543210");
  assert.equal(normalizePhone("0422 2345678"), "+914222345678");
});

test("reads GeoJSON coordinates in [longitude, latitude] order", () => {
  const result = normalizeFeature({
    type: "Feature",
    geometry: { type: "Point", coordinates: [77.6196249, 13.0402336] },
    properties: { business_name: "Sample", formatted_address: "Address" },
  }, "Dress_Shops_and_Apparels_Banglore.geojson");
  assert.equal(result.record.longitude, 77.6196249);
  assert.equal(result.record.latitude, 13.0402336);
  assert.equal(result.record.city, "Bengaluru");
  assert.equal(result.record.category, "Fashion & Apparel");
  assert.equal(result.record.phone, null);
  assert.equal(result.record.opening_hours, null);
  assert.equal(result.record.claim_status, "unclaimed");
});

test("uses an identity key rather than coordinates alone", () => {
  const first = stablePlaceKey(null, "Shop A", "Mall Unit 1", 11, 77);
  const second = stablePlaceKey(null, "Shop B", "Mall Unit 2", 11, 77);
  assert.notEqual(first, second);
  assert.equal(stablePlaceKey(null, "Shop A", "Mall Unit 1", 11, 77), first);
});

test("all provided GeoJSON files parse and assign dataset-driven categories", async () => {
  const { rows, summary } = await collectGeoJsonRows(shopsDir);
  assert.equal(summary.filesProcessed, 4);
  assert.equal(summary.recordsFound, 200);
  assert.equal(summary.invalidCoordinates, 0);
  assert.equal(summary.errors, 6);
  assert.equal(summary.duplicatesSkipped, 0);
  assert.equal(rows.length, 194);
  const bakeries = rows.filter(row => row.category === "Bakery");
  assert.equal(bakeries.length, 49);
  assert.ok(bakeries.every(row => row.city === "Coimbatore" && row.website === null));
  assert.ok(rows.every((row) => row.latitude >= 8 && row.latitude <= 14));
  assert.ok(rows.every((row) => row.longitude >= 76 && row.longitude <= 79));
  assert.ok(rows.filter((row) => row.category === "Furniture").every((row) => row.city === "Coimbatore"));
  assert.ok(rows.filter((row) => row.category === "Fashion & Apparel").every((row) => row.city === "Bengaluru" || row.city === "Coimbatore"));
  assert.ok(rows.every((row) => row.claim_status === "unclaimed" && row.image_type === "representative"));
  assert.ok(summary.invalidPhoneValuesRemoved > 0);
});

test("malformed coordinate values are rejected instead of becoming zero", () => {
  const feature = {type: "Feature", geometry: {type: "Point", coordinates: [null, 11]}, properties: {business_name: "Valid name"}};
  assert.equal(normalizeFeature(feature, "Furniture_Shops_Coimbatore.geojson").invalidCoordinates, true);
});

test("same building coordinates do not merge different seller businesses", () => {
  assert.equal(isSameNamedAddress({business_name: "Shop A", formatted_address: "Mall, Coimbatore, Tamil Nadu"}, {
    name: "Shop B", address_line1: "Mall", city: "Coimbatore", state: "Tamil Nadu",
  }), false);
});

test("rerunning the import upserts the same rows and preserves claimed seller images", async () => {
  const records = new Map();
  const writes = [];
  const client = {from(table) {
    return {
      select() {return this;}, order() {return this;},
      async range() {return {data: table === "imported_shops" ? [...records.values()] : [], error: null};},
      async in(_field, keys) {return {data: keys.flatMap((key) => records.has(key) ? [records.get(key)] : []), error: null};},
      async upsert(rows, options) {
        assert.equal(table, "imported_shops");
        assert.equal(options.onConflict, "source_place_key");
        const batch = Array.isArray(rows) ? rows : [rows];
        assert.equal(new Set(batch.map((row) => Object.keys(row).sort().join(","))).size, 1);
        for (const row of batch) records.set(row.source_place_key, {...records.get(row.source_place_key), ...row});
        writes.push(...batch);
        return {data: null, error: null};
      },
    };
  }};
  const first = await importRows({directory: shopsDir, client, dryRun: false});
  assert.equal(first.inserted, 194);
  assert.equal(first.updated, 0);
  const key = records.keys().next().value;
  records.set(key, {...records.get(key), image_type: "seller", image_source: "seller", cover_image_url: "https://localshore.example/seller.jpg", claim_status: "claimed", claimed_by_seller_id: "seller-id"});
  const second = await importRows({directory: shopsDir, client, dryRun: false});
  assert.equal(second.inserted, 0);
  assert.equal(second.updated, 194);
  assert.equal(records.size, 194);
  assert.equal(records.get(key).cover_image_url, "https://localshore.example/seller.jpg");
  assert.equal(records.get(key).claim_status, "claimed");
  assert.equal(records.get(key).claimed_by_seller_id, "seller-id");
  assert.equal(writes.length, 388);
});

test("Google URL identity preserves distinct query locations but ignores tracking", () => {
  const first = stablePlaceKey("https://www.google.com/maps?q=Shop+A", "A", "Mall", 11, 77);
  assert.equal(first, stablePlaceKey("https://www.google.com/maps?q=Shop+A&utm_source=test", "A", "Mall", 11, 77));
  assert.notEqual(first, stablePlaceKey("https://www.google.com/maps?q=Shop+B", "B", "Mall", 11, 77));
});

test("map markers use stored database coordinates without geocoding", async () => {
  const { toImportedMapMarker } = await sourceLoader(projectRoot)("src/lib/imported-shops.ts");
  const marker = toImportedMapMarker({id: "public-test", business_name: "Sample", category: "Fashion & Apparel", latitude: 13.0402336, longitude: 77.6196249, distance_km: 1, claim_status: "unclaimed"});
  assert.equal(marker.lat, 13.0402336);
  assert.equal(marker.lng, 77.6196249);
  assert.equal(marker.isImported, true);
  assert.equal(marker.shopId, "imported:public-test");
  assert.equal(toImportedMapMarker({id: "invalid", business_name: "Bad", latitude: null, longitude: 77, distance_km: 1}), null);
});

test("bakery listings load through the map API and retain bakery category and coordinates", async () => {
  const { fetchNearbyImportedShops, toImportedMapMarker } = await sourceLoader(projectRoot)("src/lib/imported-shops.ts");
  const result = normalizeFeature({
    type: "Feature", geometry: { type: "Point", coordinates: [76.9786242, 11.0218787] },
    properties: { business_name: "Ramakrishna Bakes", website: "https://example.com" },
  }, "Bakeries_Coimbatore.geojson");
  const row = { ...result.record, id: "bakery-test", distance_km: 0 };
  const shops = await fetchNearbyImportedShops(async (name, args) => {
    assert.equal(name, "get_nearby_imported_shops");
    assert.equal(args.p_category_slug, "bakery");
    return { data: [row], error: null };
  }, { lat: row.latitude, lng: row.longitude, radiusKm: 7, category: "bakery" });
  assert.equal(shops.length, 1);
  const marker = toImportedMapMarker(shops[0]);
  assert.equal(marker.category, "bakery");
  assert.equal(marker.lat, 11.0218787);
  assert.equal(marker.lng, 76.9786242);
  assert.equal(marker.shopId, "imported:bakery-test");
  assert.equal(marker.website, undefined);
});

test("imported shop detail selects the exact ID even when businesses share coordinates", async () => {
  const { fetchImportedShopById, getImportedShopHref, toImportedShopCard } = await sourceLoader(projectRoot)("src/lib/imported-shops.ts");
  const row = { business_name: "Clothing", category: "Fashion & Apparel", latitude: 13.04, longitude: 77.62, distance_km: 0, claim_status: "unclaimed" };
  const calls = [];
  const rpc = async (name, args) => { calls.push({ name, args }); return { data: [{ ...row, id: "other" }, { ...row, id: "selected", business_name: "Selected shop" }], error: null }; };
  const selected = await fetchImportedShopById(rpc, "imported:selected", row.latitude, row.longitude);
  assert.equal(selected.business_name, "Selected shop");
  assert.equal(calls[0].name, "get_nearby_imported_shops");
  assert.equal(calls[0].args.p_radius_km, 0.1);
  const card = toImportedShopCard(selected);
  assert.equal(card.latitude, row.latitude);
  assert.equal(card.longitude, row.longitude);
  const url = new URL(getImportedShopHref(card.id, card.latitude, card.longitude), "http://localhost");
  assert.equal(decodeURIComponent(url.pathname), "/store/imported:selected");
  await assert.rejects(fetchImportedShopById(rpc, "imported:missing", row.latitude, row.longitude), /could not be found/);
  await assert.rejects(fetchImportedShopById(rpc, "imported:selected"), /Open this shop/);
});
