import { haversineDistanceKm, isValidCoordinate } from "@/lib/geo";

export type CommerceReason =
  | "AVAILABLE"
  | "SELLER_NOT_APPROVED"
  | "STORE_DISABLED"
  | "STORE_CLOSED"
  | "STORE_LOCATION_UNAVAILABLE"
  | "CUSTOMER_LOCATION_UNAVAILABLE"
  | "OUTSIDE_SERVICE_ZONE"
  | "OUTSIDE_DELIVERY_RADIUS"
  | "MULTIPLE_FULFILLMENT_STORES"
  | "STORE_OWNERSHIP_MISMATCH";

export interface CommerceStore {
  id: string;
  seller_id: string;
  name?: string | null;
  status?: string | null;
  accepts_orders?: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
  service_radius_km?: number | null;
  operating_hours?: unknown;
  is_default?: boolean;
}

export interface CommerceSeller {
  id: string;
  status?: string | null;
  accepts_orders?: boolean | null;
  lat?: number | null;
  lng?: number | null;
  shop_hours?: unknown;
}

export interface CommerceZone {
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
  radius_km: number;
}

export function resolveProductStore<T extends CommerceStore>(input: {
  productSellerId: string;
  productStoreId?: string | null;
  stores: readonly T[];
}): T | null {
  const { productSellerId, productStoreId, stores } = input;
  if (productStoreId) {
    return (
      stores.find((store) => store.id === productStoreId && store.seller_id === productSellerId) ??
      null
    );
  }
  const defaults = stores.filter(
    (store) => store.seller_id === productSellerId && store.is_default,
  );
  return defaults.length === 1 ? defaults[0] : null;
}

export function resolveOperatingHours(
  store: CommerceStore | null | undefined,
  seller: CommerceSeller | null | undefined,
) {
  if (Array.isArray(store?.operating_hours) && store.operating_hours.length) {
    return { hours: store.operating_hours, source: "store" as const };
  }
  if (seller?.shop_hours != null)
    return { hours: seller.shop_hours, source: "seller-legacy" as const };
  return { hours: null, source: "unconfigured" as const };
}

export function resolveStoreCoordinates(
  store: CommerceStore | null | undefined,
  seller: CommerceSeller | null | undefined,
) {
  if (store && isValidCoordinate(store.latitude, store.longitude)) {
    return { lat: Number(store.latitude), lng: Number(store.longitude), source: "store" as const };
  }
  if (seller && isValidCoordinate(seller.lat, seller.lng)) {
    return { lat: Number(seller.lat), lng: Number(seller.lng), source: "seller-legacy" as const };
  }
  return null;
}

export function getStoreCommerceStatus(input: {
  store: CommerceStore | null;
  seller: CommerceSeller | null;
  isOpen?: boolean | null;
}): { canBrowse: boolean; canOrder: boolean; reason: CommerceReason } {
  const { store, seller, isOpen } = input;
  if (!store || !seller || store.seller_id !== seller.id) {
    return { canBrowse: false, canOrder: false, reason: "STORE_OWNERSHIP_MISMATCH" };
  }
  if ((seller.status ?? "").toLowerCase() !== "approved") {
    return { canBrowse: false, canOrder: false, reason: "SELLER_NOT_APPROVED" };
  }
  const storeStatus = (store.status ?? "").toLowerCase();
  if (!["active", "approved"].includes(storeStatus)) {
    return { canBrowse: false, canOrder: false, reason: "STORE_DISABLED" };
  }
  if (store.accepts_orders === false || seller.accepts_orders === false || isOpen === false) {
    return { canBrowse: true, canOrder: false, reason: "STORE_CLOSED" };
  }
  return { canBrowse: true, canOrder: true, reason: "AVAILABLE" };
}

export function checkStoreDeliveryEligibility(input: {
  store: CommerceStore;
  seller: CommerceSeller;
  customer: { lat: number; lng: number } | null;
  zones?: readonly CommerceZone[];
}): {
  eligible: boolean;
  reason: CommerceReason;
  distanceKm?: number;
  locationSource?: "store" | "seller-legacy";
} {
  const location = resolveStoreCoordinates(input.store, input.seller);
  if (!location) return { eligible: false, reason: "STORE_LOCATION_UNAVAILABLE" };
  if (!input.customer || !isValidCoordinate(input.customer.lat, input.customer.lng)) {
    return { eligible: false, reason: "CUSTOMER_LOCATION_UNAVAILABLE" };
  }
  const distanceKm = haversineDistanceKm(
    location.lat,
    location.lng,
    input.customer.lat,
    input.customer.lng,
  );
  const activeZones = (input.zones ?? []).filter((zone) => zone.is_active);
  if (activeZones.length) {
    const inZone = activeZones.some(
      (zone) =>
        isValidCoordinate(zone.latitude, zone.longitude) &&
        Number.isFinite(zone.radius_km) &&
        zone.radius_km >= 0 &&
        haversineDistanceKm(
          zone.latitude!,
          zone.longitude!,
          input.customer!.lat,
          input.customer!.lng,
        ) <= zone.radius_km,
    );
    return inZone
      ? { eligible: true, reason: "AVAILABLE", distanceKm, locationSource: location.source }
      : {
          eligible: false,
          reason: "OUTSIDE_SERVICE_ZONE",
          distanceKm,
          locationSource: location.source,
        };
  }
  const radius = input.store.service_radius_km;
  if (typeof radius === "number" && Number.isFinite(radius) && radius >= 0 && distanceKm > radius) {
    return {
      eligible: false,
      reason: "OUTSIDE_DELIVERY_RADIUS",
      distanceKm,
      locationSource: location.source,
    };
  }
  // With no Store radius or assigned Store zone, preserve pre-Store behavior.
  return { eligible: true, reason: "AVAILABLE", distanceKm, locationSource: location.source };
}

export function resolveSingleStoreFulfillment(
  stores: readonly { sellerId: string; storeId: string }[],
): { sellerId: string; storeId: string } | null {
  if (!stores.length) return null;
  const first = stores[0];
  return stores.every(
    (entry) => entry.sellerId === first.sellerId && entry.storeId === first.storeId,
  )
    ? first
    : null;
}

export function resolvePickupLocation(input: {
  store?: {
    id: string;
    seller_id: string;
    latitude?: number | null;
    longitude?: number | null;
    address?: string | null;
    name?: string | null;
  } | null;
  seller: CommerceSeller & { address?: string | null; business_name?: string | null };
  expectedSellerId: string;
}) {
  if (input.store && input.store.seller_id !== input.expectedSellerId) return null;
  const coords = resolveStoreCoordinates(input.store ?? null, input.seller);
  if (!coords) return null;
  return {
    ...coords,
    name: input.store?.name || input.seller.business_name || "Local shop",
    address: input.store?.address || input.seller.address || null,
  };
}
