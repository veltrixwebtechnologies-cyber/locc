export interface PaymentItem { product_id: string; qty: number }
export function validatePaymentItems(items: unknown): asserts items is PaymentItem[] {
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) throw new Error("Invalid cart items");
  const ids = new Set<string>();
  for (const item of items) {
    if (!item || typeof item.product_id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.product_id) ||
      ids.has(item.product_id) || !Number.isSafeInteger(item.qty) || item.qty < 1 || item.qty > 10000) {
      throw new Error("Invalid or duplicate cart item/quantity");
    }
    ids.add(item.product_id);
  }
}

export function assertCapturedPayment(payment: {
  id?: string; order_id?: string; status?: string; amount?: number; currency?: string;
}, expected: { paymentId: string; orderId: string; amountPaise: number }) {
  if (!Number.isSafeInteger(expected.amountPaise) || expected.amountPaise <= 0 ||
    payment.id !== expected.paymentId || payment.order_id !== expected.orderId ||
    payment.status !== "captured" || payment.currency !== "INR" || payment.amount !== expected.amountPaise) {
    throw new Error("Payment has not been captured for the expected order and amount");
  }
}
