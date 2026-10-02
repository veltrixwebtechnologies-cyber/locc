import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock3, LifeBuoy, LockKeyhole, MessageCircle, Headset, Send, CheckCheck, Phone, X, MessageSquareText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/support")({ component: SupportPage });

type SupportRequest = {
  id: string; case_number: string; order_number: string | null; shop_name: string | null;
  subject: string; issue_category: string | null; issue_type: string | null;
  affected_item_name: string | null; support_stage: string; status: string;
  created_at: string; updated_at: string;
};
type SupportMessage = { id:string; sender_role:string; body:string; created_at:string };

function SupportPage() {
  const auth = useAuth();
  const [rows, setRows] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCase, setActiveCase] = useState<string|null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [sending, setSending] = useState(false);
  const [callCase, setCallCase] = useState<SupportRequest|null>(null);
  const [callLaunched, setCallLaunched] = useState(false);
  const customerCarePhone = String(import.meta.env.VITE_CUSTOMER_CARE_PHONE ?? "").replace(/[^+\d]/g, "");
  const hasCarePhone = /^\+?\d{8,15}$/.test(customerCarePhone);
  const loadConversation = async (ticketId:string) => {
    setChatLoading(true); setChatError("");
    const {data,error} = await (supabase as any).rpc("get_protected_support_messages",{p_ticket_id:ticketId});
    setChatLoading(false);
    if(error){console.error(error);setChatError(error.message || "Could not load this conversation.");return;}
    setMessages(data ?? []);
  };
  const openConversation = (ticketId:string) => {
    if(activeCase===ticketId){setActiveCase(null);return;}
    setActiveCase(ticketId);setDraft("");setMessages([]);void loadConversation(ticketId);
  };
  const sendMessage = async (ticketId:string) => {
    if(!draft.trim()||sending)return;
    setSending(true);setChatError("");
    const {error}=await (supabase as any).rpc("send_protected_support_message",{p_ticket_id:ticketId,p_body:draft.trim()});
    setSending(false);
    if(error){console.error(error);setChatError(error.message || "Your message could not be sent.");return;}
    setDraft("");await loadConversation(ticketId);
  };
  const startCareCall = async () => {
    if(!callCase || !hasCarePhone)return;
    setSending(true);setChatError("");
    const context = `Phone call requested for support case ${callCase.case_number}. Order: ${callCase.order_number ?? "not linked"}. Issue: ${callCase.issue_type ?? callCase.subject}. Shop: ${callCase.shop_name ?? "not specified"}. Please assist through LocalShore Customer Care.`;
    const {error}=await (supabase as any).rpc("send_protected_support_message",{p_ticket_id:callCase.id,p_body:context});
    setSending(false);
    if(error){console.error(error);setChatError("We couldn’t attach this call request to your case. Please send a chat message to Customer Care first.");return;}
    setCallLaunched(true);
    window.location.href=`tel:${customerCarePhone}`;
  };
  const activeConversation = rows.find(item=>item.id===activeCase) ?? null;
  useEffect(() => {
    let active = true;
    setRows([]);
    if (!auth.id) { setLoading(false); return () => { active = false; }; }
    const refresh = async () => {
      const { data, error } = await (supabase as any).rpc("get_protected_support_cases");
      if (error) { if (active) toast.error("Could not load your support cases."); console.error(error); }
      if (active) { setRows((data ?? []).filter((item: SupportRequest) => item)); setLoading(false); }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => { active = false; clearInterval(timer); window.removeEventListener("focus", onFocus); };
  }, [auth.id]);
  useEffect(() => {
    if (!activeCase || !activeConversation) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("protected-support-conversation")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeCase, activeConversation?.id]);
  return <AppShell>
    <div className="px-5 pt-6"><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Customer care</p><h1 className="mt-1 font-display text-2xl">Your support cases</h1><p className="mt-1 text-sm text-muted-foreground">LocalShore keeps your conversation with the shop protected.</p></div>
    <div className="mx-5 mt-4 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground"><LockKeyhole className="h-4 w-4 shrink-0 text-primary"/>Relevant order and item details may be shared to resolve your issue; personal contact details stay private.</div>
    <div className="mx-5 mt-5 space-y-3 pb-4">
      {loading ? <div className="h-24 animate-pulse rounded-xl bg-muted"/> : rows.length === 0 ? <div className="rounded-xl bg-card p-8 text-center ring-1 ring-black/[0.04]"><LifeBuoy className="mx-auto h-8 w-8 text-primary"/><p className="mt-3 font-medium">No support cases yet</p><p className="mt-1 text-sm text-muted-foreground">Choose an issue in Customer Care and we’ll guide you through it.</p><Link to="/customer-care" className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Contact Customer Care</Link></div> : rows.map(row => <article key={row.id} className="rounded-xl bg-card p-4 ring-1 ring-black/[0.04] transition hover:ring-primary/40">
        <Link to="/support/$ticketId" params={{ticketId: row.id}} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <div className="flex flex-wrap items-center gap-2"><h2 className="mr-auto font-semibold">{row.case_number} · {row.subject}</h2><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{row.support_stage === "WAITING_FOR_VENDOR" ? "Customer Care is following up" : row.support_stage.replaceAll("_", " ").toLowerCase()}</span></div>
          <p className="mt-2 text-xs text-muted-foreground">{row.order_number ? `Order ${row.order_number}` : "General support"}{row.shop_name ? ` · ${row.shop_name}` : ""}{row.affected_item_name ? ` · ${row.affected_item_name}` : ""}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5"/>Updated {new Date(row.updated_at).toLocaleString()}<MessageCircle className="ml-auto h-4 w-4 text-primary"/>Open conversation</div>
        </Link>
        <p className="mt-3 text-xs text-muted-foreground">{row.support_stage === "WAITING_FOR_VENDOR" ? "The shop replies to Customer Care—not directly to you. Need help now? Contact Customer Care below." : "Need help at any time? Contact LocalShore Customer Care directly."}</p>
        <button type="button" onClick={()=>openConversation(row.id)} aria-expanded={activeCase===row.id} className="relative z-10 mt-2 inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"><Headset className="h-3.5 w-3.5"/>{activeCase===row.id?"Close Customer Care chat":"Message Customer Care"}</button>
      </article>)}
    </div>
    {activeConversation&&<section id="protected-support-conversation" className="mx-5 mt-4 mb-32 scroll-mt-28 overflow-hidden rounded-[24px] border border-primary/15 bg-gradient-to-b from-white to-[#faf7ff] shadow-sm" aria-label="Protected Customer Care conversation">
      <header className="flex items-center gap-3 border-b border-primary/10 px-4 py-4 sm:px-5"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><LockKeyhole className="h-5 w-5"/></span><div className="min-w-0"><h3 className="font-semibold text-foreground">Protected chat with LocalShore Customer Care</h3><p className="mt-0.5 text-xs text-muted-foreground">Your order issue is being handled securely · {activeConversation.case_number}</p></div><button type="button" onClick={()=>setActiveCase(null)} aria-label="Close conversation" className="ml-auto rounded-full p-2 text-muted-foreground hover:bg-muted"><X className="h-4 w-4"/></button></header>
      {chatLoading?<div className="grid min-h-36 place-items-center px-4 text-sm text-muted-foreground">Loading your conversation…</div>:chatError?<div className="m-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive"><p>{chatError}</p><button type="button" onClick={()=>void loadConversation(activeConversation.id)} className="mt-2 font-semibold underline">Try again</button></div>:<div className="max-h-[360px] min-h-36 space-y-3 overflow-y-auto px-4 py-5 sm:px-5" aria-live="polite">{messages.length===0?<p className="py-8 text-center text-sm text-muted-foreground">No replies yet. Write to Customer Care below and we’ll help with this case.</p>:messages.map(message=>{const fromCustomer=message.sender_role==="customer";const fromSystem=message.sender_role==="system";return <article key={message.id} className={`flex ${fromCustomer?"justify-end":"justify-start"}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ${fromCustomer?"rounded-br-md bg-gradient-to-br from-[#a719a3] to-[#821087] text-white":fromSystem?"max-w-full rounded-xl bg-slate-100 text-center text-slate-600":"rounded-bl-md border border-primary/10 bg-[#f3effb] text-foreground"}`}><p className={`mb-1 text-xs font-semibold ${fromCustomer?"text-white/80":fromSystem?"text-slate-500":"text-primary"}`}>{fromCustomer?"You":fromSystem?"LocalShore System":message.sender_role==="customer_care"?"Customer Care":"LocalShore Support"}</p><p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p><div className={`mt-2 flex items-center gap-1.5 text-[10px] ${fromCustomer?"justify-end text-white/70":"text-muted-foreground"}`}><time>{new Date(message.created_at).toLocaleString()}</time>{fromCustomer&&<CheckCheck className="h-3.5 w-3.5" aria-label="Sent"/>}</div></div></article>;})}</div>}
      <div className="border-t border-primary/10 bg-white/70 px-3 pb-2 pt-4 sm:px-4"><p className="mb-2 px-1 text-xs font-semibold text-foreground">Need immediate help?</p><div className="grid grid-cols-2 gap-2.5"><button type="button" onClick={()=>document.getElementById(`care-composer-${activeConversation.id}`)?.querySelector("textarea")?.focus()} className="flex min-h-[62px] items-center gap-2.5 rounded-2xl border border-primary/15 bg-white px-3 py-2 text-left transition hover:border-primary/40 hover:bg-primary/[0.03]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><MessageSquareText className="h-4 w-4"/></span><span className="min-w-0"><span className="block text-xs font-semibold">Continue chat</span><span className="mt-0.5 block text-[10px] leading-4 text-muted-foreground">Secure text conversation</span></span></button><button type="button" onClick={()=>{setCallCase(activeConversation);setCallLaunched(false);setChatError("");}} className="flex min-h-[62px] items-center gap-2.5 rounded-2xl border border-primary/35 bg-primary/[0.045] px-3 py-2 text-left transition hover:bg-primary/10"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Phone className="h-4 w-4"/></span><span className="min-w-0"><span className="block text-xs font-semibold text-primary">Call Customer Care</span><span className="mt-0.5 block text-[10px] leading-4 text-muted-foreground">Speak with our team</span></span></button></div></div>
      <form id={`care-composer-${activeConversation.id}`} className="flex items-end gap-2 bg-white/70 p-3 pt-2 sm:p-4 sm:pt-2" onSubmit={event=>{event.preventDefault();void sendMessage(activeConversation.id);}}><textarea value={draft} onChange={event=>setDraft(event.target.value)} maxLength={2000} rows={2} placeholder="Write to LocalShore Customer Care…" aria-label="Message LocalShore Customer Care" className="min-h-[60px] min-w-0 flex-1 resize-none rounded-2xl border border-primary/15 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"/><button type="submit" disabled={sending||!draft.trim()} aria-label="Send message to Customer Care" className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">{sending?<span className="text-xs">…</span>:<Send className="h-5 w-5"/>}</button></form>
    </section>}
    {callCase&&<div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget&&!sending)setCallCase(null);}}><section role="dialog" aria-modal="true" aria-labelledby="care-call-title" className="w-full max-w-md rounded-t-[28px] border border-primary/15 bg-background p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[28px]"><div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted sm:hidden"/><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Phone className="h-5 w-5"/></span><div className="min-w-0 flex-1"><h2 id="care-call-title" className="font-display text-lg font-bold">Call LocalShore Customer Care?</h2><p className="mt-1 text-sm text-muted-foreground">Our Customer Care team will help you with this order issue.</p></div><button type="button" aria-label="Close call confirmation" onClick={()=>setCallCase(null)} className="rounded-full p-2 text-muted-foreground hover:bg-muted"><X className="h-4 w-4"/></button></div><div className="mt-4 rounded-2xl bg-primary/[0.05] p-3 text-xs leading-5 text-muted-foreground"><p><strong className="text-foreground">Case:</strong> {callCase.case_number}</p><p><strong className="text-foreground">Order:</strong> {callCase.order_number ?? "—"}</p><p><strong className="text-foreground">Issue:</strong> {callCase.issue_type ?? callCase.subject}</p><p><strong className="text-foreground">Shop:</strong> {callCase.shop_name ?? "—"}</p></div>{callLaunched?<div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><p className="font-semibold">Phone app opened</p><p className="mt-1 text-xs">Your call request and case details are in the protected LocalShore conversation. Call status is handled by your phone app.</p><button type="button" onClick={()=>setCallCase(null)} className="mt-2 text-xs font-semibold underline">Return to chat</button></div>:!hasCarePhone?<p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">Calling is not configured yet. Add the official support line as <code>VITE_CUSTOMER_CARE_PHONE</code> to enable calls. Seller contact details are never used.</p>:null}{chatError&&<p role="alert" className="mt-3 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{chatError}</p>}<div className="mt-5 grid grid-cols-2 gap-3"><button type="button" disabled={sending} onClick={()=>setCallCase(null)} className="min-h-11 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground disabled:opacity-50">Cancel</button><button type="button" disabled={sending||!hasCarePhone||callLaunched} onClick={()=>void startCareCall()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm disabled:cursor-not-allowed disabled:opacity-50"><Phone className="h-4 w-4"/>{sending?"Preparing call…":callLaunched?"Call opened":"Call Now"}</button></div></section></div>}
  </AppShell>;
}
