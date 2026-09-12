export type FilterType =
  | "single_select"
  | "multi_select"
  | "range"
  | "boolean"
  | "number"
  | "text"
  | "color"
  | "rating"
  | "chip_group";

export interface FilterOption {
  id: string;
  value: string;
  label: string;
  display_order?: number;
  count?: number;
}

export interface FilterDefinition {
  id: string;
  key: string;
  label: string;
  type: FilterType;
  unit?: string;
  is_universal: boolean;
  is_required: boolean;
  display_order: number;
  options: FilterOption[];
}

/** 1. Product Filter Group */
export interface ProductFilterGroupState {
  category?: string;
  subcategory?: string;
  productType?: string;
  minPrice?: number;
  maxPrice?: number;
  brands: string[];
  attributes: Record<string, string[]>;
  minRating?: number;
  minDiscountPercent?: number;
  inStockOnly?: boolean;
}

/** 2. Shop Filter Group */
export interface ShopFilterGroupState {
  maxDistanceKm?: number;
  minShopRating?: number;
  verifiedShopOnly?: boolean;
  localFavoriteOnly?: boolean;
  openNowOnly?: boolean;
  shopTypes: string[];
  shopIds: string[];
}

/** 3. Delivery Filter Group */
export interface DeliveryFilterGroupState {
  deliveryAvailableOnly?: boolean;
  pickupAvailableOnly?: boolean;
  fastDeliveryOnly?: boolean;
  sameDayDeliveryOnly?: boolean;
}

/** Combined Active Filter State */
export interface ProductFilterState
  extends ProductFilterGroupState,
    ShopFilterGroupState,
    DeliveryFilterGroupState {
  query?: string;
  userLat?: number;
  userLng?: number;
  sortBy: string;
  page: number;
  inStock?: boolean;
  onSale?: boolean;
  openNow?: boolean;
}

export interface FacetCountItem {
  value: string;
  label: string;
  count: number;
}

export interface ShopFacetItem {
  id: string;
  name: string;
  distance_km?: number;
  rating?: number;
  is_open?: boolean;
  count: number;
}

export interface FacetResult {
  min_price: number;
  max_price: number;
  total_products: number;
  brand_facets: FacetCountItem[];
  shop_facets: ShopFacetItem[];
  attributes: Record<string, FacetCountItem[]>;
}

export interface FilteredProduct {
  id: string;
  seller_id: string;
  name: string;
  sku: string;
  brand: string | null;
  brand_id: string | null;
  brand_name: string | null;
  category: string;
  category_id: string | null;
  subcategory_id: string | null;
  product_type_id: string | null;
  description: string;
  mrp: number;
  selling_price: number;
  discount_price: number | null;
  stock: number;
  image_url: string;
  images: any;
  weight: string | null;
  attributes: Record<string, any>;
  shop_name: string;
  distance_km: number | null;
  rating: number;
  review_count: number;
  is_open: boolean;
  is_verified?: boolean;
  is_favorite?: boolean;
  accepts_orders: boolean;
  total_count: number;
}

export const DEFAULT_SORT_OPTIONS = [
  { value: "relevance", label: "Recommended & Relevance" },
  { value: "distance_asc", label: "Nearest Shop" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating_desc", label: "Top Customer Rating" },
  { value: "discount_desc", label: "Biggest Discount" },
  { value: "newest", label: "Newest Arrivals" },
  { value: "fastest_delivery", label: "Fastest Delivery" },
] as const;

