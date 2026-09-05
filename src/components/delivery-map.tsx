import { useEffect, useRef, useState } from "react";
import { Clock, Navigation, MapPin, Store, RotateCw } from "lucide-react";
import {
  fetchDeliveryRoute,
  shouldRecalculateRoute,
  type AdvancedRouteResult,
} from "@/lib/map-service/delivery-routing";
import { supabase } from "@/integrations/supabase/client";

export interface LatLng {
  lat: number;
  lng: number;
  label?: string;
  heading?: number;
}

import { getMapTileConfig } from "@/lib/map-provider";

interface Props {
  orderId?: string;
  assignmentId?: string;
  store?: LatLng;
  destination: LatLng | null;
  courier?: LatLng;
  orderStatus?: string;
  accuracyMeters?: number | null;
  interactive?: boolean;
  onDestinationChange?: (p: LatLng) => void;
  className?: string;
  height?: number;
}

function courierScooterSvg(color: string, heading = 0) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36' style='transform: rotate(${heading}deg); transform-origin: center;'>
    <circle cx='18' cy='18' r='16' fill='${color}' stroke='#FFFFFF' stroke-width='2.5' />
    <path d='M12 24 A 3 3 0 0 1 12 18 A 3 3 0 0 1 12 24 M24 24 A 3 3 0 0 1 24 18 A 3 3 0 0 1 24 24 M12 21 L16 14 L20 14 L22 21 L12 21 M18 14 L18 10 L22 10' fill='none' stroke='#FFFFFF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>
    <circle cx='18' cy='7' r='2.5' fill='#FFC107'/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function pinSvg(color: string, iconType: "store" | "destination") {
  const innerSymbol =
    iconType === "store"
      ? `<rect x='10' y='10' width='8' height='6' fill='#FFFFFF'/><path d='M8 10 L14 6 L20 10' fill='none' stroke='#FFFFFF' stroke-width='2'/>`
      : `<circle cx='14' cy='14' r='4' fill='#FFFFFF'/>`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='38' viewBox='0 0 28 38'>
    <path d='M14 0C6.3 0 0 6.3 0 14c0 10.5 14 24 14 24s14-13.5 14-24C28 6.3 21.7 0 14 0z' fill='${color}' stroke='#FFFFFF' stroke-width='1.5'/>
    ${innerSymbol}
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function DeliveryMap({
  orderId,
  assignmentId,
  store,
  destination,
  courier: initialCourier,
  orderStatus = "out_for_delivery",
  accuracyMeters,
  interactive = false,
  onDestinationChange,
  className,
  height = 240,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const polylineRef = useRef<any>(null);

  const [courier, setCourier] = useState<LatLng | undefined>(initialCourier);
  const [routeInfo, setRouteInfo] = useState<AdvancedRouteResult | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secAgo, setSecAgo] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const lastRouteCalculatedAt = useRef<number>(0);
  const lastRoutePos = useRef<LatLng | null>(null);
  const currentPhase = useRef<"to_vendor" | "to_customer">("to_customer");

  // Determine current active route phase
  const phase: "to_vendor" | "to_customer" = [
    "accepted",
    "navigating_to_vendor",
    "reached_vendor",
    "rider_assigned",
    "rider_accepted",
    "rider_at_shop",
  ].includes(orderStatus)
    ? "to_vendor"
    : "to_customer";

  // Keep courier state synced with props
  useEffect(() => {
    if (initialCourier) setCourier(initialCourier);
  }, [initialCourier?.lat, initialCourier?.lng, initialCourier?.heading]);

  // Realtime subscription for customer order tracking
  useEffect(() => {
    if (!orderId && !assignmentId) return;

    const channel = supabase
      .channel(`delivery-map-${orderId || assignmentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "delivery_assignments",
          filter: orderId ? `order_id=eq.${orderId}` : `id=eq.${assignmentId}`,
        },
        (payload: any) => {
          const newRow = payload.new;
          if (newRow?.current_latitude && newRow?.current_longitude) {
            setCourier({
              lat: Number(newRow.current_latitude),
              lng: Number(newRow.current_longitude),
              heading: Number(newRow.current_heading || 0),
            });
            setLastUpdated(new Date());
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, assignmentId]);

  // Timer for "Updated X seconds ago" display
  useEffect(() => {
    const timer = setInterval(() => {
      setSecAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  // Initialize Leaflet Map once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const L = (await import("leaflet")).default;
        await import("leaflet/dist/leaflet.css");
        if (cancelled || !mapContainerRef.current) return;

        LRef.current = L;
        const initialCenter: [number, number] = courier
          ? [courier.lat, courier.lng]
          : destination
            ? [destination.lat, destination.lng]
            : store
              ? [store.lat, store.lng]
              : [11.02, 76.99];

        const map = L.map(mapContainerRef.current, {
          center: initialCenter,
          zoom: 15,
          maxZoom: 18,
          zoomControl: true,
          attributionControl: false,
        });

        const tileConfig = getMapTileConfig();
        L.tileLayer(tileConfig.url, {
          maxZoom: tileConfig.maxZoom,
          subdomains: tileConfig.subdomains,
          attribution: tileConfig.attribution,
        }).addTo(map);

        setTimeout(() => {
          map.invalidateSize();
        }, 100);

        mapRef.current = map;
        setLoading(false);

        if (interactive && onDestinationChange) {
          map.on("click", (e: any) => {
            onDestinationChange({ lat: e.latlng.lat, lng: e.latlng.lng });
          });
        }
      } catch (err) {
        console.error("[DeliveryMap] Leaflet init error", err);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Recalculate OSRM Route dynamically
  useEffect(() => {
    let active = true;
    const origin = courier || (phase === "to_customer" && store ? store : undefined);
    const dest = phase === "to_vendor" && store ? store : destination;

    if (!origin || !dest) return;

    const phaseChanged = currentPhase.current !== phase;
    currentPhase.current = phase;

    const shouldCalc = shouldRecalculateRoute(
      origin,
      lastRoutePos.current,
      routeInfo?.geometry || null,
      lastRouteCalculatedAt.current,
      phaseChanged,
    );

    if (!shouldCalc && routeInfo) return;

    (async () => {
      const res = await fetchDeliveryRoute(origin, dest, phase);
      if (active && res) {
        setRouteInfo(res);
        lastRouteCalculatedAt.current = Date.now();
        lastRoutePos.current = origin;
      }
    })();

    return () => {
      active = false;
    };
  }, [
    courier?.lat,
    courier?.lng,
    destination?.lat,
    destination?.lng,
    store?.lat,
    store?.lng,
    phase,
  ]);

  // Sync Leaflet markers and route polyline with animation
  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;

    // Helper: update or animate marker
    const upsertMarker = (
      id: string,
      pos: LatLng | undefined,
      iconUrl: string,
      size: [number, number],
    ) => {
      if (!pos) {
        if (markersRef.current[id]) {
          map.removeLayer(markersRef.current[id]);
          delete markersRef.current[id];
        }
        return;
      }

      let m = markersRef.current[id];
      const icon = L.icon({
        iconUrl,
        iconSize: size,
        iconAnchor: [size[0] / 2, size[1]],
      });

      if (!m) {
        m = L.marker([pos.lat, pos.lng], { icon }).addTo(map);
        markersRef.current[id] = m;
      } else {
        m.setIcon(icon);
        const startLatLng = m.getLatLng();
        const startTime = performance.now();
        const duration = 400; // smooth 400ms transition

        const animate = (now: number) => {
          const t = Math.min(1, (now - startTime) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          m.setLatLng([
            startLatLng.lat + (pos.lat - startLatLng.lat) * eased,
            startLatLng.lng + (pos.lng - startLatLng.lng) * eased,
          ]);
          if (t < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    };

    // Render markers
    if (store) upsertMarker("store", store, pinSvg("#2A6F77", "store"), [28, 38]);
    if (destination) {
      upsertMarker("dest", destination, pinSvg("#E3A72E", "destination"), [28, 38]);
    }
    if (courier)
      upsertMarker(
        "courier",
        courier,
        courierScooterSvg("#D9584C", courier.heading || 0),
        [36, 36],
      );

    // Render road polyline
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    if (routeInfo?.geometry && routeInfo.geometry.length > 0) {
      const latLngs = routeInfo.geometry.map(([lng, lat]) => [lat, lng]);
      polylineRef.current = L.polyline(latLngs, {
        color: phase === "to_vendor" ? "#2A6F77" : "#E3A72E",
        weight: 4,
        opacity: 0.85,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      map.fitBounds(polylineRef.current.getBounds(), { padding: [40, 40] });
    }
  }, [store, destination, courier, routeInfo, phase]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ring-1 ring-black/10 shadow-md ${className ?? ""}`}
      style={{ height }}
    >
      <div ref={mapContainerRef} className="h-full w-full bg-slate-100" />

      {/* Floating Status & Route Summary Banner */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between rounded-xl bg-slate-900/90 px-3.5 py-2 text-white shadow-lg backdrop-blur-md ring-1 ring-white/10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium">
            {phase === "to_vendor" ? "Partner going to shop 🏪" : "Partner on the way to you 🛵"}
          </span>
        </div>

        {routeInfo && (
          <div className="flex items-center gap-3 text-xs font-mono font-semibold text-emerald-300">
            <span>{routeInfo.formattedDistance}</span>
            <span>·</span>
            <span>~{routeInfo.formattedDuration}</span>
          </div>
        )}
      </div>

      {/* Bottom Live Update Status Indicator */}
      <div className="absolute bottom-2 right-2 z-[400] rounded-lg bg-slate-900/80 px-2.5 py-1 font-mono text-[10px] text-slate-300 backdrop-blur-sm">
        Updated {secAgo}s ago
      </div>
    </div>
  );
}
