import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Locate, RefreshCw, Layers } from "lucide-react";
import type { MapMarkerItem, MapLocation } from "@/lib/map-service/types";
import { getMapLibreStyle } from "@/lib/map-service/providers";
import { ShopCardSheet } from "./shop-card-sheet";

export interface InteractiveMapViewRef {
  flyToLocation: (lat: number, lng: number, zoom?: number) => void;
  drawRoute: (geometry: [number, number][], distanceKm: number, durationMins: number) => void;
  clearRoute: () => void;
}

interface Props {
  markers: MapMarkerItem[];
  userLocation: MapLocation;
  selectedMarkerId?: string | null;
  onSelectMarker?: (marker: MapMarkerItem | null) => void;
  onBoundsChange?: (bounds: { swLat: number; swLng: number; neLat: number; neLng: number }) => void;
  onUserLocationChange?: (loc: MapLocation) => void;
  className?: string;
}

export const InteractiveMapView = forwardRef<InteractiveMapViewRef, Props>(
  (
    {
      markers,
      userLocation,
      selectedMarkerId,
      onSelectMarker,
      onBoundsChange,
      onUserLocationChange,
      className = "h-[650px] w-full",
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const htmlMarkersRef = useRef<Record<string, maplibregl.Marker>>({});
    const userMarkerRef = useRef<maplibregl.Marker | null>(null);
    const [showSearchThisArea, setShowSearchThisArea] = useState(false);
    const [activeMarker, setActiveMarker] = useState<MapMarkerItem | null>(null);
    const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMins: number } | null>(null);

    // Synchronize activeMarker with selectedMarkerId prop
    useEffect(() => {
      if (!selectedMarkerId) {
        setActiveMarker(null);
        return;
      }
      const found = markers.find((m) => m.id === selectedMarkerId);
      if (found) setActiveMarker(found);
    }, [selectedMarkerId, markers]);

    // Expose imperative functions via ref
    useImperativeHandle(ref, () => ({
      flyToLocation: (lat: number, lng: number, zoom = 14) => {
        if (mapRef.current) {
          mapRef.current.flyTo({ center: [lng, lat], zoom, speed: 1.2 });
        }
      },
      drawRoute: (geometry: [number, number][], distanceKm: number, durationMins: number) => {
        setRouteInfo({ distanceKm, durationMins });
        const map = mapRef.current;
        if (!map) return;

        const routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString> = {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: geometry,
          },
        };

        if (map.getSource("directions-route")) {
          (map.getSource("directions-route") as maplibregl.GeoJSONSource).setData(routeGeoJSON);
        } else {
          map.addSource("directions-route", {
            type: "geojson",
            data: routeGeoJSON,
          });

          map.addLayer({
            id: "directions-route-line",
            type: "line",
            source: "directions-route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#981495", // LocalShore coastal teal brand color
              "line-width": 5,
              "line-opacity": 0.85,
            },
          });
        }

        // Fit map bounds to encompass origin and destination route
        if (geometry.length > 0) {
          const bounds = new maplibregl.LngLatBounds();
          geometry.forEach((coord) => bounds.extend(coord as [number, number]));
          map.fitBounds(bounds, { padding: 80, maxZoom: 16 });
        }
      },
      clearRoute: () => {
        setRouteInfo(null);
        const map = mapRef.current;
        if (map && map.getLayer("directions-route-line")) {
          map.removeLayer("directions-route-line");
          map.removeSource("directions-route");
        }
      },
    }));

    // Initialize MapLibre GL map instance once
    useEffect(() => {
      if (!containerRef.current || mapRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: getMapLibreStyle() as any,
        center: [userLocation.lng, userLocation.lat],
        zoom: 13,
        attributionControl: false,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
      map.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        "bottom-right"
      );

      map.on("error", (e) => {
        // Prevent noisy console output for aborted tile fetch requests during fast panning
        const err = e.error as any;
        if (err?.message?.includes("aborted") || err?.name === "AbortError") {
          return;
        }
      });

      map.on("moveend", () => {
        setShowSearchThisArea(true);
      });

      // ResizeObserver to ensure map canvas automatically resizes on layout shifts
      const resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.resize();
        }
      });
      resizeObserver.observe(containerRef.current);

      mapRef.current = map;

      return () => {
        resizeObserver.disconnect();
        map.remove();
        mapRef.current = null;
      };
    }, []);

    // Update User Location Marker (orchid pulsing ring)
    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;

      map.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 13.5, speed: 1.2 });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
      } else {
        const userEl = document.createElement("div");
        userEl.className = "relative grid h-7 w-7 place-items-center";
        userEl.innerHTML = `
          <div class="absolute inset-0 animate-ping rounded-full bg-primary/40"></div>
          <div class="relative grid h-5 w-5 place-items-center rounded-full bg-primary text-white shadow-md ring-2 ring-white">
            <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
        `;

        userMarkerRef.current = new maplibregl.Marker({ element: userEl })
          .setLngLat([userLocation.lng, userLocation.lat])
          .addTo(map);
      }
    }, [userLocation]);

    // Update Shop Markers (Compact Price Pins)
    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;

      // Clean up old markers no longer present
      const currentIds = new Set(markers.map((m) => m.id));
      Object.keys(htmlMarkersRef.current).forEach((id) => {
        if (!currentIds.has(id)) {
          htmlMarkersRef.current[id].remove();
          delete htmlMarkersRef.current[id];
        }
      });

      // Render or update price pin markers
      markers.forEach((marker) => {
        const isSelected = activeMarker?.id === marker.id;

        if (htmlMarkersRef.current[marker.id]) {
          // Update position & selection state
          const markerInst = htmlMarkersRef.current[marker.id];
          markerInst.setLngLat([marker.lng, marker.lat]);
          const el = markerInst.getElement();
          el.className = getMarkerClass(isSelected);
        } else {
          // Create new price + shop marker element
          const pinEl = document.createElement("div");
          pinEl.className = getMarkerClass(isSelected);
          pinEl.innerHTML = `
            <div class="marker-price-pill shadow-md hover:scale-105 transition-all">
              <span class="font-extrabold">${marker.priceDisplay}</span>
              <span class="shop-name-tag">${marker.shopName}</span>
            </div>
          `;

          pinEl.addEventListener("click", (e) => {
            e.stopPropagation();
            setActiveMarker(marker);
            onSelectMarker?.(marker);
            map.flyTo({ center: [marker.lng, marker.lat], zoom: 14.5, speed: 1 });
          });

          const mInst = new maplibregl.Marker({ element: pinEl })
            .setLngLat([marker.lng, marker.lat])
            .addTo(map);

          htmlMarkersRef.current[marker.id] = mInst;
        }
      });
    }, [markers, activeMarker]);

    const handleSearchThisAreaClick = () => {
      setShowSearchThisArea(false);
      const map = mapRef.current;
      if (!map) return;

      const bounds = map.getBounds();
      onBoundsChange?.({
        swLat: bounds.getSouthWest().lat,
        swLng: bounds.getSouthWest().lng,
        neLat: bounds.getNorthEast().lat,
        neLng: bounds.getNorthEast().lng,
      });
    };

    const handleUseCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            onUserLocationChange?.(loc);
            if (mapRef.current) {
              mapRef.current.flyTo({ center: [loc.lng, loc.lat], zoom: 14 });
            }
          },
          () => {
            // Default back to center
            if (mapRef.current) {
              mapRef.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 14 });
            }
          }
        );
      }
    };

    return (
      <div className={`relative overflow-hidden rounded-2xl border border-border bg-card shadow-lg ${className}`}>
        {/* Map Container */}
        <div ref={containerRef} className="h-full w-full" />

        {/* Custom Styling for Compact Price Pins */}
        <style>{`
          .maplibregl-marker {
            width: auto !important;
            height: auto !important;
          }
          .maplibre-marker-pin {
            cursor: pointer;
            display: inline-flex !important;
            width: auto !important;
            max-width: max-content !important;
            align-items: center;
            justify-content: center;
            pointer-events: auto;
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), z-index 0.2s;
            z-index: 10;
          }
          .maplibre-marker-pin.selected {
            z-index: 50 !important;
            transform: scale(1.15);
          }
          .marker-price-pill {
            display: inline-flex !important;
            align-items: center !important;
            gap: 6px !important;
            width: auto !important;
            max-width: max-content !important;
            background-color: #ffffff;
            color: #111827;
            border: 1.5px solid #e5e7eb;
            border-radius: 9999px;
            padding: 5px 12px;
            font-size: 13px;
            font-weight: 800;
            white-space: nowrap !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
            transition: all 0.15s ease-in-out;
          }
          .shop-name-tag {
            font-size: 11px;
            font-weight: 600;
            opacity: 0.85;
            border-left: 1px solid rgba(0, 0, 0, 0.15);
            padding-left: 6px;
            max-width: 100px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .marker-price-pill:hover {
            transform: scale(1.06);
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.24);
            border-color: #111827;
          }
          .selected .marker-price-pill {
            background-color: #111827 !important;
            color: #ffffff !important;
            border-color: #111827 !important;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
          }
          .selected .shop-name-tag {
            border-left-color: rgba(255, 255, 255, 0.3);
            opacity: 0.95;
          }
        `}</style>

        {/* "Search this area" Button Overlay */}
        {showSearchThisArea && (
          <div className="absolute top-4 inset-x-0 z-20 flex justify-center pointer-events-none">
            <button
              onClick={handleSearchThisAreaClick}
              className="pointer-events-auto flex items-center gap-2 rounded-full border border-primary/30 bg-card/95 px-4 py-2 text-xs font-bold text-primary shadow-xl backdrop-blur transition-transform hover:scale-105 active:scale-95"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Search this area</span>
            </button>
          </div>
        )}

        {/* Floating Quick Map Controls (User location button) */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          <button
            onClick={handleUseCurrentLocation}
            title="Recenter to my location"
            className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground shadow-md transition-colors hover:bg-muted active:scale-95"
          >
            <Locate className="h-5 w-5 text-primary" />
          </button>
        </div>

        {/* Route Stats Overlay Banner (if route active) */}
        {routeInfo && (
          <div className="absolute top-4 right-14 z-20 rounded-xl border border-primary/30 bg-card/95 px-3.5 py-2 shadow-lg backdrop-blur text-xs font-bold text-foreground">
            <span className="text-primary">{routeInfo.distanceKm} km</span> · Approx {routeInfo.durationMins} mins drive
          </div>
        )}

        {/* Active Shop Card Sheet Overlay (Bottom / Desktop Floating) */}
        {activeMarker && (
          <div className="absolute bottom-4 inset-x-4 z-30 flex justify-center pointer-events-none md:bottom-6">
            <ShopCardSheet
              marker={activeMarker}
              userLocation={userLocation}
              onClose={() => {
                setActiveMarker(null);
                onSelectMarker?.(null);
              }}
              onDirectionsCalculated={(geom, dist, dur) => {
                if (mapRef.current) {
                  // Call imperative drawRoute
                  const refInst = {
                    drawRoute: (g: [number, number][], d: number, t: number) => {
                      setRouteInfo({ distanceKm: d, durationMins: t });
                      const m = mapRef.current;
                      if (!m) return;
                      const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
                        type: "Feature",
                        properties: {},
                        geometry: { type: "LineString", coordinates: g },
                      };
                      if (m.getSource("directions-route")) {
                        (m.getSource("directions-route") as maplibregl.GeoJSONSource).setData(geojson);
                      } else {
                        m.addSource("directions-route", { type: "geojson", data: geojson });
                        m.addLayer({
                          id: "directions-route-line",
                          type: "line",
                          source: "directions-route",
                          paint: { "line-color": "#981495", "line-width": 5, "line-opacity": 0.9 },
                        });
                      }
                      const b = new maplibregl.LngLatBounds();
                      g.forEach((c) => b.extend(c as [number, number]));
                      m.fitBounds(b, { padding: 70, maxZoom: 16 });
                    },
                  };
                  refInst.drawRoute(geom, dist, dur);
                }
              }}
            />
          </div>
        )}
      </div>
    );
  }
);

function getMarkerClass(isSelected: boolean): string {
  return `maplibre-marker-pin ${isSelected ? "selected" : ""}`;
}

InteractiveMapView.displayName = "InteractiveMapView";
