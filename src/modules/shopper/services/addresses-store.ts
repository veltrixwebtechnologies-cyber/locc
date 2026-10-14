import { useSyncExternalStore } from "react";

export interface Address {
  id: string;
  label: string;
  line: string;
  lat: number | null;
  lng: number | null;
}

const KEY = "localshore.addresses.v2";

const DEFAULTS: Address[] = [];

let state: Address[] = DEFAULTS;
let hydrated = false;
const listeners = new Set<() => void>();

const persist = () => {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
};
const ensure = () => {
  if (hydrated || typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Address[];
      if (Array.isArray(parsed)) state = parsed;
    }
  } catch {
    state = DEFAULTS;
  }
  hydrated = true;
};

export const addressesStore = {
  subscribe(l: () => void) {
    ensure();
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot() {
    ensure();
    return state;
  },
  getServerSnapshot(): Address[] {
    return DEFAULTS;
  },
  add(a: Omit<Address, "id">) {
    const item: Address = { ...a, id: globalThis.crypto?.randomUUID?.() ?? `a${Date.now()}` };
    state = [...state, item];
    persist();
    return item;
  },
  remove(id: string) {
    state = state.filter((a) => a.id !== id);
    persist();
  },
  update(id: string, patch: Partial<Omit<Address, "id">>) {
    state = state.map((a) => (a.id === id ? { ...a, ...patch } : a));
    persist();
  },
};

export const useAddresses = () =>
  useSyncExternalStore(
    addressesStore.subscribe,
    addressesStore.getSnapshot,
    addressesStore.getServerSnapshot,
  );
