import { haversineDistanceKm } from "@/lib/geo";
import { stores } from "@/lib/mock-data";
import type {
  RecommendationCandidate,
  RecommendationContext,
  RecommendationType,
  ScoredRecommendation,
} from "./recommendation-types";

const STOP_WORDS = new Set(["and", "the", "with", "for", "from", "pack", "piece", "unit"]);

/**
 * Broad merchandising families. These are category relationships, not product
 * name exceptions, so new products inherit recommendations automatically.
 */
const FAMILY_RELATIONSHIPS: Record<string, string[][]> = {
  food: [
    ["meat", "chicken", "mutton", "fish", "seafood", "prawn"],
    ["masala", "spice", "turmeric", "chilli", "coriander", "cumin", "salt"],
    ["onion", "garlic", "ginger", "tomato", "lemon", "curry", "mint", "vegetable"],
    ["rice", "dal", "oil", "bread", "butter", "jam", "cheese", "egg", "milk"],
  ],
  fashion: [
    ["shirt", "tshirt", "top", "kurta", "dress", "saree"],
    ["jeans", "trouser", "skirt", "shorts", "bottom"],
    ["shoe", "footwear", "sandal", "sneaker", "sock"],
    ["belt", "wallet", "bag", "handbag", "watch", "jewellery", "accessory"],
  ],
  electronics: [
    ["mobile", "phone", "smartphone", "laptop", "computer", "tablet", "television", "tv"],
    ["charger", "cable", "adapter", "powerbank", "battery", "usb", "hdmi"],
    ["case", "cover", "protector", "screen"],
    ["mouse", "keyboard", "headphone", "earphone", "speaker", "soundbar", "bag", "stand"],
  ],
  baby: [
    ["diaper", "nappy"],
    ["wipe", "lotion", "shampoo", "powder", "cream", "rash"],
    ["bottle", "feeding", "baby food", "toy"],
  ],
  beauty: [
    ["shampoo", "conditioner", "hair oil", "serum"],
    ["face wash", "cleanser", "moisturizer", "sunscreen", "serum"],
    ["soap", "body wash", "deodorant", "cosmetic", "makeup"],
  ],
  home: [
    ["cookware", "pan", "pot", "kitchen", "utensil"],
    ["storage", "container", "cleaning", "detergent", "tissue"],
    ["decor", "furniture", "lamp", "curtain", "home"],
  ],
  celebration: [["cake", "candle", "chocolate", "decoration", "party", "ice cream"]],
};

const normalize = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const tokens = (product: RecommendationCandidate) => {
  const values = [
    product.name,
    product.category,
    product.brand,
    product.brand_name,
    product.description,
    ...(product.tags ?? []),
    ...Object.values(product.attributes ?? {}),
  ]
    .map(normalize)
    .join(" ");
  return new Set(values.split(/\s+/).filter((token) => token && !STOP_WORDS.has(token)));
};

const phraseIn = (text: string, phrase: string) => {
  const normalized = normalize(text);
  const target = normalize(phrase);
  return (
    normalized.includes(target) || target.split(" ").every((part) => normalized.includes(part))
  );
};

const groupsFor = (product: RecommendationCandidate) => {
  const text = normalize(
    [product.name, product.category, product.description, ...(product.tags ?? [])].join(" "),
  );
  return Object.values(FAMILY_RELATIONSHIPS)
    .flat()
    .filter((group) => group.some((term) => phraseIn(text, term)));
};

const sharesGroup = (source: RecommendationCandidate, candidate: RecommendationCandidate) => {
  const candidateText = normalize(
    [candidate.name, candidate.category, candidate.description, ...(candidate.tags ?? [])].join(
      " ",
    ),
  );
  return groupsFor(source).some((group) => group.some((term) => phraseIn(candidateText, term)));
};

const categoryKey = (product: RecommendationCandidate) => normalize(product.category);

function distanceFor(product: RecommendationCandidate) {
  if (typeof product.distance_km === "number") return product.distance_km;
  const shop = stores.find((store) => store.id === product.seller_id);
  return shop?.distanceKm;
}

function scorePair(source: RecommendationCandidate, candidate: RecommendationCandidate) {
  const sourceTokens = tokens(source);
  const candidateTokens = tokens(candidate);
  const overlap = [...sourceTokens].filter((token) => candidateTokens.has(token)).length;
  const sameCategory = categoryKey(source) && categoryKey(source) === categoryKey(candidate);
  const complementary = sharesGroup(source, candidate) && !sameCategory;
  let type: RecommendationType = "SIMILAR";
  let score = 0;

  if (complementary) {
    type = "COMPLEMENTARY";
    score += 58;
  }
  if (sameCategory) {
    type = "SAME_CATEGORY";
    score += 34;
  }
  if (overlap > 0) score += Math.min(30, overlap * 8);
  if (source.seller_id === candidate.seller_id) score += 28;
  if (candidate.delivery_available !== false) score += 8;
  if (candidate.is_open !== false) score += 4;
  score += Math.min(14, Math.max(0, candidate.average_rating || 0) * 2);
  score += Math.min(10, Math.log10(Math.max(1, candidate.review_count || 0) + 1) * 4);

  if (!sameCategory && !complementary && overlap === 0) return null;
  return { type, score };
}

export function getRecommendations({
  sourceProducts,
  candidates,
  cartProductIds = new Set(),
  selectedShopId,
  maxResults = 8,
}: RecommendationContext): ScoredRecommendation[] {
  const sourceIds = new Set(sourceProducts.map((product) => product.id));
  const byId = new Map<string, ScoredRecommendation>();

  for (const candidate of candidates) {
    if (sourceIds.has(candidate.id) || cartProductIds.has(candidate.id)) continue;
    if (candidate.stock <= 0 || candidate.delivery_available === false) continue;

    const pairs = sourceProducts.map((source) => scorePair(source, candidate)).filter(Boolean) as {
      type: RecommendationType;
      score: number;
    }[];
    if (!pairs.length) continue;
    const best = pairs.sort((a, b) => b.score - a.score)[0];
    const distanceKm = distanceFor(candidate);
    const shopBonus = selectedShopId && candidate.seller_id === selectedShopId ? 22 : 0;
    const scored = {
      product: candidate,
      type: best.type,
      score: best.score + shopBonus,
      distanceKm,
    } satisfies ScoredRecommendation;
    const previous = byId.get(candidate.id);
    if (!previous || scored.score > previous.score) byId.set(candidate.id, scored);
  }

  return [...byId.values()]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (
        (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY)
      );
    })
    .slice(0, maxResults);
}

export function getRecommendationGroups(context: RecommendationContext) {
  const recommendations = getRecommendations(context);
  return {
    complementary: recommendations.filter((item) => item.type === "COMPLEMENTARY"),
    similar: recommendations.filter(
      (item) => item.type === "SAME_CATEGORY" || item.type === "SIMILAR",
    ),
    all: recommendations,
  };
}

export function adaptMockProduct(product: {
  id: string;
  storeId: string;
  name: string;
  unit: string;
  price: number;
  imageUrl?: string;
  category: string;
  stock?: number;
}): RecommendationCandidate {
  const shop = stores.find((store) => store.id === product.storeId);
  return {
    id: product.id,
    seller_id: product.storeId,
    name: product.name,
    brand: null,
    brand_id: null,
    brand_name: shop?.name ?? null,
    category: product.category,
    selling_price: product.price,
    mrp: product.price,
    discount_price: null,
    discount_starts_at: null,
    discount_ends_at: null,
    clearance: false,
    stock: product.stock ?? 20,
    image_url: product.imageUrl ?? null,
    created_at: "",
    average_rating: shop?.rating ?? 4.5,
    review_count: 0,
    shop_name: shop?.name ?? "LocalShore shop",
    distance_km: shop?.distanceKm,
  };
}

export function recommendationDistance(candidate: RecommendationCandidate) {
  if (typeof candidate.distance_km === "number") return candidate.distance_km;
  const shop = stores.find((store) => store.id === candidate.seller_id);
  return shop ? haversineDistanceKm(shop.lat, shop.lng, shop.lat, shop.lng) : undefined;
}
