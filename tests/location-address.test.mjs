import test from "node:test";
import assert from "node:assert/strict";
import { sourceLoader } from "./load-source.mjs";

test("reverse-geocoded delivery labels prefer a recognisable area over an administrative ward", async () => {
  const load = sourceLoader(process.cwd());
  const { resolveNominatimAddress } = await load("src/lib/location-address.ts");

  const result = resolveNominatimAddress({
    display_name: "Ward 7, Example Road, Peelamedu, Coimbatore, Tamil Nadu, India",
    address: {
      city_district: "Ward 7",
      road: "Example Road",
      neighbourhood: "Peelamedu",
      city: "Coimbatore",
      state: "Tamil Nadu",
      postcode: "641004",
    },
  });

  assert.equal(result.area, "Peelamedu");
  assert.equal(result.city, "Coimbatore, Tamil Nadu");
  assert.equal(result.label, "Example Road, Peelamedu, Coimbatore, Tamil Nadu, 641004");
  assert.equal(result.pincode, "641004");
});
