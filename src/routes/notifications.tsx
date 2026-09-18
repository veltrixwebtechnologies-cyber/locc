import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { useNotifications } from "@/lib/notifications-store";

const KEY = "localshore.notifs.v1";
interface Prefs {
  orders: boolean;
  offers: boolean;
  nearby: boolean;
}
const DEFAULT: Prefs = { orders: true, offers: true, nearby: false };

export const Route = createFileRoute("/notifications")({ component: NotificationsPage });

function NotificationsPage() {
  const auth = useAuth();
  const notificationFeed = useNotifications(auth.id);
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
      {auth.id && (
        <section className="mx-5 mt-6 rounded-xl bg-card p-4 ring-1 ring-black/[0.04]">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg">Recent notifications</h2>
            <span className="text-xs text-muted-foreground">
              {notificationFeed.unreadCount} unread
            </span>
          </div>
          {notificationFeed.loading ? (
            <p className="mt-3 text-sm text-muted-foreground">Loading notifications…</p>
          ) : notificationFeed.notifications.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {notificationFeed.notifications.map((notification) => (
                <li key={notification.id} className="py-3 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => void notificationFeed.markRead(notification.id)}
                    className="w-full text-left"
                  >
                    <p
                      className={`text-sm font-semibold ${notification.read_at ? "" : "text-primary"}`}
                    >
                      {notification.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{notification.body}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </AppShell>
  );
}
