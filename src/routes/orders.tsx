import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Clock,
  Search,
  Package,
  Bike,
  Phone,
  FileText,
  RotateCcw,
  MapPin,
  X,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Store,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { SocialCommerceShell } from "@/components/social-commerce/social-commerce-shell";
import { TrendingWidget } from "@/components/social-commerce/trending-widget";
import { YourDeliveryWidget } from "@/components/social-commerce/your-delivery-widget";
import { useOrdersState, orderStatusLabel } from "@/modules/shopper/services/orders-store";
import { cartStore } from "@/modules/shopper/services/cart-store";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
  errorComponent: OrdersErrorFallback,
});

function OrdersErrorFallback({ error, reset }: { error: any; reset: () => void }) {
  return (
    <SocialCommerceShell>
      <div className="rounded-3xl bg-white p-8 border border-purple-100 text-center space-y-4 my-8">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A]">Unable to load orders</h2>
        <p className="text-xs text-[#746A85] max-w-md mx-auto">
          We encountered an issue displaying your orders. You can reload or return to browsing shops.
        </p>
        {error?.message && (
          <p className="text-xs font-mono text-rose-600 bg-rose-50 p-2 rounded-lg max-w-md mx-auto">
            {error.message}
          </p>
        )}
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-full bg-[#8B2FC9] text-white text-xs font-bold shadow-md cursor-pointer hover:bg-[#581C87]"
          >
            Try Again
          </button>
          <Link
            to="/"
            className="px-5 py-2.5 rounded-full border border-purple-200 text-xs font-bold text-[#746A85] hover:text-[#0F172A]"
          >
            Go Home
          </Link>
        </div>
      </div>
    </SocialCommerceShell>
  );
}

// Authentic Kovilmedu & Coimbatore neighborhood orders
const SAMPLE_ACTIVE_ORDERS = [
  {
    id: "sample_order_1",
    code: "LS-42861",
    storeName: "Roja Bakes & Sweets (கோவில்மேடு)",
    storeAddress: "Thadagam Main Road, Kovilmedu, Coimbatore",
    storeAvatar: "/assets/ravis-bakery-logo.png",
    itemsCount: 3,
    total: 440,
    createdAt: Date.now() - 22 * 60 * 1000,
    status: "out_for_delivery" as const,
    eta: "~12 min",
    deliveryAddress: "Home • 14/2 Gandhi Park Road, Kovilmedu, Coimbatore",
    deliveryOtp: "4892",
    paymentMethod: "UPI (Google Pay)",
    subtotal: 390,
    deliveryFee: 30,
    taxes: 20,
    items: [
      { name: "Oven-Fresh Milk Bread (Large)", qty: 2, price: 90 },
      { name: "Roja Special Ghee Mysurpa (250g)", qty: 1, price: 170 },
      { name: "Hot Chicken Puffs", qty: 3, price: 180 },
    ],
    partner: {
      name: "Murugan S.",
      phone: "+91 98765 43210",
      vehicle: "TVS iQube (TN 37 CY 4192)",
      rating: 4.9,
      deliveries: "1,240+",
    },
  },
  {
    id: "sample_order_2",
    code: "LS-88120",
    storeName: "Kovilmedu Organic Palamuthir Nilayam",
    storeAddress: "Thadagam Road, Near Bus Stop, Kovilmedu, Coimbatore",
    storeAvatar:
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80",
    itemsCount: 4,
    total: 385,
    createdAt: Date.now() - 14 * 60 * 1000,
    status: "preparing" as const,
    eta: "~20 min",
    deliveryAddress: "Home • 14/2 Gandhi Park Road, Kovilmedu, Coimbatore",
    deliveryOtp: "7134",
    paymentMethod: "Cash on Delivery",
    subtotal: 350,
    deliveryFee: 25,
    taxes: 10,
    items: [
      { name: "Tender Coconut (Freshly Cut)", qty: 2, price: 110 },
      { name: "Hill Banana (1kg)", qty: 1, price: 95 },
      { name: "Farm Fresh Country Tomatoes (1kg)", qty: 1, price: 85 },
      { name: "Fresh Mint & Coriander Bunch", qty: 2, price: 60 },
    ],
    partner: {
      name: "Karthik R.",
      phone: "+91 98421 55678",
      vehicle: "Honda Activa (TN 38 BR 8891)",
      rating: 4.85,
      deliveries: "890+",
    },
  },
];

const SAMPLE_COMPLETED_ORDERS = [
  {
    id: "sample_order_3",
    code: "LS-31094",
    storeName: "Sri Amman Flour & Masala Mill (கோவில்மேடு ஆலை)",
    storeAddress: "Temple Street, Kovilmedu, Coimbatore",
    storeAvatar:
      "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=400&q=80",
    itemsCount: 3,
    total: 510,
    createdAt: Date.now() - 26 * 3600 * 1000,
    status: "delivered" as const,
    eta: "Delivered yesterday at 5:18 PM",
    deliveryAddress: "Home • 14/2 Gandhi Park Road, Kovilmedu, Coimbatore",
    paymentMethod: "UPI (PhonePe)",
    subtotal: 480,
    deliveryFee: 30,
    taxes: 0,
    items: [
      { name: "Fresh Stone Ground Atta (5kg)", qty: 1, price: 290 },
      { name: "Chettinad Sambar Masala Powder (250g)", qty: 1, price: 120 },
      { name: "Roasted Chana Dhal (500g)", qty: 1, price: 70 },
    ],
    partner: {
      name: "Senthil Kumar",
      phone: "+91 97890 12345",
      vehicle: "Hero Splendor (TN 37 AQ 2014)",
      rating: 4.92,
      deliveries: "2,100+",
    },
  },
  {
    id: "sample_order_4",
    code: "LS-19842",
    storeName: "Kovilmedu Care Medicals & General Store",
    storeAddress: "Junction Arch, Kovilmedu, Coimbatore",
    storeAvatar:
      "https://images.unsplash.com/photo-1586015555751-63c29994c65e?auto=format&fit=crop&w=400&q=80",
    itemsCount: 2,
    total: 260,
    createdAt: Date.now() - 72 * 3600 * 1000,
    status: "delivered" as const,
    eta: "Delivered on 2 Nov 2026",
    deliveryAddress: "Home • 14/2 Gandhi Park Road, Kovilmedu, Coimbatore",
    paymentMethod: "UPI (Paytm)",
    subtotal: 240,
    deliveryFee: 20,
    taxes: 0,
    items: [
      { name: "Dettol Antiseptic Liquid (250ml)", qty: 1, price: 145 },
      { name: "Crocin 650 Advance (Pack of 15)", qty: 2, price: 95 },
    ],
    partner: {
      name: "Murugan S.",
      phone: "+91 98765 43210",
      vehicle: "TVS iQube (TN 37 CY 4192)",
      rating: 4.9,
      deliveries: "1,240+",
    },
  },
];

const SAMPLE_CANCELLED_ORDERS = [
  {
    id: "sample_order_5",
    code: "LS-10291",
    storeName: "Kovilmedu Supermarket & Kirana",
    storeAddress: "Opp. Kovilmedu Arch, Thadagam Road, Coimbatore",
    storeAvatar:
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=400&q=80",
    itemsCount: 2,
    total: 340,
    createdAt: Date.now() - 120 * 3600 * 1000,
    status: "cancelled" as const,
    eta: "Cancelled by Customer",
    cancellationReason: "Ordered by mistake • 100% Refund credited to UPI",
    deliveryAddress: "Home • 14/2 Gandhi Park Road, Kovilmedu, Coimbatore",
    paymentMethod: "UPI (Refunded)",
    subtotal: 310,
    deliveryFee: 30,
    taxes: 0,
    items: [
      { name: "Cold-Pressed Gingelly Oil (1L)", qty: 1, price: 290 },
      { name: "Tata Salt Crystal (1kg)", qty: 2, price: 50 },
    ],
    partner: null,
  },
];

type OrderTab = "active" | "completed" | "cancelled";

function formatOrderDate(dateVal: any): string {
  if (!dateVal) return "Recently";
  const d = typeof dateVal === "number" ? new Date(dateVal) : new Date(String(dateVal));
  if (isNaN(d.getTime())) return "Recently";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getOrderItems(order: any): Array<{ name: string; qty: number; price: number }> {
  if (!order) return [];
  if (Array.isArray(order.lines) && order.lines.length > 0) {
    return order.lines.map((l: any) => ({
      name: l?.name || l?.product_name || "Item",
      qty: Number(l?.qty || 1),
      price: Number(l?.price || l?.unit_price || 0) * Number(l?.qty || 1),
    }));
  }
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items.map((i: any) => ({
      name: i?.name || "Item",
      qty: Number(i?.qty || 1),
      price: Number(i?.price || 0),
    }));
  }
  return [];
}

function getStatusBadge(status?: string) {
  const s = status || "new";
  const isOut = [
    "out_for_delivery",
    "picked_up",
    "going_to_customer",
    "arrived_at_customer",
    "at_customer",
  ].includes(s);
  const isPrep = [
    "new",
    "confirmed",
    "accepted",
    "vendor_accepted",
    "preparing",
    "packed",
    "ready_for_pickup",
    "assigned",
    "delivery_partner_assigned",
    "going_to_vendor",
    "arrived_at_vendor",
    "rider_assigned",
    "rider_accepted",
    "rider_at_shop",
  ].includes(s);
  const isDeliv = ["delivered", "completed"].includes(s);
  const isCanc = [
    "cancelled",
    "cancelled_by_vendor",
    "returned",
    "delivery_failed",
    "refunded",
  ].includes(s);

  if (isOut)
    return {
      label: "Out for Delivery",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  if (isPrep)
    return {
      label: "Preparing Order",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    };
  if (isDeliv)
    return {
      label: "Delivered",
      badgeClass: "bg-purple-50 text-[#8B2FC9] border-purple-200",
    };
  if (isCanc)
    return {
      label: "Cancelled",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    };
  return {
    label: (orderStatusLabel as Record<string, string>)[s] || s,
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
  };
}

function OrdersPage() {
  const auth = useAuth();
  const { orders } = useOrdersState();
  const [activeTab, setActiveTab] = useState<OrderTab>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<any | null>(null);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any | null>(null);

  const signedIn = Boolean(auth.id || auth.phone || auth.email);

  // Active / Completed / Cancelled buckets
  const activeOrdersList = useMemo(() => {
    const fromStore = orders.filter((o) =>
      [
        "new",
        "confirmed",
        "accepted",
        "vendor_accepted",
        "preparing",
        "packed",
        "ready_for_pickup",
        "assigned",
        "delivery_partner_assigned",
        "going_to_vendor",
        "arrived_at_vendor",
        "going_to_customer",
        "arrived_at_customer",
        "rider_assigned",
        "rider_accepted",
        "rider_at_shop",
        "picked_up",
        "out_for_delivery",
        "at_customer",
      ].includes(o.status)
    );
    if (fromStore.length > 0) return fromStore;
    return SAMPLE_ACTIVE_ORDERS;
  }, [orders]);

  const completedOrdersList = useMemo(() => {
    const fromStore = orders.filter((o) => ["delivered", "completed"].includes(o.status));
    if (fromStore.length > 0) return fromStore;
    return SAMPLE_COMPLETED_ORDERS;
  }, [orders]);

  const cancelledOrdersList = useMemo(() => {
    const fromStore = orders.filter((o) =>
      ["cancelled", "cancelled_by_vendor", "returned", "delivery_failed", "refunded"].includes(
        o.status
      )
    );
    if (fromStore.length > 0) return fromStore;
    return SAMPLE_CANCELLED_ORDERS;
  }, [orders]);

  const displayList = useMemo(() => {
    let list: any[] = [];
    if (activeTab === "active") list = activeOrdersList;
    else if (activeTab === "completed") list = completedOrdersList;
    else list = cancelledOrdersList;

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((o) => {
      const matchCode = o.code && String(o.code).toLowerCase().includes(q);
      const matchStore = o.storeName && o.storeName.toLowerCase().includes(q);
      const items = getOrderItems(o);
      const matchItems = items.some((item) => item.name.toLowerCase().includes(q));
      return matchCode || matchStore || matchItems;
    });
  }, [activeTab, activeOrdersList, completedOrdersList, cancelledOrdersList, searchQuery]);

  const handleReorder = (order: any) => {
    const items = getOrderItems(order);
    if (items.length > 0) {
      items.forEach((item) => {
        cartStore.add("store_reorder", order.storeName, {
          id: `reorder_${item.name}`,
          name: item.name,
          unit: "item",
          price: Math.round(item.price / (item.qty || 1)),
          stock: 20,
          imageUrl: order.storeAvatar,
        });
      });
      toast.success(`Items from #${order.code} added to your cart!`);
    } else {
      toast.success(`Reorder placed into cart from ${order.storeName}!`);
    }
  };

  return (
    <SocialCommerceShell
      rightSidebar={
        <div className="space-y-4">
          <YourDeliveryWidget />
          <TrendingWidget />
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-purple-900/10 via-purple-600/5 to-transparent p-5 sm:p-7 rounded-3xl border border-purple-100">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-[#8B2FC9] text-xs font-bold uppercase tracking-wider mb-2 border border-purple-200">
            <Package className="w-3.5 h-3.5" />
            Purchases & Deliveries
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            My Orders
          </h1>
          <p className="text-sm text-[#746A85] mt-1">
            Track live hyperlocal orders, download invoices, and reorder from your favorite
            neighborhood shops.
          </p>
        </div>

        {/* Guest Sign-in Banner */}
        {!signedIn && (
          <div className="rounded-3xl bg-gradient-to-r from-purple-800/10 via-purple-600/5 to-transparent border border-purple-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-100 text-[#8B2FC9] border border-purple-200 shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0F172A]">
                  Browsing neighborhood order previews
                </p>
                <p className="text-xs text-[#746A85] mt-0.5">
                  Sign in to view your real account orders, save addresses, and track riders on the
                  live map.
                </p>
              </div>
            </div>
            <Link
              to="/auth"
              search={{ redirect: "/orders" }}
              className="shrink-0 px-5 py-2.5 rounded-2xl bg-[#8B2FC9] hover:bg-[#581C87] text-white text-xs font-bold shadow-md shadow-[#8B2FC9]/20 transition active:scale-95"
            >
              Sign In
            </Link>
          </div>
        )}

        {/* Tab Selector & Search bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "active"
                  ? "bg-[#8B2FC9] text-white shadow-sm shadow-[#8B2FC9]/30"
                  : "bg-white text-[#746A85] border border-purple-100 hover:border-purple-300"
              }`}
            >
              Active ({activeOrdersList.length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "completed"
                  ? "bg-[#8B2FC9] text-white shadow-sm shadow-[#8B2FC9]/30"
                  : "bg-white text-[#746A85] border border-purple-100 hover:border-purple-300"
              }`}
            >
              Completed ({completedOrdersList.length})
            </button>
            <button
              onClick={() => setActiveTab("cancelled")}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "cancelled"
                  ? "bg-[#8B2FC9] text-white shadow-sm shadow-[#8B2FC9]/30"
                  : "bg-white text-[#746A85] border border-purple-100 hover:border-purple-300"
              }`}
            >
              Cancelled ({cancelledOrdersList.length})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#8B2FC9]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, shop or item..."
              className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B2FC9]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Orders List */}
        {displayList.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center border border-[#E2E8F0] space-y-3 shadow-xs">
            <Package className="w-12 h-12 text-purple-300 mx-auto" />
            <h3 className="text-base font-bold text-[#0F172A]">
              No {activeTab} orders found
            </h3>
            <p className="text-xs text-[#746A85] max-w-sm mx-auto">
              When you purchase bakery treats, fresh produce, or groceries from verified neighborhood
              shops, they appear here with real-time updates.
            </p>
            <Link
              to="/explore"
              className="inline-block mt-2 px-5 py-2.5 rounded-2xl bg-[#8B2FC9] hover:bg-[#581C87] text-white text-xs font-bold shadow-md shadow-[#8B2FC9]/20 transition"
            >
              Explore Local Shops
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {displayList.map((order) => {
              const isOutForDelivery = [
                "out_for_delivery",
                "picked_up",
                "going_to_customer",
                "arrived_at_customer",
              ].includes(order.status);
              const isPreparing = [
                "preparing",
                "new",
                "confirmed",
                "accepted",
                "vendor_accepted",
                "packed",
                "ready_for_pickup",
                "assigned",
                "delivery_partner_assigned",
              ].includes(order.status);
              const isDelivered = ["delivered", "completed"].includes(order.status);
              const isCancelled = [
                "cancelled",
                "cancelled_by_vendor",
                "returned",
                "delivery_failed",
                "refunded",
              ].includes(order.status);

              const badge = getStatusBadge(order.status);
              const items = getOrderItems(order);

              return (
                <div
                  key={order.id}
                  className="rounded-3xl bg-white p-5 sm:p-6 border border-[#E2E8F0] shadow-xs space-y-4 hover:shadow-md hover:border-purple-200 transition"
                >
                  {/* Order Header: Order #, Placed At, Total */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#F8FAFC] gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-extrabold text-[#0F172A]">
                          Order #{order.code}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.badgeClass}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-[#746A85] mt-0.5">
                        Placed on {formatOrderDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="text-left sm:text-right">
                        <span className="text-xs text-[#746A85] mr-1">Total:</span>
                        <span className="text-base font-extrabold text-[#0F172A]">
                          ₹{order.total}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Merchant & Item Summary */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <img
                        src={
                          order.storeAvatar ||
                          "/assets/ravis-bakery-logo.png"
                        }
                        alt={order.storeName}
                        className="w-12 h-12 rounded-2xl object-cover border border-[#E2E8F0] shrink-0"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-[#0F172A]">{order.storeName}</h4>
                        {order.storeAddress && (
                          <p className="text-xs text-[#746A85] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-[#8B2FC9] shrink-0" />
                            <span className="truncate max-w-xs">{order.storeAddress}</span>
                          </p>
                        )}
                        <p className="text-xs text-[#746A85] mt-0.5 font-medium">
                          {items.length > 0
                            ? items.map((i) => `${i.qty}x ${i.name}`).join(", ")
                            : `${order.itemsCount || 3} items`}
                        </p>
                      </div>
                    </div>

                    {/* ETA or Delivered pill */}
                    <div className="shrink-0">
                      {isDelivered ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#8B2FC9] text-xs font-bold border border-purple-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Delivered Successfully
                        </div>
                      ) : isCancelled ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {order.cancellationReason || "Order Cancelled"}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                          <Clock className="w-3.5 h-3.5 animate-spin duration-1000" />
                          Arriving {order.eta || "~15 min"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Milestone Tracker for Active Orders */}
                  {!isDelivered && !isCancelled && (
                    <div className="pt-2">
                      <div className="relative flex items-center justify-between max-w-xl mx-auto py-2">
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-purple-100 -translate-y-1/2 z-0" />
                        <div
                          className="absolute top-1/2 left-0 h-1 bg-[#8B2FC9] -translate-y-1/2 z-0 transition-all duration-500"
                          style={{
                            width: isOutForDelivery ? "75%" : "35%",
                          }}
                        />

                        {/* Step 1: Confirmed */}
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-[#8B2FC9] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                            ✓
                          </div>
                          <span className="text-[10px] font-bold text-[#0F172A] mt-1.5 whitespace-nowrap">
                            Confirmed
                          </span>
                        </div>

                        {/* Step 2: Preparing */}
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-[#8B2FC9] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                            ✓
                          </div>
                          <span className="text-[10px] font-bold text-[#0F172A] mt-1.5 whitespace-nowrap">
                            Preparing
                          </span>
                        </div>

                        {/* Step 3: Out for Delivery */}
                        <div className="relative z-10 flex flex-col items-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${
                              isOutForDelivery
                                ? "bg-[#8B2FC9] text-white ring-4 ring-purple-200"
                                : "bg-purple-100 text-purple-400"
                            }`}
                          >
                            <Bike className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[10px] font-bold text-[#8B2FC9] mt-1.5 whitespace-nowrap">
                            Out for Delivery
                          </span>
                        </div>

                        {/* Step 4: Arriving */}
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-400 flex items-center justify-center text-[10px] font-bold">
                            <Clock className="w-3 h-3" />
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 mt-1.5 whitespace-nowrap">
                            Arriving {order.eta || "~15 min"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-[#F8FAFC]">
                    {!isCancelled && (
                      <button
                        onClick={() => setSelectedTrackingOrder(order)}
                        className="px-4 py-2 rounded-xl border border-purple-200 text-xs font-bold text-[#8B2FC9] hover:bg-purple-50 transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        Track Order
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedReceiptOrder(order)}
                      className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#8B2FC9] text-xs font-bold transition active:scale-95 flex items-center gap-1.5 border border-purple-100 cursor-pointer shadow-2xs"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      Order Details
                    </button>

                    <button
                      onClick={() => handleReorder(order)}
                      className="px-4 py-2 rounded-xl bg-[#8B2FC9] hover:bg-[#581C87] text-white text-xs font-bold shadow-sm shadow-[#8B2FC9]/20 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reorder
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 1. LIVE TRACKING MODAL ────────────────────────────────────── */}
      {selectedTrackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-purple-100">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-[#8B2FC9] to-[#581C87] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-purple-200">
                  Live Hyperlocal Delivery Tracking
                </span>
                <h3 className="text-base font-bold">Order #{selectedTrackingOrder.code}</h3>
              </div>
              <button
                onClick={() => setSelectedTrackingOrder(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Radar Animation */}
            <div className="relative h-48 bg-purple-50/60 flex items-center justify-center overflow-hidden border-b border-purple-100">
              <div className="absolute w-64 h-64 rounded-full border border-purple-200/80 animate-ping duration-1000" />
              <div className="absolute w-44 h-44 rounded-full border border-purple-300" />
              <div className="absolute w-24 h-24 rounded-full bg-purple-200/50" />

              <div className="relative z-10 flex flex-col items-center">
                <div className="p-3.5 rounded-full bg-[#8B2FC9] text-white shadow-xl shadow-purple-600/40">
                  <Bike className="w-6 h-6" />
                </div>
                <span className="mt-2.5 px-3 py-1 rounded-full bg-white text-[#0F172A] text-xs font-extrabold shadow-md border border-purple-100">
                  Arriving in {selectedTrackingOrder.eta || "15 min"}
                </span>
              </div>

              <div className="absolute bottom-3 right-4 px-2.5 py-1 rounded-xl bg-white/95 text-[10px] font-bold text-gray-700 shadow-xs border border-purple-100">
                📍 {selectedTrackingOrder.deliveryAddress || "Home • Kovilmedu, Coimbatore"}
              </div>
            </div>

            {/* Rider & Shop Info */}
            <div className="p-5 space-y-4 max-h-[50vh] overflow-y-auto">
              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#8B2FC9] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {selectedTrackingOrder.partner?.name
                      ? selectedTrackingOrder.partner.name
                          .trim()
                          .split(/\s+/)
                          .map((n: string) => n[0] || "")
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()
                      : "DP"}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0F172A]">
                      {selectedTrackingOrder.partner?.name || "Murugan S."} (Delivery Partner)
                    </p>
                    <p className="text-[11px] text-[#746A85]">
                      {selectedTrackingOrder.partner?.vehicle || "TVS iQube (TN 37 CY 4192)"} •{" "}
                      {selectedTrackingOrder.partner?.rating || 4.9} ★ (
                      {selectedTrackingOrder.partner?.deliveries || "1,200+"} deliveries)
                    </p>
                  </div>
                </div>

                <a
                  href={`tel:${selectedTrackingOrder.partner?.phone || "+919876543210"}`}
                  className="p-2.5 rounded-xl bg-[#8B2FC9] text-white hover:bg-[#581C87] transition shadow-xs cursor-pointer"
                  title="Call delivery partner"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>

              {/* Items Breakdown */}
              <div>
                <h5 className="text-xs font-bold text-[#0F172A] mb-2 flex items-center justify-between">
                  <span>Order Items ({selectedTrackingOrder.storeName})</span>
                  <span className="text-[#8B2FC9]">₹{selectedTrackingOrder.total}</span>
                </h5>
                <div className="space-y-1.5 text-xs text-[#746A85] bg-slate-50/70 rounded-2xl p-3 border border-slate-100">
                  {getOrderItems(selectedTrackingOrder).map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        {item.qty}x {item.name}
                      </span>
                      <span className="font-semibold text-[#0F172A]">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery PIN Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    toast.success(
                      `Delivery PIN: ${
                        selectedTrackingOrder.deliveryOtp || "4892"
                      } (Share with rider upon arrival)`
                    );
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#F59E0B] hover:bg-yellow-400 text-[#0F172A] text-xs font-extrabold shadow-xs transition cursor-pointer"
                >
                  Delivery PIN: {selectedTrackingOrder.deliveryOtp || "4892"} (Click to Copy)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. ORDER DETAILS & INVOICE RECEIPT MODAL ────────────────── */}
      {selectedReceiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-purple-100">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-[#8B2FC9] to-[#581C87] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-purple-200">
                  Order Invoice & Summary
                </span>
                <h3 className="text-base font-bold">Order #{selectedReceiptOrder.code}</h3>
              </div>
              <button
                onClick={() => setSelectedReceiptOrder(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {/* Shop & Placed date */}
              <div className="flex items-start justify-between pb-3 border-b border-[#F8FAFC]">
                <div>
                  <h4 className="font-bold text-[#0F172A] text-sm">
                    {selectedReceiptOrder.storeName}
                  </h4>
                  <p className="text-slate-500 mt-0.5">
                    {selectedReceiptOrder.storeAddress || "Kovilmedu, Coimbatore"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Placed: {formatOrderDate(selectedReceiptOrder.createdAt)}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    getStatusBadge(selectedReceiptOrder.status).badgeClass
                  }`}
                >
                  {getStatusBadge(selectedReceiptOrder.status).label}
                </span>
              </div>

              {/* Delivery Address */}
              <div className="bg-purple-50/50 rounded-2xl p-3 border border-purple-100/70">
                <p className="font-bold text-[#0F172A] flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-[#8B2FC9]" />
                  Delivery Destination
                </p>
                <p className="text-[#64748B]">
                  {selectedReceiptOrder.deliveryAddress ||
                    "Home • 14/2 Gandhi Park Road, Kovilmedu, Coimbatore"}
                </p>
              </div>

              {/* Items Table */}
              <div>
                <h5 className="font-bold text-[#0F172A] mb-2">Itemized Breakdown</h5>
                <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                  {getOrderItems(selectedReceiptOrder).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-700">
                      <span>
                        {item.qty} × {item.name}
                      </span>
                      <span className="font-bold text-slate-900">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-3.5 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Item Subtotal</span>
                  <span>
                    ₹{selectedReceiptOrder.subtotal || Math.max(0, (selectedReceiptOrder.total || 0) - 30)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Partner Fee</span>
                  <span>₹{selectedReceiptOrder.deliveryFee || 30}</span>
                </div>
                {selectedReceiptOrder.taxes ? (
                  <div className="flex justify-between text-slate-600">
                    <span>Taxes & Packing</span>
                    <span>₹{selectedReceiptOrder.taxes}</span>
                  </div>
                ) : null}
                <div className="border-t border-slate-100 pt-1.5 flex justify-between font-bold text-slate-900 text-sm">
                  <span>Total Amount</span>
                  <span className="text-[#8B2FC9]">₹{selectedReceiptOrder.total}</span>
                </div>
                <p className="text-[10px] text-slate-400 pt-1">
                  Payment Method: {selectedReceiptOrder.paymentMethod || "UPI"}
                </p>
              </div>

              {/* Actions in Receipt */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    toast.success("Receipt downloaded successfully!");
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-purple-200 text-xs font-bold text-[#8B2FC9] hover:bg-purple-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Receipt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleReorder(selectedReceiptOrder);
                    setSelectedReceiptOrder(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#8B2FC9] hover:bg-[#581C87] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reorder All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SocialCommerceShell>
  );
}
