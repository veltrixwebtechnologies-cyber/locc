import { stores, productsByStore, categoryLabel } from "./mock-data";
import { CATEGORY_TAXONOMIES } from "./category-taxonomy";

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  type: "Restaurant" | "Shop" | "Dish" | "Product" | "Brand" | "Category";
  imageUrl: string;
  url: string;
  storeId?: string;
  storeName?: string;
  price?: number;
  discountPrice?: number;
  distanceKm?: number;
  rating?: number;
  reviewCount?: number;
  isOpen?: boolean;
  availableShopCount?: number;
  brandName?: string;
  categoryName?: string;
  metadata?: Record<string, unknown>;
  matchScore: number;
  mlScore?: number;
  explainabilityTags?: string[];
}

const DEFAULT_DISH_IMG =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=75";
const DEFAULT_SHOP_IMG =
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=75";

type SearchStoreLike = {
  readonly id: string;
  readonly name: string;
  readonly tagline?: string | null;
  readonly category?: string | null;
  readonly imageUrl?: string | null;
};

type SearchProductLike = {
  readonly id: string;
  readonly name: string;
  readonly category?: string | null;
  readonly imageUrl?: string | null;
  readonly price?: number | null;
  readonly storeId?: string | null;
  readonly storeName?: string | null;
  readonly storeTagline?: string | null;
};

function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’"`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function stemWord(word: string): string {
  if (!word || word.length <= 3) return word;
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.endsWith("es") && !word.endsWith("ees") && !word.endsWith("ses")) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && !word.endsWith("us")) return word.slice(0, -1);
  return word;
}

function collapseRepeatedLetters(value: string): string {
  return value.replace(/([a-z0-9])\1{1,}/g, "$1");
}

function compactForSearch(value: string): string {
  return collapseRepeatedLetters(normalizeForSearch(value)).replace(/\s+/g, "");
}

function tokenizeForSearch(value: string): string[] {
  return normalizeForSearch(value)
    .split(/\s+/)
    .filter(Boolean)
    .map(collapseRepeatedLetters);
}

function stemTokens(tokens: string[]): string[] {
  return tokens.map(stemWord);
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);

  for (let j = 0; j <= b.length; j += 1) prev[j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j];
  }

  return prev[b.length];
}

function tokenSimilarityScore(queryToken: string, candidateToken: string): number {
  if (!queryToken || !candidateToken) return 0;
  const qStem = stemWord(queryToken);
  const cStem = stemWord(candidateToken);

  if (queryToken === candidateToken || qStem === cStem) return 1;
  if (candidateToken.startsWith(queryToken) || queryToken.startsWith(candidateToken)) return 0.95;
  if (cStem.startsWith(qStem) || qStem.startsWith(cStem)) return 0.9;
  if (candidateToken.includes(queryToken) || queryToken.includes(candidateToken)) return 0.8;
  if (cStem.includes(qStem) || qStem.includes(cStem)) return 0.75;

  const distance = levenshteinDistance(qStem, cStem);
  const maxLen = Math.max(qStem.length, cStem.length);
  const allowedDistance = maxLen <= 4 ? 1 : 2;
  if (distance <= allowedDistance) return 0.65;
  return 0;
}

function scoreTextMatch(query: string, values: string[]): number {
  const normalizedQuery = normalizeForSearch(query);
  if (!normalizedQuery) return 0;
  const compactQuery = compactForSearch(query);
  const queryTokens = tokenizeForSearch(query);
  const queryStems = stemTokens(queryTokens);
  let bestScore = 0;

  for (const rawValue of values) {
    if (!rawValue) continue;

    const normalizedValue = normalizeForSearch(rawValue);
    const compactValue = compactForSearch(rawValue);
    const valueTokens = tokenizeForSearch(rawValue);
    const valueStems = stemTokens(valueTokens);
    let score = 0;

    if (normalizedValue === normalizedQuery) {
      score = Math.max(score, 120);
    } else if (normalizedValue.startsWith(normalizedQuery)) {
      score = Math.max(score, 105);
    } else if (normalizedValue.includes(normalizedQuery)) {
      score = Math.max(score, 75);
    }

    // Stemmed exact or partial matches
    const queryStemStr = queryStems.join(" ");
    const valueStemStr = valueStems.join(" ");
    if (valueStemStr === queryStemStr) {
      score = Math.max(score, 115);
    } else if (valueStemStr.includes(queryStemStr)) {
      score = Math.max(score, 85);
    }

    if (compactValue === compactQuery) {
      score = Math.max(score, 115);
    } else if (compactValue.includes(compactQuery)) {
      score = Math.max(score, 82);
    }

    for (const qToken of queryTokens) {
      for (const cToken of valueTokens) {
        score = Math.max(score, tokenSimilarityScore(qToken, cToken) * 60);
      }
    }

    bestScore = Math.max(bestScore, score);
  }

  return bestScore;
}

function normalizeImageUrl(imageUrl?: string | null, fallback: string = DEFAULT_SHOP_IMG): string {
  if (!imageUrl) return fallback;
  if (/^(https?:|data:)/i.test(imageUrl)) return imageUrl;
  return fallback;
}

export function searchCatalogItems(
  query: string,
  storesInput: readonly SearchStoreLike[] = [],
  productsInput: readonly SearchProductLike[] = [],
): SearchResultItem[] {
  const q = query.trim();
  if (!q) return [];

  const results: SearchResultItem[] = [];

  // 1. Search Category Taxonomy Subcategories & Product Types
  for (const tax of Object.values(CATEGORY_TAXONOMIES)) {
    for (const sub of tax.subcategories) {
      // Subcategory check
      const subScore = scoreTextMatch(q, [sub.name, sub.slug, tax.categoryName]);
      if (subScore >= 60) {
        results.push({
          id: `cat-sub-${sub.id}`,
          title: sub.name,
          subtitle: `${tax.categoryName} • Category`,
          type: "Category",
          imageUrl: DEFAULT_SHOP_IMG,
          url: `/?category=${tax.categorySlug}&subcategory=${sub.id}`,
          categoryName: tax.categoryName,
          matchScore: subScore + 10,
        });
      }

      // Product Type check
      for (const pt of sub.productTypes) {
        const ptScore = scoreTextMatch(q, [pt.name, pt.slug, sub.name, tax.categoryName]);
        if (ptScore >= 60) {
          results.push({
            id: `cat-pt-${pt.id}`,
            title: pt.name,
            subtitle: `${tax.categoryName} → ${sub.name}`,
            type: "Category",
            imageUrl: DEFAULT_SHOP_IMG,
            url: `/?category=${tax.categorySlug}&subcategory=${sub.id}&product_type=${pt.id}`,
            categoryName: tax.categoryName,
            matchScore: ptScore + 15,
          });
        }
      }
    }
  }

  // 2. Search Shops & Restaurants
  for (const store of storesInput) {
    const categoryText =
      (store.category ? categoryLabel[store.category as keyof typeof categoryLabel] : "") ||
      store.category ||
      "Shop";
    const score = Math.max(
      scoreTextMatch(q, [store.name, store.tagline ?? "", categoryText]),
      store.tagline ? scoreTextMatch(q, [store.tagline]) * 0.6 : 0,
    );

    if (score > 0) {
      const lowerName = normalizeForSearch(store.name);
      const isRestaurant =
        lowerName.includes("restaurant") ||
        lowerName.includes("bakes") ||
        lowerName.includes("sweets") ||
        lowerName.includes("cafe");
      results.push({
        id: `store-${store.id}`,
        title: store.name,
        subtitle: isRestaurant ? "Restaurant" : categoryText,
        type: isRestaurant ? "Restaurant" : "Shop",
        imageUrl: normalizeImageUrl(store.imageUrl),
        url: `/store/${store.id}`,
        storeId: store.id,
        storeName: store.name,
        matchScore: score,
      });
    }
  }

  // 3. Search Products & Dishes
  for (const prod of productsInput) {
    const categoryText = prod.category || "Product";
    const score = scoreTextMatch(q, [
      prod.name,
      categoryText,
      prod.storeName ?? "",
      prod.storeTagline ?? "",
    ]);

    if (score > 0) {
      const title = prod.name;
      const lowerCategory = normalizeForSearch(categoryText);
      const lowerTitle = normalizeForSearch(title);
      const isDish =
        lowerCategory.includes("dish") ||
        lowerCategory.includes("biryani") ||
        lowerCategory.includes("mutton") ||
        lowerCategory.includes("chicken") ||
        lowerCategory.includes("paneer") ||
        lowerCategory.includes("kebab") ||
        lowerCategory.includes("sauce") ||
        lowerCategory.includes("starter") ||
        lowerCategory.includes("fresh batter") ||
        lowerTitle.includes("batter") ||
        lowerTitle.includes("biryani") ||
        lowerTitle.includes("chicken") ||
        lowerTitle.includes("mutton") ||
        lowerTitle.includes("paneer");

      results.push({
        id: `prod-${prod.id}`,
        title,
        subtitle: prod.storeName || (isDish ? "Dish" : "Product"),
        type: isDish ? "Dish" : "Product",
        imageUrl: normalizeImageUrl(prod.imageUrl, DEFAULT_DISH_IMG),
        url: `/product/${prod.id}`,
        storeId: prod.storeId ?? undefined,
        storeName: prod.storeName ?? undefined,
        price: prod.price ?? undefined,
        matchScore: score,
      });
    }
  }

  // Deduplicate by ID
  const map = new Map<string, SearchResultItem>();
  for (const r of results) {
    if (!map.has(r.id)) map.set(r.id, r);
  }

  return Array.from(map.values()).sort(
    (a, b) => b.matchScore - a.matchScore || a.title.length - b.title.length
  );
}

export function getInstantSearchResults(query: string): SearchResultItem[] {
  const allProducts = Object.values(productsByStore).flat();
  const mockStores = stores.map((store) => ({
    id: store.id,
    name: store.name,
    tagline: store.tagline,
    category: store.category,
    imageUrl: store.imageUrl,
  }));

  const mockProducts = allProducts.map((prod) => {
    const parentStore = stores.find((s) => s.id === prod.storeId);
    return {
      id: prod.id,
      name: prod.name,
      category: prod.category,
      imageUrl: prod.imageUrl,
      price: prod.price,
      storeId: prod.storeId,
      storeName: parentStore?.name,
      storeTagline: parentStore?.tagline,
    };
  });

  return searchCatalogItems(query, mockStores, mockProducts);
}
