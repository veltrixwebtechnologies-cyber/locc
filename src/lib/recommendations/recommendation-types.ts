import type { MerchandisingProduct } from "@/lib/merchandising";

export type RecommendationType =
  | "COMPLEMENTARY"
  | "ALTERNATIVE"
  | "SIMILAR"
  | "FREQUENTLY_BOUGHT_TOGETHER"
  | "COMPLETE_PURCHASE"
  | "SAME_CATEGORY";

export type RecommendationCandidate = MerchandisingProduct & {
  distance_km?: number | null;
  delivery_available?: boolean;
  is_open?: boolean;
  tags?: string[] | null;
  attributes?: Record<string, string | number | boolean> | null;
};

export type RecommendationContext = {
  sourceProducts: RecommendationCandidate[];
  candidates: RecommendationCandidate[];
  cartProductIds?: Set<string>;
  selectedShopId?: string;
  maxResults?: number;
};

export type ScoredRecommendation = {
  product: RecommendationCandidate;
  type: RecommendationType;
  score: number;
  distanceKm?: number;
};
