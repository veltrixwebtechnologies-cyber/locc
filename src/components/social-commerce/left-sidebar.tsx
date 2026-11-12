import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Compass,
  Users,
  MapPin,
  Radio,
  MessageSquare,
  ShoppingBag,
  Heart,
  MessageCircle,
  ChevronRight,
  Store,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useWishlist, useWishlistProducts } from "@/lib/merchandising";
import { useDeliveryLocation } from "@/lib/location-store";

const SELLER_HUB_URL =
  import.meta.env.VITE_SELLER_HUB_URL || "https://vendor-admin-6f5h.vercel.app/";

interface LeftSidebarProps {
  onOpenLiveMarket?: () => void;
  onOpenMessages?: () => void;
  onOpenCommunity?: () => void;
  activeFeedTab?: string;
  onSelectFeedTab?: (tab: string) => void;
}

export function LeftSidebar({
  onOpenLiveMarket,
  onOpenMessages,
  onOpenCommunity,
  activeFeedTab,
  onSelectFeedTab,
}: LeftSidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [deliveryLocation] = useDeliveryLocation();
  const wishlist = useWishlist();
  const wishlistProducts = useWishlistProducts();
  const savedCount = wishlistProducts.data?.length ?? wishlist.data?.length ?? 0;
  const isHomePage = pathname === "/";
  const neighborhoodArea =
    deliveryLocation?.area ||
    deliveryLocation?.label?.split(",")[0] ||
    "RS Puram";

  const NAV_ITEMS = [
    {
      label: "Home",
      to: "/",
      icon: Home,
      isActive: isHomePage && (!activeFeedTab || activeFeedTab === "for_you"),
      onClick: (e: React.MouseEvent) => {
        if (isHomePage) {
          e.preventDefault();
          onSelectFeedTab?.("for_you");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      },
    },
    {
      label: "Explore",
      to: "/explore",
      icon: Compass,
      isActive: pathname.startsWith("/explore"),
    },
    {
      label: "Following",
      to: "/following",
      icon: Users,
      isActive: pathname.startsWith("/following") || (isHomePage && activeFeedTab === "following"),
    },
    {
      label: "Near Me",
      to: "/near-me",
      icon: MapPin,
      isActive: pathname.startsWith("/near-me") || (isHomePage && activeFeedTab === "nearby"),
    },
    {
      label: "Live Market",
      to: "/live-market",
      icon: Radio,
      isActive: pathname.startsWith("/live-market"),
      onClick: onOpenLiveMarket
        ? (e: React.MouseEvent) => {
            if (isHomePage && onOpenLiveMarket) {
              e.preventDefault();
              onOpenLiveMarket();
            }
          }
        : undefined,
    },
    {
      label: "Community",
      to: "/community",
      icon: MessageSquare,
      isActive: pathname.startsWith("/community") || pathname.startsWith("/news"),
    },
    {
      label: "My Orders",
      to: "/orders",
      icon: ShoppingBag,
      isActive: pathname.startsWith("/orders") || pathname.startsWith("/order/"),
    },
    {
      label: "Wishlist",
      to: "/wishlist",
      icon: Heart,
      badge: savedCount > 0 ? savedCount : undefined,
      isActive: pathname.startsWith("/wishlist"),
    },
    {
      label: "Messages",
      to: "/messages",
      icon: MessageCircle,
      badge: 3,
      isActive: pathname.startsWith("/messages"),
      onClick: onOpenMessages
        ? (e: React.MouseEvent) => {
            if (isHomePage && onOpenMessages) {
              e.preventDefault();
              onOpenMessages();
            }
          }
        : undefined,
    },
  ];

  return (
    <aside className="sticky top-20 flex flex-col justify-between h-[calc(100vh-5.5rem)] w-60 xl:w-64 shrink-0 pb-6 pr-4 hidden lg:flex overflow-y-auto no-scrollbar">
      {/* Navigation Links */}
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={item.to}
              onClick={item.onClick}
              className={`flex items-center justify-between rounded-2xl px-4 py-2.5 text-sm font-bold transition-all cursor-pointer ${
                item.isActive
                  ? "bg-[#8B2FC9] text-white shadow-[0_4px_16px_rgba(168, 56, 189,0.3)]"
                  : "text-[#0F172A] hover:bg-white hover:text-[#8B2FC9] hover:shadow-xs"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Icon className={`h-5 w-5 ${item.isActive ? "text-white" : "text-[#581C87]"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-mono font-bold ${
                    item.isActive ? "bg-white text-[#8B2FC9]" : "bg-[#8B2FC9] text-white"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Middle & Bottom Cards */}
      <div className="mt-4 space-y-3">
        {/* Card 1: "Are you a Local Shop?" Card (Matches Desktop Mockup) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FAF3FF] via-[#F4E8FC] to-[#ECD5F9] p-3.5 xl:p-4 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-start gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-xs border border-[#E2E8F0]">
              <Store className="h-5 w-5 text-[#8B2FC9]" />
              <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-[#0F172A] leading-tight">
                Are you a <br />
                <span className="text-[#8B2FC9]">Local Shop?</span>
              </h3>
              <p className="mt-1 text-[11px] text-[#64748B] leading-tight">
                Create your shop, share updates, go live and grow your business on LocalShore.
              </p>
            </div>
          </div>

          <a
            href={SELLER_HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-[#8B2FC9] py-2 text-xs font-bold text-white shadow-xs hover:bg-[#7812B8] active:scale-95 transition-all cursor-pointer"
          >
            <span>Open a Shop</span>
            <ArrowRight className="h-3 w-3" />
          </a>
        </div>

        {/* Card 2: "MY NEIGHBORHOOD" Card (Matches Desktop Mockup) */}
        <div className="rounded-2xl bg-white p-3 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F8FAFC] text-[#8B2FC9] border border-purple-100/80">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                My Neighborhood
              </span>
              <span className="text-xs font-bold text-[#0F172A] block mt-0.5">
                {neighborhoodArea}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
