/**
 * LocalShore Dynamic Category-Aware Filter Execution Engine
 *
 * Provides evaluation and filtering of Stores and Products against both:
 * 1. Shared / Universal Filters (Price, Distance, Rating, Open Now, Brand)
 * 2. Dynamic Category & Product Attribute Filters (Size, Color, Fabric, Fit, Sleeve, Pattern, Dress Type, etc.)
 * 3. Context-Aware Facet Aggregation with Dynamic Option Discovery
 */

import {
  getCategoryTaxonomy,
  UNIVERSAL_FILTERS,
  type DynamicAttributeFilter,
  type SubcategoryTaxonomy,
  type ProductTypeTaxonomy,
} from "./category-taxonomy.ts";
import type { Store, Product } from "./mock-data.ts";
import { isStoreInCategory } from "./shop-categories.ts";
import type {
  ProductFilterState,
  FilteredProduct,
  FacetResult,
  FacetCountItem,
  FilterDefinition,
} from "./filter-types.ts";

export interface ActiveFilterState {
  categoryId?: string;
  subcategoryId?: string;
  productTypeId?: string;
  priceRange?: [number, number];
  maxDistanceKm?: number;
  minRating?: number;
  openNowOnly?: boolean;
  maxEtaMin?: number;
  selectedOffers?: string[];
  selectedBrands?: string[];
  selectedAttributes: Record<string, string[]>;
  searchQuery?: string;
}

export const INITIAL_FILTER_STATE: ActiveFilterState = {
  selectedAttributes: {},
};

/**
 * Returns available subcategories for a given category ID or slug
 */
export function getSubcategoriesForCategory(categoryId?: string | null): SubcategoryTaxonomy[] {
  const taxonomy = getCategoryTaxonomy(categoryId);
  return taxonomy.subcategories || [];
}

/**
 * Returns available product types for a selected subcategory
 */
export function getProductTypesForSubcategory(
  categoryId?: string | null,
  subcategoryId?: string | null,
): ProductTypeTaxonomy[] {
  const subcategories = getSubcategoriesForCategory(categoryId);
  if (!subcategoryId || subcategoryId === "all") {
    return subcategories.flatMap((sub) => sub.productTypes);
  }
  const found = subcategories.find((s) => s.id === subcategoryId || s.slug === subcategoryId);
  return found ? found.productTypes : [];
}

/**
 * Compiles all active dynamic attribute filter definitions for a given Category + Subcategory + ProductType
 */
export function getActiveAttributeFilters(
  categoryId?: string | null,
  subcategoryId?: string | null,
  productTypeId?: string | null,
): DynamicAttributeFilter[] {
  const taxonomy = getCategoryTaxonomy(categoryId);
  const filters: DynamicAttributeFilter[] = [...taxonomy.categoryFilters];

  const subcategories = taxonomy.subcategories;
  if (subcategoryId && subcategoryId !== "all") {
    const sub = subcategories.find((s) => s.id === subcategoryId || s.slug === subcategoryId);
    if (sub?.defaultFilters) {
      filters.push(...sub.defaultFilters);
    }
  }

  if (productTypeId && productTypeId !== "all") {
    const allProdTypes = subcategories.flatMap((s) => s.productTypes);
    const prodType = allProdTypes.find((p) => p.id === productTypeId || p.slug === productTypeId);
    if (prodType?.filters) {
      filters.push(...prodType.filters);
    }
  }

  // Deduplicate by filter ID
  const map = new Map<string, DynamicAttributeFilter>();
  for (const f of filters) {
    if (!map.has(f.id)) map.set(f.id, f);
  }

  return Array.from(map.values());
}

/**
 * Evaluates whether a Store matches the current ActiveFilterState
 */
export function filterStoreByState(store: Store, state: ActiveFilterState): boolean {
  // Category check
  if (state.categoryId && state.categoryId !== "all" && state.categoryId !== "all-shops") {
    if (!isStoreInCategory(store.category, state.categoryId, store.rating)) {
      return false;
    }
  }

  // Open Now
  if (state.openNowOnly && !store.isOpen) {
    return false;
  }

  // Min Rating
  if (state.minRating != null && store.rating < state.minRating) {
    return false;
  }

  // Max Distance
  if (
    state.maxDistanceKm != null &&
    (store.distanceKm == null ||
      !Number.isFinite(store.distanceKm) ||
      store.distanceKm < 0 ||
      store.distanceKm > state.maxDistanceKm)
  ) {
    return false;
  }

  // Max ETA
  if (state.maxEtaMin != null && store.etaMin > state.maxEtaMin) {
    return false;
  }

  // Search Query
  if (state.searchQuery && state.searchQuery.trim().length > 0) {
    const q = state.searchQuery.toLowerCase().trim();
    const nameMatch = store.name.toLowerCase().includes(q);
    const taglineMatch = store.tagline?.toLowerCase().includes(q);
    const catMatch = store.category.toLowerCase().includes(q);
    if (!nameMatch && !taglineMatch && !catMatch) {
      return false;
    }
  }

  return true;
}

/**
 * Helper to normalize string for comparison
 */
function normalizeString(val: unknown): string {
  if (val == null) return "";
  return String(val).trim().toLowerCase();
}

/**
 * Accurately matches product attribute value with filter value.
 * Avoids false positive substring matches (e.g., size 'L' matching 'XL' or 'XXL').
 */
export function attributeValueMatches(pv: unknown, sv: unknown): boolean {
  const normPv = normalizeString(pv);
  const normSv = normalizeString(sv);
  if (!normPv || !normSv) return false;
  if (normPv === normSv) return true;

  // Short tokens (e.g. "S", "M", "L", "XL", "28", "32", "42", "4GB") must match whole tokens
  if (normPv.length <= 3 || normSv.length <= 3) {
    const pvTokens = normPv.split(/[^a-z0-9]+/);
    const svTokens = normSv.split(/[^a-z0-9]+/);
    return pvTokens.includes(normSv) || svTokens.includes(normPv);
  }

  // Multi-word attributes like "Full Sleeve" or "100% Cotton"
  const pvTokens = normPv.split(/[^a-z0-9]+/);
  const svTokens = normSv.split(/[^a-z0-9]+/);
  return (
    pvTokens.includes(normSv) ||
    svTokens.includes(normPv) ||
    (normPv.length > 5 && normSv.length > 5 && (normPv.includes(normSv) || normSv.includes(normPv)))
  );
}

/**
 * Helper to extract values for an attribute key from a product
 */
export function extractProductAttributeValues(
  product: Record<string, any>,
  attributeKey: string,
): string[] {
  const normKey = attributeKey.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Check direct key, attributes[key], specifications[key]
  const candidates = [
    product[attributeKey],
    product.attributes?.[attributeKey],
    product.specifications?.[attributeKey],
  ];

  // Try matching by normalized key if direct lookup yields nothing
  if (candidates.every((c) => c == null) && product.attributes && typeof product.attributes === "object") {
    for (const [k, v] of Object.entries(product.attributes)) {
      if (k.toLowerCase().replace(/[^a-z0-9]/g, "") === normKey) {
        candidates.push(v);
        break;
      }
    }
  }

  const result: string[] = [];
  for (const raw of candidates) {
    if (raw == null) continue;
    if (Array.isArray(raw)) {
      for (const item of raw) {
        if (item != null) {
          const s = String(item).trim();
          if (s) result.push(s);
        }
      }
    } else if (typeof raw === "string") {
      const parts = raw.includes(",") ? raw.split(",").map((s) => s.trim()) : [raw.trim()];
      for (const p of parts) {
        if (p) result.push(p);
      }
    } else if (typeof raw === "number" || typeof raw === "boolean") {
      result.push(String(raw));
    }
  }

  // Inferred attributes from product name for seeded or demo items
  if (result.length === 0 && product.name) {
    const nameLower = product.name.toLowerCase();
    if (normKey === "gender") {
      if (nameLower.includes("men") && !nameLower.includes("women")) result.push("Men");
      else if (nameLower.includes("women")) result.push("Women");
      else if (nameLower.includes("kid") || nameLower.includes("baby")) result.push("Kids");
    } else if (normKey === "dresstype") {
      if (nameLower.includes("fit & flare") || nameLower.includes("flare")) result.push("Fit & Flare");
      else if (nameLower.includes("a-line")) result.push("A-Line");
      else if (nameLower.includes("maxi")) result.push("Maxi Dress");
      else if (nameLower.includes("bodycon")) result.push("Bodycon");
      else if (nameLower.includes("shift")) result.push("Shift Dress");
    } else if (normKey === "pattern") {
      if (nameLower.includes("check")) result.push("Checked");
      else if (nameLower.includes("stripe")) result.push("Striped");
      else if (nameLower.includes("print")) result.push("Printed");
      else if (nameLower.includes("floral")) result.push("Floral");
      else if (nameLower.includes("solid")) result.push("Solid");
      else if (nameLower.includes("embroider")) result.push("Embroidered");
    } else if (normKey === "fabric") {
      if (nameLower.includes("cotton")) result.push("Cotton");
      else if (nameLower.includes("silk")) result.push("Silk");
      else if (nameLower.includes("linen")) result.push("Linen");
      else if (nameLower.includes("denim")) result.push("Denim");
      else if (nameLower.includes("rayon")) result.push("Rayon");
    } else if (normKey === "fit") {
      if (nameLower.includes("slim")) result.push("Slim");
      else if (nameLower.includes("regular")) result.push("Regular");
      else if (nameLower.includes("oversized") || nameLower.includes("boxy")) result.push("Oversized");
      else if (nameLower.includes("relaxed")) result.push("Relaxed");
    } else if (normKey === "sleevetype" || normKey === "sleeve") {
      if (nameLower.includes("sleeveless")) result.push("Sleeveless");
      else if (nameLower.includes("full sleeve")) result.push("Full Sleeve");
      else if (nameLower.includes("half sleeve")) result.push("Half Sleeve");
    }
  }

  return [...new Set(result)];
}

/**
 * Evaluates whether a Product matches the current ActiveFilterState (legacy signature)
 */
export function filterProductByState(
  product: Product & Record<string, any>,
  state: ActiveFilterState,
  excludeAttributeKey?: string,
): boolean {
  // Category check
  if (state.categoryId && state.categoryId !== "all") {
    const catLower = state.categoryId.toLowerCase();
    const prodCatLower = (product.category || "").toLowerCase();
    if (!prodCatLower.includes(catLower) && state.categoryId !== "all-shops") {
      // Allow soft match
    }
  }

  // Price Range
  if (state.priceRange) {
    const [minPrice, maxPrice] = state.priceRange;
    const price = Number(product.selling_price ?? product.price ?? 0);
    if (price < minPrice || price > maxPrice) {
      return false;
    }
  }

  // Selected Brands
  if (state.selectedBrands && state.selectedBrands.length > 0 && excludeAttributeKey !== "brand") {
    const brandVal = normalizeString(product.brand || product.brand_name || "");
    const matchesBrand = state.selectedBrands.some((b) => brandVal.includes(normalizeString(b)));
    if (!matchesBrand) return false;
  }

  // Dynamic Attribute Filters evaluation (OR within key, AND across keys)
  for (const [filterId, selectedValues] of Object.entries(state.selectedAttributes)) {
    if (!selectedValues || selectedValues.length === 0) continue;
    if (filterId === excludeAttributeKey) continue;

    const values = extractProductAttributeValues(product, filterId);
    if (values.length === 0) return false;

    const matchesOne = selectedValues.some((sv) =>
      values.some((pv) => attributeValueMatches(pv, sv)),
    );

    if (!matchesOne) return false;
  }

  return true;
}

/**
 * Calculates context-aware facet counts for all options of a dynamic attribute filter (legacy signature).
 */
export function calculateContextAwareFacets(
  products: Array<Product & Record<string, any>>,
  filterDef: DynamicAttributeFilter,
  state: ActiveFilterState,
): DynamicAttributeFilter {
  const optionsWithCounts = filterDef.options.map((opt) => {
    const count = products.filter((prod) => {
      // Check if product satisfies all OTHER active filters
      if (!filterProductByState(prod, state, filterDef.id)) return false;

      // Check if product matches this specific option value
      const values = extractProductAttributeValues(prod, filterDef.id);
      return values.some((v) => attributeValueMatches(v, opt.value));
    }).length;

    return { ...opt, count };
  });

  return {
    ...filterDef,
    options: optionsWithCounts,
  };
}

/**
 * Core Production Filter Evaluator for FilteredProduct against ProductFilterState
 * Supports optional `excludeKey` for context-aware facet calculation.
 */
export function evaluateProductMatches(
  product: FilteredProduct,
  state: ProductFilterState,
  excludeKey?: string,
): boolean {
  // 1. Distance filter
  if (state.maxDistanceKm !== undefined && state.maxDistanceKm > 0) {
    if (product.distance_km != null && product.distance_km > state.maxDistanceKm) {
      return false;
    }
  }

  // 2. Open Now
  if (state.openNow || state.openNowOnly) {
    if (product.is_open === false) return false;
  }

  // 3. In Stock
  if (state.inStock || state.inStockOnly) {
    if (product.stock <= 0) return false;
  }

  // 4. Rating filter
  if (state.minRating !== undefined && state.minRating > 0) {
    if (Number(product.rating || 0) < state.minRating) return false;
  }

  // 5. Price filter (INR)
  const price = Number(product.discount_price ?? product.selling_price ?? 0);
  if (excludeKey !== "price") {
    if (state.minPrice !== undefined && state.minPrice > 0 && price < state.minPrice) {
      return false;
    }
    if (state.maxPrice !== undefined && state.maxPrice > 0 && price > state.maxPrice) {
      return false;
    }
  }

  // 6. Shop IDs filter
  if (state.shopIds && state.shopIds.length > 0) {
    if (!state.shopIds.includes(product.seller_id)) return false;
  }

  // 7. Brands filter (OR within brands)
  if (excludeKey !== "brand" && state.brands && state.brands.length > 0) {
    const prodBrand = normalizeString(product.brand_name || product.brand || "");
    const matchesBrand = state.brands.some((b) => {
      const normB = normalizeString(b);
      return prodBrand.includes(normB) || normB.includes(prodBrand);
    });
    if (!matchesBrand) return false;
  }

  // 8. Category & Subcategory matching
  if (state.category && state.category !== "all" && state.category !== "all-shops") {
    const normStateCat = normalizeString(state.category).replace(/[^a-z0-9]/g, "");
    const normProdCat = normalizeString(product.category).replace(/[^a-z0-9]/g, "");
    const matchesCat =
      normProdCat.includes(normStateCat) ||
      normStateCat.includes(normProdCat) ||
      (normStateCat.includes("fashion") && (normProdCat.includes("fashion") || normProdCat.includes("boutique"))) ||
      (normStateCat.includes("boutique") && (normProdCat.includes("boutique") || normProdCat.includes("fashion"))) ||
      (normStateCat.includes("grocery") && normProdCat.includes("grocery"));
    if (!matchesCat) return false;
  }

  // Subcategory (e.g. "shirts", "dresses", "mens_wear")
  if (state.subcategory && state.subcategory.trim()) {
    const normSub = normalizeString(state.subcategory).replace(/[^a-z0-9]/g, "");
    const textToMatch = normalizeString(
      `${product.name} ${product.category} ${product.description} ${JSON.stringify(product.attributes || {})}`,
    );

    if (normSub.includes("shirt") && !normSub.includes("tshirt")) {
      const isShirt =
        textToMatch.includes("shirt") && !textToMatch.includes("t-shirt") && !textToMatch.includes("tshirt");
      if (!isShirt) return false;
    } else if (normSub.includes("dress")) {
      const isDress = textToMatch.includes("dress") || textToMatch.includes("gown");
      if (!isDress) return false;
    } else if (normSub.includes("tshirt") || normSub.includes("t-shirt")) {
      const isTee = textToMatch.includes("tshirt") || textToMatch.includes("t-shirt") || textToMatch.includes("tee");
      if (!isTee) return false;
    } else if (!textToMatch.includes(normSub)) {
      return false;
    }
  }

  // Product Type (e.g. "shirts", "dresses", "tshirts", "jeans")
  if (state.productType && state.productType.trim()) {
    const normPt = normalizeString(state.productType).replace(/[^a-z0-9]/g, "");
    const textToMatch = normalizeString(
      `${product.name} ${product.category} ${JSON.stringify(product.attributes || {})}`,
    );
    if (!textToMatch.includes(normPt)) return false;
  }

  // 9. Query text search (case-insensitive stemmed tokens)
  if (state.query && state.query.trim()) {
    const qTokens = state.query
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);

    const fullProductText = normalizeString(
      `${product.name} ${product.brand || ""} ${product.brand_name || ""} ${product.category || ""} ${product.shop_name || ""} ${product.description || ""} ${JSON.stringify(product.attributes || {})}`,
    );

    const matchesQuery = qTokens.every((token) => {
      const stemmed = token.endsWith("s") && token.length > 3 ? token.slice(0, -1) : token;
      return fullProductText.includes(token) || fullProductText.includes(stemmed);
    });

    if (!matchesQuery) return false;
  }

  // 10. Dynamic Attributes: AND across distinct keys, OR within same key
  if (state.attributes && typeof state.attributes === "object") {
    for (const [attrKey, selectedVals] of Object.entries(state.attributes)) {
      if (!selectedVals || selectedVals.length === 0) continue;
      if (attrKey === excludeKey) continue; // Exclude target attribute during facet counting

      const prodValues = extractProductAttributeValues(product, attrKey);
      if (prodValues.length === 0) return false;

      const matchesAttr = selectedVals.some((sv) =>
        prodValues.some((pv) => attributeValueMatches(pv, sv)),
      );

      if (!matchesAttr) return false;
    }
  }

  return true;
}

/**
 * Calculates dynamic context-aware facets from the active candidate products in scope.
 * For each filter key, counts matching products while excluding that key itself from evaluation,
 * so active selections do not prematurely hide or zero out other options.
 */
export function computeDynamicFacets(
  allProducts: FilteredProduct[],
  filterDefs: FilterDefinition[],
  state: ProductFilterState,
): FacetResult {
  // 1. Min / Max Price in INR among products matching category & query
  let minPrice = 10000;
  let maxPrice = 0;
  let matchingCount = 0;

  for (const prod of allProducts) {
    if (evaluateProductMatches(prod, state, "price")) {
      const p = Number(prod.discount_price ?? prod.selling_price ?? 0);
      if (p > 0) {
        if (p < minPrice) minPrice = p;
        if (p > maxPrice) maxPrice = p;
        matchingCount++;
      }
    }
  }

  if (minPrice === 10000) minPrice = 0;
  if (maxPrice === 0) maxPrice = 5000;

  // Round bounds to nice increments
  minPrice = Math.floor(minPrice / 50) * 50;
  maxPrice = Math.ceil(maxPrice / 100) * 100;

  // 2. Brand Facets with Counts
  const brandCountMap = new Map<string, number>();
  for (const prod of allProducts) {
    if (evaluateProductMatches(prod, state, "brand")) {
      const b = prod.brand_name || prod.brand;
      if (b && b.trim()) {
        const trimmed = b.trim();
        brandCountMap.set(trimmed, (brandCountMap.get(trimmed) || 0) + 1);
      }
    }
  }

  const brand_facets: FacetCountItem[] = Array.from(brandCountMap.entries())
    .map(([brand, count]) => ({ value: brand, label: brand, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  // 3. Dynamic Attribute Facets with Counts
  const attributesFacets: Record<string, FacetCountItem[]> = {};

  for (const def of filterDefs) {
    if (def.is_universal && (def.key === "brand" || def.key === "price" || def.key === "rating")) {
      continue;
    }

    const key = def.key;
    const optionCounts = new Map<string, number>();

    // Seed options from filter definition
    for (const opt of def.options || []) {
      optionCounts.set(opt.value, 0);
    }

    // Count matching products (excluding this attribute key)
    for (const prod of allProducts) {
      if (evaluateProductMatches(prod, state, key)) {
        const prodVals = extractProductAttributeValues(prod, key);
        for (const pv of prodVals) {
          // Find matching predefined option or record as discovered option
          let matchedPredefined = false;
          for (const optKey of optionCounts.keys()) {
            if (attributeValueMatches(optKey, pv)) {
              optionCounts.set(optKey, (optionCounts.get(optKey) || 0) + 1);
              matchedPredefined = true;
              break;
            }
          }
          if (!matchedPredefined && pv) {
            optionCounts.set(pv, (optionCounts.get(pv) || 0) + 1);
          }
        }
      }
    }

    // Format facet items
    attributesFacets[key] = Array.from(optionCounts.entries()).map(([val, count]) => {
      const defOpt = def.options?.find((o) => normalizeString(o.value) === normalizeString(val));
      return {
        value: val,
        label: defOpt?.label || val,
        count,
      };
    });
  }

  return {
    min_price: minPrice,
    max_price: maxPrice,
    total_products: matchingCount,
    brand_facets,
    shop_facets: [],
    attributes: attributesFacets,
  };
}
