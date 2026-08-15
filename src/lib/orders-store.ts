import { useEffect, useState } from "react";
import type { CartLine } from "./cart-store";
import { supabase } from "@/integrations/supabase/client";


export type OrderStatus = "new" | "accepted" | "packed" | "ready_for_pickup" | "assigned" | "picked_up" | "out_for_delivery" | "delivered" | "cancelled" | "returned";
export const orderStatusFlow: OrderStatus[] = ["new", "accepted", "packed", "ready_for_pickup", "assigned", "picked_up", "out_for_delivery", "delivered"];
export const orderStatusLabel: Record<OrderStatus, string> = {
  new: "Order placed",
  accepted: "Order accepted",
  packed: "Packed",
  ready_for_pickup: "Ready for pickup",
  assigned: "Delivery partner assigned",
  picked_up: "Picked up",
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
  deliveryOtp?: string;
  couponCode?: string;
  discountAmount?: number;
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
    destination:
      Number.isFinite(Number(row.customer_latitude)) && Number.isFinite(Number(row.customer_longitude))
        ? { lat: Number(row.customer_latitude), lng: Number(row.customer_longitude) }
        : { lat: 9.9816, lng: 76.2999 },
    paymentMethod: row.payment_method === "upi" ? "UPI" : row.payment_method === "card" ? "Card" : "Cash on delivery",
    deliveryOtp: row.delivery_otp ?? undefined,
    couponCode: row.coupon_code ?? undefined,
    discountAmount: Number(row.discount_amount ?? 0),
    createdAt: new Date(row.placed_at ?? row.created_at).getTime(),
    status: normalizedStatus,
    etaMin: 30,
    distanceKm: 2,
  };
}

async function loadOrders(): Promise<Order[]> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) return [];

  try {
    const { data, error } = await (supabase as any)
      .from("orders")
      .select("*, order_items(*), seller:sellers(business_name)")
      .eq("user_id", userId)
      .order("placed_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(fromRow);
  } catch (error) {
    console.error("[orders] history query failed", error);
    return [];
  }
}

const orderErrorMessage = (error: any) => {
  if (error?.code === "PGRST202" || String(error?.message ?? "").includes("Could not find the function public.place_order_once")) {
    return "Checkout is temporarily unavailable because the secure order service is not deployed. Please contact support.";
  }
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

    const baseParams = {
      p_buyer_name: user.user_metadata?.display_name ?? user.email ?? "Customer",
      p_buyer_phone: user.phone ?? null,
      p_buyer_address: order.address,
      p_items: order.lines.map((line) => ({ product_id: line.productId, qty: line.qty })),
    };
    const rpcPayload = {
      ...baseParams,
      p_payment_method: order.paymentMethod === "UPI" ? "upi" : order.paymentMethod === "Card" ? "card" : "cod",
      p_coupon_code: order.couponCode ?? null,
    };

    let { data: created, error } = await (supabase as any).rpc("place_order_once", {
      p_request_id: crypto.randomUUID(),
      ...rpcPayload,
    });
    if (error) {
      const correlationId = crypto.randomUUID();
      console.error("[orders] place_order RPC failed", {
        correlationId,
        code: error.code,
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
      couponCode: created.coupon_code ?? undefined,
      discountAmount: Number(created.discount_amount ?? 0),
    };
  },
};

export async function advanceDemoOrder(orderId: string) {
  throw new Error("Order status is managed by the seller and delivery partner.");
}

export function useOrders() {
  return useOrdersState().orders;
}

export function useOrdersState() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const refresh = () => void loadOrders()
      .then((rows) => {
        if (active) {
          setOrders(rows);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error("[orders] refresh failed", error);
        if (active) setIsLoading(false);
      });
    refresh();
    const channel = supabase.channel("shoreline-orders").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, refresh).subscribe();
    const poll = window.setInterval(refresh, 5_000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      active = false;
      window.clearInterval(poll);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      void supabase.removeChannel(channel);
    };
  }, []);
  return { orders, isLoading };
}
