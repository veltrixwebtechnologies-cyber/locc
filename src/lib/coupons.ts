import { supabase } from "@/integrations/supabase/client";

export interface AvailableCoupon {
  code: string;
  title: string;
  description: string;
  discountType: "percent" | "flat" | "free_shipping";
  discountValue: number;
  maxDiscount?: number;
  minOrder: number;
  badge?: string;
}

export const AVAILABLE_COUPONS: AvailableCoupon[] = [
  {
    code: "LOCALSHORE50",
    title: "50% OFF on Local Marketplace",
    description: "Get 50% discount up to ₹100 on orders above ₹150.",
    discountType: "percent",
    discountValue: 50,
    maxDiscount: 100,
    minOrder: 150,
    badge: "POPULAR",
  },
  {
    code: "WELCOME50",
    title: "Flat ₹50 OFF for New Shoppers",
    description: "Flat ₹50 discount on orders above ₹200.",
    discountType: "flat",
    discountValue: 50,
    minOrder: 200,
    badge: "WELCOME",
  },
  {
    code: "FREESHIP",
    title: "Free Delivery on Any Order",
    description: "Waives 100% of delivery fee for orders above ₹100.",
    discountType: "free_shipping",
    discountValue: 0,
    minOrder: 100,
    badge: "FREE DELIVERY",
  },
  {
    code: "FIRST100",
    title: "Flat ₹100 OFF Mega Discount",
    description: "Flat ₹100 savings on orders above ₹300.",
    discountType: "flat",
    discountValue: 100,
    minOrder: 300,
    badge: "BEST VALUE",
  },
  {
    code: "SAVE20",
    title: "20% OFF Daily Groceries",
    description: "Save 20% up to ₹60 on orders above ₹100.",
    discountType: "percent",
    discountValue: 20,
    maxDiscount: 60,
    minOrder: 100,
  },
];

export interface DetailedBillBreakdown {
  subtotal: number;
  gstAmount: number; // 5% GST included in price or itemized
  platformFee: number; // Standard ₹5 platform & packaging fee
  deliveryFee: number; // Calculated or effective delivery fee
  isFreeDelivery: boolean;
  couponCode?: string;
  discountType?: "percent" | "flat" | "free_shipping";
  discountAmount: number;
  total: number;
  savingsTotal: number;
}

export function calculateBillBreakdown({
  subtotal,
  couponQuote,
}: {
  subtotal: number;
  rawDeliveryFee: number;
  couponQuote?: {
    code: string;
    discountType: "percent" | "flat" | "free_shipping";
    discountAmount: number;
    shippingFee?: number;
    total?: number;
  } | null;
}): DetailedBillBreakdown {
  // 5% GST estimate
  const gstAmount = Math.round(subtotal * 0.05);

  // Match the current order RPC's persisted quote: ₹25 delivery, no separate
  // platform fee. Keep this in sync with quote_coupon/place_order migrations.
  const platformFee = 0;

  let effectiveDeliveryFee = subtotal > 0 ? 25 : 0;
  let discountAmount = 0;

  if (couponQuote) {
    if (couponQuote.discountType === "free_shipping") {
      effectiveDeliveryFee = 0;
      discountAmount = couponQuote.discountAmount;
    } else {
      discountAmount = Math.min(couponQuote.discountAmount, subtotal);
      if (couponQuote.shippingFee !== undefined) {
        effectiveDeliveryFee = couponQuote.shippingFee;
      }
    }
  }

  const isFreeDelivery = effectiveDeliveryFee === 0;
  const quotedTotal = Number(couponQuote?.total);
  const totalDiscount = couponQuote?.discountType === "free_shipping" ? 0 : discountAmount;
  const total = Number.isFinite(quotedTotal)
    ? Math.max(0, quotedTotal)
    : Math.max(0, subtotal + effectiveDeliveryFee - totalDiscount);
  const savingsTotal = discountAmount;

  return {
    subtotal,
    gstAmount,
    platformFee,
    deliveryFee: effectiveDeliveryFee,
    isFreeDelivery,
    couponCode: couponQuote?.code,
    discountType: couponQuote?.discountType,
    discountAmount,
    total,
    savingsTotal,
  };
}

export async function evaluateCoupon({
  code,
  subtotal,
  rawDeliveryFee,
  items = [],
}: {
  code: string;
  subtotal: number;
  rawDeliveryFee: number;
  items?: { product_id: string; qty: number }[];
}) {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    throw new Error("Please enter a valid coupon code.");
  }

  // 1. Try Supabase RPC first if database connection is available
  try {
    const { data, error } = await (supabase as any).rpc("quote_coupon", {
      p_code: cleanCode,
      p_items: items,
    });

    if (!error && data) {
      const quote = data as any;
      const discountAmount = Number(quote.discount_amount);
      const shippingFee = Number(quote.shipping_fee);
      return {
        code: quote.code || cleanCode,
        discountType: (quote.discount_type || "flat") as "percent" | "flat" | "free_shipping",
        discountAmount,
        shippingFee,
        total: Number(quote.total),
        description: `Coupon ${quote.code} applied successfully!`,
      };
    }
  } catch {
    // Fall through to client-side fallback rule engine
  }

  // 2. Client-side fallback rule engine for instant feedback and demo products
  return evaluateSampleCoupon(cleanCode, subtotal);
}

/** Shared prototype coupon rules, without a live database request. */
export function evaluateSampleCoupon(code: string, subtotal: number) {
  const cleanCode = code.trim().toUpperCase();
  const matched = AVAILABLE_COUPONS.find((c) => c.code === cleanCode);
  if (!matched) {
    throw new Error(
      `Coupon code "${cleanCode}" is invalid. Try using LOCALSHORE50, WELCOME50, or FREESHIP.`,
    );
  }

  if (subtotal < matched.minOrder) {
    throw new Error(
      `Coupon "${cleanCode}" requires a minimum order subtotal of ₹${matched.minOrder}. Add ₹${
        matched.minOrder - subtotal
      } more to apply!`,
    );
  }

  let discountAmount = 0;
  if (matched.discountType === "percent") {
    const rawDiscount = (subtotal * matched.discountValue) / 100;
    discountAmount = matched.maxDiscount ? Math.min(rawDiscount, matched.maxDiscount) : rawDiscount;
  } else if (matched.discountType === "flat") {
    discountAmount = Math.min(matched.discountValue, subtotal);
  } else if (matched.discountType === "free_shipping") {
    discountAmount = 25;
  }

  discountAmount = Math.round(discountAmount);

  return {
    code: matched.code,
    discountType: matched.discountType,
    discountAmount,
    shippingFee: matched.discountType === "free_shipping" ? 0 : undefined,
    total: Math.max(
      0,
      subtotal + (matched.discountType === "free_shipping" ? 0 : 25) -
        (matched.discountType === "free_shipping" ? 0 : discountAmount),
    ),
    description: matched.description,
  };
}
