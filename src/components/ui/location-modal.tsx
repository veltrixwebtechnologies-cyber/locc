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
  commitDetectedLocation,
  getPopularAreasForLocation,
  MAX_APPROXIMATE_GPS_PREVIEW_ACCURACY_M,
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
  const [mapOrigin, setMapOrigin] = useState<"selected" | "gps">("selected");
  const [showGpsFeedback, setShowGpsFeedback] = useState(false);
  const [pendingGPSLocation, setPendingGPSLocation] = useState<DeliveryLocation | null>(null);
  const mapFix = mapOrigin === "gps" || !activeLocation ? recentFix : null;
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showPopularAreas, setShowPopularAreas] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Reset view mode and search states when modal reopens
  useEffect(() => {
    if (isOpen) {
      setViewMode("quick");
      setMapOrigin("selected");
      setShowGpsFeedback(false);
      setPendingGPSLocation(null);
      setSearchQuery("");
      setSearchResults([]);
      setSearchError("");
      setShowPopularAreas(false);
      requestAnimationFrame(() => closeButtonRef.current?.focus());
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const openMap = (origin: "selected" | "gps" = pendingGPSLocation ? "gps" : "selected") => {
    setMapOrigin(origin);
    setViewMode("map");
  };

  const handleUseCurrentLocation = async () => {
    setShowGpsFeedback(true);
    setIsLocating(true);
    setSearchError("");
    try {
      // silent=false forces a fresh request on every user retry; commit=false
      // keeps the result as a preview until the user confirms it.
      // Keep the live result as a preview. Desktop browsers often return a
      // coarse Wi-Fi fix; showing it lets the customer adjust the entrance on
      // the map instead of receiving a misleading timeout/fetch failure.
      const detected = await detectCurrentGPSLocation({
        silent: false,
        commit: false,
        allowApproximate: true,
      });
      setPendingGPSLocation(detected);
      setMapOrigin("gps");
      const accuracy = detected.accuracy ?? 0;
      if (accuracy <= MAX_CUSTOMER_DELIVERY_ACCURACY_M) {
        toast.success("Precise location detected", {
          description: `${detected.area || detected.label} · Accuracy ±${Math.round(accuracy)}m`,
        });
      } else {
        toast.info("Approximate location found", {
          description: `Accuracy ±${Math.round(accuracy)}m. Adjust the pin to your entrance before saving.`,
        });
      }
    } catch (error) {
      if (import.meta.env?.DEV) console.warn("[LocalShore GPS] modal request failed", error);
      // Keep the saved address and show the GPS error with explicit choices.
      // A failed reading must not move the user to an unrelated map estimate.
    } finally {
      setIsLocating(false);
    }
  };

  const selectedLocation = pendingGPSLocation ?? activeLocation;

  const handleConfirmSelectedLocation = () => {
    if (!pendingGPSLocation) {
      onClose();
      return;
    }
    if (
      typeof pendingGPSLocation.accuracy === "number" &&
      pendingGPSLocation.accuracy > MAX_CUSTOMER_DELIVERY_ACCURACY_M
    ) {
      setMapOrigin("gps");
      setViewMode("map");
      toast.info("Adjust the pin for an exact delivery entrance", {
        description: `GPS accuracy is approximately ±${Math.round(pendingGPSLocation.accuracy)}m.`,
      });
      return;
    }
    commitDetectedLocation(pendingGPSLocation);
    setPendingGPSLocation(null);
    toast.success("Delivery location saved", { description: pendingGPSLocation.label });
    onClose();
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
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/40 p-2 backdrop-blur-[2px] sm:p-4"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <motion.div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-modal-title"
          aria-describedby="location-modal-description"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative my-auto flex max-h-[calc(100dvh-1rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:max-h-[min(760px,calc(100dvh-2rem))] sm:rounded-3xl sm:p-5 md:p-6"
        >
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--sand)] text-[#981495] ring-1 ring-[#f3d053]/70">
                <MapPin className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 id="location-modal-title" className="text-base font-black leading-tight text-slate-900 sm:text-lg">
                  Set your LocalShore location
                </h2>
                <p id="location-modal-description" className="text-xs font-medium text-slate-500">
                  Find trusted neighborhood shops and accurate delivery times
                </p>
              </div>
            </div>
            <button
              type="button"
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Close location selector"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#981495] focus-visible:ring-offset-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="mt-3 flex shrink-0 items-center gap-1.5 rounded-2xl bg-slate-100 p-1" role="tablist" aria-label="Location selection method">
            <button
              type="button"
              onClick={() => setViewMode("quick")}
              role="tab"
              aria-selected={viewMode === "quick"}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#981495] focus-visible:ring-offset-1 ${
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
              onClick={() => openMap()}
              role="tab"
              aria-selected={viewMode === "map"}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#981495] focus-visible:ring-offset-1 ${
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
            <div className="min-h-0 flex-1 overflow-y-auto pt-3">
              {mapFix && mapFix.accuracy > MAX_CUSTOMER_DELIVERY_ACCURACY_M && (
                <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium leading-relaxed text-amber-900" role="status">
                  Your device provided an approximate area. For an exact delivery point, zoom in,
                  place the pin at your entrance, and confirm it.
                </p>
              )}
              <LocationMapPicker
                initialLat={mapFix?.lat ?? activeLocation?.lat}
                initialLng={mapFix?.lng ?? activeLocation?.lng}
                initialAccuracy={mapFix?.accuracy}
                requiresManualConfirmation={
                  !!mapFix &&
                  mapFix.accuracy > MAX_CUSTOMER_DELIVERY_ACCURACY_M
                }
                onSelectLocation={handleMapLocationSelect}
                onBack={() => setViewMode("quick")}
              />
            </div>
          ) : (
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-0.5 pb-1 pt-3.5">
              {/* Active Selected Location Summary Card (if user previously selected a location) */}
              {selectedLocation && (
                <div className="rounded-2xl border border-[#f0abfc] bg-[var(--sand)]/70 p-3.5">
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#981495] text-white shadow-sm">
                      <MapPin className="h-5 w-5 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-black text-[#981495] uppercase tracking-wider block">
                        {pendingGPSLocation ? "Detected Location · Review Before Saving" : "Selected Delivery Location"}
                      </span>
                      <h4 className="break-words text-sm font-black leading-snug text-slate-900">
                        📍 {selectedLocation.area || selectedLocation.city}
                      </h4>
                      <p title={selectedLocation.label} className="break-words text-xs font-medium leading-relaxed text-slate-600">
                        {selectedLocation.label}
                      </p>
                      {selectedLocation.isGPS && typeof selectedLocation.accuracy === "number" && (
                        <p className="text-xs text-slate-600 mt-1">
                          {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                          {" · Accuracy radius ±"}
                          {Math.round(selectedLocation.accuracy)}m
                          {selectedLocation.accuracy <= MAX_CUSTOMER_DELIVERY_ACCURACY_M
                            ? " · High accuracy"
                            : " · Approximate — adjust pin"}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => dynamicPopularAreas.length > 0 ? setShowPopularAreas((prev) => !prev) : openMap()}
                    className="mt-3 inline-flex min-h-10 items-center gap-1 rounded-xl border border-[#d58bd8] bg-white px-3 py-2 text-xs font-black text-[#981495] shadow-xs transition-colors hover:bg-[var(--sand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#981495] focus-visible:ring-offset-2"
                  >
                    {dynamicPopularAreas.length > 0 ? (showPopularAreas ? "Hide Areas" : "View Areas") : "Adjust pin"}
                  </button>
                </div>
              )}

              {selectedLocation && !isLocating && (
                <button type="button" onClick={handleConfirmSelectedLocation}
                  className="min-h-12 w-full rounded-xl bg-[#981495] px-4 py-3 text-sm font-black text-white shadow-[0_10px_24px_rgba(152,20,149,0.22)] transition hover:bg-[#7d1079] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#981495] focus-visible:ring-offset-2 active:translate-y-px">
                  {pendingGPSLocation ? "Use detected location" : "Use selected address"}
                </button>
              )}

              {/* DETECTING LOCATION LOADING STATE */}
              {isLocating ? (
                <div className="space-y-3 rounded-2xl border border-[#f0abfc] bg-[var(--sand)]/90 p-5 text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#981495] text-white shadow-lg animate-pulse">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Detecting your location...
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-0.5" role="status">
                      {gpsStatusState.fix
                        ? gpsStatusState.fix.accuracy > MAX_CUSTOMER_DELIVERY_ACCURACY_M
                          ? `Current reading ±${Math.round(gpsStatusState.fix.accuracy)}m. Waiting for a better fix (up to ±${MAX_APPROXIMATE_GPS_PREVIEW_ACCURACY_M}m)…`
                          : "Looking up your address…"
                        : "Requesting your device’s location. Allow browser access when prompted; this can take up to 15 seconds."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openMap("gps")}
                    className="rounded-lg px-2 py-1 text-xs font-bold text-[#981495] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#981495]"
                  >
                    Confirm delivery entrance on map
                  </button>
                </div>
              ) : (
                /* PRIMARY HIERARCHY OPTIONS (Shown by default) */
                <>
                  {/* Graceful Permission / Location Error Banner */}
                  {showGpsFeedback && (locationState === "LOCATION_ERROR" ||
                    gpsStatusState.status === "denied" ||
                    gpsStatusState.status === "unavailable" ||
                    gpsStatusState.status === "timeout" ||
                    gpsStatusState.status === "imprecise" ||
                    gpsStatusState.status === "error" ||
                    gpsStatusState.status === "unsupported") && (
                    <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-amber-900">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1 text-xs font-semibold leading-relaxed">
                        <p className="font-bold text-amber-950">
                          {gpsStatusState.status === "imprecise"
                            ? "GPS could not pinpoint your location"
                            : "Unable to get your location"}
                        </p>
                        <p className="text-amber-800">
                          {gpsStatusState.errorMessage ||
                            (gpsStatusState.status === "imprecise"
                              ? "Your device returned only a broad estimate. Turn on precise device location and Wi-Fi, retry, or search for your address and place the pin at your entrance."
                              : "Allow location access, then retry. You can also search or drop a pin on the map.")}
                          {activeLocation ? " Your selected address has not changed." : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openMap()}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#981495] px-3 py-2 text-[11px] font-black text-white transition-colors hover:bg-[#7d1079] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#981495] focus-visible:ring-offset-2"
                          >
                            <Map className="h-3 w-3" />
                            {activeLocation ? "Adjust selected address" : "Choose on map"}
                          </button>
                          <button
                            type="button"
                            onClick={handleUseCurrentLocation}
                            disabled={isLocating}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-2 text-[11px] font-black text-amber-950 ring-1 ring-amber-300/70 transition-colors hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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
                      className="group relative flex min-h-[72px] w-full items-center gap-3.5 rounded-2xl border-2 border-dashed border-[#981495]/40 bg-[var(--sand)]/60 p-3.5 text-left transition-all hover:border-[#981495] hover:bg-[var(--sand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#981495] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
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
                        <p className="text-xs font-semibold text-slate-600">
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
                    <div className="relative flex items-center gap-2 rounded-2xl border border-slate-200/60 bg-slate-100 px-3.5 py-2.5 transition-colors focus-within:border-[#981495] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#981495]/20">
                      <Search className="h-4 w-4 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        aria-label="Search area, landmark or street"
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Search area, landmark or street..."
                        className="w-full bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 sm:text-sm"
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
                          aria-label="Clear location search"
                          className="rounded-full p-1 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#981495]"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Dynamic Search Results Dropdown */}
                    {searchQuery.length >= 2 && !isSearching && (
                      <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                        {searchResults.length > 0 ? (
                          <div className="max-h-52 overflow-y-auto divide-y divide-slate-50 p-1">
                            {searchResults.map((item, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleSelectSearchResult(item)}
                                className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--sand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#981495]"
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
                      onClick={() => openMap()}
                      className="group relative flex min-h-[72px] w-full items-center gap-3.5 rounded-2xl border border-[#f0abfc] bg-[#981495] p-3.5 text-left text-white shadow-md transition-all hover:bg-[#7d1079] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#981495] focus-visible:ring-offset-2"
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
                        <p className="text-xs font-medium text-[var(--sand)]">
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
