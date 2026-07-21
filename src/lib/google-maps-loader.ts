/// <reference types="google.maps" />
// Singleton loader for the Google Maps JS API (browser-only).
// Uses the Lovable-managed browser key + tracking channel.

declare global {
  interface Window {
    google?: typeof google;
    __localshoreMapsInit?: () => void;
    gm_authFailure?: () => void;
  }
}

let promise: Promise<typeof google> | null = null;

export function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser"));
  }
  if (window.google?.maps) return Promise.resolve(window.google);
  if (promise) return promise;

  const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
  const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as
    | string
    | undefined;
  if (!key) return Promise.reject(new Error("Google Maps browser key missing"));

  promise = new Promise((resolve, reject) => {
    window.gm_authFailure = () => {
      window.dispatchEvent(new CustomEvent("localshore:maps-auth-failure"));
      reject(
        new Error("Map preview unavailable — the Google Maps key is not allowed on this domain."),
      );
    };
    window.__localshoreMapsInit = () => {
      if (window.google?.maps) resolve(window.google);
      else reject(new Error("Google Maps failed to initialize"));
    };
    const s = document.createElement("script");
    const params = new URLSearchParams({
      key,
      loading: "async",
      callback: "__localshoreMapsInit",
      libraries: "marker",
    });
    if (channel) params.set("channel", channel);
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.async = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(s);
  });

  return promise;
}
