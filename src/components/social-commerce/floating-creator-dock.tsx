import { useState } from "react";
import {
  HelpCircle,
  Star,
  Plus,
  Camera,
  Users,
  Sparkles,
  MapPin,
  Heart,
  MessageSquareQuote,
  ShoppingBag,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useDeliveryLocation } from "@/lib/location-store";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

interface FloatingCreatorDockProps {
  onPostCreated?: (post: any) => void;
  onOpenLiveMarket?: () => void;
}

export function FloatingCreatorDock({ onPostCreated }: FloatingCreatorDockProps) {
  const auth = useAuth();
  const [deliveryLocation] = useDeliveryLocation();
  const activeAreaLabel = deliveryLocation
    ? `${deliveryLocation.area || deliveryLocation.label?.split(",")[0]}, ${deliveryLocation.city || ""}`.trim()
    : "RS Puram, Coimbatore";

  const [activeModal, setActiveModal] = useState<
    "ask" | "recommend" | "find" | "group" | "menu" | null
  >(null);

  // 1. Ask Neighbors form state
  const [askQuestion, setAskQuestion] = useState("");
  const [askDetails, setAskDetails] = useState("");
  const [askCategory, setAskCategory] = useState("Groceries & Food");

  // 2. Recommend Shop form state
  const [recShopName, setRecShopName] = useState("");
  const [recReview, setRecReview] = useState("");
  const [recRating, setRecRating] = useState(5);
  const [recBestItem, setRecBestItem] = useState("");

  // 3. Share Find form state
  const [findTitle, setFindTitle] = useState("");
  const [findStore, setFindStore] = useState("");
  const [findPrice, setFindPrice] = useState("");
  const [findNotes, setFindNotes] = useState("");

  // 4. Group form states
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [groupArea, setGroupArea] = useState(activeAreaLabel);

  const userName =
    (auth as any).user?.user_metadata?.display_name ||
    (auth as any).user?.email?.split("@")[0] ||
    "Shopper Neighbor";
  const userAvatar =
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";

  // Handle: Ask Neighbors
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
      badgeTag: "Neighbor Question ❓",
      images: [
        "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80",
      ],
      title: askQuestion,
      description: askDetails || `Asking neighbors in ${activeAreaLabel}: ${askQuestion}`,
      hashtags: ["#AskNeighbors", `#${askCategory.replace(/[^a-zA-Z]/g, "")}`, "#LocalAdvice"],
      likesCount: 1,
      commentsCount: 0,
      sharesCount: 0,
      savesCount: 0,
      isLiked: false,
      category: "grocery",
      taggedProducts: [],
    };

    onPostCreated?.(newPost);
    toast.success("Question posted to your neighborhood feed! 💬");
    setAskQuestion("");
    setAskDetails("");
    setActiveModal(null);
  };

  // Handle: Recommend Shop
  const handleRecommendShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recShopName.trim() || !recReview.trim()) {
      toast.error("Please enter the shop name and why you recommend it.");
      return;
    }

    const newPost = {
      id: `rec_${Date.now()}`,
      shopId: "recommended_shop",
      shopName: recShopName,
      shopAvatar: "/assets/ravis-bakery-logo.png",
      verified: true,
      locationName: activeAreaLabel,
      distanceKm: 0.4,
      timestamp: "Just now",
      badgeTag: `Shopper Recommendation ⭐ ${recRating}.0`,
      images: [
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
      ],
      title: `Recommended by ${userName}: ${recShopName}`,
      description: `"${recReview}"${recBestItem ? ` • Must-try item: ${recBestItem}` : ""}`,
      hashtags: ["#ShopperRecommendation", "#LocalFavorite", "#SupportLocal"],
      likesCount: 3,
      commentsCount: 0,
      sharesCount: 1,
      savesCount: 1,
      isLiked: true,
      category: "bakery",
      taggedProducts: recBestItem
        ? [
            {
              id: `prod_rec_${Date.now()}`,
              name: recBestItem,
              price: 150,
              stock: 15,
              imageUrl:
                "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80",
              unit: "item",
              storeId: "recommended_shop",
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

  // Handle: Share Find
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
              imageUrl:
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
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

  // Handle: Create Group
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
      {/* ── Elevated Floating User Dock (Desktop Only: hidden on mobile) ── */}
      <div className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-40 items-center justify-center pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1 sm:gap-2 rounded-full bg-white/95 px-3 sm:px-5 py-2 sm:py-2.5 shadow-[0_10px_35px_rgba(112,11,110,0.22)] backdrop-blur-md border border-[#E2E8F0] transition-all hover:shadow-[0_12px_40px_rgba(112,11,110,0.28)]">
          {/* 1. Ask Neighbors */}
          <button
            type="button"
            onClick={() => setActiveModal("ask")}
            className="flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-bold text-[#0F172A] hover:bg-[#FAF3FF] hover:text-[#8B2FC9] transition-all cursor-pointer group"
            title="Ask neighbors for advice or store availability"
          >
            <HelpCircle className="h-4 w-4 text-[#8B2FC9] transition-transform group-hover:scale-110" />
            <span className="hidden sm:inline">Ask Neighbors</span>
          </button>

          {/* 2. Recommend Shop */}
          <button
            type="button"
            onClick={() => setActiveModal("recommend")}
            className="flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-bold text-[#0F172A] hover:bg-[#FAF3FF] hover:text-[#8B2FC9] transition-all cursor-pointer group"
            title="Recommend a local store you love"
          >
            <Star className="h-4 w-4 text-[#8B2FC9] transition-transform group-hover:scale-110" />
            <span className="hidden sm:inline">Recommend Shop</span>
          </button>

          {/* 3. Central Elevated '+' Action Button */}
          <div className="relative -my-3 px-1 sm:px-1.5">
            <button
              type="button"
              onClick={() => setActiveModal("menu")}
              aria-label="Create new neighborhood post or action"
              className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#8B2FC9] to-[#581C87] text-white shadow-[0_6px_20px_rgba(168,56,189,0.45)] hover:shadow-[0_8px_25px_rgba(168,56,189,0.6)] active:scale-95 transition-all cursor-pointer ring-4 ring-white"
            >
              <Plus className="h-6 w-6 stroke-[2.5]" />
            </button>
          </div>

          {/* 4. Share Find */}
          <button
            type="button"
            onClick={() => setActiveModal("find")}
            className="flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-bold text-[#0F172A] hover:bg-[#FAF3FF] hover:text-[#8B2FC9] transition-all cursor-pointer group"
            title="Share a purchase or hidden gem with neighbors"
          >
            <Camera className="h-4 w-4 text-[#8B2FC9] transition-transform group-hover:scale-110" />
            <span className="hidden sm:inline">Share Find</span>
          </button>

          {/* 5. Create Group */}
          <button
            type="button"
            onClick={() => setActiveModal("group")}
            className="flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-bold text-[#0F172A] hover:bg-[#FAF3FF] hover:text-[#8B2FC9] transition-all cursor-pointer group"
            title="Start or join a local community group"
          >
            <Users className="h-4 w-4 text-[#8B2FC9] transition-transform group-hover:scale-110" />
            <span className="hidden sm:inline">Create Group</span>
          </button>
        </div>
      </div>

      {/* ── Quick Action Sheet Modal (User & Shopper Menu) ── */}
      <Dialog open={activeModal === "menu"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-xs sm:max-w-sm p-5 rounded-3xl">
          <DialogTitle className="text-base font-bold text-[#0F172A] text-center">
            Share with Your Neighborhood
          </DialogTitle>
          <p className="text-xs text-[#64748B] text-center -mt-2">
            Posting in <span className="font-semibold text-[#8B2FC9]">{activeAreaLabel}</span>
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {/* Ask Neighbors */}
            <button
              onClick={() => setActiveModal("ask")}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition cursor-pointer text-center group"
            >
              <div className="h-10 w-10 rounded-full bg-[#8B2FC9]/10 flex items-center justify-center text-[#8B2FC9] mb-1.5 group-hover:scale-110 transition-transform">
                <HelpCircle className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-[#0F172A]">Ask Neighbors</span>
              <span className="text-[10px] text-[#64748B]">Questions & tips</span>
            </button>

            {/* Recommend Shop */}
            <button
              onClick={() => setActiveModal("recommend")}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition cursor-pointer text-center group"
            >
              <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <Star className="h-5 w-5 fill-amber-400" />
              </div>
              <span className="text-xs font-bold text-[#0F172A]">Recommend Shop</span>
              <span className="text-[10px] text-[#64748B]">Share local spots</span>
            </button>

            {/* Share Find */}
            <button
              onClick={() => setActiveModal("find")}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition cursor-pointer text-center group"
            >
              <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <Camera className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-[#0F172A]">Share Find</span>
              <span className="text-[10px] text-[#64748B]">Purchases & gems</span>
            </button>

            {/* Create Group */}
            <button
              onClick={() => setActiveModal("group")}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition cursor-pointer text-center group"
            >
              <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-[#0F172A]">Create Group</span>
              <span className="text-[10px] text-[#64748B]">Local community</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── 1. Ask Neighbors Modal ── */}
      <Dialog open={activeModal === "ask"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-lg p-6 rounded-3xl">
          <DialogTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-[#8B2FC9]" />
            Ask Neighbors in {activeAreaLabel.split(",")[0]}
          </DialogTitle>
          <p className="text-xs text-[#64748B] -mt-2">
            Ask where to find specific groceries, medicines, authentic items, or get local advice.
          </p>

          <form onSubmit={handleAskNeighbors} className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-bold text-[#504660] block mb-1">Your Question *</label>
              <input
                type="text"
                value={askQuestion}
                onChange={(e) => setAskQuestion(e.target.value)}
                placeholder="e.g. Where can I find fresh woodfired sourdough bread today?"
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm outline-none focus:border-[#8B2FC9]"
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
                placeholder="Add any details like preferred timing, delivery requirement, or specific brand..."
                rows={3}
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm outline-none focus:border-[#8B2FC9]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#504660] block mb-1">Category</label>
              <select
                value={askCategory}
                onChange={(e) => setAskCategory(e.target.value)}
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#8B2FC9]"
              >
                <option value="Groceries & Food">Groceries & Food</option>
                <option value="Bakery & Sweets">Bakery & Sweets</option>
                <option value="Medicines & Care">Medicines & Care</option>
                <option value="Handlooms & Clothes">Handlooms & Clothes</option>
                <option value="Local Services">Local Services</option>
                <option value="General Questions">General Questions</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-full px-5 py-2 text-xs font-bold text-[#64748B] hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-[#8B2FC9] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#581C87] cursor-pointer"
              >
                Post to Feed
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 2. Recommend Shop Modal ── */}
      <Dialog
        open={activeModal === "recommend"}
        onOpenChange={(open) => !open && setActiveModal(null)}
      >
        <DialogContent className="max-w-lg p-6 rounded-3xl">
          <DialogTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500 fill-amber-400" />
            Recommend a Local Shop
          </DialogTitle>
          <p className="text-xs text-[#64748B] -mt-2">
            Help neighbors discover hidden gems and support local business owners in {activeAreaLabel.split(",")[0]}.
          </p>

          <form onSubmit={handleRecommendShop} className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-bold text-[#504660] block mb-1">Shop Name *</label>
              <input
                type="text"
                value={recShopName}
                onChange={(e) => setRecShopName(e.target.value)}
                placeholder="e.g. Ravi's Artisan Bakery, Sri Krishna Sweets, etc."
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm outline-none focus:border-[#8B2FC9]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#504660] block mb-1">
                Your Rating
              </label>
              <div className="flex items-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRecRating(star)}
                    className="p-1 cursor-pointer transition-transform hover:scale-125"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= recRating
                          ? "text-amber-400 fill-amber-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-extrabold text-[#581C87] ml-2">
                  {recRating}.0 Stars
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#504660] block mb-1">
                Why do you recommend this shop? *
              </label>
              <textarea
                value={recReview}
                onChange={(e) => setRecReview(e.target.value)}
                placeholder="What makes their products or service stand out? Mention fresh items, friendly staff, or authentic taste..."
                rows={3}
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm outline-none focus:border-[#8B2FC9]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#504660] block mb-1">
                Must-Try Product (Optional)
              </label>
              <input
                type="text"
                value={recBestItem}
                onChange={(e) => setRecBestItem(e.target.value)}
                placeholder="e.g. Slow-fermented Sourdough, Mysore Pak, etc."
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm outline-none focus:border-[#8B2FC9]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-full px-5 py-2 text-xs font-bold text-[#64748B] hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-[#8B2FC9] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#581C87] cursor-pointer"
              >
                Share Recommendation
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 3. Share Find Modal ── */}
      <Dialog open={activeModal === "find"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-lg p-6 rounded-3xl">
          <DialogTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
            <Camera className="h-5 w-5 text-emerald-600" />
            Share a Local Purchase or Find
          </DialogTitle>
          <p className="text-xs text-[#64748B] -mt-2">
            Showcase what you bought from neighborhood shops and inspire fellow shoppers.
          </p>

          <form onSubmit={handleShareFind} className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-bold text-[#504660] block mb-1">What did you find? *</label>
              <input
                type="text"
                value={findTitle}
                onChange={(e) => setFindTitle(e.target.value)}
                placeholder="e.g. Pure Combed Cotton Shirts in JP Nagar"
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm outline-none focus:border-[#8B2FC9]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#504660] block mb-1">Store Name</label>
                <input
                  type="text"
                  value={findStore}
                  onChange={(e) => setFindStore(e.target.value)}
                  placeholder="e.g. JP Nagar Handlooms"
                  className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm outline-none focus:border-[#8B2FC9]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#504660] block mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={findPrice}
                  onChange={(e) => setFindPrice(e.target.value)}
                  placeholder="e.g. 380"
                  className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm outline-none focus:border-[#8B2FC9]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#504660] block mb-1">Notes / Review</label>
              <textarea
                value={findNotes}
                onChange={(e) => setFindNotes(e.target.value)}
                placeholder="How was the quality, fit, or freshness?"
                rows={2}
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm outline-none focus:border-[#8B2FC9]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-full px-5 py-2 text-xs font-bold text-[#64748B] hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-[#8B2FC9] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#581C87] cursor-pointer"
              >
                Share Find
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 4. Create Group Modal ── */}
      <Dialog open={activeModal === "group"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-md p-6 rounded-3xl">
          <DialogTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Start a Neighborhood Group
          </DialogTitle>
          <p className="text-xs text-[#64748B] -mt-2">
            Connect with local residents around shared interests, food, deals, or activities.
          </p>

          <form onSubmit={handleCreateGroup} className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-bold text-[#504660] block mb-1">Group Name *</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. JP Nagar Foodies & Bakery Lovers"
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm outline-none focus:border-[#8B2FC9]"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#504660] block mb-1">
                Neighborhood Area
              </label>
              <input
                type="text"
                value={groupArea}
                onChange={(e) => setGroupArea(e.target.value)}
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm outline-none focus:border-[#8B2FC9]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#504660] block mb-1">Description</label>
              <textarea
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                placeholder="What is this group about? Share activities, meetups, or favorite spots..."
                rows={3}
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm outline-none focus:border-[#8B2FC9]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-full px-5 py-2 text-xs font-bold text-[#64748B] hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-[#8B2FC9] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#581C87] cursor-pointer"
              >
                Create Group
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
