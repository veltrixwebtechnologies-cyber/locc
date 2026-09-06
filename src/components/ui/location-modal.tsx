/**
 * LocalShore Delivery Location Selector Modal
 * Allows customers to select their delivery address via browser GPS,
 * search localities using Nominatim geocoding, or select popular hubs in Coimbatore.
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, LocateFixed, Search, X, Check, Loader2, Navigation, Sparkles } from "lucide-react";
import {
  useDeliveryLocation,
  detectCurrentGPSLocation,
  PRESET_LOCATIONS,
  type DeliveryLocation,
} from "@/lib/location-store";
import { geocodeSearch } from "@/lib/map-service/providers";
import { toast } from "sonner";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LocationModal({ isOpen, onClose }: LocationModalProps) {
  const [activeLocation, setLocation] = useDeliveryLocation();
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cancel any pending debounce when modal closes
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
      // Error toast is already handled inside store
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
      // Append Coimbatore to bias results toward the service area
      const results = await geocodeSearch(`${query}, Coimbatore, Tamil Nadu`);
      if (results && results.length > 0) {
        // Normalize: geocodeSearch returns { placeName, lat, lng, address }
        // Add a `label` field so the modal can render it uniformly
        setSearchResults(
          results.map((r: any) => ({
            ...r,
            label: r.placeName || r.label || r.address || "Unknown place",
          })),
        );
      } else {
        setSearchResults([]);
        setSearchError("No places found. Try a different area name.");
      }
    } catch {
      setSearchResults([]);
      setSearchError("Search unavailable. Select a preset area below.");
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
    // Debounce: wait 400ms after the user stops typing before hitting Nominatim
    // Nominatim enforces a 1 req/s rate limit — rapid keystrokes would get throttled
    setIsSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSearch(query);
    }, 400);
  };

  const handleSelectPreset = (loc: DeliveryLocation) => {
    setLocation(loc);
    toast.success(`Delivery location updated to ${loc.area}`, {
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
    const area = parts[0] || "Coimbatore";
    const city = parts.slice(1, 3).join(", ") || "Coimbatore, TN";

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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-purple-100 text-[#981495]">
                <MapPin className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  Choose Delivery Location
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Select your area to see active shops &amp; instant ETA
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Current GPS Location Button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="group relative w-full flex items-center gap-3.5 rounded-2xl border-2 border-dashed border-[#981495]/40 hover:border-[#981495] bg-purple-50/60 hover:bg-purple-50 p-3.5 text-left transition-all cursor-pointer"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#981495] text-white shadow-md group-hover:scale-105 transition-transform">
                {isLocating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <LocateFixed className="h-5 w-5 stroke-[2.2]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-[#981495]">
                    {isLocating ? "Detecting Satellite Coordinates..." : "Use Current GPS Location"}
                  </span>
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                </div>
                <p className="text-xs text-slate-600 font-semibold truncate">
                  {isLocating
                    ? "Fetching precise device location..."
                    : "Auto-detect via GPS for exact neighborhood delivery"}
                </p>
              </div>
              <Navigation className="h-4 w-4 text-[#981495] shrink-0 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>

          {/* Search Box */}
          <div className="mt-4 relative">
            <div className="relative flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-2.5">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search area, landmark or street in Coimbatore..."
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                autoComplete="off"
              />
              {isSearching && <Loader2 className="h-4 w-4 text-[#981495] animate-spin shrink-0" />}
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
                        className="w-full text-left px-3 py-2.5 hover:bg-purple-50 rounded-xl transition-colors flex items-start gap-2.5"
                      >
                        <MapPin className="h-4 w-4 text-[#981495] shrink-0 mt-0.5" />
                        <span className="text-xs font-semibold text-slate-800 leading-snug">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : searchError ? (
                  <div className="px-4 py-3 text-xs text-slate-500 font-medium">{searchError}</div>
                ) : null}
              </div>
            )}
          </div>

          {/* Popular Coimbatore Hubs */}
          <div className="mt-5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5">
              Popular Areas in Coimbatore
            </h3>
            <div className="max-h-56 overflow-y-auto pr-1 space-y-1.5">
              {PRESET_LOCATIONS.map((preset) => {
                const isSelected = activeLocation.area === preset.area;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-all ${
                      isSelected
                        ? "bg-[#981495] text-white shadow-md font-bold"
                        : "bg-slate-50 hover:bg-purple-50/70 text-slate-800 hover:text-[#981495] font-semibold"
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
                            isSelected ? "text-purple-100" : "text-slate-400"
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
