import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { sourceLoader } from "./load-source.mjs";

const { shouldRetryCatalogQuery } = await sourceLoader(process.cwd())("src/lib/catalog-rpc.ts");

test("nearby catalog retries transient connection and statement timeouts only", () => {
  for (const message of [
    "Catalog request timed out. Please retry.",
    "Connection terminated due to connection timeout",
    "canceling statement due to statement timeout",
    "Failed to fetch",
  ]) {
    assert.equal(shouldRetryCatalogQuery(0, new Error(message)), true);
    assert.equal(shouldRetryCatalogQuery(1, new Error(message)), true);
    assert.equal(shouldRetryCatalogQuery(2, new Error(message)), false);
  }
  assert.equal(shouldRetryCatalogQuery(0, new Error("Permission denied")), false);
});

test("homepage keeps independent shop and product failure states", () => {
  const source = fs.readFileSync("src/routes/index.tsx", "utf8");
  assert.match(source, /approvedVendors\.isError && publicShops\.isError/);
  assert.doesNotMatch(source, /approvedVendors\.isError \|\| approvedProducts\.isError/);
  assert.match(source, /Nearby shops are available, but their live product inventory could not be loaded/);
  assert.match(source, /if \(publicShops\.isError\) void publicShops\.refetch\(\)/);
});
