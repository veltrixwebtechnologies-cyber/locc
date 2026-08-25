import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Locate, RefreshCw } from "lucide-react";
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
  hoveredMarkerId?: string | null;
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
      hoveredMarkerId,
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

          // Outer glowing casing
          map.addLayer({
            id: "directions-route-casing",
            type: "line",
            source: "directions-route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#F59E0B", // Marigold Gold
              "line-width": 8,
              "line-opacity": 0.4,
            },
          });

          // Core route line
          map.addLayer({
            id: "directions-route-line",
            type: "line",
            source: "directions-route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#1E1B4B", // Dark Ink
              "line-width": 4,
              "line-opacity": 0.9,
            },
          });
        }

        if (geometry.length > 0) {
          const bounds = new maplibregl.LngLatBounds();
          geometry.forEach((coord) => bounds.extend(coord as [number, number]));
          map.fitBounds(bounds, { padding: 80, maxZoom: 16 });
        }
      },
      clearRoute: () => {
        setRouteInfo(null);
        const map = mapRef.current;
        if (map) {
          if (map.getLayer("directions-route-line")) map.removeLayer("directions-route-line");
          if (map.getLayer("directions-route-casing")) map.removeLayer("directions-route-casing");
          if (map.getSource("directions-route")) map.removeSource("directions-route");
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
        const err = e.error as any;
        if (err?.message?.includes("aborted") || err?.name === "AbortError") {
          return;
        }
      });

      map.on("moveend", () => {
        setShowSearchThisArea(true);
      });

      // Setup GeoJSON Source for Cluster rendering
      map.on("load", () => {
        if (!map.getSource("shops-cluster-source")) {
          map.addSource("shops-cluster-source", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
            cluster: true,
            clusterMaxZoom: 12,
            clusterRadius: 50,
          });

          // Circle cluster layer
          map.addLayer({
            id: "clusters",
            type: "circle",
            source: "shops-cluster-source",
            filter: ["has", "point_count"],
            paint: {
              "circle-color": "#F59E0B",
              "circle-radius": [
                "step",
                ["get", "point_count"],
                18,
                5,
                24,
                15,
                30,
              ],
              "circle-stroke-width": 3,
              "circle-stroke-color": "#1E1B4B",
            },
          });

          // Cluster text count layer
          map.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: "shops-cluster-source",
            filter: ["has", "point_count"],
            layout: {
              "text-field": "{point_count_abbreviated}",
              "text-size": 13,
              "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            },
            paint: {
              "text-color": "#1E1B4B",
            },
          });

          // Zoom into cluster on click
          map.on("click", "clusters", (e) => {
            const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
            const clusterId = features[0]?.properties?.cluster_id;
            const source = map.getSource("shops-cluster-source") as maplibregl.GeoJSONSource;
            if (clusterId && source) {
              source.getClusterExpansionZoom(clusterId, (err, zoom) => {
                if (err) return;
                const coords = (features[0].geometry as any).coordinates;
                map.easeTo({ center: coords, zoom: zoom + 0.5 });
              });
            }
          });

          map.on("mouseenter", "clusters", () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "clusters", () => {
            map.getCanvas().style.cursor = "";
          });
        }
      });

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

    // Update User Location Marker (Marigold/Orchid pulsing ring)
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
          <div class="absolute inset-0 animate-ping rounded-full bg-amber-500/40"></div>
          <div class="relative grid h-5.5 w-5.5 place-items-center rounded-full bg-[#F59E0B] text-[#1E1B4B] shadow-md ring-2 ring-white font-bold">
            <svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
        `;

        userMarkerRef.current = new maplibregl.Marker({ element: userEl })
          .setLngLat([userLocation.lng, userLocation.lat])
          .addTo(map);
      }
    }, [userLocation]);

    // Update GeoJSON Source & Price Pin Markers
    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;

      // Update GeoJSON cluster source data
      if (map.getSource("shops-cluster-source")) {
        const source = map.getSource("shops-cluster-source") as maplibregl.GeoJSONSource;
        source.setData({
          type: "FeatureCollection",
          features: markers.map((m) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [m.lng, m.lat] },
            properties: {
              id: m.id,
              shopId: m.shopId,
              shopName: m.shopName,
              priceDisplay: m.priceDisplay,
            },
          })),
        });
      }

      // Clean up old markers no longer present
      const currentIds = new Set(markers.map((m) => m.id));
      Object.keys(htmlMarkersRef.current).forEach((id) => {
        if (!currentIds.has(id)) {
          htmlMarkersRef.current[id].remove();
          delete htmlMarkersRef.current[id];
        }
      });

      // Render or update custom price pin markers
      markers.forEach((marker) => {
        const isSelected = activeMarker?.id === marker.id;
        const isHovered = hoveredMarkerId === marker.id;

        if (htmlMarkersRef.current[marker.id]) {
          const markerInst = htmlMarkersRef.current[marker.id];
          markerInst.setLngLat([marker.lng, marker.lat]);
          const el = markerInst.getElement();
          el.className = getMarkerClass(isSelected, isHovered);
        } else {
          const pinEl = document.createElement("div");
          pinEl.className = getMarkerClass(isSelected, isHovered);
          pinEl.innerHTML = `
            <div class="marker-price-pill shadow-md transition-all">
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
    }, [markers, activeMarker, hoveredMarkerId]);

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

        {/* Custom Styling for Price Pins & Marigold Hover Highlights */}
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
            transform: scale(1.18);
          }
          .maplibre-marker-pin.hovered {
            z-index: 40 !important;
            transform: scale(1.12);
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
          .marker-price-pill:hover, .hovered .marker-price-pill {
            background-color: #F59E0B !important;
            color: #1E1B4B !important;
            border-color: #1E1B4B !important;
            box-shadow: 0 6px 18px rgba(245, 158, 11, 0.45);
          }
          .selected .marker-price-pill {
            background-color: #111827 !important;
            color: #ffffff !important;
            border-color: #F59E0B !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
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
              className="pointer-events-auto flex items-center gap-2 rounded-full border border-amber-500/40 bg-card/95 px-4 py-2 text-xs font-bold text-foreground shadow-xl backdrop-blur transition-transform hover:scale-105 active:scale-95"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#F59E0B]" />
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
            <Locate className="h-5 w-5 text-[#F59E0B]" />
          </button>
        </div>

        {/* Route Stats Overlay Banner (if route active) */}
        {routeInfo && (
          <div className="absolute top-4 right-14 z-20 rounded-xl border border-amber-500/40 bg-card/95 px-3.5 py-2 shadow-lg backdrop-blur text-xs font-bold text-foreground">
            <span className="text-[#F59E0B] font-extrabold">{routeInfo.distanceKm} km</span> · Approx {routeInfo.durationMins} mins drive
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
                          id: "directions-route-casing",
                          type: "line",
                          source: "directions-route",
                          paint: { "line-color": "#F59E0B", "line-width": 8, "line-opacity": 0.4 },
                        });
                        m.addLayer({
                          id: "directions-route-line",
                          type: "line",
                          source: "directions-route",
                          paint: { "line-color": "#1E1B4B", "line-width": 4, "line-opacity": 0.9 },
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

function getMarkerClass(isSelected: boolean, isHovered: boolean): string {
  return `maplibre-marker-pin ${isSelected ? "selected" : ""} ${isHovered ? "hovered" : ""}`;
}

InteractiveMapView.displayName = "InteractiveMapView";

