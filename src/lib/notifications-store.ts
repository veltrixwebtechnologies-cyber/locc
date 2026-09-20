import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  kind: string;
  link?: string | null;
  read_at?: string | null;
  created_at: string;
}

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    let alive = true;
    const load = async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("notifications")
        .select("id,title,body,kind,link,read_at,created_at")
        .eq("recipient_user_id", userId)
        .eq("audience", "customer")
        .order("created_at", { ascending: false })
        .limit(50);
      if (alive && !error) setNotifications(data ?? []);
      if (alive) setLoading(false);
    };

    void load();
    const channel = supabase
      .channel(`customer-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new?.audience !== "customer") return;
          setNotifications((current) => [payload.new, ...current].slice(0, 50));
        },
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markRead = async (notificationId: string) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId ? { ...item, read_at: new Date().toISOString() } : item,
      ),
    );
    const { error } = await (supabase as any)
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("recipient_user_id", userId)
      .is("read_at", null);
    return !error;
  };

  return {
    notifications,
    loading,
    unreadCount: notifications.filter((item) => !item.read_at).length,
    markRead,
  };
}
