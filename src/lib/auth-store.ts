import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AuthState {
  id: string | null;
  phone: string | null;
  email: string | null;
  name: string;
}

const EMPTY_AUTH: AuthState = { id: null, phone: null, email: null, name: "Guest" };
let state = EMPTY_AUTH;
let initialized = false;
const listeners = new Set<() => void>();

function fromUser(user: { id?: string; phone?: string | null; email?: string | null; user_metadata?: Record<string, unknown> } | null): AuthState {
  const displayName = typeof user?.user_metadata?.display_name === "string"
    ? user.user_metadata.display_name
    : typeof user?.user_metadata?.name === "string"
      ? user.user_metadata.name
      : user?.email?.split("@")[0] ?? "Guest";
  return {
    id: user?.id ?? null,
    phone: user?.phone ?? null,
    email: user?.email ?? null,
    name: displayName || "Guest",
  };
}

function setState(next: AuthState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function ensureAuthSubscription() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  supabase.auth.onAuthStateChange((_event, session) => setState(fromUser(session?.user ?? null)));
  void supabase.auth.getSession().then(({ data }) => setState(fromUser(data.session?.user ?? null)));
}

export const authStore = {
  subscribe(listener: () => void) {
    ensureAuthSubscription();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot() {
    ensureAuthSubscription();
    return state;
  },
  isSignedIn() {
    ensureAuthSubscription();
    return Boolean(state.phone || state.email);
  },
};

export const useAuth = () => {
  const [snapshot, setSnapshot] = useState<AuthState>(EMPTY_AUTH);
  useEffect(() => {
    ensureAuthSubscription();
    setSnapshot(state);
    const listener = () => setSnapshot(state);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return snapshot;
};
