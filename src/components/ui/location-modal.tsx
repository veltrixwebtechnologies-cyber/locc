/**
 * LocalShore Delivery Location Selector Modal
 * State-driven location picker adhering strictly to the hierarchy:
 * 1. Initial view: Clean selection options (Use Current Location, Search, Set Pin on Map)
 *    - NO hardcoded Coimbatore or popular area presets shown by default.
 * 2. DETECTING_LOCATION: Show explicit loading state
 * 3. LOCATION_SELECTED: Display selected city/area with [Change] button & dynamic popular areas ONLY for that confirmed city.
 * 4. LOCATION_ERROR: Graceful error banner + Search & Map Pin options
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  LocateFixed,
  Search,
  X,
  Check,
  Loader2,
  Navigation,
  Sparkles,
  Map,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  useDeliveryLocation,
  useLocationState,
  useGPSStatus,
  detectCurrentGPSLocation,
  getPopularAreasForLocation,
  type DeliveryLocation,
} from "@/lib/location-store";
import { geocodeSearch } from "@/lib/map-service/providers";
import { MAX_CUSTOMER_DELIVERY_ACCURACY_M } from "@/lib/coordinates";
import { LocationMapPicker } from "@/components/ui/location-map-picker";
import { toast } from "sonner";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LocationModal({ isOpen, onClose }: LocationModalProps) {
  const [activeLocation, setLocation] = useDeliveryLocation();
  const locationState = useLocationState();
  const gpsStatusState = useGPSStatus();
  const recentFix =
    gpsStatusState.fix && Date.now() - gpsStatusState.fix.timestamp <= 60000
      ? gpsStatusState.fix
      : null;

  const [viewMode, setViewMode] = useState<"quick" | "map">("quick");
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showPopularAreas, setShowPopularAreas] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset view mode and search states when modal reopens
  useEffect(() => {
    if (isOpen) {
      setViewMode("quick");
      setSearchQuery("");
      setSearchResults([]);
      setSearchError("");
      setShowPopularAreas(false);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      await detectCurrentGPSLocation({ silent: false });
      onClose();
    } catch {
      // A browser/laptop may only provide a coarse or unavailable fix. Move
      // directly to the precise, user-confirmed map pin flow.
      setViewMode("map");
    } finally {
      setIsLocating(false);
    }
  };

  const runSearch = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setSearchError("");
      return;
    }
    setIsSearching(true);
    setSearchError("");
    try {
      const results = await geocodeSearch(query);
      if (results && results.length > 0) {
        setSearchResults(
          results.map((r: any) => ({
            ...r,
            label: r.placeName || r.label || r.address || "Unknown place",
          })),
        );
      } else {
        setSearchResults([]);
        setSearchError("No matching areas found. Try a different landmark or street.");
      }
    } catch {
      setSearchResults([]);
      setSearchError("Search unavailable. Please try using the interactive map pin.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setSearchError("");
      setIsSearching(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }
    setIsSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSearch(query);
    }, 400);
  };

  const handleSelectPreset = (loc: DeliveryLocation) => {
    setLocation(loc);
    toast.success(`Delivery location set to ${loc.area}`, {
      description: loc.label,
    });
    onClose();
  };

  const handleSelectSearchResult = (result: any) => {
    const rawName = result.label || result.placeName || result.address || "";
    const parts = rawName
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    const area = parts[0] || "Selected Area";
    const city = parts.slice(1, 3).join(", ") || parts[1] || "";

    const newLoc: DeliveryLocation = {
      id: `custom-${Date.now()}`,
      label: rawName || `${area}, ${city}`,
      area,
      city,
      lat: Number(result.lat),
      lng: Number(result.lng),
    };

    setLocation(newLoc);
    toast.success(`Delivery location set to ${area}`);
    onClose();
  };

  const handleMapLocationSelect = (loc: DeliveryLocation) => {
    setLocation(loc);
    toast.success(`Delivery location pinned to ${loc.area}`, {
      description: loc.label,
    });
    onClose();
  };

  // Get dynamic popular areas ONLY when user explicitly requests/confirms location
  const dynamicPopularAreas = getPopularAreasForLocation(activeLocation);
  const selectedCityName = activeLocation?.city || activeLocation?.area || "";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative w-full max-w-lg max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-white p-4 sm:p-6 shadow-2xl border border-slate-100 my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--sand)] text-[#981495] ring-1 ring-[#f3d053]/70">
                <MapPin className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  Set your LocalShore location
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Find trusted neighborhood shops and accurate delivery times
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl mt-3 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("quick")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === "quick"
                  ? "bg-white text-[#981495] shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              Quick Options
            </button>
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === "map"
                  ? "bg-[#981495] text-white shadow-md shadow-[#981495]/20"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Map className="h-3.5 w-3.5" />
              Pin on map
            </button>
          </div>

          {/* Body Content */}
          {viewMode === "map" ? (
            <div className="flex-1 min-h-[360px] sm:min-h-[420px] pt-3 flex flex-col">
              {!activeLocation && recentFix && (
                <p className="text-xs text-amber-800 mb-2" role="status">
                  Device estimate: {Math.round(recentFix.accuracy)}m accuracy radius. Move the pin
                  to your entrance and confirm it.
                </p>
              )}
              <LocationMapPicker
                initialLat={activeLocation?.lat ?? recentFix?.lat}
                initialLng={activeLocation?.lng ?? recentFix?.lng}
                onSelectLocation={handleMapLocationSelect}
                onBack={() => setViewMode("quick")}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto min-h-0 space-y-3.5 pt-3.5 pr-0.5">
              {/* Active Selected Location Summary Card (if user previously selected a location) */}
              {activeLocation && (
                <div className="rounded-2xl border border-[#f0abfc] bg-[var(--sand)]/70 p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#981495] text-white shadow-sm">
                      <MapPin className="h-5 w-5 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-black text-[#981495] uppercase tracking-wider block">
                        Selected Delivery Location
                      </span>
                      <h4 className="text-sm font-black text-slate-900 truncate">
                        📍 {activeLocation.area || activeLocation.city}
                      </h4>
                      <p className="text-xs text-slate-600 font-medium truncate">
                        {activeLocation.label}
                      </p>
                      {activeLocation.isGPS && typeof activeLocation.accuracy === "number" && (
                        <p className="text-xs text-slate-600 mt-1">
                          {activeLocation.lat.toFixed(6)}, {activeLocation.lng.toFixed(6)}
                          {" · Accuracy radius "}
                          {Math.round(activeLocation.accuracy)}m
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPopularAreas((prev) => !prev)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-white border border-[#f0abfc] px-3 py-1.5 text-xs font-black text-[#981495] shadow-xs hover:bg-[var(--sand)] transition-colors cursor-pointer"
                  >
                    {showPopularAreas ? "Hide Areas" : "View Areas"}
                  </button>
                </div>
              )}

              {/* DETECTING LOCATION LOADING STATE */}
              {isLocating || (locationState === "DETECTING_LOCATION" && !activeLocation) ? (
                <div className="rounded-2xl border border-[#f0abfc] bg-[var(--sand)]/90 p-6 text-center space-y-3">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#981495] text-white shadow-lg animate-pulse">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Detecting your location...
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-0.5" role="status">
                      {gpsStatusState.fix
                        ? `Device accuracy radius: ${Math.round(gpsStatusState.fix.accuracy)}m. ${gpsStatusState.fix.accuracy > MAX_CUSTOMER_DELIVERY_ACCURACY_M ? "Waiting for a more accurate reading…" : "Looking up your address…"}`
                        : "Requesting your device’s location. Allow browser access when prompted; this can take up to 15 seconds."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode("map")}
                    className="text-xs font-bold text-[#981495] underline underline-offset-2"
                  >
                    Confirm delivery entrance on map
                  </button>
                </div>
              ) : (
                /* PRIMARY HIERARCHY OPTIONS (Shown by default) */
                <>
                  {/* Graceful Permission / Location Error Banner */}
                  {(locationState === "LOCATION_ERROR" ||
                    gpsStatusState.status === "denied" ||
                    gpsStatusState.status === "unavailable" ||
                    gpsStatusState.status === "timeout" ||
                    gpsStatusState.status === "imprecise" ||
                    gpsStatusState.status === "error" ||
                    gpsStatusState.status === "unsupported") && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 flex items-start gap-2.5 text-amber-900">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1 text-xs font-semibold leading-relaxed">
                        <p className="font-bold text-amber-950">
                          {gpsStatusState.status === "imprecise"
                            ? "Location found — accuracy needs improvement"
                            : "Unable to get your location"}
                        </p>
                        <p className="text-amber-800">
                          {gpsStatusState.errorMessage ||
                            "Allow location access, then retry. You can also search or drop a pin on the map."}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setViewMode("map")}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#981495] px-2.5 py-1.5 text-[11px] font-black text-white transition-colors hover:bg-[#7d1079]"
                          >
                            <Map className="h-3 w-3" />
                            Confirm exact spot on map
                          </button>
                          <button
                            type="button"
                            onClick={handleUseCurrentLocation}
                            disabled={isLocating}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-2.5 py-1.5 text-[11px] font-black text-amber-950 ring-1 ring-amber-300/70 transition-colors hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <RefreshCw className={`h-3 w-3 ${isLocating ? "animate-spin" : ""}`} />
                            Retry GPS
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Option 1: Use Current Location */}
                  <div>
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={isLocating}
                      className="group relative w-full flex items-center gap-3.5 rounded-2xl border-2 border-dashed border-[#981495]/40 hover:border-[#981495] bg-[var(--sand)]/60 hover:bg-[var(--sand)] p-3.5 text-left transition-all cursor-pointer"
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#981495] text-white shadow-md group-hover:scale-105 transition-transform">
                        <LocateFixed className="h-5 w-5 stroke-[2.2]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-[#981495]">
                            Use Current Location
                          </span>
                          <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        </div>
                        <p className="text-xs text-slate-600 font-semibold truncate">
                          Detect your device location and show its accuracy
                        </p>
                      </div>
                      <Navigation className="h-4 w-4 text-[#981495] shrink-0 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  </div>

                  {/* OR Divider */}
                  <div className="relative flex items-center justify-center my-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <span className="relative bg-white px-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      OR
                    </span>
                  </div>

                  {/* Option 2: Search Area, Landmark or Street */}
                  <div className="relative">
                    <div className="relative flex items-center gap-2 rounded-2xl bg-slate-100 px-3.5 py-2.5 border border-slate-200/60 focus-within:border-[#981495] focus-within:bg-white transition-colors">
                      <Search className="h-4 w-4 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Search area, landmark or street..."
                        className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                        autoComplete="off"
                      />
                      {isSearching && (
                        <Loader2 className="h-4 w-4 text-[#981495] animate-spin shrink-0" />
                      )}
                      {searchQuery && !isSearching && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setSearchResults([]);
                            setSearchError("");
                          }}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Dynamic Search Results Dropdown */}
                    {searchQuery.length >= 2 && !isSearching && (
                      <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
                        {searchResults.length > 0 ? (
                          <div className="max-h-52 overflow-y-auto divide-y divide-slate-50 p-1">
                            {searchResults.map((item, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleSelectSearchResult(item)}
                                className="w-full text-left px-3 py-2.5 hover:bg-[var(--sand)] rounded-xl transition-colors flex items-start gap-2.5"
                              >
                                <MapPin className="h-4 w-4 text-[#981495] shrink-0 mt-0.5" />
                                <span className="text-xs font-semibold text-slate-800 leading-snug">
                                  {item.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : searchError ? (
                          <div className="px-4 py-3 text-xs text-slate-500 font-medium">
                            {searchError}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Option 3: Set Pin on Map Card */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setViewMode("map")}
                      className="group relative w-full flex items-center gap-3.5 rounded-2xl border border-[#f0abfc] bg-gradient-to-r from-[#981495] to-[#981495] p-3.5 text-left text-white shadow-md hover:shadow-lg hover:scale-[1.01] transition-all cursor-pointer"
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/20 text-white backdrop-blur-md group-hover:scale-110 transition-transform">
                        <Map className="h-5 w-5 stroke-[2.2]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-white">Set Pin on Map</span>
                          <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                            Interactive
                          </span>
                        </div>
                        <p className="text-xs text-[var(--sand)] font-medium truncate">
                          Drag pin or tap anywhere on map for exact delivery location
                        </p>
                      </div>
                    </button>
                  </div>
                </>
              )}

              {/* DYNAMIC POPULAR AREAS (Only shown when explicitly toggled or after selection) */}
              {showPopularAreas && activeLocation && dynamicPopularAreas.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                    Popular Areas in {selectedCityName}
                  </h3>
                  <div className="space-y-1.5 pb-2">
                    {dynamicPopularAreas.map((preset) => {
                      const isSelected = activeLocation?.area === preset.area;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-all ${
                            isSelected
                              ? "bg-[#981495] text-white shadow-md font-bold"
                              : "bg-slate-50 hover:bg-[var(--sand)]/70 text-slate-800 hover:text-[#981495] font-semibold"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <MapPin
                              className={`h-4 w-4 shrink-0 ${
                                isSelected ? "text-white fill-white/20" : "text-[#981495]"
                              }`}
                            />
                            <div className="min-w-0">
                              <span className="block text-xs sm:text-sm font-bold truncate">
                                {preset.area}
                              </span>
                              <span
                                className={`block text-[10px] truncate ${
                                  isSelected ? "text-[var(--sand)]" : "text-slate-400"
                                }`}
                              >
                                {preset.city}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="grid h-6 w-6 place-items-center rounded-full bg-white text-[#981495] shrink-0">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
