import assert from "node:assert/strict";
import test from "node:test";
import { sourceLoader } from "./load-source.mjs";

const loadSource = sourceLoader(process.cwd());
const { getOrderProgressIndex } = await loadSource("src/lib/order-progress.ts");

test("seller workflow statuses advance the customer order timeline", () => {
  assert.equal(getOrderProgressIndex("accepted"), 1);
  assert.equal(getOrderProgressIndex("vendor_accepted"), 1);
  assert.equal(getOrderProgressIndex("preparing"), 1);
  assert.equal(getOrderProgressIndex("packed"), 1);
  assert.equal(getOrderProgressIndex("ready_for_pickup"), 2);
});

test("delivery workflow aliases map to the matching customer milestones", () => {
  assert.equal(getOrderProgressIndex("rider_assigned"), 3);
  assert.equal(getOrderProgressIndex("going_to_vendor"), 3);
  assert.equal(getOrderProgressIndex("rider_at_shop"), 4);
  assert.equal(getOrderProgressIndex("picked_up"), 5);
  assert.equal(getOrderProgressIndex("out_for_delivery"), 6);
  assert.equal(getOrderProgressIndex("delivered"), 7);
});

test("terminal failure/cancellation states do not show false completed milestones", () => {
  assert.equal(getOrderProgressIndex("cancelled"), -1);
  assert.equal(getOrderProgressIndex("cancelled_by_vendor"), -1);
  assert.equal(getOrderProgressIndex("delivery_failed"), -1);
});
