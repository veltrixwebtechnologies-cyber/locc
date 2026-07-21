import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { ChevronLeft } from "lucide-react";

const KEY = "localshore.notifs.v1";
interface Prefs {
  orders: boolean;
  offers: boolean;
  nearby: boolean;
}
const DEFAULT: Prefs = { orders: true, offers: true, nearby: false };

export const Route = createFileRoute("/notifications")({ component: NotificationsPage });

function NotificationsPage() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setPrefs(JSON.parse(raw));
    } catch {
      setPrefs(DEFAULT);
    }
  }, []);
  const update = (k: keyof Prefs, v: boolean) => {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  };

  const rows: { key: keyof Prefs; label: string; desc: string }[] = [
    { key: "orders", label: "Order updates", desc: "Status changes and delivery alerts" },
    { key: "offers", label: "Offers & deals", desc: "Local shop promotions and discounts" },
    { key: "nearby", label: "Nearby stores", desc: "New shops joining in your area" },
  ];

  return (
    <AppShell>
      <div className="px-5 pt-6">
        <Link
          to="/profile"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Profile
        </p>
        <h1 className="mt-1 font-display text-3xl">Notifications</h1>
      </div>

      <ul className="mx-5 mt-6 overflow-hidden rounded-xl bg-card ring-1 ring-black/[0.04]">
        {rows.map((r, i) => (
          <li
            key={r.key}
            className={`flex items-center gap-3 p-4 ${i < rows.length - 1 ? "border-b hairline" : ""}`}
          >
            <div className="flex-1">
              <p className="text-sm font-semibold">{r.label}</p>
              <p className="text-xs text-muted-foreground">{r.desc}</p>
            </div>
            <button
              onClick={() => update(r.key, !prefs[r.key])}
              className={`relative h-6 w-11 rounded-full transition-colors ${prefs[r.key] ? "bg-primary" : "bg-muted"}`}
              aria-label={`Toggle ${r.label}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${prefs[r.key] ? "left-[22px]" : "left-0.5"}`}
              />
            </button>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
