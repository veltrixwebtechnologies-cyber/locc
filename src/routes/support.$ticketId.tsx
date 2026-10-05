import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, LockKeyhole, Send } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/support/$ticketId")({ component: SupportConversation });
type CaseRow = { id:string; case_number:string; order_number:string|null; shop_name:string|null; subject:string; issue_category:string|null; issue_type:string|null; affected_item_name:string|null; support_stage:string; status:string; resolution_type:string|null; viewer_role:string };
type Message = { id:string; sender_role:string; body:string; attachments:string[]; created_at:string };

function SupportConversation() {
  const { ticketId } = Route.useParams();
  const auth = useAuth();
  const [caseRow,setCaseRow] = useState<CaseRow|null>(null);
  const [messages,setMessages] = useState<Message[]>([]);
  const [body,setBody] = useState("");
  const [busy,setBusy] = useState(false);
  const [signed,setSigned] = useState<Record<string,string>>({});
  const [loadError,setLoadError] = useState<string|null>(null);
  const refresh = async () => {
    const [{data: cases,error: caseError},{data: msgs,error: msgError}] = await Promise.all([
      (supabase as any).rpc("get_protected_support_cases"),
      (supabase as any).rpc("get_protected_support_messages",{p_ticket_id:ticketId}),
    ]);
    if (caseError || msgError) { console.error(caseError ?? msgError); setLoadError((caseError ?? msgError)?.message ?? "Could not load this conversation."); return; }
    setLoadError(null);
    const found = (cases ?? []).find((c:CaseRow)=>c.id===ticketId) ?? null;
    setCaseRow(found); setMessages(msgs ?? []);
    if(found) {
      const paths=[...new Set((msgs ?? []).flatMap((m:Message)=>m.attachments ?? []))] as string[];
      const entries=await Promise.all(paths.map(async path=>{const {data}=await supabase.storage.from("support-evidence").createSignedUrl(path,600); return data?.signedUrl ? [path,data.signedUrl] as const : null;}));
      setSigned(Object.fromEntries(entries.filter(Boolean) as [string,string][]));
    }
  };
  useEffect(()=>{let active=true;setCaseRow(null);setMessages([]);setSigned({});if(!auth.id)return()=>{active=false;}; const load=async()=>{await refresh(); if(!active)return;}; void load(); const timer=window.setInterval(()=>void refresh(),8000); const focus=()=>void refresh(); window.addEventListener("focus",focus); return()=>{active=false;clearInterval(timer);window.removeEventListener("focus",focus);};},[ticketId,auth.id]);
  useEffect(()=>{if(caseRow&&window.location.hash==="#support-message"){const composer=document.getElementById("support-message");composer?.scrollIntoView({behavior:"smooth",block:"center"});window.setTimeout(()=>composer?.querySelector("textarea")?.focus(),250);}},[caseRow]);
  const send=async()=>{if(!body.trim()||busy)return;setBusy(true);const {error}=await (supabase as any).rpc("send_protected_support_message",{p_ticket_id:ticketId,p_body:body.trim()});setBusy(false);if(error){toast.error(error.message);return;}setBody("");await refresh();};
  const resolution=async(accept:boolean)=>{setBusy(true);const {error}=await (supabase as any).rpc("respond_to_protected_support_resolution",{p_ticket_id:ticketId,p_accept:accept,p_note:""});setBusy(false);if(error)toast.error(error.message);else{toast.success(accept?"Response sent to Customer Care":"We’ve asked Customer Care for more help.");await refresh();}};
  if(!caseRow)return <AppShell><div className="mx-auto max-w-3xl p-6"><Link to="/support" className="text-sm text-primary">← Your cases</Link>{loadError?<div className="mt-8 rounded-2xl bg-card p-5 ring-1 ring-black/5"><h1 className="font-semibold">We couldn’t open this conversation</h1><p className="mt-2 text-sm text-muted-foreground">{loadError}</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={()=>void refresh()} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Try again</button><Link to="/customer-care" className="rounded-lg border px-4 py-2 text-sm font-semibold">Contact Customer Care</Link></div></div>:<p className="mt-8 text-sm text-muted-foreground">Loading protected conversation…</p>}</div></AppShell>;
  const closed=["RESOLVED","CANCELLED"].includes(caseRow.support_stage)||["resolved","closed"].includes(caseRow.status);
  const hasShopReply=messages.some(m=>m.sender_role==="vendor"||m.sender_role==="delivery_partner");
  return <AppShell><main className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
    <Link to="/support" className="inline-flex items-center gap-2 text-sm text-primary"><ArrowLeft className="h-4 w-4"/>Your support cases</Link>
    <header className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-black/5"><div className="flex flex-wrap items-start gap-3"><div className="mr-auto"><p className="text-xs font-bold uppercase tracking-wider text-primary">{caseRow.case_number}</p><h1 className="mt-1 text-xl font-bold">{caseRow.subject}</h1><p className="mt-2 text-xs text-muted-foreground">{caseRow.order_number ? `Order ${caseRow.order_number}` : "General support"}{caseRow.shop_name ? ` · ${caseRow.shop_name}` : ""}{caseRow.affected_item_name ? ` · ${caseRow.affected_item_name}` : ""}</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{caseRow.support_stage.replaceAll("_"," ").toLowerCase()}</span></div>
      <div className="mt-4 flex gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground"><LockKeyhole className="h-4 w-4 shrink-0 text-primary"/>Protected conversation. Your messages go to LocalShore Customer Care first. Care reviews and shares relevant details with the shop when needed; you and the shop never contact each other directly.</div>
      {caseRow.support_stage==="OPEN"&&<p className="mt-3 rounded-xl bg-muted p-3 text-sm text-muted-foreground">Your request is with LocalShore Customer Care. We’ll review it and share the necessary details with the shop.</p>}
      {caseRow.support_stage==="CUSTOMER_RESPONDED"&&<p className="mt-3 rounded-xl bg-muted p-3 text-sm text-muted-foreground">Your reply has been sent privately to Customer Care. They’ll pass relevant details to the shop.</p>}
      {caseRow.support_stage==="WAITING_FOR_VENDOR"&&<div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3"><p className="text-sm font-semibold">LocalShore Customer Care is following up with the shop</p><p className="mt-1 text-sm text-muted-foreground">The shop cannot contact you directly. Need help now? Send Customer Care a message here and we’ll assist you.</p><a href="#support-message" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><LockKeyhole className="h-3.5 w-3.5"/>Message Customer Care</a></div>}
      {(caseRow.support_stage==="RESOLUTION_PROPOSED"||(caseRow.support_stage==="VENDOR_RESPONDED"&&!hasShopReply))&&<p className="mt-3 rounded-xl bg-muted p-3 text-sm text-muted-foreground">The shop has replied privately to Customer Care. We’re reviewing the response before sharing it with you.</p>}
      {caseRow.support_stage==="CUSTOMER_CONFIRMATION"&&<div className="mt-4 rounded-xl bg-muted p-3"><p className="text-sm font-semibold">The shop has proposed: {(caseRow.resolution_type??"resolution").replaceAll("_"," ")}</p><div className="mt-3 flex gap-2"><button disabled={busy} onClick={()=>void resolution(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Accept</button><button disabled={busy} onClick={()=>void resolution(false)} className="rounded-lg border px-4 py-2 text-sm">I need more help</button></div><p className="mt-2 text-xs text-muted-foreground">Refunds are reviewed under LocalShore policy; this proposal does not automatically issue a payment.</p></div>}
    </header>
    <section className="mt-4 space-y-3 rounded-2xl bg-card p-4 ring-1 ring-black/5" aria-live="polite">{messages.map(m=><article key={m.id} className={`max-w-[90%] rounded-2xl p-3 ${m.sender_role==="customer"?"ml-auto bg-primary text-primary-foreground":m.sender_role==="system"?"mx-auto bg-muted text-center text-xs text-muted-foreground":"bg-muted"}`}><p className="mb-1 text-[10px] font-bold uppercase tracking-wide opacity-75">{m.sender_role==="customer_care"?"LocalShore Customer Care":m.sender_role==="system"?"LocalShore System":m.sender_role.replaceAll("_"," ")}</p><p className="whitespace-pre-wrap text-sm">{m.body}</p>{m.attachments?.map(path=>signed[path]?<a key={path} href={signed[path]} target="_blank" rel="noreferrer" className="mt-2 block text-xs underline">View attachment</a>:null)}<time className="mt-2 block text-[10px] opacity-70">{new Date(m.created_at).toLocaleString()}</time></article>)}{messages.length===0&&<p className="p-6 text-center text-sm text-muted-foreground">Your case is open. LocalShore will keep the conversation here.</p>}</section>
    {!closed&&<form id="support-message" className="mt-3 flex scroll-mb-24 gap-2" onSubmit={e=>{e.preventDefault();void send();}}><textarea value={body} onChange={e=>setBody(e.target.value)} maxLength={2000} rows={2} placeholder="Message LocalShore Customer Care…" className="min-w-0 flex-1 resize-y rounded-xl border bg-card p-3 text-sm"/><button disabled={busy||!body.trim()} className="self-end rounded-xl bg-primary p-3 text-primary-foreground disabled:opacity-50" aria-label="Send message to LocalShore Customer Care"><Send className="h-4 w-4"/></button></form>}
    {closed&&<p className="mt-3 rounded-xl bg-muted p-3 text-center text-sm text-muted-foreground">This case is closed. Contact Customer Care to request a review.</p>}
  </main></AppShell>;
}
