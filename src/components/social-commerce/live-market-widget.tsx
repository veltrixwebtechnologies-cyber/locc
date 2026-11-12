import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Radio, Users, ChevronRight, ShoppingCart, X, MessageSquare, Heart } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  getLiveMarketForLocation,
  type LiveMarketSession,
  type TaggedProduct,
} from "@/lib/social-feed-data";
import { useDeliveryLocation } from "@/lib/location-store";
import { cartStore } from "@/modules/shopper/services/cart-store";
import { toast } from "sonner";

interface LiveMarketWidgetProps {
  session?: LiveMarketSession;
  isOpenModalExternally?: boolean;
  onCloseExternalModal?: () => void;
}

export function LiveMarketWidget({
  session,
  isOpenModalExternally = false,
  onCloseExternalModal,
}: LiveMarketWidgetProps) {
  const [deliveryLocation] = useDeliveryLocation();
  const activeSession = session || getLiveMarketForLocation(deliveryLocation);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewerCount, setViewerCount] = useState(activeSession.viewerCount);
  const [liveChatMessages, setLiveChatMessages] = useState([
    { id: 1, user: "Suresh P.", text: "Are the mangoes sweet? How is the quality?" },
    {
      id: 2,
      user: "Kumar (Host)",
      text: "Very sweet and completely carbide-free! Direct from Salem orchards.",
    },
    { id: 3, user: "Kavitha M.", text: "Just ordered 2 kg! Looking forward to delivery." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [likes, setLikes] = useState(148);

  const openModal = isModalOpen || isOpenModalExternally;

  const handleClose = () => {
    setIsModalOpen(false);
    onCloseExternalModal?.();
  };

  const handleAddToCart = (product: TaggedProduct) => {
    cartStore.add(product.storeId, product.storeName, {
      id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      stock: product.stock,
      imageUrl: product.imageUrl,
    });
    toast.success(`Added ${product.name} to cart from Live Stream!`);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setLiveChatMessages([
      ...liveChatMessages,
      { id: Date.now(), user: "You", text: chatInput.trim() },
    ]);
    setChatInput("");
  };

  return (
    <>
      <div className="rounded-3xl bg-white p-4 sm:p-5 border border-[#E2E8F0] shadow-xs">
        {/* Header */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-[#8B2FC9]" />
            <h3 className="text-sm sm:text-base font-bold text-[#0F172A]">Live Market</h3>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-rose-500 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            LIVE
          </span>
        </div>

        {/* Live Session Card */}
        <div
          onClick={() => setIsModalOpen(true)}
          className="group relative overflow-hidden rounded-2xl bg-[#F8FAFC] border border-[#ECD9F9] transition hover:shadow-md cursor-pointer"
        >
          {/* Host Video Preview */}
          <div className="relative aspect-[16/10] overflow-hidden bg-zinc-900">
            <img
              src={activeSession.thumbnailUrl}
              alt={activeSession.sellerName}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Viewer Count Badge */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-xs">
              <Users className="h-3 w-3 text-rose-400" />
              <span>{viewerCount} watching</span>
            </div>

            {/* Seller Info on Image matching Screen reference */}
            <div className="absolute bottom-2.5 inset-x-2.5 sm:bottom-3 sm:inset-x-3 z-10">
              <h4 className="text-xs sm:text-sm font-bold text-white leading-tight line-clamp-1">
                {activeSession.title}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-zinc-300 mt-0.5">
                Host: {activeSession.sellerName}
              </p>
            </div>
          </div>

          {/* Full-width Join Live Button matching reference */}
          <div className="p-2 sm:p-2.5 bg-white">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-1.5 rounded-full bg-[#8B2FC9] py-2 sm:py-2.5 text-xs font-bold text-white shadow-xs group-hover:bg-[#7812B8] transition cursor-pointer"
            >
              <span>Join Live & Shop</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Live Stream Modal */}
      <Dialog open={openModal} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent hideCloseButton className="max-w-2xl p-0 overflow-hidden border-none sm:rounded-3xl bg-zinc-950 text-white z-[130]">
          <DialogTitle className="sr-only">Live Market Shopping</DialogTitle>
          <div className="relative flex flex-col md:flex-row h-[560px]">
            {/* Live Video Showcase Stream */}
            <div className="relative flex-1 bg-black flex flex-col justify-between p-4">
              <div className="relative z-20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white">
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    LIVE
                  </span>
                  <div className="flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold backdrop-blur-xs">
                    <Users className="h-3.5 w-3.5 text-rose-400" />
                    <span>{viewerCount}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full bg-black/40 p-1.5 text-white/80 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Center Video/Graphic */}
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src={activeSession.thumbnailUrl}
                  alt={activeSession.sellerName}
                  className="h-full w-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
              </div>

              {/* Bottom Video Overlays */}
              <div className="relative z-20">
                <h3 className="text-sm font-bold text-white">{activeSession.title}</h3>
                <p className="text-xs text-white/70">
                  Featuring fresh harvest from {activeSession.sellerName}
                </p>

                {/* Live Products Strip */}
                <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {activeSession.taggedProducts.map((prod) => (
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
                        onClick={() => handleAddToCart(prod)}
                        className="ml-1 rounded-full bg-[#8B2FC9] p-1.5 text-white hover:bg-[#7812B8]"
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
                  <button
                    type="button"
                    onClick={() => setLikes((l) => l + 1)}
                    className="flex items-center gap-1 text-xs text-rose-400 hover:scale-105"
                  >
                    <Heart className="h-3.5 w-3.5 fill-current" />
                    <span>{likes}</span>
                  </button>
                </div>
                <div className="mt-3 space-y-2.5 max-h-[380px] overflow-y-auto pr-1 text-xs">
                  {liveChatMessages.map((msg) => (
                    <div key={msg.id} className="leading-snug">
                      <span className="font-bold text-[#F59E0B] mr-1.5">{msg.user}:</span>
                      <span className="text-zinc-300">{msg.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="mt-2 flex gap-1.5">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
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
    </>
  );
}
