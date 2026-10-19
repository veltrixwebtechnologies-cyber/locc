import { cartStore, replaceCartState, type CartLine } from "./cart-store";

export interface CartItemRecord {
  id?: string;
  user_id: string;
  shop_id: string;
  shop_name?: string | null;
  product_id: string;
  product_name: string;
  unit: string;
  price: number;
  quantity: number;
  available_stock?: number | null;
  image_url?: string | null;
  category?: string | null;
  created_at?: string;
  updated_at?: string;
}

const GUEST_STORAGE_KEY = "localshore.cart.guest.v2";
const LEGACY_STORAGE_KEY = "localshore.cart.v1";
const userStorageKey = (userId: string) => `localshore.cart.user.${userId}.v2`;

let activeUserId: string | null = null;
let isRestored = false;
let isSyncing = false;
let initialized = false;
let activeMergePromise: Promise<void> | null = null;
let lastSyncedSnapshot: string = "";

async function getSupabaseClient() {
  try {
    const mod = await import("@/integrations/supabase/client");
    return mod.supabase;
  } catch {
    return null;
  }
}

let hasShownWelcomeToastForUser: string | null = null;

async function showWelcomeBackToast(userId?: string) {
  if (typeof window === "undefined") return;

  // Never show welcome toast if user is already viewing cart or checkout
  const pathname = (window.location.pathname || "").toLowerCase();
  if (pathname.includes("/cart") || pathname.includes("/checkout")) {
    return;
  }

  // Prevent multiple toasts for the same user in the same session
  if (userId) {
    if (hasShownWelcomeToastForUser === userId) return;
    const sessionKey = `localshore_welcome_toast_${userId}`;
    try {
      if (window.sessionStorage.getItem(sessionKey)) return;
      window.sessionStorage.setItem(sessionKey, "1");
    } catch {}
    hasShownWelcomeToastForUser = userId;
  }

  try {
    const { toast } = await import("sonner");
    toast("Welcome back! Your saved cart is ready.", {
      id: "welcome-back-cart-toast",
      action: {
        label: "View Cart",
        onClick: () => {
          if (typeof window !== "undefined") {
            window.location.assign("/cart");
          }
        },
      },
      duration: 4000,
    });
  } catch {
    // Non-UI environment
  }
}

export function readStoredGuestCart(): {
  storeId: string | null;
  storeName: string | null;
  lines: CartLine[];
} {
  if (typeof window === "undefined") return { storeId: null, storeName: null, lines: [] };
  try {
    const raw =
      window.localStorage.getItem(GUEST_STORAGE_KEY) ||
      window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.lines)) return parsed;
    }
  } catch {}
  return { storeId: null, storeName: null, lines: [] };
}

export function writeStoredGuestCart(cart: {
  storeId: string | null;
  storeName: string | null;
  lines: CartLine[];
}) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(cart));
  } catch {}
}

export function clearStoredGuestCart() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(GUEST_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {}
}

export function readStoredUserCart(userId: string): {
  storeId: string | null;
  storeName: string | null;
  lines: CartLine[];
} {
  if (typeof window === "undefined" || !userId)
    return { storeId: null, storeName: null, lines: [] };
  try {
    const raw = window.localStorage.getItem(userStorageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.lines)) return parsed;
    }
  } catch {}
  return { storeId: null, storeName: null, lines: [] };
}

export function writeStoredUserCart(
  userId: string,
  cart: {
    storeId: string | null;
    storeName: string | null;
    lines: CartLine[];
  },
) {
  if (typeof window === "undefined" || !userId) return;
  try {
    window.localStorage.setItem(userStorageKey(userId), JSON.stringify(cart));
  } catch {}
}

/**
 * Intelligent Cart Merge Algorithm:
 * - Composite Key: (shop_id, product_id)
 * - Identical products from different shops remain separate.
 * - Same product from the same shop increments quantity.
 * - Caps quantity at available stock.
 * - Preserves server-side trusted pricing and product details.
 */
export function mergeCarts(
  accountLines: CartLine[],
  guestLines: CartLine[],
): CartLine[] {
  const mergedMap = new Map<string, CartLine>();

  // 1. Seed with account lines (trusted prices)
  for (const line of accountLines) {
    if (!line || !line.productId || !line.storeId || line.qty <= 0) continue;
    const key = `${line.storeId}:${line.productId}`;
    mergedMap.set(key, { ...line });
  }

  // 2. Merge guest lines
  for (const gLine of guestLines) {
    if (!gLine || !gLine.productId || !gLine.storeId || gLine.qty <= 0) continue;
    const key = `${gLine.storeId}:${gLine.productId}`;
    const existing = mergedMap.get(key);

    if (existing) {
      const availableStock = existing.availableStock ?? gLine.availableStock;
      const combinedQty = existing.qty + gLine.qty;
      const cappedQty = availableStock ? Math.min(combinedQty, availableStock) : combinedQty;
      mergedMap.set(key, {
        ...existing,
        availableStock,
        qty: Math.max(1, cappedQty),
      });
    } else {
      const cappedQty = gLine.availableStock
        ? Math.min(gLine.qty, gLine.availableStock)
        : gLine.qty;
      mergedMap.set(key, {
        ...gLine,
        qty: Math.max(1, cappedQty),
      });
    }
  }

  return Array.from(mergedMap.values());
}

export async function fetchRemoteCart(userId: string): Promise<CartLine[]> {
  const supabase = await getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await (supabase as any)
      .from("cart_items")
      .select("*")
      .eq("user_id", userId);

    if (error || !Array.isArray(data)) {
      return [];
    }

    return data
      .map((row: any) => ({
        productId: String(row.product_id),
        storeId: String(row.shop_id),
        name: String(row.product_name),
        unit: String(row.unit || "item"),
        price: Number(row.price),
        qty: Number(row.quantity),
        availableStock: row.available_stock != null ? Number(row.available_stock) : undefined,
        imageUrl: row.image_url || undefined,
        category: row.category || undefined,
      }))
      .filter((l) => Number.isFinite(l.price) && l.price >= 0 && l.qty > 0);
  } catch (err) {
    console.warn("[LocalShore cart] Error fetching remote cart", err);
    return [];
  }
}

export async function saveRemoteCart(
  userId: string,
  lines: CartLine[],
  storeName?: string | null,
): Promise<boolean> {
  const supabase = await getSupabaseClient();
  if (!supabase) return false;

  try {
    if (lines.length === 0) {
      await (supabase as any).from("cart_items").delete().eq("user_id", userId);
      return true;
    }

    // 1. Upsert active lines
    const payload = lines.map((l) => ({
      user_id: userId,
      shop_id: l.storeId,
      shop_name: storeName || undefined,
      product_id: l.productId,
      product_name: l.name,
      unit: l.unit,
      price: l.price,
      quantity: l.qty,
      available_stock: l.availableStock,
      image_url: l.imageUrl,
      category: l.category,
      updated_at: new Date().toISOString(),
    }));

    const { error: upsertErr } = await (supabase as any).from("cart_items").upsert(payload, {
      onConflict: "user_id,shop_id,product_id",
    });

    if (upsertErr) {
      console.warn("[LocalShore cart] Error upserting remote cart", upsertErr);
      return false;
    }

    // 2. Clean up any deleted items in DB not in lines
    const activeProductIds = lines.map((l) => l.productId);
    if (activeProductIds.length > 0) {
      await (supabase as any)
        .from("cart_items")
        .delete()
        .eq("user_id", userId)
        .not("product_id", "in", `(${activeProductIds.join(",")})`);
    }

    return true;
  } catch (err) {
    console.warn("[LocalShore cart] Error saving remote cart", err);
    return false;
  }
}

export async function deleteRemoteCart(userId: string): Promise<boolean> {
  const supabase = await getSupabaseClient();
  if (!supabase) return false;
  try {
    await (supabase as any).from("cart_items").delete().eq("user_id", userId);
    return true;
  } catch {
    return false;
  }
}

export const persistentCart = {
  isRestored(): boolean {
    return isRestored;
  },

  getActiveUserId(): string | null {
    return activeUserId;
  },

  init() {
    if (initialized || typeof window === "undefined") return;
    initialized = true;

    // Listen to in-memory cart changes and persist them to client storage & remote DB
    cartStore.subscribe(() => {
      if (isSyncing) return;
      const snapshot = cartStore.getSnapshot();
      const serialized = JSON.stringify(snapshot.lines);
      if (serialized === lastSyncedSnapshot) return;
      lastSyncedSnapshot = serialized;

      if (activeUserId) {
        writeStoredUserCart(activeUserId, snapshot);
        void saveRemoteCart(activeUserId, snapshot.lines, snapshot.storeName);
      } else {
        writeStoredGuestCart(snapshot);
      }
    });
  },

  async handleLogin(userId: string, isExplicitLogin = false) {
    if (!userId) return;
    activeUserId = userId;
    this.init();

    // 1. Immediately restore user's local cache so there is ZERO flicker
    const cachedUserCart = readStoredUserCart(userId);
    const guestCart = readStoredGuestCart();

    if (cachedUserCart.lines.length > 0 && guestCart.lines.length === 0) {
      replaceCartState(cachedUserCart, { skipPersist: true });
      lastSyncedSnapshot = JSON.stringify(cachedUserCart.lines);
    }

    // 2. Prevent concurrent merges
    if (activeMergePromise) return activeMergePromise;

    activeMergePromise = (async () => {
      isSyncing = true;
      try {
        // Fetch remote cart from Supabase
        const remoteLines = await fetchRemoteCart(userId);
        const baseAccountLines =
          remoteLines.length > 0 ? remoteLines : cachedUserCart.lines;

        // Perform merge with any guest items added prior to login
        const mergedLines = mergeCarts(baseAccountLines, guestCart.lines);

        const storeId =
          mergedLines.length > 0
            ? mergedLines[0].storeId
            : null;
        const storeName =
          mergedLines.length > 0
            ? guestCart.storeName || cachedUserCart.storeName || "Local shop"
            : null;

        const mergedCart = { storeId, storeName, lines: mergedLines };

        // Save merged cart to DB
        await saveRemoteCart(userId, mergedLines, storeName);

        // Update user storage cache
        writeStoredUserCart(userId, mergedCart);

        // Update in-memory cart state
        replaceCartState(mergedCart, { skipPersist: true });
        lastSyncedSnapshot = JSON.stringify(mergedLines);

        // Clear guest cart ONLY AFTER merge has been safely persisted
        clearStoredGuestCart();

        isRestored = true;

        // Show welcome back toast if restored cart has items and this was an explicit login
        if (isExplicitLogin && mergedLines.length > 0) {
          void showWelcomeBackToast(userId);
        }
      } catch (err) {
        console.warn("[LocalShore cart] Login merge error", err);
      } finally {
        isSyncing = false;
        isRestored = true;
        activeMergePromise = null;
      }
    })();

    return activeMergePromise;
  },

  handleLogout() {
    activeUserId = null;
    isRestored = true;
    lastSyncedSnapshot = "";
    hasShownWelcomeToastForUser = null;

    // Reset in-memory cart to empty guest cart without deleting DB records
    cartStore.clear();

    // Load any existing guest cart
    const guestCart = readStoredGuestCart();
    if (guestCart.lines.length > 0) {
      replaceCartState(guestCart);
    }
  },

  async clearPurchased(userId?: string | null) {
    const targetUserId = userId || activeUserId;
    if (targetUserId) {
      writeStoredUserCart(targetUserId, { storeId: null, storeName: null, lines: [] });
      await deleteRemoteCart(targetUserId);
    }
    clearStoredGuestCart();
    cartStore.clear();
  },
};
