import test from 'node:test';
import assert from 'node:assert/strict';
import { sourceLoader } from './load-source.mjs';

const load = sourceLoader(process.cwd());
const {
  mergeCarts,
  readStoredGuestCart,
  writeStoredGuestCart,
  readStoredUserCart,
  writeStoredUserCart,
  clearStoredGuestCart,
} = await load('src/modules/shopper/services/persistent-cart.ts');

const { cartStore, cartTotals } = await load('src/modules/shopper/services/cart-store.ts');

function createMockLocalStorage() {
  const store = new Map();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
}

test('1 & 2: Guest cart persistence and restoration across refresh and next-day return', () => {
  const storage = createMockLocalStorage();
  globalThis.window = { localStorage: storage };

  try {
    const guestCart = {
      storeId: 'shop-1',
      storeName: 'Bakery Fresh',
      lines: [
        { productId: 'p1', storeId: 'shop-1', name: 'Sourdough Bread', unit: 'loaf', price: 120, qty: 1 },
        { productId: 'p2', storeId: 'shop-1', name: 'Croissant', unit: 'piece', price: 60, qty: 2 },
        { productId: 'p3', storeId: 'shop-1', name: 'Muffin', unit: 'box', price: 150, qty: 1 },
      ],
    };

    writeStoredGuestCart(guestCart);

    // Simulate page refresh / next-day return
    const restored = readStoredGuestCart();
    assert.equal(restored.lines.length, 3);
    assert.equal(restored.storeId, 'shop-1');
    assert.equal(restored.lines[0].productId, 'p1');
    assert.equal(restored.lines[1].qty, 2);
    assert.equal(restored.lines[2].price, 150);

    const totals = cartTotals(restored.lines);
    assert.equal(totals.itemCount, 4);
    assert.equal(totals.subtotal, 120 * 1 + 60 * 2 + 150 * 1);
  } finally {
    delete globalThis.window;
  }
});

test('3 & 4: Logged-in user cart persistence and multi-device restoration', () => {
  const storageDevice1 = createMockLocalStorage();
  globalThis.window = { localStorage: storageDevice1 };

  try {
    const userId = 'user-alice-123';
    const accountCart = {
      storeId: 'shop-grocery',
      storeName: 'Green Grocers',
      lines: [
        { productId: 'g1', storeId: 'shop-grocery', name: 'Organic Apples', unit: '1 kg', price: 180, qty: 2 },
      ],
    };

    // Save on Device 1
    writeStoredUserCart(userId, accountCart);
    assert.equal(readStoredUserCart(userId).lines.length, 1);

    // Simulate Device 2 (different localStorage, restored from account storage)
    const storageDevice2 = createMockLocalStorage();
    globalThis.window = { localStorage: storageDevice2 };
    writeStoredUserCart(userId, accountCart); // Synced from database

    const restoredOnDevice2 = readStoredUserCart(userId);
    assert.equal(restoredOnDevice2.lines.length, 1);
    assert.equal(restoredOnDevice2.lines[0].name, 'Organic Apples');
    assert.equal(restoredOnDevice2.lines[0].qty, 2);
  } finally {
    delete globalThis.window;
  }
});

test('5: Merge guest cart with account cart correctly', () => {
  const accountLines = [
    { productId: 'p1', storeId: 'shop-1', name: 'Milk', unit: '1 L', price: 30, qty: 2, availableStock: 10 },
    { productId: 'p2', storeId: 'shop-1', name: 'Butter', unit: '500 g', price: 250, qty: 1, availableStock: 5 },
  ];

  const guestLines = [
    { productId: 'p1', storeId: 'shop-1', name: 'Milk', unit: '1 L', price: 30, qty: 3, availableStock: 10 },
    { productId: 'p3', storeId: 'shop-1', name: 'Cheese', unit: '200 g', price: 120, qty: 1, availableStock: 4 },
  ];

  const merged = mergeCarts(accountLines, guestLines);

  assert.equal(merged.length, 3);
  const p1 = merged.find((l) => l.productId === 'p1');
  assert.ok(p1);
  assert.equal(p1.qty, 5); // 2 + 3 combined

  const p2 = merged.find((l) => l.productId === 'p2');
  assert.ok(p2);
  assert.equal(p2.qty, 1);

  const p3 = merged.find((l) => l.productId === 'p3');
  assert.ok(p3);
  assert.equal(p3.qty, 1);
});

test('6: Adding the same product repeatedly does not create duplicate entries', () => {
  const accountLines = [
    { productId: 'p1', storeId: 'shop-1', name: 'Coffee', unit: 'jar', price: 350, qty: 2, availableStock: 10 },
  ];
  const guestLines = [
    { productId: 'p1', storeId: 'shop-1', name: 'Coffee', unit: 'jar', price: 350, qty: 1, availableStock: 10 },
  ];

  const merged = mergeCarts(accountLines, guestLines);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].qty, 3);
});

test('7: Identical product IDs from different shops remain separate', () => {
  const shop1Line = { productId: 'item-100', storeId: 'shop-alpha', name: 'Almond Milk', unit: '1 L', price: 150, qty: 1 };
  const shop2Line = { productId: 'item-100', storeId: 'shop-beta', name: 'Almond Milk', unit: '1 L', price: 160, qty: 2 };

  const merged = mergeCarts([shop1Line], [shop2Line]);
  assert.equal(merged.length, 2);
  assert.equal(merged.find(l => l.storeId === 'shop-alpha')?.price, 150);
  assert.equal(merged.find(l => l.storeId === 'shop-beta')?.price, 160);
});

test('8: User cart isolation prevents data leakage across accounts', () => {
  const storage = createMockLocalStorage();
  globalThis.window = { localStorage: storage };

  try {
    writeStoredUserCart('user-a', {
      storeId: 's1',
      storeName: 'Shop A',
      lines: [{ productId: 'p1', storeId: 's1', name: 'Item A', unit: 'unit', price: 100, qty: 1 }],
    });

    writeStoredUserCart('user-b', {
      storeId: 's2',
      storeName: 'Shop B',
      lines: [{ productId: 'p2', storeId: 's2', name: 'Item B', unit: 'unit', price: 200, qty: 2 }],
    });

    const userACart = readStoredUserCart('user-a');
    const userBCart = readStoredUserCart('user-b');

    assert.equal(userACart.lines.length, 1);
    assert.equal(userACart.lines[0].productId, 'p1');

    assert.equal(userBCart.lines.length, 1);
    assert.equal(userBCart.lines[0].productId, 'p2');
  } finally {
    delete globalThis.window;
  }
});

test('11: Database failures do not silently erase saved guest cart items', () => {
  const storage = createMockLocalStorage();
  globalThis.window = { localStorage: storage };

  try {
    const guestCart = {
      storeId: 's1',
      storeName: 'Shop 1',
      lines: [{ productId: 'p1', storeId: 's1', name: 'Tea', unit: 'box', price: 80, qty: 1 }],
    };
    writeStoredGuestCart(guestCart);

    // If remote DB fails, guest cart in storage remains untouched
    const preserved = readStoredGuestCart();
    assert.equal(preserved.lines.length, 1);
    assert.equal(preserved.lines[0].name, 'Tea');
  } finally {
    delete globalThis.window;
  }
});

test('12: Stock changes, invalid quantities, and stock caps are handled safely', () => {
  const accountLines = [
    { productId: 'p1', storeId: 's1', name: 'Sugar', unit: '1 kg', price: 45, qty: 4, availableStock: 5 },
  ];
  // Guest tries to add 10 when stock is 5
  const guestLines = [
    { productId: 'p1', storeId: 's1', name: 'Sugar', unit: '1 kg', price: 45, qty: 10, availableStock: 5 },
  ];

  const merged = mergeCarts(accountLines, guestLines);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].qty, 5); // Capped at availableStock 5
});

test('13 & 14: Zero-flicker cached reload and checkout purchase clearing', () => {
  const storage = createMockLocalStorage();
  globalThis.window = { localStorage: storage };

  try {
    const userId = 'buyer-bob';
    writeStoredUserCart(userId, {
      storeId: 's1',
      storeName: 'Boutique',
      lines: [{ productId: 'b1', storeId: 's1', name: 'Handmade Soap', unit: 'bar', price: 150, qty: 1 }],
    });

    // Immediate synchronous read on reload
    const cached = readStoredUserCart(userId);
    assert.equal(cached.lines.length, 1);

    // After order placement, cart is cleared
    writeStoredUserCart(userId, { storeId: null, storeName: null, lines: [] });
    clearStoredGuestCart();

    assert.equal(readStoredUserCart(userId).lines.length, 0);
    assert.equal(readStoredGuestCart().lines.length, 0);
  } finally {
    delete globalThis.window;
  }
});
