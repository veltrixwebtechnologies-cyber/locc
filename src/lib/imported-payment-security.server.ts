import { createHmac, timingSafeEqual } from "node:crypto";
import type { DemoOrderInput } from "./demo-payment";

export interface TestCheckoutToken {
  userId: string;
  orderId: string;
  amountPaise: number;
  expiresAt: number;
  receipt: DemoOrderInput;
}

export function testCredentials(env: Record<string, string | undefined>) {
  const dedicated = Boolean(env.RAZORPAY_TEST_KEY_ID || env.RAZORPAY_TEST_KEY_SECRET);
  const keyId = dedicated ? env.RAZORPAY_TEST_KEY_ID : env.RAZORPAY_KEY_ID;
  const keySecret = dedicated ? env.RAZORPAY_TEST_KEY_SECRET : env.RAZORPAY_KEY_SECRET;
  if (!keyId?.startsWith("rzp_test_") || !keySecret)
    throw new Error(
      "Configure server-side RAZORPAY_TEST_KEY_ID and RAZORPAY_TEST_KEY_SECRET for prototype checkout. Live keys are not allowed.",
    );
  return { keyId, keySecret };
}

export function signTestCheckout(payload: TestCheckoutToken, secret: string) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${createHmac("sha256", secret).update(encoded).digest("hex")}`;
}

export function readTestCheckout(
  token: string,
  secret: string,
  userId: string,
  now = Date.now(),
): TestCheckoutToken {
  if (typeof token !== "string" || token.length > 100_000)
    throw new Error("Invalid test checkout token.");
  const [encoded, signature, extra] = token.split(".");
  const expected = createHmac("sha256", secret)
    .update(encoded || "")
    .digest("hex");
  if (
    extra ||
    !signature ||
    !/^[a-f0-9]{64}$/.test(signature) ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  )
    throw new Error("Invalid test checkout token.");
  const payload = JSON.parse(
    Buffer.from(encoded, "base64url").toString("utf8"),
  ) as TestCheckoutToken;
  if (
    payload.userId !== userId ||
    !Number.isFinite(payload.expiresAt) ||
    payload.expiresAt <= now ||
    !Number.isSafeInteger(payload.amountPaise) ||
    payload.amountPaise <= 0 ||
    !payload.receipt?.storeId?.startsWith("imported:")
  )
    throw new Error("Test checkout expired or belongs to another customer.");
  return payload;
}

export function verifyTestSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
) {
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  if (
    !/^[a-f0-9]{64}$/.test(signature) ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  )
    throw new Error("Razorpay test payment signature could not be verified.");
}
