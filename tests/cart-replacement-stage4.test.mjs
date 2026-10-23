import test from "node:test";
import assert from "node:assert/strict";
import { cartStore } from "../src/modules/shopper/services/cart-store.ts";
import { cartConflictManager } from "../src/modules/shopper/services/cart-conflict.ts";

test("Stage 4: adding to same shop succeeds normally", () => {
  cartStore.clear();

  const added1 = cartConflictManager.addWithConflictCheck("store-A", "Baker Street", {
    id: "p1",
    name: "Sourdough Bread",
    unit: "500g",
    price: 120,
    stock: 10,
  });
  assert.equal(added1, true);

  const added2 = cartConflictManager.addWithConflictCheck("store-A", "Baker Street", {
    id: "p2",
    name: "Croissant",
    unit: "1 pc",
    price: 60,
    stock: 5,
  });
  assert.equal(added2, true);

  const snapshot = cartStore.getSnapshot();
  assert.equal(snapshot.storeId, "store-A");
  assert.equal(snapshot.lines.length, 2);
  assert.equal(cartConflictManager.getPendingConflict(), null);
});

test("Stage 4: adding from a different shop preserves existing cart and raises conflict", () => {
  // Cart currently has store-A items
  const snapshotBefore = cartStore.getSnapshot();
  assert.equal(snapshotBefore.storeId, "store-A");
  assert.equal(snapshotBefore.lines.length, 2);

  // Try adding from store-B without confirmation
  const added = cartConflictManager.addWithConflictCheck("store-B", "Spice Bazaar", {
    id: "p3",
    name: "Organic Turmeric",
    unit: "200g",
    price: 150,
    stock: 15,
  });

  // Must be rejected
  assert.equal(added, false);

  // Cart must NOT be wiped or modified
  const snapshotAfter = cartStore.getSnapshot();
  assert.equal(snapshotAfter.storeId, "store-A");
  assert.equal(snapshotAfter.lines.length, 2);
  assert.equal(snapshotAfter.lines[0].productId, "p1");
  assert.equal(snapshotAfter.lines[1].productId, "p2");

  // Conflict must be recorded with full details
  const conflict = cartConflictManager.getPendingConflict();
  assert.notEqual(conflict, null);
  assert.equal(conflict.currentStoreId, "store-A");
  assert.equal(conflict.currentStoreName, "Baker Street");
  assert.equal(conflict.newStoreId, "store-B");
  assert.equal(conflict.newStoreName, "Spice Bazaar");
  assert.equal(conflict.newProduct.id, "p3");
});

test("Stage 4: cancelReplace dismisses conflict and preserves cart unchanged", () => {
  assert.notEqual(cartConflictManager.getPendingConflict(), null);

  cartConflictManager.cancelReplace();

  assert.equal(cartConflictManager.getPendingConflict(), null);

  // Cart remains intact
  const snapshot = cartStore.getSnapshot();
  assert.equal(snapshot.storeId, "store-A");
  assert.equal(snapshot.lines.length, 2);
});

test("Stage 4: confirmReplace clears old shop items and adds new item", () => {
  // Re-trigger conflict
  const addedAttempt = cartConflictManager.addWithConflictCheck("store-B", "Spice Bazaar", {
    id: "p3",
    name: "Organic Turmeric",
    unit: "200g",
    price: 150,
    stock: 15,
  });
  assert.equal(addedAttempt, false);
  assert.notEqual(cartConflictManager.getPendingConflict(), null);

  // Explicit confirmation
  const confirmed = cartConflictManager.confirmReplace();
  assert.equal(confirmed, true);
  assert.equal(cartConflictManager.getPendingConflict(), null);

  // Old items discarded, new item present
  const snapshot = cartStore.getSnapshot();
  assert.equal(snapshot.storeId, "store-B");
  assert.equal(snapshot.storeName, "Spice Bazaar");
  assert.equal(snapshot.lines.length, 1);
  assert.equal(snapshot.lines[0].productId, "p3");
  assert.equal(snapshot.lines[0].price, 150);

  // Cleanup
  cartStore.clear();
});
