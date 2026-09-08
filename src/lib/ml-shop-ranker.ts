import { calculateDistanceKm } from './geo';

export interface MLShopRankingInput {
  id: string;
  name: string;
  category?: string;
  lat?: number | null;
  lng?: number | null;
  rating?: number;
  review_count?: number;
  is_open?: boolean;
  stock_count?: number;
  products_matching?: number;
  avg_prep_time_mins?: number;
  business_type?: string;
  address?: string;
}

export interface MLRankingWeights {
  w_distance: number;      // default: 35
  w_stock: number;         // default: 25
  w_availability: number;  // default: 15
  w_rating: number;        // default: 10
  w_delivery_speed: number;// default: 10
  w_velocity: number;      // default: 5
}

export const DEFAULT_ML_WEIGHTS: MLRankingWeights = {
  w_distance: 35,
  w_stock: 25,
  w_availability: 15,
  w_rating: 10,
  w_delivery_speed: 10,
  w_velocity: 5,
};

export interface MLRankedShopResult extends MLShopRankingInput {
  distance_km: number | null;
  distance_score: number;       // 0-100
  stock_score: number;          // 0-100
  availability_score: number;   // 0-100
  rating_score: number;         // 0-100
  speed_score: number;          // 0-100
  total_ml_score: number;       // 0-100
  explainability_tags: string[];
  estimated_eta_mins: number;
}

export interface ParsedQueryIntent {
  raw_query: string;
  normalized_query: string;
  category_intent: string | null;
  is_urgent: boolean;
  wants_fast_delivery: boolean;
  price_sensitivity: 'low' | 'medium' | 'high' | 'neutral';
}

/**
 * Parses user search query to detect intent and category triggers
 */
export function parseQueryIntent(query: string): ParsedQueryIntent {
  const norm = (query || '').toLowerCase().trim();
  
  let category_intent: string | null = null;
  if (/shirt|t-shirt|pant|jeans|cloth|fashion|dress|shoe|footwear/i.test(norm)) {
    category_intent = 'Fashion & Apparel';
  } else if (/phone|mobile|laptop|electronic|headphone|gadget|repair/i.test(norm)) {
    category_intent = 'Electronics & Tech Services';
  } else if (/milk|bread|egg|grocery|fruit|veg|food|snack/i.test(norm)) {
    category_intent = 'Groceries & Daily Needs';
  } else if (/medicine|pharma|doctor|tablet|health/i.test(norm)) {
    category_intent = 'Pharmacy & Healthcare';
  }

  const is_urgent = /urgent|quick|fast|emergency|now|instant/i.test(norm);
  const wants_fast_delivery = is_urgent || /delivery|express/i.test(norm);

  let price_sensitivity: ParsedQueryIntent['price_sensitivity'] = 'neutral';
  if (/cheap|discount|offer|budget|wholesale/i.test(norm)) {
    price_sensitivity = 'high';
  } else if (/premium|luxury|original|brand/i.test(norm)) {
    price_sensitivity = 'low';
  }

  return {
    raw_query: query,
    normalized_query: norm,
    category_intent,
    is_urgent,
    wants_fast_delivery,
    price_sensitivity,
  };
}

/**
 * Multi-Factor Local Shop Ranking Engine with Distance Penalty Decay
 */
export function rankShopsWithML(
  shops: MLShopRankingInput[],
  userLat?: number | null,
  userLng?: number | null,
  query?: string,
  customWeights: Partial<MLRankingWeights> = {}
): MLRankedShopResult[] {
  const weights: MLRankingWeights = { ...DEFAULT_ML_WEIGHTS, ...customWeights };
  const intent = parseQueryIntent(query || '');

  // Adjust weights based on query intent
  if (intent.is_urgent) {
    weights.w_distance = 45;
    weights.w_delivery_speed = 25;
    weights.w_rating = 5;
  }

  const results: MLRankedShopResult[] = shops.map((shop) => {
    // 1. Distance Calculation & Distance Score (Exponential decay penalty)
    let distance_km: number | null = null;
    let distance_score = 50; // Fallback score if location unknown

    if (userLat != null && userLng != null && shop.lat != null && shop.lng != null) {
      distance_km = calculateDistanceKm(userLat, userLng, shop.lat, shop.lng);
      if (distance_km != null) {
        distance_score = Math.round(100 / (1 + Math.pow(distance_km / 3.0, 2)));
      }
    }

    // 2. Stock & Matching Products Score
    const matchCount = shop.products_matching ?? shop.stock_count ?? 1;
    const stock_score = Math.min(100, Math.round((matchCount / 8) * 100));

    // 3. Open Availability Score
    const availability_score = shop.is_open !== false ? 100 : 0;

    // 4. Rating Score (Scaled 0-5 -> 0-100)
    const rating = shop.rating || 4.2;
    const rating_score = Math.round((rating / 5.0) * 100);

    // 5. Delivery Speed & Prep Time Score
    const prepMins = shop.avg_prep_time_mins || 15;
    const distMins = distance_km ? Math.round((distance_km / 20) * 60) : 10;
    const totalEtaMins = prepMins + distMins;
    const speed_score = Math.max(0, Math.min(100, 100 - (totalEtaMins * 2)));

    // 6. Weighted Total ML Score
    const totalWeightSum = weights.w_distance + weights.w_stock + weights.w_availability + weights.w_rating + weights.w_delivery_speed + weights.w_velocity;
    const total_ml_score = Math.round(
      (
        (distance_score * weights.w_distance) +
        (stock_score * weights.w_stock) +
        (availability_score * weights.w_availability) +
        (rating_score * weights.w_rating) +
        (speed_score * weights.w_delivery_speed) +
        (75 * weights.w_velocity)
      ) / totalWeightSum
    );

    // 7. Explainability Tags
    const tags: string[] = [];
    if (availability_score === 100) tags.push('Open Now');
    else tags.push('Closed');

    if (distance_km !== null) {
      if (distance_km < 1.5) tags.push(`Near You (${distance_km.toFixed(1)} km)`);
      else tags.push(`${distance_km.toFixed(1)} km away`);
    }

    if (matchCount > 0) {
      tags.push(`${matchCount} matching item${matchCount > 1 ? 's' : ''}`);
    }

    if (rating >= 4.5) {
      tags.push(`★ ${rating.toFixed(1)} Top Rated`);
    }

    if (totalEtaMins <= 25 && availability_score === 100) {
      tags.push(`⚡ Fast ${totalEtaMins} min delivery`);
    }

    return {
      ...shop,
      distance_km,
      distance_score,
      stock_score,
      availability_score,
      rating_score,
      speed_score,
      total_ml_score,
      explainability_tags: tags,
      estimated_eta_mins: totalEtaMins,
    };
  });

  // Sort by ML Score descending, then distance ascending
  return results.sort((a, b) => {
    if (b.total_ml_score !== a.total_ml_score) {
      return b.total_ml_score - a.total_ml_score;
    }
    return (a.distance_km ?? 999) - (b.distance_km ?? 999);
  });
}
