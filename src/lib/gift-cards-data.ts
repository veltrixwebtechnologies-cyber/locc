// ── LocalShore Gift Cards Data Layer ──────────────────────────────────────

export interface GiftCardDesign {
  id: string;
  name: string;
  gradient: string;
  emoji: string;
}

export interface GiftCardDenomination {
  value: number;
  label: string;
  popular?: boolean;
}

export interface GiftCardType {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface GiftCardInstance {
  id: string;
  code: string;
  type: "localshore" | "brand" | "shop";
  balance: number;
  originalAmount: number;
  status: "active" | "redeemed" | "expired" | "gifted";
  recipientName?: string;
  senderName?: string;
  message?: string;
  designId: string;
  expiresAt: string;
  createdAt: string;
  transactions: GiftCardTx[];
}

export interface GiftCardTx {
  id: string;
  amount: number;
  type: "credit" | "debit";
  description: string;
  date: string;
}

export const GIFT_CARD_DESIGNS: GiftCardDesign[] = [
  { id: "classic", name: "Classic Shore", gradient: "from-purple-700 to-purple-900", emoji: "🏪" },
  { id: "festive", name: "Festive Celebration", gradient: "from-amber-500 to-orange-600", emoji: "🎉" },
  { id: "birthday", name: "Happy Birthday", gradient: "from-pink-500 to-rose-600", emoji: "🎂" },
  { id: "thankyou", name: "Thank You", gradient: "from-teal-500 to-emerald-600", emoji: "💚" },
  { id: "wedding", name: "Wedding Wishes", gradient: "from-amber-400 to-yellow-500", emoji: "💍" },
  { id: "local_love", name: "Local Love", gradient: "from-purple-500 to-fuchsia-600", emoji: "❤️" },
];

export const GIFT_CARD_DENOMINATIONS: GiftCardDenomination[] = [
  { value: 250, label: "₹250" },
  { value: 500, label: "₹500", popular: true },
  { value: 1000, label: "₹1,000", popular: true },
  { value: 2500, label: "₹2,500" },
];

export const GIFT_CARD_TYPES: GiftCardType[] = [
  { id: "localshore", name: "LocalShore Gift Card", description: "Use across all eligible LocalShore purchases", icon: "🏪" },
  { id: "brand", name: "Brand Gift Cards", description: "Purchase gift cards from participating brands", icon: "🏷️" },
  { id: "shop", name: "Local Shop Gift Cards", description: "Gift cards for specific partner shops", icon: "🛒" },
];

export const SAMPLE_GIFT_CARDS: GiftCardInstance[] = [
  {
    id: "gc1", code: "LS-GIFT-8A2F", type: "localshore", balance: 350, originalAmount: 500,
    status: "active", senderName: "Priya", message: "Happy birthday! Shop local 🎉",
    designId: "birthday", expiresAt: "2027-02-28", createdAt: "2026-08-15",
    transactions: [
      { id: "gct1", amount: 500, type: "credit", description: "Gift card received", date: "2026-08-15" },
      { id: "gct2", amount: -150, type: "debit", description: "Order #LS12345", date: "2026-08-20" },
    ],
  },
  {
    id: "gc2", code: "LS-GIFT-3K7P", type: "localshore", balance: 1000, originalAmount: 1000,
    status: "active", designId: "classic", expiresAt: "2027-06-30", createdAt: "2026-08-25",
    transactions: [
      { id: "gct3", amount: 1000, type: "credit", description: "Self purchase", date: "2026-08-25" },
    ],
  },
];
