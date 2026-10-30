/// <reference types="google.maps" />
/**
 * LocalShore Centralized Map Configuration & Settings
 *
 * All map settings, visual styles, UI controls, marker artwork, and default coordinates
 * are centralized here. This ensures that:
 * 1. Changing the Google Maps API key preserves the exact same visual styling and options.
 * 2. Any map view (Shop Discovery, Address Picker, Courier Live Tracking) has identical settings.
 * 3. Graceful fallback to Leaflet/OSM preserves the exact same coordinates and marker data.
 */

declare global {
  interface Window {
    __LOCALSHORE_MAPS_KEY__?: string;
  }
}

/**
 * Standard Bangalore City Center coordinates
 */
export const DEFAULT_MAP_CENTER = {
  lat: 12.9716,
  lng: 77.5946,
  city: "Bangalore",
  state: "Karnataka",
};

/**
 * Unified zoom level standards across the application
 */
export const DEFAULT_MAP_ZOOM = {
  city: 13.5,
  discovery: 14,
  delivery: 15,
  picker: 18,
};

/**
 * Brand-aligned, ultra-clean Google Maps TypeStyle palette.
 * Strips all external POIs (businesses, schools, restaurants, transit clutter)
 * so that only LocalShore's verified shops and delivery indicators are prominent.
 */
export const LOCALSHORE_MAP_STYLES: google.maps.MapTypeStyle[] = [
  // 1. Completely hide third-party POIs (businesses, schools, parks, etc.)
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.school", stylers: [{ visibility: "off" }] },
  { featureType: "poi.medical", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", stylers: [{ visibility: "off" }] },
  { featureType: "poi.government", stylers: [{ visibility: "off" }] },
  { featureType: "poi.attraction", stylers: [{ visibility: "off" }] },
  { featureType: "poi.place_of_worship", stylers: [{ visibility: "off" }] },
  { featureType: "poi.sports_complex", stylers: [{ visibility: "off" }] },

  // 2. Hide transit clutter (bus stops, train stations, ferry lines)
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "transit.station", stylers: [{ visibility: "off" }] },
  { featureType: "transit.line", stylers: [{ visibility: "off" }] },

  // 3. Gentle, modern landscape geometry (soft lavender-grey tones)
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#F4EFF7" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#FAF7FC" }] },
  { featureType: "landscape.natural.landcover", elementType: "geometry", stylers: [{ color: "#F7F2FA" }] },

  // 4. Calm, clean water bodies
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#E9F3FA" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#8AA5BA" }] },

  // 5. Crisp white roads with subtle lavender outlines and legible grey typography
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#EEE7F3" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#7D7485" }] },
  { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#FAF7FC" }, { weight: 1 }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#887D92" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#6D6179" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#E5DBEC" }] },

  // 6. Refined boundary and administrative typography
  { featureType: "administrative", elementType: "labels.text.stroke", stylers: [{ color: "#FAF7FC" }, { weight: 1 }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#5F5568" }] },
  { featureType: "administrative.neighborhood", elementType: "labels.text.fill", stylers: [{ color: "#7A6E85" }] },
];

/**
 * Standard Google Maps UI controls and behavior settings.
 * Disables unwanted Pegman, Satellite switchers, and ensures smooth touch navigation.
 */
export const LOCALSHORE_MAP_OPTIONS: Partial<google.maps.MapOptions> = {
  backgroundColor: "#FAF7FC",
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  gestureHandling: "greedy",
  maxZoom: 21,
  minZoom: 3,
};

/**
 * Factory helper: combines base LocalShore options and custom styles with any component overrides.
 */
export function getGoogleMapOptions(
  overrides: google.maps.MapOptions = {},
): google.maps.MapOptions {
  return {
    ...LOCALSHORE_MAP_OPTIONS,
    styles: LOCALSHORE_MAP_STYLES,
    ...overrides,
  };
}

/**
 * Retrieve active Google Maps API key from runtime override, localStorage, or .env.local
 */
export function getGoogleMapsApiKey(): string {
  if (typeof window !== "undefined") {
    if (window.__LOCALSHORE_MAPS_KEY__ && window.__LOCALSHORE_MAPS_KEY__.trim()) {
      return window.__LOCALSHORE_MAPS_KEY__.trim();
    }
    try {
      const stored = localStorage.getItem("LOCALSHORE_MAPS_API_KEY");
      if (stored && stored.trim()) {
        return stored.trim();
      }
    } catch {
      // Ignore localStorage access restriction
    }
  }

  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  return (envKey || "").trim();
}

/**
 * Dynamically configure or update the Google Maps API key.
 * Dispatches an event and clears loader cache so maps reload with the new key.
 */
export function setGoogleMapsApiKey(key: string): void {
  const trimmed = (key || "").trim();
  if (typeof window !== "undefined") {
    window.__LOCALSHORE_MAPS_KEY__ = trimmed;
    try {
      if (trimmed) {
        localStorage.setItem("LOCALSHORE_MAPS_API_KEY", trimmed);
      } else {
        localStorage.removeItem("LOCALSHORE_MAPS_API_KEY");
      }
    } catch {
      // Ignore
    }
    window.dispatchEvent(
      new CustomEvent("localshore:map-key-changed", { detail: { key: trimmed } }),
    );
  }
}

/**
 * Returns true if a Google Maps API key is configured
 */
export function hasGoogleMapsKey(): boolean {
  return Boolean(getGoogleMapsApiKey());
}

/**
 * Branded SVG delivery entrance pin
 */
export function deliveryPinSvg(): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='58' viewBox='0 0 48 58'>
    <path d='M24 56C20 47 7 37 7 23a17 17 0 1 1 34 0c0 14-13 24-17 33Z' fill='#981495' stroke='#FFFFFF' stroke-width='3'/>
    <circle cx='24' cy='22' r='7' fill='#FFFFFF'/><circle cx='24' cy='22' r='3' fill='#981495'/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/**
 * Branded Courier live-tracking scooter SVG
 */
export function courierScooterSvg(color = "#981495", heading = 0): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36' style='transform: rotate(${heading}deg); transform-origin: center;'>
    <circle cx='18' cy='18' r='16' fill='${color}' stroke='#FFFFFF' stroke-width='2.5' />
    <path d='M12 24 A 3 3 0 0 1 12 18 A 3 3 0 0 1 12 24 M24 24 A 3 3 0 0 1 24 18 A 3 3 0 0 1 24 24 M12 21 L16 14 L20 14 L22 21 L12 21 M18 14 L18 10 L22 10' fill='none' stroke='#FFFFFF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>
    <circle cx='18' cy='7' r='2.5' fill='#FFC107'/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Store cluster pin icon for grouped shops
 */
export function shopClusterIcon(count: number) {
  const size = 58;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="29" cy="29" r="27" fill="#981495" fill-opacity=".14"/>
    <circle cx="29" cy="29" r="20" fill="#981495" fill-opacity=".24"/>
    <circle cx="29" cy="14" r="14" fill="#981495" stroke="#fff" stroke-width="3"/>
    <text x="29" y="34" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="700" fill="#fff">${count}</text>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: typeof google !== "undefined" && google?.maps ? new google.maps.Size(size, size) : undefined,
    anchor: typeof google !== "undefined" && google?.maps ? new google.maps.Point(size / 2, size / 2) : undefined,
  };
}

/**
 * Compact shop marker for dense map regions
 */
export function compactShopIcon(isDemo = false, isSelected = false, isImported = false) {
  const fill = isSelected ? "#6E0D70" : isImported ? "#2878A5" : isDemo ? "#A437A0" : "#981495";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="50" viewBox="0 0 42 50">
    <circle cx="21" cy="20" r="19" fill="${fill}" fill-opacity=".15"/>
    <path d="M21 46C18 39 7 30 7 19a14 14 0 1 1 28 0c0 11-11 20-14 27Z" fill="${fill}" stroke="#fff" stroke-width="3"/>
    <path d="M14 19h14l-1.5 2.5v7h-11v-7L14 19Zm2-1 1.5-3h7l1.5 3m-6 5v4m3-4v4" fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: typeof google !== "undefined" && google?.maps ? new google.maps.Size(42, 50) : undefined,
    anchor: typeof google !== "undefined" && google?.maps ? new google.maps.Point(21, 48) : undefined,
  };
}
