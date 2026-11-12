import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Home,
  Compass,
  ShoppingBag,
  Users,
  Plus,
  HelpCircle,
  Star,
  Camera,
  Radio,
  X,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useDeliveryLocation } from "@/lib/location-store";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

interface BottomDockProps {
  onPostCreated?: (post: any) => void;
  onOpenLiveMarket?: () => void;
  className?: string;
}

export function MobileBottomDock({
  onPostCreated,
  onOpenLiveMarket,
  className = "",
}: BottomDockProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const auth = useAuth();
  const [deliveryLocation] = useDeliveryLocation();

  const activeAreaLabel = deliveryLocation
    ? `${deliveryLocation.area || deliveryLocation.label?.split(",")[0]}, ${deliveryLocation.city || ""}`.trim()
    : "Coimbatore, TN";

  const [activeModal, setActiveModal] = useState<
    "menu" | "ask" | "recommend" | "find" | "group" | null
  >(null);

  // Form states
  const [askQuestion, setAskQuestion] = useState("");
  const [askDetails, setAskDetails] = useState("");
  const [askCategory, setAskCategory] = useState("Groceries & Food");

  const [recShopName, setRecShopName] = useState("");
  const [recReview, setRecReview] = useState("");
  const [recRating, setRecRating] = useState(5);
  const [recBestItem, setRecBestItem] = useState("");

  const [findTitle, setFindTitle] = useState("");
  const [findStore, setFindStore] = useState("");
  const [findPrice, setFindPrice] = useState("");
  const [findNotes, setFindNotes] = useState("");

  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");

  const userName =
    (auth as any).user?.user_metadata?.display_name ||
    (auth as any).user?.email?.split("@")[0] ||
    "Shopper Neighbor";
  const userAvatar =
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";

  const isHome = pathname === "/";
  const isExplore = pathname.startsWith("/explore") || pathname.startsWith("/search");
  const isOrders = pathname.startsWith("/orders") || pathname.startsWith("/order");
  const isCommunity = pathname.startsWith("/community");

  // Handlers for creations
  const handleAskNeighbors = (e: React.FormEvent) => {
    e.preventDefault();
    if (!askQuestion.trim()) {
      toast.error("Please enter your question for neighbors.");
      return;
    }

    const newPost = {
      id: `ask_${Date.now()}`,
      shopId: "community_user",
      shopName: `${userName} (Neighbor)`,
      shopAvatar: userAvatar,
      verified: true,
      locationName: activeAreaLabel,
      distanceKm: 0.2,
      timestamp: "Just now",
      badgeTag: "Neighbor Question 💬",
      images: [
        "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80",
      ],
      title: askQuestion,
      description: askDetails || `Looking for recommendations around ${activeAreaLabel}. Where's the best spot?`,
      hashtags: ["#NeighborhoodHelp", `#${askCategory.replace(/[^a-zA-Z]/g, "")}`, "#ShopLocal"],
      likesCount: 1,
      commentsCount: 0,
      sharesCount: 0,
      savesCount: 0,
      isLiked: true,
      category: askCategory.toLowerCase().includes("food") ? "food" : "grocery",
      taggedProducts: [],
    };

    onPostCreated?.(newPost);
    toast.success("Question posted to your neighborhood feed! 💬");
    setAskQuestion("");
    setAskDetails("");
    setActiveModal(null);
  };

  const handleRecommendShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recShopName.trim() || !recReview.trim()) {
      toast.error("Please fill in shop name and recommendation.");
      return;
    }

    const newPost = {
      id: `rec_${Date.now()}`,
      shopId: "shopper_recommendation",
      shopName: recShopName,
      shopAvatar: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80",
      verified: true,
      locationName: activeAreaLabel,
      distanceKm: 0.5,
      timestamp: "Just now",
      badgeTag: "Neighbor Recommendation ⭐",
      images: [
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
      ],
      title: `Highly Recommended: ${recShopName}`,
      description: `${recReview} Must-try item: ${recBestItem || "House special"} • Rated ${recRating}/5 by ${userName}.`,
      hashtags: ["#RecommendedStore", "#LocalGems", "#NeighborPicks"],
      likesCount: 3,
      commentsCount: 0,
      sharesCount: 0,
      savesCount: 1,
      isLiked: true,
      category: "grocery",
      taggedProducts: recBestItem
        ? [
            {
              id: `prod_rec_${Date.now()}`,
              name: recBestItem,
              price: 180,
              stock: 15,
              imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
              unit: "item",
              storeId: "shopper_recommendation",
              storeName: recShopName,
            },
          ]
        : [],
    };

    onPostCreated?.(newPost);
    toast.success(`Recommendation for "${recShopName}" shared with neighbors! ⭐`);
    setRecShopName("");
    setRecReview("");
    setRecBestItem("");
    setActiveModal(null);
  };

  const handleShareFind = (e: React.FormEvent) => {
    e.preventDefault();
    if (!findTitle.trim()) {
      toast.error("Please enter what you found.");
      return;
    }

    const newPost = {
      id: `find_${Date.now()}`,
      shopId: "shopper_find",
      shopName: findStore.trim() || `${userName}'s Find`,
      shopAvatar: userAvatar,
      verified: true,
      locationName: activeAreaLabel,
      distanceKm: 0.3,
      timestamp: "Just now",
      badgeTag: "Shopper Find 🛍️",
      images: [
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
      ],
      title: findTitle,
      description: `${findNotes || findTitle} • Bought at ${findStore || "a nearby shop"}${
        findPrice ? ` for ₹${findPrice}` : ""
      }.`,
      hashtags: ["#NeighborhoodFinds", "#ShopperPicks", "#ShopLocal"],
      likesCount: 2,
      commentsCount: 0,
      sharesCount: 0,
      savesCount: 2,
      isLiked: true,
      category: "fashion",
      taggedProducts: findPrice
        ? [
            {
              id: `prod_find_${Date.now()}`,
              name: findTitle,
              price: Number(findPrice) || 299,
              stock: 10,
              imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
              unit: "item",
              storeId: "shopper_find",
              storeName: findStore || "Local Store",
            },
          ]
        : [],
    };

    onPostCreated?.(newPost);
    toast.success("Find shared with your neighborhood feed! 🛍️");
    setFindTitle("");
    setFindStore("");
    setFindPrice("");
    setFindNotes("");
    setActiveModal(null);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error("Please give your group a name.");
      return;
    }
    toast.success(`Group "${groupName}" created successfully! 🎉`);
    setGroupName("");
    setGroupDesc("");
    setActiveModal(null);
  };

  return (
    <>
      {/* ── Unified Floating Bottom Navigation Dock (Responsive: Mobile & Desktop) ── */}
      <nav
        aria-label="Bottom Navigation"
        className={`fixed bottom-3 sm:bottom-4 inset-x-0 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40 pointer-events-none pb-[max(0.25rem,env(safe-area-inset-bottom,0px))] sm:pb-0 ${className}`}
      >
        <div className="mx-auto w-fit max-w-[92vw] px-2 sm:px-0 pointer-events-auto">
          <div className="relative flex items-center justify-between sm:justify-center gap-1 sm:gap-2.5 rounded-full bg-white/95 px-3 sm:px-4 py-1.5 shadow-[0_6px_26px_rgba(33,22,56,0.12)] backdrop-blur-xl border border-[#E2E8F0]/90 transition-all">
            {/* 1. Home */}
            <Link
              to="/"
              className={`flex flex-col items-center justify-center py-1 px-2 sm:px-3 rounded-2xl transition-all cursor-pointer group min-w-[54px] sm:min-w-[62px] ${
                isHome
                  ? "text-[#8B2FC9] font-bold"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isHome ? "bg-[#F8FAFC] scale-105" : "group-hover:bg-[#F8FAFC]"
                }`}
              >
                <Home className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={isHome ? 2.5 : 2} />
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold leading-tight mt-0.5">Home</span>
            </Link>

            {/* 2. Explore */}
            <Link
              to="/explore"
              className={`flex flex-col items-center justify-center py-1 px-2 sm:px-3 rounded-2xl transition-all cursor-pointer group min-w-[54px] sm:min-w-[62px] ${
                isExplore
                  ? "text-[#8B2FC9] font-bold"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isExplore ? "bg-[#F8FAFC] scale-105" : "group-hover:bg-[#F8FAFC]"
                }`}
              >
                <Compass className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={isExplore ? 2.5 : 2} />
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold leading-tight mt-0.5">Explore</span>
            </Link>

            {/* 3. Center Elevated Floating "+ Create" Button */}
            <div className="relative -top-3 sm:-top-3.5 flex flex-col items-center justify-center px-1">
              <button
                type="button"
                onClick={() => setActiveModal("menu")}
                className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#9B2FB0] via-[#851D9B] to-[#581C87] text-white shadow-[0_4px_16px_rgba(155,47,176,0.45)] hover:shadow-[0_6px_20px_rgba(155,47,176,0.6)] transition-all hover:scale-105 active:scale-95 cursor-pointer ring-[3.5px] ring-white"
                aria-label="Create Post or Share"
                title="Create or Share with Neighborhood"
              >
                <Plus className="h-5 w-5 sm:h-5.5 sm:w-5.5 stroke-[2.5]" />
              </button>
            </div>

            {/* 4. Orders */}
            <Link
              to="/orders"
              className={`flex flex-col items-center justify-center py-1 px-2 sm:px-3 rounded-2xl transition-all cursor-pointer group min-w-[54px] sm:min-w-[62px] ${
                isOrders
                  ? "text-[#8B2FC9] font-bold"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isOrders ? "bg-[#F8FAFC] scale-105" : "group-hover:bg-[#F8FAFC]"
                }`}
              >
                <ShoppingBag className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={isOrders ? 2.5 : 2} />
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold leading-tight mt-0.5">Orders</span>
            </Link>

            {/* 5. Community */}
            <Link
              to="/community"
              className={`flex flex-col items-center justify-center py-1 px-2 sm:px-3 rounded-2xl transition-all cursor-pointer group min-w-[54px] sm:min-w-[62px] ${
                isCommunity
                  ? "text-[#8B2FC9] font-bold"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isCommunity ? "bg-[#F8FAFC] scale-105" : "group-hover:bg-[#F8FAFC]"
                }`}
              >
                <Users className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={isCommunity ? 2.5 : 2} />
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold leading-tight mt-0.5">Community</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Quick Action Sheet Modal (Opened by Center '+' Button) ── */}
      <Dialog open={activeModal === "menu"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent hideCloseButton className="max-w-xs sm:max-w-sm p-4 rounded-3xl bg-white border border-[#E2E8F0] z-[120]">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0E6F7]">
            <div>
              <DialogTitle className="text-sm font-bold text-[#0F172A]">
                Share with Your Neighborhood
              </DialogTitle>
              <p className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 text-[#8B2FC9]" />
                {activeAreaLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="p-1 rounded-full text-[#64748B] hover:bg-[#F8FAFC]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-3">
            {/* Ask Neighbors */}
            <button
              type="button"
              onClick={() => setActiveModal("ask")}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition cursor-pointer text-center group"
            >
              <div className="h-10 w-10 rounded-full bg-[#8B2FC9]/10 text-[#8B2FC9] flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <HelpCircle className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-[#0F172A]">Ask Neighbors</span>
              <span className="text-[10px] text-[#64748B]">Get local tips</span>
            </button>

            {/* Recommend Shop */}
            <button
              type="button"
              onClick={() => setActiveModal("recommend")}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition cursor-pointer text-center group"
            >
              <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <Star className="h-5 w-5 fill-amber-400" />
              </div>
              <span className="text-xs font-bold text-[#0F172A]">Recommend</span>
              <span className="text-[10px] text-[#64748B]">Favorite store</span>
            </button>

            {/* Share Find */}
            <button
              type="button"
              onClick={() => setActiveModal("find")}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition cursor-pointer text-center group"
            >
              <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <Camera className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-[#0F172A]">Share Find</span>
              <span className="text-[10px] text-[#64748B]">Snap local deals</span>
            </button>

            {/* Live Market */}
            <button
              type="button"
              onClick={() => {
                setActiveModal(null);
                if (onOpenLiveMarket) {
                  onOpenLiveMarket();
                } else {
                  void navigate({ to: "/live-market" });
                }
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 hover:bg-rose-100/60 transition cursor-pointer text-center group"
            >
              <div className="h-10 w-10 rounded-full bg-rose-500/15 text-rose-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <Radio className="h-5 w-5 animate-pulse" />
              </div>
              <span className="text-xs font-bold text-rose-900">Live Market</span>
              <span className="text-[10px] text-rose-700">Shop streams</span>
            </button>

            {/* Create Group */}
            <button
              type="button"
              onClick={() => setActiveModal("group")}
              className="col-span-2 flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition cursor-pointer text-center group"
            >
              <div className="h-7 w-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-4 w-4" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-[#0F172A] block leading-tight">Create Local Group</span>
                <span className="text-[10px] text-[#64748B] block leading-tight">Connect with neighborhood buyers & shops</span>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── 1. Ask Neighbors Modal Form ── */}
      <Dialog open={activeModal === "ask"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-md p-5 rounded-3xl bg-white border border-[#E2E8F0]">
          <DialogTitle className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-[#8B2FC9]" />
            Ask Neighbors in {activeAreaLabel.split(",")[0]}
          </DialogTitle>
          <p className="text-xs text-[#64748B] -mt-2">
            Ask where to find fresh produce, organic items, or get reliable local recommendations.
          </p>

          <form onSubmit={handleAskNeighbors} className="mt-3 space-y-3">
            <div>
              <label className="text-xs font-bold text-[#504660] block mb-1">Your Question *</label>
              <input
                type="text"
                value={askQuestion}
                onChange={(e) => setAskQuestion(e.target.value)}
                placeholder="e.g. Where can I find the freshest organic mangoes today?"
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-sm outline-none focus:border-[#8B2FC9]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#504660] block mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                value={askDetails}
                onChange={(e) => setAskDetails(e.target.value)}
                placeholder="Preferred timing, delivery requirement, or specific variety..."
                rows={3}
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-sm outline-none focus:border-[#8B2FC9]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#504660] block mb-1">Category</label>
              <select
                value={askCategory}
                onChange={(e) => setAskCategory(e.target.value)}
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-xs font-semibold outline-none focus:border-[#8B2FC9]"
              >
                <option value="Groceries & Food">Groceries & Food</option>
                <option value="Bakery & Sweets">Bakery & Sweets</option>
                <option value="Pharmacy & Health">Pharmacy & Health</option>
                <option value="Local Services">Local Services</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal("menu")}
                className="flex-1 py-2 text-xs font-bold text-[#64748B] rounded-2xl hover:bg-[#F8FAFC] transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-2 py-2 text-xs font-bold text-white bg-[#8B2FC9] hover:bg-[#922ea5] rounded-2xl transition cursor-pointer shadow-md"
              >
                Post to Neighborhood Feed
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 2. Recommend Shop Modal Form ── */}
      <Dialog open={activeModal === "recommend"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-md p-5 rounded-3xl bg-white border border-[#E2E8F0]">
          <DialogTitle className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
            Recommend a Local Shop
          </DialogTitle>
          <p className="text-xs text-[#64748B] -mt-2">
            Help your neighbors discover hidden gems and top local businesses in {activeAreaLabel.split(",")[0]}.
          </p>

          <form onSubmit={handleRecommendShop} className="mt-3 space-y-3">
            <div>
              <label className="text-xs font-bold text-[#504660] block mb-1">Shop Name *</label>
              <input
                type="text"
                value={recShopName}
                onChange={(e) => setRecShopName(e.target.value)}
                placeholder="e.g. Hassan Organics, JP Sweets"
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-sm outline-none focus:border-[#8B2FC9]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#504660] block mb-1">Star Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRecRating(star)}
                    className="p-1 cursor-pointer transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= recRating
                          ? "fill-amber-400 text-amber-500"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#504660] block mb-1">
                Must-Try Product / Specialty
              </label>
              <input
                type="text"
                value={recBestItem}
                onChange={(e) => setRecBestItem(e.target.value)}
                placeholder="e.g. Pure Ghee Mysurpa, Alphonso Mangoes"
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-sm outline-none focus:border-[#8B2FC9]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#504660] block mb-1">
                Your Review & Why You Love It *
              </label>
              <textarea
                value={recReview}
                onChange={(e) => setRecReview(e.target.value)}
                placeholder="Tell neighbors about the quality, owner warmth, quick delivery..."
                rows={3}
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-sm outline-none focus:border-[#8B2FC9]"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal("menu")}
                className="flex-1 py-2 text-xs font-bold text-[#64748B] rounded-2xl hover:bg-[#F8FAFC] transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-2 py-2 text-xs font-bold text-white bg-[#8B2FC9] hover:bg-[#922ea5] rounded-2xl transition cursor-pointer shadow-md"
              >
                Share Recommendation
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 3. Share Find Modal Form ── */}
      <Dialog open={activeModal === "find"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-md p-5 rounded-3xl bg-white border border-[#E2E8F0]">
          <DialogTitle className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <Camera className="h-5 w-5 text-[#8B2FC9]" />
            Share a Local Find
          </DialogTitle>
          <p className="text-xs text-[#64748B] -mt-2">
            Show off great deals, unique artisan goods, or fresh arrivals you bought locally.
          </p>

          <form onSubmit={handleShareFind} className="mt-3 space-y-3">
            <div>
              <label className="text-xs font-bold text-[#504660] block mb-1">What did you find? *</label>
              <input
                type="text"
                value={findTitle}
                onChange={(e) => setFindTitle(e.target.value)}
                placeholder="e.g. Handcrafted terracotta chai cups"
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-sm outline-none focus:border-[#8B2FC9]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-[#504660] block mb-1">Store / Spot</label>
                <input
                  type="text"
                  value={findStore}
                  onChange={(e) => setFindStore(e.target.value)}
                  placeholder="e.g. Crafts Corner"
                  className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs outline-none focus:border-[#8B2FC9]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#504660] block mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={findPrice}
                  onChange={(e) => setFindPrice(e.target.value)}
                  placeholder="e.g. 199"
                  className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs outline-none focus:border-[#8B2FC9]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#504660] block mb-1">Notes or Deal Info</label>
              <textarea
                value={findNotes}
                onChange={(e) => setFindNotes(e.target.value)}
                placeholder="Super durable, 20% discount if bought in sets of 4..."
                rows={2}
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-sm outline-none focus:border-[#8B2FC9]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal("menu")}
                className="flex-1 py-2 text-xs font-bold text-[#64748B] rounded-2xl hover:bg-[#F8FAFC] transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-2 py-2 text-xs font-bold text-white bg-[#8B2FC9] hover:bg-[#922ea5] rounded-2xl transition cursor-pointer shadow-md"
              >
                Share Find 🛍️
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 4. Create Group Modal Form ── */}
      <Dialog open={activeModal === "group"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-md p-5 rounded-3xl bg-white border border-[#E2E8F0]">
          <DialogTitle className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <Users className="h-5 w-5 text-[#8B2FC9]" />
            Create a Neighborhood Group
          </DialogTitle>
          <p className="text-xs text-[#64748B] -mt-2">
            Gather neighbors for bulk buying, organic gardening, deals sharing, or food tasting.
          </p>

          <form onSubmit={handleCreateGroup} className="mt-3 space-y-3">
            <div>
              <label className="text-xs font-bold text-[#504660] block mb-1">Group Name *</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. RS Puram Organic Club"
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-sm outline-none focus:border-[#8B2FC9]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#504660] block mb-1">Description</label>
              <textarea
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                placeholder="What is this group about? Who should join?"
                rows={3}
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-sm outline-none focus:border-[#8B2FC9]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal("menu")}
                className="flex-1 py-2 text-xs font-bold text-[#64748B] rounded-2xl hover:bg-[#F8FAFC] transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-2 py-2 text-xs font-bold text-white bg-[#8B2FC9] hover:bg-[#922ea5] rounded-2xl transition cursor-pointer shadow-md"
              >
                Create Group 🎉
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Alias for unified usage across both mobile & desktop
export const UnifiedBottomDock = MobileBottomDock;
