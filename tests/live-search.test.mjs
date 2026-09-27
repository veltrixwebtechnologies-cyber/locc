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
    assert.equal(call.args.p_query,"Abi Store");
    assert.equal(call.args.p_lat,input.lat);
  }
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
