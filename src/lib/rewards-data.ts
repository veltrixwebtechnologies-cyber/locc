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

export const REDEEM_OPTIONS: RedeemOption[] = [
  {
    id: "r1",
    title: "₹50 off next order",
    description: "Min. order ₹299",
    pointsCost: 100,
    type: "discount",
    value: "₹50",
  },
  {
    id: "r2",
    title: "₹150 off next order",
    description: "Min. order ₹699",
    pointsCost: 250,
    type: "discount",
    value: "₹150",
  },
  {
    id: "r3",
    title: "Free delivery (3 orders)",
    description: "No minimum order value",
    pointsCost: 150,
    type: "delivery",
    value: "3x Free Delivery",
  },
  {
    id: "r4",
    title: "₹500 Gift Card",
    description: "Use across all LocalShore shops",
    pointsCost: 800,
    type: "gift_card",
    value: "₹500",
  },
  {
    id: "r5",
    title: "10% off at partner brands",
    description: "Valid for 30 days",
    pointsCost: 200,
    type: "brand_offer",
    value: "10% off",
  },
  {
    id: "r6",
    title: "₹100 off at local shops",
    description: "Support neighborhood stores",
    pointsCost: 150,
    type: "shop_offer",
    value: "₹100",
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
