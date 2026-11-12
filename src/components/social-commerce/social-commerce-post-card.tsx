import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  MapPin,
  Plus,
  Check,
  Store,
  Send,
  Smile,
  Image as ImageIcon,
  UserPlus,
  UserCheck,
  UserMinus,
  Share,
  Link2,
  EyeOff,
  Flag,
  X,
} from "lucide-react";
import { cartStore } from "@/modules/shopper/services/cart-store";
import { useIsFollowing, followingStore } from "@/lib/following-store";
import type { SocialPost, TaggedProduct, SocialComment } from "@/lib/social-feed-data";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface SocialCommercePostCardProps {
  post: SocialPost;
}

export function SocialCommercePostCard({ post }: SocialCommercePostCardProps) {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 342);
  const isFollowing = useIsFollowing(post.shopId);
  const [isSaved, setIsSaved] = useState(post.isSaved ?? false);
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentsList, setCommentsList] = useState<SocialComment[]>(
    post.comments && post.comments.length > 0
      ? post.comments
      : [
          {
            id: "c_karthik",
            userName: "Karthik R",
            userAvatar:
              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
            text: "The crust and texture look perfect! Just placed my order. 🥖",
            timestamp: "1h ago",
            likes: 4,
          },
          {
            id: "c_meena",
            userName: "Meena S",
            userAvatar:
              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
            text: "Finally! Authentic sourdough in RS Puram 😍",
            timestamp: "58m ago",
            likes: 6,
          },
        ]
  );
  const [addedProductIds, setAddedProductIds] = useState<Record<string, boolean>>({});

  const handleToggleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikesCount((prev) => Math.max(0, prev - 1));
    } else {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
    }
  };

  const handleToggleFollow = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const isNowFollowing = followingStore.toggle(post.shopId);
    if (isNowFollowing) {
      toast.success(`Following ${post.shopName}! 🎉`);
    } else {
      toast.info(`Unfollowed ${post.shopName}`);
    }
  };

  const handleToggleSave = () => {
    setIsSaved((prev) => {
      const next = !prev;
      toast.success(next ? "Saved to your bookmarks" : "Removed from bookmarks");
      return next;
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Post link copied to clipboard!");
    } catch {
      toast.success("Post link ready to share!");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.description,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : (post.images.length || 1) - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev < (post.images.length || 1) - 1 ? prev + 1 : 0));
  };

  const handleAddToCart = (product: TaggedProduct, e?: React.MouseEvent) => {
    e?.stopPropagation();
    cartStore.add(product.storeId, product.storeName, {
      id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      stock: product.stock,
      imageUrl: product.imageUrl,
    });

    setAddedProductIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedProductIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);

    toast.success(
      <div className="flex items-center justify-between w-full gap-2">
        <span>
          Added <strong>{product.name}</strong> to cart!
        </span>
        <button
          onClick={() => navigate({ to: "/cart" })}
          className="rounded-full bg-[#8B2FC9] px-2.5 py-1 text-xs font-bold text-white shrink-0 cursor-pointer"
        >
          View Cart
        </button>
      </div>
    );
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const commentItem: SocialComment = {
      id: `comm_${Date.now()}`,
      userName: "You",
      userAvatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
      text: newComment.trim(),
      timestamp: "Just now",
      likes: 0,
    };
    setCommentsList([...commentsList, commentItem]);
    setNewComment("");
    toast.success("Comment posted!");
  };

  const imagesList = post.images && post.images.length > 0 ? post.images : [post.shopAvatar];

  return (
    <article className="overflow-hidden rounded-3xl bg-white border border-[#E2E8F0] p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between h-full space-y-3.5">
      {/* ── 1. POST HEADER (Shop Info, Open Now badge, Follow button, Dropdown) ── */}
      <div className="flex items-center justify-between gap-2 min-w-0 pb-1 border-b border-[#F8FAFC]">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Link
            to="/store/$storeId"
            params={{ storeId: post.shopId }}
            className="relative h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-full p-[2px] bg-gradient-to-tr from-[#8B2FC9] via-[#F59E0B] to-[#D270D7] hover:scale-105 transition-transform"
          >
            <img
              src={post.shopAvatar}
              alt={post.shopName}
              className="h-full w-full rounded-full object-cover bg-white"
              onError={(e) => {
                e.currentTarget.src = "/assets/ravis-bakery-logo.png";
              }}
            />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <Link
                to="/store/$storeId"
                params={{ storeId: post.shopId }}
                title={post.shopName}
                className="text-xs sm:text-sm font-bold text-[#0F172A] hover:text-[#8B2FC9] transition truncate"
              >
                {post.shopName}
              </Link>
              {post.verified && (
                <span
                  title="Verified Local Merchant"
                  className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#8B2FC9] text-[8px] text-white font-bold"
                >
                  ✓
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#746A85] mt-0.5 min-w-0">
              <span className="flex items-center gap-1 min-w-0 truncate">
                <MapPin className="h-3 w-3 text-[#8B2FC9] shrink-0" />
                <span className="truncate">{post.locationName} • {post.distanceKm} km</span>
              </span>
              <span className="text-slate-300 shrink-0">•</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                Open Now
              </span>
            </div>
          </div>
        </div>

        {/* Right Header: Follow Button & More Dropdown */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleToggleFollow}
            aria-label={isFollowing ? `Unfollow ${post.shopName}` : `Follow ${post.shopName}`}
            className={`rounded-full px-3 py-1 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 shrink-0 ${
              isFollowing
                ? "bg-[#F8FAFC] border border-[#8B2FC9] text-[#581C87] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300"
                : "bg-white border border-[#8B2FC9] text-[#8B2FC9] hover:bg-[#F8FAFC]"
            }`}
          >
            {isFollowing ? (
              <>
                <UserCheck className="h-3 w-3 text-[#8B2FC9]" />
                <span>Following</span>
              </>
            ) : (
              <>
                <UserPlus className="h-3 w-3 text-[#8B2FC9]" />
                <span>Follow</span>
              </>
            )}
          </button>

          {/* Three Dots More Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="More options"
                className="rounded-full p-1 text-gray-400 hover:bg-purple-50 hover:text-gray-600 transition cursor-pointer"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-2xl p-1.5 shadow-xl border border-purple-100 bg-white text-xs z-[80]"
            >
              <DropdownMenuItem
                onClick={handleToggleFollow}
                className="flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer font-medium text-slate-700 hover:bg-purple-50 focus:bg-purple-50"
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="h-4 w-4 text-rose-500" />
                    <span className="text-rose-600 font-bold">Unfollow {post.shopName}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 text-[#8B2FC9]" />
                    <span className="text-[#8B2FC9] font-bold">Follow {post.shopName}</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleShare}
                className="flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer font-medium text-slate-700 hover:bg-purple-50 focus:bg-purple-50"
              >
                <Share className="h-4 w-4 text-slate-500" />
                <span>Share Post</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleCopyLink}
                className="flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer font-medium text-slate-700 hover:bg-purple-50 focus:bg-purple-50"
              >
                <Link2 className="h-4 w-4 text-slate-500" />
                <span>Copy Link</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toast.info("We'll show fewer posts like this.")}
                className="flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer font-medium text-slate-700 hover:bg-purple-50 focus:bg-purple-50"
              >
                <EyeOff className="h-4 w-4 text-slate-500" />
                <span>Not Interested</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toast.success("Thank you. Post reported for review.")}
                className="flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer font-medium text-rose-600 bg-rose-50/50 hover:bg-rose-50 focus:bg-rose-50"
              >
                <Flag className="h-4 w-4 text-rose-500" />
                <span>Report</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── 2. POST CONTENT (Left: Image Carousel, Right: Caption & Hashtags) ── */}
      <div className="flex gap-3 items-start w-full">
        {/* Left Column: Carousel Image (Strictly 48% Width) */}
        <div className="w-[48%] shrink-0 relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-900 group select-none shadow-xs border border-purple-100/60">
          <img
            src={imagesList[currentImageIndex] || imagesList[0]}
            alt={post.title}
            className="h-full w-full object-cover transition-opacity duration-200"
            loading="lazy"
          />

          {/* Top-Left Category Badge */}
          <div className="absolute top-2 left-2 rounded-full bg-[#F59E0B] px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-[#0F172A] shadow-xs">
            <span>{post.badgeTag || "Featured"}</span>
          </div>

          {/* Top-Right Image Counter: 1/3 */}
          <div className="absolute top-2 right-2 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-mono font-bold text-white backdrop-blur-xs">
            {currentImageIndex + 1}/{imagesList.length}
          </div>

          {/* Carousel Left & Right Arrows */}
          {imagesList.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                aria-label="Previous photo"
                className="absolute left-1.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[#0F172A] hover:bg-white shadow-md transition opacity-90 hover:opacity-100 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                aria-label="Next photo"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[#0F172A] hover:bg-white shadow-md transition opacity-90 hover:opacity-100 cursor-pointer"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          {/* Bottom Pagination Dots */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-xs">
            {imagesList.map((_, i) => (
              <span
                key={i}
                className={`h-1 transition-all rounded-full ${
                  i === currentImageIndex ? "w-3 bg-white" : "w-1 bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Title, Description & Hashtags (Remaining 52%) */}
        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5 space-y-1.5">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#0F172A] leading-snug line-clamp-2" title={post.title}>
              {post.title}
            </h3>
            <p className="mt-1 text-[11px] sm:text-xs text-[#64748B] leading-relaxed line-clamp-2 sm:line-clamp-3">
              {post.description}
            </p>
          </div>

          {/* Hashtags */}
          <div className="flex flex-wrap gap-1 pt-1 overflow-hidden">
            {(post.hashtags && post.hashtags.length > 0
              ? post.hashtags
              : ["#LocalShore", "#Neighborhood"]
            ).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#FEF9C3] px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-[#854D0E] border border-amber-200/60 shrink-0"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3. TAGGED PRODUCTS ROW (3 Products across full width below image + caption) ── */}
      {post.taggedProducts && post.taggedProducts.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-2.5 border-t border-[#F8FAFC]">
          {post.taggedProducts.slice(0, 3).map((prod) => {
            const isAdded = addedProductIds[prod.id];
            return (
              <div
                key={prod.id}
                className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/60 hover:bg-white p-1 sm:p-1.5 transition shadow-2xs hover:border-[#8B2FC9]/40 group/prod min-w-0 h-[46px] sm:h-[50px]"
              >
                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                  <img
                    src={prod.imageUrl}
                    alt={prod.name}
                    className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-lg object-cover border border-[#E2E8F0] bg-white"
                  />
                  <div className="min-w-0">
                    <h4 className="text-[10px] sm:text-[11px] font-bold text-[#0F172A] truncate" title={prod.name}>
                      {prod.name}
                    </h4>
                    <p className="text-[9px] sm:text-[10px] font-extrabold text-[#0F172A] mt-0.5 truncate">
                      ₹{prod.price}
                      {prod.unit ? <span className="text-[9px] font-medium text-[#64748B] ml-0.5">({prod.unit})</span> : ""}
                    </p>
                  </div>
                </div>

                {/* Purple '+' Button */}
                <button
                  type="button"
                  onClick={(e) => handleAddToCart(prod, e)}
                  title={`Add ${prod.name} to cart`}
                  className={`flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full font-bold text-white transition-all cursor-pointer shadow-xs ${
                    isAdded
                      ? "bg-emerald-600 scale-95"
                      : "bg-[#8B2FC9] hover:bg-[#581C87] active:scale-90"
                  }`}
                >
                  {isAdded ? <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> : <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 4. SOCIAL ENGAGEMENT COUNTS & SHOP ACTION BUTTONS ── */}
      <div className="pt-2 flex items-center justify-between border-t border-[#F8FAFC]">
        {/* Left: Engagement Counts (Likes, Comments, Shares, Save) */}
        <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs font-bold text-[#504660]">
          <button
            type="button"
            onClick={handleToggleLike}
            className={`flex items-center gap-1 transition cursor-pointer ${
              isLiked ? "text-rose-600" : "hover:text-[#8B2FC9]"
            }`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-current text-rose-600" : ""}`} />
            <span>{likesCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCommentsDialogOpen(true)}
            className="flex items-center gap-1 hover:text-[#8B2FC9] transition cursor-pointer"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{commentsList.length}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1 hover:text-[#8B2FC9] transition cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
            <span>{post.sharesCount || 12}</span>
          </button>

          <span className="text-slate-300">|</span>

          <button
            type="button"
            onClick={handleToggleSave}
            className={`flex items-center gap-1 transition cursor-pointer ${
              isSaved ? "text-[#8B2FC9]" : "hover:text-[#8B2FC9]"
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
            <span>Save</span>
          </button>
        </div>

        {/* Right: View Shop button */}
        <div className="flex items-center shrink-0">
          <Link
            to="/store/$storeId"
            params={{ storeId: post.shopId }}
            className="inline-flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] hover:border-[#8B2FC9] px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold text-[#8B2FC9] transition active:scale-95"
          >
            <Store className="h-3.5 w-3.5 text-[#8B2FC9]" />
            <span>View Shop</span>
          </Link>
        </div>
      </div>

      {/* ── 5. DEDICATED COMMENTS DIALOG (Keeps Card Heights 100% Balanced & Equal) ── */}
      <Dialog open={isCommentsDialogOpen} onOpenChange={setIsCommentsDialogOpen}>
        <DialogContent hideCloseButton className="max-w-md p-0 overflow-hidden border-none rounded-3xl bg-white shadow-2xl z-[130]">
          <DialogTitle className="sr-only">Comments on {post.title}</DialogTitle>
          <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#8B2FC9]" />
              <h3 className="text-sm font-bold text-[#0F172A]">
                Comments ({commentsList.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsCommentsDialogOpen(false)}
              className="rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 max-h-[360px] overflow-y-auto space-y-3">
            {commentsList.map((comm) => (
              <div key={comm.id} className="flex items-start gap-2.5 text-xs">
                <img
                  src={
                    comm.userAvatar ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                  }
                  alt=""
                  className="h-7 w-7 rounded-full object-cover shrink-0 mt-0.5 ring-1 ring-purple-100"
                />
                <div className="flex-1 bg-[#F8FAFC] rounded-2xl p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0F172A]">{comm.userName}</span>
                    <span className="text-[10px] text-[#8E82A3]">{comm.timestamp}</span>
                  </div>
                  <p className="text-[#504660] mt-1 leading-snug">{comm.text}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddComment} className="p-3 border-t border-[#E2E8F0] bg-white flex items-center gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 rounded-full border border-purple-100 bg-[#F8FAFC] px-3.5 py-2 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#8B2FC9]"
            />
            <button
              type="button"
              onClick={() => setNewComment((prev) => prev + " 🥐")}
              className="text-slate-400 hover:text-slate-600"
            >
              <Smile className="h-4 w-4" />
            </button>
            <button
              type="submit"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8B2FC9] text-white hover:bg-[#581C87] transition cursor-pointer shrink-0"
            >
              <Send className="h-3 w-3" />
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </article>
  );
}
