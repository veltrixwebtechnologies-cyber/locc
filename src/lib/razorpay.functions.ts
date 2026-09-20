import { parseCoordinates } from "./coordinates";
import { createServerFn } from "@tanstack/react-start";
import { createHmac, timingSafeEqual } from "crypto";

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

const isUuid = (val: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

/**
 * 1. CREATE RAZORPAY ORDER (SERVER-SIDE ONLY)
 * Recalculates authoritative order amounts from DB and issues a secure Razorpay order.
 * Amount is converted strictly to paise (1 INR = 100 paise).
 */
export const createRazorpayOrderFn = createServerFn({ method: "POST" })
  .inputValidator((data: CreateRazorpayOrderInput) => {
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
  .handler(async ({ data }): Promise<CreateRazorpayOrderResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;
    const { keyId, keySecret } = getRazorpayCredentials();

    if (!keyId || !keySecret) {
      console.error("[razorpay] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET on server.");
      throw new Error("Payment service is temporarily unavailable. Please try again later.");
    }

    const requestedProductIds = data.items.map((i) => i.product_id);
    if (!requestedProductIds.every(isUuid)) {
      throw new Error("One or more cart items have invalid product IDs.");
    }

    // 1. Calculate authoritative totals server-side from database
    const { data: dbProducts, error: prodErr } = await admin
      .from("products")
      .select("id, selling_price, name, stock, is_active")
      .in("id", requestedProductIds);

    if (prodErr || !dbProducts || dbProducts.length !== requestedProductIds.length) {
      console.error("[razorpay] Error fetching product prices:", prodErr);
      throw new Error("Unable to retrieve authoritative prices for cart items.");
    }

    const priceMap = new Map<string, number>();
    (dbProducts || []).forEach((p: any) => {
      if (!p.is_active) {
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

    // Server-side coupon evaluation
    if (data.coupon_code && data.coupon_code.trim()) {
      try {
        const { data: couponQuote } = await admin.rpc("quote_coupon", {
          p_coupon_code: data.coupon_code.trim(),
          p_items: data.items,
        });

        if (couponQuote) {
          shippingFee = Number((couponQuote as any).shipping_fee ?? 25);
          discountAmount = Number((couponQuote as any).discount_amount ?? 0);
        }
      } catch (err) {
        console.warn("[razorpay] Coupon server quote warning:", err);
      }
    }

    const totalInr = Math.max(0, subtotal + shippingFee - discountAmount);
    const amountPaise = Math.round(totalInr * 100);

    if (amountPaise <= 0) {
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
    const { data: attemptRow, error: attemptErr } = await admin.rpc("create_payment_attempt", {
      p_provider_order_id: razorpayOrderId,
      p_amount: totalInr,
      p_amount_paise: amountPaise,
      p_currency: "INR",
      p_raw_payload: {
        items: data.items,
        coupon_code: data.coupon_code,
        address: data.address,
      },
    });

    if (attemptErr) {
      console.error("[razorpay] create_payment_attempt RPC failed:", attemptErr);
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
  .handler(async ({ data }): Promise<VerifyRazorpayPaymentResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;
    const { keySecret } = getRazorpayCredentials();

    if (!keySecret) {
      throw new Error("Payment service is temporarily unavailable. Server secret is missing.");
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

      try {
        await admin.rpc("finalize_verified_payment", {
          p_provider_order_id: data.razorpay_order_id,
          p_provider_payment_id: data.razorpay_payment_id,
          p_provider_signature: data.razorpay_signature,
          p_order_id: null,
          p_status: "failed",
        });
      } catch {}

      throw new Error("Payment verification failed. Cryptographic signature invalid.");
    }

    // 2. Place LocalShore Order via authoritative place_order_once RPC
    const request_id = `rzp_${data.razorpay_payment_id}`;
    const { data: rpcCreated, error: rpcErr } = await admin.rpc("place_order_once", {
      p_request_id: request_id,
      p_buyer_name: data.buyer_name,
      p_buyer_phone: data.buyer_phone ?? null,
      p_buyer_address: data.buyer_address,
      p_items: data.items,
      p_payment_method: "card",
      p_coupon_code: data.coupon_code ?? null,
      p_customer_latitude: data.customer_latitude ?? null,
      p_customer_longitude: data.customer_longitude ?? null,
    });

    if (rpcErr || !rpcCreated?.id) {
      console.error("[razorpay] place_order_once RPC error during verification:", rpcErr);
      throw new Error("Order creation failed during payment verification. Please contact support.");
    }

    // 3. Update order payment status and finalize payment attempt in database
    try {
      await admin
        .from("orders")
        .update({
          payment_status: "paid",
          payment_reference: data.razorpay_payment_id,
          payment_currency: "INR",
          updated_at: new Date().toISOString(),
        })
        .eq("id", rpcCreated.id);

      await admin.rpc("finalize_verified_payment", {
        p_provider_order_id: data.razorpay_order_id,
        p_provider_payment_id: data.razorpay_payment_id,
        p_provider_signature: data.razorpay_signature,
        p_order_id: rpcCreated.id,
        p_status: "captured",
      });
    } catch (dbErr) {
      console.error("[razorpay] Notice updating order payment status:", dbErr);
    }

    return {
      success: true,
      order: {
        id: rpcCreated.id,
        code: rpcCreated.order_number || `LS-${String(Date.now()).slice(-8)}`,
        total: Number(rpcCreated.total || 0),
        payment_status: "paid",
        payment_reference: data.razorpay_payment_id,
        seller_id: rpcCreated.seller_id,
      },
    };
  });
