import { useSyncExternalStore } from "react";
import type { CartLine } from "./cart-store";

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "assigned"
  | "picking"
  | "on_the_way"
  | "delivered";

export const orderStatusFlow: OrderStatus[] = [
  "placed",
  "confirmed",
  "assigned",
  "picking",
  "on_the_way",
  "delivered",
];

export const orderStatusLabel: Record<OrderStatus, string> = {
  placed: "Order placed",
  confirmed: "Store confirmed",
  assigned: "Delivery partner assigned",
  picking: "Picking up at store",
  on_the_way: "On the way",
  delivered: "Delivered",
};

export interface Order {
  id: string;
  code: string;
  storeId: string;
  storeName: string;
  lines: CartLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  address: string;
  destination: { lat: number; lng: number };
  paymentMethod: string;
  createdAt: number;
  status: OrderStatus;
  partner?: { name: string; rating: number };
  etaMin: number;
  distanceKm: number;
}

const KEY = "localshore.orders.v1";

const EMPTY_ORDERS: Order[] = [];
let orders: Order[] = EMPTY_ORDERS;
let hydrated = false;
const listeners = new Set<() => void>();

const persist = () => {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(orders));
  listeners.forEach((l) => l());
};

const ensureHydrated = () => {
  if (hydrated || typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) orders = JSON.parse(raw);
  } catch {
    orders = EMPTY_ORDERS;
  }
  hydrated = true;
};

export const ordersStore = {
  subscribe(l: () => void) {
    ensureHydrated();
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot() {
    ensureHydrated();
    return orders;
  },
  getServerSnapshot(): Order[] {
    return EMPTY_ORDERS;
  },
  place(order: Omit<Order, "id" | "code" | "createdAt" | "status">) {
    ensureHydrated();
    const id = `o_${Date.now().toString(36)}`;
    const code = `LS-${Math.floor(Math.random() * 9000 + 1000)}`;
    const newOrder: Order = { ...order, id, code, createdAt: Date.now(), status: "placed" };
    orders = [newOrder, ...orders.filter((o) => o.id !== id)];
    persist();
    // Simulate status progression
    if (typeof window !== "undefined") {
      const advance = (i: number, next: OrderStatus, extra?: Partial<Order>) => {
        window.setTimeout(() => {
          const idx = orders.findIndex((x) => x.id === id);
          if (idx === -1) return;
          const updated: Order = { ...orders[idx], status: next, ...(extra ?? {}) };
          orders = orders.map((o, i) => (i === idx ? updated : o));
          persist();
        }, i);
      };
      advance(4000, "confirmed");
      advance(9000, "assigned", { partner: { name: "Ravi Kumar", rating: 4.8 } });
      advance(15000, "picking");
      advance(22000, "on_the_way");
      advance(35000, "delivered");
    }
    return newOrder;
  },
  get(id: string) {
    ensureHydrated();
    return orders.find((o) => o.id === id);
  },
};

export const useOrders = () =>
  useSyncExternalStore(
    ordersStore.subscribe,
    ordersStore.getSnapshot,
    ordersStore.getServerSnapshot,
  );
