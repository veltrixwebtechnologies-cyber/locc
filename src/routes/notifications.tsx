import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SocialCommerceShell } from "@/components/social-commerce/social-commerce-shell";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { useNotifications } from "@/modules/shopper/services/notifications-store";

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
    <SocialCommerceShell>
      <div className="space-y-4">
        <div>
          <Link
            to="/profile"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#8B2FC9] hover:text-[#581C87]"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Profile
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-[#0F172A]">Notification Settings & History</h1>
          <p className="text-xs text-[#746A85] mt-0.5">Manage alerts for order updates, shop announcements, and offers.</p>
        </div>

        <ul className="overflow-hidden rounded-3xl bg-white border border-[#E2E8F0] shadow-xs">
          {rows.map((r, i) => (
            <li
              key={r.key}
              className={`flex items-center gap-3 p-4 ${i < rows.length - 1 ? "border-b border-[#F8FAFC]" : ""}`}
            >
              <div className="flex-1">
                <p className="text-sm font-bold text-[#0F172A]">{r.label}</p>
                <p className="text-xs text-[#746A85]">{r.desc}</p>
              </div>
              <button
                onClick={() => update(r.key, !prefs[r.key])}
                className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer ${prefs[r.key] ? "bg-[#8B2FC9]" : "bg-gray-200"}`}
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
          <section className="rounded-3xl bg-white p-5 border border-[#E2E8F0] shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#0F172A]">Recent notifications</h2>
              <span className="text-xs font-bold text-[#8B2FC9] bg-purple-50 px-2.5 py-0.5 rounded-full">
                {notificationFeed.unreadCount} unread
              </span>
            </div>
            {notificationFeed.loading ? (
              <p className="mt-3 text-xs text-[#746A85]">Loading notifications…</p>
            ) : notificationFeed.notifications.length === 0 ? (
              <p className="mt-3 text-xs text-[#746A85]">No notifications yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-[#F8FAFC]">
                {notificationFeed.notifications.map((notification) => (
                  <li key={notification.id} className="py-3 first:pt-0 last:pb-0">
                    <button
                      type="button"
                      onClick={() => void notificationFeed.markRead(notification.id)}
                      className="w-full text-left"
                    >
                      <p
                        className={`text-xs font-bold ${notification.read_at ? "text-gray-600" : "text-[#8B2FC9]"}`}
                      >
                        {notification.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[#746A85]">{notification.body}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </SocialCommerceShell>
  );
}
