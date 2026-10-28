import { lazy, Suspense, useState, useMemo, useRef, useEffect, startTransition } from "react";
import {
  MapPin,
  Locate,
  ArrowRight,
  Star,
  Filter,
  Check,
  Zap,
  Store as StoreIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import type { InteractiveMapViewRef } from "./interactive-map-view";
import { GoogleMapsMapView } from "./google-maps-map-view";
import { isGoogleMapsAuthFailed, triggerGoogleMapsAuthFailure } from "@/lib/google-maps-loader";

const InteractiveMapView = lazy(() =>
  import("./interactive-map-view").then((module) => ({ default: module.InteractiveMapView })),
);

// OSM/MapLibre remains the safe default. Enable Google Maps only in this
// isolated GMap worktree with VITE_MAP_PROVIDER=google.
const MAP_PROVIDER = import.meta.env.VITE_MAP_PROVIDER === "google" ? "google" : "osm";

import type { MapFilterOptions, MapLocation, MapMarkerItem } from "@/lib/map-service/types";
import { getMapMarkerItems, isTestEntity } from "@/lib/map-service/store-engine";
import { geocodeSearch, calculateHaversineDistanceKm } from "@/lib/map-service/providers";
import { Link } from "@tanstack/react-router";
import { categoryColor, categoryLabel } from "@/lib/mock-data";
import { getFallbackProductImage, isValidImageUrl } from "@/lib/image-utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  useDeliveryLocation,
  detectCurrentGPSLocation,
  setActiveDeliveryLocation,
} from "@/lib/location-store";
import { catalogCategoryKey, getCategoryByIdOrSlug } from "@/lib/shop-categories";
import { isValidCoordinate } from "@/lib/geo";
import {
  CUSTOMER_VISIBILITY_RADIUS_KM,
  DEFAULT_SHOP_DISCOVERY_RADIUS_KM,
  MAX_SHOP_DISCOVERY_RADIUS_KM,
  hasConfirmedCoordinates,
  formatNearbyDistance,
} from "@/lib/location-visibility";
import { discoverShops } from "@/modules/shopper/services/shop-discovery";
import { fetchNearbyImportedShops, toImportedMapMarker } from "@/lib/imported-shops";
import { ShopCard } from "@/modules/shopper/components/shop-card";

interface Props {
  initialQuery?: string;
  initialCategory?: string;
  initialMapOpen?: boolean;
  onCloseMap?: () => void;
  onQueryChange?: (q: string) => void;
  onCategoryChange?: (c: string) => void;
}

export function LocalShoreMapExperience({
  initialQuery = "",
  initialCategory = "all",
  initialMapOpen = false,
  onCloseMap,
  onQueryChange,
  onCategoryChange,
}: Props) {
  const mapRef = useRef<InteractiveMapViewRef>(null);
  const mapCategory = catalogCategoryKey(initialCategory) as MapFilterOptions["category"] | null;
  const selectedCategoryLabel = mapCategory ? getCategoryByIdOrSlug(mapCategory).name : null;
  const [deliveryLoc] = useDeliveryLocation();
  const [view, setView] = useState<"map" | "list">("map");
  const [useLeafletFallback, setUseLeafletFallback] = useState(() => isGoogleMapsAuthFailed());
  const isGoogleMode = MAP_PROVIDER === "google" && !useLeafletFallback;

  useEffect(() => {
    const handleAuthFailure = () => {
      console.warn("[LocalShoreMapExperience] Google Maps auth failure detected (gm_authFailure). Switching directly to InteractiveMapView fallback.");
      setUseLeafletFallback(true);
    };
    window.addEventListener("localshore:maps-auth-failure", handleAuthFailure);
    return () => window.removeEventListener("localshore:maps-auth-failure", handleAuthFailure);
  }, []);

  // Proactively detect Google Maps DOM error overlays (e.g. "This page can't load Google Maps correctly" / BillingNotEnabledMapError)
  useEffect(() => {
    if (!isGoogleMode) return;
    const checkAndFallback = () => {
      const errorEl =
        document.querySelector(".gm-err-container") ||
        document.querySelector(".gm-err-message") ||
        document.querySelector(".gm-style-pbt");
      const hasErrorText =
        Boolean(document.body.innerText?.includes("This page can't load Google Maps correctly")) ||
        Boolean(document.body.innerText?.includes("Do you own this website?"));

      if (errorEl || hasErrorText) {
        console.warn("[LocalShoreMapExperience] Detected Google Maps error overlay in DOM. Switching directly to InteractiveMapView fallback.");
        triggerGoogleMapsAuthFailure();
        setUseLeafletFallback(true);
        return true;
      }
      return false;
    };

    if (checkAndFallback()) return;

    const observer = new MutationObserver(() => {
      if (checkAndFallback()) {
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    const timer1 = setTimeout(checkAndFallback, 600);
    const timer2 = setTimeout(checkAndFallback, 1600);

    return () => {
      observer.disconnect();
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isGoogleMode]);

  useEffect(() => {
    const handleKeyChange = () => {
      setUseLeafletFallback(false);
    };
    window.addEventListener("localshore:map-key-changed", handleKeyChange);
    return () => window.removeEventListener("localshore:map-key-changed", handleKeyChange);
  }, []);

  const [userLocation, setUserLocation] = useState<MapLocation | null>(() =>
    deliveryLoc && isValidCoordinate(deliveryLoc.lat, deliveryLoc.lng)
      ? { lat: deliveryLoc.lat, lng: deliveryLoc.lng, label: deliveryLoc.area || deliveryLoc.label }
      : null,
  );

  useEffect(() => {
    if (deliveryLoc && isValidCoordinate(deliveryLoc.lat, deliveryLoc.lng)) {
      setUserLocation({
        lat: deliveryLoc.lat,
        lng: deliveryLoc.lng,
        label: deliveryLoc.area || deliveryLoc.label,
      });
      mapRef.current?.flyToLocation(deliveryLoc.lat, deliveryLoc.lng, 13.5);
    }
  }, [deliveryLoc]);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Search & Filter State - Defaults to 10 km discovery radius so shops from 0 to 7, 8, 9, 10 km are shown
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<MapFilterOptions>({
    query: initialQuery,
    category: mapCategory ?? undefined,
    maxDistanceKm: MAX_SHOP_DISCOVERY_RADIUS_KM,
  });
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);

  // Sync external props with internal filter state
  useEffect(() => {
    setQuery(initialQuery);
    setFilters((prev) => ({
      ...prev,
      query: initialQuery,
      category: mapCategory ?? undefined,
    }));
  }, [initialQuery, mapCategory]);

  // Query live Supabase approved vendor catalog & product catalog (cached across app)
  const approvedProducts = useQuery({
    queryKey: ["customer-visible-products", deliveryLoc?.lat, deliveryLoc?.lng, query, mapCategory],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!hasConfirmedCoordinates(deliveryLoc)) return [];
      try {
        const { data, error } = await (supabase as any).rpc("get_customer_visible_products", {
          p_lat: deliveryLoc.lat, p_lng: deliveryLoc.lng, p_query: query || null,
          p_category_slug: mapCategory, p_limit: 100, p_offset: 0,
        });
        if (error) throw error;
        return (data ?? []).filter((p: any) => !isTestEntity(p.name));
      } catch (err) {
        console.warn("Map products query fallback:", err);
        return [];
      }
    },
  });

  const approvedVendors = useQuery({
    queryKey: ["customer-visible-shops", deliveryLoc?.lat, deliveryLoc?.lng, query, mapCategory, filters.maxDistanceKm],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!hasConfirmedCoordinates(deliveryLoc)) return [];
      try {
        const { shops } = await discoverShops(
          (name, args) => (supabase as any).rpc(name, args),
          {
            lat: deliveryLoc.lat,
            lng: deliveryLoc.lng,
            query: query || null,
            category: mapCategory ?? null,
            radiusKm: filters.maxDistanceKm ?? MAX_SHOP_DISCOVERY_RADIUS_KM,
          },
        );
        return shops.filter((shop) => !isTestEntity(shop.shop_name));
      } catch (err) {
        console.warn("Map vendors query fallback:", err);
        return [];
      }
    },
  });

  const importedShops = useQuery({
    queryKey: ["nearby-imported-shops", deliveryLoc?.lat, deliveryLoc?.lng, query, mapCategory, filters.maxDistanceKm],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: false,
    enabled: hasConfirmedCoordinates(deliveryLoc),
    queryFn: async () => {
      return fetchNearbyImportedShops((name, args) => (supabase as any).rpc(name, args), {
        lat: deliveryLoc!.lat, lng: deliveryLoc!.lng,
        radiusKm: filters.maxDistanceKm ?? MAX_SHOP_DISCOVERY_RADIUS_KM,
        category: mapCategory ?? null, query: query || null,
      });
    },
  });

  // Calculate Product-Aware Map Markers ordered strictly nearest to farthest (0 to 7 km, 8 km, 9 km+)
  const markerItems: MapMarkerItem[] = useMemo(() => {
    if (!userLocation) return [];
    const maxDistance = filters.maxDistanceKm ?? MAX_SHOP_DISCOVERY_RADIUS_KM;

    const sellerMarkers = getMapMarkerItems(
      userLocation,
      filters,
      approvedProducts.data ?? [],
      approvedVendors.data ?? [],
    );

    const importedMarkers = (importedShops.data ?? [])
      .map(toImportedMapMarker)
      .filter((marker): marker is MapMarkerItem => marker !== null);

    // Compute exact Haversine distance from active userLocation for every marker
    const allMarkersWithAccurateDistance = [...sellerMarkers, ...importedMarkers].map((marker) => {
      const distanceKm = Number(
        calculateHaversineDistanceKm(
          userLocation.lat,
          userLocation.lng,
          marker.lat,
          marker.lng,
        ).toFixed(1),
      );
      return {
        ...marker,
        distanceKm,
      };
    });

    // Enforce max distance radius filter
    const withinRadius = allMarkersWithAccurateDistance.filter(
      (marker) => marker.distanceKm <= maxDistance,
    );

    // Deduplicate so each shop has exactly one marker
    const seenShopIds = new Set<string>();
    const uniqueMarkers = withinRadius.filter((marker) => {
      if (seenShopIds.has(marker.shopId)) return false;
      seenShopIds.add(marker.shopId);
      return true;
    });

    // CRITICAL: Sort strictly ascending from nearest to farthest (0 km, 1 km, ..., 7 km, 8 km, 9 km+)
    return uniqueMarkers.sort((a, b) => {
      if (a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
      }
      return a.shopName.localeCompare(b.shopName);
    });
  }, [userLocation, filters, approvedProducts.data, approvedVendors.data, importedShops.data]);

  const registeredCount = markerItems.length;

  // Handle Geocoding Search for Map Locations
  const handleLocationSearch = async (val: string) => {
    setLocationSearchQuery(val);
    if (val.trim().length < 3) {
      setLocationSuggestions([]);
      return;
    }
    setIsSearchingLocation(true);
    const results = await geocodeSearch(val);
    setLocationSuggestions(results);
    setIsSearchingLocation(false);
  };

  const handleSelectLocation = (result: any) => {
    const loc: MapLocation = {
      lat: result.lat,
      lng: result.lng,
      label: String(result.placeName || result.label || "Selected location").split(",")[0],
    };
    setUserLocation(loc);
    setActiveDeliveryLocation({
      id: `map-search-${Date.now()}`,
      label: result.placeName || result.label || loc.label || "Selected location",
      area: loc.label || "Selected location",
      city: (result.placeName || "").split(",").slice(1, 3).join(", ").trim(),
      lat: loc.lat,
      lng: loc.lng,
    });
    setLocationSearchQuery("");
    setLocationSuggestions([]);
    mapRef.current?.flyToLocation(loc.lat, loc.lng, 14);
    toast.success(`Location set to ${loc.label}`);
  };

  const handleUseGPS = async () => {
    try {
      const freshLoc = await detectCurrentGPSLocation({ silent: false, allowApproximate: true });
      setUserLocation({
        lat: freshLoc.lat,
        lng: freshLoc.lng,
        label: freshLoc.area || freshLoc.label,
      });
      mapRef.current?.flyToLocation(freshLoc.lat, freshLoc.lng, 14.5);
    } catch (err: any) {
      console.warn("GPS location trigger failed:", err);
    }
  };

  const handleProductSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, query }));
    onQueryChange?.(query);
  };

  const [showDesktopMap, setShowDesktopMap] = useState(initialMapOpen);
  const [isMobileMapOpen, setIsMobileMapOpen] = useState(initialMapOpen);

  if (!userLocation) {
    return (
      <div className="relative w-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        {initialMapOpen && onCloseMap && (
          <button
            type="button"
            onClick={onCloseMap}
            className="absolute right-3 top-3 rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm"
          >
            Close
          </button>
        )}
        <MapPin className="mx-auto h-8 w-8 text-[#981495]" />
        <h3 className="mt-3 font-display text-base font-bold text-slate-900">
          Recommended from LocalShore
        </h3>
        <p className="mt-1 text-xs font-medium text-slate-500">
          Popular local shops are shown while your location is unknown.
        </p>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("localshore_open_location_modal"))}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#981495] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#700b6e]"
        >
          <MapPin className="h-3.5 w-3.5" />
          Add location to see shops near you
        </button>
      </div>
    );
  }

  // Category badge color lookup for high-contrast tag pills
  const getBadgeColor = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes("groc") || c.includes("fresh") || c.includes("palamuthir")) return "#059669"; // Emerald
    if (c.includes("bout") || c.includes("fashion") || c.includes("cloth")) return "#981495"; // Purple
    if (c.includes("station") || c.includes("tech") || c.includes("electr")) return "#4f46e5"; // Indigo
    if (c.includes("pharm") || c.includes("health") || c.includes("med")) return "#0284c7"; // Sky Blue
    if (c.includes("bake") || c.includes("sweet") || c.includes("bread")) return "#b36a3e"; // Warm Brown
    if (c.includes("flour") || c.includes("mill") || c.includes("spices")) return "#d97706"; // Amber
    return "#981495";
  };

  return (
    <div className="w-full">
      {/* SECTION HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-xl md:text-2xl font-black text-foreground tracking-tight">
              {selectedCategoryLabel ? `${selectedCategoryLabel} shops near you` : "Shops near you"}
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              {registeredCount} verified shops
            </span>
          </div>
          <p className="mt-1 text-xs md:text-sm text-muted-foreground font-medium">
            <strong className="text-foreground font-bold">{markerItems.length} shops</strong>{" "}
            {selectedCategoryLabel ? `in ${selectedCategoryLabel}` : "in your delivery zone"}
            {markerItems.length > 0 && (
              <span className="inline-block ml-1 text-muted-foreground">
                · Nearest is <strong className="text-foreground font-semibold">{markerItems[0]?.distanceKm.toFixed(1)} km</strong> away
              </span>
            )}
          </p>
        </div>

        {/* Action Controls: Distance Radius Filter & Map Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Distance Radius Filter Buttons */}
          <div className="inline-flex items-center rounded-full bg-muted/60 p-1 border border-border/80 shadow-2xs">
            {[5, 7, 10].map((radius) => (
              <button
                key={radius}
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, maxDistanceKm: radius }))}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  (filters.maxDistanceKm ?? MAX_SHOP_DISCOVERY_RADIUS_KM) === radius
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label={`Show shops up to ${radius} km away`}
              >
                {radius} km
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setShowDesktopMap(!showDesktopMap);
              setIsMobileMapOpen(!isMobileMapOpen);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-card px-4 py-2 text-xs md:text-sm font-bold text-primary shadow-xs hover:bg-primary hover:text-primary-foreground transition-all active:scale-95 cursor-pointer"
          >
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{showDesktopMap ? "Hide Map" : "View Map"}</span>
          </button>
        </div>
      </div>

      {/* NEIGHBORHOOD MAP PREVIEW CARD (Shown when map is closed, matching exact reference UI) */}
      {!showDesktopMap && (
        <NeighborhoodMapPreviewCard
          markers={markerItems}
          onOpenMap={() => {
            setShowDesktopMap(true);
            setIsMobileMapOpen(true);
          }}
        />
      )}

      {/* MAIN CONTAINER: Dynamic Responsive Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-4">
        {/* SHOP CARDS PANEL */}
        <div
          className={`flex flex-col transition-all duration-300 ${
            showDesktopMap ? "lg:col-span-6" : "lg:col-span-12"
          }`}
        >
          {markerItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/80 bg-muted/20 p-12 text-center">
              <div className="mx-auto text-4xl mb-3">🔍</div>
              <p className="font-bold text-foreground text-base">No shops found in this radius</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try widening your distance filter or choosing a different category.
              </p>
            </div>
          ) : (
            <div
              className={`grid gap-5 pb-8 items-stretch ${
                showDesktopMap
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              }`}
            >
              {markerItems.map((item) => (
                <ShopCard
                  key={item.id}
                  variant="wide"
                  className="h-full max-w-none"
                  shop={{
                    id: item.shopId,
                    name: item.shopName,
                    category: categoryLabel[item.category] || item.category,
                    imageUrl: item.productImage,
                    imageType: item.imageType,
                    rating: item.rating && item.rating > 0 ? item.rating : 4.5,
                    reviewCount: item.reviewCount && item.reviewCount > 0 ? item.reviewCount : 120,
                    distanceKm: item.distanceKm,
                    address: item.address,
                    isImported: item.isImported,
                    claimStatus: item.claimStatus,
                    googleMapsUrl: item.googleMapsUrl,
                    website: item.website,
                    latitude: item.lat,
                    longitude: item.lng,
                    deliveryAvailable: true,
                    pickupAvailable: true,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Sticky MapLibre GL Interactive Map (Desktop View) */}
        {showDesktopMap && (
          <div className="hidden lg:block lg:col-span-6 sticky top-20">
            <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-lg">
              <Suspense
                fallback={
                  <div className="h-[calc(100vh-210px)] min-h-[560px] max-h-[760px] animate-pulse bg-slate-100" />
                }
              >
                {isGoogleMode ? <GoogleMapsMapView
                  ref={mapRef}
                  markers={markerItems}
                  userLocation={userLocation}
                  selectedMarkerId={selectedMarkerId}
                  hoveredMarkerId={hoveredMarkerId}
                  onSelectMarker={(m) => setSelectedMarkerId(m ? m.id : null)}
                  onBoundsChange={(bounds) => setFilters((prev) => ({ ...prev, bounds }))}
                  onUserLocationChange={setUserLocation}
                  onViewShop={(shopId) => { window.location.href = `/store/${shopId}`; }}
                  className="h-[calc(100vh-210px)] min-h-[560px] max-h-[760px] w-full"
                /> : <InteractiveMapView
                  ref={mapRef}
                  markers={markerItems}
                  userLocation={userLocation}
                  selectedMarkerId={selectedMarkerId}
                  hoveredMarkerId={hoveredMarkerId}
                  onSelectMarker={(m) => setSelectedMarkerId(m ? m.id : null)}
                  onBoundsChange={(bounds) => setFilters((prev) => ({ ...prev, bounds }))}
                  onUserLocationChange={setUserLocation}
                  className="h-[calc(100vh-210px)] min-h-[560px] max-h-[760px] w-full"
                />}
              </Suspense>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE FULLSCREEN MAP MODAL OVERLAY */}
      {isMobileMapOpen && (
        <div className="fixed inset-0 z-[120] flex flex-col bg-white lg:hidden animate-in fade-in duration-200">
          {/* Top Navbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white shadow-xs">
            <button
              type="button"
              onClick={() => {
                setIsMobileMapOpen(false);
                onCloseMap?.();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold"
            >
              ✕
            </button>
            <div className="text-center">
              <h3 className="font-bold text-sm text-slate-900">{selectedCategoryLabel ? `${selectedCategoryLabel} shops` : "Shops near you"}</h3>
              <p className="text-[10px] text-slate-500">{registeredCount} matching shops</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsMobileMapOpen(false);
                onCloseMap?.();
              }}
              className="inline-flex items-center gap-1 rounded-full border border-[#981495] px-3 py-1 text-xs font-bold text-[#981495]"
            >
              List View
            </button>
          </div>

          {/* Map Container */}
          <div className="flex-1 relative">
            <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-100" />}>
              {isGoogleMode ? <GoogleMapsMapView
                ref={mapRef}
                markers={markerItems}
                userLocation={userLocation}
                selectedMarkerId={selectedMarkerId}
                hoveredMarkerId={hoveredMarkerId}
                onSelectMarker={(m) => setSelectedMarkerId(m ? m.id : null)}
                onBoundsChange={(bounds) => setFilters((prev) => ({ ...prev, bounds }))}
                onUserLocationChange={setUserLocation}
                onViewShop={(shopId) => { window.location.href = `/store/${shopId}`; }}
                className="h-full w-full rounded-none border-0"
              /> : <InteractiveMapView
                ref={mapRef}
                markers={markerItems}
                userLocation={userLocation}
                selectedMarkerId={selectedMarkerId}
                hoveredMarkerId={hoveredMarkerId}
                onSelectMarker={(m) => setSelectedMarkerId(m ? m.id : null)}
                onBoundsChange={(bounds) => setFilters((prev) => ({ ...prev, bounds }))}
                onUserLocationChange={setUserLocation}
                className="h-full w-full rounded-none border-0"
              />}
            </Suspense>
          </div>
        </div>
      )}

      {/* Mobile Floating Map/List Bar */}
      <div className="fixed bottom-[80px] inset-x-0 z-[60] flex justify-center pointer-events-none lg:hidden">
        <button
          type="button"
          onClick={() => setIsMobileMapOpen((isOpen) => !isOpen)}
          aria-label={isMobileMapOpen ? "Show nearby shop list" : "Show nearby shops on map"}
          className="pointer-events-auto flex items-center gap-2 rounded-full bg-[#981495] px-5 py-3 text-xs font-bold text-white shadow-2xl hover:scale-105 active:scale-95 transition-all"
        >
          {isMobileMapOpen ? (
            <>
              <span>Show list</span>
              <span>📋</span>
            </>
          ) : (
            <>
              <span>Show map</span>
              <span>🗺️</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function NeighborhoodMapPreviewCard({
  markers = [],
  onOpenMap,
}: {
  markers?: MapMarkerItem[];
  onOpenMap: () => void;
}) {
  const topNearest = useMemo(() => {
    return [...markers].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 4);
  }, [markers]);

  const [p0, p1, p2, p3] = topNearest;
  const getDistanceLabel = (item: MapMarkerItem) => `${item.distanceKm.toFixed(1)} km away`;

  if (markers.length === 0) {
    return (
      <div className="mb-8 rounded-3xl border border-[#EBD9F0] bg-white p-6 sm:p-8">
        <h3 className="font-display text-xl font-bold text-[#21162B]">Explore LocalShore nearby</h3>
        <p className="mt-2 text-sm text-slate-600">No shops match this category near your selected location yet.</p>
        <button type="button" onClick={onOpenMap} className="mt-4 rounded-full bg-[#981495] px-5 py-2.5 text-sm font-bold text-white">Open map</button>
      </div>
    );
  }

  return (
    <div className="w-full rounded-3xl sm:rounded-[36px] bg-white border border-[var(--sand)]/80 shadow-xl p-6 sm:p-8 md:p-10 mb-8 flex flex-col lg:flex-row items-center justify-between gap-8 overflow-hidden relative transition-all">
      {/* Left Content Column */}
      <div className="flex-1 max-w-xl space-y-4">
        {/* Main Headline */}
        <div>
          <h3 className="font-['Outfit'] text-3xl sm:text-4xl md:text-[48px] font-extrabold text-[#1E1B4B] tracking-tight leading-[1.1]">
            Your neighborhood,{" "}
            <span className="relative inline-block font-['Urbanist'] sm:font-['Outfit'] font-black text-transparent bg-clip-text bg-gradient-to-r from-[#8b5cf6] via-[#a855f7] to-[#7e22ce] pb-1">
              delivered
              {/* Organic brush underline matching reference image */}
              <svg
                className="absolute -bottom-1.5 left-0 w-full h-3 text-[#9333ea]"
                viewBox="0 0 140 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M 3 9 C 35 3, 95 12, 137 5"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  opacity="0.85"
                />
              </svg>
              {/* 3 Radiating ray lines on the right of delivered */}
              <span className="absolute -top-1 -right-6 flex flex-col gap-1 text-[#c026d3]">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="2" y1="10" x2="6" y2="10" />
                  <line x1="4" y1="4" x2="8" y2="7" />
                  <line x1="4" y1="16" x2="8" y2="13" />
                </svg>
              </span>
            </span>
          </h3>
          <p className="text-sm sm:text-base font-bold text-slate-500 mt-2.5">
            Discover nearest verified shops around you
          </p>
        </div>

        {/* 2x2 Feature Pills Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Pill 1 */}
          <div className="flex items-center gap-2.5 rounded-full bg-slate-50 border border-slate-200/60 px-3.5 py-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <MapPin className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-slate-700">
              Real local shops near your address
            </span>
          </div>

          {/* Pill 2 */}
          <div className="flex items-center gap-2.5 rounded-full bg-slate-50 border border-slate-200/60 px-3.5 py-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-600">
              <StoreIcon className="h-3.5 w-3.5 text-pink-600" />
            </div>
            <span className="text-xs font-bold text-slate-700">
              Support your neighborhood vendors
            </span>
          </div>

          {/* Pill 3 */}
          <div className="flex items-center gap-2.5 rounded-full bg-slate-50 border border-slate-200/60 px-3.5 py-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--sand)] text-[#981495]">
              <span className="text-xs font-black">∅</span>
            </div>
            <span className="text-xs font-bold text-slate-700">No dark stores</span>
          </div>

          {/* Pill 4 */}
          <div className="flex items-center gap-2.5 rounded-full bg-slate-50 border border-slate-200/60 px-3.5 py-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            </div>
            <span className="text-xs font-bold text-slate-700">Faster, fresher delivery</span>
          </div>
        </div>

        {/* CTA Button & Handwritten Note */}
        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 w-full">
          <div className="relative inline-flex items-center">
            <button
              type="button"
              onClick={onOpenMap}
              className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#7e22ce] to-[#6b21a8] hover:from-[#6b21a8] hover:to-[#581c87] px-7 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-[#c026d3]/30 transition-all active:scale-95 group cursor-pointer"
            >
              <span>View on map</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            {/* Radiating Ray Lines on right of button */}
            <svg
              className="ml-2 w-5 h-5 text-[#c026d3]"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="2" y1="10" x2="6" y2="10" />
              <line x1="4" y1="4" x2="8" y2="7" />
              <line x1="4" y1="16" x2="8" y2="13" />
            </svg>
          </div>

          <div className="flex flex-col font-['Caveat'] text-lg text-[#981495]/90 leading-tight">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-pink-500">♡</span> Local shops. Real people.
            </div>
            <div className="relative font-bold inline-block">
              Better together.
              <svg
                className="absolute -bottom-1 left-0 w-full h-2 text-[#c026d3]/80"
                viewBox="0 0 100 8"
                fill="none"
              >
                <path
                  d="M2 5C30 2, 70 7, 98 3"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Right Graphic Area: Light Vector Map Canvas with Floating Dynamic Shop Cards */}
      <div
        onClick={onOpenMap}
        className="relative w-full lg:w-[500px] h-[300px] sm:h-[320px] rounded-3xl bg-[#f8fafc] border border-[var(--sand)]/90 overflow-hidden shadow-inner cursor-pointer group shrink-0"
      >
        {/* Stylized Light Vector Map Graphic */}
        <svg
          className="absolute inset-0 w-full h-full object-cover opacity-75"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="#f8fafc" />
          <rect width="100%" height="100%" fill="url(#gridPattern)" />

          {/* Green Park Polygons */}
          <path d="M 20 20 Q 90 10, 120 70 T 170 140 L 40 160 Z" fill="#d1fae5" opacity="0.65" />
          <path d="M 340 190 Q 400 170, 440 230 L 360 280 Z" fill="#d1fae5" opacity="0.65" />

          {/* Blue Water River Accent */}
          <path
            d="M 420 0 Q 450 100, 500 180"
            fill="none"
            stroke="#bae6fd"
            strokeWidth="24"
            opacity="0.75"
          />

          {/* White & Gray Roads */}
          <path d="M -20 120 L 520 140" fill="none" stroke="#ffffff" strokeWidth="16" />
          <path d="M -20 120 L 520 140" fill="none" stroke="#cbd5e1" strokeWidth="8" />

          <path d="M 200 -10 L 240 340" fill="none" stroke="#ffffff" strokeWidth="18" />
          <path d="M 200 -10 L 240 340" fill="none" stroke="#cbd5e1" strokeWidth="10" />

          <path d="M 70 -10 L 340 340" fill="none" stroke="#ffffff" strokeWidth="12" />
          <path d="M 70 -10 L 340 340" fill="none" stroke="#e2e8f0" strokeWidth="6" />

          <path d="M 320 20 Q 260 160, 500 220" fill="none" stroke="#ffffff" strokeWidth="14" />
          <path d="M 320 20 Q 260 160, 500 220" fill="none" stroke="#cbd5e1" strokeWidth="7" />
        </svg>

        {/* Center User Location Marker ("You are here") */}
        <div className="absolute top-[46%] left-[62%] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
          <div className="bg-[#2563eb] text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg border border-white flex items-center gap-1 whitespace-nowrap mb-1 animate-bounce">
            <span>You are here</span>
          </div>
          <div className="relative flex items-center justify-center">
            <span className="absolute h-8 w-8 rounded-full bg-blue-500/30 animate-ping" />
            <span className="h-4 w-4 rounded-full bg-blue-600 border-2 border-white shadow-md" />
          </div>
        </div>

        {/* 4 Floating Shop Cards connected to map pins */}

        {/* Only show real shops returned for the selected category. */}
        {p0 && (
        <div className="absolute top-4 left-4 flex items-center gap-2.5 rounded-2xl bg-white/95 backdrop-blur-xs p-2 pr-3 shadow-lg border border-emerald-100 z-10 transition-transform group-hover:scale-105 max-w-[180px] sm:max-w-[210px] min-w-0">
          <img
            src={p0.productImage || (p0 as any).imageUrl || "/assets/grocery-basket.png"}
            alt={p0.shopName}
            className="w-9 h-9 rounded-xl object-cover border border-slate-200/60 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-xs font-black text-slate-900 leading-tight truncate">
                {p0.shopName}
              </span>
              {!p0.isDemo && <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white text-[8px] font-bold">
                ✓
              </span>}
            </div>
            <p className="text-[9px] font-semibold text-slate-400 truncate">
              {p0.category || "Local shop"}
            </p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-0.5 whitespace-nowrap">
              <MapPin className="h-3 w-3 fill-emerald-600 shrink-0" />
              <span>{getDistanceLabel(p0)}</span>
            </div>
          </div>
        </div>
        )}

        {p1 && (
        <div className="absolute top-4 right-4 flex items-center gap-2.5 rounded-2xl bg-white/95 backdrop-blur-xs p-2 pr-3 shadow-lg border border-[var(--sand)] z-10 transition-transform group-hover:scale-105 max-w-[180px] sm:max-w-[210px] min-w-0">
          <img
            src={p1.productImage || (p1 as any).imageUrl || "/assets/clothing.png"}
            alt={p1.shopName}
            className="w-9 h-9 rounded-xl object-cover border border-slate-200/60 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-xs font-black text-slate-900 leading-tight truncate">
                {p1.shopName}
              </span>
              {!p1.isDemo && <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#c026d3] text-white text-[8px] font-bold">
                ✓
              </span>}
            </div>
            <p className="text-[9px] font-semibold text-slate-400 truncate">
              {p1.category || "Local shop"}
            </p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#c026d3] mt-0.5 whitespace-nowrap">
              <MapPin className="h-3 w-3 fill-[#c026d3] shrink-0" />
              <span>{getDistanceLabel(p1)}</span>
            </div>
          </div>
        </div>
        )}

        {p2 && (
        <div className="absolute bottom-12 left-4 flex items-center gap-2.5 rounded-2xl bg-white/95 backdrop-blur-xs p-2 pr-3 shadow-lg border border-amber-100 z-10 transition-transform group-hover:scale-105 max-w-[180px] sm:max-w-[210px] min-w-0">
          <img
            src={p2.productImage || (p2 as any).imageUrl || "/assets/chocolate-cake.png"}
            alt={p2.shopName}
            className="w-9 h-9 rounded-xl object-cover border border-slate-200/60 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-xs font-black text-slate-900 leading-tight truncate">
                {p2.shopName}
              </span>
              {!p2.isDemo && <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white text-[8px] font-bold">
                ✓
              </span>}
            </div>
            <p className="text-[9px] font-semibold text-slate-400 truncate">
              {p2.category || "Local shop"}
            </p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 mt-0.5 whitespace-nowrap">
              <MapPin className="h-3 w-3 fill-amber-500 shrink-0" />
              <span>{getDistanceLabel(p2)}</span>
            </div>
          </div>
        </div>
        )}

        {p3 && (
        <div className="absolute bottom-16 right-4 flex items-center gap-2.5 rounded-2xl bg-white/95 backdrop-blur-xs p-2 pr-3 shadow-lg border border-rose-100 z-10 transition-transform group-hover:scale-105 max-w-[180px] sm:max-w-[210px] min-w-0">
          <img
            src={p3.productImage || (p3 as any).imageUrl || "/assets/pharmacy-medicines.png"}
            alt={p3.shopName}
            className="w-9 h-9 rounded-xl object-cover border border-slate-200/60 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-xs font-black text-slate-900 leading-tight truncate">
                {p3.shopName}
              </span>
              {!p3.isDemo && <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white text-[8px] font-bold">
                ✓
              </span>}
            </div>
            <p className="text-[9px] font-semibold text-slate-400 truncate">
              {p3.category || "Local shop"}
            </p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 mt-0.5 whitespace-nowrap">
              <MapPin className="h-3 w-3 fill-rose-500 shrink-0" />
              <span>{getDistanceLabel(p3)}</span>
            </div>
          </div>
        </div>
        )}

        {/* Map Bottom Left CTA Pill */}
        <div className="absolute bottom-3 left-4 bg-white/90 backdrop-blur-xs px-3.5 py-1.5 rounded-full text-xs font-bold text-[#7e22ce] shadow-md border border-[var(--sand)] flex items-center gap-1.5 opacity-95 group-hover:opacity-100 transition-opacity z-20">
          <span>📖 Click to explore live map</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </div>

        {/* Map Bottom Right Purple Dashed Delivery Truck Trail Accent */}
        <div className="absolute bottom-2 right-4 flex items-center gap-1.5 opacity-80 pointer-events-none z-10">
          <svg className="w-20 h-4 text-[#c026d3]" viewBox="0 0 80 16" fill="none">
            <path
              d="M 2 12 Q 25 4, 78 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          </svg>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7e22ce] text-white shadow-md text-xs">
            🚚
          </div>
        </div>
      </div>
    </div>
  );
}
