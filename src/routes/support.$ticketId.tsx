import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  LockKeyhole,
  Send,
  Package,
  Store,
  ShieldCheck,
  CheckCheck,
  AlertCircle,
} from "lucide-react";
import { SocialCommerceShell } from "@/components/social-commerce/social-commerce-shell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/support/$ticketId")({
  component: SupportConversation,
});

type CaseRow = {
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
  resolution_type: string | null;
  viewer_role: string;
};

type Message = {
  id: string;
  sender_role: string;
  body: string;
  attachments: string[];
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

function SupportConversation() {
  const { ticketId } = Route.useParams();
  const auth = useAuth();
  const [caseRow, setCaseRow] = useState<CaseRow | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [signed, setSigned] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = async () => {
    const [{ data: cases, error: caseError }, { data: msgs, error: msgError }] =
      await Promise.all([
        (supabase as any).rpc("get_protected_support_cases"),
        (supabase as any).rpc("get_protected_support_messages", {
          p_ticket_id: ticketId,
        }),
      ]);
    if (caseError || msgError) {
      console.error(caseError ?? msgError);
      setLoadError(
        (caseError ?? msgError)?.message ?? "Could not load this conversation."
      );
      return;
    }
    setLoadError(null);
    const found = (cases ?? []).find((c: CaseRow) => c.id === ticketId) ?? null;
    setCaseRow(found);
    setMessages(msgs ?? []);
    if (found) {
      const paths = [
        ...new Set((msgs ?? []).flatMap((m: Message) => m.attachments ?? [])),
      ] as string[];
      const entries = await Promise.all(
        paths.map(async (path) => {
          const { data } = await supabase.storage
            .from("support-evidence")
            .createSignedUrl(path, 600);
          return data?.signedUrl ? ([path, data.signedUrl] as const) : null;
        })
      );
      setSigned(
        Object.fromEntries(
          entries.filter(Boolean) as [string, string][]
        )
      );
    }
  };

  useEffect(() => {
    let active = true;
    setCaseRow(null);
    setMessages([]);
    setSigned({});
    if (!auth.id)
      return () => {
        active = false;
      };
    const load = async () => {
      await refresh();
      if (!active) return;
    };
    void load();
    const timer = window.setInterval(() => void refresh(), 8000);
    const focus = () => void refresh();
    window.addEventListener("focus", focus);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [ticketId, auth.id]);

  useEffect(() => {
    if (caseRow && window.location.hash === "#support-message") {
      const composer = document.getElementById("support-message");
      composer?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(
        () => composer?.querySelector("textarea")?.focus(),
        250
      );
    }
  }, [caseRow]);

  const send = async () => {
    if (!body.trim() || busy) return;
    setBusy(true);
    const { error } = await (supabase as any).rpc(
      "send_protected_support_message",
      { p_ticket_id: ticketId, p_body: body.trim() }
    );
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setBody("");
    await refresh();
  };

  const resolution = async (accept: boolean) => {
    setBusy(true);
    const { error } = await (supabase as any).rpc(
      "respond_to_protected_support_resolution",
      { p_ticket_id: ticketId, p_accept: accept, p_note: "" }
    );
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success(
        accept
          ? "Response sent to Customer Care"
          : "We’ve asked Customer Care for more help."
      );
      await refresh();
    }
  };

  if (!caseRow) {
    return (
      <SocialCommerceShell>
        <div className="mx-auto max-w-3xl p-6">
          <Link
            to="/support"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B2FC9] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Support Cases</span>
          </Link>
          {loadError ? (
            <div className="mt-8 rounded-3xl bg-white border border-[#E2E8F0] p-6 shadow-xs">
              <h1 className="font-bold text-[#0F172A] text-base">
                We couldn’t open this conversation
              </h1>
              <p className="mt-2 text-xs text-[#64748B]">{loadError}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void refresh()}
                  className="rounded-xl bg-[#8B2FC9] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#7812B8]"
                >
                  Try again
                </button>
                <Link
                  to="/help"
                  className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-xs font-bold text-[#64748B] hover:bg-[#F8FAFC]"
                >
                  Contact Customer Care
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-3xl bg-white border border-[#E2E8F0] p-12 text-center text-xs text-[#8E82A3]">
              Loading protected conversation…
            </div>
          )}
        </div>
      </SocialCommerceShell>
    );
  }

  const closed =
    ["RESOLVED", "CANCELLED"].includes(caseRow.support_stage) ||
    ["resolved", "closed"].includes(caseRow.status);
  const hasShopReply = messages.some(
    (m) => m.sender_role === "vendor" || m.sender_role === "delivery_partner"
  );
  const stage = getStageBadge(caseRow.support_stage);

  return (
    <SocialCommerceShell>
      <main className="mx-auto max-w-3xl space-y-4 pb-16">
        <Link
          to="/support"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B2FC9] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Cases</span>
        </Link>

        {/* Case Header Details */}
        <header className="rounded-3xl bg-white border border-[#E2E8F0] p-5 sm:p-6 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#F2E8FA]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-[#8B2FC9] bg-[#FAF3FF] px-2.5 py-0.5 rounded-md border border-[#E2E8F0]">
                  #{caseRow.case_number}
                </span>
                {caseRow.order_number && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#64748B]">
                    <Package className="h-3.5 w-3.5 text-[#8E82A3]" />
                    <span>Order #{caseRow.order_number}</span>
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] leading-tight">
                {formatSubject(caseRow.subject)}
              </h1>
            </div>

            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold border ${stage.className}`}
            >
              <span className={`h-2 w-2 rounded-full ${stage.dotColor} shrink-0`} />
              <span>{stage.label}</span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
            {caseRow.shop_name && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 font-semibold text-[#0F172A]">
                <Store className="h-3.5 w-3.5 text-[#8B2FC9]" />
                <span>{caseRow.shop_name}</span>
              </span>
            )}
            {caseRow.affected_item_name && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-slate-700">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                <span>Item: {caseRow.affected_item_name}</span>
              </span>
            )}
          </div>

          {/* Privacy Note */}
          <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-xs text-[#64748B]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#8B2FC9]" />
            <span>
              Protected conversation. Messages are reviewed by LocalShore Customer Care, who coordinates directly with the merchant so your personal contact info stays secure.
            </span>
          </div>

          {/* Stage Explanations */}
          {caseRow.support_stage === "OPEN" && (
            <p className="mt-3 rounded-2xl bg-[#FAF3FF] border border-[#E2E8F0] p-3 text-xs text-[#64748B]">
              Your request is under review by LocalShore Customer Care. We will coordinate directly with the shop.
            </p>
          )}
          {caseRow.support_stage === "CUSTOMER_RESPONDED" && (
            <p className="mt-3 rounded-2xl bg-[#FAF3FF] border border-[#E2E8F0] p-3 text-xs text-[#64748B]">
              Your latest message was sent securely to Customer Care. We are reviewing and following up with the merchant.
            </p>
          )}
          {caseRow.support_stage === "WAITING_FOR_VENDOR" && (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900">
              <p className="font-bold">LocalShore Customer Care is following up with the shop</p>
              <p className="mt-1 text-amber-800">
                The shop cannot message you directly. If you have updates, send a message below and Care will assist immediately.
              </p>
            </div>
          )}
          {(caseRow.support_stage === "RESOLUTION_PROPOSED" ||
            (caseRow.support_stage === "VENDOR_RESPONDED" && !hasShopReply)) && (
            <p className="mt-3 rounded-2xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900">
              The shop has replied to Customer Care. Our team is verifying the response before finalizing the resolution with you.
            </p>
          )}
          {caseRow.support_stage === "CUSTOMER_CONFIRMATION" && (
            <div className="mt-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-4">
              <p className="text-xs sm:text-sm font-bold text-[#0F172A]">
                Proposed Resolution:{" "}
                <span className="capitalize text-[#8B2FC9]">
                  {(caseRow.resolution_type ?? "resolution").replaceAll("_", " ")}
                </span>
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void resolution(true)}
                  className="rounded-xl bg-[#8B2FC9] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#7812B8] cursor-pointer disabled:opacity-50"
                >
                  Accept Resolution
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void resolution(false)}
                  className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-bold text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer disabled:opacity-50"
                >
                  I Need More Help
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Conversation Stream */}
        <section
          className="space-y-3.5 rounded-3xl bg-white border border-[#E2E8F0] p-4 sm:p-6 shadow-xs"
          aria-live="polite"
        >
          {messages.map((m) => {
            const fromCustomer = m.sender_role === "customer";
            const fromSystem = m.sender_role === "system";

            return (
              <article
                key={m.id}
                className={`flex ${fromCustomer ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-xs ${
                    fromCustomer
                      ? "rounded-br-xs bg-[#8B2FC9] text-white"
                      : fromSystem
                      ? "max-w-full rounded-xl bg-slate-100 text-center text-xs text-slate-600 border border-slate-200"
                      : "rounded-bl-xs bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0]"
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
                      : m.sender_role === "customer_care"
                      ? "LocalShore Customer Care"
                      : m.sender_role.replaceAll("_", " ")}
                  </p>
                  <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
                    {m.body}
                  </p>
                  {m.attachments?.map((path) =>
                    signed[path] ? (
                      <a
                        key={path}
                        href={signed[path]}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block text-xs underline font-semibold"
                      >
                        View Attachment
                      </a>
                    ) : null
                  )}
                  <div
                    className={`mt-1.5 flex items-center gap-1.5 text-[10px] ${
                      fromCustomer ? "justify-end text-white/70" : "text-[#8E82A3]"
                    }`}
                  >
                    <time>{new Date(m.created_at).toLocaleString()}</time>
                    {fromCustomer && <CheckCheck className="h-3 w-3" />}
                  </div>
                </div>
              </article>
            );
          })}
          {messages.length === 0 && (
            <p className="p-8 text-center text-xs text-[#8E82A3]">
              Your case is active. Your messages and updates from Care will appear here.
            </p>
          )}
        </section>

        {/* Composer */}
        {!closed && (
          <form
            id="support-message"
            className="flex scroll-mb-24 gap-2 bg-white p-3 rounded-2xl border border-[#E2E8F0] shadow-xs"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={2000}
              rows={2}
              placeholder="Message LocalShore Customer Care…"
              className="min-w-0 flex-1 resize-y rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs sm:text-sm text-[#0F172A] placeholder:text-[#8E82A3] outline-none focus:border-[#8B2FC9] focus:bg-white focus:ring-2 focus:ring-[#8B2FC9]/20"
            />
            <button
              type="submit"
              disabled={busy || !body.trim()}
              className="self-end rounded-xl bg-[#8B2FC9] p-3 text-white shadow-xs hover:bg-[#7812B8] active:scale-95 disabled:opacity-50 cursor-pointer"
              aria-label="Send message to LocalShore Customer Care"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        )}

        {closed && (
          <p className="mt-3 rounded-2xl bg-white border border-[#E2E8F0] p-4 text-center text-xs font-semibold text-[#64748B] shadow-2xs">
            This case is closed. If you require additional assistance, please open a new inquiry from your orders.
          </p>
        )}
      </main>
    </SocialCommerceShell>
  );
}
