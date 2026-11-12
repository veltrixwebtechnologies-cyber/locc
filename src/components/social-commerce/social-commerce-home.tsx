import { useState, useMemo, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { TopNavbar } from "./top-navbar";
import { LeftSidebar } from "./left-sidebar";
import { CityHeroBanner } from "./city-hero-banner";
import { QuickFeatureCards } from "./quick-feature-cards";
import { ShopByCategorySection } from "./shop-by-category-section";
import { NeighborhoodStoriesSection } from "./neighborhood-stories-section";
import { SocialCommercePostCard } from "./social-commerce-post-card";
import { LiveMarketWidget } from "./live-market-widget";
import { TrendingWidget } from "./trending-widget";
import { LocalGroupsWidget } from "./local-groups-widget";
import { EventsWidget } from "./events-widget";
import { YourDeliveryWidget } from "./your-delivery-widget";
import { MobileBottomDock } from "./mobile-bottom-dock";
import { Explore12LocalShops } from "./explore-12-local-shops";
import { ExploreLocalShopsCarousel } from "./explore-local-shops-carousel";
import { INITIAL_POSTS, INITIAL_LIVE_MARKET, type SocialPost, getSocialPostsForLocation, getSocialStoriesForLocation, isBengaluruLocation } from "@/lib/social-feed-data";
import { useDeliveryLocation } from "@/lib/location-store";
import { useFollowedShopIds } from "@/lib/following-store";
import type { ShopCardData } from "@/modules/shopper/components/shop-card";
import type { MerchandisingProduct } from "@/lib/merchandising";
import { ShopCard } from "@/modules/shopper/components/shop-card";
import { ProductCard } from "@/components/merchandising-sections";
import { stores, categoryLabel } from "@/lib/mock-data";
import {
  Sparkles,
  ChevronRight,
  MessageCircle,
  Send,
  X,
  Radio,
  Users,
  Heart,
  ShoppingCart,
  Tag,
  Leaf,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { LocationModalHost } from "@/components/app-shell";
import { ReplaceCartDialog } from "@/components/cart/replace-cart-dialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cartStore } from "@/modules/shopper/services/cart-store";
import { toast } from "sonner";

interface SocialCommerceHomeProps {
  nearbyShops: ShopCardData[];
  nearbyProducts: MerchandisingProduct[];
  isLoadingShops?: boolean;
  isLoadingProducts?: boolean;
  hasConfirmedLocation?: boolean;
  onRequestLocation?: () => void;
  selectedCategory?: string;
  onSelectCategory?: (categorySlug: string) => void;
}


const JP_NAGAR_STORES_FALLBACK: ShopCardData[] = [
  {
    id: "s_jp_apparel",
    name: "JP Nagar Readymades & Menswear",
    category: "Individual Fashion",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80",
    rating: 4.8,
    distanceKm: 0.4,
    isOpen: true,
    address: "15th Main Road, JP Nagar 2nd Phase, Bengaluru",
    description: "Pure combed cotton shirts & ethnic casuals",
  },
  {
    id: "s_jp_bakery",
    name: "Ravi's Artisan Bakery (JP Nagar)",
    category: "Bakery & Sweets",
    imageUrl: "/assets/ravis-sourdough-hero.jpg",
    rating: 4.9,
    distanceKm: 0.3,
    isOpen: true,
    address: "24th Main Road, JP Nagar 2nd Phase, Bengaluru",
    description: "Woodfired sourdough & French pastries",
  },
  {
    id: "s_jp_produce",
    name: "Namma Fresh Produce & Organics",
    category: "Fresh Produce",
    imageUrl: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80",
    rating: 4.9,
    distanceKm: 0.4,
    isOpen: true,
    address: "Ring Road Junction, JP Nagar 2nd Phase, Bengaluru",
    description: "Farm fresh greens & seasonal fruits",
  },
  {
    id: "s_jp_medicals",
    name: "Apollo Pharmacy & Wellness - JP Nagar",
    category: "Individual Pharmacy",
    imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&q=80",
    rating: 4.8,
    distanceKm: 0.2,
    isOpen: true,
    address: "15th Main Road, JP Nagar 2nd Phase, Bengaluru",
    description: "24/7 medicines & healthcare essentials",
  },
  {
    id: "s_jp_dining",
    name: "City Bites Kitchen & Mess (JP Nagar)",
    category: "Restaurants & Dining",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80",
    rating: 4.8,
    distanceKm: 0.5,
    isOpen: true,
    address: "14th Cross Rd, JP Nagar 2nd Phase, Bengaluru",
    description: "Authentic Karnataka thatte idlis & degree coffee",
  },
  {
    id: "s_jp_mill",
    name: "Sri Amman Flour & Grain Mill (JP Nagar)",
    category: "Flour & Masala Mill",
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
    rating: 4.9,
    distanceKm: 0.3,
    isOpen: true,
    address: "9th Cross, JP Nagar 2nd Phase, Bengaluru",
    description: "Freshly milled batter & organic grains",
  },
];

export function SocialCommerceHome({
  nearbyShops,
  nearbyProducts,
  isLoadingShops = false,
  isLoadingProducts = false,
  hasConfirmedLocation = false,
  onRequestLocation,
  selectedCategory,
  onSelectCategory,
}: SocialCommerceHomeProps) {
  // Sync tab and category from URL if present
  const urlTab = useRouterState({
    select: (s) => (s.location.search as { tab?: string }).tab,
  });
  const urlCategory = useRouterState({
    select: (s) => (s.location.search as { category?: string }).category,
  });

  const effectiveCategory = selectedCategory !== undefined ? selectedCategory : urlCategory;

  const [deliveryLocation] = useDeliveryLocation();
  const isBLR = isBengaluruLocation(deliveryLocation);
  const locationStories = useMemo(() => getSocialStoriesForLocation(deliveryLocation), [deliveryLocation]);

  const [activeFeedTab, setActiveFeedTab] = useState<string>("for_you");
  const followedShopIds = useFollowedShopIds();
  const [posts, setPosts] = useState<SocialPost[]>(() => getSocialPostsForLocation(deliveryLocation));

  useEffect(() => {
    setPosts(getSocialPostsForLocation(deliveryLocation));
  }, [deliveryLocation]);
  const [isLiveMarketModalOpen, setIsLiveMarketModalOpen] = useState(false);
  const [isMessagesModalOpen, setIsMessagesModalOpen] = useState(false);
  const [showAllShops, setShowAllShops] = useState(false);

  // Ensure all authentic neighborhood shops with their genuine addresses are available
  const allAvailableShops = useMemo<ShopCardData[]>(() => {
    let list = isBLR ? JP_NAGAR_STORES_FALLBACK : nearbyShops;
    if (!list || list.length < 6) {
      const fallbackList: ShopCardData[] = stores.map((s) => ({
        id: s.id,
        name: s.name,
        category: categoryLabel[s.category] ?? s.category,
        imageUrl: s.imageUrl,
        rating: s.rating ?? 4.8,
        distanceKm: s.distanceKm ?? 0.5,
        isOpen: s.isOpen ?? true,
        address: s.address,
        description: s.tagline,
      }));
      const seen = new Set((nearbyShops || []).map((s) => s.id));
      const merged = [...(nearbyShops || [])];
      for (const fb of fallbackList) {
        if (!seen.has(fb.id)) {
          merged.push(fb);
          seen.add(fb.id);
        }
      }
      list = merged;
    }

    if (effectiveCategory && effectiveCategory !== "all") {
      const normCat = effectiveCategory.toLowerCase();
      const filtered = list.filter((s) => {
        const sc = (s.category || "").toLowerCase();
        const sn = (s.name || "").toLowerCase();
        const sd = (s.description || "").toLowerCase();
        return (
          sc.includes(normCat) ||
          normCat.includes(sc) ||
          sn.includes(normCat) ||
          sd.includes(normCat)
        );
      });
      if (filtered.length > 0) return filtered;
    }
    return list;
  }, [nearbyShops, effectiveCategory]);

  const displayedShops = showAllShops
    ? allAvailableShops
    : allAvailableShops.slice(0, 6);

  // Sync tab with URL search parameter
  useEffect(() => {
    if (
      urlTab &&
      ["for_you", "following", "nearby", "fresh", "deals", "community"].includes(urlTab)
    ) {
      setActiveFeedTab(urlTab);
    }
  }, [urlTab]);

  // Messages Chat State
  const [activeChatShopId, setActiveChatShopId] = useState<string>("s_paap1");
  const [chatInputText, setChatInputText] = useState("");
  const [conversations, setConversations] = useState([
    {
      shopId: "s_paap1",
      shopName: "Ravi's Artisan Bakery",
      avatar: "/assets/ravis-bakery-logo.png",
      status: "Active 5m ago",
      messages: [
        {
          id: 1,
          sender: "shop",
          text: "Hi! Welcome to Ravi's Artisan Bakery on LocalShore. Our woodfire sourdough was just taken out of the oven! 🥖",
          time: "11:20 AM",
        },
        {
          id: 2,
          sender: "shop",
          text: "Would you like us to slice it for you before delivery?",
          time: "11:21 AM",
        },
      ],
    },
    {
      shopId: "s_kiran1",
      shopName: "Meena Fresh Produce",
      avatar:
        "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=100&q=80",
      status: "Active 1h ago",
      messages: [
        {
          id: 3,
          sender: "shop",
          text: "Thanks for checking in! Salem Alphonso mangoes arrived early this morning. Naturally ripened & sweet. 🥭",
          time: "9:45 AM",
        },
      ],
    },
    {
      shopId: "s_boutique1",
      shopName: "StyleHub Apparel",
      avatar:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=100&q=80",
      status: "Active 2h ago",
      messages: [
        {
          id: 4,
          sender: "shop",
          text: "Hello! We have restocked the pastel cotton t-shirts in sizes M and L. Let us know if you have any questions!",
          time: "Yesterday",
        },
      ],
    },
  ]);

  const activeConversation =
    conversations.find((c) => c.shopId === activeChatShopId) || conversations[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: "user",
      text: chatInputText.trim(),
      time: "Just now",
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.shopId === activeChatShopId ? { ...c, messages: [...c.messages, newMsg] } : c,
      ),
    );

    setChatInputText("");
    toast.success(`Message sent to ${activeConversation.shopName}!`);
  };

  // Filter posts based on active tab
  const filteredPosts = useMemo(() => {
    switch (activeFeedTab) {
      case "following":
        return posts.filter((p) => followedShopIds.includes(p.shopId));
      case "nearby":
        return posts.filter((p) => p.distanceKm <= 1.8 || p.category === "nearby");
      case "fresh":
        return posts.filter(
          (p) =>
            p.category === "fresh" ||
            p.badgeTag === "Freshly Baked" ||
            p.badgeTag === "Farm Fresh" ||
            p.badgeTag === "Stone Milled" ||
            p.hashtags.some((h) => /fresh|organic|bake|harvest|farm/i.test(h)),
        );
      case "deals":
        return posts.filter(
          (p) =>
            p.category === "deals" ||
            (p.badgeTag && /deal|off|discount|sale|combo|pure ghee/i.test(p.badgeTag)) ||
            p.hashtags.some((h) => /deal|sale|offer|discount/i.test(h)) ||
            p.taggedProducts.some((tp) => (tp.discountPrice && tp.discountPrice < tp.price) || tp.price > 0),
        );
      case "community":
        return posts.filter(
          (p) =>
            p.category === "events" ||
            (p.badgeTag && /community|event|meetup|workshop/i.test(p.badgeTag)) ||
            p.hashtags.some((h) => /community|event|meetup|local/i.test(h)),
        );
      default:
        return posts;
    }
  }, [posts, activeFeedTab, followedShopIds]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-24 lg:pb-16">
      {/* Fixed/Sticky Top Navigation Header */}
      <TopNavbar />

      {/* Main 3-Column Desktop / Single-Column Mobile Container */}
      <div className="mx-auto max-w-[1536px] px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 pb-24 sm:pb-28">
        <div className="flex gap-5 lg:gap-6 items-start">
          {/* Left Column: Persistent Desktop Sidebar */}
          <LeftSidebar
            onOpenLiveMarket={() => setIsLiveMarketModalOpen(true)}
            onOpenMessages={() => setIsMessagesModalOpen(true)}
            activeFeedTab={activeFeedTab}
            onSelectFeedTab={(tab) => setActiveFeedTab(tab)}
          />

          {/* Center Column: Main Content Area */}
          <main className="flex-1 min-w-0 space-y-4 sm:space-y-5">
            {/* Live Delivery Tracker (only appears when an order has actually been placed) */}
            <YourDeliveryWidget />

            {/* 1. City Marketplace Hero Banner (Matches Reference) */}
            <CityHeroBanner />

            {/* 2. Quick Feature Cards: Deals, Fresh Today, Live Market, Local Events */}
            <QuickFeatureCards
              activeTab={activeFeedTab}
              onSelectTab={(tab) => {
                setActiveFeedTab(tab);
                const feedEl = document.getElementById("social-feed-container");
                if (feedEl) {
                  feedEl.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              onOpenLiveMarket={() => setIsLiveMarketModalOpen(true)}
            />

            {/* 3. Explore Local Shops: 5-Card Horizontal Slider Carousel (Matches Reference) */}
            <ExploreLocalShopsCarousel />

            {/* 4. Quick Category & Feed Filter Pills */}
            <div id="social-feed-container" className="scroll-mt-20 pt-2">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {[
                  { id: "all", label: "All Updates" },
                  { id: "grocery", label: "Groceries" },
                  { id: "fresh", label: "Fresh Produce" },
                  { id: "bakery", label: "Bakery" },
                  { id: "fashion", label: "Fashion" },
                  { id: "deals", label: "Deals" },
                  { id: "community", label: "Community" },
                ].map((tab) => {
                  const isActive =
                    (effectiveCategory && effectiveCategory === tab.id) ||
                    (!effectiveCategory && activeFeedTab === tab.id) ||
                    (!effectiveCategory && tab.id === "all" && activeFeedTab === "for_you");
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        if (tab.id === "all") {
                          if (onSelectCategory) onSelectCategory("");
                          setActiveFeedTab("for_you");
                        } else if (["deals", "community"].includes(tab.id)) {
                          if (onSelectCategory) onSelectCategory("");
                          setActiveFeedTab(tab.id);
                        } else {
                          if (onSelectCategory) onSelectCategory(tab.id);
                        }
                      }}
                      className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contextual Filter Info Banner */}
            {activeFeedTab === "deals" && (
              <div className="rounded-2xl bg-white border border-slate-200/80 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#8B2FC9]">
                    <Tag className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Neighborhood Deals & Offers</h4>
                    <p className="text-xs text-slate-500">Verified savings, discounts & value combos from nearby shops</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 text-[#8B2FC9] px-3 py-1 text-xs font-semibold shrink-0 self-start sm:self-auto border border-purple-200/60">
                  Active Discounts
                </span>
              </div>
            )}

            {activeFeedTab === "fresh" && (
              <div className="rounded-2xl bg-white border border-slate-200/80 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Leaf className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Fresh Harvest & Daily Bakes</h4>
                    <p className="text-xs text-slate-500">Fresh morning bakes, farm produce, and seasonal arrivals</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-semibold shrink-0 self-start sm:self-auto border border-emerald-200/60">
                  Daily Stock
                </span>
              </div>
            )}

            {activeFeedTab === "community" && (
              <div className="rounded-2xl bg-white border border-slate-200/80 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Neighborhood Events & Groups</h4>
                    <p className="text-xs text-slate-500">Local farmers markets, workshops & neighborhood gatherings</p>
                  </div>
                </div>
                <Link
                  to="/community"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition shadow-xs shrink-0 self-start sm:self-auto"
                >
                  <span>Open Community Hub</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {/* 6. Social-Commerce Feed Posts (Aligned in 2-Column Grid matching reference) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
              {filteredPosts.map((post) => (
                <SocialCommercePostCard key={post.id} post={post} />
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div className="rounded-3xl bg-white p-8 text-center border border-[#E2E8F0]">
                <Sparkles className="mx-auto h-8 w-8 text-[#8B2FC9]" />
                <p className="mt-2 text-sm font-bold text-[#0F172A]">
                  {activeFeedTab === "following"
                    ? "You are not following any shops yet"
                    : "No posts in this filter right now"}
                </p>
                <p className="text-xs text-[#64748B] mt-1">
                  {activeFeedTab === "following"
                    ? "Click '+ Follow' on any neighborhood bakery, grocery, or fashion store to see their latest updates here!"
                    : "Explore other tabs or follow local shops to see their updates."}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveFeedTab("for_you")}
                  className="mt-3 rounded-full bg-[#8B2FC9] px-4 py-1.5 text-xs font-bold text-white cursor-pointer"
                >
                  Explore Local Shops
                </button>
              </div>
            )}

            {/* Mobile Contextual Widgets (Live Market & Trending Near You) */}
            <div className="space-y-4 lg:hidden mt-4">
              <LiveMarketWidget />
              <TrendingWidget />
            </div>
          </main>

          {/* Right Column: Contextual Widgets (Matches Desktop Reference) */}
          <aside className="w-72 lg:w-80 xl:w-[330px] shrink-0 space-y-4 hidden lg:block self-start sticky top-20">
            {/* 1. Live Market */}
            <LiveMarketWidget />

            {/* 2. Trending Near You */}
            <TrendingWidget />
          </aside>
        </div>
      </div>

      {/* Unified Bottom Navigation Dock for Both Mobile & Desktop */}
      <MobileBottomDock
        onPostCreated={(newPost) => setPosts([newPost, ...posts])}
        onOpenLiveMarket={() => setIsLiveMarketModalOpen(true)}
      />

      {/* ── Global Interactive Messages Modal (2-pane chat with local shops) ── */}
      <Dialog open={isMessagesModalOpen} onOpenChange={setIsMessagesModalOpen}>
        <DialogContent hideCloseButton className="max-w-2xl p-0 overflow-hidden border-none sm:rounded-3xl bg-white shadow-2xl z-[130]">
          <DialogTitle className="sr-only">Messages with Local Shops</DialogTitle>
          <div className="flex flex-col md:flex-row h-[520px]">
            {/* Left Shop List */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#E2E8F0] bg-[#F8FAFC] p-3 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-[#8B2FC9]" />
                  <span className="text-xs font-bold text-[#0F172A]">Shop Chats</span>
                </div>
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#8B2FC9] px-1.5 text-[10px] font-bold text-white">
                  3
                </span>
              </div>

              <div className="mt-2 space-y-1 overflow-y-auto no-scrollbar flex-1">
                {conversations.map((conv) => {
                  const isSelected = conv.shopId === activeChatShopId;
                  const lastMessage = conv.messages[conv.messages.length - 1];
                  return (
                    <button
                      key={conv.shopId}
                      type="button"
                      onClick={() => setActiveChatShopId(conv.shopId)}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-2xl text-left transition cursor-pointer ${
                        isSelected
                          ? "bg-white shadow-xs border border-[#E2E8F0]"
                          : "hover:bg-white/70"
                      }`}
                    >
                      <img
                        src={conv.avatar}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-[#8B2FC9]/30"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[#0F172A] truncate">
                            {conv.shopName}
                          </h4>
                        </div>
                        <p className="text-[10px] text-[#64748B] truncate mt-0.5">
                          {lastMessage ? lastMessage.text : "No messages"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Active Chat Pane */}
            <div className="flex-1 flex flex-col justify-between bg-white">
              {/* Header */}
              <div className="flex items-center justify-between p-3.5 border-b border-[#E2E8F0] bg-white">
                <div className="flex items-center gap-2.5">
                  <img
                    src={activeConversation.avatar}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-[#8B2FC9]"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">
                      {activeConversation.shopName}
                    </h4>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {activeConversation.status}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMessagesModalOpen(false)}
                  className="rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FCFAFF]">
                {activeConversation.messages.map((msg) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                          isUser
                            ? "bg-[#8B2FC9] text-white rounded-br-xs shadow-xs"
                            : "bg-white text-[#0F172A] border border-[#E2E8F0] rounded-bl-xs shadow-xs"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-[#8E82A3] mt-1 px-1">{msg.time}</span>
                    </div>
                  );
                })}
              </div>

              {/* Message Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-[#E2E8F0] bg-white flex gap-2"
              >
                <input
                  type="text"
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  placeholder={`Reply to ${activeConversation.shopName}...`}
                  className="flex-1 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2 text-xs outline-none focus:border-[#8B2FC9]"
                />
                <button
                  type="submit"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8B2FC9] text-white hover:bg-[#7812B8] transition cursor-pointer shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Standalone Live Market Modal (Opens on all screens < 1280px or when requested) ── */}
      <Dialog open={isLiveMarketModalOpen} onOpenChange={setIsLiveMarketModalOpen}>
        <DialogContent hideCloseButton className="max-w-2xl p-0 overflow-hidden border-none sm:rounded-3xl bg-zinc-950 text-white z-[130]">
          <DialogTitle className="sr-only">Live Market Shopping</DialogTitle>
          <div className="relative flex flex-col md:flex-row h-[560px]">
            {/* Live Stream Panel */}
            <div className="relative flex-1 bg-black flex flex-col justify-between p-4">
              <div className="relative z-20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white">
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    LIVE
                  </span>
                  <div className="flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold backdrop-blur-xs">
                    <Users className="h-3.5 w-3.5 text-rose-400" />
                    <span>{INITIAL_LIVE_MARKET.viewerCount}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to="/live-market"
                    onClick={() => setIsLiveMarketModalOpen(false)}
                    className="rounded-full bg-white/20 hover:bg-white/30 px-3 py-1 text-xs font-semibold text-white transition flex items-center gap-1.5"
                  >
                    <span>Full Live Hub</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsLiveMarketModalOpen(false)}
                    className="rounded-full bg-black/40 p-1.5 text-white/80 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Background Video/Image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src={INITIAL_LIVE_MARKET.thumbnailUrl}
                  alt={INITIAL_LIVE_MARKET.sellerName}
                  className="h-full w-full object-cover opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
              </div>

              {/* Bottom Video Overlays */}
              <div className="relative z-20">
                <h3 className="text-sm font-bold text-white">{INITIAL_LIVE_MARKET.title}</h3>
                <p className="text-xs text-white/70">
                  Featuring fresh harvest from {INITIAL_LIVE_MARKET.sellerName}
                </p>

                {/* Live Products Strip */}
                <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {INITIAL_LIVE_MARKET.taggedProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="flex items-center gap-2.5 rounded-2xl bg-black/80 p-2 pr-3 backdrop-blur-md border border-white/20 shrink-0"
                    >
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="h-10 w-10 rounded-xl object-cover"
                      />
                      <div>
                        <p className="text-xs font-bold text-white line-clamp-1">{prod.name}</p>
                        <p className="text-xs font-extrabold text-[#F59E0B]">₹{prod.price}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          cartStore.add(prod.storeId, prod.storeName, {
                            id: prod.id,
                            name: prod.name,
                            price: prod.price,
                            unit: prod.unit,
                            stock: prod.stock,
                            imageUrl: prod.imageUrl,
                          });
                          toast.success(`Added ${prod.name} to cart!`);
                        }}
                        className="ml-1 rounded-full bg-[#8B2FC9] p-1.5 text-white hover:bg-[#7812B8] cursor-pointer"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Chat Column */}
            <div className="w-full md:w-64 bg-zinc-900 flex flex-col justify-between border-t md:border-t-0 md:border-l border-zinc-800 p-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="text-xs font-bold text-zinc-300">Live Chat</span>
                  <div className="flex items-center gap-1 text-xs text-rose-400">
                    <Heart className="h-3.5 w-3.5 fill-current" />
                    <span>312</span>
                  </div>
                </div>
                <div className="mt-3 space-y-2.5 max-h-[380px] overflow-y-auto pr-1 text-xs">
                  <div className="leading-snug">
                    <span className="font-bold text-[#F59E0B] mr-1.5">Suresh P.:</span>
                    <span className="text-zinc-300">
                      Are the mangoes sweet? How is the quality?
                    </span>
                  </div>
                  <div className="leading-snug">
                    <span className="font-bold text-[#F59E0B] mr-1.5">Kumar (Host):</span>
                    <span className="text-zinc-300">
                      Very sweet and carbide-free! Fresh from Salem orchards.
                    </span>
                  </div>
                  <div className="leading-snug">
                    <span className="font-bold text-[#F59E0B] mr-1.5">Kavitha M.:</span>
                    <span className="text-zinc-300">
                      Just ordered 2 kg! Looking forward to delivery.
                    </span>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Comment sent to live stream!");
                }}
                className="mt-2 flex gap-1.5"
              >
                <input
                  type="text"
                  placeholder="Ask a question..."
                  className="flex-1 rounded-full bg-zinc-800 px-3 py-1.5 text-xs text-white outline-none placeholder:text-zinc-500 focus:ring-1 focus:ring-[#8B2FC9]"
                />
                <button
                  type="submit"
                  className="rounded-full bg-[#8B2FC9] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#7812B8]"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Global Modals & Dialogs */}
      <LocationModalHost />
      <ReplaceCartDialog />
    </div>
  );
}
