import { useSyncExternalStore } from "react";

const STORAGE_KEY = "localshore.following.v1";

// Default initially followed shops for new users
const DEFAULT_FOLLOWED_SHOP_IDS = [
  "s_paap1", // Ravi's Artisan Bakery
  "s_kiran1", // Meena Fresh Produce
  "s_boutique1", // StyleHub Apparel
  "s_jp_bakery", // Ravi's Bakery JP Nagar
  "s_jp_produce", // Namma Fresh JP Nagar
];

function loadFollowedShops(): Set<string> {
  if (typeof window === "undefined") return new Set(DEFAULT_FOLLOWED_SHOP_IDS);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (e) {
    // Ignore storage parse error
  }
  return new Set(DEFAULT_FOLLOWED_SHOP_IDS);
}

let followedSet: Set<string> = loadFollowedShops();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(followedSet)));
    } catch (e) {
      // Ignore
    }
  }
  // Create a new Set reference so useSyncExternalStore detects reference changes
  followedSet = new Set(followedSet);
  listeners.forEach((listener) => listener());
}

export const followingStore = {
  isFollowing(shopId: string): boolean {
    return followedSet.has(shopId);
  },
  follow(shopId: string) {
    if (!shopId || followedSet.has(shopId)) return;
    followedSet.add(shopId);
    persist();
  },
  unfollow(shopId: string) {
    if (!shopId || !followedSet.has(shopId)) return;
    followedSet.delete(shopId);
    persist();
  },
  toggle(shopId: string): boolean {
    if (!shopId) return false;
    const isNowFollowing = !followedSet.has(shopId);
    if (isNowFollowing) {
      followedSet.add(shopId);
    } else {
      followedSet.delete(shopId);
    }
    persist();
    return isNowFollowing;
  },
  getFollowedShopIds(): string[] {
    return Array.from(followedSet);
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): Set<string> {
    return followedSet;
  },
};

export function useIsFollowing(shopId: string): boolean {
  const set = useSyncExternalStore(
    followingStore.subscribe,
    followingStore.getSnapshot,
    () => followedSet,
  );
  return set.has(shopId);
}

export function useFollowedShopIds(): string[] {
  const set = useSyncExternalStore(
    followingStore.subscribe,
    followingStore.getSnapshot,
    () => followedSet,
  );
  return Array.from(set);
}

