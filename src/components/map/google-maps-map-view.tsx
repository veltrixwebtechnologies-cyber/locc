/// <reference types="google.maps" />
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Locate, MapPin, RefreshCw } from "lucide-react";
import type { MapLocation, MapMarkerItem } from "@/lib/map-service/types";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import { localShoreShopMarker } from "@/lib/localshore-shop-marker";
import { getImportedShopHref } from "@/lib/imported-shops";
import { getRepresentativeItemImages } from "@/lib/image-utils";
import type { InteractiveMapViewRef } from "./interactive-map-view";
import { InteractiveMapView } from "./interactive-map-view";
import { getGoogleMapOptions } from "@/lib/map-settings";

interface Props {
  markers: MapMarkerItem[];
  userLocation: MapLocation;
  selectedMarkerId?: string | null;
  hoveredMarkerId?: string | null;
  onSelectMarker?: (marker: MapMarkerItem | null) => void;
  onBoundsChange?: (bounds: { swLat: number; swLng: number; neLat: number; neLng: number }) => void;
  onUserLocationChange?: (location: MapLocation) => void;
  onViewShop?: (shopId: string) => void;
  className?: string;
}

export const GoogleMapsMapView = forwardRef<InteractiveMapViewRef, Props>(function GoogleMapsMapView(
  { markers, userLocation, selectedMarkerId, hoveredMarkerId, onSelectMarker, onBoundsChange, onUserLocationChange, onViewShop, className = "h-[650px] w-full" },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const shopMarkersRef = useRef<Record<string, google.maps.Marker>>({});
  const markerDataRef = useRef<Record<string, MapMarkerItem>>({});
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const onBoundsChangeRef = useRef(onBoundsChange);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => { onBoundsChangeRef.current = onBoundsChange; }, [onBoundsChange]);

  // Listen for dynamic API key updates to reload the map with the new key while maintaining settings
  useEffect(() => {
    const handleKeyChange = () => {
      mapRef.current = null;
      userMarkerRef.current = null;
      shopMarkersRef.current = {};
      setError(null);
      setReloadKey((prev) => prev + 1);
    };
    window.addEventListener("localshore:map-key-changed", handleKeyChange);
    return () => window.removeEventListener("localshore:map-key-changed", handleKeyChange);
  }, []);

  useImperativeHandle(ref, () => ({
    flyToLocation: (lat, lng, zoom = 14) => {
      mapRef.current?.panTo({ lat, lng });
      mapRef.current?.setZoom(zoom);
    },
    drawRoute: () => undefined,
    clearRoute: () => undefined,
  }), []);

  useEffect(() => {
    let cancelled = false;
    if (!containerRef.current || mapRef.current) return;
    setLoading(true);
    void loadGoogleMaps().then((googleApi) => {
      if (cancelled || !containerRef.current) return;
      // Initialize map using centralized LocalShore settings & custom style theme
      const map = new googleApi.maps.Map(
        containerRef.current,
        getGoogleMapOptions({
          center: { lat: userLocation.lat, lng: userLocation.lng },
          zoom: 14,
        }),
      );
      mapRef.current = map;
      infoWindowRef.current = new googleApi.maps.InfoWindow();
      map.addListener("idle", () => {
        const bounds = map.getBounds();
        if (!bounds) return;
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        onBoundsChangeRef.current?.({ swLat: sw.lat(), swLng: sw.lng(), neLat: ne.lat(), neLng: ne.lng() });
      });
      setLoading(false);
    }).catch((loadError: unknown) => {
      if (!cancelled) {
        setLoading(false);
        setError(loadError instanceof Error ? loadError.message : "Google Maps could not load");
      }
    });
    return () => {
      cancelled = true;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      mapRef.current = null;
    };
  }, [userLocation.lat, userLocation.lng, reloadKey]);


  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;
    const point = { lat: userLocation.lat, lng: userLocation.lng };
    map.panTo(point);
    if (!userMarkerRef.current) {
      userMarkerRef.current = new window.google.maps.Marker({
        map,
        position: point,
        title: "You are here",
        label: { text: "You", color: "#ffffff", fontWeight: "700" },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: "#2A6F77",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      });
    } else userMarkerRef.current.setPosition(point);
  }, [userLocation, loading]);

  useEffect(() => {
    const map = mapRef.current;
    const googleApi = window.google;
    if (!map || !googleApi?.maps) return;
    markerDataRef.current = Object.fromEntries(markers.map((marker) => [marker.id, marker]));
    const currentIds = new Set(markers.map((marker) => marker.id));
    Object.keys(shopMarkersRef.current).forEach((id) => {
      if (!currentIds.has(id)) { shopMarkersRef.current[id].setMap(null); delete shopMarkersRef.current[id]; }
    });
    markers.forEach((marker) => {
      const position = { lat: marker.lat, lng: marker.lng };
      const artwork = localShoreShopMarker(marker.shopName, marker.id === selectedMarkerId || marker.id === hoveredMarkerId, marker.isDemo, marker.isImported);
      const icon = { url: artwork.url, scaledSize: new googleApi.maps.Size(artwork.width, artwork.height), anchor: new googleApi.maps.Point(artwork.anchorX, artwork.anchorY) };
      let shopMarker = shopMarkersRef.current[marker.id];
      if (!shopMarker) {
        shopMarker = new googleApi.maps.Marker({ map, position, title: marker.shopName, icon });
        shopMarker.addListener("click", () => {
          const selected = markerDataRef.current[marker.id];
          if (!selected) return;
          onSelectMarker?.(selected);
          const content = document.createElement("div");
          content.style.cssText = "min-width:220px;padding:4px 2px;font-family:Arial,sans-serif";
          const title = document.createElement("strong"); title.textContent = selected.shopName; title.style.cssText = "display:block;font-size:15px;margin-bottom:6px;color:#1e1b4b";
          const distance = document.createElement("div"); distance.textContent = `${selected.distanceKm.toFixed(1)} km away · ${selected.category}${selected.rating > 0 ? ` · ★ ${selected.rating.toFixed(1)}${selected.reviewCount != null ? ` (${selected.reviewCount})` : ""}` : ""}`; distance.style.cssText = "font-size:12px;color:#64748b;margin-bottom:4px";
          const address = document.createElement("div"); address.textContent = selected.address || "Local Shore shop"; address.style.cssText = "font-size:12px;color:#64748b;margin-bottom:10px";
          if (selected.productImage) {
            const image = document.createElement("img"); image.src = selected.productImage; image.loading = "lazy";
            image.alt = selected.shopName;
            image.style.cssText = "width:220px;height:110px;object-fit:cover;border-radius:10px;margin-bottom:8px";
            image.onerror = () => image.remove(); content.append(image);
          }
          const button = document.createElement("button");
          if (button) {
            button.textContent = "View Local Shop";
            button.setAttribute("aria-label", `View ${selected.shopName}`);
            button.style.cssText = "display:inline-block;border:0;border-radius:10px;background:#2A6F77;color:white;padding:8px 14px;font-weight:700;cursor:pointer;text-decoration:none";
            button.type = "button";
            button.onclick = () => {
              if (selected.isImported) {
                window.location.assign(getImportedShopHref(selected.shopId, selected.lat, selected.lng));
              } else {
                onViewShop?.(selected.shopId);
              }
            };
          }
          content.append(title, distance, address);
          if (button) content.append(button);
          infoWindowRef.current?.setContent(content);
          infoWindowRef.current?.open({ map, anchor: shopMarker });
        });
        shopMarkersRef.current[marker.id] = shopMarker;
      } else {
        shopMarker.setPosition(position);
        shopMarker.setIcon(icon);
      }
      shopMarker.setZIndex(marker.id === selectedMarkerId || marker.id === hoveredMarkerId ? 10 : 1);
    });

    if (markers.length > 0) {
      const bounds = new googleApi.maps.LatLngBounds();
      bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
      markers.slice(0, 10).forEach((m) => {
        if (Number.isFinite(m.lat) && Number.isFinite(m.lng)) {
          bounds.extend({ lat: m.lat, lng: m.lng });
        }
      });
      map.fitBounds(bounds, 50);
    }
  }, [markers, selectedMarkerId, hoveredMarkerId, onSelectMarker, onViewShop, loading]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setError("This browser does not provide location access."); return; }
    navigator.geolocation.getCurrentPosition((position) => {
      const next = { lat: position.coords.latitude, lng: position.coords.longitude, label: "Current location" };
      onUserLocationChange?.(next);
      mapRef.current?.panTo(next);
    }, () => setError("Location permission was unavailable. Choose a delivery location to continue."), { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
  };

  if (error) {
    return (
      <div className={`relative ${className}`}>
        <InteractiveMapView
          ref={ref}
          markers={markers}
          userLocation={userLocation}
          selectedMarkerId={selectedMarkerId}
          hoveredMarkerId={hoveredMarkerId}
          onSelectMarker={onSelectMarker}
          onBoundsChange={onBoundsChange}
          onUserLocationChange={onUserLocationChange}
          className="h-full w-full"
        />
        <div className="absolute top-3 right-3 z-10 rounded-full bg-white/95 border border-amber-300 px-3 py-1 text-[11px] font-semibold text-amber-900 shadow-md flex items-center gap-1.5 backdrop-blur-xs">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          Vector Map View (Google Maps key fallback)
        </div>
      </div>
    );
  }
  return <div className={`relative overflow-hidden ${className}`}><div ref={containerRef} className="h-full w-full" aria-label="Google map showing LocalShore shops" />{loading&&<div className="absolute inset-0 grid place-items-center bg-white/75 text-sm font-semibold text-slate-700"><RefreshCw className="mr-2 inline h-4 w-4 animate-spin"/>Loading Google Maps…</div>}<button type="button" onClick={useCurrentLocation} className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-bold text-[#981495] shadow-md" aria-label="Use current location"><Locate className="h-4 w-4"/>You are here</button><div className="absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-[10px] text-slate-500 shadow">Google Maps · LocalShore shops</div></div>;

});

GoogleMapsMapView.displayName = "GoogleMapsMapView";
