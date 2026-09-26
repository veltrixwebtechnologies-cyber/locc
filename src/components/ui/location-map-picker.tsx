/**
 * LocalShore Interactive Location Map Picker
 * Allows customers to select delivery coordinates manually by clicking or dragging on Leaflet map.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, LocateFixed, Search, Loader2, Navigation, Check, ArrowLeft } from "lucide-react";
import { getMapTileConfig } from "@/lib/map-provider";
import { detectCurrentGPSLocation, type DeliveryLocation } from "@/lib/location-store";
import { isValidCoordinate } from "@/lib/geo";
import { MAX_CUSTOMER_DELIVERY_ACCURACY_M, parseCoordinates } from "@/lib/coordinates";
import { resolveNominatimAddress } from "@/lib/location-address";
import { geocodeSearch } from "@/lib/map-service/providers";
import { toast } from "sonner";

interface LocationMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  initialAccuracy?: number;
  requiresManualConfirmation?: boolean;
  onSelectLocation: (loc: DeliveryLocation) => void;
  onBack?: () => void;
}

export function LocationMapPicker({
  initialLat,
  initialLng,
  initialAccuracy,
  requiresManualConfirmation = false,
  onSelectLocation,
  onBack,
}: LocationMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const uncertaintyRef = useRef<any>(null);
  const initialAccuracyRef = useRef(initialAccuracy);
  const addressRequestRef = useRef(0);

  const initialCoords = parseCoordinates(initialLat, initialLng);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(initialCoords);
  const [mapStart, setMapStart] = useState<{ lat: number; lng: number } | null>(initialCoords);
  const [hasPositionedPin, setHasPositionedPin] = useState(!requiresManualConfirmation);
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
    const request = ++addressRequestRef.current;
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
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const data = await res.json();
        if (request !== addressRequestRef.current) return;
        if (data && data.display_name) {
          const resolved = resolveNominatimAddress(data);

          setAddressDetails({
            area: resolved.area,
            city: resolved.city,
            label: resolved.label,
            pincode: resolved.pincode,
          });
          setIsGeocoding(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Map picker reverse geocode fallback", err);
    }

    if (request !== addressRequestRef.current) return;
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
      addressRequestRef.current++;
      setIsGeocoding(true);
      setCoords({ lat, lng });
      setHasPositionedPin(true);
      setMapStart((previous) => previous ?? { lat, lng });

      if (mapRef.current) {
        uncertaintyRef.current?.remove();
        uncertaintyRef.current = null;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
        if (flyTo) {
          mapRef.current.setView([lat, lng], Math.min(18, mapRef.current.getMaxZoom()));
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
    detectCurrentGPSLocation({ silent: true, commit: false, allowApproximate: true })
      .then((location) => {
        if (!cancelled && isValidCoordinate(location.lat, location.lng)) {
          const next = { lat: location.lat, lng: location.lng };
          setMapStart(next);
          setCoords(next);
          setHasPositionedPin(
            typeof location.accuracy === "number" &&
              location.accuracy <= MAX_CUSTOMER_DELIVERY_ACCURACY_M,
          );
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
        const pinHtml = `<svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 43C15 37 2 26 2 18a16 16 0 1 1 32 0c0 8-13 19-16 25Z" fill="#981495" stroke="white" stroke-width="2"/>
          <circle cx="18" cy="18" r="6" fill="white"/>
        </svg>`;

        const customIcon = L.divIcon({
          html: pinHtml,
          className: "custom-map-pin",
          iconSize: [36, 44],
          iconAnchor: [18, 44],
        });

        const map = L.map(mapContainerRef.current, {
          center: [mapStart.lat, mapStart.lng],
          zoom: 18,
          maxZoom: 19,
          zoomControl: false,
        });

        L.control.zoom({ position: "bottomright" }).addTo(map);

        const tileConfig = getMapTileConfig();
        map.setMaxZoom(tileConfig.maxZoom);
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
        const accuracy = initialAccuracyRef.current;
        if (typeof accuracy === "number" && Number.isFinite(accuracy) && accuracy > 10) {
          const circle = L.circle([mapStart.lat, mapStart.lng], {
            radius: accuracy, color: "#b45309", fillOpacity: 0.08, interactive: false,
          }).addTo(map);
          uncertaintyRef.current = circle;
          map.fitBounds(circle.getBounds(), { padding: [16, 16], maxZoom: 16 });
        }

        // Click anywhere on map to reposition pin
        map.on("click", (e: any) => {
          handlePositionChange(e.latlng.lat, e.latlng.lng, true);
        });

        // On touch devices, dragging the map is easier than dragging a small
        // marker. Use the map center as the selected point after every pan.
        map.on("move", () => {
          const center = map.getCenter();
          // Keep the pin visually attached to the map center throughout the
          // drag, rather than waiting for the gesture to finish.
          marker.setLatLng(center);
        });
        map.on("moveend", () => {
          const center = map.getCenter();
          handlePositionChange(center.lat, center.lng, false);
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
      addressRequestRef.current++;
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
      const gpsLoc = await detectCurrentGPSLocation({
        silent: false,
        commit: false,
        allowApproximate: true,
      });
      if (gpsLoc && isValidCoordinate(gpsLoc.lat, gpsLoc.lng)) {
        initialAccuracyRef.current = gpsLoc.accuracy ?? undefined;
        setMapStart({ lat: gpsLoc.lat, lng: gpsLoc.lng });
        setHasPositionedPin(
          typeof gpsLoc.accuracy === "number" &&
            gpsLoc.accuracy <= MAX_CUSTOMER_DELIVERY_ACCURACY_M,
        );
        handlePositionChange(gpsLoc.lat, gpsLoc.lng, true);
        toast.success(
          gpsLoc.accuracy && gpsLoc.accuracy <= MAX_CUSTOMER_DELIVERY_ACCURACY_M
            ? "Precise GPS location found"
            : "Approximate GPS location found",
          {
            description:
              gpsLoc.accuracy && gpsLoc.accuracy > MAX_CUSTOMER_DELIVERY_ACCURACY_M
                ? "Move the map or pin to your exact entrance, then confirm."
                : "The map is centered on your current location.",
          },
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Location is unavailable.";
      setMapError(message);
      toast.error("Could not get your device location", { description: message });
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
    if (!coords || isGeocoding || !hasPositionedPin || !isValidCoordinate(coords.lat, coords.lng)) return;
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
    <div className="flex flex-col w-full relative shrink-0 rounded-2xl">
      {/* Map Search Bar & Back Button */}
      <div className="relative z-[1000] flex shrink-0 flex-col gap-2 bg-white pb-3">
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
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-[var(--sand)] rounded-xl transition-colors flex items-center gap-2"
              >
                <MapPin className="h-3.5 w-3.5 text-[#981495] shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Leaflet Map Canvas */}
      <div className="relative isolate w-full h-[280px] sm:h-[340px] shrink-0 overflow-hidden rounded-xl bg-slate-100">
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
          className="absolute bottom-6 left-3 z-[1000] grid h-11 w-11 place-items-center rounded-2xl bg-white/95 text-[#981495] shadow-xl backdrop-blur-md border border-slate-100 hover:bg-[var(--sand)] transition-colors cursor-pointer"
        >
          {isLocating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LocateFixed className="h-5 w-5 stroke-[2.2]" />
          )}
        </button>

        {/* Floating hint label */}
        <div className="absolute top-3 left-3 right-3 z-[1000] pointer-events-none rounded-xl bg-slate-900/80 px-3 py-1 text-center text-[11px] font-semibold text-white shadow-lg">
          {requiresManualConfirmation && !hasPositionedPin
            ? "Move the pin to your exact entrance"
            : "Tap the map, drag the map, or drag the pin to your exact entrance"}
        </div>
      </div>

      {/* Selected Address Preview & Confirmation Card */}
      <div className="bg-white p-4 border-t border-slate-100 space-y-3.5">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--sand)] text-[#981495] mt-0.5">
            {isGeocoding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-5 w-5 stroke-[2.2]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              {hasPositionedPin ? "Selected delivery point" : "Unconfirmed device estimate"}
            </span>
            <h4 className="text-sm font-black text-slate-900 truncate leading-snug">
              {addressDetails.area}
            </h4>
            <p className="text-xs text-slate-500 font-medium truncate">{addressDetails.label}</p>
            {coords && (
              <p className="mt-1 text-[11px] font-medium tabular-nums text-slate-500" aria-live="polite">
                Pin: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                {isGeocoding ? " · Updating address…" : ""}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={isGeocoding || !coords || !hasPositionedPin}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#981495] hover:bg-[#7b1078] active:scale-[0.99] text-white py-3.5 px-4 font-black text-sm shadow-lg shadow-[#981495]/20 transition-all cursor-pointer disabled:opacity-60"
        >
          <Check className="h-4 w-4 stroke-[3]" />
          {hasPositionedPin ? "Confirm Selected Location" : "Move pin to confirm exact location"}
        </button>
      </div>
    </div>
  );
}
