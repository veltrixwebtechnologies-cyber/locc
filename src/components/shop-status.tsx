import { Clock, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import type { ShopStatus } from "@/lib/shop-availability";

/* ── StatusBadge ─────────────────────────────────────────────────────────── */
interface StatusBadgeProps {
  status?: ShopStatus | null;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { wrap: "px-2 py-0.5 text-[11px] gap-1",   icon: "h-3 w-3" },
  md: { wrap: "px-2.5 py-1 text-[13px] gap-1.5", icon: "h-3.5 w-3.5" },
  lg: { wrap: "px-3 py-1.5 text-sm gap-2",        icon: "h-4 w-4" },
};

export function ShopStatusBadge({ status, loading = false, size = "md", className = "" }: StatusBadgeProps) {
  const s = sizeMap[size];
  if (loading) {
    return (
      <span className={`inline-flex items-center rounded-full font-medium bg-muted text-muted-foreground ${s.wrap} ${className}`}>
        <Loader2 className={`${s.icon} animate-spin`} />Checking…
      </span>
    );
  }
  if (!status) return null;
  const { label, status: kind } = status;
  const palette: Record<string, string> = {
    open:            "bg-emerald-50 text-emerald-700 border border-emerald-200",
    open_override:   "bg-blue-50 text-blue-700 border border-blue-200",
    closed:          "bg-red-50 text-red-600 border border-red-200",
    closed_override: "bg-amber-50 text-amber-700 border border-amber-200",
    holiday:         "bg-purple-50 text-purple-700 border border-purple-200",
  };
  const Icon = (kind === "open" || kind === "open_override") ? CheckCircle2 : kind === "holiday" ? AlertCircle : XCircle;
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${palette[kind] ?? "bg-muted text-muted-foreground"} ${s.wrap} ${className}`}>
      <Icon className={s.icon} />{label}
    </span>
  );
}

/* ── StatusCard ─────────────────────────────────────────────────────────── */
export function ShopStatusCard({ status, loading, className = "" }: { status?: ShopStatus | null; loading?: boolean; className?: string }) {
  if (loading) {
    return (
      <div className={`flex items-center gap-3 rounded-xl border border-border bg-card p-4 ${className}`}>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
        <div><p className="text-sm font-semibold">Checking availability…</p><p className="text-xs text-muted-foreground">Please wait</p></div>
      </div>
    );
  }
  if (!status) {
    return (
      <div className={`flex items-center gap-3 rounded-xl border border-dashed border-muted bg-card/60 p-4 ${className}`}>
        <AlertCircle className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Availability info unavailable</p>
      </div>
    );
  }
  const { isOpen, label, opensAt, closesAt, overrideReason, status: kind } = status;
  const bg = isOpen ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200";
  const dotColor = isOpen ? "bg-emerald-500" : "bg-red-500";
  const textColor = isOpen ? "text-emerald-700" : "text-red-600";
  const extra = kind === "holiday" ? overrideReason : kind === "closed_override" ? (overrideReason || "Temporarily closed by owner") : kind === "open_override" ? (overrideReason || "Manually opened by owner") : null;
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${bg} ${className}`}>
      <div className="mt-1 shrink-0 relative h-3 w-3">
        <span className={`block h-3 w-3 rounded-full ${dotColor}`} />
        {isOpen && <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400/40" />}
      </div>
      <div className="min-w-0">
        <p className={`font-bold text-base ${textColor}`}>{label}</p>
        {!isOpen && opensAt && (
          <p className="mt-0.5 flex items-center gap-1 text-[13px] text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />Opens at {opensAt}{closesAt && ` · Closes at ${closesAt}`}
          </p>
        )}
        {isOpen && closesAt && (
          <p className="mt-0.5 flex items-center gap-1 text-[13px] text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />Closes at {closesAt}
          </p>
        )}
        {extra && <p className="mt-1 text-xs font-medium text-muted-foreground">{extra}</p>}
      </div>
    </div>
  );
}

/* ── Closed overlay for shop cards ─────────────────────────────────────── */
export function ShopClosedOverlay({ status }: { status?: ShopStatus | null }) {
  if (!status || status.isOpen) return null;
  const message =
    status.status === "holiday" ? `Closed · ${status.overrideReason ?? "Holiday"}` :
    status.status === "closed_override" ? "Temporarily Closed" :
    status.opensAt ? `Opens at ${status.opensAt}` :
    "Currently Closed";
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/55 rounded-t-2xl">
      <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">{message}</span>
    </div>
  );
}
