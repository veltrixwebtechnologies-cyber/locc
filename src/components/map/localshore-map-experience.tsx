import { useState, useMemo, useRef, useEffect } from "react";
import { MapPin, Locate, ArrowRight, Star, Filter } from "lucide-react";
import { InteractiveMapView, type InteractiveMapViewRef } from "./interactive-map-view";

import type { MapFilterOptions, MapLocation, MapMarkerItem } from "@/lib/map-service/types";
import { getMapMarkerItems } from "@/lib/map-service/store-engine";
import { geocodeSearch } from "@/lib/map-service/providers";
import { Link } from "@tanstack/react-router";
import { categoryColor, categoryLabel } from "@/lib/mock-data";
import { getFallbackProductImage, isValidImageUrl } from "@/lib/image-utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Quick category filter tabs matching the reference design
const QUICK_FILTERS = [
  { id: "all", label: "All Shops" },
  { id: "grocery", label: "Groceries" },
  { id: "boutiques", label: "Fashion" },
  { id: "stationery", label: "Electronics" },
  { id: "pharmacy", label: "Health" },
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
    maxDistanceKm: 3, // Initially focus on prices within 3 km near user location
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

  // Query live Supabase approved vendor catalog & product catalog
  const approvedProducts = useQuery({
    queryKey: ["map-approved-product-catalog"],
    queryFn: async () => {
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
      return data ?? [];
    },
  });

  const approvedVendors = useQuery({
    queryKey: ["map-approved-vendors"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("approved_vendor_catalog")
        .select("id,shop_name,business_type,city,state,address_line1,category,lat,lng");
      return data ?? [];
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

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-start">

        {/* LEFT PANEL */}
        <div className={`lg:col-span-5 flex flex-col ${view === "map" ? "hidden lg:flex" : "flex"}`}>
          <div className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">Shops near you</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {markerItems.length} local stores verified in this area
                </p>
              </div>
              <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Prices include local delivery &amp; taxes
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
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
                    className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-white border border-slate-200 text-slate-700 hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
              <button
                type="button"
                className="shrink-0 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Filter className="h-3.5 w-3.5" />
                Filters
              </button>
            </div>
          </div>

          <div className="h-[calc(100vh-300px)] min-h-[480px] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--primary)_transparent]">
            {markerItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                <div className="mx-auto text-3xl mb-3">🔍</div>
                <p className="font-bold text-foreground">No shops found nearby</p>
                <p className="mt-1 text-xs text-muted-foreground">Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pb-6">
                {markerItems.map((item) => {
                  const isSelected = selectedMarkerId === item.id;
                  const imgUrl = isValidImageUrl(item.productImage)
                    ? item.productImage
                    : getFallbackProductImage(item.productName, item.category);
                  const catColor = categoryColor[item.category] || "#981495";
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
                      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white border cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/20 shadow-lg"
                          : "border-slate-200/80 hover:border-primary/30 hover:shadow-md"
                      }`}
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                        <img
                          src={imgUrl}
                          alt={item.productName}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-2.5 left-2.5 rounded-md bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-gray-900 shadow-sm">
                          {item.distanceKm <= 2 ? "Top Pick" : "Verified Shop"}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); toast.success(`Saved ${item.shopName} to Wishlist`); }}
                          className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-sm hover:text-red-500 transition-colors"
                        >
                          <svg className="h-4 w-4 fill-none stroke-current stroke-[2]" viewBox="0 0 24 24">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </button>
                        <span
                          className="absolute bottom-2.5 left-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs"
                          style={{ backgroundColor: catColor }}
                        >
                          {catName}
                        </span>
                      </div>

                      <div className="p-3.5 flex flex-col gap-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-[14px] text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">
                            {item.shopName}
                          </h3>
                          <div className="flex items-center gap-0.5 shrink-0 text-[12px] font-bold text-slate-700">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span>{item.rating.toFixed(1)}</span>
                            <span className="font-normal text-slate-400 ml-0.5">({Math.floor(item.rating * 15)})</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{item.productName}</p>
                        <p className="text-[11px] font-semibold text-primary flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
                          Available for pickup &amp; instant delivery
                        </p>
                        <div className="mt-1 flex items-center justify-between pt-2 border-t border-slate-100">
                          <div>
                            <span className="font-bold text-[15px] text-slate-900">₹{priceMin}–₹{priceMax}</span>
                            <span className="text-[11px] text-slate-400 ml-1">total</span>
                          </div>
                          <Link
                            to="/store/$storeId"
                            params={{ storeId: item.shopId }}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3.5 py-1.5 text-[12px] font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all"
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

            {markerItems.length > 0 && (
              <div className="pb-6">
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-primary/30 py-3 text-sm font-bold text-primary hover:bg-primary/5 transition-colors"
                >
                  <span>🛍️</span>
                  Explore more shops
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Sticky Map */}
        <div className={`lg:col-span-7 lg:pl-4 ${view === "list" ? "hidden lg:block" : "block"}`}>
          <div className="sticky top-20 rounded-2xl border border-border/60 bg-card overflow-hidden shadow-md">
            <InteractiveMapView
              ref={mapRef}
              markers={markerItems}
              userLocation={userLocation}
              selectedMarkerId={selectedMarkerId}
              hoveredMarkerId={hoveredMarkerId}
              onSelectMarker={(m) => setSelectedMarkerId(m ? m.id : null)}
              onBoundsChange={(bounds) => setFilters((prev) => ({ ...prev, bounds }))}
              onUserLocationChange={setUserLocation}
              className="h-[calc(100vh-200px)] min-h-[580px] max-h-[780px] w-full"
            />
          </div>
        </div>
      </div>

      {/* Mobile floating toggle */}
      <div className="fixed bottom-[80px] inset-x-0 z-40 flex justify-center pointer-events-none lg:hidden">
        <button
          onClick={() => setView(view === "map" ? "list" : "map")}
          className="pointer-events-auto flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-xs font-bold text-background shadow-2xl hover:scale-105 active:scale-95 transition-all"
        >
          {view === "map" ? <><span>Show list</span><span>📋</span></> : <><span>Show map</span><span>🗺️</span></>}
        </button>
      </div>
    </div>
  );
}
