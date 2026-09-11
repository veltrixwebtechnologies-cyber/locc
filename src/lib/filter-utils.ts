import { type ProductFilterState } from "./filter-types";

export const KNOWN_URL_PARAMS = new Set([
  "category",
  "subcategory",
  "sub_category",
  "productType",
  "product_type",
  "q",
  "minPrice",
  "min_price",
  "maxPrice",
  "max_price",
  "rating",
  "min_rating",
  "inStock",
  "in_stock",
  "onSale",
  "on_sale",
  "openNow",
  "open_now",
  "brand",
  "shop",
  "sort",
  "page",
]);

function cleanString(val: unknown): string | undefined {
  if (val === undefined || val === null) return undefined;
  const str = String(val).trim().replace(/^["']|["']$/g, "").trim();
  return str.length > 0 ? str : undefined;
}

export function parseFilterParams(searchParams: Record<string, unknown>): ProductFilterState {
  const brandRaw = cleanString(searchParams.brand);
  const brands = brandRaw ? brandRaw.split(",").map((b) => b.trim()).filter(Boolean) : [];

  const shopRaw = cleanString(searchParams.shop);
  const shopIds = shopRaw ? shopRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  
  const attributes: Record<string, string[]> = {};

  for (const [key, rawVal] of Object.entries(searchParams)) {
    const cleanedKey = key.trim().replace(/^["']|["']$/g, "");
    if (!KNOWN_URL_PARAMS.has(cleanedKey) && rawVal !== undefined && rawVal !== null) {
      const valStr = cleanString(rawVal);
      if (valStr) {
        attributes[cleanedKey] = valStr.split(",").map((v) => v.trim()).filter(Boolean);
      }
    }
  }

  const category = cleanString(searchParams.category);
  const subcategory = cleanString(searchParams.subcategory) || cleanString(searchParams.sub_category);
  const productType = cleanString(searchParams.productType) || cleanString(searchParams.product_type);
  const query = cleanString(searchParams.q);

  const minPriceStr = cleanString(searchParams.minPrice) || cleanString(searchParams.min_price);
  const minPrice = minPriceStr !== undefined && !isNaN(Number(minPriceStr)) ? Number(minPriceStr) : undefined;

  const maxPriceStr = cleanString(searchParams.maxPrice) || cleanString(searchParams.max_price);
  const maxPrice = maxPriceStr !== undefined && !isNaN(Number(maxPriceStr)) ? Number(maxPriceStr) : undefined;

  const ratingStr = cleanString(searchParams.rating) || cleanString(searchParams.min_rating);
  const minRating = ratingStr !== undefined && !isNaN(Number(ratingStr)) ? Number(ratingStr) : undefined;

  const inStockStr = cleanString(searchParams.inStock) || cleanString(searchParams.in_stock);
  const inStock = inStockStr === "true";

  const onSaleStr = cleanString(searchParams.onSale) || cleanString(searchParams.on_sale);
  const onSale = onSaleStr === "true";

  const openNowStr = cleanString(searchParams.openNow) || cleanString(searchParams.open_now);
  const openNow = openNowStr === "true";

  const sortBy = cleanString(searchParams.sort) || "relevance";
  const pageStr = cleanString(searchParams.page);
  const page = pageStr && !isNaN(Number(pageStr)) ? Number(pageStr) : 1;

  return {
    category,
    subcategory,
    productType,
    query,
    minPrice,
    maxPrice,
    minRating,
    inStock,
    onSale,
    openNow,
    brands,
    shopIds,
    attributes,
    sortBy: typeof searchParams.sort === "string" ? searchParams.sort : "relevance",
    page: typeof searchParams.page === "string" ? Number(searchParams.page) : typeof searchParams.page === "number" ? searchParams.page : 1,
  };
}

export function serializeFilterParams(state: ProductFilterState): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};

  if (state.category && state.category !== "all" && state.category !== "all-shops") {
    result.category = state.category;
  }
  if (state.subcategory) result.subcategory = state.subcategory;
  if (state.productType) result.productType = state.productType;
  if (state.query && state.query.trim()) result.q = state.query.trim();
  if (state.minPrice !== undefined && state.minPrice > 0) result.minPrice = String(state.minPrice);
  if (state.maxPrice !== undefined && state.maxPrice > 0) result.maxPrice = String(state.maxPrice);
  if (state.minRating !== undefined && state.minRating > 0) result.rating = String(state.minRating);
  if (state.inStock) result.inStock = "true";
  if (state.onSale) result.onSale = "true";
  if (state.openNow) result.openNow = "true";

  if (state.brands && state.brands.length > 0) {
    result.brand = state.brands.join(",");
  }
  if (state.shopIds && state.shopIds.length > 0) {
    result.shop = state.shopIds.join(",");
  }

  for (const [attrKey, values] of Object.entries(state.attributes)) {
    if (values && values.length > 0) {
      result[attrKey] = values.join(",");
    }
  }

  if (state.sortBy && state.sortBy !== "relevance") {
    result.sort = state.sortBy;
  }
  if (state.page && state.page > 1) {
    result.page = String(state.page);
  }

  return result;
}
