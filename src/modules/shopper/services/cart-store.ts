import type { CartLine } from "@/shared/core/cart";
export type { CartLine } from "@/shared/core/cart";
import { useSyncExternalStore } from "react";

interface CartState {
  storeId: string | null;
  storeName: string | null;
  lines: CartLine[];
}

const KEY = "localshore.cart.v1";

export function sanitizeCart(value: unknown): CartState {
  const empty: CartState = { storeId: null, storeName: null, lines: [] };
  if (!value || typeof value !== "object") return empty;
  const cart = value as Partial<CartState>;
  if (typeof cart.storeId !== "string" || !cart.storeId || !Array.isArray(cart.lines)) return empty;
  const seen = new Set<string>();
  const lines = cart.lines
    .filter((line) => {
      if (
        !line ||
        typeof line !== "object" ||
        typeof line.productId !== "string" ||
        !line.productId ||
        seen.has(line.productId) ||
        line.storeId !== cart.storeId ||
        typeof line.name !== "string" ||
        typeof line.unit !== "string" ||
        !Number.isFinite(line.price) ||
        line.price < 0 ||
        !Number.isSafeInteger(line.qty) ||
        line.qty <= 0 ||
        (line.availableStock !== undefined &&
          (!Number.isSafeInteger(line.availableStock) || line.availableStock < 0))
      )
        return false;
      seen.add(line.productId);
      return true;
    })
    .map((line) => ({ ...line, qty: Math.min(line.qty, line.availableStock ?? line.qty) }))
    .filter((line) => line.qty > 0);
  return lines.length
    ? {
        storeId: cart.storeId,
        storeName: typeof cart.storeName === "string" ? cart.storeName : "Local shop",
        lines,
      }
    : empty;
}

const load = (): CartState => {
  if (typeof window === "undefined") return { storeId: null, storeName: null, lines: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return sanitizeCart(JSON.parse(raw));
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
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Restricted storage must not prevent in-memory cart updates.
    }
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
    product: {
      id: string;
      name: string;
      unit: string;
      price: number;
      stock?: number;
      imageUrl?: string;
      category?: string;
    },
  ) {
    ensureHydrated();
    if (!storeId || !product.id || !Number.isFinite(product.price) || product.price < 0) return;
    if (
      product.stock !== undefined &&
      (!Number.isSafeInteger(product.stock) || product.stock <= 0)
    ) {
      return;
    }
    const sameStore = state.storeId === storeId;
    const previousStoreName = !sameStore && state.lines.length > 0 ? state.storeName : null;
    const baseLines = sameStore ? state.lines : [];
    const existing = baseLines.find((l) => l.productId === product.id);
    const lines = existing
      ? baseLines.map((l) => {
          if (l.productId !== product.id) return l;
          const availableStock = product.stock ?? l.availableStock;
          return {
            ...l,
            availableStock,
            qty: Math.min(l.qty + 1, availableStock ?? l.qty + 1),
          };
        })
      : [
          ...baseLines,
          {
            productId: product.id,
            storeId,
            name: product.name,
            unit: product.unit,
            price: product.price,
            qty: 1,
            availableStock: product.stock,
            imageUrl: product.imageUrl,
            category: product.category,
          },
        ];
    state = { storeId, storeName, lines };
    persist();
  },
  setQty(productId: string, qty: number) {
    ensureHydrated();
    if (!Number.isSafeInteger(qty)) return;
    let lines: CartLine[];
    if (qty <= 0) lines = state.lines.filter((l) => l.productId !== productId);
    else
      lines = state.lines
        .map((l) =>
          l.productId === productId ? { ...l, qty: Math.min(qty, l.availableStock ?? qty) } : l,
        )
        .filter((l) => l.qty > 0);
    state =
      lines.length === 0 ? { storeId: null, storeName: null, lines: [] } : { ...state, lines };
    persist();
  },
  clear() {
    state = { storeId: null, storeName: null, lines: [] };
    persist();
  },
  reconcileStock(stockByProduct: Record<string, number>) {
    ensureHydrated();
    // Keep persisted cart lines intact while checking stock. The server-side
    // place_order RPC is authoritative and must decide whether inventory is
    // still available at order time.
    const lines = state.lines
      .map((line) => {
        const reportedStock = stockByProduct[line.productId];

        // A missing row can be caused by catalog visibility or a transient query
        // failure. Only explicit stock values may alter a persisted cart line.
        if (reportedStock == null || !Number.isFinite(reportedStock)) {
          return line;
        }

        const availableStock = Math.max(0, Math.floor(reportedStock));
        return {
          ...line,
          availableStock,
          qty: Math.min(line.qty, availableStock),
        };
      })
      .filter((line) => line.qty > 0);
    const changed =
      lines.length !== state.lines.length ||
      lines.some(
        (line, index) =>
          line.qty !== state.lines[index]?.qty ||
          line.availableStock !== state.lines[index]?.availableStock,
      );
    if (!changed) return false;
    state = lines.length ? { ...state, lines } : { storeId: null, storeName: null, lines: [] };
    persist();
    return true;
  },
};

export const useCart = () =>
  useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);

export const cartTotals = (lines: CartLine[]) => {
  const itemCount = lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = lines.reduce((n, l) => n + l.qty * l.price, 0);
  return { itemCount, subtotal };
};
