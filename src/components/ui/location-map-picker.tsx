/**
 * LocalShore Interactive Location Map Picker
 * Allows customers to select delivery coordinates manually by clicking or dragging on Leaflet map.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, LocateFixed, Search, Loader2, Navigation, Check, ArrowLeft } from "lucide-react";
import { getMapTileConfig } from "@/lib/map-provider";
import { detectCurrentGPSLocation, type DeliveryLocation } from "@/lib/location-store";
import { isValidCoordinate } from "@/lib/geo";
import { parseCoordinates } from "@/lib/coordinates";
import { geocodeSearch } from "@/lib/map-service/providers";
import { toast } from "sonner";

interface LocationMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onSelectLocation: (loc: DeliveryLocation) => void;
  onBack?: () => void;
}

export function LocationMapPicker({
  initialLat,
  initialLng,
  onSelectLocation,
  onBack,
}: LocationMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  const initialCoords = parseCoordinates(initialLat, initialLng);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(initialCoords);
  const [mapStart, setMapStart] = useState<{ lat: number; lng: number } | null>(initialCoords);
  const [mapError, setMapError] = useState("");

  const [addressDetails, setAddressDetails] = useState<{
    area: string;
    city: string;
    label: string;
    pincode?: string;
  }>({
    area: "",
    city: "",
    label: "Select your delivery entrance",
  });

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const geocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reverse geocode lat/lng to human address via Nominatim
  const performReverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lng),
        format: "json",
        addressdetails: "1",
        zoom: "17",
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
        headers: { "Accept-Language": "en" },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const parts = data.display_name.split(",").map((s: string) => s.trim());
          const areaName =
            data.address?.suburb ||
            data.address?.neighbourhood ||
            data.address?.residential ||
            data.address?.village ||
            data.address?.road ||
            data.address?.town ||
            parts[0] ||
            "Selected Location";

          const district =
            data.address?.city ||
            data.address?.town ||
            data.address?.county ||
            data.address?.state_district ||
            "";
          const state = data.address?.state || "";
          const cityStr = [district, state].filter(Boolean).join(", ");
          const labelStr = parts.slice(0, 3).join(", ");

          setAddressDetails({
            area: areaName,
            city: cityStr,
            label: labelStr,
            pincode: data.address?.postcode,
          });
          setIsGeocoding(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Map picker reverse geocode fallback", err);
    }

    setAddressDetails({
      area: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      city: "",
      label: `Pinned coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    });
    setIsGeocoding(false);
  }, []);

  // Update map pin position & reverse geocode
  const handlePositionChange = useCallback(
    (lat: number, lng: number, flyTo = false) => {
      setCoords({ lat, lng });
      setMapStart((previous) => previous ?? { lat, lng });

      if (mapRef.current) {
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
        if (flyTo) {
          mapRef.current.flyTo([lat, lng], 17, { animate: true, duration: 1 });
        }
      }

      if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
      geocodeTimeoutRef.current = setTimeout(() => {
        void performReverseGeocode(lat, lng);
      }, 350);
    },
    [performReverseGeocode],
  );

  useEffect(() => {
    if (mapStart || typeof window === "undefined") return;
    let cancelled = false;
    setMapError("");
    detectCurrentGPSLocation({ silent: true })
      .then((location) => {
        if (!cancelled && isValidCoordinate(location.lat, location.lng)) {
          const next = { lat: location.lat, lng: location.lng };
          setMapStart(next);
          setCoords(next);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setMapError(
            error instanceof Error
              ? error.message
              : "Allow location access or search for an area first.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mapStart]);

  // Initialize Leaflet map
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const L = (await import("leaflet")).default;
        await import("leaflet/dist/leaflet.css");
        if (cancelled || !mapContainerRef.current || !mapStart) return;

        LRef.current = L;

        // Custom map marker pin SVG icon
        const pinHtml = `
          <div class="relative group">
            <div class="absolute -inset-2 bg-purple-500/30 rounded-full animate-ping"></div>
            <div class="relative w-9 h-9 bg-[#981495] text-white rounded-full flex items-center justify-center shadow-xl border-2 border-white transform -translate-x-1/2 -translate-y-full hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: pinHtml,
          className: "custom-map-pin",
          iconSize: [36, 36],
          iconAnchor: [18, 36],
        });

        const map = L.map(mapContainerRef.current, {
          center: [mapStart.lat, mapStart.lng],
          zoom: 16,
          maxZoom: 19,
          zoomControl: false,
        });

        L.control.zoom({ position: "bottomright" }).addTo(map);

        const tileConfig = getMapTileConfig();
        L.tileLayer(tileConfig.url, {
          maxZoom: tileConfig.maxZoom,
          subdomains: tileConfig.subdomains,
          attribution: tileConfig.attribution,
        }).addTo(map);

        const marker = L.marker([mapStart.lat, mapStart.lng], {
          icon: customIcon,
          draggable: true,
        }).addTo(map);

        markerRef.current = marker;
        mapRef.current = map;

        // Click anywhere on map to reposition pin
        map.on("click", (e: any) => {
          handlePositionChange(e.latlng.lat, e.latlng.lng, true);
        });

        // Drag marker end event
        marker.on("dragend", () => {
          const position = marker.getLatLng();
          handlePositionChange(position.lat, position.lng, false);
        });

        // Trigger initial reverse geocode
        void performReverseGeocode(mapStart.lat, mapStart.lng);

        setTimeout(() => {
          if (!cancelled) map.invalidateSize();
        }, 150);
      } catch (err) {
        console.error("LocationMapPicker map init error:", err);
      }
    })();

    return () => {
      cancelled = true;
      if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapStart, handlePositionChange, performReverseGeocode]);

  // Handle live GPS detection
  const handleGPSLocate = async () => {
    setIsLocating(true);
    try {
      const gpsLoc = await detectCurrentGPSLocation({ silent: true });
      if (gpsLoc && isValidCoordinate(gpsLoc.lat, gpsLoc.lng)) {
        setMapStart({ lat: gpsLoc.lat, lng: gpsLoc.lng });
        handlePositionChange(gpsLoc.lat, gpsLoc.lng, true);
        toast.success("Map centered on your GPS location!");
      }
    } catch {
      toast.error("Failed to acquire GPS location. Tap map to select manually.");
    } finally {
      setIsLocating(false);
    }
  };

  // Search places on map
  const handleMapSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
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
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: any) => {
    const lat = Number(result.lat);
    const lng = Number(result.lng);
    if (isValidCoordinate(lat, lng)) {
      handlePositionChange(lat, lng, true);
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  const handleConfirm = () => {
    if (!coords || !isValidCoordinate(coords.lat, coords.lng)) return;
    const finalLocation: DeliveryLocation = {
      id: `manual-map-${Date.now()}`,
      label: addressDetails.label || `${addressDetails.area}, ${addressDetails.city}`,
      area: addressDetails.area,
      city: addressDetails.city,
      lat: coords.lat,
      lng: coords.lng,
      pincode: addressDetails.pincode,
    };
    onSelectLocation(finalLocation);
  };

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden rounded-2xl">
      {/* Map Search Bar & Back Button */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="grid h-10 w-10 place-items-center rounded-xl bg-white/95 text-slate-700 shadow-md backdrop-blur-md hover:bg-white hover:text-[#981495] transition-all border border-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="relative flex-1 flex items-center gap-2 rounded-xl bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur-md border border-slate-100">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => void handleMapSearch(e.target.value)}
              placeholder="Search area or landmark on map..."
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
              autoComplete="off"
            />
            {isSearching && <Loader2 className="h-4 w-4 text-[#981495] animate-spin shrink-0" />}
          </div>
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="rounded-2xl bg-white/95 shadow-2xl backdrop-blur-md border border-slate-100 max-h-48 overflow-y-auto divide-y divide-slate-100 p-1">
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSearchResult(item)}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-purple-50 rounded-xl transition-colors flex items-center gap-2"
              >
                <MapPin className="h-3.5 w-3.5 text-[#981495] shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Leaflet Map Canvas */}
      <div className="relative w-full h-[280px] sm:h-[340px] bg-slate-100">
        {mapStart ? (
          <div ref={mapContainerRef} className="w-full h-full" />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div className="space-y-2">
              <LocateFixed className="mx-auto h-8 w-8 text-[#981495]" />
              <p className="text-sm font-bold text-slate-800">Waiting for live location</p>
              <p className="text-xs font-medium text-slate-500">
                {mapError || "Allow GPS access to position the map."}
              </p>
            </div>
          </div>
        )}

        {/* Floating Locate Me GPS button */}
        <button
          type="button"
          onClick={handleGPSLocate}
          disabled={isLocating}
          title="Center on current GPS position"
          className="absolute bottom-4 right-3 z-[400] grid h-11 w-11 place-items-center rounded-2xl bg-white/95 text-[#981495] shadow-xl backdrop-blur-md border border-slate-100 hover:bg-purple-50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          {isLocating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LocateFixed className="h-5 w-5 stroke-[2.2]" />
          )}
        </button>

        {/* Floating hint label */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[400] pointer-events-none rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-semibold text-white shadow-lg backdrop-blur-sm">
          Tap or drag marker to change location
        </div>
      </div>

      {/* Selected Address Preview & Confirmation Card */}
      <div className="bg-white p-4 border-t border-slate-100 space-y-3.5">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-purple-100 text-[#981495] mt-0.5">
            {isGeocoding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-5 w-5 stroke-[2.2]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Selected Delivery Area
            </span>
            <h4 className="text-sm font-black text-slate-900 truncate leading-snug">
              {addressDetails.area}
            </h4>
            <p className="text-xs text-slate-500 font-medium truncate">{addressDetails.label}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={isGeocoding || !coords}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#981495] hover:bg-[#7b1078] active:scale-[0.99] text-white py-3.5 px-4 font-black text-sm shadow-lg shadow-purple-900/20 transition-all cursor-pointer disabled:opacity-60"
        >
          <Check className="h-4 w-4 stroke-[3]" />
          Confirm Selected Location
        </button>
      </div>
    </div>
  );
}
