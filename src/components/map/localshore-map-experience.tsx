import { useState, useMemo, useRef, useEffect, startTransition } from "react";
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
import { InteractiveMapView, type InteractiveMapViewRef } from "./interactive-map-view";

import type { MapFilterOptions, MapLocation, MapMarkerItem } from "@/lib/map-service/types";
import { getMapMarkerItems, isTestEntity } from "@/lib/map-service/store-engine";
import { geocodeSearch } from "@/lib/map-service/providers";
import { Link } from "@tanstack/react-router";
import { categoryColor, categoryLabel } from "@/lib/mock-data";
import { getFallbackProductImage, isValidImageUrl } from "@/lib/image-utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDeliveryLocation, detectCurrentGPSLocation } from "@/lib/location-store";
import { getCategoryByIdOrSlug } from "@/lib/shop-categories";

// Quick category filter tabs matching the reference design
const QUICK_FILTERS = [
  { id: "all", label: "All Shops" },
  { id: "grocery", label: "Kirana & Grocery" },
  { id: "bakery", label: "Bakeries" },
  { id: "pharmacy", label: "Pharmacies" },
  { id: "restaurants", label: "Restaurants" },
  { id: "fashion", label: "Fashion" },
  { id: "electronics", label: "Electronics" },
] as const;

interface Props {
  initialQuery?: string;
  initialCategory?: string;
  onQueryChange?: (q: string) => void;
  onCategoryChange?: (c: string) => void;
}

// Default center: Kovilmedu, Coimbatore localshore market
const DEFAULT_LOCATION: MapLocation = {
  lat: 11.0285,
  lng: 76.9258,
  label: "Kovilmedu, Coimbatore",
};

export function LocalShoreMapExperience({
  initialQuery = "",
  initialCategory = "all",
  onQueryChange,
  onCategoryChange,
}: Props) {
  const mapRef = useRef<InteractiveMapViewRef>(null);
  const [deliveryLoc] = useDeliveryLocation();
  const [view, setView] = useState<"map" | "list">("map");
  const [userLocation, setUserLocation] = useState<MapLocation>(() => ({
    lat: deliveryLoc?.lat ?? DEFAULT_LOCATION.lat,
    lng: deliveryLoc?.lng ?? DEFAULT_LOCATION.lng,
    label: deliveryLoc?.area || deliveryLoc?.label || DEFAULT_LOCATION.label,
  }));

  useEffect(() => {
    if (deliveryLoc && deliveryLoc.lat && deliveryLoc.lng) {
      setUserLocation({
        lat: deliveryLoc.lat,
        lng: deliveryLoc.lng,
        label: deliveryLoc.area || deliveryLoc.label || DEFAULT_LOCATION.label,
      });
      mapRef.current?.flyToLocation(deliveryLoc.lat, deliveryLoc.lng, 13.5);
    }
  }, [deliveryLoc]);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Search & Filter State - Defaults to 3 km radius near user location initially
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<MapFilterOptions>({
    query: initialQuery,
    category: initialCategory !== "all" ? (initialCategory as any) : undefined,
    maxDistanceKm: 25, // Show all verified local shops within 25 km radius
  });
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);

  // Sync external props with internal filter state
  useEffect(() => {
    setQuery(initialQuery);
    setFilters((prev) => ({
      ...prev,
      query: initialQuery,
      category: initialCategory !== "all" ? (initialCategory as any) : undefined,
    }));
  }, [initialQuery, initialCategory]);

  // Query live Supabase approved vendor catalog & product catalog (cached across app)
  const approvedProducts = useQuery({
    queryKey: ["approved-product-catalog"],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      try {
        const { data: catData, error: catError } = await (supabase as any)
          .from("approved_product_catalog")
          .select(
            "id,seller_id,name,category,selling_price,image_url,stock,shop_name,business_type,city,state,address_line1",
          );
        let data = catData;
        if (catError) {
          const fallback = await (supabase as any)
            .from("products")
            .select("id,seller_id,name,category,selling_price,image_url,stock")
            .in("status", ["active", "approved"]);
          data = fallback.data;
        }
        return (data ?? []).filter((p: any) => !isTestEntity(p.name));
      } catch (err) {
        console.warn("Map products query fallback:", err);
        return [];
      }
    },
  });

  const approvedVendors = useQuery({
    queryKey: ["approved-vendors"],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      try {
        const { data } = await (supabase as any)
          .from("approved_vendor_catalog")
          .select("id,shop_name,business_type,city,state,address_line1,category,lat,lng");
        return (data ?? []).filter((v: any) => !isTestEntity(v.shop_name));
      } catch (err) {
        console.warn("Map vendors query fallback:", err);
        return [];
      }
    },
  });

  // Calculate Product-Aware Map Markers
  const markerItems: MapMarkerItem[] = useMemo(() => {
    return getMapMarkerItems(
      userLocation,
      filters,
      approvedProducts.data ?? [],
      approvedVendors.data ?? [],
    );
  }, [userLocation, filters, approvedProducts.data, approvedVendors.data]);

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
      label: result.placeName.split(",")[0],
    };
    setUserLocation(loc);
    setLocationSearchQuery("");
    setLocationSuggestions([]);
    mapRef.current?.flyToLocation(loc.lat, loc.lng, 14);
    toast.success(`Location set to ${loc.label}`);
  };

  const handleUseGPS = async () => {
    try {
      const freshLoc = await detectCurrentGPSLocation({ silent: false });
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

  const activeQuickFilter = filters.category
    ? getCategoryByIdOrSlug(filters.category).id
    : "all";
  const [showDesktopMap, setShowDesktopMap] = useState(false);
  const [isMobileMapOpen, setIsMobileMapOpen] = useState(false);

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
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Shops near you
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-[11px] font-bold text-[#981495]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#981495] animate-pulse" />
              Verified Local Sellers
            </span>
          </div>
          <p className="mt-0.5 text-xs md:text-sm text-slate-500 font-medium">
            <strong className="text-slate-900 font-bold">{markerItems.length} local stores</strong>{" "}
            verified in this area
          </p>
        </div>

        {/* Action Button: One-Button Map Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowDesktopMap(!showDesktopMap);
              setIsMobileMapOpen(!isMobileMapOpen);
            }}
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#981495] bg-white px-4 py-2 text-xs md:text-sm font-bold text-[#981495] shadow-xs hover:bg-[#981495] hover:text-white transition-all active:scale-95"
          >
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{showDesktopMap ? "Close Map" : "View Map"}</span>
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SHOP CARDS PANEL */}
        <div
          className={`flex flex-col transition-all duration-300 ${
            showDesktopMap ? "lg:col-span-6" : "lg:col-span-12"
          }`}
        >
          {markerItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
              <div className="mx-auto text-4xl mb-3">🔍</div>
              <p className="font-bold text-slate-900 text-base">No shops found nearby</p>
              <p className="mt-1 text-xs text-slate-500">
                Try adjusting your category or search filters.
              </p>
            </div>
          ) : (
            <div
              className={`grid gap-4 pb-8 ${
                showDesktopMap
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              }`}
            >
              {markerItems.map((item) => {
                const isSelected = selectedMarkerId === item.id;
                const imgUrl = isValidImageUrl(item.productImage)
                  ? item.productImage
                  : getFallbackProductImage(item.productName, item.category);
                const badgeColor = getBadgeColor(item.category);
                const catName = categoryLabel[item.category] || item.category;
                const priceMin = item.minPrice;
                const priceMax = item.maxPrice ?? item.minPrice;

                return (
                  <Link
                    key={item.id}
                    to="/store/$storeId"
                    params={{ storeId: item.shopId }}
                    onMouseEnter={() => setHoveredMarkerId(item.id)}
                    onMouseLeave={() => setHoveredMarkerId(null)}
                    onClick={() => {
                      setSelectedMarkerId(item.id);
                      mapRef.current?.flyToLocation(item.lat, item.lng, 14.5);
                    }}
                    className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white border cursor-pointer transition-all duration-250 ${
                      isSelected
                        ? "border-[#981495] ring-2 ring-[#981495]/20 shadow-xl scale-[1.01]"
                        : "border-slate-200/80 hover:border-[#981495]/40 hover:shadow-lg hover:-translate-y-0.5"
                    }`}
                  >
                    {/* Store / Product Image with Badges */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                      <img
                        src={imgUrl}
                        alt={item.productName}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Top Pick Badge */}
                      <div className="absolute top-2.5 left-2.5 rounded-full bg-white/95 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold text-slate-900 shadow-sm border border-slate-200/40">
                        {item.distanceKm <= 2 ? "Top Pick" : "Verified Store"}
                      </div>

                      {/* Wishlist Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toast.success(`Saved ${item.shopName} to Wishlist`);
                        }}
                        className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-md hover:text-red-500 hover:scale-110 active:scale-90 transition-all"
                      >
                        <svg
                          className="h-4 w-4 fill-none stroke-current stroke-[2]"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>

                      {/* Category Tag Overlay */}
                      <span
                        className="absolute bottom-2.5 left-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: badgeColor }}
                      >
                        {catName}
                      </span>
                    </div>

                    {/* Card Content Body */}
                    <div className="p-3.5 flex flex-col gap-1.5 flex-1 justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-[14px] text-slate-900 line-clamp-1 group-hover:text-[#981495] transition-colors">
                            {item.shopName}
                          </h3>
                          <div className="flex items-center gap-0.5 shrink-0 text-[12px] font-bold text-slate-700">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span>{item.rating.toFixed(1)}</span>
                            <span className="font-normal text-slate-400 ml-0.5">
                              ({Math.floor(item.rating * 15)})
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {item.productName}
                        </p>

                        <p className="text-[11px] font-semibold text-[#981495] flex items-center gap-1.5 mt-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#981495] inline-block animate-pulse" />
                          Available for pickup &amp; instant delivery
                        </p>
                      </div>

                      {/* Price & View Shop Footer */}
                      <div className="mt-2 flex items-center justify-between pt-2.5 border-t border-slate-100">
                        <div>
                          <span className="font-extrabold text-[14px] text-slate-900">
                            ₹{priceMin}–₹{priceMax}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">total</span>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3.5 py-1.5 text-[11px] font-bold text-[#981495] group-hover:bg-[#981495] group-hover:text-white transition-all shadow-2xs">
                          View Shop
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Sticky MapLibre GL Interactive Map (Desktop View) */}
        {showDesktopMap && (
          <div className="hidden lg:block lg:col-span-6 sticky top-20">
            <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-lg">
              <InteractiveMapView
                ref={mapRef}
                markers={markerItems}
                userLocation={userLocation}
                selectedMarkerId={selectedMarkerId}
                hoveredMarkerId={hoveredMarkerId}
                onSelectMarker={(m) => setSelectedMarkerId(m ? m.id : null)}
                onBoundsChange={(bounds) => setFilters((prev) => ({ ...prev, bounds }))}
                onUserLocationChange={setUserLocation}
                className="h-[calc(100vh-210px)] min-h-[560px] max-h-[760px] w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* MOBILE FULLSCREEN MAP MODAL OVERLAY */}
      {isMobileMapOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden animate-in fade-in duration-200">
          {/* Top Navbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white shadow-xs">
            <button
              type="button"
              onClick={() => setIsMobileMapOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold"
            >
              ✕
            </button>
            <div className="text-center">
              <h3 className="font-bold text-sm text-slate-900">Shops near you</h3>
              <p className="text-[10px] text-slate-500">{markerItems.length} verified stores</p>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMapOpen(false)}
              className="inline-flex items-center gap-1 rounded-full border border-[#981495] px-3 py-1 text-xs font-bold text-[#981495]"
            >
              List View
            </button>
          </div>

          {/* Map Container */}
          <div className="flex-1 relative">
            <InteractiveMapView
              ref={mapRef}
              markers={markerItems}
              userLocation={userLocation}
              selectedMarkerId={selectedMarkerId}
              hoveredMarkerId={hoveredMarkerId}
              onSelectMarker={(m) => setSelectedMarkerId(m ? m.id : null)}
              onBoundsChange={(bounds) => setFilters((prev) => ({ ...prev, bounds }))}
              onUserLocationChange={setUserLocation}
              className="h-full w-full rounded-none border-0"
            />
          </div>
        </div>
      )}

      {/* Mobile Floating Map/List Bar */}
      <div className="fixed bottom-[80px] inset-x-0 z-40 flex justify-center pointer-events-none lg:hidden">
        <button
          onClick={() => setIsMobileMapOpen(!isMobileMapOpen)}
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

  const p0 = topNearest[0] || {
    shopName: "FreshMart",
    category: "Groceries & Essentials",
    distanceKm: 0.9,
    etaMin: 15,
    imageUrl: "/assets/grocery-basket.png",
  };
  const p1 = topNearest[1] || {
    shopName: "StyleHaven",
    category: "Fashion & Lifestyle",
    distanceKm: 1.2,
    etaMin: 18,
    imageUrl: "/assets/clothing.png",
  };
  const p2 = topNearest[2] || {
    shopName: "SweetBites",
    category: "Bakery & Cakes",
    distanceKm: 0.7,
    etaMin: 12,
    imageUrl: "/assets/chocolate-cake.png",
  };
  const p3 = topNearest[3] || {
    shopName: "HealthPlus",
    category: "Pharmacy & Wellness",
    distanceKm: 1.4,
    etaMin: 20,
    imageUrl: "/assets/pharmacy-medicines.png",
  };

  const getEtaString = (item: any) => {
    const min = item.etaMin ?? Math.max(10, Math.round((item.distanceKm || 1) * 5 + 10));
    const dist = item.distanceKm ? ` (${item.distanceKm.toFixed(1)} km)` : "";
    return `${min} min${dist}`;
  };

  return (
    <div className="w-full rounded-3xl sm:rounded-[36px] bg-white border border-purple-100/80 shadow-xl p-6 sm:p-8 md:p-10 mb-8 flex flex-col lg:flex-row items-center justify-between gap-8 overflow-hidden relative transition-all">
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
              <span className="absolute -top-1 -right-6 flex flex-col gap-1 text-purple-500">
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
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700">
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
              className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#7e22ce] to-[#6b21a8] hover:from-[#6b21a8] hover:to-[#581c87] px-7 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-purple-500/30 transition-all active:scale-95 group cursor-pointer"
            >
              <span>View on map</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            {/* Radiating Ray Lines on right of button */}
            <svg
              className="ml-2 w-5 h-5 text-purple-400"
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

          <div className="flex flex-col font-['Caveat'] text-lg text-purple-900/90 leading-tight">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-pink-500">♡</span> Local shops. Real people.
            </div>
            <div className="relative font-bold inline-block">
              Better together.
              <svg
                className="absolute -bottom-1 left-0 w-full h-2 text-purple-400/80"
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
        className="relative w-full lg:w-[500px] h-[300px] sm:h-[320px] rounded-3xl bg-[#f8fafc] border border-purple-100/90 overflow-hidden shadow-inner cursor-pointer group shrink-0"
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
          <path
            d="M 340 190 Q 400 170, 440 230 L 360 280 Z"
            fill="#d1fae5"
            opacity="0.65"
          />

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

          <path
            d="M 320 20 Q 260 160, 500 220"
            fill="none"
            stroke="#ffffff"
            strokeWidth="14"
          />
          <path
            d="M 320 20 Q 260 160, 500 220"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="7"
          />
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

        {/* Card 1: Top Left - FreshMart */}
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
              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white text-[8px] font-bold">
                ✓
              </span>
            </div>
            <p className="text-[9px] font-semibold text-slate-400 truncate">
              {p0.category || "Groceries & Essentials"}
            </p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-0.5 whitespace-nowrap">
              <MapPin className="h-3 w-3 fill-emerald-600 shrink-0" />
              <span>{getEtaString(p0)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Top Right - StyleHaven */}
        <div className="absolute top-4 right-4 flex items-center gap-2.5 rounded-2xl bg-white/95 backdrop-blur-xs p-2 pr-3 shadow-lg border border-purple-100 z-10 transition-transform group-hover:scale-105 max-w-[180px] sm:max-w-[210px] min-w-0">
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
              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-purple-500 text-white text-[8px] font-bold">
                ✓
              </span>
            </div>
            <p className="text-[9px] font-semibold text-slate-400 truncate">
              {p1.category || "Fashion & Lifestyle"}
            </p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-purple-600 mt-0.5 whitespace-nowrap">
              <MapPin className="h-3 w-3 fill-purple-600 shrink-0" />
              <span>{getEtaString(p1)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Bottom Left - SweetBites */}
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
              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white text-[8px] font-bold">
                ✓
              </span>
            </div>
            <p className="text-[9px] font-semibold text-slate-400 truncate">
              {p2.category || "Bakery & Cakes"}
            </p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 mt-0.5 whitespace-nowrap">
              <MapPin className="h-3 w-3 fill-amber-500 shrink-0" />
              <span>{getEtaString(p2)}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Bottom Right - HealthPlus / Roja Bakes */}
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
              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white text-[8px] font-bold">
                ✓
              </span>
            </div>
            <p className="text-[9px] font-semibold text-slate-400 truncate">
              {p3.category || "Pharmacy & Wellness"}
            </p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 mt-0.5 whitespace-nowrap">
              <MapPin className="h-3 w-3 fill-rose-500 shrink-0" />
              <span>{getEtaString(p3)}</span>
            </div>
          </div>
        </div>

        {/* Map Bottom Left CTA Pill */}
        <div className="absolute bottom-3 left-4 bg-white/90 backdrop-blur-xs px-3.5 py-1.5 rounded-full text-xs font-bold text-[#7e22ce] shadow-md border border-purple-100 flex items-center gap-1.5 opacity-95 group-hover:opacity-100 transition-opacity z-20">
          <span>📖 Click to explore live map</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </div>

        {/* Map Bottom Right Purple Dashed Delivery Truck Trail Accent */}
        <div className="absolute bottom-2 right-4 flex items-center gap-1.5 opacity-80 pointer-events-none z-10">
          <svg className="w-20 h-4 text-purple-500" viewBox="0 0 80 16" fill="none">
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
