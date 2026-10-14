import type { Order } from "@/shared/core/shopper-order";

export type DemoOrderInput = Omit<Order, "id" | "code" | "createdAt" | "status">;
export interface DemoCatalogProduct {
  id: string;
  seller_id: string;
  name: string;
  selling_price: number | string;
  stock: number | string;
}

/** Read-only simulation: never creates an order, reserves stock, or dispatches delivery. */
export function buildDemoReceipt(
  input: DemoOrderInput,
  products: DemoCatalogProduct[],
  id: string,
): Order {
  if (!input.lines.length) throw new Error("Your cart is empty.");
  const seen = new Set<string>();
  const lines = input.lines.map((line) => {
    const product = products.find(
      (product) => product.id === line.productId && product.seller_id === input.storeId,
    );
    if (!product || line.storeId !== input.storeId || seen.has(line.productId))
      throw new Error("Only this shop's verified catalog items can be used in test checkout.");
    seen.add(line.productId);
    const price = Number(product.selling_price);
    const stock = Number(product.stock);
    if (
      !Number.isSafeInteger(line.qty) ||
      line.qty <= 0 ||
      !Number.isFinite(stock) ||
      stock < line.qty
    )
      throw new Error("An item has insufficient stock. Update your cart and try again.");
    if (!Number.isFinite(price) || price < 0 || Math.abs(price - line.price) > 0.001)
      throw new Error("An item's price changed. Remove it and add it again before checkout.");
    return { ...line, name: product.name, price };
  });
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  if (
    [input.subtotal, input.deliveryFee, input.total, input.discountAmount ?? 0].some(
      (value) => !Number.isFinite(value) || value < 0,
    ) ||
    Math.abs(subtotal - input.subtotal) > 0.01
  )
    throw new Error("Your cart totals changed. Please refresh checkout.");
  return {
    ...input,
    lines,
    subtotal,
    id: `demo-${id}`,
    code: `TEST-${id.slice(0, 8).toUpperCase()}`,
    createdAt: Date.now(),
    status: "new",
    isDemoPayment: true,
    paymentMethod: "Demo payment (simulated)",
    etaMin: 0,
  };
}
