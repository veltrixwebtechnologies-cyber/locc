import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Search,
  Phone,
  Send,
  Plus,
  Smile,
  Paperclip,
  CheckCheck,
  Check,
  ShoppingBag,
  ExternalLink,
  MessageCircle,
  Clock,
  Sparkles,
  Store,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { SocialCommerceShell } from "@/components/social-commerce/social-commerce-shell";
import { cartStore, useCart } from "@/modules/shopper/services/cart-store";

export const Route = createFileRoute("/messages")({
  component: MessagesPage,
});

interface ChatMessage {
  id: string;
  sender: "user" | "merchant";
  text: string;
  timestamp: string;
  taggedProduct?: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    unit?: string;
  };
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  type: "shop" | "order" | "support";
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  online: boolean;
  phone?: string;
  storeId?: string;
  messages: ChatMessage[];
}

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "conv_ravi",
    name: "Ravi's Bakery",
    avatar: "/assets/ravis-bakery-logo.png",
    type: "shop",
    lastMessage: "Your order is out for delivery! • 2m",
    timestamp: "2m",
    unreadCount: 3,
    online: true,
    phone: "+91 98765 43210",
    storeId: "s_paap1",
    messages: [
      {
        id: "m_1",
        sender: "user",
        text: "Hi! Is the sourdough loaf available today?",
        timestamp: "10:14 AM",
      },
      {
        id: "m_2",
        sender: "merchant",
        text: "Yes! It's freshly baked and in stock. You can add it to your cart or I can create an order for you.",
        timestamp: "10:15 AM",
        taggedProduct: {
          id: "prod_sourdough_msg",
          name: "Sourdough Loaf",
          price: 180,
          imageUrl: "/assets/ravis-sourdough-hero.jpg",
          unit: "loaf",
        },
      },
      {
        id: "m_3",
        sender: "user",
        text: "Great! I've placed the order. Can you confirm the delivery time?",
        timestamp: "10:17 AM",
      },
      {
        id: "m_4",
        sender: "merchant",
        text: "Your order #LS42861 is confirmed. Estimated delivery: ~18 min. Our delivery partner is already on the way! 🥖",
        timestamp: "10:18 AM",
      },
    ],
  },
  {
    id: "conv_meena",
    name: "Meena Fresh",
    avatar:
      "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80",
    type: "shop",
    lastMessage: "Fresh mangoes available now! • 15m",
    timestamp: "15m",
    unreadCount: 1,
    online: true,
    phone: "+91 98432 10987",
    storeId: "s_kiran1",
    messages: [
      {
        id: "m_m1",
        sender: "merchant",
        text: "Namaste! New batch of sweet Salem Alphonso mangoes arrived this morning. Let us know if you need any boxes reserved!",
        timestamp: "9:45 AM",
        taggedProduct: {
          id: "prod_mango_msg",
          name: "Salem Alphonso Mango",
          price: 220,
          imageUrl:
            "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80",
          unit: "1 kg",
        },
      },
      {
        id: "m_m2",
        sender: "user",
        text: "Awesome, please add 2 kgs to my basket!",
        timestamp: "10:00 AM",
      },
    ],
  },
  {
    id: "conv_kumar",
    name: "Kumar Stores",
    avatar:
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=400&q=80",
    type: "shop",
    lastMessage: "Can you deliver by evening? • 1h",
    timestamp: "1h",
    online: false,
    phone: "+91 94433 22110",
    storeId: "s_groc2",
    messages: [
      {
        id: "m_k1",
        sender: "user",
        text: "Can you deliver by evening?",
        timestamp: "9:15 AM",
      },
      {
        id: "m_k2",
        sender: "merchant",
        text: "Yes, our delivery slot is open from 4 PM to 7 PM. All grocery orders will be dispatched on time.",
        timestamp: "9:20 AM",
      },
    ],
  },
  {
    id: "conv_stylehub",
    name: "StyleHub",
    avatar:
      "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=400&q=80",
    type: "shop",
    lastMessage: "New arrivals in stock! • 2h",
    timestamp: "2h",
    online: true,
    phone: "+91 98421 55667",
    storeId: "s_boutique1",
    messages: [
      {
        id: "m_s1",
        sender: "merchant",
        text: "Hi! Check out our new 100% Coimbatore cotton tees in pastel colors.",
        timestamp: "8:30 AM",
      },
    ],
  },
  {
    id: "conv_support",
    name: "LocalShore Support",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    type: "support",
    lastMessage: "How can we help you today? • 1d",
    timestamp: "1d",
    online: true,
    phone: "+91 1800 123 456",
    messages: [
      {
        id: "m_sup1",
        sender: "merchant",
        text: "Welcome to LocalShore Support! If you have any inquiries regarding orders, refunds, or shops, let us know here.",
        timestamp: "Yesterday",
      },
    ],
  },
];

const FILTER_TABS = ["All", "Shops", "Orders", "Support"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string>("conv_ravi");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cart = useCart();
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Set<string>>(new Set());

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];

  const filteredConversations = conversations.filter((c) => {
    if (activeFilter === "Shops" && c.type !== "shop") return false;
    if (activeFilter === "Orders" && c.type !== "order" && !c.lastMessage.includes("order"))
      return false;
    if (activeFilter === "Support" && c.type !== "support") return false;
    if (
      searchQuery.trim() &&
      !c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConv?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConv) return;

    const userText = inputMessage.trim();
    const newMsg: ChatMessage = {
      id: `m_${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id) {
          return {
            ...c,
            lastMessage: `You: ${userText}`,
            timestamp: "Just now",
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );
    setInputMessage("");

    // Realistic auto-reply from merchant after 1.2s
    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: `reply_${Date.now()}`,
        sender: "merchant",
        text: `Thanks for messaging ${activeConv.name}! We've noted your request and are preparing it right away. 💜`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConv.id) {
            return {
              ...c,
              lastMessage: replyMsg.text,
              timestamp: "Just now",
              messages: [...c.messages, replyMsg],
            };
          }
          return c;
        })
      );
    }, 1200);
  };

  const handleAddToCart = (product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    unit?: string;
  }) => {
    cartStore.add(activeConv.storeId || "store_chat", activeConv.name, {
      id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit || "item",
      stock: 15,
      imageUrl: product.imageUrl,
    });
    setRecentlyAddedIds((prev) => new Set(prev).add(product.id));
    toast.success(`Added ${product.name} to cart!`, {
      description: `₹${product.price} • ${activeConv.name}`,
    });
  };

  return (
    <SocialCommerceShell hideFloatingCreatorDock>
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/10 via-purple-600/5 to-transparent p-5 sm:p-6 rounded-3xl border border-purple-100">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 text-xs font-bold uppercase tracking-wider mb-2">
            <MessageCircle className="w-3.5 h-3.5" />
            Direct Merchant Messaging
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Messages
          </h1>
          <p className="text-sm text-[#746A85] mt-1">
            Chat with local shops, ask product questions, and track orders in real time.
          </p>
        </div>

        {/* 2-Pane Chat Card matching Box 08 */}
        <div className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden h-[680px] flex">
          {/* Left Pane: Conversation List */}
          <div
            className={`w-full md:w-80 lg:w-96 border-r border-purple-100 flex flex-col bg-[#F8FAFC]/40 ${
              mobileShowChat ? "hidden md:flex" : "flex"
            }`}
          >
            {/* Search Input */}
            <div className="p-4 border-b border-purple-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] rounded-2xl border border-purple-100 text-xs text-[#0F172A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B2FC9]"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 mt-3 overflow-x-auto scrollbar-none">
                {FILTER_TABS.map((tab) => {
                  const isActive = activeFilter === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveFilter(tab)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap ${
                        isActive
                          ? "bg-[#8B2FC9] text-white shadow-xs"
                          : "bg-white text-[#746A85] border border-purple-100 hover:border-purple-200"
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conversation List Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-purple-50">
              {filteredConversations.map((conv) => {
                const isSelected = conv.id === activeConv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setActiveConvId(conv.id);
                      setMobileShowChat(true);
                      // Clear unread indicator on open
                      setConversations((prev) =>
                        prev.map((c) =>
                          c.id === conv.id ? { ...c, unreadCount: undefined } : c
                        )
                      );
                    }}
                    className={`w-full p-4 flex items-start gap-3 text-left transition-all ${
                      isSelected
                        ? "bg-purple-100/70 border-l-4 border-[#8B2FC9]"
                        : "hover:bg-purple-50/50"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={conv.avatar}
                        alt={conv.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-purple-200"
                      />
                      {conv.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold text-[#0F172A] truncate">
                          {conv.name}
                        </h4>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {conv.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-[#746A85] truncate leading-tight">
                        {conv.lastMessage}
                      </p>
                    </div>

                    {conv.unreadCount && (
                      <span className="shrink-0 w-5 h-5 rounded-full bg-[#8B2FC9] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Pane: Active Chat Window */}
          <div
            className={`flex-1 flex flex-col bg-white ${
              !mobileShowChat ? "hidden md:flex" : "flex"
            }`}
          >
            {/* Chat Top Bar */}
            <div className="p-4 border-b border-purple-100 flex items-center justify-between bg-white/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileShowChat(false)}
                  className="md:hidden p-1.5 rounded-xl hover:bg-slate-100 text-gray-600"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="relative">
                  <img
                    src={activeConv.avatar}
                    alt={activeConv.name}
                    className="w-11 h-11 rounded-2xl object-cover border border-purple-200"
                  />
                  {activeConv.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-300" />
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-[#0F172A]">
                    {activeConv.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#746A85]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{activeConv.online ? "Online now" : "Offline"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeConv.phone && (
                  <a
                    href={`tel:${activeConv.phone}`}
                    className="p-2.5 rounded-2xl bg-purple-50 text-[#8B2FC9] hover:bg-purple-100 transition"
                    title="Call shop"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
                {activeConv.storeId && (
                  <Link
                    to="/store/$storeId"
                    params={{ storeId: activeConv.storeId }}
                    className="p-2.5 rounded-2xl bg-purple-50 text-[#8B2FC9] hover:bg-purple-100 transition"
                    title="Visit store"
                  >
                    <Store className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#F8FAFC]/30">
              {activeConv.messages.map((msg) => {
                const isUser = msg.sender === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-3xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                        isUser
                          ? "bg-[#8B2FC9] text-white rounded-br-sm"
                          : "bg-white text-[#0F172A] border border-purple-100 rounded-bl-sm"
                      }`}
                    >
                      <p>{msg.text}</p>

                      {/* Tagged Product Box inside message stream */}
                      {msg.taggedProduct && (
                        <div className="mt-3 p-3 rounded-2xl bg-purple-50 text-[#0F172A] border border-purple-200 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={msg.taggedProduct.imageUrl}
                              alt={msg.taggedProduct.name}
                              className="w-12 h-12 rounded-xl object-cover border border-purple-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate text-[#0F172A]">
                                {msg.taggedProduct.name}
                              </p>
                              <p className="text-xs font-extrabold text-[#8B2FC9]">
                                ₹{msg.taggedProduct.price}{" "}
                                {msg.taggedProduct.unit && (
                                  <span className="text-[10px] text-gray-500 font-normal">
                                    / {msg.taggedProduct.unit}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          {(() => {
                            const isAdded =
                              recentlyAddedIds.has(msg.taggedProduct!.id) ||
                              cart.lines.some((l) => l.productId === msg.taggedProduct!.id);
                            return (
                              <button
                                onClick={() => handleAddToCart(msg.taggedProduct!)}
                                className={`shrink-0 px-3 py-1.5 rounded-xl text-white text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1 cursor-pointer ${
                                  isAdded
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-gradient-to-r from-[#8B2FC9] to-[#581C87]"
                                }`}
                              >
                                {isAdded ? (
                                  <>
                                    <Check className="w-3 h-3 stroke-[2.5]" />
                                    Added to Cart
                                  </>
                                ) : (
                                  <>
                                    <ShoppingBag className="w-3 h-3" />
                                    Add to Cart
                                  </>
                                )}
                              </button>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Message Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 sm:p-4 border-t border-purple-100 bg-white flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => toast.info("Image & file attachment ready")}
                className="p-2 rounded-xl text-gray-400 hover:text-[#8B2FC9] hover:bg-purple-50 transition"
              >
                <Plus className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-[#F8FAFC] rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-[#0F172A] placeholder-gray-400 border border-purple-100 focus:outline-none focus:ring-2 focus:ring-[#8B2FC9]"
              />

              <button
                type="button"
                onClick={() => setInputMessage((prev) => `${prev} 😊`)}
                className="p-2 rounded-xl text-gray-400 hover:text-[#8B2FC9] hover:bg-purple-50 transition hidden sm:block"
              >
                <Smile className="w-5 h-5" />
              </button>

              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-gradient-to-r from-[#8B2FC9] to-[#581C87] text-white font-bold text-xs shadow-md shadow-purple-500/20 hover:opacity-95 disabled:opacity-40 transition active:scale-95 flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </SocialCommerceShell>
  );
}
