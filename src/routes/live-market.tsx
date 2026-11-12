import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Radio,
  Users,
  ShoppingBag,
  Heart,
  MessageCircle,
  Play,
  X,
  Plus,
  Send,
  Sparkles,
  Share2,
  Check,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { SocialCommerceShell } from "@/components/social-commerce/social-commerce-shell";
import { TrendingWidget } from "@/components/social-commerce/trending-widget";
import { YourDeliveryWidget } from "@/components/social-commerce/your-delivery-widget";
import { cartStore, useCart } from "@/modules/shopper/services/cart-store";

export const Route = createFileRoute("/live-market")({
  component: LiveMarketPage,
});

interface LiveStream {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  title: string;
  thumbnailUrl: string;
  streamVideoUrl?: string;
  viewerCount: number;
  category: string;
  tags: string[];
  featuredProduct: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    unit: string;
    imageUrl: string;
    stock: number;
  };
}

const LIVE_STREAMS: LiveStream[] = [
  {
    id: "live_kumar",
    sellerId: "s_groc2",
    sellerName: "Kumar Stores",
    sellerAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    title: "Fresh Mangoes Just Arrived! 🥭",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=900&q=80",
    streamVideoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    viewerCount: 312,
    category: "Fresh Produce",
    tags: ["#SalemMangoes", "#FarmFresh", "#ExclusiveDiscount"],
    featuredProduct: {
      id: "prod_mango_live",
      name: "Salem Alphonso Mango",
      price: 220,
      originalPrice: 280,
      unit: "1 kg",
      imageUrl:
        "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80",
      stock: 35,
    },
  },
  {
    id: "live_stylehub",
    sellerId: "s_boutique1",
    sellerName: "StyleHub",
    sellerAvatar:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
    title: "Festive Collection — Up to 40% Off! ✨",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=900&q=80",
    streamVideoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    viewerCount: 185,
    category: "Fashion",
    tags: ["#FestiveWear", "#CottonLovers", "#NewArrivals"],
    featuredProduct: {
      id: "prod_tshirt_live",
      name: "T-Shirt (Cotton Unisex)",
      price: 399,
      originalPrice: 599,
      unit: "piece",
      imageUrl:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
      stock: 14,
    },
  },
  {
    id: "live_ravi",
    sellerId: "s_paap1",
    sellerName: "Ravi's Artisan Bakery",
    sellerAvatar: "/assets/ravis-bakery-logo.png",
    title: "Live Sourdough Oven Pull & Fresh Pastries 🥖",
    thumbnailUrl: "/assets/ravis-sourdough-hero.jpg",
    streamVideoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
    viewerCount: 96,
    category: "Food & Beverages",
    tags: ["#FreshBread", "#BakersLive", "#Croissants"],
    featuredProduct: {
      id: "prod_sourdough_live",
      name: "Sourdough Loaf (Slow-fermented)",
      price: 180,
      originalPrice: 200,
      unit: "loaf",
      imageUrl: "/assets/ravis-sourdough-hero.jpg",
      stock: 8,
    },
  },
];

const FEATURED_LIVE_PRODUCTS = [
  {
    id: "prod_mango_live",
    name: "Alphonso Mango",
    sellerName: "Kumar Stores",
    price: 220,
    unit: "/ kg",
    imageUrl:
      "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80",
    inStock: true,
  },
  {
    id: "prod_tshirt_live",
    name: "T-Shirt (Cotton)",
    sellerName: "StyleHub",
    price: 399,
    unit: "",
    imageUrl:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
    inStock: true,
  },
  {
    id: "prod_croissant_live",
    name: "Croissant",
    sellerName: "Ravi's Bakery",
    price: 70,
    unit: "",
    imageUrl:
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80",
    inStock: true,
  },
  {
    id: "prod_sourdough_live",
    name: "Artisan Sourdough",
    sellerName: "Ravi's Bakery",
    price: 180,
    unit: "/ loaf",
    imageUrl: "/assets/ravis-sourdough-hero.jpg",
    inStock: true,
  },
  {
    id: "prod_honey_live",
    name: "Organic Raw Honey",
    sellerName: "Kumar Stores",
    price: 350,
    unit: "/ 500g",
    imageUrl:
      "https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&w=400&q=80",
    inStock: true,
  },
];

const CATEGORY_FILTERS = [
  "All Live",
  "Food & Beverages",
  "Fashion",
  "Fresh Produce",
  "Bakery",
];

function LiveMarketPage() {
  const [activeFilter, setActiveFilter] = useState("All Live");
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [isGoLiveOpen, setIsGoLiveOpen] = useState(false);
  const [liveChatMessages, setLiveChatMessages] = useState<
    Array<{ sender: string; text: string; time: string }>
  >([
    { sender: "Priya R.", text: "Are these Salem mangoes naturally ripened?", time: "Just now" },
    { sender: "Arun K.", text: "Can you deliver to Gandhipuram in 30 mins?", time: "1m ago" },
    { sender: "Sanjay", text: "Ordered 2 kgs right now, thank you!", time: "2m ago" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [heartsCount, setHeartsCount] = useState(142);
  const cart = useCart();
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Set<string>>(new Set());

  const filteredStreams = LIVE_STREAMS.filter((stream) => {
    if (activeFilter === "All Live") return true;
    return stream.category.toLowerCase().includes(activeFilter.toLowerCase());
  });

  const handleAddToCart = (product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    sellerName: string;
    unit?: string;
  }) => {
    cartStore.add("store_live", product.sellerName, {
      id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit || "item",
      stock: 15,
      imageUrl: product.imageUrl,
    });
    setRecentlyAddedIds((prev) => new Set(prev).add(product.id));
    toast.success(`Added ${product.name} to cart!`, {
      description: `₹${product.price} from ${product.sellerName}`,
    });
  };

  const handleSendLiveChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setLiveChatMessages((prev) => [
      ...prev,
      { sender: "You", text: chatInput.trim(), time: "Just now" },
    ]);
    setChatInput("");
    setHeartsCount((h) => h + 1);
  };

  return (
    <SocialCommerceShell
      rightSidebar={
        <div className="space-y-4">
          <TrendingWidget />
          <YourDeliveryWidget />
        </div>
      }
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-purple-900/10 via-purple-600/5 to-transparent p-5 sm:p-6 rounded-3xl border border-purple-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-600 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              Live Shopping
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Live Market
            </h1>
            <p className="text-sm text-[#746A85] mt-1">
              Watch, interact and shop live from local neighborhood businesses.
            </p>
          </div>

          <button
            onClick={() => setIsGoLiveOpen(true)}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#8B2FC9] to-[#581C87] text-white text-sm font-semibold shadow-md shadow-purple-500/20 hover:opacity-95 transition active:scale-95"
          >
            <Video className="w-4 h-4" />
            Go Live as Seller
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORY_FILTERS.map((cat) => {
            const isActive = activeFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#8B2FC9] text-white shadow-sm shadow-purple-400/40"
                    : "bg-white text-[#746A85] hover:text-[#0F172A] border border-purple-100 hover:border-purple-200"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Hero Live Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {filteredStreams.map((stream) => (
            <div
              key={stream.id}
              className="group relative overflow-hidden rounded-3xl bg-white border border-purple-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              {/* Thumbnail / Video Preview Box */}
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                <img
                  src={stream.thumbnailUrl}
                  alt={stream.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

                {/* Live Badge & Viewer Counter */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black tracking-wide uppercase shadow-lg shadow-red-600/40">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    LIVE
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium">
                    <Users className="w-3.5 h-3.5 text-purple-300" />
                    {stream.viewerCount} watching
                  </span>
                </div>

                {/* Seller Mini Profile */}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={stream.sellerAvatar}
                      alt={stream.sellerName}
                      className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-md"
                    />
                    <div>
                      <p className="text-sm font-bold text-white leading-tight drop-shadow-sm">
                        {stream.sellerName}
                      </p>
                      <p className="text-xs text-purple-200 mt-0.5">
                        {stream.category}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedStream(stream)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-yellow-400 text-[#0F172A] text-xs font-bold shadow-md transition active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Watch
                  </button>
                </div>
              </div>

              {/* Card Footer: Title & Join Live Button */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A] line-clamp-1">
                    {stream.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {stream.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pinned Showcase Product */}
                <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={stream.featuredProduct.imageUrl}
                      alt={stream.featuredProduct.name}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-purple-200"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#0F172A] truncate">
                        {stream.featuredProduct.name}
                      </p>
                      <p className="text-xs font-black text-[#8B2FC9] mt-0.5">
                        ₹{stream.featuredProduct.price}{" "}
                        <span className="text-[10px] text-gray-500 font-normal">
                          / {stream.featuredProduct.unit}
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleAddToCart({
                        id: stream.featuredProduct.id,
                        name: stream.featuredProduct.name,
                        price: stream.featuredProduct.price,
                        imageUrl: stream.featuredProduct.imageUrl,
                        sellerName: stream.sellerName,
                      })
                    }
                    className="shrink-0 p-2 sm:px-3 sm:py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>

                <button
                  onClick={() => setSelectedStream(stream)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#8B2FC9] to-[#581C87] hover:opacity-95 text-white font-bold text-sm shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 transition active:scale-[0.99]"
                >
                  Join Live & Shop
                  <span className="text-base">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Live Now — Featured Products Rail */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-purple-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-[#0F172A]">
                Live Now — Featured Products
              </h2>
            </div>
            <Link
              to="/explore"
              className="text-xs font-bold text-[#8B2FC9] hover:text-[#581C87] flex items-center gap-1"
            >
              View All
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            {FEATURED_LIVE_PRODUCTS.map((prod) => (
              <div
                key={prod.id}
                className="group p-3 rounded-2xl border border-purple-50 hover:border-purple-200 bg-[#F8FAFC]/60 hover:bg-white transition-all flex flex-col justify-between"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2 relative">
                  <img
                    src={prod.imageUrl}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#0F172A] truncate">
                    {prod.name}
                  </h4>
                  <p className="text-[11px] text-[#746A85] truncate">
                    {prod.sellerName}
                  </p>
                  <p className="text-xs font-black text-[#8B2FC9] mt-1">
                    ₹{prod.price}{" "}
                    <span className="text-[10px] text-gray-500 font-normal">
                      {prod.unit}
                    </span>
                  </p>
                </div>

                {(() => {
                  const isAdded =
                    recentlyAddedIds.has(prod.id) ||
                    cart.lines.some((l) => l.productId === prod.id);
                  return (
                    <button
                      onClick={() =>
                        handleAddToCart({
                          id: prod.id,
                          name: prod.name,
                          price: prod.price,
                          imageUrl: prod.imageUrl,
                          sellerName: prod.sellerName,
                        })
                      }
                      className={`mt-3 w-full py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        isAdded
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-purple-100 hover:bg-[#8B2FC9] text-purple-800 hover:text-white"
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          Added to Cart
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          Add to Cart
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Live Stream Modal Player */}
      {selectedStream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl h-[90vh] sm:h-[82vh] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-purple-500/20">
            {/* Close Button */}
            <button
              onClick={() => setSelectedStream(null)}
              className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Video Left Area */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
              <video
                src={selectedStream.streamVideoUrl}
                poster={selectedStream.thumbnailUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

              {/* Streamer Header Bar */}
              <div className="absolute top-4 left-4 right-16 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={selectedStream.sellerAvatar}
                    alt={selectedStream.sellerName}
                    className="w-10 h-10 rounded-full border-2 border-purple-500 object-cover"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white drop-shadow-md">
                      {selectedStream.sellerName}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-purple-200">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      LIVE • {selectedStream.viewerCount} viewers
                    </div>
                  </div>
                </div>
              </div>

              {/* Pinned Showcase Product Drawer at bottom */}
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedStream.featuredProduct.imageUrl}
                    alt={selectedStream.featuredProduct.name}
                    className="w-12 h-12 rounded-xl object-cover border border-purple-400"
                  />
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-yellow-400">
                      Featured Live Deal
                    </span>
                    <p className="text-xs font-bold text-white">
                      {selectedStream.featuredProduct.name}
                    </p>
                    <p className="text-xs font-black text-purple-300">
                      ₹{selectedStream.featuredProduct.price}{" "}
                      {selectedStream.featuredProduct.originalPrice && (
                        <span className="text-[10px] text-gray-400 line-through">
                          ₹{selectedStream.featuredProduct.originalPrice}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleAddToCart({
                      id: selectedStream.featuredProduct.id,
                      name: selectedStream.featuredProduct.name,
                      price: selectedStream.featuredProduct.price,
                      imageUrl: selectedStream.featuredProduct.imageUrl,
                      sellerName: selectedStream.sellerName,
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:opacity-90 text-[#0F172A] text-xs font-black tracking-wide shadow-md transition active:scale-95 flex items-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Buy Now
                </button>
              </div>
            </div>

            {/* Chat & Interaction Right Area */}
            <div className="w-full md:w-80 bg-slate-900 text-white flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10 h-72 md:h-full">
              {/* Chat Header */}
              <div className="p-3 border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider uppercase text-purple-300 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                  Live Chat
                </span>
                <button
                  onClick={() => {
                    setHeartsCount((h) => h + 1);
                    toast("❤️ Heart sent to seller!", { duration: 1200 });
                  }}
                  className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20 active:scale-125 transition-transform"
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  {heartsCount}
                </button>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs scrollbar-none">
                {liveChatMessages.map((msg, idx) => (
                  <div key={idx} className="bg-white/5 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-purple-300">
                        {msg.sender}
                      </span>
                      <span className="text-gray-400 text-[10px]">
                        {msg.time}
                      </span>
                    </div>
                    <p className="text-gray-200">{msg.text}</p>
                  </div>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendLiveChat}
                className="p-3 border-t border-white/10 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask the seller live..."
                  className="flex-1 bg-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Go Live Seller Modal Dialog */}
      {isGoLiveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-purple-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0F172A]">
                Go Live on LocalShore
              </h3>
              <button
                onClick={() => setIsGoLiveOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[#746A85]">
              Stream live video to your neighborhood customers, demo your
              latest stock, and take live orders directly into your SellerHub.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-bold text-[#0F172A] block mb-1">
                  Session Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Afternoon Fresh Harvest Unboxing!"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-[#8B2FC9]"
                  defaultValue="Live Neighborhood Showcase"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#0F172A] block mb-1">
                  Category
                </label>
                <select className="w-full px-3 py-2 text-xs rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-[#8B2FC9] bg-white">
                  <option>Fresh Produce</option>
                  <option>Bakery & Sweets</option>
                  <option>Fashion & Apparel</option>
                  <option>Food & Beverages</option>
                </select>
              </div>
            </div>

            <div className="pt-3 flex gap-2">
              <button
                onClick={() => setIsGoLiveOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsGoLiveOpen(false);
                  toast.success("Broadcast stream initiated!", {
                    description: "Your camera and microphone are ready in SellerHub.",
                  });
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#8B2FC9] to-[#581C87] text-white text-xs font-bold shadow-md hover:opacity-95"
              >
                Start Stream
              </button>
            </div>
          </div>
        </div>
      )}
    </SocialCommerceShell>
  );
}
