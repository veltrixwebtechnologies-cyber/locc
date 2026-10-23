import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateProductMatches,
  computeDynamicFacets,
  attributeValueMatches,
} from "../src/lib/dynamic-filter-engine.ts";
import {
  getCategoryAwareFilterDefinitions,
  reconcileAttributesOnCategoryChange,
} from "../src/lib/category-filter-registry.ts";
import {
  parseFilterParams,
  serializeFilterParams,
  reconcileFilterStateOnCategoryChange,
} from "../src/lib/filter-utils.ts";

const SAMPLE_CLOTHING_CATALOG = [
  {
    id: "shirt-1",
    seller_id: "shop-trendz",
    name: "Snitch Men Regular Fit Linen Spread Collar Casual Shirt",
    brand: "Snitch",
    brand_name: "Snitch",
    category: "Fashion & Clothing",
    selling_price: 1199,
    discount_price: 1199,
    stock: 20,
    distance_km: 1.2,
    rating: 4.8,
    is_open: true,
    total_count: 0,
    attributes: {
      color: ["Navy Blue"],
      size: ["M", "L", "40"],
      sleeve_type: ["Full Sleeve"],
      fit: ["Regular"],
      fabric: ["Linen"],
      collar: ["Spread Collar"],
      pattern: ["Solid"],
    },
  },
  {
    id: "shirt-2",
    seller_id: "shop-trendz",
    name: "Campus Sutra Men Slim Fit Checked Casual Shirt",
    brand: "Campus Sutra",
    brand_name: "Campus Sutra",
    category: "Fashion & Clothing",
    selling_price: 799,
    discount_price: 799,
    stock: 15,
    distance_km: 1.5,
    rating: 4.5,
    is_open: true,
    total_count: 0,
    attributes: {
      color: ["Black", "White"],
      size: ["S", "M"],
      sleeve_type: ["Half Sleeve"],
      fit: ["Slim"],
      fabric: ["Cotton"],
      collar: ["Mandarin Collar"],
      pattern: ["Checked"],
    },
  },
  {
    id: "dress-1",
    seller_id: "shop-boutique",
    name: "Forever New Women Floral Printed Fit & Flare Midi Dress",
    brand: "Forever New",
    brand_name: "Forever New",
    category: "Fashion & Clothing",
    selling_price: 3499,
    discount_price: 2999,
    stock: 8,
    distance_km: 2.1,
    rating: 4.9,
    is_open: true,
    total_count: 0,
    attributes: {
      color: ["Pink"],
      size: ["S", "M", "L"],
      dress_type: ["Fit & Flare"],
      length: ["Midi"],
      fabric: ["Georgette"],
      pattern: ["Floral"],
      occasion: ["Party"],
    },
  },
  {
    id: "dress-2",
    seller_id: "shop-boutique",
    name: "Zara Women Solid A-Line Cotton Maxi Dress",
    brand: "Zara",
    brand_name: "Zara",
    category: "Fashion & Clothing",
    selling_price: 2490,
    discount_price: 2490,
    stock: 12,
    distance_km: 2.4,
    rating: 4.7,
    is_open: true,
    total_count: 0,
    attributes: {
      color: ["Black"],
      size: ["M", "L"],
      dress_type: ["A-Line"],
      length: ["Maxi"],
      fabric: ["Cotton"],
      pattern: ["Solid"],
      occasion: ["Casual"],
    },
  },
  {
    id: "grocery-1",
    seller_id: "shop-kirana",
    name: "Aashirvaad Select Sharbati Whole Wheat Atta 5kg",
    brand: "Aashirvaad",
    brand_name: "Aashirvaad",
    category: "Grocery & Kitchen",
    selling_price: 340,
    discount_price: 320,
    stock: 50,
    distance_km: 0.9,
    rating: 4.8,
    is_open: true,
    total_count: 0,
    attributes: {
      pack_size: ["5 kg"],
      food_preference: ["Vegetarian"],
      organic: ["No"],
    },
  },
];

test("attributeValueMatches accurately matches whole tokens without false substring matches", () => {
  // Size "L" must NOT match "XL" or "XXL"
  assert.equal(attributeValueMatches("XL", "L"), false);
  assert.equal(attributeValueMatches("XXL", "L"), false);
  assert.equal(attributeValueMatches("L", "L"), true);
  assert.equal(attributeValueMatches("M", "M"), true);
  assert.equal(attributeValueMatches("S", "XS"), false);

  // Multi-word attributes
  assert.equal(attributeValueMatches("Full Sleeve", "Full Sleeve"), true);
  assert.equal(attributeValueMatches("100% Pure Cotton", "Cotton"), true);
});

test("Shirts category filters correctly evaluate fit, sleeve, fabric, size, and price", () => {
  const shirtFilterState = {
    category: "Fashion & Clothing",
    subcategory: "shirts",
    minPrice: 500,
    maxPrice: 1500,
    brands: [],
    shopIds: [],
    shopTypes: [],
    attributes: {
      sleeve_type: ["Full Sleeve"],
      fit: ["Regular"],
    },
    sortBy: "relevance",
    page: 1,
  };

  const matches = SAMPLE_CLOTHING_CATALOG.filter((p) =>
    evaluateProductMatches(p, shirtFilterState),
  );

  assert.equal(matches.length, 1);
  assert.equal(matches[0].id, "shirt-1");
  assert.equal(matches[0].brand, "Snitch");
});

test("Dresses category filters evaluate dress_type, length, and occasion", () => {
  const dressFilterState = {
    category: "Fashion & Clothing",
    subcategory: "dresses",
    minPrice: 2000,
    maxPrice: 4000,
    brands: [],
    shopIds: [],
    shopTypes: [],
    attributes: {
      dress_type: ["Fit & Flare"],
      length: ["Midi"],
    },
    sortBy: "relevance",
    page: 1,
  };

  const matches = SAMPLE_CLOTHING_CATALOG.filter((p) =>
    evaluateProductMatches(p, dressFilterState),
  );

  assert.equal(matches.length, 1);
  assert.equal(matches[0].id, "dress-1");
  assert.equal(matches[0].attributes.pattern[0], "Floral");
});

test("Context-aware facet calculation excludes active key to prevent 0 counts for sibling options", () => {
  const filterDefs = getCategoryAwareFilterDefinitions("fashion", "shirts");

  const activeState = {
    category: "Fashion & Clothing",
    subcategory: "shirts",
    brands: [],
    shopIds: [],
    shopTypes: [],
    attributes: {
      color: ["Navy Blue"],
    },
    sortBy: "relevance",
    page: 1,
  };

  const facets = computeDynamicFacets(SAMPLE_CLOTHING_CATALOG, filterDefs, activeState);

  // When Navy Blue is selected, Black and White options under color must NOT drop to 0!
  const colorFacets = facets.attributes["color"] || [];
  const navyOption = colorFacets.find((c) => c.value.toLowerCase().includes("navy"));
  const blackOption = colorFacets.find((c) => c.value.toLowerCase() === "black");

  assert.ok(navyOption, "Navy Blue facet option should exist");
  assert.equal(navyOption.count, 1);
  assert.ok(blackOption, "Black facet option should exist");
  assert.equal(blackOption.count, 1); // shirt-2 is black
});

test("Category transition gracefully strips incompatible attributes while preserving universal filters", () => {
  const currentFashionState = {
    category: "fashion",
    subcategory: "dresses",
    minPrice: 500,
    maxPrice: 2000,
    minRating: 4,
    brands: ["Zara"],
    shopIds: [],
    shopTypes: [],
    attributes: {
      dress_type: ["A-Line"],
      length: ["Maxi"],
      color: ["Black"],
    },
    sortBy: "price_asc",
    page: 2,
  };

  // Switch to Grocery
  const reconciled = reconcileFilterStateOnCategoryChange(
    currentFashionState,
    "grocery",
    undefined,
  );

  // Incompatible dress attributes must be removed
  assert.equal(reconciled.attributes.dress_type, undefined);
  assert.equal(reconciled.attributes.length, undefined);

  // Universal filters must be retained
  assert.equal(reconciled.category, "grocery");
  assert.equal(reconciled.minPrice, 500);
  assert.equal(reconciled.maxPrice, 2000);
  assert.equal(reconciled.minRating, 4);
  assert.equal(reconciled.sortBy, "price_asc");
  assert.equal(reconciled.page, 1); // Reset to page 1
});

test("URL parameters round-trip serialization maintains category-specific attributes", () => {
  const state = {
    category: "fashion",
    subcategory: "shirts",
    minPrice: 800,
    maxPrice: 2500,
    brands: ["Snitch", "Campus Sutra"],
    shopIds: [],
    shopTypes: [],
    attributes: {
      sleeve_type: ["Full Sleeve"],
      fit: ["Regular", "Slim"],
      color: ["Navy Blue", "Black"],
    },
    sortBy: "price_asc",
    page: 1,
  };

  const serialized = serializeFilterParams(state);
  assert.equal(serialized.category, "fashion");
  assert.equal(serialized.subcategory, "shirts");
  assert.equal(serialized.minPrice, "800");
  assert.equal(serialized.maxPrice, "2500");
  assert.equal(serialized.brand, "Snitch,Campus Sutra");
  assert.equal(serialized.sleeve_type, "Full Sleeve");
  assert.equal(serialized.fit, "Regular,Slim");
  assert.equal(serialized.color, "Navy Blue,Black");

  const parsed = parseFilterParams(serialized);
  assert.equal(parsed.category, "fashion");
  assert.equal(parsed.subcategory, "shirts");
  assert.equal(parsed.minPrice, 800);
  assert.equal(parsed.maxPrice, 2500);
  assert.deepEqual(parsed.brands, ["Snitch", "Campus Sutra"]);
  assert.deepEqual(parsed.attributes.sleeve_type, ["Full Sleeve"]);
  assert.deepEqual(parsed.attributes.fit, ["Regular", "Slim"]);
  assert.deepEqual(parsed.attributes.color, ["Navy Blue", "Black"]);
});
