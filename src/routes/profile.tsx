import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Package,
  Heart,
  Ticket,
  Sparkles,
  Store,
  ChevronRight,
  Bell,
  Truck,
  HelpCircle,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Map,
  Lock,
  MessageSquare,
  X,
  Copy,
  Check,
  Home,
  Briefcase,
  Sliders,
  ArrowRight,
  ShieldCheck,
  Globe,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-store";
import { cartStore } from "@/modules/shopper/services/cart-store";
import {
  useAddresses,
  addressesStore,
  type Address,
} from "@/modules/shopper/services/addresses-store";
import { useOrders } from "@/modules/shopper/services/orders-store";
import { useWishlistProducts } from "@/lib/merchandising";
import {
  profileStore,
  useProfileExtra,
  type PaymentMethod,
  type RewardItem,
} from "@/lib/profile-store";
import { supabase } from "@/integrations/supabase/client";
import { useDeliveryLocation } from "@/lib/location-store";

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
  const [deliveryLoc] = useDeliveryLocation();

  const signedIn = Boolean(auth.id || auth.phone || auth.email);

  // Streamlined 4 core profile tabs
  const [activeTab, setActiveTab] = useState<
    "addresses" | "orders" | "rewards" | "preferences"
  >("addresses");

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);

  // Form states
  const [editName, setEditName] = useState(auth.name || "");
  const [editLanguage, setEditLanguage] = useState(profileExtra.preferredLanguage);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  useEffect(() => {
    setEditName(auth.name === "Guest" ? "" : auth.name);
  }, [auth.name]);

  useEffect(() => {
    setEditLanguage(profileExtra.preferredLanguage);
  }, [profileExtra.preferredLanguage]);

  // New address state
  const [newAddrLabel, setNewAddrLabel] = useState("Home");
  const [newAddrLine, setNewAddrLine] = useState("");

  // New payment state
  const [newPayType, setNewPayType] = useState<"upi" | "card">("upi");
  const [newPayTitle, setNewPayTitle] = useState("");
  const [newPaySub, setNewPaySub] = useState("");

  const maskPhone = (phone?: string | null) => {
    if (!phone) return "+91 ••••• •••••";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length >= 10) {
      return `+91 ${cleaned.slice(0, 2)}•••• ••${cleaned.slice(-2)}`;
    }
    return phone;
  };

  const getAddressIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("home")) return Home;
    if (l.includes("work") || l.includes("office")) return Briefcase;
    return MapPin;
  };

  const recentOrder = orders[0];

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ── 1. PROFILE HEADER CARD ───────────────────────────────────────── */}
        <div className="overflow-hidden rounded-3xl border border-purple-100/80 bg-gradient-to-br from-purple-50/70 via-white to-amber-50/30 p-5 shadow-xs sm:p-7">
          {signedIn ? (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#981495] to-[#c026d3] font-display text-2xl font-bold text-white shadow-md shadow-[#981495]/20 sm:h-20 sm:w-20 sm:text-3xl">
                    {auth.name
                      ? auth.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()
                      : "LS"}
                  </div>
                  <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">
                      {auth.name || "LocalShore Member"}
                    </h1>
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-[#981495] border border-purple-200">
                      <Sparkles className="h-3 w-3 fill-[#c026d3] text-[#c026d3]" />
                      LocalShore Member
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-1 font-mono border border-slate-200/60 shadow-2xs">
                      <Mail className="h-3.5 w-3.5 text-[#981495]" />
                      {auth.email || "No email registered"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-1 font-mono border border-slate-200/60 shadow-2xs">
                      <Phone className="h-3.5 w-3.5 text-[#981495]" />
                      {maskPhone(auth.phone)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-white px-4 py-2 text-xs font-bold text-[#981495] shadow-xs transition hover:bg-purple-50"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit Profile
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    cartStore.clear();
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
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-[#981495] border border-purple-200">
                  <Store className="h-3.5 w-3.5" /> Your Neighborhood, Delivered
                </span>
                <h1 className="mt-2 font-display text-2xl font-bold text-slate-900 sm:text-3xl">
                  Welcome to LocalShore 👋
                </h1>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Sign in to track orders in real time, save delivery addresses, unlock exclusive
                  coupons, and earn Shore Points on every local purchase.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 sm:min-w-[200px]">
                <Link
                  to="/auth"
                  search={{ redirect: "/profile" }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#981495] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#981495]/20 transition hover:bg-[#831080]"
                >
                  <User className="h-4 w-4" /> Sign in / Create account
                </Link>
                <Link
                  to="/"
                  search={{ category: undefined, q: undefined }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-white px-5 py-2.5 text-xs font-bold text-[#981495] transition hover:bg-purple-50"
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
            <h2 className="font-display text-base font-bold text-slate-900">
              Why create a LocalShore account?
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  title: "Live Order Tracking",
                  desc: "Follow instant 20-30 min store deliveries",
                  icon: Package,
                },
                {
                  title: "Saved Addresses",
                  desc: "1-tap checkout for home, office, & others",
                  icon: MapPin,
                },
                {
                  title: "Exclusive Coupons",
                  desc: "Save with neighborhood promo codes",
                  icon: Ticket,
                },
                {
                  title: "Shore Points",
                  desc: "Earn loyalty discounts on every order",
                  icon: Sparkles,
                },
              ].map((b, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-xs"
                >
                  <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-purple-50 text-[#981495]">
                    <b.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-2.5 text-xs font-bold text-slate-900">{b.title}</h3>
                  <p className="mt-1 text-[11px] text-slate-500 leading-snug">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 2. QUICK ACCOUNT STATS ───────────────────────────────────────── */}
        {signedIn && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-3.5 rounded-2xl border p-3.5 text-left shadow-xs transition group ${
                activeTab === "orders"
                  ? "border-[#981495] bg-purple-50/40 ring-1 ring-[#981495]/30"
                  : "border-slate-200/80 bg-white hover:border-purple-200 hover:shadow-sm"
              }`}
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Orders
                </p>
                <p className="text-base font-extrabold text-slate-900">
                  {orders.length} {orders.length === 1 ? "Order" : "Orders"}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("addresses")}
              className={`flex items-center gap-3.5 rounded-2xl border p-3.5 text-left shadow-xs transition group ${
                activeTab === "addresses"
                  ? "border-[#981495] bg-purple-50/40 ring-1 ring-[#981495]/30"
                  : "border-slate-200/80 bg-white hover:border-purple-200 hover:shadow-sm"
              }`}
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Addresses
                </p>
                <p className="text-base font-extrabold text-slate-900">
                  {addresses.length} Saved
                </p>
              </div>
            </button>

            <Link
              to="/wishlist"
              className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 text-left shadow-xs transition hover:border-purple-200 hover:shadow-sm group"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Wishlist
                </p>
                <p className="text-base font-extrabold text-slate-900">
                  {wishlistProducts.data?.length ?? 0} Saved
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setActiveTab("rewards")}
              className={`flex items-center gap-3.5 rounded-2xl border p-3.5 text-left shadow-xs transition group ${
                activeTab === "rewards"
                  ? "border-[#981495] bg-purple-50/40 ring-1 ring-[#981495]/30"
                  : "border-slate-200/80 bg-white hover:border-purple-200 hover:shadow-sm"
              }`}
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-50 text-[#981495]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Rewards
                </p>
                <p className="text-base font-extrabold text-slate-900">
                  {profileExtra.rewardsPoints} Points
                </p>
              </div>
            </button>
          </div>
        )}

        {/* ── 3. CLEAN SEGMENTED NAVIGATION TABS ────────────────────────────── */}
        {signedIn && (
          <div className="mt-6 flex rounded-2xl bg-slate-100 p-1 border border-slate-200/70 overflow-x-auto scrollbar-none">
            {[
              { id: "addresses", label: "Addresses & Details", icon: MapPin },
              { id: "orders", label: "My Orders", icon: Package },
              { id: "rewards", label: "Rewards & Coupons", icon: Sparkles },
              { id: "preferences", label: "Preferences & Support", icon: Sliders },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl py-2.5 px-3 text-xs font-bold transition ${
                    isActive
                      ? "bg-white text-[#981495] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-[#981495]" : "text-slate-400"}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* ── 4. TAB CONTENTS ──────────────────────────────────────────────── */}
        {signedIn && (
          <div className="mt-6 space-y-6">
            {/* ── TAB 1: ADDRESSES & DETAILS ─────────────────────────────────── */}
            {activeTab === "addresses" && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left 8 Cols: Delivery Addresses */}
                <div className="space-y-6 lg:col-span-8">
                  <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-[#981495]" /> Saved Delivery Addresses
                        </h2>
                        <p className="text-xs text-slate-500">
                          Manage where your groceries and goods are delivered
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddAddressOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#981495] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#831080] transition"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Address
                      </button>
                    </div>

                    {addresses.length === 0 ? (
                      <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
                        <MapPin className="mx-auto h-8 w-8 text-slate-400" />
                        <h3 className="mt-2 text-sm font-bold text-slate-800">No saved addresses</h3>
                        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                          Add your home, work, or apartment address to enable fast, 1-tap ordering.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsAddAddressOpen(true)}
                          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#981495] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#831080]"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add your first address
                        </button>
                      </div>
                    ) : (
                      <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                        {addresses.map((addr, idx) => {
                          const IconComponent = getAddressIcon(addr.label);
                          return (
                            <div
                              key={addr.id}
                              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 transition hover:border-purple-200 hover:shadow-xs"
                            >
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-bold text-[#981495]">
                                    <IconComponent className="h-3.5 w-3.5" />
                                    {addr.label}
                                  </span>
                                  {idx === 0 && (
                                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="mt-3 text-xs text-slate-700 leading-relaxed font-medium">
                                  {addr.line}
                                </p>
                              </div>

                              <div className="mt-4 flex items-center justify-end border-t border-slate-100 pt-2.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    addressesStore.remove(addr.id);
                                    toast.success("Address removed");
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 transition hover:text-rose-600"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Remove
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  {/* Payment Methods */}
                  <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-[#981495]" /> Payment Methods
                        </h2>
                        <p className="text-xs text-slate-500">
                          Saved UPI IDs and cards for seamless checkout
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddPaymentOpen(true)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#981495] hover:bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 transition"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Payment
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {profileExtra.paymentMethods.map((pay) => (
                        <div
                          key={pay.id}
                          className="flex items-center justify-between rounded-2xl border border-slate-200 p-3.5 bg-slate-50/40"
                        >
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 place-items-center rounded-xl bg-purple-100/70 text-[#981495] font-bold text-[11px]">
                              {pay.type === "upi" ? "UPI" : "CARD"}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                {pay.title}
                                {pay.isDefault && (
                                  <span className="rounded-full bg-purple-50 px-2 py-0.2 text-[9px] font-bold text-[#981495]">
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
                            className="text-slate-400 hover:text-rose-600 transition p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Right 4 Cols: Account Details Summary */}
                <div className="space-y-6 lg:col-span-4">
                  <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                        <User className="h-4.5 w-4.5 text-[#981495]" /> Profile Information
                      </h2>
                      <button
                        type="button"
                        onClick={() => setIsEditProfileOpen(true)}
                        className="text-xs font-bold text-[#981495] hover:underline"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="mt-4 space-y-3.5 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">Full Name</span>
                        <p className="mt-0.5 text-sm font-bold text-slate-900">
                          {auth.name || "Customer"}
                        </p>
                      </div>

                      <div className="border-t border-slate-100 pt-2.5">
                        <span className="text-slate-400 block font-medium">Email Address</span>
                        <p className="mt-0.5 font-mono text-xs font-semibold text-slate-800">
                          {auth.email || "No email registered"}
                        </p>
                      </div>

                      <div className="border-t border-slate-100 pt-2.5">
                        <span className="text-slate-400 block font-medium">Mobile Number</span>
                        <p className="mt-0.5 font-mono text-xs font-semibold text-slate-800">
                          {maskPhone(auth.phone)}
                        </p>
                      </div>

                      <div className="border-t border-slate-100 pt-2.5">
                        <span className="text-slate-400 block font-medium">Preferred Language</span>
                        <p className="mt-0.5 font-semibold text-slate-800 flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-[#981495]" />
                          {profileExtra.preferredLanguage}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Security overview */}
                  <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <ShieldCheck className="h-4.5 w-4.5 text-[#981495]" /> Security & Account
                    </h2>
                    <div className="mt-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between py-1.5 text-slate-600">
                        <span>Account Status</span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                          Active & Verified
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 text-slate-600">
                        <span>Authentication</span>
                        <span className="font-medium text-slate-800">SMS / Email OTP</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSecurityOpen(true)}
                        className="mt-2 w-full rounded-xl border border-slate-200 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                      >
                        Manage Security Settings
                      </button>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {/* ── TAB 2: MY ORDERS ───────────────────────────────────────────── */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                {recentOrder ? (
                  <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 p-5 shadow-xs sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                            Active Order #{recentOrder.code || recentOrder.id.slice(0, 8)}
                          </span>
                          <span className="rounded-full bg-emerald-200/80 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-900 capitalize">
                            {recentOrder.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <h3 className="mt-2 text-lg font-bold text-slate-900">
                          {recentOrder.storeName}
                        </h3>
                        <p className="mt-1 text-xs text-slate-600">
                          {recentOrder.lines.length} items · Total ₹{recentOrder.total}
                        </p>
                      </div>
                      <Link
                        to="/order/$orderId"
                        params={{ orderId: recentOrder.id }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition"
                      >
                        Track Order Live <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : null}

                <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Package className="h-5 w-5 text-[#981495]" /> Order History
                      </h2>
                      <p className="text-xs text-slate-500">
                        View past receipts, store details, and delivery statuses
                      </p>
                    </div>
                    <Link
                      to="/orders"
                      className="text-xs font-bold text-[#981495] hover:underline inline-flex items-center gap-1"
                    >
                      View all orders <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {orders.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
                      <Package className="mx-auto h-8 w-8 text-slate-400" />
                      <h3 className="mt-2 text-sm font-bold text-slate-800">No orders placed yet</h3>
                      <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                        Discover verified nearby shops in your neighborhood with fast 20–30 minute
                        delivery.
                      </p>
                      <Link
                        to="/"
                        search={{ category: undefined, q: undefined }}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#981495] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#831080]"
                      >
                        <Store className="h-3.5 w-3.5" /> Explore nearby shops
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-4 divide-y divide-slate-100">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="flex flex-col gap-3 py-4 first:pt-2 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-900">
                                #{order.code || order.id.slice(0, 8)}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 capitalize">
                                {order.status.replace(/_/g, " ")}
                              </span>
                            </div>
                            <p className="mt-1 text-xs font-semibold text-slate-800">
                              {order.storeName}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {order.lines.length} {order.lines.length === 1 ? "item" : "items"} · ₹
                              {order.total}
                            </p>
                          </div>

                          <Link
                            to="/order/$orderId"
                            params={{ orderId: order.id }}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#981495] hover:underline"
                          >
                            View details →
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* ── TAB 3: REWARDS & COUPONS ───────────────────────────────────── */}
            {activeTab === "rewards" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Shore Points */}
                  <div className="rounded-3xl bg-gradient-to-br from-[#981495] via-[#7e117b] to-[#5a0c58] p-6 text-white shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-200">
                        <Sparkles className="h-4 w-4 fill-purple-200" /> Shore Points Balance
                      </span>
                      <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-white">
                        Loyalty Tier 1
                      </span>
                    </div>
                    <p className="mt-3 font-display text-4xl font-extrabold text-white">
                      {profileExtra.rewardsPoints}
                    </p>
                    <p className="mt-1 text-xs text-purple-200">
                      Earn 10 points for every ₹100 spent · 100 Points = ₹50 Voucher
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsRedeemOpen(true)}
                      className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#981495] shadow-xs hover:bg-purple-50 transition"
                    >
                      Redeem Points →
                    </button>
                  </div>

                  {/* Store Credits */}
                  <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Refund & Store Credits
                      </span>
                      <p className="mt-3 font-display text-4xl font-extrabold text-slate-900">
                        ₹150.00
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Available wallet credits automatically apply on your next order checkout.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
                      ✓ Instant settlement on delivery cancellations
                    </div>
                  </div>
                </div>

                {/* Available Coupons */}
                <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Ticket className="h-5 w-5 text-[#981495]" /> Available Neighborhood Coupons
                    </h2>
                    <p className="text-xs text-slate-500">
                      Exclusive promo codes for your next neighborhood order
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    {profileExtra.savedCoupons.map((c, i) => {
                      const isCopied = copiedCoupon === c.code;
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-2xl border border-dashed border-purple-300 bg-purple-50/40 p-4 transition hover:bg-purple-50/70"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#981495] bg-white px-2.5 py-0.5 rounded-md border border-purple-200 shadow-2xs">
                                {c.code}
                              </span>
                              <span className="text-xs font-extrabold text-[#981495]">
                                {c.discountText}
                              </span>
                            </div>
                            <p className="mt-1.5 text-xs font-semibold text-slate-800">{c.title}</p>
                            <p className="text-[11px] text-slate-500">
                              Min order ₹{c.minOrder} · Valid until {c.expires}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(c.code);
                              setCopiedCoupon(c.code);
                              toast.success(`Coupon ${c.code} copied!`);
                              setTimeout(() => setCopiedCoupon(null), 2500);
                            }}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1 ${
                              isCopied
                                ? "bg-emerald-600 text-white"
                                : "bg-white text-[#981495] border border-purple-200 hover:bg-purple-100/60"
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="h-3 w-3" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" /> Copy
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {/* ── TAB 4: PREFERENCES & SUPPORT ───────────────────────────────── */}
            {activeTab === "preferences" && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left 6 cols: Delivery Preferences */}
                <div className="space-y-6 lg:col-span-6">
                  <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
                    <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Truck className="h-4.5 w-4.5 text-[#981495]" /> Delivery Preferences
                    </h2>

                    <div className="mt-4 space-y-3.5 text-xs">
                      <label className="flex items-center justify-between cursor-pointer rounded-xl bg-slate-50 p-3 border border-slate-200/60">
                        <div>
                          <span className="font-bold text-slate-800 block">Contactless Delivery</span>
                          <span className="text-[11px] text-slate-500">
                            Rider leaves packages at doorstep or security
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={profileExtra.deliveryPreferences.contactless}
                          onChange={(e) =>
                            profileStore.updateDeliveryPreferences({ contactless: e.target.checked })
                          }
                          className="h-4 w-4 rounded accent-[#981495]"
                        />
                      </label>

                      <label className="flex items-center justify-between cursor-pointer rounded-xl bg-slate-50 p-3 border border-slate-200/60">
                        <div>
                          <span className="font-bold text-slate-800 block">Call Before Delivery</span>
                          <span className="text-[11px] text-slate-500">
                            Rider phones you upon arrival
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={profileExtra.deliveryPreferences.callBeforeDelivery}
                          onChange={(e) =>
                            profileStore.updateDeliveryPreferences({
                              callBeforeDelivery: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded accent-[#981495]"
                        />
                      </label>

                      <div>
                        <span className="font-bold text-slate-800 block mb-1">
                          Preferred Delivery Slot
                        </span>
                        <select
                          value={profileExtra.deliveryPreferences.preferredSlot}
                          onChange={(e) =>
                            profileStore.updateDeliveryPreferences({ preferredSlot: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-800"
                        >
                          <option value="Anytime">Anytime (Instant 20-30 min)</option>
                          <option value="Morning">Morning (8 AM - 12 PM)</option>
                          <option value="Evening">Evening (4 PM - 8 PM)</option>
                        </select>
                      </div>

                      <div>
                        <span className="font-bold text-slate-800 block mb-1">
                          Standing Delivery Instructions
                        </span>
                        <textarea
                          value={profileExtra.deliveryPreferences.instructions}
                          onChange={(e) =>
                            profileStore.updateDeliveryPreferences({ instructions: e.target.value })
                          }
                          rows={2}
                          className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder:text-slate-400"
                          placeholder="e.g., Leave with gate security / Ring doorbell twice"
                        />
                      </div>
                    </div>
                  </section>
                </div>

                {/* Right 6 cols: Notifications & Support */}
                <div className="space-y-6 lg:col-span-6">
                  {/* Notifications */}
                  <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
                    <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Bell className="h-4.5 w-4.5 text-[#981495]" /> Notifications & Alerts
                    </h2>

                    <div className="mt-4 space-y-2.5 text-xs">
                      {[
                        { key: "orderStatus", label: "Order Status & Live Tracking" },
                        { key: "priceDrops", label: "Price Drops on Saved Items" },
                        { key: "localDeals", label: "Exclusive Neighborhood Offers" },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center justify-between cursor-pointer py-1.5 border-b border-slate-100 last:border-0"
                        >
                          <span className="font-semibold text-slate-700">{item.label}</span>
                          <input
                            type="checkbox"
                            checked={(profileExtra.notificationSettings as any)[item.key]}
                            onChange={() => profileStore.toggleNotification(item.key as any)}
                            className="h-4 w-4 rounded accent-[#981495]"
                          />
                        </label>
                      ))}
                    </div>
                  </section>

                  {/* Help & Support */}
                  <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
                    <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <HelpCircle className="h-4.5 w-4.5 text-[#981495]" /> Help & Support
                    </h2>

                    <div className="mt-4 space-y-2.5 text-xs">
                      <Link
                        to="/help"
                        className="flex items-center justify-between rounded-xl bg-purple-50/70 p-3 font-bold text-[#981495] hover:bg-purple-100/70 transition"
                      >
                        <span className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-[#981495]" /> LocalShore Help Center
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
                          <Lock className="h-4 w-4 text-[#981495]" /> Security & Privacy
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </button>
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── FOOTER NOTE ──────────────────────────────────────────────────── */}
        <p className="mt-12 text-center font-mono text-[10px] uppercase tracking-widest text-slate-400">
          · LocalShore · Hyperlocal Neighborhood Commerce ·
        </p>
      </div>

      {/* ── MODALS ────────────────────────────────────────────────────────── */}

      {/* EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-lg font-bold text-slate-900">Edit Profile</h3>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
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
                  });
                  toast.success("Profile updated!");
                  setIsEditProfileOpen(false);
                }}
                className="rounded-xl bg-[#981495] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#831080]"
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
              <button
                type="button"
                onClick={() => setIsAddAddressOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
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
                        newAddrLabel === lbl
                          ? "bg-[#981495] text-white border-[#981495]"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Address Line & Landmark
                </label>
                <textarea
                  value={newAddrLine}
                  onChange={(e) => setNewAddrLine(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                  placeholder="House/Flat No., Building name, Street, Landmark"
                />
              </div>

              <div className="rounded-2xl bg-purple-50 p-3 border border-purple-100 text-[11px] text-[#981495] flex items-center gap-2">
                <Map className="h-4 w-4 shrink-0 text-[#981495]" />
                <span>
                  {deliveryLoc
                    ? "Using your current selected delivery location."
                    : "Set your live delivery location before saving this address."}
                </span>
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
                  if (!deliveryLoc) {
                    toast.error("Set your live delivery location first");
                    return;
                  }
                  addressesStore.add({
                    label: newAddrLabel,
                    line: newAddrLine,
                    lat: deliveryLoc.lat,
                    lng: deliveryLoc.lng,
                  });
                  toast.success("Address added!");
                  setNewAddrLine("");
                  setIsAddAddressOpen(false);
                }}
                className="rounded-xl bg-[#981495] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#831080]"
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
              <button
                type="button"
                onClick={() => setIsAddPaymentOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewPayType("upi")}
                  className={`flex-1 rounded-xl py-2 font-bold text-xs border ${
                    newPayType === "upi"
                      ? "bg-[#981495] text-white border-[#981495]"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  UPI ID
                </button>
                <button
                  type="button"
                  onClick={() => setNewPayType("card")}
                  className={`flex-1 rounded-xl py-2 font-bold text-xs border ${
                    newPayType === "card"
                      ? "bg-[#981495] text-white border-[#981495]"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  Debit / Credit Card
                </button>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Title / Label</label>
                <input
                  type="text"
                  value={newPayTitle}
                  onChange={(e) => setNewPayTitle(e.target.value)}
                  placeholder={newPayType === "upi" ? "e.g., GPay / PhonePe" : "e.g., HDFC Salary Card"}
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
                  placeholder={newPayType === "upi" ? "username@oksbi" : "•••• •••• •••• 4242"}
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
                className="rounded-xl bg-[#981495] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#831080]"
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
              <button
                type="button"
                onClick={() => setIsRedeemOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {[
                {
                  id: "rw-1",
                  title: "₹50 Discount Voucher",
                  pointsRequired: 100,
                  description: "Valid on any neighborhood store order above ₹199",
                  discountCode: "SHORE50",
                },
                {
                  id: "rw-2",
                  title: "Free Instant Delivery Pass",
                  pointsRequired: 150,
                  description: "Waives delivery fee for 3 consecutive orders",
                  discountCode: "FREEPASS3",
                },
                {
                  id: "rw-3",
                  title: "₹100 Bakery Voucher",
                  pointsRequired: 200,
                  description: "Valid at all local bakeries above ₹299",
                  discountCode: "BAKERY100",
                },
              ].map((rw) => (
                <div
                  key={rw.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 p-3.5"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{rw.title}</p>
                    <p className="text-[11px] text-slate-500">{rw.description}</p>
                    <span className="mt-1 inline-block text-xs font-black text-[#981495]">
                      {rw.pointsRequired} Points
                    </span>
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
                    className="rounded-xl bg-[#981495] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs disabled:opacity-50 hover:bg-[#831080] transition"
                  >
                    Redeem
                  </button>
                </div>
              ))}
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
                <Lock className="h-4.5 w-4.5 text-[#981495]" /> Security & Privacy
              </h3>
              <button
                type="button"
                onClick={() => setIsSecurityOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="rounded-2xl border border-slate-200 p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Active Login Sessions</p>
                  <p className="text-[11px] text-slate-500">Current device</p>
                </div>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Active
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Two-Factor Auth (2FA)</p>
                  <p className="text-[11px] text-slate-500">SMS OTP Verification</p>
                </div>
                <span className="rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-[#981495]">
                  Enabled
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  toast.success("Password reset link sent to your registered email!");
                }}
                className="w-full rounded-xl border border-purple-200 bg-purple-50/70 p-2.5 text-xs font-bold text-[#981495] hover:bg-purple-100/70 transition text-center"
              >
                Send Password Reset Email
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSecurityOpen(false)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800"
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
