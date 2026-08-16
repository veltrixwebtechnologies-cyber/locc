import { MapPin, Navigation, Store } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  store?: LatLng & { label?: string };
  destination: LatLng & { label?: string };
  courier?: LatLng & { label?: string };
  accuracyMeters?: number | null;
  interactive?: boolean;
  onDestinationChange?: (p: LatLng) => void;
  className?: string;
  height?: number;
}

function FallbackMap({
  store,
  destination,
  courier,
  error,
}: {
  store?: LatLng & { label?: string };
  destination: LatLng & { label?: string };
  courier?: LatLng & { label?: string };
  error?: string | null;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[color-mix(in_oklab,var(--teal)_12%,var(--sand))]">
      <svg
        className="absolute inset-0 h-full w-full opacity-80"
        viewBox="0 0 400 220"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <pattern id="localshore-map-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path
              d="M28 0H0V28"
              fill="none"
              stroke="var(--teal)"
              strokeOpacity="0.13"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="400" height="220" fill="url(#localshore-map-grid)" />
        <path
          d="M0 160 C 70 130, 95 172, 150 130 S 225 70, 290 88 S 365 140, 400 96"
          fill="none"
          stroke="var(--marigold)"
          strokeDasharray="8 8"
          strokeLinecap="round"
          strokeWidth="4"
        />
      </svg>
      <div className="absolute left-[18%] top-[62%] grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm ring-2 ring-card">
        <Store className="h-4 w-4" />
      </div>
      {courier && (
        <div className="delivery-pulse absolute left-[52%] top-[42%] grid h-8 w-8 place-items-center rounded-full bg-[var(--coral)] text-primary-foreground shadow-sm ring-2 ring-card">
          <Navigation className="h-4 w-4" />
        </div>
      )}
      <div className="absolute right-[18%] top-[20%] grid h-8 w-8 place-items-center rounded-full bg-[var(--marigold)] text-foreground shadow-sm ring-2 ring-card">
        <MapPin className="h-4 w-4" />
      </div>
      <div className="absolute inset-x-3 bottom-3 rounded-lg bg-card/90 p-3 shadow-sm ring-1 ring-black/[0.04] backdrop-blur">
        <p className="text-xs font-medium text-foreground">Map preview unavailable</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {error ?? "Your location and delivery address still work; this is a safe route preview."}
        </p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {store?.label ? `${store.label} → ` : ""}
          {destination.label ?? "Drop-off"} · {destination.lat.toFixed(4)},{" "}
          {destination.lng.toFixed(4)}
        </p>
      </div>
    </div>
  );
}

// Colored circular pin as an SVG data URL (matches Local Shore palette).
function pinSvg(color: string) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='40' viewBox='0 0 28 40'><path d='M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z' fill='${color}' stroke='#1F4A50' stroke-width='1.5'/><circle cx='14' cy='14' r='5' fill='#F2E8D5'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function DeliveryMap({
  store,
  destination,
  courier,
  accuracyMeters,
  interactive = false,
  onDestinationChange,
  className,
  height = 200,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Record<string, any>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accuracyRef = useRef<any>(null);
  const tilesLoadedRef = useRef(false);
  const cbRef = useRef(onDestinationChange);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cbRef.current = onDestinationChange;
  }, [onDestinationChange]);

  // Initialize the map once (client-only dynamic import so SSR never touches Leaflet).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const L = (await import("leaflet")).default;
        await import("leaflet/dist/leaflet.css");
        if (cancelled || !ref.current) return;
        LRef.current = L;
        const map = L.map(ref.current, {
          center: [destination.lat, destination.lng],
          zoom: 14,
          zoomControl: true,
          attributionControl: true,
        });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          crossOrigin: true,
        })
          .on("load", () => {
            tilesLoadedRef.current = true;
            setLoading(false);
            setError(null);
          })
          .on("tileerror", () => {
            if (!tilesLoadedRef.current) {
              setLoading(false);
              setError("Map tiles could not be loaded. Check your network and retry.");
            }
          })
          .addTo(map);
        mapRef.current = map;
        window.setTimeout(() => map.invalidateSize(), 0);
        window.setTimeout(() => map.invalidateSize(), 250);

        if (interactive) {
          map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
            cbRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
          });
        }
      } catch (err) {
        if (cancelled) return;
        setLoading(false);
        setError((err as Error).message ?? "Map failed to load");
      }
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove?.();
      mapRef.current = null;
      markersRef.current = {};
      lineRef.current = null;
      accuracyRef.current = null;
      tilesLoadedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync markers + polyline whenever positions change.
  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;

    const upsert = (id: string, pos: LatLng | undefined, color: string, draggable = false) => {
      if (!pos) {
        if (markersRef.current[id]) {
          map.removeLayer(markersRef.current[id]);
          delete markersRef.current[id];
        }
        return;
      }
      let m = markersRef.current[id];
      if (!m) {
        const icon = L.icon({
          iconUrl: pinSvg(color),
          iconSize: [28, 40],
          iconAnchor: [14, 40],
        });
        m = L.marker([pos.lat, pos.lng], { icon, draggable }).addTo(map);
        markersRef.current[id] = m;
        if (draggable) {
          m.on("dragend", () => {
            const p = m.getLatLng();
            cbRef.current?.({ lat: p.lat, lng: p.lng });
          });
        }
      } else {
        const current = m.getLatLng();
        const started = performance.now();
        const duration = 520;
        const animate = (now: number) => {
          const t = Math.min(1, (now - started) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          m.setLatLng([
            current.lat + (pos.lat - current.lat) * eased,
            current.lng + (pos.lng - current.lng) * eased,
          ]);
          if (t < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    };

    upsert("store", store, "#2A6F77");
    upsert("dest", destination, "#E3A72E", interactive);
    upsert("courier", courier, "#D9584C");

    if (accuracyRef.current) {
      map.removeLayer(accuracyRef.current);
      accuracyRef.current = null;
    }
    if (interactive && typeof accuracyMeters === "number" && Number.isFinite(accuracyMeters)) {
      accuracyRef.current = L.circle([destination.lat, destination.lng], {
        radius: accuracyMeters,
        color: "#6D28D9",
        weight: 1.5,
        fillColor: "#6D28D9",
        fillOpacity: 0.12,
        opacity: 0.55,
      }).addTo(map);
    }

    // In interactive (address-picking) mode, focus the map on the destination
    // only — don't zoom out to include a far-away store, which makes the pin
    // look mislocated.
    const routePoints = interactive
      ? ([courier, destination].filter(Boolean) as LatLng[])
      : ([store, courier, destination].filter(Boolean) as LatLng[]);
    if (lineRef.current) {
      map.removeLayer(lineRef.current);
      lineRef.current = null;
    }
    if (!interactive && routePoints.length >= 2) {
      lineRef.current = L.polyline(
        routePoints.map((p) => [p.lat, p.lng]),
        { color: "#E3A72E", weight: 3, dashArray: "6 8", opacity: 0.9 },
      ).addTo(map);
      map.fitBounds(lineRef.current.getBounds(), { padding: [40, 40] });
    } else {
      const zoom =
        typeof accuracyMeters === "number"
          ? accuracyMeters <= 30
            ? 18
            : accuracyMeters <= 100
              ? 17
              : 16
          : 17;
      map.setView([destination.lat, destination.lng], zoom);
      console.info("[geo] map recentered", {
        lat: destination.lat,
        lng: destination.lng,
        zoom,
        accuracyMeters,
      });
    }
    window.setTimeout(() => map.invalidateSize(), 0);
  }, [store, destination, courier, accuracyMeters, interactive]);

  return (
    <div
      className={
        "relative overflow-hidden rounded-xl ring-1 ring-black/[0.04] " + (className ?? "")
      }
      style={{ height }}
    >
      <div ref={ref} className="h-full w-full" />
      {(loading || error) && (
        <FallbackMap
          store={store}
          destination={destination}
          courier={courier}
          error={loading ? "Loading map preview…" : error}
        />
      )}
    </div>
  );
}
