import { useSyncExternalStore } from "react";

export interface CartLine {
  productId: string;
  storeId: string;
  name: string;
  unit: string;
  price: number;
  qty: number;
}

interface CartState {
  storeId: string | null;
  storeName: string | null;
  lines: CartLine[];
}

const KEY = "localshore.cart.v1";

const load = (): CartState => {
  if (typeof window === "undefined") return { storeId: null, storeName: null, lines: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    return { storeId: null, storeName: null, lines: [] };
  }
  return { storeId: null, storeName: null, lines: [] };
};

const EMPTY: CartState = { storeId: null, storeName: null, lines: [] };
let state: CartState = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

const persist = () => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
};

const ensureHydrated = () => {
  if (!hydrated && typeof window !== "undefined") {
    state = load();
    hydrated = true;
  }
};

export const cartStore = {
  subscribe(l: () => void) {
    ensureHydrated();
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot(): CartState {
    ensureHydrated();
    return state;
  },
  getServerSnapshot(): CartState {
    return EMPTY;
  },
  add(
    storeId: string,
    storeName: string,
    product: { id: string; name: string; unit: string; price: number },
  ) {
    ensureHydrated();
    const sameStore = state.storeId === storeId;
    const baseLines = sameStore ? state.lines : [];
    const existing = baseLines.find((l) => l.productId === product.id);
    const lines = existing
      ? baseLines.map((l) => (l.productId === product.id ? { ...l, qty: l.qty + 1 } : l))
      : [
          ...baseLines,
          {
            productId: product.id,
            storeId,
            name: product.name,
            unit: product.unit,
            price: product.price,
            qty: 1,
          },
        ];
    state = { storeId, storeName, lines };
    persist();
  },
  setQty(productId: string, qty: number) {
    ensureHydrated();
    let lines: CartLine[];
    if (qty <= 0) lines = state.lines.filter((l) => l.productId !== productId);
    else lines = state.lines.map((l) => (l.productId === productId ? { ...l, qty } : l));
    state =
      lines.length === 0 ? { storeId: null, storeName: null, lines: [] } : { ...state, lines };
    persist();
  },
  clear() {
    state = { storeId: null, storeName: null, lines: [] };
    persist();
  },
};

export const useCart = () =>
  useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);

export const cartTotals = (lines: CartLine[]) => {
  const itemCount = lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = lines.reduce((n, l) => n + l.qty * l.price, 0);
  return { itemCount, subtotal };
};
