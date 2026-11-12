import { useState, useRef } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  MapPin,
  Search,
  Bell,
  MessageCircle,
  ChevronDown,
  User,
  LogIn,
  Store,
  Bike,
  LogOut,
  Mic,
  ShoppingCart,
  Menu,
  X,
  Home,
  Compass,
  Users,
  Radio,
  ShoppingBag,
  Heart,
  MessageSquare,
  Sparkles,
  Settings,
  HelpCircle,
  ChevronRight,
  Camera,
} from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { useProfileExtra, profileStore } from "@/lib/profile-store";
import { useLocalShoreRoles } from "@/lib/roles-store";
import { useDeliveryLocation } from "@/lib/location-store";
import { requestLocationModal } from "@/components/app-shell";
import { AnimatedSearchPlaceholder } from "@/components/ui/animated-search-placeholder";
import { SwiggyInstantSearchDropdown } from "@/components/ui/swiggy-instant-search-dropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useCart, cartTotals } from "@/modules/shopper/services/cart-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SEARCH_PLACEHOLDERS = [
  "Search for farm-fresh, shops, services...",
  "Search for artisan sourdough & pastries...",
  "Search for Salem Alphonso mangoes...",
  "Search for local boutique fashion...",
  "Search for nearby grocery & essentials...",
];

const SELLER_HUB_URL =
  import.meta.env.VITE_SELLER_HUB_URL || "https://vendor-admin-6f5h.vercel.app/";
const DELIVERY_HUB_URL =
  import.meta.env.VITE_DELIVERY_HUB_URL || "https://delivery-hub-lilac.vercel.app/";

interface LiveNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "order" | "live" | "story" | "reward";
  link: string;
  isRead: boolean;
}

const INITIAL_NOTIFICATIONS: LiveNotification[] = [
  {
    id: "notif_1",
    title: "Order #LS42790 Out for Delivery 🛵",
    description: "Ravi's Artisan Bakery order is on the way. Arriving in ~16 min!",
    time: "2m ago",
    type: "order",
    link: "/orders",
    isRead: false,
  },
  {
    id: "notif_2",
    title: "Kumar Stores is LIVE Now 🥭",
    description: "Watch live & shop fresh Salem Alphonso mangoes right now.",
    time: "15m ago",
    type: "live",
    link: "/live-market",
    isRead: false,
  },
];

export function TopNavbar() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const auth = useAuth();
  const [deliveryLocation] = useDeliveryLocation();
  const cart = useCart();
  const { itemCount } = cartTotals(cart.lines);
  const displayCartCount = itemCount;

  const [notificationsList, setNotificationsList] = useState<LiveNotification[]>(INITIAL_NOTIFICATIONS);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const unreadCount = notificationsList.filter((n) => !n.isRead).length;

  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const profileExtra = useProfileExtra();
  const avatarUrl =
    profileExtra.avatarUrl ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        profileStore.setAvatarUrl(dataUrl);
        toast.success("Profile photo updated successfully! 📸");
      }
    };
    reader.readAsDataURL(file);
  };

  const isSignedIn = Boolean(auth.id || auth.phone || auth.email);
  const displayLocation =
    (deliveryLocation?.area && deliveryLocation.area !== "Live GPS Location"
      ? deliveryLocation.area
      : deliveryLocation?.label?.split(",")[0]?.trim() &&
        deliveryLocation.label.split(",")[0].trim() !== "Live GPS Location"
      ? deliveryLocation.label.split(",")[0].trim()
      : "") || "Coimbatore, TN";

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    setSearchFocused(false);
    void navigate({
      to: "/search",
      search: { q: trimmed || undefined, category: undefined },
    });
  };

  const handleMarkAllNotificationsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotificationsList((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success("All notifications marked as read");
  };

  const handleNotificationClick = (notif: LiveNotification) => {
    setNotificationsList((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    setNotifsOpen(false);
    void navigate({ to: notif.link as any });
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-xs">
      {/* ─────────────────────────────────────────────────────────────
          DESKTOP HEADER VIEW (≥ 768px)
      ────────────────────────────────────────────────────────────── */}
      <div className="hidden md:flex mx-auto h-16 sm:h-18 items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 max-w-[1536px]">
        {/* Brand Logo & Location */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" className="flex items-center group shrink-0">
            <img
              src="/assets/localshore-logo.png"
              alt="LocalShore - Connect • Shop • Thrive"
              className="h-8 sm:h-9 md:h-10 w-auto object-contain transition-transform group-hover:scale-102"
            />
          </Link>

          {/* Location Selector Pill */}
          <button
            type="button"
            onClick={requestLocationModal}
            className="flex items-center gap-1.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 text-xs font-bold text-[#0F172A] hover:bg-[#F1F5F9] hover:border-[#8B2FC9]/40 transition max-w-[200px] cursor-pointer"
          >
            <MapPin className="h-3.5 w-3.5 text-[#8B2FC9] shrink-0" />
            <span className="truncate">{displayLocation}</span>
            <ChevronDown className="h-3 w-3 text-[#64748B] shrink-0" />
          </button>
        </div>

        {/* Center Search Bar (Desktop) */}
        <div className="relative flex-1 max-w-xl mx-2">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex items-center rounded-full bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-2 text-xs transition-all focus-within:border-[#8B2FC9] focus-within:bg-white focus-within:shadow-[0_4px_16px_rgba(168, 56, 189,0.1)]"
          >
            <Search className="h-4 w-4 text-[#64748B] mr-2.5 shrink-0" />
            <div className="relative flex-1">
              <AnimatedSearchPlaceholder
                phrases={SEARCH_PLACEHOLDERS}
                active={!searchFocused && !searchQuery}
                className="text-xs text-[#64748B]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                className="relative z-10 w-full bg-transparent text-xs font-medium text-[#0F172A] outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => toast.info("Voice search is active for " + displayLocation)}
              className="text-[#8B2FC9] hover:text-[#581C87] ml-2 cursor-pointer"
              title="Voice Search"
            >
              <Mic className="h-4 w-4" />
            </button>
          </form>

          {searchFocused && (
            <div className="absolute left-0 right-0 top-full mt-2 z-50">
              <SwiggyInstantSearchDropdown
                query={searchQuery}
                onSelectResult={() => setSearchFocused(false)}
                onClearQuery={() => setSearchQuery("")}
              />
            </div>
          )}
        </div>

        {/* Right Actions Navigation (Desktop) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Desktop-Only Loyalty Points Pill (350) */}
          <Link
            to="/rewards"
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FFFBEA] to-[#FEF3C7] border border-[#FDE68A] px-3 py-1 text-xs font-extrabold text-[#78350F] hover:shadow-xs transition"
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#F59E0B] text-[10px] font-black text-[#0F172A] shadow-2xs">
              🪙
            </span>
            <span>350</span>
          </Link>

          {/* Shopping Cart Button */}
          <Link
            to="/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#581C87] hover:bg-[#F1F5F9] hover:text-[#8B2FC9] transition cursor-pointer"
            aria-label="Shopping Cart"
            title="Shopping Cart"
          >
            <ShoppingCart className="h-4.5 w-4.5" />
            {displayCartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#8B2FC9] text-[10px] font-extrabold text-white shadow-xs">
                {displayCartCount}
              </span>
            )}
          </Link>

          {/* Interactive Notifications Bell Dropdown */}
          <DropdownMenu open={notifsOpen} onOpenChange={setNotifsOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#581C87] hover:bg-[#F1F5F9] hover:text-[#8B2FC9] transition cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#8B2FC9] text-[10px] font-bold text-white shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-80 sm:w-96 rounded-3xl border border-[#EADFF0] bg-white p-3 text-[#0F172A] shadow-[0_16px_40px_rgba(30,10,50,0.15)] z-[70] space-y-2"
            >
              <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-purple-50">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#0F172A]">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[#8B2FC9] text-[10px] font-extrabold">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllNotificationsRead}
                    className="text-[11px] font-bold text-[#8B2FC9] hover:text-[#581C87] cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-[300px] overflow-y-auto no-scrollbar">
                {notificationsList.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-2.5 rounded-2xl transition cursor-pointer flex items-start gap-3 ${
                      notif.isRead
                        ? "bg-white hover:bg-[#F8FAFC]"
                        : "bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-purple-100"
                    }`}
                  >
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-xs shrink-0 text-[#8B2FC9] font-bold">
                      {notif.type === "order" ? "🛵" : "🥭"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-[#0F172A] truncate">{notif.title}</h4>
                        <span className="text-[10px] text-slate-400 shrink-0">{notif.time}</span>
                      </div>
                      <p className="text-[11px] text-[#64748B] line-clamp-1 mt-0.5">
                        {notif.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Desktop Customer Chat & Messages */}
          <Link
            to="/messages"
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#581C87] hover:bg-[#F1F5F9] hover:text-[#8B2FC9] transition"
            aria-label="Messages"
            title="Messages"
          >
            <MessageCircle className="h-4.5 w-4.5" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#8B2FC9] text-[10px] font-bold text-white shadow-xs">
              3
            </span>
          </Link>

          {/* User Profile Avatar (Desktop Dropdown) */}
          <DropdownMenu open={profileOpen} onOpenChange={setProfileOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 rounded-full p-0.5 ring-2 ring-[#8B2FC9]/20 hover:ring-[#8B2FC9] transition cursor-pointer"
              >
                <div className="relative h-9 w-9 overflow-hidden rounded-full bg-[#8B2FC9] flex items-center justify-center text-white font-bold text-xs">
                  <img
                    src={avatarUrl}
                    alt="User Profile"
                    className="h-full w-full object-cover"
                  />
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-56 rounded-2xl border border-[#EADFF0] bg-white p-2 text-[#0F172A] shadow-[0_16px_40px_rgba(30,10,50,0.12)] z-[70] space-y-1"
            >
              <div className="px-3 py-2 border-b border-[#F5EDFD]">
                <p className="text-xs font-bold text-[#0F172A]">
                  {auth.name && auth.name !== "Guest" ? auth.name : "Sudhan M"}
                </p>
                <p className="text-[11px] text-[#64748B] truncate">
                  {auth.email || "sudhan@localshore.app"}
                </p>
              </div>

              <DropdownMenuItem
                onSelect={() => {
                  setProfileOpen(false);
                  void navigate({ to: "/profile" });
                }}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] hover:bg-purple-50 hover:text-[#8B2FC9] focus:bg-purple-50 focus:text-[#8B2FC9] transition cursor-pointer"
              >
                <User className="h-4 w-4" />
                <span>Your Profile</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => {
                  setProfileOpen(false);
                  void navigate({ to: "/orders" });
                }}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] hover:bg-purple-50 hover:text-[#8B2FC9] focus:bg-purple-50 focus:text-[#8B2FC9] transition cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>My Orders</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => {
                  setProfileOpen(false);
                  window.open(SELLER_HUB_URL, "_blank");
                }}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] hover:bg-purple-50 hover:text-[#8B2FC9] focus:bg-purple-50 focus:text-[#8B2FC9] transition cursor-pointer"
              >
                <Store className="h-4 w-4 text-[#8B2FC9]" />
                <span>Open SellerHub</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => {
                  setProfileOpen(false);
                  window.open(DELIVERY_HUB_URL, "_blank");
                }}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] hover:bg-purple-50 hover:text-[#8B2FC9] focus:bg-purple-50 focus:text-[#8B2FC9] transition cursor-pointer"
              >
                <Bike className="h-4 w-4 text-emerald-600" />
                <span>Become a Delivery Partner</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-[#F5EDFD] my-1" />

              {isSignedIn ? (
                <DropdownMenuItem
                  onSelect={() => {
                    setProfileOpen(false);
                    supabase.auth.signOut().then(() => {
                      toast.success("Signed out successfully");
                      void navigate({ to: "/" });
                    });
                  }}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 focus:bg-rose-50 cursor-pointer transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onSelect={() => {
                    setProfileOpen(false);
                    void navigate({
                      to: "/auth",
                      search: { redirect: pathname },
                    });
                  }}
                  className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#8B2FC9] to-[#581C87] px-3 py-2.5 text-xs font-bold text-white hover:opacity-95 cursor-pointer transition"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MOBILE VIEW (Exact match to Reference Image Screen 1)
      ────────────────────────────────────────────────────────────── */}
      <div className="md:hidden">
        {/* Row 1: Hamburger Menu | Logo | (🪙 350 + 🔔 + User Avatar) */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            {/* Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F1F5F9] hover:text-[#8B2FC9] transition cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Brand Logo */}
            <Link to="/" className="flex items-center">
              <img
                src="/assets/localshore-logo.png"
                alt="LocalShore Connect • Shop • Thrive"
                className="h-8 w-auto object-contain"
              />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Loyalty Points Pill (🪙 350) */}
            <Link
              to="/rewards"
              className="flex items-center gap-1 rounded-full bg-[#FFFBEA] border border-[#FDE68A] px-2.5 py-1 text-xs font-black text-[#78350F] shadow-2xs"
            >
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#F59E0B] text-[9px] font-black text-[#0F172A]">
                🪙
              </span>
              <span>350</span>
            </Link>

            {/* Notifications Bell */}
            <button
              type="button"
              onClick={() => setNotifsOpen(true)}
              className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#581C87] cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#8B2FC9] ring-2 ring-white" />
              )}
            </button>

            {/* User Profile Avatar */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-[#8B2FC9] overflow-hidden cursor-pointer"
            >
              <img
                src={avatarUrl}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            </button>
          </div>
        </div>

        {/* Row 2: Location selector pill (📍 Coimbatore, TN ⌵) */}
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={requestLocationModal}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1 text-xs font-bold text-[#0F172A] hover:bg-[#F1F5F9] transition cursor-pointer"
          >
            <MapPin className="h-3.5 w-3.5 text-[#8B2FC9] shrink-0" />
            <span className="truncate max-w-[200px]">{displayLocation}</span>
            <ChevronDown className="h-3 w-3 text-[#64748B] shrink-0" />
          </button>
        </div>

        {/* Row 3: Search Bar (🔍 Search for farm-fresh, shops, services... 🎙️) */}
        <div className="px-3 pb-3">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center justify-between rounded-full bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-xs shadow-2xs focus-within:border-[#8B2FC9] focus-within:bg-white"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Search className="h-4 w-4 text-[#64748B] shrink-0" />
              <div className="relative flex-1">
                <AnimatedSearchPlaceholder
                  phrases={SEARCH_PLACEHOLDERS}
                  active={!searchQuery}
                  className="text-xs text-[#64748B]"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="relative z-10 w-full bg-transparent text-xs font-medium text-[#0F172A] outline-none"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => toast.info("Voice search is active for " + displayLocation)}
              className="text-[#8B2FC9] hover:text-[#581C87] pl-2 shrink-0 cursor-pointer"
              title="Voice Search"
            >
              <Mic className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MOBILE SLIDE DRAWER (Exact match to Reference Image Screen 2)
      ────────────────────────────────────────────────────────────── */}
      <Sheet open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
        <SheetContent
          side="left"
          hideCloseButton
          className="w-[84vw] max-w-[340px] p-0 bg-white text-[#0F172A] flex flex-col h-full z-[100] border-r border-[#E2E8F0]"
        >
          {/* Drawer Header with Logo & Close Button */}
          <div className="flex items-center justify-between p-4 border-b border-[#F0E6F7]">
            <Link
              to="/"
              onClick={() => setIsMobileDrawerOpen(false)}
              className="flex items-center gap-2"
            >
              <img
                src="/assets/localshore-logo.png"
                alt="LocalShore Connect • Shop • Thrive"
                className="h-7 w-auto object-contain"
              />
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(false)}
              className="rounded-full p-1.5 text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition cursor-pointer"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
            {/* User Profile Card matching Screen 2 with Photo Upload option */}
            <div className="flex items-center justify-between rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 shadow-2xs">
              {/* Hidden file input for photo upload */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
                aria-label="Upload profile photo"
              />

              <div className="flex items-center gap-3 min-w-0">
                {/* Clickable Profile Photo with Camera Badge */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group h-12 w-12 rounded-full ring-2 ring-[#8B2FC9]/30 overflow-hidden shrink-0 cursor-pointer"
                  title="Click to upload profile photo"
                >
                  <img
                    src={avatarUrl}
                    alt="User Profile"
                    className="h-full w-full object-cover group-hover:opacity-85 transition"
                  />
                  {/* Hover Camera Overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                  {/* Camera Icon Badge */}
                  <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-[#8B2FC9] text-white flex items-center justify-center shadow-xs ring-1 ring-white">
                    <Camera className="h-2.5 w-2.5" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-[#0F172A] truncate">
                    {auth.name && auth.name !== "Guest" ? auth.name : "Sudhan M"}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className="inline-flex items-center text-xs font-semibold text-[#8B2FC9] hover:underline"
                    >
                      <span>View Profile</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                    <span className="text-[#D1C4E9]">•</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#581C87] hover:text-[#8B2FC9] cursor-pointer"
                      title="Upload new photo"
                    >
                      <Camera className="h-3 w-3" />
                      <span>Upload</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation List matching Screen 2 */}
            <nav className="space-y-1">
              {/* Home */}
              <Link
                to="/"
                onClick={() => setIsMobileDrawerOpen(false)}
                className={`flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all ${
                  pathname === "/"
                    ? "bg-[#8B2FC9] text-white shadow-xs"
                    : "text-[#0F172A] hover:bg-[#F8FAFC]"
                }`}
              >
                <Home className="h-4.5 w-4.5" />
                <span>Home</span>
              </Link>

              {/* Explore */}
              <Link
                to="/explore"
                onClick={() => setIsMobileDrawerOpen(false)}
                className={`flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all ${
                  pathname.startsWith("/explore")
                    ? "bg-[#8B2FC9] text-white shadow-xs"
                    : "text-[#0F172A] hover:bg-[#F8FAFC]"
                }`}
              >
                <Compass className="h-4.5 w-4.5" />
                <span>Explore</span>
              </Link>

              {/* Following */}
              <Link
                to="/"
                search={{ tab: "following" }}
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#0F172A] hover:bg-[#F8FAFC] transition-all"
              >
                <Users className="h-4.5 w-4.5" />
                <span>Following</span>
              </Link>

              {/* Near Me */}
              <Link
                to="/near-me"
                onClick={() => setIsMobileDrawerOpen(false)}
                className={`flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all ${
                  pathname.startsWith("/near-me")
                    ? "bg-[#8B2FC9] text-white shadow-xs"
                    : "text-[#0F172A] hover:bg-[#F8FAFC]"
                }`}
              >
                <MapPin className="h-4.5 w-4.5" />
                <span>Near Me</span>
              </Link>

              {/* Live Market */}
              <Link
                to="/live-market"
                onClick={() => setIsMobileDrawerOpen(false)}
                className={`flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all ${
                  pathname.startsWith("/live-market")
                    ? "bg-[#8B2FC9] text-white shadow-xs"
                    : "text-[#0F172A] hover:bg-[#F8FAFC]"
                }`}
              >
                <Radio className="h-4.5 w-4.5 text-rose-500" />
                <span>Live Market</span>
              </Link>

              {/* Community */}
              <Link
                to="/community"
                onClick={() => setIsMobileDrawerOpen(false)}
                className={`flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all ${
                  pathname.startsWith("/community")
                    ? "bg-[#8B2FC9] text-white shadow-xs"
                    : "text-[#0F172A] hover:bg-[#F8FAFC]"
                }`}
              >
                <MessageSquare className="h-4.5 w-4.5" />
                <span>Community</span>
              </Link>

              {/* My Orders */}
              <Link
                to="/orders"
                onClick={() => setIsMobileDrawerOpen(false)}
                className={`flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all ${
                  pathname.startsWith("/orders") || pathname.startsWith("/order")
                    ? "bg-[#8B2FC9] text-white shadow-xs"
                    : "text-[#0F172A] hover:bg-[#F8FAFC]"
                }`}
              >
                <ShoppingBag className="h-4.5 w-4.5" />
                <span>My Orders</span>
              </Link>

              {/* Wishlist with count 1 badge */}
              <Link
                to="/wishlist"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#0F172A] hover:bg-[#F8FAFC] transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <Heart className="h-4.5 w-4.5" />
                  <span>Wishlist</span>
                </div>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8B2FC9] text-[10px] font-extrabold text-white shadow-2xs">
                  1
                </span>
              </Link>

              {/* Messages with count 3 badge */}
              <Link
                to="/messages"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#0F172A] hover:bg-[#F8FAFC] transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <MessageCircle className="h-4.5 w-4.5" />
                  <span>Messages</span>
                </div>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8B2FC9] text-[10px] font-extrabold text-white shadow-2xs">
                  3
                </span>
              </Link>
            </nav>

            {/* "Are you a Local Shop?" Promotion Card matching Screen 2 */}
            <div className="rounded-2xl bg-gradient-to-br from-[#F8FAFC] via-[#F8EEFD] to-[#F3E8FF] border border-[#E2E8F0] p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[#E2E8F0] text-[#8B2FC9] shadow-2xs">
                  <Store className="h-5 w-5" />
                  <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                </div>
                <h4 className="text-sm font-black text-[#0F172A]">
                  Are you a <br />Local Shop?
                </h4>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Create your shop, share updates, go live and grow your business on LocalShore.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  window.open(SELLER_HUB_URL, "_blank");
                }}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#8B2FC9] hover:bg-[#581C87] py-2.5 text-xs font-bold text-white shadow-sm transition cursor-pointer"
              >
                <span>Open a Shop</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Bottom Footer Items matching Screen 2 */}
            <div className="pt-2 border-t border-[#F0E6F7] space-y-1">
              <Link
                to="/profile"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex items-center gap-3.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition"
              >
                <Settings className="h-4.5 w-4.5" />
                <span>Settings</span>
              </Link>
              <Link
                to="/support"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex items-center gap-3.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition"
              >
                <HelpCircle className="h-4.5 w-4.5" />
                <span>Help & Support</span>
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
