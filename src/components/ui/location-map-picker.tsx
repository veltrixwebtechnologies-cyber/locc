/**
 * LocalShore Interactive Location Map Picker
 * Allows customers to select delivery coordinates manually by clicking or dragging on Leaflet map.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, LocateFixed, Search, Loader2, Navigation, Check, ArrowLeft, Store } from "lucide-react";
import { getMapTileConfig } from "@/lib/map-provider";
import { detectCurrentGPSLocation, type DeliveryLocation } from "@/lib/location-store";
import { haversineDistanceKm, isValidCoordinate } from "@/lib/geo";
import { MAX_CUSTOMER_DELIVERY_ACCURACY_M, parseCoordinates } from "@/lib/coordinates";
import { resolveNominatimAddress } from "@/lib/location-address";
import { geocodeSearch } from "@/lib/map-service/providers";
import { toast } from "sonner";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import { supabase } from "@/integrations/supabase/client";
import { isTestEntity } from "@/lib/map-service/store-engine";
import { demoNeighborhoodShops, isGeneratedDemoShopName } from "@/lib/demo-neighborhood-shops";
import { DEFAULT_SHOP_DISCOVERY_RADIUS_KM } from "@/lib/location-visibility";
import { getFallbackShopImage } from "@/lib/image-utils";
import { localShoreShopMarker } from "@/lib/localshore-shop-marker";

const MAP_PROVIDER = import.meta.env.VITE_MAP_PROVIDER === "google" ? "google" : "osm";

const GOOGLE_PICKER_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.school", stylers: [{ visibility: "off" }] },
  { featureType: "poi.medical", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#F4EFF7" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#FAF7FC" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#E9F3FA" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#EEE7F3" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#7D7485" }] },
  { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#FAF7FC" }, { weight: 1 }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#887D92" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#6D6179" }] },
  { featureType: "administrative", elementType: "labels.text.stroke", stylers: [{ color: "#FAF7FC" }, { weight: 1 }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#5F5568" }] },
];

type LocalShop = {
  id: string;
  shopName: string;
  category: string;
  address: string;
  imageUrl?: string;
  lat: number;
  lng: number;
  distanceKm: number;
  isDemo?: boolean;
  sampleProducts?: string[];
};

function deliveryPinSvg() {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='58' viewBox='0 0 48 58'>
    <path d='M24 56C20 47 7 37 7 23a17 17 0 1 1 34 0c0 14-13 24-17 33Z' fill='#981495' stroke='#FFFFFF' stroke-width='3'/>
    <circle cx='24' cy='22' r='7' fill='#FFFFFF'/><circle cx='24' cy='22' r='3' fill='#981495'/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

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
  const googleModeRef = useRef(MAP_PROVIDER === "google");
  const uncertaintyRef = useRef<any>(null);
  const localShopMarkersRef = useRef<Record<string, any>>({});
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
  const [isGoogleMapReady, setIsGoogleMapReady] = useState(false);
  const [localShops, setLocalShops] = useState<LocalShop[]>([]);
  const [selectedShop, setSelectedShop] = useState<LocalShop | null>(null);
  const [showAllShops, setShowAllShops] = useState(false);
  const geocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Registered sellers come from Supabase. User-supplied business examples are
  // separate, clearly labeled previews with approximate neighborhood pins.
  useEffect(() => {
    if (MAP_PROVIDER !== "google" || !coords) return;
    let cancelled = false;
    const demoShops: LocalShop[] = demoNeighborhoodShops
      .map((shop) => ({
        id: shop.id,
        shopName: shop.name,
        category: shop.category.replaceAll("_", " "),
        address: `Approximate area: ${shop.area}, ${shop.city}`,
        imageUrl: getFallbackShopImage(shop.category, shop.name),
        lat: shop.lat,
        lng: shop.lng,
        distanceKm: haversineDistanceKm(coords.lat, coords.lng, shop.lat, shop.lng),
        isDemo: true,
        sampleProducts: shop.sampleProducts,
      }))
      .filter((shop) => shop.distanceKm <= DEFAULT_SHOP_DISCOVERY_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);
    setLocalShops(demoShops);
    setSelectedShop(null);
    setShowAllShops(false);
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await (supabase as any).rpc("get_customer_visible_shops", {
          p_lat: coords.lat,
          p_lng: coords.lng,
          p_query: null,
          p_category_slug: null,
          p_limit: 100,
          p_offset: 0,
        });
        if (error) throw error;
        if (cancelled) return;
        const registeredShops: LocalShop[] = (data ?? [])
          .filter((shop: any) =>
            isValidCoordinate(shop.lat, shop.lng) &&
            shop.shop_name &&
            !isTestEntity(String(shop.shop_name)) &&
            !isGeneratedDemoShopName(String(shop.shop_name)),
          )
          .map((shop: any) => ({
            id: String(shop.id),
            shopName: String(shop.shop_name),
            category: String(shop.category || shop.business_type || "Local shop"),
            address: [shop.address_line1, shop.city, shop.state].filter(Boolean).join(", "),
            imageUrl: shop.storefront_image_url || shop.shop_banner_url || shop.shop_logo_url ||
              getFallbackShopImage(shop.category || shop.business_type, shop.shop_name),
            lat: Number(shop.lat),
            lng: Number(shop.lng),
            distanceKm: haversineDistanceKm(coords.lat, coords.lng, Number(shop.lat), Number(shop.lng)),
          }))
          .filter((shop: LocalShop) => shop.distanceKm <= DEFAULT_SHOP_DISCOVERY_RADIUS_KM);
        const distinctDemos = demoShops.filter((demo) => !registeredShops.some((shop) =>
          shop.shopName.trim().toLowerCase() === demo.shopName.trim().toLowerCase() &&
          haversineDistanceKm(shop.lat, shop.lng, demo.lat, demo.lng) < 2,
        ));
        setLocalShops([...registeredShops, ...distinctDemos].sort((a, b) => a.distanceKm - b.distanceKm));
      } catch (error) {
        if (!cancelled) console.warn("Registered shop markers unavailable", error);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [coords?.lat, coords?.lng]);

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
        if (uncertaintyRef.current) {
          if (googleModeRef.current) uncertaintyRef.current.setMap(null);
          else uncertaintyRef.current.remove();
        }
        uncertaintyRef.current = null;
        if (markerRef.current) {
          if (googleModeRef.current) markerRef.current.setPosition({ lat, lng });
          else markerRef.current.setLatLng([lat, lng]);
        }
        if (flyTo) {
          if (googleModeRef.current) {
            mapRef.current.panTo({ lat, lng });
            mapRef.current.setZoom(18);
          } else {
            mapRef.current.setView([lat, lng], Math.min(18, mapRef.current.getMaxZoom()));
          }
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

  // Initialize the selected map provider. OSM/Leaflet remains the fallback.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (MAP_PROVIDER === "google") {
          if (cancelled || !mapContainerRef.current || !mapStart) return;
          const googleApi = await loadGoogleMaps();
          if (cancelled || !mapContainerRef.current) return;

          googleModeRef.current = true;
          const map = new googleApi.maps.Map(mapContainerRef.current, {
            center: { lat: mapStart.lat, lng: mapStart.lng },
            zoom: 18,
            maxZoom: 21,
            styles: GOOGLE_PICKER_STYLES,
            backgroundColor: "#FAF7FC",
            disableDefaultUI: true,
            zoomControl: true,
            zoomControlOptions: { position: googleApi.maps.ControlPosition.RIGHT_BOTTOM },
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            clickableIcons: false,
            gestureHandling: "greedy",
          });
          const marker = new googleApi.maps.Marker({
            map,
            position: { lat: mapStart.lat, lng: mapStart.lng },
            draggable: true,
            title: "Delivery location",
            icon: {
              url: deliveryPinSvg(),
              scaledSize: new googleApi.maps.Size(48, 58),
              anchor: new googleApi.maps.Point(24, 58),
            },
          });
          mapRef.current = map;
          markerRef.current = marker;
          setIsGoogleMapReady(true);
          const accuracy = initialAccuracyRef.current;
          if (typeof accuracy === "number" && Number.isFinite(accuracy) && accuracy > 10) {
            uncertaintyRef.current = new googleApi.maps.Circle({
              map,
              center: { lat: mapStart.lat, lng: mapStart.lng },
              radius: accuracy,
              strokeColor: "#981495",
              strokeOpacity: 0.22,
              strokeWeight: 1,
              fillColor: "#981495",
              fillOpacity: 0.08,
              clickable: false,
            });
          }
          map.addListener("click", (event: google.maps.MapMouseEvent) => {
            if (event.latLng) handlePositionChange(event.latLng.lat(), event.latLng.lng(), true);
          });
          marker.addListener("dragend", () => {
            const position = marker.getPosition();
            if (position) handlePositionChange(position.lat(), position.lng(), false);
          });
          void performReverseGeocode(mapStart.lat, mapStart.lng);
          setTimeout(() => {
            if (!cancelled) googleApi.maps.event.trigger(map, "resize");
          }, 150);
          return;
        }

        const L = (await import("leaflet")).default;
        await import("leaflet/dist/leaflet.css");
        if (cancelled || !mapContainerRef.current || !mapStart) return;

        googleModeRef.current = false;
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
        if (!cancelled) setMapError(err instanceof Error ? err.message : "Map could not load.");
      }
    })();

    return () => {
      cancelled = true;
      addressRequestRef.current++;
      if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
      if (mapRef.current) {
        if (googleModeRef.current) {
          markerRef.current?.setMap?.(null);
          Object.values(localShopMarkersRef.current).forEach((shopMarker: any) => shopMarker.setMap?.(null));
          localShopMarkersRef.current = {};
          uncertaintyRef.current?.setMap?.(null);
          setIsGoogleMapReady(false);
          mapRef.current = null;
          markerRef.current = null;
        } else {
          mapRef.current.remove();
          mapRef.current = null;
        }
      }
    };
  }, [mapStart, handlePositionChange, performReverseGeocode]);

  // Render only LocalShore sellers. Google’s own business/POI markers are
  // disabled by GOOGLE_PICKER_STYLES above.
  useEffect(() => {
    if (MAP_PROVIDER !== "google" || !isGoogleMapReady || !mapRef.current || !window.google?.maps) return;
    const map = mapRef.current;
    const googleApi = window.google;
    Object.values(localShopMarkersRef.current).forEach((marker: any) => marker.setMap?.(null));
    localShopMarkersRef.current = {};

    localShops.forEach((shop) => {
      const selected = selectedShop?.id === shop.id;
      const artwork = localShoreShopMarker(shop.shopName, selected, shop.isDemo);
      const marker = new googleApi.maps.Marker({
        map,
        position: { lat: shop.lat, lng: shop.lng },
        title: `${shop.shopName}${shop.isDemo ? " (shop preview; approximate area)" : ""}`,
        icon: {
          url: artwork.url,
          scaledSize: new googleApi.maps.Size(artwork.width, artwork.height),
          anchor: new googleApi.maps.Point(artwork.anchorX, artwork.anchorY),
        },
        zIndex: selected ? 20 : 5,
      });
      marker.addListener("click", () => setSelectedShop(shop));
      localShopMarkersRef.current[shop.id] = marker;
    });

    // Start at a useful LocalShore discovery view instead of zooming tightly
    // onto the delivery pin while all nearby sellers remain off-screen.
    if (localShops.length > 0 && googleApi.maps.LatLngBounds) {
      const bounds = new googleApi.maps.LatLngBounds();
      if (mapStart) bounds.extend({ lat: mapStart.lat, lng: mapStart.lng });
      localShops.slice(0, 20).forEach((shop) => bounds.extend({ lat: shop.lat, lng: shop.lng }));
      map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
      googleApi.maps.event.addListenerOnce(map, "bounds_changed", () => {
        const zoom = map.getZoom();
        if (typeof zoom === "number" && zoom > 15) map.setZoom(15);
      });
    }

    return () => {
      Object.values(localShopMarkersRef.current).forEach((marker: any) => marker.setMap?.(null));
      localShopMarkersRef.current = {};
    };
  }, [isGoogleMapReady, localShops, mapStart, selectedShop?.id]);

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
          {MAP_PROVIDER === "google" && (
            <button
              type="button"
              onClick={handleGPSLocate}
              disabled={isLocating}
              className="hidden shrink-0 items-center gap-2 rounded-xl bg-[#981495] px-3.5 py-3 text-xs font-black text-white shadow-lg shadow-[#981495]/15 transition hover:bg-[#7d1079] disabled:opacity-60 sm:flex"
            >
              {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
              Use my location
            </button>
          )}
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

      {/* LocalShore map canvas. Google mode uses a quiet branded style and
          LocalShore seller markers; OSM mode keeps the existing Leaflet map. */}
      <div className={`relative isolate w-full shrink-0 overflow-hidden rounded-xl bg-[#FAF7FC] ${MAP_PROVIDER === "google" ? "h-[360px] sm:h-[420px] lg:flex lg:h-[390px]" : "h-[280px] sm:h-[340px]"}`}>
        {MAP_PROVIDER === "google" && (
          <aside className="hidden min-w-0 overflow-hidden border-r border-[#EEE7F3] bg-white lg:flex lg:w-[230px] lg:shrink-0 lg:flex-col">
            <div className="flex items-center justify-between border-b border-[#EEE7F3] px-3.5 py-3">
              <div>
                <p className="text-sm font-black text-[#21162B]">Nearby shops</p>
                <p className="text-[10px] font-semibold text-[#7D7485]">{localShops.filter((shop) => !shop.isDemo).length} registered · {localShops.filter((shop) => shop.isDemo).length} previews</p>
              </div>
              <Store className="h-4 w-4 text-[#981495]" />
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-1">
              {localShops.length === 0 ? (
                <div className="px-2 py-8 text-center text-[11px] font-semibold text-[#7D7485]">Local shops will appear around this location.</div>
              ) : localShops.slice(0, showAllShops ? localShops.length : 8).map((shop) => (
                <button
                  key={shop.id}
                  type="button"
                  onClick={() => { setSelectedShop(shop); mapRef.current?.panTo?.({ lat: shop.lat, lng: shop.lng }); }}
                  className={`flex w-full items-center gap-2 border-b border-[#F1EAF4] px-2 py-2.5 text-left transition hover:bg-[#FAF7FC] ${selectedShop?.id === shop.id ? "bg-[#FAF0FC]" : ""}`}
                >
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-[#F4EFF7]">
                    {shop.imageUrl ? (
                      <img
                        src={shop.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = getFallbackShopImage(shop.category, shop.shopName);
                        }}
                      />
                    ) : <div className="grid h-full place-items-center text-[#981495]"><Store className="h-4 w-4" /></div>}
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-black text-[#21162B]">{shop.shopName}</span>
                    <span className="block truncate text-[10px] font-semibold text-[#7D7485]">{shop.isDemo ? "Shop preview · " : ""}{shop.category}</span>
                    <span className="mt-0.5 block text-[10px] font-bold text-[#981495]">{shop.distanceKm.toFixed(1)} km away</span>
                  </span>
                  <span className="text-lg text-[#981495]">›</span>
                </button>
              ))}
            </div>
            {localShops.length > 8 && (
              <button
                type="button"
                onClick={() => setShowAllShops((visible) => !visible)}
                className="m-2 rounded-xl bg-[#FAF0FC] py-2 text-[11px] font-black text-[#981495] transition hover:bg-[#F3DDF7]"
              >
                {showAllShops ? "Show closest shops" : "View all nearby shops"}
              </button>
            )}
          </aside>
        )}
        <div className="relative h-full min-h-[280px] min-w-0 sm:min-h-0 lg:min-w-0 lg:flex-1">
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
        {mapError && (
          <div className="absolute inset-x-3 bottom-3 z-[1000] rounded-xl bg-white/95 px-3 py-2 text-xs font-semibold text-amber-800 shadow-lg ring-1 ring-amber-200">
            {mapError}
          </div>
        )}

        {MAP_PROVIDER === "google" && localShops.length > 0 && (
          <div className="absolute left-3 bottom-3 z-[1000] rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-black text-[#981495] shadow-md ring-1 ring-[#EBD9F0]">
            {localShops.length} shop preview{localShops.length === 1 ? "" : "s"} nearby
          </div>
        )}

        {MAP_PROVIDER === "google" && selectedShop && (
          <div className="absolute inset-x-3 bottom-3 z-[1100] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-[#EBD9F0]">
            <div className="flex items-center gap-3 p-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#F4EFF7]">
                {selectedShop.imageUrl ? (
                  <img
                    src={selectedShop.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = getFallbackShopImage(selectedShop.category, selectedShop.shopName);
                    }}
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-[#981495]"><Store className="h-5 w-5" /></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-[#21162B]">{selectedShop.shopName}</p>
                <p className="truncate text-[11px] font-semibold text-[#7D7485]">
                  {selectedShop.isDemo ? "Shop preview · " : ""}{selectedShop.category} · {selectedShop.distanceKm.toFixed(1)} km away
                </p>
                <p className="truncate text-[10px] text-[#7D7485]">{selectedShop.address || "LocalShore shop"}</p>
                {selectedShop.isDemo && <p className="mt-1 text-[10px] text-[#7D7485]">Sample products: {selectedShop.sampleProducts?.slice(0, 3).join(", ")}</p>}
              </div>
              <button type="button" onClick={() => setSelectedShop(null)} className="self-start text-lg leading-none text-slate-400" aria-label="Close shop card">×</button>
            </div>
            <div className="flex gap-2 px-3 pb-3">
              {!selectedShop.isDemo && (
              <button
                type="button"
                onClick={() => toast.success(`${selectedShop.shopName} selected`)}
                className="flex-1 rounded-xl bg-[#981495] px-3 py-2 text-[11px] font-black text-white"
              >
                Select this shop
              </button>
              )}
              <button
                type="button"
                onClick={() => { window.location.href = `/store/${selectedShop.id}`; }}
                className="flex-1 rounded-xl bg-[#F4EFF7] px-3 py-2 text-[11px] font-black text-[#981495]"
              >
                {selectedShop.isDemo ? "Explore products" : "View shop"}
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleGPSLocate}
          disabled={isLocating}
          title="Center on current GPS position"
          className={`absolute bottom-6 z-[1000] grid h-11 w-11 place-items-center rounded-2xl bg-white/95 text-[#981495] shadow-xl backdrop-blur-md border border-slate-100 hover:bg-[var(--sand)] transition-colors cursor-pointer ${MAP_PROVIDER === "google" ? "right-3" : "left-3"}`}
        >
          {isLocating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LocateFixed className="h-5 w-5 stroke-[2.2]" />
          )}
        </button>

        {/* Floating hint label */}
        <div className="absolute top-3 left-1/2 z-[1000] w-max max-w-[calc(100%-6rem)] -translate-x-1/2 pointer-events-none rounded-full bg-slate-950/75 px-3 py-1.5 text-center text-[10px] font-bold text-white shadow-lg backdrop-blur-sm">
          {requiresManualConfirmation && !hasPositionedPin
            ? "Move the pin to your exact entrance"
            : "Tap the map, drag the map, or drag the pin to your exact entrance"}
        </div>
        </div>
      </div>

      {/* Selected Address Preview & Confirmation Card */}
      <div className={`bg-white p-4 border-t border-slate-100 space-y-3.5 ${MAP_PROVIDER === "google" ? "md:flex md:items-center md:gap-3 md:space-y-0" : ""}`}>
        {MAP_PROVIDER === "google" && !hasPositionedPin && (
          <div className="flex flex-1 items-start gap-2 rounded-xl bg-[#FFF8ED] px-3 py-2.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">
            <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            Your device provided an approximate area. Move the pin to your exact entrance and confirm it.
          </div>
        )}
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
          className={`w-full flex items-center justify-center gap-2 rounded-2xl bg-[#981495] hover:bg-[#7b1078] active:scale-[0.99] text-white py-3.5 px-4 font-black text-sm shadow-lg shadow-[#981495]/20 transition-all cursor-pointer disabled:opacity-60 ${MAP_PROVIDER === "google" ? "md:w-[230px] md:shrink-0" : ""}`}
        >
          <Check className="h-4 w-4 stroke-[3]" />
          {hasPositionedPin ? "Confirm Selected Location" : "Move pin to confirm exact location"}
        </button>
      </div>
    </div>
  );
}
