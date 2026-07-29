import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, FileText, Headphones, Upload, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Order } from "@/lib/orders-store";

type IssueType =
  | "wrong_item" | "missing_item" | "damaged_product" | "expired_product"
  | "poor_quality" | "quantity_missing" | "not_fresh" | "packaging_damaged"
  | "delivered_late" | "not_delivered" | "delivery_partner"
  | "double_payment" | "payment_failed" | "incorrect_amount" | "other";

const issueGroups: Array<{ label: string; items: Array<{ id: IssueType; label: string }> }> = [
  { label: "Product issue", items: [
    { id: "wrong_item", label: "Wrong item received" }, { id: "missing_item", label: "Missing item" },
    { id: "damaged_product", label: "Damaged product" }, { id: "expired_product", label: "Expired product" },
    { id: "poor_quality", label: "Poor quality" }, { id: "quantity_missing", label: "Quantity missing" },
    { id: "not_fresh", label: "Item not fresh" }, { id: "packaging_damaged", label: "Packaging damaged" },
  ] },
  { label: "Delivery issue", items: [
    { id: "delivered_late", label: "Order delivered late" }, { id: "not_delivered", label: "Order not delivered" },
    { id: "delivery_partner", label: "Delivery partner issue" },
  ] },
  { label: "Payment issue", items: [
    { id: "double_payment", label: "Double payment" }, { id: "payment_failed", label: "Payment failed but money debited" },
    { id: "incorrect_amount", label: "Incorrect amount charged" },
  ] },
  { label: "Other", items: [{ id: "other", label: "Other issue" }] },
];

const imageRequired = new Set<IssueType>(["wrong_item", "damaged_product", "expired_product"]);
const itemIssue = new Set<IssueType>(["wrong_item", "missing_item", "damaged_product", "expired_product", "poor_quality", "quantity_missing", "not_fresh", "packaging_damaged"]);
const labelFor = (id: IssueType) => issueGroups.flatMap((g) => g.items).find((i) => i.id === id)?.label ?? "Other issue";
async function withTimeout<T>(operation: PromiseLike<T>, message: string, timeoutMs = 15_000): Promise<T> {
  let timer: number | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => { timer = window.setTimeout(() => reject(new Error(message)), timeoutMs); }),
    ]);
  } finally {
    if (timer) window.clearTimeout(timer);
  }
}

export function OrderSupport({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [issue, setIssue] = useState<IssueType>();
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string>();

  const images = files.filter((file) => file.type.startsWith("image/"));
  const video = files.find((file) => file.type.startsWith("video/"));
  const withinWindow = Date.now() - order.createdAt <= 48 * 60 * 60 * 1000;
  const needsItems = !!issue && itemIssue.has(issue);
  const canContinue = step === 1 ? true : step === 2 ? !!issue : !!issue && (!needsItems || selectedItems.length > 0) && (!issue || !imageRequired.has(issue) || images.length > 0);
  const itemNames = useMemo(() => order.lines.filter((line) => selectedItems.includes(line.productId)).map((line) => line.name), [order.lines, selectedItems]);

  const reset = () => {
    setStep(1); setSelectedItems([]); setIssue(undefined); setComment(""); setFiles([]); setSubmittedId(undefined);
  };

  const chooseFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const nextImages = [...images, ...incoming.filter((file) => file.type.startsWith("image/"))].slice(0, 5);
    const nextVideo = incoming.find((file) => file.type.startsWith("video/")) ?? video;
    setFiles([...nextImages, ...(nextVideo ? [nextVideo] : [])]);
    if (incoming.some((file) => !file.type.startsWith("image/") && !file.type.startsWith("video/"))) toast.error("Upload images or one short video only.");
  };

  const submit = async () => {
    if (!issue || (needsItems && selectedItems.length === 0) || (imageRequired.has(issue) && images.length === 0)) return;
    if (order.status !== "delivered") { toast.error("Support requests can be raised after delivery."); return; }
    if (!withinWindow) { toast.error("This order is outside the 48-hour reporting window."); return; }
    setSubmitting(true);
    try {
      const { data: auth } = await withTimeout(supabase.auth.getUser(), "Authentication is taking too long. Please sign in again.");
      const user = auth.user;
      if (!user) throw new Error("Sign in to report an order issue.");
      const paths: string[] = [];
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
        const { error } = await withTimeout(supabase.storage.from("support-evidence").upload(path, file, { upsert: false }), "Evidence upload timed out. Check that the support-evidence bucket migration is applied.");
        if (error) throw error;
        paths.push(path);
      }
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(order.id);
      const { data, error } = await withTimeout((supabase as any).from("support_tickets").insert({
        user_id: user.id, raised_by: "customer", subject: `${labelFor(issue)} · ${order.code}`,
        body: comment.trim() || labelFor(issue), priority: issue.startsWith("payment") ? "high" : "normal",
        status: "open", order_id: isUuid ? order.id : null, issue_type: issue, support_stage: "submitted",
        selected_product_ids: selectedItems.filter((id) => /^[0-9a-f-]{36}$/i.test(id)), evidence_urls: paths.filter((path) => path !== (video ? paths[files.indexOf(video)] : "")),
        video_url: video ? paths[files.indexOf(video)] ?? null : null, customer_comment: comment.trim() || null,
        eligible: true, reporting_deadline: new Date(order.createdAt + 48 * 60 * 60 * 1000).toISOString(),
      }).select("id").single(), "Support service timed out. Apply the support migration and try again.");
      if (error) throw error;
      await (supabase as any).from("notifications").insert({
        user_id: user.id,
        title: "Support request received",
        body: `We received your ${labelFor(issue)} request for order ${order.code}.`,
        kind: "info",
        link: "/support",
      });
      setSubmittedId(data.id);
      toast.success("Your issue has been sent to support.");
    } catch (error) {
      console.error("support case submission failed", error);
      toast.error(error instanceof Error ? error.message : "Could not submit the support request.");
    } finally { setSubmitting(false); }
  };

  if (!open) return (
    <section className="mx-5 mt-4 mb-8 rounded-xl bg-card p-4 ring-1 ring-black/[0.04]">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-auto"><h2 className="font-display text-base">Need help with this order?</h2><p className="mt-1 text-xs text-muted-foreground">Our support team can review item-specific issues.</p></div>
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-teal-deep"><Headphones className="h-4 w-4" /> Need help</button>
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border hairline px-3 py-2 text-sm hover:bg-muted"><FileText className="h-4 w-4" /> Invoice</button>
        <Link to="/help" className="rounded-lg border hairline px-3 py-2 text-sm hover:bg-muted">Contact support</Link>
      </div>
    </section>
  );

  return (
    <section className="mx-5 mt-4 mb-8 rounded-xl bg-card p-4 ring-1 ring-black/[0.04]">
      {submittedId ? <div className="py-4 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" /><h2 className="mt-2 font-display text-lg">Support request received</h2><p className="mt-1 text-sm text-muted-foreground">Case <span className="font-mono">{submittedId.slice(0, 8).toUpperCase()}</span> is now under review.</p><Link to="/support" className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Track request</Link></div> : <>
        <div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Step {step} of 3</p><h2 className="mt-1 font-display text-lg">Report an order issue</h2></div><button type="button" aria-label="Close" onClick={() => { setOpen(false); reset(); }} className="rounded-full p-2 hover:bg-muted"><X className="h-4 w-4" /></button></div>
        {!withinWindow && <div className="mt-3 flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900"><AlertCircle className="h-4 w-4 shrink-0" /> This order is outside the 48-hour reporting window.</div>}
        {step === 1 && <div className="mt-4"><p className="text-sm font-medium">Which items are affected?</p><p className="mt-1 text-xs text-muted-foreground">Select one or more items, or continue for a delivery or payment issue.</p><div className="mt-3 space-y-2">{order.lines.map((line) => <label key={line.productId} className="flex cursor-pointer items-center gap-3 rounded-lg border hairline p-3 text-sm hover:bg-muted"><input type="checkbox" checked={selectedItems.includes(line.productId)} onChange={(e) => setSelectedItems((current) => e.target.checked ? [...current, line.productId] : current.filter((id) => id !== line.productId))} /> <span className="flex-1">{line.name}</span><span className="font-mono text-xs text-muted-foreground">{line.qty}×</span></label>)}</div></div>}
        {step === 2 && <div className="mt-4 space-y-4"><p className="text-sm font-medium">What went wrong?</p>{issueGroups.map((group) => <div key={group.label}><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</p><div className="grid gap-2 sm:grid-cols-2">{group.items.map((item) => <button type="button" key={item.id} onClick={() => setIssue(item.id)} className={`rounded-lg border p-3 text-left text-sm transition-colors ${issue === item.id ? "border-primary bg-primary/10 font-medium" : "hairline hover:bg-muted"}`}>{item.label}</button>)}</div></div>)}</div>}
        {step === 3 && <div className="mt-4 space-y-4"><div><p className="text-sm font-medium">Add details</p><p className="mt-1 text-xs text-muted-foreground">{itemNames.length ? itemNames.join(", ") : "Order-level issue"}</p></div><label className="block text-sm">Additional comments<textarea value={comment} maxLength={1000} onChange={(e) => setComment(e.target.value)} rows={4} className="mt-2 w-full rounded-lg border hairline bg-background p-3 text-sm outline-none focus:border-primary" placeholder="Tell us what happened..." /><span className="mt-1 block text-right text-xs text-muted-foreground">{comment.length}/1000</span></label><div><label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-sm hover:bg-muted"><Upload className="h-4 w-4" /> Add photos or one short video<input type="file" hidden multiple accept="image/*,video/*" onChange={(e) => chooseFiles(e.target.files)} /></label><p className="mt-1 text-xs text-muted-foreground">Up to 5 photos and 1 video.{imageRequired.has(issue!) ? " A photo is required for this issue." : ""}</p>{files.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{files.map((file, index) => <span key={`${file.name}-${index}`} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs">{file.name.slice(0, 22)}<button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}><X className="h-3 w-3" /></button></span>)}</div>}</div></div>}
        <div className="mt-5 flex justify-between gap-2"><button type="button" onClick={() => step === 1 ? (setOpen(false), reset()) : setStep((current) => current - 1)} className="inline-flex items-center gap-1 rounded-lg border hairline px-3 py-2 text-sm hover:bg-muted"><ChevronLeft className="h-4 w-4" /> Back</button>{step < 3 ? <button type="button" disabled={!canContinue} onClick={() => setStep((current) => current + 1)} className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Continue <ChevronRight className="h-4 w-4" /></button> : <button type="button" disabled={!canContinue || submitting || !withinWindow} onClick={() => void submit()} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{submitting ? "Submitting..." : "Submit to support"}</button>}</div>
      </>}
    </section>
  );
}
