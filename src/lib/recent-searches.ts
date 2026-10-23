import { useEffect, useState } from "react";

const STORAGE_KEY = "localshore_recent_searches_v1";
const MAX_RECENT_SEARCHES = 8;
const CHANGE_EVENT = "localshore_recent_searches_changed";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getRecentSearches(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .slice(0, MAX_RECENT_SEARCHES);
    }
  } catch {
    // Ignore JSON errors
  }
  return [];
}

function notifyChange() {
  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  }
}

export function addRecentSearch(rawQuery: string): void {
  const query = rawQuery.trim();
  if (!query || !isBrowser()) return;

  try {
    const current = getRecentSearches();
    const filtered = current.filter((item) => item.toLowerCase() !== query.toLowerCase());
    const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyChange();
  } catch {
    // Ignore storage quota or security errors
  }
}

export function removeRecentSearch(rawQuery: string): void {
  const query = rawQuery.trim();
  if (!query || !isBrowser()) return;

  try {
    const current = getRecentSearches();
    const updated = current.filter((item) => item.toLowerCase() !== query.toLowerCase());
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyChange();
  } catch {
    // Ignore storage errors
  }
}

export function clearRecentSearches(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    notifyChange();
  } catch {
    // Ignore storage errors
  }
}

export function useRecentSearches(): {
  recentSearches: string[];
  addSearch: (q: string) => void;
  removeSearch: (q: string) => void;
  clearSearches: () => void;
} {
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches());

  useEffect(() => {
    setRecentSearches(getRecentSearches());

    const handleUpdate = () => {
      setRecentSearches(getRecentSearches());
    };

    window.addEventListener(CHANGE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(CHANGE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return {
    recentSearches,
    addSearch: addRecentSearch,
    removeSearch: removeRecentSearch,
    clearSearches: clearRecentSearches,
  };
}
