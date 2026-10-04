/**
 * LocalShore Interactive Location Map Picker
 * Allows customers to select delivery coordinates manually by clicking or dragging on Leaflet map.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, LocateFixed, Search, Loader2, Navigation, Check, ArrowLeft, Store } from "lucide-react";
import { getMapTileConfig } from "@/lib/map-provider";
import { detectCurrentGPSLocation, type DeliveryLocation } from "@/lib/location-store";
import { isValidCoordinate } from "@/lib/geo";
import { MAX_CUSTOMER_DELIVERY_ACCURACY_M, parseCoordinates } from "@/lib/coordinates";
import { resolveNominatimAddress } from "@/lib/location-address";
import { geocodeSearch } from "@/lib/map-service/providers";
import { toast } from "sonner";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import { supabase } from "@/integrations/supabase/client";
import { isTestEntity } from "@/lib/map-service/store-engine";
import { isGeneratedDemoShopName } from "@/lib/demo-neighborhood-shops";
import { discoverShops } from "@/lib/shop-discovery";
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
  isOpen?: boolean;
};

function shopClusterIcon(count: number) {
  const size = 58;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="29" cy="29" r="27" fill="#981495" fill-opacity=".14"/>
    <circle cx="29" cy="29" r="20" fill="#981495" fill-opacity=".24"/>
    <circle cx="29" cy="29" r="14" fill="#981495" stroke="#fff" stroke-width="3"/>
    <text x="29" y="34" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="700" fill="#fff">${count}</text>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  };
}

function compactShopIcon(isDemo = false, isSelected = false) {
  const fill = isSelected ? "#6E0D70" : isDemo ? "#A437A0" : "#981495";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="50" viewBox="0 0 42 50">
    <circle cx="21" cy="20" r="19" fill="${fill}" fill-opacity=".15"/>
    <path d="M21 46C18 39 7 30 7 19a14 14 0 1 1 28 0c0 11-11 20-14 27Z" fill="${fill}" stroke="#fff" stroke-width="3"/>
    <path d="M14 19h14l-1.5 2.5v7h-11v-7L14 19Zm2-1 1.5-3h7l1.5 3m-6 5v4m3-4v4" fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(42, 50),
    anchor: new google.maps.Point(21, 48),
  };
}

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
  const [mapZoom, setMapZoom] = useState(18);
  const [localShops, setLocalShops] = useState<LocalShop[]>([]);
  const [selectedShop, setSelectedShop] = useState<LocalShop | null>(null);
  const [showAllShops, setShowAllShops] = useState(false);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [shopsError, setShopsError] = useState<string | null>(null);
  const [shopsReload, setShopsReload] = useState(0);
  const displayShops = localShops;
  const geocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use the same registered-shop discovery as the marketplace. A neighborhood
  // example has no seller/inventory relationship and cannot be a shopping destination.
  useEffect(() => {
    setLocalShops([]);
    setSelectedShop(null);
    setShowAllShops(false);
    setShopsError(null);
    setShopsLoading(false);
    if (MAP_PROVIDER !== "google" || !coords) return;
    let cancelled = false;
    setShopsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { shops } = await discoverShops((name, args) => (supabase as any).rpc(name, args), {
          lat: coords.lat,
          lng: coords.lng,
          query: null,
          category: null,
          radiusKm: DEFAULT_SHOP_DISCOVERY_RADIUS_KM,
        });
        if (cancelled) return;
        const registeredShops = await Promise.all(shops
          .filter((shop) => !isTestEntity(shop.shop_name))
          .map(async (shop): Promise<LocalShop> => {
            let imageUrl = getFallbackShopImage(shop.category || shop.business_type, shop.shop_name);
            const imagePath = shop.shop_banner_path || shop.shop_logo_path;
            if (imagePath) {
              if (/^https?:\/\//i.test(imagePath)) imageUrl = imagePath;
              else {
                const { data } = await supabase.storage.from("seller-docs").createSignedUrl(imagePath, 3600);
                imageUrl = data?.signedUrl ?? imageUrl;
              }
            }
            return {
              id: shop.id,
              shopName: shop.shop_name,
              category: shop.business_type || shop.category || "Local shop",
              address: [shop.address_line1, shop.city, shop.state].filter(Boolean).join(", "),
              imageUrl,
              lat: Number(shop.lat),
              lng: Number(shop.lng),
              distanceKm: shop.distance_km,
              isDemo: isGeneratedDemoShopName(shop.shop_name),
              isOpen: shop.is_open,
            };
          }));
        if (!cancelled) setLocalShops(registeredShops);
      } catch {
        if (!cancelled) setShopsError("We couldn’t load nearby shops. Please try again.");
      } finally {
        if (!cancelled) setShopsLoading(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [coords?.lat, coords?.lng, shopsReload]);

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
          setMapZoom(map.getZoom() ?? 18);
          map.addListener("zoom_changed", () => setMapZoom(map.getZoom() ?? 18));
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

    const clusterPixels = mapZoom < 18 ? 64 : 0;
    const projection = map.getProjection();
    const worldScale = 2 ** mapZoom;
    const fallbackCell = mapZoom < 12 ? 0.02 : mapZoom < 14 ? 0.01 : mapZoom < 16 ? 0.003 : 0.0008;
    const groups = new Map<string, LocalShop[]>();
    displayShops.forEach((shop) => {
      const worldPoint = projection?.fromLatLngToPoint(new googleApi.maps.LatLng(shop.lat, shop.lng));
      const key = clusterPixels && worldPoint
        ? `${Math.floor((worldPoint.x * worldScale) / clusterPixels)}:${Math.floor((worldPoint.y * worldScale) / clusterPixels)}`
        : clusterPixels
          ? `${Math.floor(shop.lat / fallbackCell)}:${Math.floor(shop.lng / fallbackCell)}`
          : shop.id;
      groups.set(key, [...(groups.get(key) ?? []), shop]);
    });

    groups.forEach((shops, key) => {
      if (shops.length > 1) {
        const position = {
          lat: shops.reduce((sum, shop) => sum + shop.lat, 0) / shops.length,
          lng: shops.reduce((sum, shop) => sum + shop.lng, 0) / shops.length,
        };
        const marker = new googleApi.maps.Marker({
          map,
          position,
          title: `${shops.length} nearby LocalShore shops · zoom in to explore`,
          icon: shopClusterIcon(shops.length),
          zIndex: 30,
        });
        marker.addListener("click", () => {
          map.panTo(position);
          map.setZoom(Math.min((map.getZoom() ?? 14) + 2, 21));
        });
        localShopMarkersRef.current[`cluster:${key}`] = marker;
        return;
      }
      const shop = shops[0];
      if (!shop) return;
      const selected = selectedShop?.id === shop.id;
      const icon = selected && mapZoom >= 17
        ? (() => {
            const artwork = localShoreShopMarker(shop.shopName, true, shop.isDemo);
            return {
              url: artwork.url,
              scaledSize: new googleApi.maps.Size(artwork.width, artwork.height),
              anchor: new googleApi.maps.Point(artwork.anchorX, artwork.anchorY),
            };
          })()
        : compactShopIcon(Boolean(shop.isDemo), selected);
      const marker = new googleApi.maps.Marker({
        map,
        position: { lat: shop.lat, lng: shop.lng },
        title: shop.shopName,
        icon,
        zIndex: selected ? 20 : 5,
      });
      marker.addListener("click", () => setSelectedShop(shop));
      localShopMarkersRef.current[shop.id] = marker;
    });

    return () => {
      Object.values(localShopMarkersRef.current).forEach((marker: any) => marker.setMap?.(null));
      localShopMarkersRef.current = {};
    };
  }, [isGoogleMapReady, displayShops, mapStart, mapZoom, selectedShop?.id]);

  // Fit the map once to the actual delivery point and returned shop locations.
  // Keep this separate from marker redraws so selecting/zooming a shop never
  // snaps the map back to its original extent.
  useEffect(() => {
    const map = mapRef.current;
    const googleApi = window.google;
    if (MAP_PROVIDER !== "google" || !isGoogleMapReady || !map || !googleApi?.maps || displayShops.length === 0) return;
    const bounds = new googleApi.maps.LatLngBounds();
    if (mapStart) bounds.extend({ lat: mapStart.lat, lng: mapStart.lng });
    displayShops.forEach((shop) => bounds.extend({ lat: shop.lat, lng: shop.lng }));
    map.fitBounds(bounds, { top: 52, right: 52, bottom: 52, left: 52 });
    googleApi.maps.event.addListenerOnce(map, "bounds_changed", () => {
      const zoom = map.getZoom();
      if (typeof zoom === "number" && zoom > 15) map.setZoom(15);
    });
  }, [isGoogleMapReady, displayShops, mapStart]);

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
      <div className={`relative isolate w-full shrink-0 overflow-hidden rounded-2xl border border-[#E9DDF0] bg-[#FAF7FC] shadow-sm ${MAP_PROVIDER === "google" ? "h-[380px] sm:h-[460px] lg:flex lg:h-[560px]" : "h-[280px] sm:h-[340px]"}`}>
        {MAP_PROVIDER === "google" && (
          <aside className="hidden min-w-0 overflow-hidden border-r border-[#EEE7F3] bg-white lg:flex lg:w-[230px] lg:shrink-0 lg:flex-col">
            <div className="flex items-center justify-between border-b border-[#EEE7F3] px-3.5 py-3">
              <div>
                <p className="text-sm font-black text-[#21162B]">Nearby shops</p>
                <p className="text-[10px] font-semibold text-[#7D7485]">{shopsLoading ? "Finding nearby shops…" : `${localShops.length} shops · ${displayShops.filter((shop) => shop.isDemo).length} demo catalogs`}</p>
              </div>
              <Store className="h-4 w-4 text-[#981495]" />
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-1">
              {shopsLoading ? (
                <div className="px-2 py-8 text-center text-[11px] font-semibold text-[#7D7485]" role="status"><Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" />Finding shops with available products…</div>
              ) : shopsError ? (
                <div className="px-2 py-8 text-center text-[11px] text-[#7D7485]" role="alert">{shopsError}<button type="button" onClick={() => setShopsReload((value) => value + 1)} className="mt-2 block w-full font-bold text-[#981495]">Try again</button></div>
              ) : displayShops.length === 0 ? (
                <div className="px-2 py-8 text-center text-[11px] font-semibold text-[#7D7485]">No nearby registered shops or demo previews in this area. Try another delivery area.</div>
              ) : displayShops.slice(0, showAllShops ? displayShops.length : 8).map((shop) => (
                <button
                  key={shop.id}
                  type="button"
                  onClick={() => {
                    setSelectedShop(shop);
                    mapRef.current?.panTo?.({ lat: shop.lat, lng: shop.lng });
                    mapRef.current?.setZoom?.(18);
                  }}
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
                    <span className="block truncate text-[10px] font-semibold text-[#7D7485]">{shop.category}</span>
                    {shop.isDemo && <span className="block text-[9px] font-bold text-amber-700">Demo catalog · approximate area</span>}
                    <span className="mt-0.5 flex items-center gap-1.5 text-[10px] font-bold text-[#981495]">
                      {shop.isOpen !== undefined && <span className={shop.isOpen ? "text-emerald-700" : "text-slate-500"}>{shop.isOpen ? "Open now" : "Closed"} ·</span>}
                      {shop.distanceKm.toFixed(1)} km away
                    </span>
                  </span>
                  <span className="text-lg text-[#981495]">›</span>
                </button>
              ))}
            </div>
            {displayShops.length > 8 && (
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

        {MAP_PROVIDER === "google" && displayShops.length > 0 && (
          <div className="absolute left-3 bottom-3 z-[1000] rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-black text-[#981495] shadow-md ring-1 ring-[#EBD9F0]">
            {localShops.length} shops nearby · demo catalogs use approximate area pins
          </div>
        )}

        {MAP_PROVIDER === "google" && coords && displayShops.length === 0 && !mapError && (
          <div className="absolute inset-x-3 bottom-3 z-[1000] rounded-xl bg-white/95 px-3 py-2 text-xs text-[#7D7485] shadow-md lg:hidden" role={shopsError ? "alert" : "status"}>
            {shopsLoading ? "Finding nearby shops…" : shopsError || "No registered shops or demo previews nearby. Try another delivery area."}
            {shopsError && <button type="button" onClick={() => setShopsReload((value) => value + 1)} className="ml-2 font-bold text-[#981495]">Try again</button>}
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
                {selectedShop.category} · {selectedShop.distanceKm.toFixed(1)} km away{selectedShop.isDemo ? " · demo" : ""}
                </p>
                <p className="truncate text-[10px] text-[#7D7485]">{selectedShop.address || "LocalShore shop"}</p>
              </div>
              <button type="button" onClick={() => setSelectedShop(null)} className="self-start text-lg leading-none text-slate-400" aria-label="Close shop card">×</button>
            </div>
            <div className="flex gap-2 px-3 pb-3">
              <button
                type="button"
                onClick={() => { window.location.assign(`/store/${encodeURIComponent(selectedShop.id)}`); }}
                className="flex-1 rounded-xl bg-[#981495] px-3 py-2 text-[11px] font-black text-white"
              >
                Browse & buy from this shop
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
