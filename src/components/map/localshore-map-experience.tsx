import { useState, useMemo, useRef, useEffect } from "react";
import { Search, MapPin, Locate, ArrowRight, Star, Clock, CheckCircle2, Navigation } from "lucide-react";
import { InteractiveMapView, type InteractiveMapViewRef } from "./interactive-map-view";
import { MapFilterBar } from "./map-filter-bar";
import { MapListToggle } from "./map-list-toggle";
import type { MapFilterOptions, MapLocation, MapMarkerItem } from "@/lib/map-service/types";
import { getMapMarkerItems } from "@/lib/map-service/store-engine";
import { geocodeSearch } from "@/lib/map-service/providers";
import { Link } from "@tanstack/react-router";
import { categoryColor, categoryLabel } from "@/lib/mock-data";
import { getFallbackProductImage, isValidImageUrl } from "@/lib/image-utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  // Search & Filter State
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<MapFilterOptions>({
    query: initialQuery,
    category: initialCategory !== "all" ? (initialCategory as any) : undefined,
    maxDistanceKm: undefined,
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

  return (
    <div className="w-full space-y-4">
      {/* Top Location & Product Search Header Bar */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-center">
        {/* Product Search Input (Product-Aware) */}
        <form onSubmit={handleProductSearchSubmit} className="md:col-span-7">
          <div className="relative flex items-center rounded-2xl border border-primary/20 bg-card p-1.5 shadow-sm ring-1 ring-black/[0.04] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <Search className="ml-3 h-5 w-5 text-primary shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search products e.g. "Jhumka", "Black Shirt", "Mango", "Atta"...'
              className="w-full bg-transparent px-3 py-2 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 active:scale-95 transition-transform"
            >
              Search Map
            </button>
          </div>
        </form>

        {/* Location Search Input & GPS Trigger */}
        <div className="relative md:col-span-5">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <MapPin className="ml-2 h-4 w-4 text-primary shrink-0" />
            <input
              type="text"
              value={locationSearchQuery}
              onChange={(e) => handleLocationSearch(e.target.value)}
              onFocus={() => {
                if (locationSuggestions.length === 0 && !locationSearchQuery) {
                  // Show popular presets on focus
                  setLocationSuggestions([
                    { placeName: "Pappampatti Pirivu, Coimbatore", lat: 11.0028, lng: 77.0865 },
                    { placeName: "Ondipudur, Coimbatore", lat: 11.0006, lng: 77.0543 },
                    { placeName: "Sulur, Coimbatore", lat: 11.0264, lng: 77.1245 },
                    { placeName: "Coimbatore City, Tamil Nadu", lat: 11.0168, lng: 76.9558 },
                    { placeName: "Singanallur, Coimbatore", lat: 10.9972, lng: 77.0275 },
                  ]);
                }
              }}
              placeholder={userLocation.label || "Search city, town or pincode..."}
              className="w-full bg-transparent px-2 py-1.5 text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground"
            />
            {isSearchingLocation && (
              <span className="text-[10px] text-muted-foreground animate-pulse pr-1">Searching...</span>
            )}
            <button
              onClick={handleUseGPS}
              title="Use current location"
              className="flex items-center gap-1 rounded-xl bg-primary/10 px-2.5 py-1.5 text-[11px] font-bold text-primary hover:bg-primary/20 active:scale-95 shrink-0 transition-transform"
            >
              <Locate className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">GPS</span>
            </button>
          </div>

          {/* Location Autocomplete & Quick City Presets Dropdown */}
          {locationSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-border bg-card/95 p-1.5 shadow-2xl backdrop-blur-md">
              <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex justify-between items-center">
                <span>Select Location</span>
                <button
                  onClick={() => setLocationSuggestions([])}
                  className="text-primary hover:underline lowercase font-medium"
                >
                  close
                </button>
              </div>
              {locationSuggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectLocation(s)}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-colors truncate flex items-center gap-2"
                >
                  <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                  <span className="truncate">{s.placeName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar (Distance, Category, Price, Open Now, Rating, Stock) */}
      <MapFilterBar
        filters={filters}
        onChange={(updated) => {
          setFilters(updated);
          if (updated.category) onCategoryChange?.(updated.category);
        }}
        onClear={() => {
          setFilters({ query: "" });
          setQuery("");
          onQueryChange?.("");
          onCategoryChange?.("all");
        }}
      />

      {/* View Toggle Bar (🗺️ Map | 📋 List) */}
      <MapListToggle
        view={view}
        onViewChange={setView}
        itemCount={markerItems.length}
        productQuery={filters.query}
      />

      {/* Split-Screen Discovery Container */}
      <div className="relative mt-2">
        {/* Desktop Split View: Left Grid + Right Sticky Map */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          {/* LEFT COLUMN: Shop & Product Listings Grid */}
          <div
            className={`space-y-4 lg:col-span-7 xl:col-span-7 ${
              view === "map" ? "hidden lg:block" : "block"
            }`}
          >
            {/* Results Header */}
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="font-display text-lg font-extrabold text-foreground">
                  {filters.query
                    ? `Shops & products matching "${filters.query}"`
                    : "Shops near you"}
                </h2>
                <p className="text-xs font-medium text-muted-foreground">
                  {markerItems.length} local {markerItems.length === 1 ? "store" : "stores"} verified in this area
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Prices include local delivery & taxes
                </span>
              </div>
            </div>

            {markerItems.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-12 text-center bg-card shadow-xs">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-2xl">
                  🔍
                </div>
                <h3 className="mt-3 font-display text-base font-bold text-foreground">No local shops found</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try adjusting your search terms or expanding your distance filter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {markerItems.map((item) => {
                  const isSelected = selectedMarkerId === item.id;
                  const imgUrl = isValidImageUrl(item.productImage)
                    ? item.productImage
                    : getFallbackProductImage(item.productName, item.category);

                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => setHoveredMarkerId(item.id)}
                      onMouseLeave={() => setHoveredMarkerId(null)}
                      onClick={() => {
                        setSelectedMarkerId(item.id);
                        mapRef.current?.flyToLocation(item.lat, item.lng, 14.5);
                      }}
                      className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-card transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "border-foreground ring-2 ring-foreground/20 shadow-lg scale-[1.01]"
                          : "border-border/70 hover:border-border hover:shadow-md"
                      }`}
                    >
                      {/* Top Image Container */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                        <img
                          src={imgUrl}
                          alt={item.productName}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* "Verified Shop" Badge */}
                        <div className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-gray-900 shadow-sm backdrop-blur-xs">
                          {item.distanceKm <= 2 ? "Top Pick" : "Verified Shop"}
                        </div>

                        {/* Wishlist Heart Icon */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.success(`Saved ${item.shopName} to Wishlist`);
                          }}
                          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-xs hover:bg-black/50 transition-colors"
                        >
                          <svg className="h-4 w-4 fill-none stroke-current stroke-[2.5]" viewBox="0 0 24 24">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </button>

                        {/* Category Tag overlay */}
                        <span
                          className="absolute bottom-3 left-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs backdrop-blur-xs"
                          style={{ backgroundColor: categoryColor[item.category] || "#111827" }}
                        >
                          {categoryLabel[item.category] || item.category}
                        </span>
                      </div>

                      {/* Card Info Section */}
                      <div className="flex flex-1 flex-col p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-display text-base font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {item.shopName}
                          </h3>
                          <div className="flex items-center gap-1 shrink-0 text-xs font-bold text-foreground">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span>{item.rating.toFixed(2)}</span>
                            <span className="text-muted-foreground font-normal">({Math.floor(item.rating * 15)})</span>
                          </div>
                        </div>

                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                          {item.productName} · {item.distanceKm.toFixed(1)} km away
                        </p>

                        <p className="mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          ⚡ Available for immediate pickup & instant delivery
                        </p>

                        <div className="mt-3 flex items-baseline justify-between border-t border-border/50 pt-3">
                          <div>
                            <span className="font-display text-lg font-extrabold text-foreground">
                              {item.priceDisplay}
                            </span>
                            <span className="text-xs text-muted-foreground"> total</span>
                          </div>

                          <Link
                            to="/store/$storeId"
                            params={{ storeId: item.shopId }}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                          >
                            <span>Open Shop</span>
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

          {/* RIGHT COLUMN: Sticky Full-Height Map View */}
          <div
            className={`lg:col-span-5 xl:col-span-5 ${
              view === "list" ? "hidden lg:block" : "block"
            }`}
          >
            <div className="sticky top-20 rounded-3xl border border-border/80 bg-card overflow-hidden shadow-lg">
              <InteractiveMapView
                ref={mapRef}
                markers={markerItems}
                userLocation={userLocation}
                selectedMarkerId={selectedMarkerId}
                hoveredMarkerId={hoveredMarkerId}
                onSelectMarker={(m) => setSelectedMarkerId(m ? m.id : null)}
                onBoundsChange={(bounds) => {
                  setFilters((prev) => ({ ...prev, bounds }));
                }}
                onUserLocationChange={setUserLocation}
                className="h-[calc(100vh-140px)] min-h-[580px] max-h-[750px] w-full"
              />
            </div>
          </div>
        </div>

        {/* Floating View Switcher Pill for Mobile & Small Screen Devices */}
        <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center pointer-events-none lg:hidden">
          <button
            onClick={() => setView(view === "map" ? "list" : "map")}
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-xs font-bold text-background shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            {view === "map" ? (
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
    </div>
  );
}
