import { useSyncExternalStore } from "react";

export interface PaymentMethod {
  id: string;
  type: "upi" | "card" | "netbanking";
  title: string;
  subtitle: string;
  isDefault: boolean;
  icon?: string;
}

export interface DeliveryPreferences {
  contactless: boolean;
  callBeforeDelivery: boolean;
  preferredSlot: string; // e.g. "Morning (8 AM - 12 PM)"
  alternatePhone: string;
  instructions: string;
}

export interface NotificationSettings {
  // Orders
  orderConfirmation: boolean;
  orderStatus: boolean;
  outForDelivery: boolean;
  delivered: boolean;
  cancellation: boolean;
  refund: boolean;
  // Shopping
  priceDrops: boolean;
  wishlistUpdates: boolean;
  backInStock: boolean;
  // LocalShore
  nearbyShopOffers: boolean;
  newLocalShops: boolean;
  localDeals: boolean;
  recommendations: boolean;
  // Marketing
  promotionalOffers: boolean;
  coupons: boolean;
  personalizedDeals: boolean;
}

export interface RewardTransaction {
  id: string;
  title: string;
  date: string;
  points: number;
  type: "earned" | "redeemed";
}

export interface RewardItem {
  id: string;
  title: string;
  pointsRequired: number;
  description: string;
  discountCode: string;
}

export interface ProfileExtra {
  avatarUrl?: string;
  bio?: string;
  preferredLanguage: string;
  preferredHub: string;
  rewardsPoints: number;
  rewardHistory: RewardTransaction[];
  paymentMethods: PaymentMethod[];
  deliveryPreferences: DeliveryPreferences;
  notificationSettings: NotificationSettings;
  favoriteShopIds: string[];
  recentlyVisitedShopIds: string[];
  writtenReviews: Array<{
    id: string;
    shopName: string;
    rating: number;
    comment: string;
    date: string;
  }>;
  pendingReviewItems: Array<{
    id: string;
    productName: string;
    shopName: string;
    purchasedDate: string;
  }>;
  savedCoupons: Array<{
    code: string;
    title: string;
    minOrder: number;
    expires: string;
    discountText: string;
  }>;
}

const DEFAULT_PROFILE_EXTRA: ProfileExtra = {
  preferredLanguage: "English",
  preferredHub: "Singanallur",
  rewardsPoints: 280,
  rewardHistory: [
    { id: "r1", title: "Order #LS28491 completed", date: "Yesterday", points: +40, type: "earned" },
    {
      id: "r2",
      title: "Redeemed ₹50 Discount Coupon",
      date: "24 Aug 2026",
      points: -100,
      type: "redeemed",
    },
    {
      id: "r3",
      title: "Order #LS28102 completed",
      date: "20 Aug 2026",
      points: +90,
      type: "earned",
    },
    { id: "r4", title: "Welcome Bonus", date: "15 Aug 2026", points: +250, type: "earned" },
  ],
  paymentMethods: [
    { id: "p1", type: "upi", title: "GPay / UPI", subtitle: "sudhan@okhdfcbank", isDefault: true },
    {
      id: "p2",
      type: "card",
      title: "HDFC Debit Card",
      subtitle: "Visa •••• 4521",
      isDefault: false,
    },
    {
      id: "p3",
      type: "card",
      title: "ICICI Credit Card",
      subtitle: "Mastercard •••• 8812",
      isDefault: false,
    },
  ],
  deliveryPreferences: {
    contactless: true,
    callBeforeDelivery: true,
    preferredSlot: "Anytime",
    alternatePhone: "+91 98765 43210",
    instructions: "Leave package with apartment security guard if unavailable.",
  },
  notificationSettings: {
    orderConfirmation: true,
    orderStatus: true,
    outForDelivery: true,
    delivered: true,
    cancellation: true,
    refund: true,
    priceDrops: true,
    wishlistUpdates: true,
    backInStock: false,
    nearbyShopOffers: true,
    newLocalShops: true,
    localDeals: true,
    recommendations: true,
    promotionalOffers: false,
    coupons: true,
    personalizedDeals: true,
  },
  favoriteShopIds: ["store-sri-lakshmi", "store-annapoorna-sweets", "store-sri-krishna-bakery"],
  recentlyVisitedShopIds: [
    "store-sri-lakshmi",
    "store-modern-mart",
    "store-fresh-basket",
    "store-city-chemists",
  ],
  writtenReviews: [
    {
      id: "rev-1",
      shopName: "Sri Lakshmi Stores",
      rating: 5,
      comment: "Super fast 15-min delivery and extremely fresh groceries!",
      date: "3 days ago",
    },
  ],
  pendingReviewItems: [
    {
      id: "p-rev-1",
      productName: "Aachi Garam Masala 100g",
      shopName: "Sri Lakshmi Stores",
      purchasedDate: "2 days ago",
    },
    {
      id: "p-rev-2",
      productName: "Fresh Butter Bun 200g",
      shopName: "Sri Krishna Bakery",
      purchasedDate: "4 days ago",
    },
  ],
  savedCoupons: [
    {
      code: "LOCAL100",
      title: "₹100 OFF on Local Groceries",
      minOrder: 499,
      expires: "In 2 days",
      discountText: "₹100 OFF",
    },
    {
      code: "FREEDEL",
      title: "Free Instant Delivery",
      minOrder: 199,
      expires: "In 5 days",
      discountText: "FREE DELIVERY",
    },
    {
      code: "SHORE50",
      title: "₹50 Flat Discount on Bakery",
      minOrder: 299,
      expires: "In 7 days",
      discountText: "₹50 OFF",
    },
    {
      code: "FESTIVE20",
      title: "20% OFF on Sweets & Snacks",
      minOrder: 599,
      expires: "In 10 days",
      discountText: "20% OFF",
    },
  ],
};

const STORAGE_KEY = "localshore.profile.v1";
let state: ProfileExtra = DEFAULT_PROFILE_EXTRA;
let isHydrated = false;
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save profile state", e);
    }
  }
  listeners.forEach((l) => l());
}

function ensureHydrated() {
  if (isHydrated || typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...DEFAULT_PROFILE_EXTRA, ...parsed };
    }
  } catch {
    state = DEFAULT_PROFILE_EXTRA;
  }
  isHydrated = true;
}

export const profileStore = {
  subscribe(l: () => void) {
    ensureHydrated();
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot() {
    ensureHydrated();
    return state;
  },
  getServerSnapshot() {
    return DEFAULT_PROFILE_EXTRA;
  },
  updateDeliveryPreferences(patch: Partial<DeliveryPreferences>) {
    state = {
      ...state,
      deliveryPreferences: { ...state.deliveryPreferences, ...patch },
    };
    persist();
  },
  toggleNotification(key: keyof NotificationSettings) {
    state = {
      ...state,
      notificationSettings: {
        ...state.notificationSettings,
        [key]: !state.notificationSettings[key],
      },
    };
    persist();
  },
  addPaymentMethod(method: Omit<PaymentMethod, "id">) {
    const newMethod: PaymentMethod = {
      ...method,
      id: `pay_${Date.now()}`,
    };
    state = {
      ...state,
      paymentMethods: [...state.paymentMethods, newMethod],
    };
    persist();
  },
  deletePaymentMethod(id: string) {
    state = {
      ...state,
      paymentMethods: state.paymentMethods.filter((p) => p.id !== id),
    };
    persist();
  },
  setDefaultPayment(id: string) {
    state = {
      ...state,
      paymentMethods: state.paymentMethods.map((p) => ({
        ...p,
        isDefault: p.id === id,
      })),
    };
    persist();
  },
  toggleFavoriteShop(shopId: string) {
    const exists = state.favoriteShopIds.includes(shopId);
    state = {
      ...state,
      favoriteShopIds: exists
        ? state.favoriteShopIds.filter((id) => id !== shopId)
        : [...state.favoriteShopIds, shopId],
    };
    persist();
  },
  redeemReward(item: RewardItem) {
    if (state.rewardsPoints < item.pointsRequired) {
      throw new Error("Insufficient Shore Points balance.");
    }
    const newTx: RewardTransaction = {
      id: `tx_${Date.now()}`,
      title: `Redeemed ${item.title}`,
      date: "Just now",
      points: -item.pointsRequired,
      type: "redeemed",
    };
    state = {
      ...state,
      rewardsPoints: state.rewardsPoints - item.pointsRequired,
      rewardHistory: [newTx, ...state.rewardHistory],
    };
    persist();
  },
  submitReview(pendingId: string, rating: number, comment: string) {
    const item = state.pendingReviewItems.find((p) => p.id === pendingId);
    if (!item) return;
    const newReview = {
      id: `rev_${Date.now()}`,
      shopName: item.shopName,
      rating,
      comment,
      date: "Just now",
    };
    state = {
      ...state,
      pendingReviewItems: state.pendingReviewItems.filter((p) => p.id !== pendingId),
      writtenReviews: [newReview, ...state.writtenReviews],
    };
    persist();
  },
  updateProfileDetails(patch: { preferredLanguage?: string; preferredHub?: string; bio?: string }) {
    state = { ...state, ...patch };
    persist();
  },
};

export function useProfileExtra() {
  return useSyncExternalStore(
    profileStore.subscribe,
    profileStore.getSnapshot,
    profileStore.getServerSnapshot,
  );
}
