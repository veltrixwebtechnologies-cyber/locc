import { useEffect, useState } from "react";
import type { CartLine } from "./cart-store";
import { supabase } from "@/integrations/supabase/client";

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

async function loadOrders(): Promise<Order[]> {
  const { data, error } = await (supabase as any)
    .from("orders")
    .select("*, order_items(*), seller:sellers(business_name)")
    .order("placed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export const ordersStore = {
  async place(order: Omit<Order, "id" | "code" | "createdAt" | "status">) {
    const { data: session } = await supabase.auth.getSession();
    const user = session.session?.user;
    if (!user) throw new Error("Sign in before placing an order");
    const baseParams = {
      p_buyer_name: user.user_metadata?.display_name ?? user.email ?? "Customer",
      p_buyer_phone: user.phone ?? null,
      p_buyer_address: order.address,
      p_items: order.lines.map((line) => ({ product_id: line.productId, qty: line.qty })),
    };
    const paymentParams = {
      ...baseParams,
      p_payment_method: order.paymentMethod === "UPI" ? "upi" : order.paymentMethod === "Card" ? "card" : "cod",
      p_is_demo: true,
    };

    let result = await (supabase as any).rpc("place_order", paymentParams);
    const missingPaymentAwareRpc =
      result.error?.code === "PGRST202" ||
      result.error?.message?.includes("schema cache") ||
      result.error?.message?.includes("p_payment_method") ||
      result.error?.message?.includes("p_is_demo");

    if (missingPaymentAwareRpc) {
      result = await (supabase as any).rpc("place_order", baseParams);
    }

    const { data: created, error } = result;
    if (error) throw error;
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
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      active = false;
      window.clearInterval(poll);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      void supabase.removeChannel(channel);
    };
  }, []);
  return orders;
}
