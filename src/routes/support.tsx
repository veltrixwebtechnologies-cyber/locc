import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock3, LifeBuoy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/support")({ component: SupportPage });

type SupportRequest = {
  id: string;
  subject: string;
  issue_type: string | null;
  support_stage: string;
  created_at: string;
  updated_at: string;
};
const stageLabel: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  awaiting_shop_response: "Awaiting shop response",
  approved: "Approved",
  rejected: "Rejected",
  refund_initiated: "Refund initiated",
  refunded: "Refunded",
  replacement_approved: "Replacement approved",
  replacement_delivered: "Replacement delivered",
};
const supportStages = [
  "submitted",
  "under_review",
  "awaiting_shop_response",
  "approved",
  "refund_initiated",
  "refunded",
  "replacement_approved",
  "replacement_delivered",
];
const progressFor = (stage: string) => {
  if (stage === "rejected") return 100;
  const index = supportStages.indexOf(stage);
  return `${Math.max(1, (((index < 0 ? 0 : index) + 1) / supportStages.length) * 100)}%`;
};

function SupportPage() {
  const [rows, setRows] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | undefined;
    let refreshListener: (() => void) | undefined;
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        if (active) setLoading(false);
        return;
      }
      const refresh = async () => {
        const { data, error } = await (supabase as any)
          .from("support_tickets")
          .select("id,subject,issue_type,support_stage,created_at,updated_at")
          .eq("user_id", auth.user.id)
          .order("created_at", { ascending: false });
        if (error) {
          toast.error("Could not load support requests.");
          console.error(error);
        }
        if (active) {
          setRows((data ?? []) as SupportRequest[]);
          setLoading(false);
        }
      };

      await refresh();
      refreshListener = () => {
        void refresh();
      };
      channel = supabase
        .channel(`customer-support-${auth.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "support_tickets",
            filter: `user_id=eq.${auth.user.id}`,
          },
          refreshListener,
        )
        .subscribe();
      window.addEventListener("focus", refreshListener);
    };
    void load();
    return () => {
      active = false;
      if (refreshListener) window.removeEventListener("focus", refreshListener);
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);
  return (
    <AppShell>
      <div className="px-5 pt-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Customer care
        </p>
        <h1 className="mt-1 font-display text-2xl">Support requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track issues raised against your orders.
        </p>
      </div>
      <div className="mx-5 mt-5 space-y-3 pb-8">
        {loading ? (
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
        ) : rows.length === 0 ? (
          <div className="rounded-xl bg-card p-8 text-center ring-1 ring-black/[0.04]">
            <LifeBuoy className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-3 font-medium">No support requests yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Open Need help from a delivered order when you need us.
            </p>
            <Link
              to="/orders"
              className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              View orders
            </Link>
          </div>
        ) : (
          rows.map((row) => (
            <article key={row.id} className="rounded-xl bg-card p-4 ring-1 ring-black/[0.04]">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="mr-auto font-medium">{row.subject}</h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {stageLabel[row.support_stage] ?? row.support_stage}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" /> Submitted{" "}
                {new Date(row.created_at).toLocaleString()}
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: progressFor(row.support_stage) }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Our support team will review the request and contact you if more information is
                needed.
              </p>
            </article>
          ))
        )}
      </div>
    </AppShell>
  );
}
