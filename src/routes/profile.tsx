import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Award,
  MapPin,
  CreditCard,
  Package,
  Heart,
  Ticket,
  Sparkles,
  Store,
  Clock,
  Star,
  ChevronRight,
  Bell,
  Truck,
  Sliders,
  HelpCircle,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Map,
  Lock,
  Smartphone,
  Globe,
  MessageSquare,
  X,
  Check,
  Zap,
  ArrowRight,
  TrendingUp,
  Shield,
  Layers,
  ThumbsUp,
  AlertCircle,
  Percent,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-store";
import { useAddresses, addressesStore, type Address } from "@/lib/addresses-store";
import { useOrders } from "@/lib/orders-store";
import { useWishlistProducts } from "@/lib/merchandising";
import { stores } from "@/lib/mock-data";
import { profileStore, useProfileExtra, type PaymentMethod, type RewardItem } from "@/lib/profile-store";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const addresses = useAddresses();
  const orders = useOrders();
  const wishlistProducts = useWishlistProducts();
  const profileExtra = useProfileExtra();

  const signedIn = Boolean(auth.id || auth.phone || auth.email);

  // Active sub-tab state for smooth browsing
  const [activeTab, setActiveTab] = useState<
    "all" | "account" | "localshore" | "activity" | "offers" | "delivery" | "notifications" | "settings" | "support"
  >("all");

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState<string | null>(null);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);

  // Form states
  const [editName, setEditName] = useState(auth.name || "");
  const [editLanguage, setEditLanguage] = useState(profileExtra.preferredLanguage);
  const [editHub, setEditHub] = useState(profileExtra.preferredHub);

  // New address state
  const [newAddrLabel, setNewAddrLabel] = useState("Home");
  const [newAddrLine, setNewAddrLine] = useState("");

  // New payment state
  const [newPayType, setNewPayType] = useState<"upi" | "card">("upi");
  const [newPayTitle, setNewPayTitle] = useState("");
  const [newPaySub, setNewPaySub] = useState("");

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  // Filtered favorite stores
  const favoriteStores = stores.filter((s) => profileExtra.favoriteShopIds.includes(s.id));
  const visitedStores = stores.filter((s) => profileExtra.recentlyVisitedShopIds.includes(s.id));

  // Active recent order preview
  const recentOrder = orders[0];

  const maskPhone = (phone?: string | null) => {
    if (!phone) return "+91 ••••• •••••";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length >= 10) {
      return `+91 ${cleaned.slice(0, 2)}•••• ••${cleaned.slice(-2)}`;
    }
    return phone;
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ── 1. PROFILE HERO ──────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50/80 via-white to-amber-50/40 p-5 shadow-xs sm:p-7">
          {signedIn ? (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-700 to-primary font-display text-2xl font-bold text-white shadow-md shadow-purple-900/20 sm:h-20 sm:w-20 sm:text-3xl">
                    {auth.name
                      ? auth.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()
                      : "LM"}
                  </div>
                  <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">
                      {auth.name || "LocalShore Member"}
                    </h1>
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800 border border-purple-200">
                      <Sparkles className="h-3 w-3 fill-purple-600 text-purple-600" /> LocalShore Member
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-purple-600" />
                      {auth.email || "No email registered"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-purple-600" />
                      {maskPhone(auth.phone)}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <MapPin className="h-3.5 w-3.5" />
                      Hub: {profileExtra.preferredHub}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-white px-4 py-2 text-xs font-bold text-purple-900 shadow-xs transition hover:bg-purple-50"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit profile
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    toast.success("Signed out successfully");
                    navigate({ to: "/", search: { category: undefined, q: undefined } });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/60 px-3.5 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-800 border border-purple-200">
                  <Store className="h-3.5 w-3.5" /> Your Neighborhood, Delivered
                </span>
                <h1 className="mt-2 font-display text-2xl font-bold text-slate-900 sm:text-3xl">
                  Welcome to LocalShore 👋
                </h1>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Sign in to track orders in real time, save delivery addresses, follow your favorite local shops, unlock exclusive neighborhood discounts, and earn LocalShore Shore Points.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 sm:min-w-[200px]">
                <Link
                  to="/auth"
                  search={{ redirect: "/profile" }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 text-sm font-bold text-white shadow-md shadow-purple-900/20 transition hover:bg-purple-800"
                >
                  <User className="h-4 w-4" /> Sign in / Create account
                </Link>
                <Link
                  to="/"
                  search={{ category: undefined, q: undefined }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-white px-5 py-2.5 text-xs font-bold text-purple-900 transition hover:bg-purple-50"
                >
                  <Store className="h-3.5 w-3.5" /> Explore local shops
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── GUEST BENEFIT CARDS ────────────────────────────────────────────── */}
        {!signedIn && (
          <div className="mt-6">
            <h2 className="font-display text-base font-bold text-slate-900">Why create a LocalShore account?</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { title: "Live Order Tracking", desc: "Follow instant 20-min store delivery", icon: Package },
                { title: "Saved Addresses", desc: "One-tap checkout for home & work", icon: MapPin },
                { title: "Follow Local Shops", desc: "Get updates from neighborhood stores", icon: Store },
                { title: "Wishlist & Price Alerts", desc: "Save products and catch discounts", icon: Heart },
                { title: "Local Offers", desc: "Unlock exclusive neighborhood coupons", icon: Ticket },
                { title: "Shore Points", desc: "Earn rewards on every local purchase", icon: Sparkles },
              ].map((b, i) => (
                <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-3.5 text-center shadow-xs">
                  <div className="mx-auto grid h-9 w-9 place-items-center rounded-xl bg-purple-50 text-purple-700">
                    <b.icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-2 text-xs font-bold text-slate-900">{b.title}</h3>
                  <p className="mt-1 text-[11px] text-slate-500 leading-tight">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 2. QUICK ACCOUNT SUMMARY ────────────────────────────────────── */}
        {signedIn && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => setActiveTab("activity")}
              className="flex items-center gap-3.5 rounded-2xl border border-purple-100 bg-white p-3.5 text-left shadow-xs transition hover:border-purple-300 hover:shadow-md group"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 transition group-hover:bg-amber-100">
                <Package className="h-5.5 w-5.5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Orders</p>
                <p className="text-base font-extrabold text-slate-900">
                  {orders.length} {orders.length === 1 ? "Order" : "Orders"}
                </p>
              </div>
            </button>

            <Link
              to="/wishlist"
              className="flex items-center gap-3.5 rounded-2xl border border-purple-100 bg-white p-3.5 text-left shadow-xs transition hover:border-purple-300 hover:shadow-md group"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600 transition group-hover:bg-rose-100">
                <Heart className="h-5.5 w-5.5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Wishlist</p>
                <p className="text-base font-extrabold text-slate-900">
                  {wishlistProducts.data?.length ?? 0} Saved
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setActiveTab("offers")}
              className="flex items-center gap-3.5 rounded-2xl border border-purple-100 bg-white p-3.5 text-left shadow-xs transition hover:border-purple-300 hover:shadow-md group"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-purple-50 text-purple-700 transition group-hover:bg-purple-100">
                <Ticket className="h-5.5 w-5.5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Coupons</p>
                <p className="text-base font-extrabold text-slate-900">
                  {profileExtra.savedCoupons.length} Available
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("offers")}
              className="flex items-center gap-3.5 rounded-2xl border border-purple-100 bg-white p-3.5 text-left shadow-xs transition hover:border-purple-300 hover:shadow-md group"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-100">
                <Sparkles className="h-5.5 w-5.5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rewards</p>
                <p className="text-base font-extrabold text-slate-900">
                  {profileExtra.rewardsPoints} Points
                </p>
              </div>
            </button>
          </div>
        )}

        {/* ── NAVIGATION TABS (AUTHENTICATED) ───────────────────────────────── */}
        {signedIn && (
          <div className="mt-6 flex overflow-x-auto border-b border-slate-200 pb-1 scrollbar-none gap-2">
            {[
              { id: "all", label: "Overview" },
              { id: "account", label: "Account & Addresses" },
              { id: "localshore", label: "Your LocalShore" },
              { id: "activity", label: "Shopping Activity" },
              { id: "offers", label: "Rewards & Offers" },
              { id: "delivery", label: "Delivery & Alerts" },
              { id: "settings", label: "Settings & Support" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition ${
                  activeTab === tab.id
                    ? "bg-purple-700 text-white shadow-xs"
                    : "text-slate-600 hover:bg-purple-50 hover:text-purple-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ── MAIN CONTENT AREA ────────────────────────────────────────────── */}
        {signedIn && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* LEFT COLUMN: Main Account Management */}
            <div className="space-y-6 lg:col-span-8">
              {/* 3. ACCOUNT SECTION */}
              {(activeTab === "all" || activeTab === "account") && (
                <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                        <User className="h-5 w-5 text-purple-700" /> Account Settings
                      </h2>
                      <p className="text-xs text-slate-500">Manage personal details, addresses, and payment methods</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-5">
                    {/* Personal Info Row */}
                    <div className="flex flex-col gap-3 rounded-2xl bg-purple-50/40 p-4 border border-purple-100/60 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-purple-900">Personal Information</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{auth.name || "Customer"}</p>
                        <p className="text-xs text-slate-600">{auth.email} • {maskPhone(auth.phone)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditProfileOpen(true)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:underline"
                      >
                        Edit profile →
                      </button>
                    </div>

                    {/* Saved Addresses Sub-Section */}
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-purple-700" /> Saved Addresses ({addresses.length})
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsAddAddressOpen(true)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:bg-purple-50 px-2.5 py-1 rounded-lg transition"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Address
                        </button>
                      </div>

                      {addresses.length === 0 ? (
                        <div className="mt-3 rounded-2xl border border-dashed border-slate-200 p-5 text-center">
                          <MapPin className="mx-auto h-6 w-6 text-slate-400" />
                          <p className="mt-2 text-xs font-medium text-slate-700">No saved addresses found</p>
                          <button
                            type="button"
                            onClick={() => setIsAddAddressOpen(true)}
                            className="mt-2 text-xs font-bold text-purple-700 underline"
                          >
                            + Add a new delivery address
                          </button>
                        </div>
                      ) : (
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {addresses.map((addr, idx) => (
                            <div
                              key={addr.id}
                              className="relative flex flex-col justify-between rounded-2xl border border-slate-200 p-4 transition hover:border-purple-300 hover:shadow-xs"
                            >
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-900">
                                    <MapPin className="h-3.5 w-3.5 text-purple-700" /> {addr.label}
                                  </span>
                                  {idx === 0 && (
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="mt-2 line-clamp-2 text-xs text-slate-600 leading-snug">{addr.line}</p>
                              </div>

                              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                                <span className="font-mono text-slate-400">Lat: {addr.lat.toFixed(2)}, Lng: {addr.lng.toFixed(2)}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    addressesStore.remove(addr.id);
                                    toast.success("Address removed");
                                  }}
                                  className="text-rose-600 font-bold hover:underline inline-flex items-center gap-0.5"
                                >
                                  <Trash2 className="h-3 w-3" /> Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Payment Methods Sub-Section */}
                    <div className="border-t border-slate-100 pt-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <CreditCard className="h-4 w-4 text-purple-700" /> Payment Methods
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsAddPaymentOpen(true)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:bg-purple-50 px-2.5 py-1 rounded-lg transition"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Payment
                        </button>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {profileExtra.paymentMethods.map((pay) => (
                          <div
                            key={pay.id}
                            className="flex items-center justify-between rounded-2xl border border-slate-200 p-3.5"
                          >
                            <div className="flex items-center gap-3">
                              <div className="grid h-9 w-9 place-items-center rounded-xl bg-purple-50 text-purple-700 font-bold text-xs">
                                {pay.type === "upi" ? "UPI" : "CARD"}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                  {pay.title}
                                  {pay.isDefault && (
                                    <span className="rounded-full bg-purple-100 px-2 py-0.2 text-[9px] font-bold text-purple-800">
                                      Default
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] font-mono text-slate-500">{pay.subtitle}</p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                profileStore.deletePaymentMethod(pay.id);
                                toast.success("Payment method removed");
                              }}
                              className="text-slate-400 hover:text-rose-600 transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* 4. LOCALSHORE-SPECIFIC SECTION */}
              {(activeTab === "all" || activeTab === "localshore") && (
                <section className="rounded-3xl border border-purple-100 bg-white p-5 shadow-xs sm:p-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Store className="h-5 w-5 text-purple-700" /> Your LocalShore
                      </h2>
                      <p className="text-xs text-slate-500">Neighborhood sellers, favorite stores, and local offers</p>
                    </div>
                    <Link
                      to="/"
                      search={{ category: undefined, q: undefined }}
                      className="text-xs font-bold text-purple-700 hover:underline inline-flex items-center gap-1"
                    >
                      Discover all shops <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {/* Favorite Shops */}
                  <div className="mt-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Favorite Shops ({favoriteStores.length})</h3>
                    {favoriteStores.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-500">No favorite shops saved yet. Click the heart icon on any store to follow it!</p>
                    ) : (
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {favoriteStores.map((shop) => (
                          <Link
                            key={shop.id}
                            to="/store/$storeId"
                            params={{ storeId: shop.id }}
                            className="group flex flex-col justify-between rounded-2xl border border-slate-200 p-3.5 transition hover:border-purple-300 hover:shadow-sm"
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700">
                                  <Store className="h-3.5 w-3.5" /> {shop.category}
                                </span>
                                <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                                  <Star className="h-3.5 w-3.5 fill-amber-400" /> {shop.rating}
                                </span>
                              </div>
                              <h4 className="mt-2 text-xs font-bold text-slate-900 group-hover:text-purple-700 transition">
                                {shop.name}
                              </h4>
                              <p className="text-[11px] text-slate-500 truncate">{shop.address}</p>
                            </div>
                            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                              <span className="font-semibold text-slate-600">{shop.distanceKm} km away</span>
                              <span className="font-bold text-purple-700">Visit Shop →</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recently Visited Shops */}
                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Recently Visited Sellers</h3>
                    <div className="mt-3 flex overflow-x-auto gap-3 pb-2 scrollbar-none">
                      {visitedStores.map((shop) => (
                        <Link
                          key={shop.id}
                          to="/store/$storeId"
                          params={{ storeId: shop.id }}
                          className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/50 p-2.5 pr-4 transition hover:bg-purple-50/50"
                        >
                          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-purple-100 flex items-center justify-center font-bold text-purple-800 text-xs">
                            {shop.name[0]}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{shop.name}</p>
                            <p className="text-[10px] text-slate-500">{shop.distanceKm} km · {shop.etaMin} mins</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* 5. SHOPPING ACTIVITY SECTION */}
              {(activeTab === "all" || activeTab === "activity") && (
                <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Package className="h-5 w-5 text-purple-700" /> Shopping Activity
                      </h2>
                      <p className="text-xs text-slate-500">Recent orders, reviews, and wishlist</p>
                    </div>
                    <Link to="/orders" className="text-xs font-bold text-purple-700 hover:underline">
                      View all orders →
                    </Link>
                  </div>

                  {/* Active Order Banner Preview */}
                  {recentOrder ? (
                    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-bold text-emerald-900 uppercase">Order #{recentOrder.code || recentOrder.id.slice(0, 8)}</span>
                            <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-900 capitalize">
                              {recentOrder.status.replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-700">
                            {recentOrder.storeName} · {recentOrder.lines.length} items · Total ₹{recentOrder.total}
                          </p>
                        </div>
                        <Link
                          to="/order/$orderId"
                          params={{ orderId: recentOrder.id }}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition"
                        >
                          Track order →
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-slate-200 p-4 text-center">
                      <p className="text-xs text-slate-600">No active orders right now.</p>
                      <Link to="/" className="mt-1 text-xs font-bold text-purple-700 underline">Start shopping from neighborhood stores</Link>
                    </div>
                  )}

                  {/* Reviews Pending */}
                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Rate Your Recent Purchases</h3>
                    {profileExtra.pendingReviewItems.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-500">All purchased items have been reviewed! Thank you.</p>
                    ) : (
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {profileExtra.pendingReviewItems.map((rev) => (
                          <div key={rev.id} className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/40 p-3.5">
                            <div>
                              <p className="text-xs font-bold text-slate-900">{rev.productName}</p>
                              <p className="text-[11px] text-slate-600">{rev.shopName} · {rev.purchasedDate}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsReviewOpen(rev.id)}
                              className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-xs hover:bg-amber-400 transition"
                            >
                              Rate now
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* 6. OFFERS & REWARDS SECTION */}
              {(activeTab === "all" || activeTab === "offers") && (
                <section className="rounded-3xl border border-purple-100 bg-white p-5 shadow-xs sm:p-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-700" /> LocalShore Rewards & Offers
                      </h2>
                      <p className="text-xs text-slate-500">Points, active coupons, and cashback credits</p>
                    </div>
                  </div>

                  {/* Points Card */}
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-gradient-to-br from-purple-900 to-purple-800 p-5 text-white shadow-md">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-purple-200">
                          <Sparkles className="h-3.5 w-3.5 fill-purple-300" /> LocalShore Balance
                        </span>
                        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-white">
                          Loyalty Tier 1
                        </span>
                      </div>
                      <p className="mt-3 font-display text-3xl font-extrabold text-white">{profileExtra.rewardsPoints} Shore Points</p>
                      <p className="mt-1 text-xs text-purple-200">100 Points = ₹50 Discount Voucher</p>
                      <button
                        type="button"
                        onClick={() => setIsRedeemOpen(true)}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-purple-900 shadow-sm hover:bg-purple-50 transition"
                      >
                        Redeem points →
                      </button>
                    </div>

                    {/* Store Credits */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Refund & Store Credits</p>
                      <p className="mt-3 font-display text-3xl font-extrabold text-slate-900">₹150.00</p>
                      <p className="mt-1 text-xs text-slate-600">Auto-applied at checkout for instant delivery</p>
                    </div>
                  </div>

                  {/* Saved Coupons List */}
                  <div className="mt-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Available Coupons ({profileExtra.savedCoupons.length})</h3>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {profileExtra.savedCoupons.map((c, i) => (
                        <div key={i} className="flex items-center justify-between rounded-2xl border border-purple-200 bg-purple-50/50 p-3.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-purple-900 bg-white px-2 py-0.5 rounded border border-purple-200">{c.code}</span>
                              <span className="text-xs font-extrabold text-purple-700">{c.discountText}</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-700">{c.title}</p>
                            <p className="text-[10px] text-slate-500">Min. order ₹{c.minOrder} · {c.expires}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(c.code);
                              toast.success(`Coupon ${c.code} copied to clipboard!`);
                            }}
                            className="rounded-xl border border-purple-300 bg-white px-3 py-1.5 text-xs font-bold text-purple-900 transition hover:bg-purple-100"
                          >
                            Copy
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* RIGHT COLUMN: Settings, Delivery & Support */}
            <div className="space-y-6 lg:col-span-4">
              {/* 8. DELIVERY PREFERENCES */}
              {(activeTab === "all" || activeTab === "delivery" || activeTab === "settings") && (
                <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
                  <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Truck className="h-4.5 w-4.5 text-purple-700" /> Delivery Preferences
                  </h2>

                  <div className="mt-4 space-y-3.5 text-xs">
                    <label className="flex items-center justify-between cursor-pointer rounded-xl bg-slate-50 p-2.5">
                      <span className="font-bold text-slate-800">Contactless Delivery</span>
                      <input
                        type="checkbox"
                        checked={profileExtra.deliveryPreferences.contactless}
                        onChange={(e) => profileStore.updateDeliveryPreferences({ contactless: e.target.checked })}
                        className="h-4 w-4 rounded accent-purple-700"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer rounded-xl bg-slate-50 p-2.5">
                      <span className="font-bold text-slate-800">Call Before Delivery</span>
                      <input
                        type="checkbox"
                        checked={profileExtra.deliveryPreferences.callBeforeDelivery}
                        onChange={(e) => profileStore.updateDeliveryPreferences({ callBeforeDelivery: e.target.checked })}
                        className="h-4 w-4 rounded accent-purple-700"
                      />
                    </label>

                    <div>
                      <span className="font-bold text-slate-800 block mb-1">Preferred Slot</span>
                      <select
                        value={profileExtra.deliveryPreferences.preferredSlot}
                        onChange={(e) => profileStore.updateDeliveryPreferences({ preferredSlot: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-800"
                      >
                        <option value="Anytime">Anytime (Instant 20-30 min)</option>
                        <option value="Morning">Morning (8 AM - 12 PM)</option>
                        <option value="Evening">Evening (4 PM - 8 PM)</option>
                      </select>
                    </div>

                    <div>
                      <span className="font-bold text-slate-800 block mb-1">Delivery Instructions</span>
                      <textarea
                        value={profileExtra.deliveryPreferences.instructions}
                        onChange={(e) => profileStore.updateDeliveryPreferences({ instructions: e.target.value })}
                        rows={2}
                        className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-800 placeholder:text-slate-400"
                        placeholder="e.g. Leave with gate guard"
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* 7. NOTIFICATIONS PREFERENCES */}
              {(activeTab === "all" || activeTab === "notifications" || activeTab === "settings") && (
                <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
                  <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Bell className="h-4.5 w-4.5 text-purple-700" /> Notifications
                  </h2>

                  <div className="mt-4 space-y-2 text-xs">
                    {[
                      { key: "orderStatus", label: "Order Status Updates" },
                      { key: "priceDrops", label: "Price Drops on Wishlist" },
                      { key: "nearbyShopOffers", label: "Nearby Shop Offers" },
                      { key: "localDeals", label: "Local Deals & Discounts" },
                      { key: "promotionalOffers", label: "Promotional SMS / Email" },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center justify-between cursor-pointer py-1.5 border-b hairline last:border-0">
                        <span className="font-semibold text-slate-700">{item.label}</span>
                        <input
                          type="checkbox"
                          checked={(profileExtra.notificationSettings as any)[item.key]}
                          onChange={() => profileStore.toggleNotification(item.key as any)}
                          className="h-4 w-4 rounded accent-purple-700"
                        />
                      </label>
                    ))}
                  </div>
                </section>
              )}

              {/* 10. HELP & SUPPORT */}
              {(activeTab === "all" || activeTab === "support" || activeTab === "settings") && (
                <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
                  <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <HelpCircle className="h-4.5 w-4.5 text-purple-700" /> Help & Support
                  </h2>

                  <div className="mt-4 space-y-2.5 text-xs">
                    <Link
                      to="/help"
                      className="flex items-center justify-between rounded-xl bg-purple-50/60 p-3 font-bold text-purple-900 hover:bg-purple-100 transition"
                    >
                      <span className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-purple-700" /> LocalShore Help Center
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>

                    <Link
                      to="/support"
                      className="flex items-center justify-between rounded-xl border border-slate-200 p-3 font-semibold text-slate-800 hover:bg-slate-50 transition"
                    >
                      <span>My Support Tickets</span>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => setIsSecurityOpen(true)}
                      className="w-full flex items-center justify-between rounded-xl border border-slate-200 p-3 font-semibold text-slate-800 hover:bg-slate-50 transition text-left"
                    >
                      <span className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-purple-700" /> Security & Privacy
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>
                </section>
              )}
            </div>
          </div>
        )}

        {/* ── FOOTER ────────────────────────────────────────────────────────── */}
        <p className="mt-12 text-center font-mono text-[10px] uppercase tracking-widest text-slate-400">
          · Local Shore v0.2 · Coastal India ·
        </p>
      </div>

      {/* ── MODALS ────────────────────────────────────────────────────────── */}

      {/* EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-lg font-bold text-slate-900">Edit Profile</h3>
              <button type="button" onClick={() => setIsEditProfileOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Preferred Language</label>
                <select
                  value={editLanguage}
                  onChange={(e) => setEditLanguage(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                >
                  <option value="English">English</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Primary Delivery Hub</label>
                <select
                  value={editHub}
                  onChange={(e) => setEditHub(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                >
                  <option value="Singanallur">Singanallur</option>
                  <option value="Pappampatti">Pappampatti</option>
                  <option value="Ondipudur">Ondipudur</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  profileStore.updateProfileDetails({
                    preferredLanguage: editLanguage,
                    preferredHub: editHub,
                  });
                  toast.success("Profile updated!");
                  setIsEditProfileOpen(false);
                }}
                className="rounded-xl bg-purple-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-800"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ADDRESS MODAL */}
      {isAddAddressOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-lg font-bold text-slate-900">Add New Address</h3>
              <button type="button" onClick={() => setIsAddAddressOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Address Label</label>
                <div className="flex gap-2">
                  {["Home", "Work", "Other"].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setNewAddrLabel(lbl)}
                      className={`flex-1 rounded-xl py-2 font-bold text-xs border ${
                        newAddrLabel === lbl ? "bg-purple-700 text-white border-purple-700" : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Address Line & Landmark</label>
                <textarea
                  value={newAddrLine}
                  onChange={(e) => setNewAddrLine(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                  placeholder="House/Flat No., Street name, Landmark"
                />
              </div>

              <div className="rounded-2xl bg-purple-50/60 p-3 border border-purple-100 text-[11px] text-purple-900 flex items-center gap-2">
                <Map className="h-4 w-4 shrink-0 text-purple-700" />
                <span>Location coordinates (Lat: 11.00, Lng: 77.02) pinned to current hub.</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddAddressOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newAddrLine.trim()) {
                    toast.error("Please enter address details");
                    return;
                  }
                  addressesStore.add({
                    label: newAddrLabel,
                    line: newAddrLine,
                    lat: 11.002,
                    lng: 77.025,
                  });
                  toast.success("Address added!");
                  setNewAddrLine("");
                  setIsAddAddressOpen(false);
                }}
                className="rounded-xl bg-purple-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-800"
              >
                Save Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PAYMENT MODAL */}
      {isAddPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-lg font-bold text-slate-900">Add Payment Method</h3>
              <button type="button" onClick={() => setIsAddPaymentOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewPayType("upi")}
                  className={`flex-1 rounded-xl py-2 font-bold text-xs border ${
                    newPayType === "upi" ? "bg-purple-700 text-white border-purple-700" : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  UPI ID
                </button>
                <button
                  type="button"
                  onClick={() => setNewPayType("card")}
                  className={`flex-1 rounded-xl py-2 font-bold text-xs border ${
                    newPayType === "card" ? "bg-purple-700 text-white border-purple-700" : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  Debit / Credit Card
                </button>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Title / Name</label>
                <input
                  type="text"
                  value={newPayTitle}
                  onChange={(e) => setNewPayTitle(e.target.value)}
                  placeholder={newPayType === "upi" ? "e.g. PhonePe UPI" : "e.g. Axis Bank Card"}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  {newPayType === "upi" ? "UPI ID" : "Card Number (Masked)"}
                </label>
                <input
                  type="text"
                  value={newPaySub}
                  onChange={(e) => setNewPaySub(e.target.value)}
                  placeholder={newPayType === "upi" ? "user@upi" : "•••• •••• •••• 1234"}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono text-slate-900"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddPaymentOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newPayTitle || !newPaySub) {
                    toast.error("Please fill in payment details");
                    return;
                  }
                  profileStore.addPaymentMethod({
                    type: newPayType,
                    title: newPayTitle,
                    subtitle: newPaySub,
                    isDefault: false,
                  });
                  toast.success("Payment method saved!");
                  setNewPayTitle("");
                  setNewPaySub("");
                  setIsAddPaymentOpen(false);
                }}
                className="rounded-xl bg-purple-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-800"
              >
                Save Payment Method
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REDEEM REWARDS MODAL */}
      {isRedeemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-lg font-bold text-slate-900">Redeem Shore Points</h3>
              <button type="button" onClick={() => setIsRedeemOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {[
                { id: "rw-1", title: "₹50 Discount Voucher", pointsRequired: 100, description: "Valid on any neighborhood store order above ₹199", discountCode: "SHORE50" },
                { id: "rw-2", title: "Free Instant Delivery Pass", pointsRequired: 150, description: "Waives delivery fee for 3 consecutive orders", discountCode: "FREEPASS3" },
                { id: "rw-3", title: "₹100 Bakery Voucher", pointsRequired: 200, description: "Valid at all local bakeries above ₹299", discountCode: "BAKERY100" },
              ].map((rw) => (
                <div key={rw.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3.5">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{rw.title}</p>
                    <p className="text-[11px] text-slate-500">{rw.description}</p>
                    <span className="mt-1 inline-block text-xs font-black text-purple-700">{rw.pointsRequired} Points</span>
                  </div>
                  <button
                    type="button"
                    disabled={profileExtra.rewardsPoints < rw.pointsRequired}
                    onClick={() => {
                      try {
                        profileStore.redeemReward(rw);
                        toast.success(`Redeemed ${rw.title}! Code: ${rw.discountCode}`);
                        setIsRedeemOpen(false);
                      } catch (e: any) {
                        toast.error(e.message);
                      }
                    }}
                    className="rounded-xl bg-purple-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs disabled:opacity-50 hover:bg-purple-800 transition"
                  >
                    Redeem
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* WRITE REVIEW MODAL */}
      {isReviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-lg font-bold text-slate-900">Rate Product</h3>
              <button type="button" onClick={() => setIsReviewOpen(null)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1"
                    >
                      <Star className={`h-6 w-6 ${star <= reviewRating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Your Review</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                  placeholder="Tell us about product quality and delivery experience..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReviewOpen(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  profileStore.submitReview(isReviewOpen, reviewRating, reviewComment);
                  toast.success("Review submitted! Thank you.");
                  setReviewComment("");
                  setIsReviewOpen(null);
                }}
                className="rounded-xl bg-purple-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-800"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECURITY & PRIVACY MODAL */}
      {isSecurityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                <Lock className="h-4.5 w-4.5 text-purple-700" /> Security & Privacy
              </h3>
              <button type="button" onClick={() => setIsSecurityOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="rounded-2xl border border-slate-200 p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Active Login Sessions</p>
                  <p className="text-[11px] text-slate-500">Current device (Chrome / Linux)</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Active</span>
              </div>

              <div className="rounded-2xl border border-slate-200 p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Two-Factor Auth (2FA)</p>
                  <p className="text-[11px] text-slate-500">SMS OTP Verification</p>
                </div>
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">Enabled</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  toast.success("Password reset link sent to your registered email!");
                }}
                className="w-full rounded-xl border border-purple-200 bg-purple-50 p-2.5 text-xs font-bold text-purple-900 hover:bg-purple-100 transition text-center"
              >
                Send Password Reset Email
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSecurityOpen(false)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
