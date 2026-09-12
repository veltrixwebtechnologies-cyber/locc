import { parseCoordinates } from "./coordinates";
import { useEffect, useState } from "react";
import type { CartLine } from "./cart-store";
import { supabase } from "@/integrations/supabase/client";
import { isValidCoordinate, normalizeCoordinate, haversineDistanceKm } from "@/lib/geo";

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const demoOrdersKey = (userId: string) => `localshore.demo-orders.${userId}.v1`;
const ORDERS_CACHE_KEY = "localshore.orders_cache.v2";

let memoryOrdersCache: Order[] | null = null;

function getInitialCachedOrders(): Order[] {
  if (memoryOrdersCache) return memoryOrdersCache;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(ORDERS_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          memoryOrdersCache = parsed;
          return parsed;
        }
      }
    } catch {}
  }
  return [];
}

function updateOrdersCache(rows: Order[]) {
  memoryOrdersCache = rows;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(rows));
    } catch {}
  }
}

function loadDemoOrders(userId: string): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(demoOrdersKey(userId));
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

function saveDemoOrder(userId: string, order: Order) {
  if (typeof window === "undefined") return;
  const existing = loadDemoOrders(userId);
  const updated = [order, ...existing];
  window.localStorage.setItem(demoOrdersKey(userId), JSON.stringify(updated));
  updateOrdersCache([order, ...getInitialCachedOrders()]);
}

export function addPlacedOrderToCache(order: Order) {
  const current = getInitialCachedOrders();
  const existingIdx = current.findIndex((o) => o.id === order.id || o.code === order.code);
  const updated =
    existingIdx !== -1
      ? current.map((o, idx) => (idx === existingIdx ? order : o))
      : [order, ...current];
  updateOrdersCache(updated);

  supabase.auth.getSession().then(({ data }) => {
    const userId = data.session?.user?.id;
    if (userId) {
      saveDemoOrder(userId, order);
    }
  });
}

export type OrderStatus =
  | "new"
  | "accepted"
  | "vendor_accepted"
  | "cancelled_by_vendor"
  | "preparing"
  | "packed"
  | "ready_for_pickup"
  | "assigned"
  | "delivery_partner_assigned"
  | "going_to_vendor"
  | "arrived_at_vendor"
  | "going_to_customer"
  | "arrived_at_customer"
  | "rider_assigned"
  | "rider_accepted"
  | "rider_at_shop"
  | "picked_up"
  | "out_for_delivery"
  | "at_customer"
  | "delivered"
  | "cancelled"
  | "returned"
  | "assignment_failed"
  | "delivery_failed";

export const orderStatusFlow: OrderStatus[] = [
  "new",
  "vendor_accepted",
  "ready_for_pickup",
  "delivery_partner_assigned",
  "arrived_at_vendor",
  "picked_up",
  "out_for_delivery",
  "delivered",
];

export const orderStatusLabel: Record<OrderStatus, string> = {
  new: "Order placed (Awaiting Vendor)",
  accepted: "Shop accepted",
  vendor_accepted: "Shop accepted & preparing",
  cancelled_by_vendor: "Cancelled by vendor",
  preparing: "Shop preparing order",
  packed: "Order packed",
  ready_for_pickup: "Ready for pickup",
  assigned: "Delivery partner assigned",
  delivery_partner_assigned: "Delivery partner assigned",
  going_to_vendor: "Partner heading to shop",
  arrived_at_vendor: "Partner arrived at shop",
  going_to_customer: "Out for delivery",
  arrived_at_customer: "Partner arrived at customer",
  rider_assigned: "Delivery partner assigned",
  rider_accepted: "Partner heading to shop",
  rider_at_shop: "Partner arrived at shop",
  picked_up: "Order picked up",
  out_for_delivery: "Out for delivery",
  at_customer: "Partner arrived at customer",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  assignment_failed: "Finding alternative delivery partner",
  delivery_failed: "Delivery unsuccessful",
};

export interface Order {
  id: string;
  code: string;
  storeId: string;
  storeName: string;
  storeCoordinates?: { lat: number; lng: number };
  lines: CartLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  address: string;
  destination: { lat: number; lng: number } | null;
  paymentMethod: string;
  deliveryOtp?: string;
  couponCode?: string;
  discountAmount?: number;
  createdAt: number;
  status: OrderStatus;
  partner?: {
    name: string;
    rating: number;
    lat?: number;
    lng?: number;
    userRating?: number;
    vehicle?: string;
    deliveriesCount?: number;
  };
  etaMin: number;
  distanceKm: number;
  cancellationReason?: string;
}

function fromRow(row: any): Order {
  let normalizedStatus: OrderStatus = row.status === "shipped" ? "out_for_delivery" : row.status;
  if ((normalizedStatus as string) === "assigned") normalizedStatus = "rider_assigned";

  const partnerData = row.assigned_partner
    ? {
        name: row.assigned_partner.full_name ?? "Delivery Partner",
        rating: Number(row.assigned_partner.rating ?? 5.0),
        lat: Number.isFinite(Number(row.assigned_partner.current_latitude))
          ? Number(row.assigned_partner.current_latitude)
          : undefined,
        lng: Number.isFinite(Number(row.assigned_partner.current_longitude))
          ? Number(row.assigned_partner.current_longitude)
          : undefined,
      }
    : undefined;

  const sellerCoordinates =
    normalizeCoordinate({ lat: row.seller?.lat, lng: row.seller?.lng }) ??
    normalizeCoordinate(row.seller?.wizard_data?.pickupCoordinates) ??
    normalizeCoordinate(row.seller?.wizard_data?.shopCoordinates) ??
    null;

  // Try to extract live data from delivery assignment
  const assignment = Array.isArray(row.delivery_assignments)
    ? row.delivery_assignments.find(
        (a: any) => !["expired", "rejected", "cancelled"].includes(a.status),
      )
    : null;

  // Get partner location from assignment if not from direct join
  const livePartnerLat = assignment?.current_latitude ?? partnerData?.lat;
  const livePartnerLng = assignment?.current_longitude ?? partnerData?.lng;
  // Calculate real distance if partner and destination locations are available
  const custLat = isValidCoordinate(row.customer_latitude, row.customer_longitude)
    ? row.customer_latitude
    : null;
  const custLng = isValidCoordinate(row.customer_latitude, row.customer_longitude)
    ? row.customer_longitude
    : null;
  let realDistanceKm = 2.4; // default
  let realEtaMin = 25; // default
  if (livePartnerLat && livePartnerLng && custLat && custLng) {
    realDistanceKm =
      Math.round(haversineDistanceKm(livePartnerLat, livePartnerLng, custLat, custLng) * 10) / 10;
    realEtaMin = Math.max(3, Math.round((realDistanceKm / 22) * 60) + 3);
  } else if (sellerCoordinates && custLat && custLng) {
    realDistanceKm =
      Math.round(
        haversineDistanceKm(sellerCoordinates.lat, sellerCoordinates.lng, custLat, custLng) * 10,
      ) / 10;
    realEtaMin = Math.max(5, Math.round((realDistanceKm / 22) * 60) + 5);
  }

  // Use assignment ETA if available from server
  if (assignment?.estimated_delivery_eta) {
    const etaTime = new Date(assignment.estimated_delivery_eta).getTime();
    const nowMs = Date.now();
    if (etaTime > nowMs) {
      realEtaMin = Math.ceil((etaTime - nowMs) / 60000);
    }
  }

  const partnerWithLive = partnerData
    ? {
        ...partnerData,
        lat: Number.isFinite(livePartnerLat) ? livePartnerLat : partnerData.lat,
        lng: Number.isFinite(livePartnerLng) ? livePartnerLng : partnerData.lng,
      }
    : undefined;

  return {
    id: row.id,
    code: row.order_number,
    storeId: row.seller_id,
    storeName: row.seller?.business_name ?? "Local Shore shop",
    storeCoordinates: sellerCoordinates ?? undefined,
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
    destination: isValidCoordinate(row.customer_latitude, row.customer_longitude)
      ? { lat: row.customer_latitude, lng: row.customer_longitude }
      : null,
    paymentMethod:
      row.payment_method === "upi"
        ? "UPI"
        : row.payment_method === "card"
          ? "Card"
          : "Cash on delivery",
    deliveryOtp: row.delivery_otp ?? undefined,
    couponCode: row.coupon_code ?? undefined,
    discountAmount: Number(row.discount_amount ?? 0),
    createdAt: new Date(row.placed_at ?? row.created_at).getTime(),
    status: normalizedStatus,
    partner: partnerWithLive,
    etaMin: realEtaMin,
    distanceKm: realDistanceKm,
    cancellationReason: row.cancellation_reason ?? undefined,
  };
}

async function loadOrders(): Promise<Order[]> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) {
    const cached = getInitialCachedOrders();
    return cached.length > 0 ? cached : [];
  }
  const demoOrders = loadDemoOrders(userId);

  try {
    const { data: ordersData, error } = await (supabase as any)
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", userId)
      .order("placed_at", { ascending: false });

    if (error) {
      console.warn("[orders] orders query notice:", error.message);
      const res = [...demoOrders];
      updateOrdersCache(res);
      return res;
    }

    if (!ordersData || ordersData.length === 0) {
      updateOrdersCache(demoOrders);
      return demoOrders;
    }

    // Fetch active delivery assignments for live partner tracking
    const orderIds = ordersData.map((o: any) => o.id);
    let assignmentsMap: Record<string, any> = {};
    try {
      const { data: assignments } = await (supabase as any)
        .from("delivery_assignments")
        .select(
          "id, order_id, status, current_latitude, current_longitude, current_heading, estimated_delivery_eta",
        )
        .in("order_id", orderIds);
      if (assignments) {
        assignments.forEach((a: any) => {
          if (a.order_id) assignmentsMap[a.order_id] = a;
        });
      }
    } catch {
      // Ignore assignment lookup errors
    }

    const processedOrders = ordersData.map((row: any) => {
      const rowWithAssignment = {
        ...row,
        delivery_assignments: assignmentsMap[row.id] ? [assignmentsMap[row.id]] : [],
      };
      return fromRow(rowWithAssignment);
    });

    const res = [...demoOrders, ...processedOrders];
    updateOrdersCache(res);
    return res;
  } catch (error) {
    console.error("[orders] loadOrders failed", error);
    const cached = getInitialCachedOrders();
    return cached.length > 0 ? cached : demoOrders;
  }
}

const orderErrorMessage = (error: any) => {
  if (
    error?.code === "PGRST202" ||
    String(error?.message ?? "").includes("Could not find the function public.place_order_once")
  ) {
    return "Checkout is temporarily unavailable because the secure order service is not deployed. Please contact support.";
  }
  const message = String(error?.message ?? "");
  if (message.includes("Authentication required"))
    return "Your session expired. Please sign in again.";
  if (message.includes("Delivery address is required"))
    return "Add a delivery address before placing the order.";
  if (message.includes("Product is not available"))
    return "One or more items are no longer available.";
  if (message.includes("Insufficient stock")) return message;
  if (
    message.includes("Shop is currently closed") ||
    message.includes("not accepting orders") ||
    message.includes("Temporarily closed") ||
    message.includes("Closed for")
  ) {
    return message;
  }
  if (message.includes("Cart items must come from one approved shop"))
    return "Your cart contains items from different shops.";
  if (message.includes("invalid input syntax for type uuid"))
    return "One cart item has an invalid product reference. Remove it and add the product again.";
  return message || "The order could not be created. Please try again.";
};

export const ordersStore = {
  async place(order: Omit<Order, "id" | "code" | "createdAt" | "status">) {
    const { data: session } = await supabase.auth.getSession();
    const user = session.session?.user;
    if (!user) throw new Error("Sign in before placing an order");
    if (!parseCoordinates(order.destination?.lat, order.destination?.lng))
      throw new Error("Confirm a valid delivery entrance pin before placing an order.");
    if (!order.address.trim()) throw new Error("Add a delivery address before placing the order.");
    if (!order.lines.length) throw new Error("Your cart is empty.");

    // Curated storefront products are intentionally local demo catalog entries,
    // not rows in approved_product_catalog. Keep their checkout flow usable while
    // the real seller inventory integration is being connected.
    if (order.lines.some((line) => !isUuid(line.productId))) {
      const createdAt = Date.now();
      const demoOrder: Order = {
        ...order,
        id: crypto.randomUUID(),
        code: `LS-${String(createdAt).slice(-8)}`,
        createdAt,
        status: "new",
      };
      saveDemoOrder(user.id, demoOrder);
      return demoOrder;
    }

    const baseParams = {
      p_buyer_name: user.user_metadata?.display_name ?? user.email ?? "Customer",
      p_buyer_phone: user.phone ?? null,
      p_buyer_address: order.address,
      p_items: order.lines.map((line) => ({ product_id: line.productId, qty: line.qty })),
    };
    const rpcPayload = {
      ...baseParams,
      p_payment_method:
        order.paymentMethod === "UPI" ? "upi" : order.paymentMethod === "Card" ? "card" : "cod",
      p_coupon_code: order.couponCode ?? null,
      p_customer_latitude:
        order.destination && isValidCoordinate(order.destination.lat, order.destination.lng)
          ? order.destination.lat
          : null,
      p_customer_longitude:
        order.destination && isValidCoordinate(order.destination.lat, order.destination.lng)
          ? order.destination.lng
          : null,
    };

    const { data: created, error } = await (supabase as any).rpc("place_order_once", {
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
    const newOrder: Order = {
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
      etaMin: 25,
      distanceKm: 2.4,
    };
    updateOrdersCache([newOrder, ...getInitialCachedOrders()]);
    return newOrder;
  },
};

export async function advanceDemoOrder(orderId: string) {
  throw new Error("Order status is managed by the seller and delivery partner.");
}

export async function cancelOrder(orderId: string, reason: string): Promise<boolean> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;

  // 1. Update local storage demo order if present
  if (userId) {
    const demoOrders = loadDemoOrders(userId);
    const demoIndex = demoOrders.findIndex(
      (o) =>
        o.id === orderId ||
        o.code === orderId ||
        (o.code && o.code.toLowerCase() === orderId.toLowerCase()),
    );
    if (demoIndex !== -1) {
      demoOrders[demoIndex].status = "cancelled";
      demoOrders[demoIndex].cancellationReason = reason;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(demoOrdersKey(userId), JSON.stringify(demoOrders));
        window.dispatchEvent(new Event("storage"));
      }
    }
  }

  // 2. Update real Supabase order if UUID
  if (isUuid(orderId)) {
    try {
      const { error } = await (supabase as any)
        .from("orders")
        .update({
          status: "cancelled",
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) {
        console.warn("Supabase order cancellation update error:", error);
      }

      // Also cancel active delivery assignment if any
      await (supabase as any)
        .from("delivery_assignments")
        .update({ status: "cancelled" })
        .eq("order_id", orderId);
    } catch (err) {
      console.warn("Cancel order database update error:", err);
    }
  }

  // Also update cached order if present
  const currentCached = getInitialCachedOrders();
  const cachedIdx = currentCached.findIndex((o) => o.id === orderId || o.code === orderId);
  if (cachedIdx !== -1) {
    currentCached[cachedIdx].status = "cancelled";
    currentCached[cachedIdx].cancellationReason = reason;
    updateOrdersCache([...currentCached]);
  }

  return true;
}

export function useOrders() {
  return useOrdersState().orders;
}

import { toast } from "sonner";

function playCustomerOrderChimeSound() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
      gain.gain.setValueAtTime(0.35, ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.38);
    });
  } catch {}
}

export function useOrdersState() {
  const [orders, setOrders] = useState<Order[]>(() => getInitialCachedOrders());
  const [isLoading, setIsLoading] = useState<boolean>(() => getInitialCachedOrders().length === 0);

  useEffect(() => {
    let active = true;
    const refresh = () =>
      void loadOrders()
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
    const channel = supabase
      .channel("shoreline-orders")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload: any) => {
          const newStatus = payload.new?.status as OrderStatus | undefined;
          const oldStatus = payload.old?.status as OrderStatus | undefined;
          if (newStatus && newStatus !== oldStatus && orderStatusLabel[newStatus]) {
            playCustomerOrderChimeSound();
            toast.info(`📦 Order Status: ${orderStatusLabel[newStatus]}`, {
              id: `order-status-${payload.new?.id}`,
              duration: 8000,
            });
          }
          refresh();
        },
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, refresh)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delivery_assignments" },
        refresh,
      )
      .subscribe();

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      void supabase.removeChannel(channel);
    };
  }, []);

  return { orders, isLoading };
}
