import { useEffect, useState } from "react";
import type { CartLine } from "./cart-store";
import { supabase } from "@/integrations/supabase/client";

const DEMO_ORDER_EVENT = "localshore:demo-orders-changed";
const demoOrdersKey = (userId: string) => `localshore.demo-orders.v1.${userId}`;
const isProductUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export type OrderStatus = "new" | "accepted" | "packed" | "ready_for_pickup" | "out_for_delivery" | "delivered" | "cancelled" | "returned";
export const orderStatusFlow: OrderStatus[] = ["new", "accepted", "packed", "ready_for_pickup", "out_for_delivery", "delivered"];
export const orderStatusLabel: Record<OrderStatus, string> = {
  new: "Order placed",
  accepted: "Order accepted",
  packed: "Packed",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

export interface Order {
  id: string;
  code: string;
  storeId: string;
  storeName: string;
  lines: CartLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  address: string;
  destination: { lat: number; lng: number };
  paymentMethod: string;
  createdAt: number;
  status: OrderStatus;
  partner?: { name: string; rating: number };
  etaMin: number;
  distanceKm: number;
}

function fromRow(row: any): Order {
  const normalizedStatus = row.status === "shipped" ? "out_for_delivery" : row.status;
  return {
    id: row.id,
    code: row.order_number,
    storeId: row.seller_id,
    storeName: row.seller?.business_name ?? "Local Shore shop",
    lines: (row.order_items ?? []).map((item: any) => ({
      productId: item.product_id,
      storeId: row.seller_id,
      name: item.product_name,
      unit: item.sku ?? "",
      price: Number(item.unit_price),
      qty: item.qty,
    })),
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.shipping_fee),
    total: Number(row.total),
    address: row.buyer_address ?? "",
    destination: { lat: 9.9816, lng: 76.2999 },
    paymentMethod: row.payment_method === "upi" ? "UPI" : row.payment_method === "card" ? "Card" : "Cash on delivery",
    createdAt: new Date(row.placed_at ?? row.created_at).getTime(),
    status: normalizedStatus,
    etaMin: 30,
    distanceKm: 2,
  };
}

function readDemoOrders(userId: string): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(demoOrdersKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeDemoOrders(userId: string, orders: Order[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(demoOrdersKey(userId), JSON.stringify(orders));
  window.dispatchEvent(new Event(DEMO_ORDER_EVENT));
}

function createDemoOrder(
  userId: string,
  order: Omit<Order, "id" | "code" | "createdAt" | "status">,
): Order {
  const createdAt = Date.now();
  const created: Order = {
    ...order,
    id: `demo_${crypto.randomUUID()}`,
    code: `LS-${String(createdAt).slice(-8)}`,
    createdAt,
    status: "new",
  };
  writeDemoOrders(userId, [created, ...readDemoOrders(userId)]);
  return created;
}

async function loadOrders(): Promise<Order[]> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  const { data, error } = await (supabase as any)
    .from("orders")
    .select("*, order_items(*), seller:sellers(business_name)")
    .order("placed_at", { ascending: false });
  if (error) throw error;
  const remoteOrders = (data ?? []).map(fromRow);
  const demoOrders = userId ? readDemoOrders(userId) : [];
  return [...remoteOrders, ...demoOrders].sort((a, b) => b.createdAt - a.createdAt);
}

const isMissingRpc = (error: any) =>
  error?.code === "PGRST202" ||
  error?.status === 404 ||
  error?.message?.includes("schema cache") ||
  error?.message?.includes("Could not find the function");

const orderErrorMessage = (error: any) => {
  const message = String(error?.message ?? "");
  if (message.includes("Authentication required")) return "Your session expired. Please sign in again.";
  if (message.includes("Delivery address is required")) return "Add a delivery address before placing the order.";
  if (message.includes("Product is not available")) return "One or more items are no longer available.";
  if (message.includes("Insufficient stock")) return message;
  if (message.includes("Cart items must come from one approved shop")) return "Your cart contains items from different shops.";
  if (message.includes("invalid input syntax for type uuid")) return "One cart item has an invalid product reference. Remove it and add the product again.";
  return message || "The order could not be created. Please try again.";
};

export const ordersStore = {
  async place(order: Omit<Order, "id" | "code" | "createdAt" | "status">) {
    const { data: session } = await supabase.auth.getSession();
    const user = session.session?.user;
    if (!user) throw new Error("Sign in before placing an order");
    if (!order.address.trim()) throw new Error("Add a delivery address before placing the order.");
    if (!order.lines.length) throw new Error("Your cart is empty.");

    const hasDatabaseProducts = order.lines.some((line) => isProductUuid(line.productId));
    const hasDemoProducts = order.lines.some((line) => !isProductUuid(line.productId));
    if (hasDatabaseProducts && hasDemoProducts) {
      throw new Error("Demo and marketplace products cannot be checked out together.");
    }
    if (hasDemoProducts) {
      return createDemoOrder(user.id, order);
    }

    const baseParams = {
      p_buyer_name: user.user_metadata?.display_name ?? user.email ?? "Customer",
      p_buyer_phone: user.phone ?? null,
      p_buyer_address: order.address,
      p_items: order.lines.map((line) => ({ product_id: line.productId, qty: line.qty })),
    };
    const rpcPayload = {
      ...baseParams,
      p_payment_method: order.paymentMethod === "UPI" ? "upi" : order.paymentMethod === "Card" ? "card" : "cod",
      p_is_demo: true,
    };

    const { data: created, error } = await (supabase as any).rpc("place_order", rpcPayload);
    if (error) {
      console.error("[orders] place_order RPC failed", {
        code: error.code,
        status: error.status,
        message: error.message,
        details: error.details,
        hint: error.hint,
        payload: rpcPayload,
      });
      throw new Error(orderErrorMessage(error));
    }
    if (!created?.id) throw new Error("The order was not created. Try again.");
    return {
      ...order,
      id: created.id,
      code: created.order_number,
      createdAt: new Date(created.placed_at).getTime(),
      status: "new" as OrderStatus,
      storeId: created.seller_id,
      subtotal: Number(created.subtotal),
      deliveryFee: Number(created.shipping_fee),
      total: Number(created.total),
    };
  },
};

export async function advanceDemoOrder(orderId: string) {
  if (orderId.startsWith("demo_")) {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user.id;
    if (!userId) throw new Error("Your session expired. Please sign in again.");
    const next: Partial<Record<OrderStatus, OrderStatus>> = {
      new: "accepted",
      accepted: "packed",
      packed: "ready_for_pickup",
      ready_for_pickup: "out_for_delivery",
      out_for_delivery: "delivered",
    };
    const orders = readDemoOrders(userId);
    const current = orders.find((order) => order.id === orderId);
    if (!current) throw new Error("Order not found.");
    const nextStatus = next[current.status];
    if (nextStatus) {
      writeDemoOrders(
        userId,
        orders.map((order) =>
          order.id === orderId ? { ...order, status: nextStatus } : order,
        ),
      );
    }
    return;
  }

  const result = await (supabase as any).rpc("advance_demo_order", { p_order_id: orderId });
  if (!result.error) return;
  if (!isMissingRpc(result.error)) {
    console.error("[orders] advance_demo_order RPC failed", {
      orderId,
      code: result.error.code,
      status: result.error.status,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });
    throw new Error(orderErrorMessage(result.error));
  }

  const { data: current, error: readError } = await (supabase as any)
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();
  if (readError) throw readError;
  const next: Record<string, OrderStatus> = {
    new: "accepted",
    accepted: "packed",
    packed: "ready_for_pickup",
    ready_for_pickup: "out_for_delivery",
    out_for_delivery: "delivered",
  };
  const nextStatus = next[current.status];
  if (nextStatus) {
    const { error } = await (supabase as any).from("orders").update({ status: nextStatus }).eq("id", orderId);
    if (error) throw error;
  }
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    let active = true;
    const refresh = () => void loadOrders().then((rows) => { if (active) setOrders(rows); }).catch(() => undefined);
    refresh();
    const channel = supabase.channel("shoreline-orders").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, refresh).subscribe();
    const poll = window.setInterval(refresh, 5_000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener(DEMO_ORDER_EVENT, refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      active = false;
      window.clearInterval(poll);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener(DEMO_ORDER_EVENT, refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      void supabase.removeChannel(channel);
    };
  }, []);
  return orders;
}
