import type { StoreCategory } from "@/lib/mock-data";
import { toStoreCategory } from "@/lib/shop-categories";
import type { MapMarkerItem } from "@/lib/map-service/types";
import type { ShopCardData } from "@/components/shop-card";
import { isValidCoordinate } from "@/lib/geo";
import { runCatalogRpcWithTimeout } from "@/lib/catalog-rpc";
import { getImportedCatalogItems } from "@/lib/imported-demo-cart";

type Rpc = (name: string, args: Record<string, unknown>) => Parameters<typeof runCatalogRpcWithTimeout>[0];

export function getImportedShopHref(id: string, lat: number, lng: number): string {
  const shopId = id.startsWith("imported:") ? id : `imported:${id}`;
  return `/store/${encodeURIComponent(shopId)}?${new URLSearchParams({ shopLat: String(lat), shopLng: String(lng) })}`;
}

export async function fetchImportedShopById(rpc: Rpc, id: string, lat?: number, lng?: number): Promise<ImportedShopRow> {
  if (lat == null || lng == null || !isValidCoordinate(lat, lng)) {
    throw new Error("Open this shop from its nearby listing or map pin to view its details.");
  }
  const shops = await fetchNearbyImportedShops(rpc, { lat, lng, radiusKm: 0.1 });
  const selected = shops.find((shop) => `imported:${shop.id}` === id);
  if (!selected) throw new Error("This shop listing could not be found. Return to the map and try again.");
  return selected;
}

export async function fetchNearbyImportedShops(rpc: Rpc, input: {
  lat: number; lng: number; radiusKm: number; category?: string | null; query?: string | null;
}): Promise<ImportedShopRow[]> {
  if (!isValidCoordinate(input.lat, input.lng)) return [];
  const response = await runCatalogRpcWithTimeout(rpc("get_nearby_imported_shops", {
    p_lat: input.lat, p_lng: input.lng, p_radius_km: input.radiusKm,
    p_category_slug: input.category ?? null, p_query: input.query ?? null, p_limit: 100,
  }));
  if (response.error?.code === "PGRST202") return [];
  if (response.error) throw new Error(response.error.message || "Could not load public shop listings");
  return Array.isArray(response.data) ? (response.data as ImportedShopRow[]).filter((shop) => toImportedShopCard(shop) !== null) : [];
}

export interface ImportedShopRow {
  id: string;
  business_name: string;
  category: string;
  formatted_address: string | null;
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
  distance_km: number;
  website: string | null;
  google_maps_url: string | null;
  rating: number | string | null;
  review_count: number | null;
  cover_image_url: string | null;
  image_type: string | null;
  claim_status: string;
}

export function toImportedShopCard(shop: ImportedShopRow): ShopCardData | null {
  if (!shop.id || !shop.business_name || shop.latitude == null || shop.longitude == null || shop.distance_km == null) return null;
  const lat = Number(shop.latitude);
  const lng = Number(shop.longitude);
  const distanceKm = Number(shop.distance_km);
  if (!isValidCoordinate(lat, lng) || !Number.isFinite(distanceKm) || distanceKm < 0) return null;
  const rating = Number(shop.rating ?? 0);
  return {
    id: `imported:${shop.id}`,
    name: shop.business_name,
    category: shop.category,
    imageUrl: shop.cover_image_url,
    imageType: shop.image_type ?? "representative",
    rating: Number.isFinite(rating) ? rating : 0,
    reviewCount: shop.review_count ?? undefined,
    distanceKm,
    latitude: lat,
    longitude: lng,
    address: shop.formatted_address ?? undefined,
    city: shop.city ?? undefined,
    isImported: true,
    claimStatus: shop.claim_status,
    featuredProductName: getImportedCatalogItems(shop.category)[0]?.name,
    startingPrice: Math.min(...getImportedCatalogItems(shop.category).map(item => item.price)),
    website: shop.website ?? undefined,
    googleMapsUrl: shop.google_maps_url ?? undefined,
  };
}

export function toImportedMapMarker(shop: ImportedShopRow): MapMarkerItem | null {
  const card = toImportedShopCard(shop);
  if (!card) return null;
  const category = toStoreCategory(shop.category) as StoreCategory;
  const lat = Number(shop.latitude);
  const lng = Number(shop.longitude);
  const rating = Number(shop.rating ?? 0);
  const address = shop.formatted_address ?? [shop.city, shop.state].filter(Boolean).join(", ");
  return {
    id: `marker-${card.id}`,
    shopId: card.id,
    shopName: shop.business_name,
    category,
    lat,
    lng,
    address,
    rating: Number.isFinite(rating) ? rating : 0,
    isOpen: false,
    distanceKm: Number(shop.distance_km),
    productName: "Public business listing",
    productImage: shop.cover_image_url ?? undefined,
    minPrice: 0,
    priceDisplay: "Public listing",
    updatedAt: "",
    inStock: false,
    totalVariants: 0,
    isImported: true,
    website: shop.website ?? undefined,
    googleMapsUrl: shop.google_maps_url ?? undefined,
    reviewCount: shop.review_count ?? undefined,
    imageType: shop.image_type ?? "representative",
    claimStatus: shop.claim_status,
  };
}
