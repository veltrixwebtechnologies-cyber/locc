import { useState, useMemo, useRef, useEffect } from "react";
import { MapPin, Locate, ArrowRight, Star, Filter, Check, Zap, Store as StoreIcon } from "lucide-react";
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
import { useDeliveryLocation } from "@/lib/location-store";

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

// Default center: Pappampatti Pirivu, Coimbatore localshore market
const DEFAULT_LOCATION: MapLocation = {
  lat: 11.0028,
  lng: 77.0865,
  label: "Pappampatti Pirivu, Coimbatore",
};

export function LocalShoreMapExperience({
  initialQuery = "",
  initialCategory = "all",
  onQueryChange,
  onCategoryChange,
}: Props) {
  const mapRef = useRef<InteractiveMapViewRef>(null);
  const [view, setView] = useState<"map" | "list">("map");
  const [userLocation, setUserLocation] = useState<MapLocation>(DEFAULT_LOCATION);
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
        let { data, error } = await (supabase as any)
          .from("approved_product_catalog")
          .select("id,seller_id,name,category,selling_price,image_url,stock,shop_name,business_type,city,state,address_line1");
        if (error) {
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
      approvedVendors.data ?? []
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

  const handleUseGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            label: "Your current location",
          };
          setUserLocation(loc);
          mapRef.current?.flyToLocation(loc.lat, loc.lng, 14.5);
          toast.success("Recentered to your live GPS location.");
        },
        (err) => {
          toast.error("Location permission denied or unavailable.");
        }
      );
    }
  };

  const handleProductSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, query }));
    onQueryChange?.(query);
  };

  const activeQuickFilter = filters.category ?? "all";
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
            <strong className="text-slate-900 font-bold">{markerItems.length} local stores</strong> verified in this area
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

      {/* CATEGORY FILTER PILLS BAR */}
      <div className="my-4 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
        {QUICK_FILTERS.map((f) => {
          const isActive = f.id === activeQuickFilter;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                const newCat = f.id === "all" ? undefined : (f.id as any);
                setFilters((prev) => ({ ...prev, category: newCat }));
                onCategoryChange?.(f.id);
              }}
              className={`shrink-0 rounded-full px-4 py-2 text-xs md:text-sm font-bold transition-all ${
                isActive
                  ? "bg-[#981495] text-white shadow-md shadow-purple-900/10 scale-[1.02]"
                  : "bg-slate-100/90 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 border border-slate-200/60"
              }`}
            >
              {f.label}
            </button>
          );
        })}
        <button
          type="button"
          className="shrink-0 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
        </button>
      </div>

      {/* NEIGHBORHOOD MAP PREVIEW CARD (Shown when map is closed, matching exact reference UI) */}
      {!showDesktopMap && (
        <NeighborhoodMapPreviewCard
          onOpenMap={() => {
            setShowDesktopMap(true);
            setIsMobileMapOpen(true);
          }}
        />
      )}

      {/* MAIN CONTAINER: Dynamic Responsive Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SHOP CARDS PANEL */}
        <div className={`flex flex-col transition-all duration-300 ${
          showDesktopMap ? "lg:col-span-6" : "lg:col-span-12"
        }`}>
          {markerItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
              <div className="mx-auto text-4xl mb-3">🔍</div>
              <p className="font-bold text-slate-900 text-base">No shops found nearby</p>
              <p className="mt-1 text-xs text-slate-500">Try adjusting your category or search filters.</p>
            </div>
          ) : (
            <div className={`grid gap-4 pb-8 ${
              showDesktopMap 
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2" 
                : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            }`}>
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
                  <div
                    key={item.id}
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
                          e.stopPropagation();
                          toast.success(`Saved ${item.shopName} to Wishlist`);
                        }}
                        className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-md hover:text-red-500 hover:scale-110 active:scale-90 transition-all"
                      >
                        <svg className="h-4 w-4 fill-none stroke-current stroke-[2]" viewBox="0 0 24 24">
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
                            <span className="font-normal text-slate-400 ml-0.5">({Math.floor(item.rating * 15)})</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.productName}</p>

                        <p className="text-[11px] font-semibold text-[#981495] flex items-center gap-1.5 mt-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#981495] inline-block animate-pulse" />
                          Available for pickup &amp; instant delivery
                        </p>
                      </div>

                      {/* Price & View Shop Footer */}
                      <div className="mt-2 flex items-center justify-between pt-2.5 border-t border-slate-100">
                        <div>
                          <span className="font-extrabold text-[14px] text-slate-900">₹{priceMin}–₹{priceMax}</span>
                          <span className="text-[10px] text-slate-400 ml-1">total</span>
                        </div>
                        <Link
                          to="/store/$storeId"
                          params={{ storeId: item.shopId }}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3.5 py-1.5 text-[11px] font-bold text-[#981495] hover:bg-[#981495] hover:text-white transition-all shadow-2xs"
                        >
                          View Shop
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
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
            <><span>Show list</span><span>📋</span></>
          ) : (
            <><span>Show map</span><span>🗺️</span></>
          )}
        </button>
      </div>
    </div>
  );
}

function NeighborhoodMapPreviewCard({ onOpenMap }: { onOpenMap: () => void }) {
  return (
    <div className="w-full rounded-3xl bg-white border border-slate-200/80 shadow-md p-6 sm:p-8 md:p-10 mb-8 flex flex-col lg:flex-row items-center justify-between gap-8 overflow-hidden relative">
      {/* Left Content Area */}
      <div className="flex-1 max-w-xl space-y-3">
        <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] tracking-tight">
          Your neighborhood, delivered
        </h3>
        <p className="text-sm sm:text-base font-semibold text-slate-500">
          Discover shops around you
        </p>

        {/* Checklist */}
        <div className="space-y-2.5 pt-2 pb-2">
          {[
            "Real local shops",
            "No dark stores",
            "Support your neighborhood",
            "Faster, fresher delivery",
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold">
                <Check className="h-3.5 w-3.5 stroke-[3]" />
              </div>
              <span className="text-sm font-semibold text-slate-700">{item}</span>
            </div>
          ))}
        </div>

        {/* View on map CTA button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onOpenMap}
            className="inline-flex items-center gap-2 rounded-full bg-[#7e22ce] hover:bg-[#6b21a8] px-6 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all active:scale-95 group cursor-pointer"
          >
            <span>View on map</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Right Graphic Area: Light Vector Map Canvas with Floating Shop Cards */}
      <div
        onClick={onOpenMap}
        className="relative w-full lg:w-[460px] h-[260px] sm:h-[280px] rounded-2xl bg-slate-50 border border-slate-200/60 overflow-hidden shadow-xs cursor-pointer group"
      >
        {/* Stylized Vector Map Background */}
        <svg className="absolute inset-0 w-full h-full object-cover opacity-65" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="#F8FAFC" />
          <rect width="100%" height="100%" fill="url(#mapGrid)" />
          
          <path d="M 40 20 Q 90 10, 120 60 T 160 120 L 60 140 Z" fill="#D1FAE5" opacity="0.6" />
          <path d="M 320 180 Q 380 160, 420 220 L 340 260 Z" fill="#D1FAE5" opacity="0.6" />
          <path d="M 380 0 Q 420 80, 460 140" fill="none" stroke="#BAE6FD" strokeWidth="18" opacity="0.7" />

          <path d="M -20 100 L 500 120" fill="none" stroke="#FFFFFF" strokeWidth="14" />
          <path d="M -20 100 L 500 120" fill="none" stroke="#CBD5E1" strokeWidth="8" />

          <path d="M 180 -10 L 220 300" fill="none" stroke="#FFFFFF" strokeWidth="16" />
          <path d="M 180 -10 L 220 300" fill="none" stroke="#CBD5E1" strokeWidth="10" />

          <path d="M 60 -10 L 320 300" fill="none" stroke="#FFFFFF" strokeWidth="10" />
          <path d="M 60 -10 L 320 300" fill="none" stroke="#E2E8F0" strokeWidth="6" />

          <path d="M 300 20 Q 240 140, 480 200" fill="none" stroke="#FFFFFF" strokeWidth="12" />
          <path d="M 300 20 Q 240 140, 480 200" fill="none" stroke="#CBD5E1" strokeWidth="7" />
        </svg>

        {/* Floating Shop Pins */}

        {/* Pin 1: Sri Krishna (Top Right) */}
        <div className="absolute top-6 right-10 flex items-center gap-2 rounded-2xl bg-white px-3 py-1.5 shadow-lg border border-slate-100 z-10 transition-transform group-hover:scale-105">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <MapPin className="h-4 w-4 fill-emerald-600 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 leading-tight">Sri Krishna</div>
            <div className="text-[10px] font-semibold text-slate-400">18 min</div>
          </div>
        </div>

        {/* Pin 2: Local Mart (Middle Right) */}
        <div className="absolute top-24 right-4 flex items-center gap-2 rounded-2xl bg-white px-3 py-1.5 shadow-lg border border-slate-100 z-10 transition-transform group-hover:scale-105">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <MapPin className="h-4 w-4 fill-rose-600 text-rose-600" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 leading-tight">Local Mart</div>
            <div className="text-[10px] font-semibold text-slate-400">22 min</div>
          </div>
        </div>

        {/* Pin 3: Fresh Basket (Middle Left) */}
        <div className="absolute top-28 left-6 flex items-center gap-2 rounded-2xl bg-white px-3 py-1.5 shadow-lg border border-slate-100 z-10 transition-transform group-hover:scale-105">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <MapPin className="h-4 w-4 fill-emerald-600 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 leading-tight">Fresh Basket</div>
            <div className="text-[10px] font-semibold text-emerald-600">15 min</div>
          </div>
        </div>

        {/* Pin 4: Bake House (Bottom Right) */}
        <div className="absolute bottom-6 right-16 flex items-center gap-2 rounded-2xl bg-white px-3 py-1.5 shadow-lg border border-slate-100 z-10 transition-transform group-hover:scale-105">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <MapPin className="h-4 w-4 fill-rose-600 text-rose-600" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 leading-tight">Bake House</div>
            <div className="text-[10px] font-semibold text-slate-400">20 min</div>
          </div>
        </div>

        {/* Map Expand Badge Hint */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-bold text-[#7e22ce] shadow-xs border border-purple-100 flex items-center gap-1 opacity-90 group-hover:opacity-100">
          <span>Click to explore live map</span>
          <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </div>
  );
}

