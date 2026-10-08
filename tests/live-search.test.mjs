import test from "node:test";
import assert from "node:assert/strict";
import { sourceLoader } from "./load-source.mjs";
const { searchLiveCatalog } = await sourceLoader(process.cwd())("src/lib/live-search.ts");
const input = { lat: 11.0183, lng: 76.9725, query: "  Abi   Store  " };
const shop = (id) => ({ id, shop_name: "Abi Store", business_type: "grocery", lat: 11.0222, lng: 76.9693, distance_km: 0.5 });
test("live suggestions preserve shop identity and normalized query/location", async () => {
  const calls = [];
  const results = await searchLiveCatalog(async (name,args) => {
    calls.push({name,args});
    return {data: name === "discover_nearby_shops" ? [shop("a"),shop("b")] : [], error:null};
  }, input);
  assert.deepEqual(results.map(r=>r.id), ["shop-a","shop-b"]);
  assert.equal(results[0].url,"/store/a");
  for (const call of calls) {
    assert.equal(call.args.p_query,call.name === "discover_nearby_shops" ? null : "Abi Store");
    assert.equal(call.args.p_lat,input.lat);
  }
});
test("imported suggestions open the selected LocalShore shop with its stored coordinates", async () => {
  const results = await searchLiveCatalog(async (name) => ({data: name === "get_nearby_imported_shops" ? [{
    id: "public-a", business_name: "Abi Store", category: "Fashion & Apparel", city: "Coimbatore",
    distance_km: 1, cover_image_url: "https://images.unsplash.com/example", image_type: "representative",
    google_maps_url: "https://www.google.com/maps/place/Abi", rating: 4.8, review_count: 100,
    latitude: 11.0183, longitude: 76.9725,
  }] : [], error: null}), input);
  assert.equal(results.length, 1);
  assert.equal(results[0].metadata.imported, true);
  assert.equal(results[0].imageUrl, "https://images.unsplash.com/example");
  const url = new URL(results[0].url, "http://localhost");
  assert.equal(decodeURIComponent(url.pathname), "/store/imported:public-a");
  assert.equal(Number(url.searchParams.get("shopLat")), 11.0183);
  assert.equal(Number(url.searchParams.get("shopLng")), 76.9725);
  assert.match(results[0].subtitle, /unclaimed/);
});
test("an unapplied imported-shop migration does not block existing seller suggestions", async () => {
  const results = await searchLiveCatalog(async (name) => name === "get_nearby_imported_shops"
    ? {data: null, error: {code: "PGRST202", message: "Missing RPC"}}
    : {data: name === "discover_nearby_shops" ? [shop("existing")] : [], error: null}, input);
  assert.deepEqual(results.map((item) => item.id), ["shop-existing"]);
});
test("empty catalog never injects mock suggestions; failures remain errors", async () => {
  assert.deepEqual(await searchLiveCatalog(async ()=>({data:[],error:null}), input), []);
  await assert.rejects(searchLiveCatalog(async ()=>({data:null,error:{message:"Offline"}}), input), /Offline/);
});
test("product links use the database ID and reject invalid or out-of-radius rows", async () => {
  const product = {id:"p1",seller_id:"s1",name:"Rice",stock:2,distance_km:1,selling_price:72};
  const results = await searchLiveCatalog(async name=>({data: name === "discover_nearby_shops" ? [] : [
    product,{...product,id:"far",distance_km:8},{...product,id:"missing",distance_km:null},
  ],error:null}),input);
  assert.equal(results.length,1);
  assert.equal(results[0].url,"/product/p1");
});
