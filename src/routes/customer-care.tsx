import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ChevronRight, HelpCircle, Package, ChevronDown, Send, Paperclip, Clock, LifeBuoy, LockKeyhole } from "lucide-react";
import { m } from "motion/react";
import { SUPPORT_CATEGORIES, SUPPORT_FAQS, type SupportCategory } from "@/lib/platform-data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";
import { useOrdersState, type Order } from "@/lib/orders-store";

export const Route = createFileRoute("/customer-care")({ component: CustomerCarePage });
const noOrderCategories = new Set(["account", "gift_card", "rewards", "other"]);
const itemCategories = new Set(["missing", "wrong", "damaged"]);
const issueOptions: Record<string,string[]> = {
  order:["Entire order", "Missing item", "Wrong item", "Damaged item", "Quantity incorrect", "Delivery issue", "Other"],
  missing:["Missing", "Quantity incorrect", "Other"], wrong:["Wrong item", "Other"], damaged:["Damaged", "Expired/spoiled", "Quality issue", "Other"],
  payment:["Payment failed", "Charged twice", "Incorrect amount", "Other"], refund:["Refund delayed", "Refund amount incorrect", "Other"], delivery:["Late delivery", "Not delivered", "Delivery partner issue", "Other"],
};
const slug=(v:string)=>v.toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");

function CustomerCarePage() {
  const auth=useAuth(); const {orders,isLoading:ordersLoading}=useOrdersState(); const navigate=useNavigate();
  const ticketRef=useRef<HTMLElement>(null); const inputRef=useRef<HTMLInputElement>(null);
  const [selectedCategory,setSelectedCategory]=useState<SupportCategory|null>(null); const [selectedOrder,setSelectedOrder]=useState<Order|null>(null);
  const [selectedItem,setSelectedItem]=useState<string>(""); const [issueType,setIssueType]=useState(""); const [faqOpen,setFaqOpen]=useState<number|null>(null); const [continueWithoutOrder,setContinueWithoutOrder]=useState(false);
  const [message,setMessage]=useState(""); const [files,setFiles]=useState<File[]>([]); const [submitting,setSubmitting]=useState(false);
  const filePreviews=useMemo(()=>files.map(file=>({file,url:URL.createObjectURL(file)})),[files]);
  useEffect(()=>()=>filePreviews.forEach(({url})=>URL.revokeObjectURL(url)),[filePreviews]);
  const orderRequired=!!selectedCategory&&!noOrderCategories.has(selectedCategory.id)&&!continueWithoutOrder;
  const asksItem=!!selectedCategory&&itemCategories.has(selectedCategory.id);
  const currentStep=!selectedCategory?1:orderRequired&&!selectedOrder?2:asksItem&&!selectedItem?3:orderRequired?3:2;
  const chooseCategory=(cat:SupportCategory)=>{setSelectedCategory(cat);setSelectedOrder(null);setSelectedItem("");setIssueType("");setMessage("");setContinueWithoutOrder(false);window.setTimeout(()=>ticketRef.current?.scrollIntoView({behavior:"smooth",block:"center"}),60);};
  const addFiles=(list:FileList|null)=>{if(!list)return;const next=Array.from(list);if(next.some(f=>!f.type.startsWith("image/")))toast.error("Please attach image files only.");const allowed=next.filter(f=>f.type.startsWith("image/")&&f.size<=10*1024*1024);setFiles(prev=>[...prev,...allowed].slice(0,6));};
  const submit=async()=>{
    if(!selectedCategory)return;
    if(orderRequired&&!selectedOrder){toast.error("Select the order you need help with.");return;}
    if(asksItem&&!selectedItem){toast.error("Select the affected item or Entire order.");return;}
    if(!issueType){toast.error("Choose the issue type.");return;}
    if(message.trim().length<3){toast.error("Add a short description so we can help.");return;}
    if(!auth.id){toast.error("Please sign in before contacting Customer Care.");return;}
    setSubmitting(true); const uploaded:string[]=[];
    try {
      const paths=await Promise.all(files.map(async file=>{const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");const path=`${auth.id}/${crypto.randomUUID()}-${safe}`;const {error}=await supabase.storage.from("support-evidence").upload(path,file,{upsert:false,contentType:file.type});if(error)throw error;uploaded.push(path);return path;}));
      const {data,error}=await (supabase as any).rpc("create_customer_support_case",{
        p_order_id:selectedOrder?.id??null,p_issue_category:selectedCategory.id,p_issue_type:slug(issueType),
        p_affected_order_item_id:selectedItem&&selectedItem!=="entire"?selectedItem:null,
        p_initial_message:message.trim(),p_evidence_paths:paths,
      });
      if(error)throw error;
      toast.success("Your protected support case is open.");
      await navigate({to:"/support/$ticketId",params:{ticketId:data}});
    } catch(error) {
      if(uploaded.length) await supabase.storage.from("support-evidence").remove(uploaded);
      console.error("Support case creation failed",error);toast.error(error instanceof Error?error.message:"Could not create the support case. Please try again.");
    } finally {setSubmitting(false);}
  };

  return <AppShell><div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Link to="/" search={{category:undefined,q:undefined}} className="hover:text-primary">Home</Link><ChevronRight className="h-3 w-3"/><span className="font-semibold text-foreground">Customer Care</span></div>
    <m.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="mt-5 rounded-3xl bg-gradient-to-br from-[#981495] to-[#700b6e] p-6 text-white shadow-xl sm:p-8"><LifeBuoy className="h-8 w-8 text-[#f0abfc]"/><h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">How can we help you?</h1><p className="mt-2 max-w-xl text-sm text-white/80">Tell us what happened. LocalShore will connect you to the right shop and keep the conversation here.</p><div className="mt-4 flex items-start gap-2 rounded-xl bg-white/10 p-3 text-xs text-white/90"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0"/>We share only relevant order details needed to resolve the issue. Your personal contact information remains private.</div></m.div>
    <section className="mt-6"><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-bold text-slate-900">What do you need help with?</h2><span className="text-[11px] font-bold text-[#981495]">Step 1 of 3</span></div><p className="mt-1 text-xs text-slate-500">Choose a topic and we’ll guide you through the next steps.</p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">{SUPPORT_CATEGORIES.map(cat=><button key={cat.id} onClick={()=>chooseCategory(cat)} className={`rounded-2xl border p-3.5 text-left transition hover:border-fuchsia-300 hover:shadow-xs ${selectedCategory?.id===cat.id?"border-fuchsia-300 bg-fuchsia-50 ring-1 ring-fuchsia-200":"border-slate-200 bg-white"}`}><span className="text-xl">{cat.icon}</span><p className="mt-1.5 text-xs font-bold text-slate-900">{cat.label}</p><p className="mt-0.5 text-[10px] text-slate-500">{cat.description}</p></button>)}</div></section>
    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5"><section className="space-y-3 lg:col-span-3"><h2 className="text-sm font-bold text-slate-900">Frequently Asked Questions</h2>{SUPPORT_FAQS.map((faq,i)=><div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><button onClick={()=>setFaqOpen(faqOpen===i?null:i)} className="flex w-full items-center gap-3 p-4 text-left"><HelpCircle className="h-4 w-4 shrink-0 text-fuchsia-600"/><span className="flex-1 text-sm font-semibold text-slate-900">{faq.q}</span><ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${faqOpen===i?"rotate-180":""}`}/></button>{faqOpen===i&&<p className="border-t border-slate-100 px-4 pb-4 pt-2 text-sm leading-relaxed text-slate-600">{faq.a}</p>}</div>)}</section>
    <section ref={ticketRef} className="scroll-mt-24 lg:col-span-2"><div className="sticky top-28 space-y-4">{!selectedCategory?<div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-xs"><LifeBuoy className="mx-auto h-8 w-8 text-fuchsia-600"/><p className="mt-3 text-sm font-bold">Need more help?</p><p className="mt-1 text-xs text-slate-500">Choose a category to get started.</p></div>:<div className="rounded-2xl border border-fuchsia-200 bg-white p-5 shadow-xs">
      <div className="flex items-center gap-2"><span className="text-lg">{selectedCategory.icon}</span><h3 className="text-sm font-bold">{selectedCategory.label}</h3><span className="ml-auto rounded-full bg-fuchsia-50 px-2 py-1 text-[10px] font-extrabold text-fuchsia-700">Step {currentStep} of 3</span></div>
      {orderRequired&&!selectedOrder?<div className="mt-4"><p className="text-sm font-semibold">Which order do you need help with?</p>{ordersLoading?<p className="mt-3 text-xs text-muted-foreground">Loading your recent orders…</p>:orders.length===0?<div className="mt-3 rounded-xl bg-muted p-3 text-xs text-muted-foreground">No orders found on this account yet.</div>:<div className="mt-3 max-h-72 space-y-2 overflow-y-auto">{orders.slice(0,12).map(order=><button key={order.id} onClick={()=>setSelectedOrder(order)} className="w-full rounded-xl border p-3 text-left transition hover:border-primary"><span className="block text-xs font-bold">Order #{order.code}</span><span className="mt-1 block text-xs text-muted-foreground">{order.storeName} · {order.lines.length} item{order.lines.length===1?"":"s"} · ₹{Math.round(order.total).toLocaleString("en-IN")}</span><span className="mt-1 block text-[11px] capitalize text-primary">{order.status.replaceAll("_"," ")}</span></button>)}</div>}<button className="mt-2 text-xs font-semibold text-primary underline" onClick={()=>setContinueWithoutOrder(true)}>Continue without an order</button></div>:null}
      {selectedOrder&&<div className="mt-4 rounded-xl bg-fuchsia-50/70 p-3"><p className="text-xs font-semibold">Order #{selectedOrder.code} · {selectedOrder.storeName}</p><p className="mt-1 text-[11px] text-muted-foreground">{selectedOrder.lines.length} items · ₹{Math.round(selectedOrder.total).toLocaleString("en-IN")}</p>{asksItem&&<div className="mt-3"><p className="text-xs font-semibold">Which item is affected?</p><div className="mt-2 space-y-1">{[{id:"entire",name:"Entire order"},...selectedOrder.lines.map(line=>({id:line.orderItemId??"",name:`${line.name} × ${line.qty}`}))].map((item,index)=><label key={`${item.id}-${index}`} className="flex cursor-pointer items-center gap-2 rounded-lg bg-white p-2 text-xs"><input type="radio" name="affected-item" value={item.id} checked={selectedItem===item.id} disabled={!item.id} onChange={()=>setSelectedItem(item.id)}/>{item.name}{!item.id&&index>0?<span className="text-rose-600">(item reference unavailable)</span>:null}</label>)}</div></div>}</div>}
      {(!orderRequired||selectedOrder)&&<div className="mt-4 space-y-3"><fieldset><legend className="text-xs font-semibold">What happened?</legend><div role="radiogroup" aria-label="What happened?" className="mt-1.5 grid grid-cols-1 gap-1.5">{(issueOptions[selectedCategory.id]??[selectedCategory.label,"Other"]).map(opt=><button type="button" key={opt} role="radio" aria-checked={issueType===opt} onClick={()=>setIssueType(opt)} className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition ${issueType===opt?"border-primary bg-primary/5 font-semibold text-primary ring-1 ring-primary/20":"border-slate-200 bg-white text-slate-700 hover:border-primary/40"}`}><span className={`mr-2 inline-flex h-4 w-4 items-center justify-center rounded-full border align-[-3px] ${issueType===opt?"border-primary":"border-slate-300"}`}>{issueType===opt&&<span className="h-2 w-2 rounded-full bg-primary"/>}</span>{opt}</button>)}</div></fieldset><label className="block text-xs font-semibold">Tell us a little more<textarea value={message} onChange={e=>setMessage(e.target.value)} rows={3} maxLength={2000} placeholder="Describe what happened…" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm placeholder:text-slate-400"/></label><div className="flex items-center gap-2"><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={e=>addFiles(e.target.files)}/><button type="button" onClick={()=>inputRef.current?.click()} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Paperclip className="h-3.5 w-3.5"/>Attach photos</button><span className="text-[10px] text-muted-foreground">Private · up to 6 images, 10 MB each</span></div>{filePreviews.length>0&&<div className="grid grid-cols-3 gap-2">{filePreviews.map(({file,url},index)=><div key={`${file.name}-${index}`} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"><img src={url} alt={`Selected evidence ${index+1}`} className="h-20 w-full object-cover"/><button type="button" aria-label={`Remove ${file.name}`} onClick={()=>setFiles(current=>current.filter((_,i)=>i!==index))} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-slate-950/70 text-xs text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100">×</button><p className="truncate px-1.5 py-1 text-[9px] text-slate-500">{file.name}</p></div>)}</div>}<button type="button" onClick={()=>void submit()} disabled={submitting||!auth.id} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#981495] py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#700b6e] disabled:opacity-60"><Send className="h-4 w-4"/>{submitting?"Creating protected case…":auth.id?"Contact the Shop Through LocalShore":"Sign in to submit"}</button>{!auth.id&&<Link to="/auth" search={{redirect:"/customer-care"}} className="block text-center text-xs font-bold text-primary">Sign in to continue</Link>}</div>}
      {selectedOrder&&<button onClick={()=>{setSelectedOrder(null);setSelectedItem("");}} className="mt-3 text-xs font-semibold text-primary">Choose a different order</button>}
      <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500"><Clock className="h-3 w-3"/>Your case and replies stay in LocalShore Customer Care.</div>
    </div>}
    <Link to="/support" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-fuchsia-200"><Package className="h-5 w-5 text-primary"/><div><p className="text-xs font-bold">View Support Cases</p><p className="text-[11px] text-slate-500">Track replies and resolution</p></div><ChevronRight className="ml-auto h-4 w-4 text-slate-400"/></Link></div></section></div>
  </div></AppShell>;
}
