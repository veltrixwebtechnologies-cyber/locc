import { RouteRequest } from "@/lib/route-request";
import { parseCoordinates } from "@/lib/coordinates";
import { assignmentLocation } from "@/lib/tracking-location";
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
  const mountedRef = useRef(true);
  const cameraTarget = useRef("");

  const [courier, setCourier] = useState<LatLng | undefined>(undefined);
  const [routeInfo, setRouteInfo] = useState<AdvancedRouteResult | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date(0));
  const [secAgo, setSecAgo] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const lastRouteCalculatedAt = useRef<number>(0);
  const lastRoutePos = useRef<LatLng | null>(null);
  const requests = useRef(new RouteRequest());
  const routeEndpoint = useRef("");
  const lastRouteAttempt = useRef(0);
  const [routeError, setRouteError] = useState("");
  const destinationCallback = useRef(onDestinationChange);
  destinationCallback.current = onDestinationChange;
  useEffect(() => () => requests.current.cancel(), []);

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

  // Subscribe only to the selected order/assignment. Never consume arbitrary partner updates.
  useEffect(() => {
    let alive = true,
      polling = false;
    let latest: any = null;
    let newestCapture = 0;
    let revision = 0;
    setCourier(undefined);
    setLastUpdated(new Date(0));
    if (!orderId && !assignmentId) {
      if (initialCourier && parseCoordinates(initialCourier.lat, initialCourier.lng))
        setCourier(initialCourier);
      return;
    }
    const accept = (row: any) => {
      if (!alive) return;
      const capture = Date.parse(row?.last_location_update_at ?? "");
      if (Number.isFinite(capture) && capture < newestCapture) return;
      const location = assignmentLocation(row);
      if (Number.isFinite(capture)) newestCapture = capture;
      latest = row;
      setCourier(location ?? undefined);
      if (location) setLastUpdated(new Date(location.capturedAt));
    };
    const channel = supabase
      .channel("delivery-map-" + (assignmentId || orderId))
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "delivery_assignments",
          filter: assignmentId ? "id=eq." + assignmentId : "order_id=eq." + orderId,
        },
        (payload: any) => {
          revision++;
          accept(payload.new);
        },
      )
      .subscribe();
    const poll = async () => {
      if (!alive || polling) return;
      polling = true;
      const started = revision;
      try {
        const query = (supabase as any)
          .from("delivery_assignments")
          .select(
            "current_latitude,current_longitude,current_heading,last_location_update_at,status",
          )
          .in("status", [
            "accepted",
            "navigating_to_vendor",
            "reached_vendor",
            "picked_up",
            "out_for_delivery",
          ]);
        if (assignmentId) query.eq("id", assignmentId);
        else query.eq("order_id", orderId);
        const { data, error } = await query
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!error && started === revision) accept(data);
      } catch {
        /* Keep the last capture time; expiry hides an old fix. */
      } finally {
        polling = false;
      }
    };
    void poll();
    const pollTimer = setInterval(() => void poll(), 10000);
    const expiry = setInterval(() => {
      if (alive && !assignmentLocation(latest)) setCourier(undefined);
    }, 1000);
    return () => {
      alive = false;
      clearInterval(pollTimer);
      clearInterval(expiry);
      supabase.removeChannel(channel);
    };
  }, [
    orderId,
    assignmentId,
    orderId || assignmentId ? undefined : initialCourier?.lat,
    orderId || assignmentId ? undefined : initialCourier?.lng,
  ]);

  // Timer for "Updated X seconds ago" display
  useEffect(() => {
    const timer = setInterval(() => {
      setSecAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  // Initialize Leaflet Map once
  useEffect(() => {
    mountedRef.current = true;
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
          attributionControl: true,
        });

        const tileConfig = getMapTileConfig();
        L.tileLayer(tileConfig.url, {
          maxZoom: tileConfig.maxZoom,
          subdomains: tileConfig.subdomains,
          attribution: tileConfig.attribution,
        }).addTo(map);

        setTimeout(() => {
          if (!cancelled) map.invalidateSize();
        }, 100);

        mapRef.current = map;
        setLoading(false);

        if (interactive) {
          map.on("click", (e: any) => {
            destinationCallback.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
          });
        }
      } catch (err) {
        console.error("[DeliveryMap] Leaflet init error", err);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const origin = courier;
    const dest = phase === "to_vendor" ? store : destination;
    const endpoint = [orderId, assignmentId, phase, dest?.lat, dest?.lng].join(":");
    const changed = routeEndpoint.current !== endpoint;
    if (changed) {
      requests.current.cancel();
      setRouteInfo(null);
      setRouteError("");
    }
    routeEndpoint.current = endpoint;
    if (
      !origin ||
      !dest ||
      !parseCoordinates(origin.lat, origin.lng) ||
      !parseCoordinates(dest.lat, dest.lng)
    ) {
      requests.current.cancel();
      setRouteInfo(null);
      return;
    }
    if (!changed && (requests.current.busy || Date.now() - lastRouteAttempt.current < 10000))
      return;
    if (
      !changed &&
      !shouldRecalculateRoute(
        origin,
        lastRoutePos.current,
        routeInfo?.geometry ?? null,
        lastRouteCalculatedAt.current,
        false,
      )
    )
      return;
    lastRouteAttempt.current = Date.now();
    void requests.current.run(
      (signal) => fetchDeliveryRoute(origin, dest, phase, 1, signal),
      (result) => {
        setRouteInfo(result);
        setRouteError("");
        lastRouteCalculatedAt.current = Date.now();
        lastRoutePos.current = origin;
      },
      (error) => {
        setRouteInfo(null);
        setRouteError(error instanceof Error ? error.message : "Road routing unavailable.");
      },
    );
  }, [
    orderId,
    assignmentId,
    courier?.lat,
    courier?.lng,
    destination?.lat,
    destination?.lng,
    store?.lat,
    store?.lng,
    phase,
    secAgo,
  ]);

  useEffect(() => {
    const map = mapRef.current,
      L = LRef.current;
    if (
      !map ||
      !L ||
      !interactive ||
      !destination ||
      !parseCoordinates(destination.lat, destination.lng) ||
      typeof accuracyMeters !== "number" ||
      !Number.isFinite(accuracyMeters) ||
      accuracyMeters <= 0
    )
      return;
    const circle = L.circle([destination.lat, destination.lng], {
      className: "gps-accuracy-circle",
      radius: accuracyMeters,
      color: "#7c3aed",
      weight: 1,
      fillOpacity: 0.12,
      interactive: false,
    }).addTo(map);
    return () => circle.remove();
  }, [destination?.lat, destination?.lng, accuracyMeters, interactive, loading]);

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
      if (!pos || !parseCoordinates(pos.lat, pos.lng)) {
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
        m = L.marker([pos.lat, pos.lng], { icon, draggable: interactive && id === "dest" }).addTo(
          map,
        );
        markersRef.current[id] = m;
        if (interactive && id === "dest") {
          const notify = () => {
            const pin = m.getLatLng();
            destinationCallback.current?.({ lat: pin.lat, lng: pin.lng });
          };
          m.on("dragstart", () => {
            m.deliveryPinDragging = true;
            notify();
          });
          m.on("dragend", () => {
            m.deliveryPinDragging = false;
            notify();
          });
        }
      } else {
        if (interactive && id === "dest") {
          if (!m.deliveryPinDragging) m.setLatLng([pos.lat, pos.lng]);
          return;
        }
        m.setIcon(icon);
        const startLatLng = m.getLatLng();
        const startTime = performance.now();
        const duration = 400; // smooth 400ms transition

        const animate = (now: number) => {
          if (!mountedRef.current || !mapRef.current) return;
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
    upsertMarker("store", store, pinSvg("#2A6F77", "store"), [28, 38]);
    {
      upsertMarker("dest", destination ?? undefined, pinSvg("#E3A72E", "destination"), [28, 38]);
    }
    upsertMarker("courier", courier, courierScooterSvg("#D9584C", courier?.heading || 0), [36, 36]);

    if (interactive && destination && parseCoordinates(destination.lat, destination.lng)) {
      const key = destination.lat + ":" + destination.lng;
      if (cameraTarget.current !== key) {
        cameraTarget.current = key;
        map.setView([destination.lat, destination.lng], 17);
      }
    }

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
  }, [store, destination, courier, routeInfo, phase, loading]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ring-1 ring-black/10 shadow-md isolate z-0 ${className ?? ""}`}
      style={{ height }}
    >
      {routeError && (
        <p
          role="status"
          className="absolute bottom-8 left-3 right-3 z-[400] rounded bg-white p-3 text-sm text-amber-700"
        >
          {routeError} No road route is displayed.
        </p>
      )}
      <div ref={mapContainerRef} className="h-full w-full bg-slate-100" />

      {/* Floating Status & Route Summary Banner */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between rounded-xl bg-slate-900/90 px-3.5 py-2 text-white shadow-lg backdrop-blur-md ring-1 ring-white/10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium">
            {interactive
              ? "Select the delivery entrance"
              : !courier
                ? "Waiting for fresh delivery partner location"
                : phase === "to_vendor"
                  ? "Partner going to shop 🏪"
                  : "Partner on the way to you 🛵"}
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
        {interactive
          ? typeof accuracyMeters === "number"
            ? `Device accuracy ±${Math.round(accuracyMeters)} m`
            : "Confirm the entrance pin"
          : lastUpdated.getTime()
            ? `Last GPS update ${secAgo}s ago`
            : "No live GPS fix"}
      </div>
    </div>
  );
}
