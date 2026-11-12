import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Clock3,
  LifeBuoy,
  LockKeyhole,
  MessageCircle,
  Headset,
  Send,
  CheckCheck,
  Phone,
  X,
  MessageSquareText,
  ShieldCheck,
  Package,
  Store,
  ChevronRight,
  HelpCircle,
  AlertCircle,
  Sparkles,
  Search,
} from "lucide-react";
import { SocialCommerceShell } from "@/components/social-commerce/social-commerce-shell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/support")({ component: SupportPage });

type SupportRequest = {
  id: string;
  case_number: string;
  order_number: string | null;
  shop_name: string | null;
  subject: string;
  issue_category: string | null;
  issue_type: string | null;
  affected_item_name: string | null;
  support_stage: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type SupportMessage = {
  id: string;
  sender_role: string;
  body: string;
  created_at: string;
};

function formatSubject(rawSubject: string): string {
  const s = (rawSubject || "").trim();
  const lower = s.toLowerCase();
  if (lower === "shop") return "Shop Coordination & Fulfillment";
  if (lower === "missing") return "Missing Items / Incomplete Order";
  if (lower === "damaged") return "Damaged Goods / Packaging Issue";
  if (lower === "delay") return "Delivery Delay & Tracking";
  if (lower === "wrong_item") return "Incorrect Item Delivered";
  if (lower === "quality") return "Item Quality / Freshness Concern";
  return s || "Order Support Request";
}

function getStageBadge(stage: string) {
  const s = (stage || "").toUpperCase();
  switch (s) {
    case "CUSTOMER_RESPONDED":
      return {
        label: "Awaiting Support Reply",
        className: "bg-[#FAF3FF] text-[#8B2FC9] border-[#E2E8F0]",
        dotColor: "bg-[#8B2FC9]",
      };
    case "WAITING_FOR_VENDOR":
      return {
        label: "Following up with Shop",
        className: "bg-amber-50 text-amber-800 border-amber-200",
        dotColor: "bg-amber-500",
      };
    case "VENDOR_RESPONDED":
      return {
        label: "Shop Replied · Under Review",
        className: "bg-blue-50 text-blue-800 border-blue-200",
        dotColor: "bg-blue-500",
      };
    case "CUSTOMER_CONFIRMATION":
      return {
        label: "Action Needed · Confirm Resolution",
        className: "bg-rose-50 text-rose-800 border-rose-200",
        dotColor: "bg-rose-500",
      };
    case "RESOLUTION_PROPOSED":
      return {
        label: "Resolution Proposed",
        className: "bg-emerald-50 text-emerald-800 border-emerald-200",
        dotColor: "bg-emerald-500",
      };
    case "RESOLVED":
      return {
        label: "Resolved",
        className: "bg-emerald-50 text-emerald-800 border-emerald-200",
        dotColor: "bg-emerald-500",
      };
    case "CANCELLED":
    case "CLOSED":
      return {
        label: "Closed",
        className: "bg-slate-100 text-slate-600 border-slate-200",
        dotColor: "bg-slate-400",
      };
    default:
      return {
        label: "Under Review",
        className: "bg-purple-50 text-purple-800 border-purple-200",
        dotColor: "bg-purple-500",
      };
  }
}

function SupportPage() {
  const auth = useAuth();
  const [rows, setRows] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCase, setActiveCase] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [sending, setSending] = useState(false);
  const [callCase, setCallCase] = useState<SupportRequest | null>(null);
  const [callLaunched, setCallLaunched] = useState(false);
  const [filterTab, setFilterTab] = useState<"all" | "active" | "resolved">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const customerCarePhone = String(import.meta.env.VITE_CUSTOMER_CARE_PHONE ?? "").replace(
    /[^+\d]/g,
    ""
  );
  const hasCarePhone = /^\+?\d{8,15}$/.test(customerCarePhone);

  const loadConversation = async (ticketId: string) => {
    setChatLoading(true);
    setChatError("");
    const { data, error } = await (supabase as any).rpc("get_protected_support_messages", {
      p_ticket_id: ticketId,
    });
    setChatLoading(false);
    if (error) {
      console.error(error);
      setChatError(error.message || "Could not load this conversation.");
      return;
    }
    setMessages(data ?? []);
  };

  const openConversation = (ticketId: string) => {
    if (activeCase === ticketId) {
      setActiveCase(null);
      return;
    }
    setActiveCase(ticketId);
    setDraft("");
    setMessages([]);
    void loadConversation(ticketId);
  };

  const sendMessage = async (ticketId: string) => {
    if (!draft.trim() || sending) return;
    setSending(true);
    setChatError("");
    const { error } = await (supabase as any).rpc("send_protected_support_message", {
      p_ticket_id: ticketId,
      p_body: draft.trim(),
    });
    setSending(false);
    if (error) {
      console.error(error);
      setChatError(error.message || "Your message could not be sent.");
      return;
    }
    setDraft("");
    await loadConversation(ticketId);
  };

  const startCareCall = async () => {
    if (!callCase || !hasCarePhone) return;
    setSending(true);
    setChatError("");
    const context = `Phone call requested for support case ${callCase.case_number}. Order: ${
      callCase.order_number ?? "not linked"
    }. Issue: ${callCase.issue_type ?? callCase.subject}. Shop: ${
      callCase.shop_name ?? "not specified"
    }. Please assist through LocalShore Customer Care.`;
    const { error } = await (supabase as any).rpc("send_protected_support_message", {
      p_ticket_id: callCase.id,
      p_body: context,
    });
    setSending(false);
    if (error) {
      console.error(error);
      setChatError(
        "We couldn’t attach this call request to your case. Please send a chat message to Customer Care first."
      );
      return;
    }
    setCallLaunched(true);
    window.location.href = `tel:${customerCarePhone}`;
  };

  const activeConversation = rows.find((item) => item.id === activeCase) ?? null;

  useEffect(() => {
    let active = true;
    setRows([]);
    if (!auth.id) {
      setLoading(false);
      return () => {
        active = false;
      };
    }
    const refresh = async () => {
      const { data, error } = await (supabase as any).rpc("get_protected_support_cases");
      if (error) {
        if (active) toast.error("Could not load your support cases.");
        console.error(error);
      }
      if (active) {
        setRows((data ?? []).filter((item: SupportRequest) => item));
        setLoading(false);
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [auth.id]);

  useEffect(() => {
    if (!activeCase || !activeConversation) return;
    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById("protected-support-conversation")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeCase, activeConversation?.id]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const isResolved =
        r.status === "resolved" ||
        r.status === "closed" ||
        r.support_stage === "RESOLVED" ||
        r.support_stage === "CANCELLED";

      if (filterTab === "active" && isResolved) return false;
      if (filterTab === "resolved" && !isResolved) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCase = r.case_number.toLowerCase().includes(q);
        const matchesSubject = r.subject.toLowerCase().includes(q);
        const matchesOrder = (r.order_number || "").toLowerCase().includes(q);
        const matchesShop = (r.shop_name || "").toLowerCase().includes(q);
        return matchesCase || matchesSubject || matchesOrder || matchesShop;
      }

      return true;
    });
  }, [rows, filterTab, searchQuery]);

  const activeCount = useMemo(() => {
    return rows.filter(
      (r) =>
        r.status !== "resolved" &&
        r.status !== "closed" &&
        r.support_stage !== "RESOLVED" &&
        r.support_stage !== "CANCELLED"
    ).length;
  }, [rows]);

  const resolvedCount = useMemo(() => {
    return rows.length - activeCount;
  }, [rows, activeCount]);

  return (
    <SocialCommerceShell>
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        {/* ── Top Hero Card: Customer Care & Support ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FAF3FF] via-[#F4E8FC] to-[#ECD5F9] border border-[#E2E8F0] p-6 sm:p-8 shadow-xs">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#8B2FC9]/10 px-3 py-1 text-xs font-bold text-[#8B2FC9] mb-3">
              <Headset className="h-3.5 w-3.5" />
              <span>Customer Care &amp; Support</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0F172A] tracking-tight leading-tight">
              Your Support <br className="hidden sm:block" />
              <span className="text-[#8B2FC9]">Cases &amp; Assistance</span>
            </h1>
            <p className="mt-2 text-xs sm:text-sm font-semibold text-[#64748B]">
              Track ongoing inquiries, communicate securely with Care, and get fast resolutions for your neighborhood orders.
            </p>
          </div>

          {/* Quick Help Badges */}
          <div className="relative z-10 mt-6 flex flex-wrap gap-2.5">
            <Link
              to="/orders"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-[#0F172A] hover:text-[#8B2FC9] hover:bg-[#F1F5F9] shadow-2xs border border-[#E2E8F0] transition"
            >
              <Package className="h-3.5 w-3.5 text-[#8B2FC9]" />
              <span>Report an Order Issue</span>
            </Link>
            <Link
              to="/help"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-[#0F172A] hover:text-[#8B2FC9] hover:bg-[#F1F5F9] shadow-2xs border border-[#E2E8F0] transition"
            >
              <HelpCircle className="h-3.5 w-3.5 text-[#8B2FC9]" />
              <span>Browse FAQs &amp; Help Center</span>
            </Link>
          </div>

          {/* Watermark Icon */}
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none hidden md:flex items-center justify-end pr-6">
            <LifeBuoy className="h-44 w-44 text-[#8B2FC9]" />
          </div>
        </div>

        {/* ── Privacy & Protection Notice ── */}
        <div className="flex items-start sm:items-center gap-3 rounded-2xl bg-white border border-[#E2E8F0] p-4 shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-[#FAF3FF] border border-[#E2E8F0] flex items-center justify-center shrink-0 text-[#8B2FC9]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="text-xs sm:text-sm text-[#0F172A] leading-relaxed">
            <span className="font-bold text-[#8B2FC9]">Protected Conversation: </span>
            <span className="text-[#64748B]">
              LocalShore directly reviews your case with the local merchant on your behalf. Your personal contact details and payment numbers remain private and are never shared.
            </span>
          </div>
        </div>

        {/* ── Filters & Search Bar ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="inline-flex items-center rounded-2xl bg-white p-1.5 border border-[#E2E8F0] shadow-2xs">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`rounded-xl px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                filterTab === "all"
                  ? "bg-[#8B2FC9] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              All Cases ({rows.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("active")}
              className={`rounded-xl px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                filterTab === "active"
                  ? "bg-[#8B2FC9] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("resolved")}
              className={`rounded-xl px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                filterTab === "resolved"
                  ? "bg-[#8B2FC9] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>

          {/* Search Case Input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="h-4 w-4 text-[#8B2FC9] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search case # or order..."
              className="w-full rounded-2xl bg-white border border-[#E2E8F0] pl-9 pr-4 py-2 text-xs font-medium text-[#0F172A] placeholder:text-[#8E82A3] outline-none focus:border-[#8B2FC9] focus:ring-2 focus:ring-[#8B2FC9]/20 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ── Support Cases List ── */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-3xl bg-white border border-[#E2E8F0]"
                />
              ))}
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 sm:p-12 text-center border border-[#E2E8F0] shadow-xs">
              <LifeBuoy className="mx-auto h-12 w-12 text-[#8B2FC9]/50 mb-3" />
              <h3 className="font-bold text-base sm:text-lg text-[#0F172A]">
                {searchQuery ? "No matching support cases" : "No support cases"}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[#64748B] max-w-sm mx-auto">
                {searchQuery
                  ? "Try searching for a different case number or order ID."
                  : "All your neighborhood orders are running smoothly! Need help with an order? Contact Customer Care anytime."}
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <Link
                  to="/orders"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#8B2FC9] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#7812B8] transition"
                >
                  <Package className="h-4 w-4" />
                  <span>View Recent Orders</span>
                </Link>
                <Link
                  to="/help"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#F8FAFC] px-4 py-2.5 text-xs font-bold text-[#8B2FC9] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Help &amp; FAQs</span>
                </Link>
              </div>
            </div>
          ) : (
            filteredRows.map((row) => {
              const stage = getStageBadge(row.support_stage);
              const subjectText = formatSubject(row.subject);
              const isChatOpen = activeCase === row.id;

              return (
                <article
                  key={row.id}
                  className="rounded-3xl bg-white border border-[#E2E8F0] p-5 sm:p-6 shadow-xs hover:border-[#8B2FC9]/40 hover:shadow-md transition-all duration-200"
                >
                  {/* Card Top Row: Case Number + Subject + Stage Badge */}
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#F2E8FA]">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs font-bold text-[#8B2FC9] bg-[#FAF3FF] px-2.5 py-0.5 rounded-md border border-[#E2E8F0]">
                          #{row.case_number}
                        </span>
                        {row.order_number && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#64748B]">
                            <Package className="h-3.5 w-3.5 text-[#8E82A3]" />
                            <span>Order #{row.order_number}</span>
                          </span>
                        )}
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-[#0F172A] leading-tight">
                        {subjectText}
                      </h2>
                    </div>

                    <div
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${stage.className}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${stage.dotColor} shrink-0`} />
                      <span>{stage.label}</span>
                    </div>
                  </div>

                  {/* Card Meta Row: Shop + Affected Item + Updated Time */}
                  <div className="py-3 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-[#64748B]">
                    {row.shop_name && (
                      <div className="inline-flex items-center gap-1 text-[#0F172A] font-semibold bg-[#F8FAFC] px-2.5 py-1 rounded-lg border border-[#E2E8F0]">
                        <Store className="h-3.5 w-3.5 text-[#8B2FC9]" />
                        <span>{row.shop_name}</span>
                      </div>
                    )}

                    {row.affected_item_name && (
                      <div className="inline-flex items-center gap-1 text-[#64748B] bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                        <span>Item: {row.affected_item_name}</span>
                      </div>
                    )}

                    <div className="inline-flex items-center gap-1 text-[#8E82A3] ml-auto">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>Updated {new Date(row.updated_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Explanatory Note */}
                  <p className="text-xs text-[#64748B] bg-[#F8FAFC] p-3 rounded-2xl border border-[#E2E8F0] mb-4">
                    {row.support_stage === "WAITING_FOR_VENDOR"
                      ? "LocalShore Customer Care is coordinating with the shop to resolve your issue. The shop replies to Care, not to you directly."
                      : row.support_stage === "CUSTOMER_CONFIRMATION"
                      ? "A proposed resolution is ready for your confirmation. Please review the proposal below."
                      : "LocalShore Customer Care is actively handling your case. You can message Care at any time."}
                  </p>

                  {/* Actions Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => openConversation(row.id)}
                      aria-expanded={isChatOpen}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer shadow-xs ${
                        isChatOpen
                          ? "bg-slate-800 text-white hover:bg-slate-900"
                          : "bg-[#8B2FC9] text-white hover:bg-[#7812B8]"
                      }`}
                    >
                      <Headset className="h-3.5 w-3.5" />
                      <span>{isChatOpen ? "Close Live Chat" : "Message Customer Care"}</span>
                    </button>

                    <Link
                      to="/support/$ticketId"
                      params={{ ticketId: row.id }}
                      className="group inline-flex items-center gap-1 text-xs font-bold text-[#8B2FC9] hover:text-[#581C87] transition cursor-pointer py-1"
                    >
                      <span>Full Case Details</span>
                      <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* ── Active Conversation Drawer / Chat Box ── */}
        {activeConversation && (
          <section
            id="protected-support-conversation"
            className="scroll-mt-28 overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-lg animate-fadeIn"
            aria-label="Protected Customer Care conversation"
          >
            {/* Header */}
            <header className="flex items-center gap-3 border-b border-[#F2E8FA] bg-[#F8FAFC] px-5 py-4">
              <div className="h-10 w-10 rounded-xl bg-[#FAF3FF] border border-[#E2E8F0] flex items-center justify-center shrink-0 text-[#8B2FC9]">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[#0F172A] text-sm sm:text-base">
                    Protected Care Chat
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Agent Available</span>
                  </span>
                </div>
                <p className="text-xs text-[#64748B] truncate">
                  Case #{activeConversation.case_number} • {formatSubject(activeConversation.subject)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCase(null)}
                aria-label="Close conversation"
                className="h-8 w-8 rounded-full flex items-center justify-center text-[#8E82A3] hover:text-[#0F172A] hover:bg-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            {/* Chat Body */}
            {chatLoading ? (
              <div className="grid min-h-48 place-items-center px-4 text-xs font-semibold text-[#8E82A3]">
                Loading your protected conversation…
              </div>
            ) : chatError ? (
              <div className="m-4 rounded-2xl bg-destructive/10 p-4 text-xs text-destructive border border-destructive/20">
                <p>{chatError}</p>
                <button
                  type="button"
                  onClick={() => void loadConversation(activeConversation.id)}
                  className="mt-2 font-bold underline"
                >
                  Try again
                </button>
              </div>
            ) : (
              <div
                className="max-h-[380px] min-h-[160px] space-y-3.5 overflow-y-auto p-4 sm:p-6 bg-[#FCFAFE]"
                aria-live="polite"
              >
                {messages.length === 0 ? (
                  <div className="py-8 text-center text-xs font-medium text-[#8E82A3] max-w-sm mx-auto">
                    <MessageSquareText className="h-8 w-8 text-[#8B2FC9]/40 mx-auto mb-2" />
                    <p className="font-semibold text-[#0F172A]">Start your conversation</p>
                    <p className="mt-1">
                      Write your message below. A LocalShore support specialist will follow up directly with the merchant.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const fromCustomer = message.sender_role === "customer";
                    const fromSystem = message.sender_role === "system";

                    return (
                      <article
                        key={message.id}
                        className={`flex ${fromCustomer ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-xs ${
                            fromCustomer
                              ? "rounded-br-xs bg-[#8B2FC9] text-white"
                              : fromSystem
                              ? "max-w-full rounded-xl bg-slate-100 text-center text-xs text-slate-600 border border-slate-200"
                              : "rounded-bl-xs bg-white text-[#0F172A] border border-[#E2E8F0]"
                          }`}
                        >
                          <p
                            className={`mb-1 text-[10px] font-bold ${
                              fromCustomer
                                ? "text-white/80"
                                : fromSystem
                                ? "text-slate-500"
                                : "text-[#8B2FC9]"
                            }`}
                          >
                            {fromCustomer
                              ? "You"
                              : fromSystem
                              ? "LocalShore System"
                              : message.sender_role === "customer_care"
                              ? "Customer Care Specialist"
                              : "LocalShore Support"}
                          </p>
                          <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
                            {message.body}
                          </p>
                          <div
                            className={`mt-1.5 flex items-center gap-1.5 text-[10px] ${
                              fromCustomer ? "justify-end text-white/70" : "text-[#8E82A3]"
                            }`}
                          >
                            <time>{new Date(message.created_at).toLocaleTimeString()}</time>
                            {fromCustomer && <CheckCheck className="h-3 w-3" />}
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            )}

            {/* Quick Action Assistance Row */}
            <div className="border-t border-[#F2E8FA] bg-[#F8FAFC] px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
              <div className="text-xs text-[#64748B] font-semibold">
                <span>Need urgent phone support?</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCallCase(activeConversation);
                  setCallLaunched(false);
                  setChatError("");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-[#8B2FC9] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition cursor-pointer shadow-2xs"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Call Care Helpline</span>
              </button>
            </div>

            {/* Composer Form */}
            <form
              id={`care-composer-${activeConversation.id}`}
              className="flex items-end gap-2 p-3 sm:p-4 bg-white border-t border-[#F2E8FA]"
              onSubmit={(event) => {
                event.preventDefault();
                void sendMessage(activeConversation.id);
              }}
            >
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={2000}
                rows={2}
                placeholder="Write your message to LocalShore Customer Care…"
                aria-label="Message LocalShore Customer Care"
                className="min-h-[50px] min-w-0 flex-1 resize-none rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-xs sm:text-sm text-[#0F172A] leading-relaxed outline-none transition placeholder:text-[#8E82A3] focus:border-[#8B2FC9] focus:bg-white focus:ring-2 focus:ring-[#8B2FC9]/20"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                aria-label="Send message to Customer Care"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#8B2FC9] text-white shadow-xs transition hover:bg-[#7812B8] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                {sending ? <span className="text-xs font-bold">…</span> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </section>
        )}

        {/* ── Call Confirmation Modal ── */}
        {callCase && (
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !sending) setCallCase(null);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="care-call-title"
              className="w-full max-w-md rounded-t-[28px] border border-[#E2E8F0] bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[28px]"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#FAF3FF] text-[#8B2FC9] border border-[#E2E8F0]">
                  <Phone className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 id="care-call-title" className="font-bold text-base sm:text-lg text-[#0F172A]">
                    Call LocalShore Customer Care?
                  </h2>
                  <p className="mt-0.5 text-xs text-[#64748B]">
                    Our support team will assist you with this specific case.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close call confirmation"
                  onClick={() => setCallCase(null)}
                  className="rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 rounded-2xl bg-[#F8FAFC] p-3 text-xs leading-5 text-[#64748B] border border-[#E2E8F0]">
                <p>
                  <strong className="text-[#0F172A]">Case:</strong> #{callCase.case_number}
                </p>
                <p>
                  <strong className="text-[#0F172A]">Order:</strong> {callCase.order_number ?? "—"}
                </p>
                <p>
                  <strong className="text-[#0F172A]">Issue:</strong>{" "}
                  {formatSubject(callCase.issue_type ?? callCase.subject)}
                </p>
                <p>
                  <strong className="text-[#0F172A]">Shop:</strong> {callCase.shop_name ?? "—"}
                </p>
              </div>

              {callLaunched ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  <p className="font-semibold">Phone app opened</p>
                  <p className="mt-1">
                    Your call request and case details are attached to this LocalShore case.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCallCase(null)}
                    className="mt-2 text-xs font-bold text-emerald-700 underline"
                  >
                    Return to chat
                  </button>
                </div>
              ) : !hasCarePhone ? (
                <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900 border border-amber-200">
                  Direct phone calling is available through our in-app chat. Write your message to Care and an agent will call you immediately.
                </p>
              ) : null}

              {chatError && (
                <p role="alert" className="mt-3 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                  {chatError}
                </p>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => setCallCase(null)}
                  className="min-h-11 rounded-xl border border-[#E2E8F0] bg-white px-4 text-xs font-bold text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={sending || !hasCarePhone || callLaunched}
                  onClick={() => void startCareCall()}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#8B2FC9] px-4 text-xs font-bold text-white shadow-xs hover:bg-[#7812B8] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  <Phone className="h-4 w-4" />
                  <span>{sending ? "Preparing call…" : callLaunched ? "Call Opened" : "Call Now"}</span>
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </SocialCommerceShell>
  );
}
