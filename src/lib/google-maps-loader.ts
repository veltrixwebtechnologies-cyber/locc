/// <reference types="google.maps" />
// Singleton loader for the Google Maps JS API (browser-only).
// Uses the explicitly configured public browser key or runtime key.
// Preserves unified LocalShore settings regardless of which key is active.

import { getGoogleMapsApiKey } from "./map-settings";

declare global {
  interface Window {
    google?: typeof google;
    __localshoreMapsInit?: () => void;
    gm_authFailure?: () => void;
  }
}

let promise: Promise<typeof google> | null = null;
let loadedKey: string | null = null;
let authFailed = false;

export function isGoogleMapsAuthFailed(): boolean {
  return false;
}

export function resetGoogleMapsLoader(): void {
  promise = null;
  loadedKey = null;
  authFailed = false;
  if (typeof document !== "undefined") {
    const scripts = document.querySelectorAll<HTMLScriptElement>('script[src*="maps.googleapis.com"]');
    scripts.forEach((s) => s.remove());
  }
}

export function triggerGoogleMapsAuthFailure(): void {
  // No-op: OpenStreetMap has been fully removed. Google Maps is the exclusive map provider.
}

if (typeof window !== "undefined") {
  window.addEventListener("localshore:map-key-changed", () => {
    resetGoogleMapsLoader();
  });
}

export function loadGoogleMaps(overrideKey?: string): Promise<typeof google> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser"));
  }

  const key = (overrideKey || getGoogleMapsApiKey()).trim();

  // If auth previously failed for this key, reject immediately so consumers fall back without delay
  if (authFailed) {
    return Promise.reject(
      new Error(
        "Google Maps authentication failed on this domain (gm_authFailure).",
      ),
    );
  }

  // If already loaded with the same key, resolve immediately
  if (window.google?.maps && loadedKey === key) {
    return Promise.resolve(window.google);
  }

  // If the key has changed, reset the previous loader cache
  if (loadedKey && loadedKey !== key) {
    resetGoogleMapsLoader();
  }

  if (promise) return promise;

  if (!key) {
    return Promise.reject(
      new Error(
        "Google Maps browser key missing. Please configure VITE_GOOGLE_MAPS_API_KEY in .env.local.",
      ),
    );
  }

  promise = new Promise((resolve, reject) => {
    let settled = false;

    window.__localshoreMapsInit = () => {
      if (settled) return;
      if (window.google?.maps) {
        settled = true;
        loadedKey = key;
        resolve(window.google);
      } else {
        settled = true;
        promise = null;
        reject(new Error("Google Maps failed to initialize"));
      }
    };

    const s = document.createElement("script");
    const params = new URLSearchParams({
      key,
      loading: "async",
      callback: "__localshoreMapsInit",
      libraries: "marker",
    });
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.async = true;
    s.onerror = () => {
      if (settled) return;
      settled = true;
      promise = null; // Allow retry on key correction
      reject(new Error("Failed to load Google Maps script"));
    };

    document.head.appendChild(s);
  });

  return promise;
}

