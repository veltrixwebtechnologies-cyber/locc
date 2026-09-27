import test from "node:test";
import assert from "node:assert/strict";
import { sourceLoader } from "./load-source.mjs";

const load = sourceLoader(process.cwd());
const visibility = await load("src/lib/location-visibility.ts");

test("customer visibility boundary is inclusive at exactly five kilometres", () => {
  assert.equal(visibility.isWithinCustomerVisibilityRadius(4.8), true);
  assert.equal(visibility.isWithinCustomerVisibilityRadius(5), true);
  assert.equal(visibility.isWithinCustomerVisibilityRadius(5.0001), false);
  assert.equal(visibility.isWithinCustomerVisibilityRadius(5.1), false);
  assert.equal(visibility.CUSTOMER_VISIBILITY_RADIUS_METERS, 5000);
});

test("unknown or invalid distances are never visible", () => {
  assert.equal(visibility.isWithinCustomerVisibilityRadius(-1), false);
  assert.equal(visibility.isWithinCustomerVisibilityRadius(undefined), false);
  assert.equal(visibility.isWithinCustomerVisibilityRadius(Number.NaN), false);
});

test('location validation rejects out-of-range coordinates and empty default pin',()=>{
  for(const location of [null,{lat:91,lng:77},{lat:12,lng:181},{lat:0,lng:0}])
    assert.equal(visibility.hasConfirmedCoordinates(location),false);
  assert.equal(visibility.hasConfirmedCoordinates({lat:0,lng:77}),true);
});
