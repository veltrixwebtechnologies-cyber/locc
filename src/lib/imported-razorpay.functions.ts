import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseCoordinates } from "./coordinates";
import { getImportedCatalogItems } from "@/modules/shopper/services/imported-demo-cart";
import { calculateBillBreakdown, evaluateSampleCoupon } from "./coupons";
import { buildDemoReceipt } from "@/modules/shopper/services/demo-payment";
import { assertCapturedPayment } from "./payment-validation";
import {
  testCredentials,
  signTestCheckout,
  readTestCheckout,
  verifyTestSignature,
} from "./imported-payment-security.server";

interface TestOrderInput {
  shopId: string;
  items: Array<{ product_id: string; qty: number }>;
  address: string;
  latitude: number;
  longitude: number;
  couponCode?: string;
}

async function gateway(path: string, keys: { keyId: string; keySecret: string }, body?: unknown) {
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keys.keyId}:${keys.keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok)
    throw new Error(
      "Razorpay test payment service could not complete this request. Please try again.",
    );
  return response.json();
}

export const createImportedTestOrderFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: TestOrderInput) => {
    if (
      !/^imported:[0-9a-f-]{36}$/i.test(data?.shopId) ||
      !data.address?.trim() ||
      data.address.length > 2000 ||
      !parseCoordinates(data.latitude, data.longitude) ||
      !Array.isArray(data.items) ||
      !data.items.length ||
      data.items.length > 20
    )
      throw new Error("Confirm your shop, basket and delivery address first.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const keys = testCredentials(process.env);
    // imported_shops is intentionally hidden from anon/authenticated table
    // reads. Resolve the selected public listing on the trusted server only;
    // customer sessions may access it solely through the restricted nearby RPC.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: shop, error } = await (supabaseAdmin as any)
      .from("imported_shops")
      .select("id,business_name,category")
      .eq("id", data.shopId.slice(9))
      .maybeSingle();
    if (error) {
      console.error("[imported test checkout] shop lookup failed", {
        code: error.code,
        message: error.message,
      });
      throw new Error("Shop verification is temporarily unavailable. Please retry.");
    }
    if (!shop) throw new Error("This shop listing is no longer available.");
    const catalog = getImportedCatalogItems(shop.category).map((item) => ({
      id: `sample:${data.shopId}:${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      seller_id: data.shopId,
      name: item.name,
      selling_price: item.price,
      stock: 99,
    }));
    const seen = new Set<string>();
    const lines = data.items.map((item) => {
      const product = catalog.find((product) => product.id === item?.product_id);
      if (
        !product ||
        seen.has(item.product_id) ||
        !Number.isSafeInteger(item.qty) ||
        item.qty < 1 ||
        item.qty > 99
      )
        throw new Error("Invalid or unrelated prototype product in basket.");
      seen.add(item.product_id);
      return {
        productId: product.id,
        storeId: data.shopId,
        name: product.name,
        unit: "1 unit",
        price: product.selling_price,
        qty: item.qty,
      };
    });
    const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
    const coupon = data.couponCode ? evaluateSampleCoupon(data.couponCode, subtotal) : null;
    const bill = calculateBillBreakdown({ subtotal, rawDeliveryFee: 25, couponQuote: coupon });
    const receipt = {
      storeId: data.shopId,
      storeName: shop.business_name,
      lines,
      subtotal,
      deliveryFee: bill.deliveryFee,
      total: bill.total,
      discountAmount: bill.discountAmount,
      couponCode: coupon?.code,
      address: data.address.trim(),
      destination: { lat: data.latitude, lng: data.longitude },
      paymentMethod: "Razorpay test payment",
      etaMin: 0,
      distanceKm: 0,
    };
    const amountPaise = Math.round(bill.total * 100);
    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0)
      throw new Error("Invalid test payment amount.");
    const order = await gateway("orders", keys, {
      amount: amountPaise,
      currency: "INR",
      receipt: `prototype_${Date.now()}`,
      notes: { localshore_test_only: "true" },
    });
    if (
      typeof order.id !== "string" ||
      !order.id.startsWith("order_") ||
      order.amount !== amountPaise ||
      order.currency !== "INR"
    )
      throw new Error("Invalid response from Razorpay test checkout.");
    const token = signTestCheckout(
      {
        userId: context.userId,
        orderId: order.id,
        amountPaise,
        receipt,
        expiresAt: Date.now() + 24 * 60 * 60_000,
      },
      keys.keySecret,
    );
    return {
      razorpay_order_id: order.id,
      amount_paise: amountPaise,
      amount_inr: bill.total,
      currency: "INR",
      key_id: keys.keyId,
      payment_attempt_id: order.id,
      test_checkout_token: token,
    };
  });

export const verifyImportedTestPaymentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { token: string; orderId: string; paymentId: string; signature: string }) => {
    if (
      !data?.token ||
      !/^order_[a-zA-Z0-9]+$/.test(data.orderId) ||
      !/^pay_[a-zA-Z0-9]+$/.test(data.paymentId) ||
      !/^[a-f0-9]{64}$/.test(data.signature)
    )
      throw new Error("Missing test payment verification details.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const keys = testCredentials(process.env);
    const saved = readTestCheckout(data.token, keys.keySecret, context.userId);
    if (saved.orderId !== data.orderId) throw new Error("Payment belongs to a different checkout.");
    verifyTestSignature(saved.orderId, data.paymentId, data.signature, keys.keySecret);
    let payment = await gateway(`payments/${encodeURIComponent(data.paymentId)}`, keys);
    if (
      payment.id !== data.paymentId ||
      payment.order_id !== saved.orderId ||
      payment.amount !== saved.amountPaise ||
      payment.currency !== "INR"
    )
      throw new Error("Test payment does not match the checkout amount.");
    if (payment.status === "authorized")
      payment = await gateway(`payments/${encodeURIComponent(data.paymentId)}/capture`, keys, {
        amount: saved.amountPaise,
        currency: "INR",
      });
    assertCapturedPayment(payment, {
      paymentId: data.paymentId,
      orderId: saved.orderId,
      amountPaise: saved.amountPaise,
    });
    const catalog = saved.receipt.lines.map((line) => ({
      id: line.productId,
      seller_id: line.storeId,
      name: line.name,
      selling_price: line.price,
      stock: 99,
    }));
    const receipt = buildDemoReceipt(saved.receipt, catalog, saved.orderId);
    return {
      ...receipt,
      paymentMethod: "Razorpay test payment (verified)",
      paymentReference: data.paymentId,
    };
  });
