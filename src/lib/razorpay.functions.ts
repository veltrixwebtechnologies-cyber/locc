import { parseCoordinates } from "./coordinates";
import { createServerFn } from "@tanstack/react-start";
import { createHmac, timingSafeEqual } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { validatePaymentItems, assertCapturedPayment } from "./payment-validation";

export interface CreateRazorpayOrderInput {
  items: Array<{ product_id: string; qty: number }>;
  address: string;
  coupon_code?: string;
  customer_latitude?: number | null;
  customer_longitude?: number | null;
  buyer_name?: string;
  buyer_phone?: string;
}

export interface CreateRazorpayOrderResult {
  razorpay_order_id: string;
  amount_paise: number;
  amount_inr: number;
  currency: string;
  key_id: string;
  payment_attempt_id: string;
}

export interface VerifyRazorpayPaymentInput {
  payment_attempt_id?: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  buyer_name: string;
  buyer_phone?: string;
  buyer_address: string;
  items: Array<{ product_id: string; qty: number }>;
  coupon_code?: string;
  customer_latitude?: number | null;
  customer_longitude?: number | null;
}

export interface VerifyRazorpayPaymentResult {
  success: boolean;
  order: {
    id: string;
    code: string;
    total: number;
    payment_status: string;
    payment_reference: string;
    seller_id: string;
    store_id?: string | null;
  };
}

/**
 * Server-side helper to resolve Razorpay credentials securely.
 * Never returns hardcoded fallback secrets.
 */
function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

  return { keyId, keySecret };
}

/**
 * 1. CREATE RAZORPAY ORDER (SERVER-SIDE ONLY)
 * Recalculates authoritative order amounts from DB and issues a secure Razorpay order.
 * Amount is converted strictly to paise (1 INR = 100 paise).
 */
export const createRazorpayOrderFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: CreateRazorpayOrderInput) => {
    validatePaymentItems(data?.items);
    if (!data?.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new Error("Cart items are required to create a payment order.");
    }
    if (!data?.address || !data.address.trim()) {
      throw new Error("Delivery address is required.");
    }
    if (!parseCoordinates(data.customer_latitude, data.customer_longitude)) {
      throw new Error("A valid delivery entrance pin is required.");
    }
    return data;
  })
  .handler(async ({ data, context }): Promise<CreateRazorpayOrderResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;
    const { keyId, keySecret } = getRazorpayCredentials();

    if (!keyId || !keySecret) {
      console.error("[razorpay] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET on server.");
      throw new Error("Payment service is temporarily unavailable. Please try again later.");
    }

    const requestedProductIds = data.items.map((i) => i.product_id);

    // 1. Calculate authoritative totals server-side from database
    const { data: dbProducts, error: prodErr } = await admin
      .from("products")
      .select("id, seller_id, selling_price, name, stock, status")
      .in("id", requestedProductIds);

    if (prodErr || !dbProducts || dbProducts.length !== requestedProductIds.length) {
      console.error("[razorpay] Error fetching product prices:", prodErr);
      throw new Error("Unable to retrieve authoritative prices for cart items.");
    }

    // Store/zone policy runs before creating a gateway order so known-ineligible
    // deliveries are never charged. The final order-item trigger remains the
    // race-safe database guard when the prepared migration is installed.
    const { data: commerceCheck, error: commerceError } = await (context.supabase as any).rpc(
      "resolve_customer_checkout",
      {
        p_product_ids: requestedProductIds,
        p_customer_latitude: data.customer_latitude,
        p_customer_longitude: data.customer_longitude,
      },
    );
    if (commerceError && !["PGRST202", "42883"].includes(commerceError.code)) {
      throw new Error("Store delivery availability could not be verified. Please try again.");
    }
    if (!commerceError && commerceCheck && commerceCheck.eligible === false) {
      const messages: Record<string, string> = {
        STORE_CLOSED: "This store is closed right now. Please try again during opening hours.",
        STORE_UNAVAILABLE: "This store is currently unavailable for new orders.",
        OUTSIDE_SERVICE_ZONE: "This address is outside the store’s delivery zone.",
        OUTSIDE_DELIVERY_RADIUS: "This address is outside the store’s delivery area.",
        MULTIPLE_FULFILLMENT_STORES: "Your cart contains items from different store locations. Please order from one store at a time.",
      };
      throw new Error(messages[commerceCheck.reason] || "This store cannot deliver to the selected address.");
    }

    const priceMap = new Map<string, number>();
    if (new Set(dbProducts.map((p: any) => p.seller_id)).size !== 1) throw new Error("Checkout must contain products from one shop");
    (dbProducts || []).forEach((p: any) => {
      const quantity = data.items.find(item => item.product_id === p.id)!.qty;
      if (!["active", "approved"].includes(p.status) || !Number.isFinite(p.stock) || p.stock < quantity ||
        p.selling_price == null || !Number.isFinite(Number(p.selling_price)) || Number(p.selling_price) < 0) {
        throw new Error(`Product '${p.name}' is currently unavailable.`);
      }
      priceMap.set(p.id, Number(p.selling_price || 0));
    });

    let subtotal = 0;
    for (const item of data.items) {
      const price = priceMap.get(item.product_id);
      if (price === undefined) {
        throw new Error("Invalid item pricing detected. Refresh cart and retry.");
      }
      subtotal += price * item.qty;
    }

    let shippingFee = 25;
    let discountAmount = 0;
    let quotedTotal: number | undefined;

    // Server-side coupon evaluation
    if (data.coupon_code && data.coupon_code.trim()) {
      try {
        const { data: couponQuote, error: quoteError } = await (context.supabase as any).rpc("quote_coupon", {
          p_code: data.coupon_code.trim(),
          p_items: data.items,
        });

        if (quoteError || !couponQuote) throw new Error("Coupon could not be verified");
        if (couponQuote) {
          shippingFee = Number((couponQuote as any).shipping_fee ?? 25);
          discountAmount = Number((couponQuote as any).discount_amount ?? 0);
          quotedTotal = Number(couponQuote.total);
          if (!Number.isFinite(quotedTotal) || quotedTotal < 0) throw new Error("Invalid coupon quote");
        }
      } catch (err) {
        throw new Error("Coupon could not be verified. Remove it or try again.");
      }
    }

    // In free-shipping quotes discount_amount describes the waived fee; the
    // authoritative total already accounts for it and must not subtract it twice.
    const totalInr = quotedTotal ?? (subtotal + shippingFee - discountAmount);
    const amountPaise = Math.round(totalInr * 100);

    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
      throw new Error("Invalid order total amount.");
    }

    // 2. Call Razorpay API
    let razorpayOrderId = "";
    try {
      const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authHeader}`,
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt: `rcpt_${Date.now()}`,
          notes: {
            coupon_code: data.coupon_code || "",
            address: data.address.slice(0, 40),
          },
        }),
      });

      if (res.ok) {
        const payload = (await res.json()) as { id: string };
        razorpayOrderId = payload.id;
      } else {
        const errorText = await res.text();
        console.error("[razorpay] API order creation failed:", errorText);
        throw new Error("Payment gateway declined order creation.");
      }
    } catch (err: any) {
      console.error("[razorpay] API call exception:", err);
      throw new Error(err.message || "Failed to connect to payment gateway.");
    }

    // 3. Create payment attempt row in database
    let attemptId = "";
    const { data: attemptRow, error: attemptErr } = await admin.from("payment_attempts").insert({
      user_id: context.userId,
      provider: "razorpay",
      status: "created",
      provider_order_id: razorpayOrderId,
      amount: totalInr,
      amount_paise: amountPaise,
      currency: "INR",
      raw_payload: {
        items: data.items,
        coupon_code: data.coupon_code,
        address: data.address,
        customer_latitude: data.customer_latitude,
        customer_longitude: data.customer_longitude,
      },
    }).select("id").single();

    if (attemptErr) {
      console.error("[razorpay] create_payment_attempt RPC failed:", attemptErr);
      throw new Error("Unable to save payment attempt. Payment has not been initiated.");
    } else if (attemptRow) {
      attemptId = (attemptRow as any).id;
    }

    return {
      razorpay_order_id: razorpayOrderId,
      amount_paise: amountPaise,
      amount_inr: totalInr,
      currency: "INR",
      key_id: keyId,
      payment_attempt_id: attemptId || razorpayOrderId,
    };
  });

/**
 * 2. VERIFY RAZORPAY PAYMENT SIGNATURE (SERVER-SIDE ONLY)
 * Cryptographically verifies HMAC SHA256 signature before placing order.
 */
export const verifyRazorpayPaymentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: VerifyRazorpayPaymentInput) => {
    if (!data?.razorpay_order_id || !data?.razorpay_payment_id || !data?.razorpay_signature) {
      throw new Error("Missing required Razorpay payment verification parameters.");
    }
    if (!data?.buyer_address || !data?.items?.length) {
      throw new Error("Missing buyer address or items for order placement.");
    }
    if (!parseCoordinates(data.customer_latitude, data.customer_longitude)) {
      throw new Error("A valid delivery entrance pin is required.");
    }
    return data;
  })
  .handler(async ({ data, context }): Promise<VerifyRazorpayPaymentResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;
    const { keyId, keySecret } = getRazorpayCredentials();

    if (!keySecret) {
      throw new Error("Payment service is temporarily unavailable. Server secret is missing.");
    }

    const { data: attempt, error: attemptError } = await admin.from("payment_attempts")
      .select("*").eq("provider_order_id", data.razorpay_order_id).eq("user_id", context.userId).maybeSingle();
    if (attemptError || !attempt || (data.payment_attempt_id && data.payment_attempt_id !== attempt.id)) {
      throw new Error("Payment attempt not found for this customer");
    }
    const saved = attempt.raw_payload;
    validatePaymentItems(saved?.items);
    if (!saved.address || !parseCoordinates(saved.customer_latitude, saved.customer_longitude)) {
      throw new Error("Saved payment destination is invalid. Contact support.");
    }

    // 1. Verify Cryptographic HMAC SHA256 Signature
    const body = `${data.razorpay_order_id}|${data.razorpay_payment_id}`;
    let isSignatureValid = false;

    try {
      const expectedSignature = createHmac("sha256", keySecret).update(body).digest("hex");
      const expectedBuf = Buffer.from(expectedSignature, "utf-8");
      const actualBuf = Buffer.from(data.razorpay_signature, "utf-8");

      if (expectedBuf.length === actualBuf.length) {
        isSignatureValid = timingSafeEqual(expectedBuf, actualBuf);
      }
    } catch (err) {
      console.error("[razorpay] Signature comparison error:", err);
      isSignatureValid = false;
    }

    if (!isSignatureValid) {
      console.error("[razorpay] Cryptographic signature verification FAILED!", {
        orderId: data.razorpay_order_id,
        paymentId: data.razorpay_payment_id,
      });

      throw new Error("Payment verification failed. Cryptographic signature invalid.");
    }

    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(data.razorpay_payment_id)}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}` },
    });
    if (!paymentResponse.ok) throw new Error("Unable to verify captured payment. Try again or contact support.");
    assertCapturedPayment(await paymentResponse.json(), {
      paymentId: data.razorpay_payment_id, orderId: data.razorpay_order_id, amountPaise: Number(attempt.amount_paise),
    });

    // 2. Place LocalShore Order via authoritative place_order_once RPC
    // place_order_once expects a UUID; the persisted attempt is stable across
    // retries and prevents duplicate orders for the same payment attempt.
    const request_id = attempt.id;
    const { data: rpcCreated, error: rpcErr } = await (context.supabase as any).rpc("place_order_once", {
      p_request_id: request_id,
      p_buyer_name: data.buyer_name,
      p_buyer_phone: data.buyer_phone ?? null,
      p_buyer_address: saved.address,
      p_items: saved.items,
      p_payment_method: "card",
      p_coupon_code: saved.coupon_code ?? null,
      p_customer_latitude: saved.customer_latitude,
      p_customer_longitude: saved.customer_longitude,
    });

    if (rpcErr || !rpcCreated?.id) {
      console.error("[razorpay] place_order_once RPC error during verification:", rpcErr);
      throw new Error("Order creation failed during payment verification. Please contact support.");
    }

    if (Math.round(Number(rpcCreated.total) * 100) !== Number(attempt.amount_paise)) {
      throw new Error("Order total differs from the captured payment. Contact support for reconciliation.");
    }
    // Do not report success if the authoritative payment update fails.
    const { error: finalizeError } = await admin.rpc("finalize_verified_payment", {
        p_provider_order_id: data.razorpay_order_id,
        p_provider_payment_id: data.razorpay_payment_id,
        p_provider_signature: data.razorpay_signature,
        p_order_id: rpcCreated.id,
        p_status: "captured",
    });
    if (finalizeError) throw new Error("Payment received but order confirmation is pending. Contact support.");

    return {
      success: true,
      order: {
        id: rpcCreated.id,
        code: rpcCreated.order_number || `LS-${String(Date.now()).slice(-8)}`,
        total: Number(rpcCreated.total || 0),
        payment_status: "paid",
        payment_reference: data.razorpay_payment_id,
        seller_id: rpcCreated.seller_id,
        store_id: rpcCreated.store_id ?? null,
      },
    };
  });
