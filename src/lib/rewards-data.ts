// ── LocalShore Rewards Data Layer ──────────────────────────────────────────

export interface RewardTier {
  id: string;
  name: string;
  minPoints: number;
  color: string;
  benefits: string[];
}

export interface RewardTransaction {
  id: string;
  type: "earned" | "redeemed" | "expired" | "bonus" | "referral";
  points: number;
  description: string;
  orderId?: string;
  date: string;
}

export interface RewardAction {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: string;
  repeatable: boolean;
}

export interface RedeemOption {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  type: "discount" | "coupon" | "delivery" | "gift_card" | "brand_offer" | "shop_offer";
  value: string;
}

export const REWARD_TIERS: RewardTier[] = [
  {
    id: "bronze",
    name: "Bronze",
    minPoints: 0,
    color: "#CD7F32",
    benefits: ["Earn 1 point per ₹10 spent", "Birthday bonus points"],
  },
  {
    id: "silver",
    name: "Silver",
    minPoints: 1000,
    color: "#C0C0C0",
    benefits: ["Earn 1.5x points", "Free delivery on orders above ₹500", "Priority support"],
  },
  {
    id: "gold",
    name: "Gold",
    minPoints: 3000,
    color: "#FFD700",
    benefits: [
      "Earn 2x points",
      "Free delivery on all orders",
      "Exclusive deals",
      "Early access to sales",
    ],
  },
  {
    id: "platinum",
    name: "Platinum",
    minPoints: 7500,
    color: "#E5E4E2",
    benefits: [
      "Earn 3x points",
      "Free delivery always",
      "VIP support",
      "Exclusive travel offers",
      "Anniversary rewards",
    ],
  },
];

export const REWARD_ACTIONS: RewardAction[] = [
  {
    id: "purchase",
    title: "Make a purchase",
    description: "Earn points on every order",
    points: 10,
    icon: "🛍️",
    repeatable: true,
  },
  {
    id: "first_order",
    title: "Place your first order",
    description: "Welcome bonus for new customers",
    points: 200,
    icon: "🎉",
    repeatable: false,
  },
  {
    id: "repeat_order",
    title: "Order from the same shop",
    description: "Support your favorite local shops",
    points: 25,
    icon: "🔄",
    repeatable: true,
  },
  {
    id: "referral",
    title: "Refer a friend",
    description: "When your friend places their first order",
    points: 300,
    icon: "👥",
    repeatable: true,
  },
  {
    id: "product_review",
    title: "Review a product",
    description: "Share your honest feedback",
    points: 15,
    icon: "⭐",
    repeatable: true,
  },
  {
    id: "shop_review",
    title: "Review a shop",
    description: "Help others discover great shops",
    points: 20,
    icon: "🏪",
    repeatable: true,
  },
  {
    id: "complete_profile",
    title: "Complete your profile",
    description: "Add all your details",
    points: 50,
    icon: "✅",
    repeatable: false,
  },
  {
    id: "birthday",
    title: "Birthday reward",
    description: "A special gift on your special day",
    points: 100,
    icon: "🎂",
    repeatable: false,
  },
];

export interface RedeemOption {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  type: "discount" | "coupon" | "delivery" | "gift_card" | "brand_offer" | "shop_offer";
  value: string;
  category: string;
  shopName?: string;
  shopId?: string;
  minOrder?: number;
  expiryDays?: number;
  icon?: string;
  popular?: boolean;
  featured?: boolean;
}

export const REWARD_CATEGORIES = [
  { id: "all", name: "All Rewards", icon: "🎁" },
  { id: "local_shops", name: "Local Shops", icon: "🏪" },
  { id: "coupons", name: "LocalShore Coupons", icon: "🏷️" },
  { id: "food", name: "Food & Bakery", icon: "🍰" },
  { id: "fashion", name: "Fashion & Silk", icon: "👗" },
  { id: "beauty", name: "Beauty & Personal", icon: "💄" },
  { id: "electronics", name: "Electronics", icon: "📱" },
  { id: "grocery", name: "Pantry & Groceries", icon: "🌾" },
];

export const REDEEM_OPTIONS: RedeemOption[] = [
  {
    id: "r1",
    title: "₹50 OFF LocalShore Coupon",
    description: "Valid on all shops across your neighborhood",
    pointsCost: 500,
    type: "coupon",
    value: "₹50",
    category: "coupons",
    shopName: "LocalShore Marketplace",
    minOrder: 249,
    expiryDays: 30,
    icon: "🎟️",
    popular: true,
    featured: true,
  },
  {
    id: "r2",
    title: "FREE Delivery Pass (3 Orders)",
    description: "Zero delivery fee on your next 3 neighborhood orders",
    pointsCost: 300,
    type: "delivery",
    value: "3x Free Delivery",
    category: "coupons",
    shopName: "LocalShore Express",
    minOrder: 0,
    expiryDays: 45,
    icon: "🚀",
    popular: true,
    featured: true,
  },
  {
    id: "r3",
    title: "₹100 OFF LocalShore Coupon",
    description: "Instant discount on cart totals above ₹499",
    pointsCost: 900,
    type: "coupon",
    value: "₹100",
    category: "coupons",
    shopName: "LocalShore Marketplace",
    minOrder: 499,
    expiryDays: 30,
    icon: "🏷️",
    popular: true,
    featured: true,
  },
  {
    id: "r4",
    title: "₹50 OFF Traditional Sweets",
    description: "Authentic ghee sweets & savories from Sri Krishna Sweets",
    pointsCost: 450,
    type: "shop_offer",
    value: "₹50 OFF",
    category: "local_shops",
    shopName: "Sri Krishna Sweets",
    shopId: "s_krishna_sweets",
    minOrder: 250,
    expiryDays: 15,
    icon: "🍬",
    popular: true,
    featured: true,
  },
  {
    id: "r5",
    title: "15% OFF Organic Fruit Baskets",
    description: "Farm-fresh fruits from Kovai Pazhamudir Nilayam",
    pointsCost: 600,
    type: "shop_offer",
    value: "15% OFF",
    category: "local_shops",
    shopName: "Kovai Pazhamudir Nilayam",
    shopId: "s_kovai_fruits",
    minOrder: 350,
    expiryDays: 20,
    icon: "🍎",
    popular: false,
    featured: true,
  },
  {
    id: "r6",
    title: "₹250 OFF Designer Silk Sarees",
    description: "Exclusive discount at Roja Silk & Fashions showroom",
    pointsCost: 1800,
    type: "shop_offer",
    value: "₹250 OFF",
    category: "fashion",
    shopName: "Roja Silk & Fashions",
    shopId: "s_roja_mart",
    minOrder: 1200,
    expiryDays: 60,
    icon: "👗",
    popular: false,
    featured: false,
  },
  {
    id: "r7",
    title: "₹75 OFF Fresh Meat & Seafood",
    description: "Hygienically packed fresh meat from Annachi Meat Hub",
    pointsCost: 700,
    type: "shop_offer",
    value: "₹75 OFF",
    category: "local_shops",
    shopName: "Annachi Meat Hub",
    shopId: "s_annachi_meat",
    minOrder: 399,
    expiryDays: 14,
    icon: "🍗",
    popular: true,
    featured: false,
  },
  {
    id: "r8",
    title: "₹100 OFF Daily Groceries",
    description: "Valid on pantry & staples at Nilgiris Supermarket",
    pointsCost: 850,
    type: "shop_offer",
    value: "₹100 OFF",
    category: "grocery",
    shopName: "Nilgiris Supermarket",
    shopId: "s_nilgiris_store",
    minOrder: 599,
    expiryDays: 30,
    icon: "🌾",
    popular: true,
    featured: false,
  },
  {
    id: "r9",
    title: "₹500 LocalShore E-Gift Card",
    description: "Universal store credit usable across all verified shops",
    pointsCost: 4000,
    type: "gift_card",
    value: "₹500 Credit",
    category: "coupons",
    shopName: "LocalShore Universal",
    minOrder: 0,
    expiryDays: 90,
    icon: "💳",
    popular: false,
    featured: false,
  },
  {
    id: "r10",
    title: "₹300 OFF Wireless Headphones",
    description: "Valid on audio gear at Local Electronics Hub",
    pointsCost: 2200,
    type: "shop_offer",
    value: "₹300 OFF",
    category: "electronics",
    shopName: "Local Electronics Hub",
    shopId: "s_electronics_hub",
    minOrder: 1500,
    expiryDays: 45,
    icon: "🎧",
    popular: false,
    featured: false,
  },
  {
    id: "r11",
    title: "20% OFF Specialty Bakery & Cakes",
    description: "Custom celebration cakes & fresh pastries",
    pointsCost: 650,
    type: "brand_offer",
    value: "20% OFF",
    category: "food",
    shopName: "The Neighborhood Bakehouse",
    minOrder: 400,
    expiryDays: 20,
    icon: "🍰",
    popular: false,
    featured: false,
  },
  {
    id: "r12",
    title: "₹150 OFF Herbal & Skincare Care",
    description: "Natural organic beauty essentials from BioCare Local",
    pointsCost: 1100,
    type: "brand_offer",
    value: "₹150 OFF",
    category: "beauty",
    shopName: "BioCare Organic Store",
    minOrder: 750,
    expiryDays: 30,
    icon: "💄",
    popular: false,
    featured: false,
  },
];

export const SAMPLE_REWARD_HISTORY: RewardTransaction[] = [
  {
    id: "rt1",
    type: "earned",
    points: 45,
    description: "Order from Sri Krishna Sweets",
    orderId: "LS12345",
    date: "2026-08-28",
  },
  {
    id: "rt2",
    type: "earned",
    points: 25,
    description: "Repeat order bonus — Kovai Pazhamudir",
    orderId: "LS12340",
    date: "2026-08-25",
  },
  {
    id: "rt3",
    type: "redeemed",
    points: -100,
    description: "₹50 discount applied",
    orderId: "LS12338",
    date: "2026-08-22",
  },
  {
    id: "rt4",
    type: "bonus",
    points: 100,
    description: "Festival bonus — Onam special",
    date: "2026-08-20",
  },
  {
    id: "rt5",
    type: "referral",
    points: 300,
    description: "Friend Priya placed first order",
    date: "2026-08-18",
  },
  {
    id: "rt6",
    type: "earned",
    points: 60,
    description: "Order from Annachi Mutton Stall",
    orderId: "LS12330",
    date: "2026-08-15",
  },
  {
    id: "rt7",
    type: "expired",
    points: -50,
    description: "Points expired (unused 90 days)",
    date: "2026-08-10",
  },
  {
    id: "rt8",
    type: "earned",
    points: 15,
    description: "Product review — Idli Batter",
    date: "2026-08-08",
  },
];

export const SAMPLE_REWARDS_SUMMARY = {
  currentPoints: 2450,
  earnedThisMonth: 370,
  expiringPoints: 120,
  expiringDate: "2026-09-30",
  lifetimePoints: 4800,
  currentTier: "silver" as const,
  nextTier: "gold" as const,
  pointsToNextTier: 550,
};

export const USER_REWARDS = {
  pointsBalance: SAMPLE_REWARDS_SUMMARY.currentPoints,
  tier: "Silver",
  cashbackEquivalent: Math.floor(SAMPLE_REWARDS_SUMMARY.currentPoints / 2),
};
