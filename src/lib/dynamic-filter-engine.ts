/**
 * LocalShoree Dynamic Filter Execution Engine
 *
 * Provides evaluation and filtering of Stores and Products against both:
 * 1. Universal Filters (Price, Distance, Rating, Open Now, Delivery Time, Brand)
 * 2. Dynamic Category & Product Attribute Filters (Size, Color, Fabric, RAM, Medicine Form, Egg/Eggless, etc.)
 */

import {
  getCategoryTaxonomy,
  UNIVERSAL_FILTERS,
  type DynamicAttributeFilter,
  type SubcategoryTaxonomy,
  type ProductTypeTaxonomy,
} from "./category-taxonomy";
import type { Store, Product } from "./mock-data";
import { isStoreInCategory } from "./shop-categories";

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
  selectedAttributes: Record<string, string[]>; // e.g. { "apparel_size": ["M"], "fabric_material": ["cotton"] }
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
  subcategoryId?: string | null
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
  productTypeId?: string | null
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
  if (state.maxDistanceKm != null && store.distanceKm > state.maxDistanceKm) {
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
 * Evaluates whether a Product matches the current ActiveFilterState (with option to exclude a target attribute key)
 */
export function filterProductByState(
  product: Product & Record<string, any>,
  state: ActiveFilterState,
  excludeAttributeKey?: string
): boolean {
  // Category check
  if (state.categoryId && state.categoryId !== "all") {
    const catLower = state.categoryId.toLowerCase();
    const prodCatLower = (product.category || "").toLowerCase();
    if (!prodCatLower.includes(catLower) && state.categoryId !== "all-shops") {
      // Allow fallback match
    }
  }

  // Price Range
  if (state.priceRange) {
    const [minPrice, maxPrice] = state.priceRange;
    if (product.price < minPrice || product.price > maxPrice) {
      return false;
    }
  }

  // Selected Brands
  if (state.selectedBrands && state.selectedBrands.length > 0 && excludeAttributeKey !== "brand") {
    const brandVal = (product.brand || product.brand_name || "").toLowerCase();
    const matchesBrand = state.selectedBrands.some((b) => brandVal.includes(b.toLowerCase()));
    if (!matchesBrand) return false;
  }

  // Dynamic Attribute Filters evaluation (OR within key, AND across keys)
  for (const [filterId, selectedValues] of Object.entries(state.selectedAttributes)) {
    if (!selectedValues || selectedValues.length === 0) continue;
    if (filterId === excludeAttributeKey) continue; // Exclude target attribute key for context-aware counting

    const val = product[filterId] || product.attributes?.[filterId];
    if (val == null) {
      return false;
    } else if (Array.isArray(val)) {
      const match = selectedValues.some((sv) => val.map((v) => String(v).toLowerCase()).includes(sv.toLowerCase()));
      if (!match) return false;
    } else {
      const valStr = String(val).toLowerCase();
      const match = selectedValues.some((sv) => valStr === sv.toLowerCase() || valStr.split(",").map((s) => s.trim().toLowerCase()).includes(sv.toLowerCase()));
      if (!match) return false;
    }
  }

  return true;
}

/**
 * Calculates context-aware facet counts for all options of a dynamic attribute filter.
 * Context-aware rule: when counting options for key K, apply all active filters EXCEPT key K itself.
 */
export function calculateContextAwareFacets(
  products: Array<Product & Record<string, any>>,
  filterDef: DynamicAttributeFilter,
  state: ActiveFilterState
): DynamicAttributeFilter {
  const optionsWithCounts = filterDef.options.map((opt) => {
    const count = products.filter((prod) => {
      // Check if product satisfies all OTHER active filters
      if (!filterProductByState(prod, state, filterDef.id)) return false;

      // Check if product matches this specific option value
      const val = prod[filterDef.id] || prod.attributes?.[filterDef.id];
      if (val == null) {
        return false;
      } else if (Array.isArray(val)) {
        return val.some((v) => String(v).toLowerCase() === opt.value.toLowerCase());
      } else {
        const valStr = String(val).toLowerCase();
        return valStr === opt.value.toLowerCase() || valStr.split(",").map((s) => s.trim().toLowerCase()).includes(opt.value.toLowerCase());
      }
    }).length;

    return { ...opt, count };
  });

  return {
    ...filterDef,
    options: optionsWithCounts,
  };
}

