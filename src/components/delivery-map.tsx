import { RouteRequest } from "@/lib/route-request";
import { parseCoordinates } from "@/lib/coordinates";
import { assignmentLocation } from "@/lib/tracking-location";
import { useEffect, useRef, useState } from "react";
import {
  fetchDeliveryRoute,
  shouldRecalculateRoute,
  type AdvancedRouteResult,
} from "@/lib/map-service/delivery-routing";
import { supabase } from "@/integrations/supabase/client";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import { getGoogleMapOptions } from "@/lib/map-settings";

export interface LatLng {
  lat: number;
  lng: number;
  label?: string;
  heading?: number;
}

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
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Record<string, google.maps.Marker>>({});
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const mountedRef = useRef(true);
  const cameraTarget = useRef("");

  const [courier, setCourier] = useState<LatLng | undefined>(undefined);
  const [routeInfo, setRouteInfo] = useState<AdvancedRouteResult | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date(0));
  const [secAgo, setSecAgo] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [mapKeyRevision, setMapKeyRevision] = useState(0);

  // Re-initialize map if Google Maps API key is updated dynamically
  useEffect(() => {
    const handleKeyChange = () => {
      setMapKeyRevision((r) => r + 1);
    };
    window.addEventListener("localshore:map-key-changed", handleKeyChange);
    return () => window.removeEventListener("localshore:map-key-changed", handleKeyChange);
  }, []);

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

  // Initialize Google Maps exclusively when the first valid point becomes available
  const hasMapPoint = Boolean(courier || destination || store);
  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const initialPoint = courier ?? destination ?? store;
        if (!initialPoint) {
          setLoading(false);
          return;
        }

        const googleApi = await loadGoogleMaps();
        if (cancelled || !mapContainerRef.current) return;
        const map = new googleApi.maps.Map(
          mapContainerRef.current,
          getGoogleMapOptions({
            center: { lat: initialPoint.lat, lng: initialPoint.lng },
            zoom: 15,
            zoomControl: interactive,
          }),
        );
        mapRef.current = map;
        setLoading(false);
        if (interactive) {
          map.addListener("click", (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
              destinationCallback.current?.({ lat: event.latLng.lat(), lng: event.latLng.lng() });
            }
          });
        }
      } catch (err) {
        console.error("[DeliveryMap] map init error", err);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        Object.values(markersRef.current).forEach((marker) => marker.setMap?.(null));
        polylineRef.current?.setMap?.(null);
        markersRef.current = {};
        mapRef.current = null;
      }
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = "";
      }
    };
  }, [hasMapPoint, mapKeyRevision]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (mapRef.current) {
        Object.values(markersRef.current).forEach((marker) => marker.setMap?.(null));
        polylineRef.current?.setMap?.(null);
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

  // Sync Google Maps markers and route polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;
    const googleApi = window.google;

    const upsertGoogleMarker = (
      id: string,
      pos: LatLng | undefined,
      iconUrl: string,
      size: [number, number],
    ) => {
      if (!pos || !parseCoordinates(pos.lat, pos.lng)) {
        markersRef.current[id]?.setMap?.(null);
        delete markersRef.current[id];
        return;
      }
      const marker = markersRef.current[id] ?? new googleApi.maps.Marker({ map });
      marker.setPosition({ lat: pos.lat, lng: pos.lng });
      marker.setIcon({ url: iconUrl, scaledSize: new googleApi.maps.Size(size[0], size[1]) });
      marker.setMap(map);
      markersRef.current[id] = marker;
    };

    upsertGoogleMarker("store", store, pinSvg("#2A6F77", "store"), [28, 38]);
    upsertGoogleMarker("dest", destination ?? undefined, pinSvg("#E3A72E", "destination"), [28, 38]);
    upsertGoogleMarker("courier", courier, courierScooterSvg("#D9584C", courier?.heading || 0), [36, 36]);

    const dest = phase === "to_vendor" ? store : destination;
    if (interactive && dest && parseCoordinates(dest.lat, dest.lng)) {
      const key = dest.lat + ":" + dest.lng;
      if (cameraTarget.current !== key) {
        cameraTarget.current = key;
        map.panTo({ lat: dest.lat, lng: dest.lng });
        map.setZoom(17);
      }
    }

    polylineRef.current?.setMap?.(null);
    polylineRef.current = null;
    if (routeInfo?.geometry?.length) {
      polylineRef.current = new googleApi.maps.Polyline({
        map,
        path: routeInfo.geometry.map(([lng, lat]) => ({ lat, lng })),
        strokeColor: phase === "to_vendor" ? "#2A6F77" : "#E3A72E",
        strokeOpacity: 0.85,
        strokeWeight: 4,
      });
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
        {lastUpdated.getTime() ? `Last GPS update ${secAgo}s ago` : "No live GPS fix"}
      </div>
    </div>
  );
}
