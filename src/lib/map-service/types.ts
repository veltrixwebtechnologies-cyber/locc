import type { Store, Product, StoreCategory } from "@/lib/mock-data";

export interface MapLocation {
  lat: number;
  lng: number;
  address?: string;
  label?: string;
}

export interface GeocodeResult {
  placeName: string;
  lat: number;
  lng: number;
  bbox?: [number, number, number, number];
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  geometry: [number, number][]; // Array of [lng, lat]
  distanceKm?: number;
  durationMins?: number;
  steps?: { instruction: string; distanceMeters: number; durationSeconds: number }[];
}

export interface MapMarkerItem {
  id: string;
  shopId: string;
  shopName: string;
  category: StoreCategory;
  lat: number;
  lng: number;
  address: string;
  rating: number;
  isOpen: boolean;
  distanceKm: number;
  productName: string;
  productImage?: string;
  minPrice: number;
  maxPrice?: number;
  unit?: string;
  priceDisplay: string;
  updatedAt: string; // e.g. "Price updated: Today" or "Price updated 2 hours ago"
  inStock: boolean;
  totalVariants?: number;
  rawStore: Store;
  matchingProduct?: Product;
}

export interface MapFilterOptions {
  query?: string;
  category?: StoreCategory | "all";
  maxDistanceKm?: number; // 1, 3, 5, 10
  minPrice?: number;
  maxPrice?: number;
  minRating?: number; // e.g. 4.0, 4.5
  openNow?: boolean;
  inStockOnly?: boolean;
  deliveryAvailable?: boolean;
  pickupAvailable?: boolean;
  bounds?: {
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
  };
}
