import { useEffect, useState } from "react";

interface AuthState {
  phone: string | null;
  email: string | null;
  name: string;
}

const KEY = "localshore.auth.v1";

const EMPTY_AUTH: AuthState = { phone: null, email: null, name: "Guest" };
let state: AuthState = EMPTY_AUTH;
let hydrated = false;
const listeners = new Set<() => void>();

const persist = () => {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
};
const ensure = () => {
  if (hydrated || typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { phone: null, email: null, name: "Guest", ...parsed };
    }
  } catch {
    state = EMPTY_AUTH;
  }
  hydrated = true;
};

export const authStore = {
  subscribe(l: () => void) {
    ensure();
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot() {
    ensure();
    return state;
  },
  isSignedIn() {
    ensure();
    return !!(state.phone || state.email);
  },
  signIn(phone: string) {
    state = { ...state, phone };
    persist();
  },
  signInEmail(email: string, name?: string) {
    state = { ...state, email, name: name || state.name || "Guest" };
    persist();
  },
  setName(name: string) {
    state = { ...state, name };
    persist();
  },
  signOut() {
    state = { phone: null, email: null, name: "Guest" };
    persist();
  },
};

// Mount-aware hook: SSR always renders the empty state, and after mount we
// read localStorage and subscribe. This avoids useSyncExternalStore's
// reference-equality trap where the server snapshot and initial client
// snapshot are the same `EMPTY_AUTH` object, which suppresses re-renders
// after hydration even though localStorage says the user is signed in.
export const useAuth = () => {
  const [snapshot, setSnapshot] = useState<AuthState>(EMPTY_AUTH);
  useEffect(() => {
    ensure();
    setSnapshot(state);
    const l = () => setSnapshot(state);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return snapshot;
};
