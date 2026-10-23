import type { FilterDefinition, FilterOption, FilterType } from "./filter-types.ts";

/**
 * Curated color hex codes for fashion and beauty filters
 */
export const COLOR_HEX_MAP: Record<string, string> = {
  black: "#111827",
  white: "#F9FAFB",
  blue: "#2563EB",
  "navy blue": "#1E3A8A",
  navy: "#1E3A8A",
  red: "#DC2626",
  green: "#16A34A",
  "olive green": "#4D7C0F",
  olive: "#4D7C0F",
  grey: "#6B7280",
  gray: "#6B7280",
  cream: "#FEF3C7",
  beige: "#D4B996",
  yellow: "#EAB308",
  pink: "#EC4899",
  maroon: "#881337",
  purple: "#7E22CE",
  peach: "#FDBA74",
  orange: "#EA580C",
  gold: "#CA8A04",
  silver: "#94A3B8",
  brown: "#78350F",
  multicolor: "linear-gradient(135deg, #ef4444 0%, #3b82f6 50%, #10b981 100%)",
  "cream/green": "linear-gradient(135deg, #fef3c7 50%, #16a34a 50%)",
  "grey/brown": "linear-gradient(135deg, #6b7280 50%, #78350f 50%)",
};

export function getColorHex(colorName: string): string {
  const norm = (colorName || "").trim().toLowerCase();
  return COLOR_HEX_MAP[norm] || "#A1A1AA";
}

/**
 * Universal Filters present across all products
 */
export const UNIVERSAL_BRAND_DEF: FilterDefinition = {
  id: "brand",
  key: "brand",
  label: "Brand",
  type: "multi_select",
  is_universal: true,
  is_required: false,
  display_order: 1,
  options: [],
};

export const UNIVERSAL_PRICE_DEF: FilterDefinition = {
  id: "price",
  key: "price",
  label: "Price Range",
  type: "range",
  unit: "₹",
  is_universal: true,
  is_required: false,
  display_order: 2,
  options: [],
};

export const UNIVERSAL_RATING_DEF: FilterDefinition = {
  id: "rating",
  key: "rating",
  label: "Customer Rating",
  type: "rating",
  is_universal: true,
  is_required: false,
  display_order: 3,
  options: [
    { id: "r45", value: "4.5", label: "4.5★ & Above", display_order: 1 },
    { id: "r40", value: "4.0", label: "4.0★ & Above", display_order: 2 },
    { id: "r35", value: "3.5", label: "3.5★ & Above", display_order: 3 },
  ],
};

// ── 1. CLOTHING & FASHION FILTER DEFINITIONS ─────────────────────────────────

const GENDER_OPTIONS: FilterOption[] = [
  { id: "g_men", value: "Men", label: "Men", display_order: 1 },
  { id: "g_women", value: "Women", label: "Women", display_order: 2 },
  { id: "g_unisex", value: "Unisex", label: "Unisex", display_order: 3 },
  { id: "g_kids", value: "Kids", label: "Kids", display_order: 4 },
];

const SHIRT_SIZE_OPTIONS: FilterOption[] = [
  { id: "sz_s", value: "S", label: "S", display_order: 1 },
  { id: "sz_m", value: "M", label: "M", display_order: 2 },
  { id: "sz_l", value: "L", label: "L", display_order: 3 },
  { id: "sz_xl", value: "XL", label: "XL", display_order: 4 },
  { id: "sz_xxl", value: "XXL", label: "XXL", display_order: 5 },
  { id: "sz_38", value: "38", label: "38 (S)", display_order: 6 },
  { id: "sz_40", value: "40", label: "40 (M)", display_order: 7 },
  { id: "sz_42", value: "42", label: "42 (L)", display_order: 8 },
  { id: "sz_44", value: "44", label: "44 (XL)", display_order: 9 },
];

const DRESS_SIZE_OPTIONS: FilterOption[] = [
  { id: "ds_xs", value: "XS", label: "XS", display_order: 1 },
  { id: "ds_s", value: "S", label: "S", display_order: 2 },
  { id: "ds_m", value: "M", label: "M", display_order: 3 },
  { id: "ds_l", value: "L", label: "L", display_order: 4 },
  { id: "ds_xl", value: "XL", label: "XL", display_order: 5 },
  { id: "ds_xxl", value: "XXL", label: "XXL", display_order: 6 },
];

const BOTTOM_SIZE_OPTIONS: FilterOption[] = [
  { id: "bt_28", value: "28", label: "28", display_order: 1 },
  { id: "bt_30", value: "30", label: "30", display_order: 2 },
  { id: "bt_32", value: "32", label: "32", display_order: 3 },
  { id: "bt_34", value: "34", label: "34", display_order: 4 },
  { id: "bt_36", value: "36", label: "36", display_order: 5 },
  { id: "bt_38", value: "38", label: "38", display_order: 6 },
];

const GENERAL_COLOR_OPTIONS: FilterOption[] = [
  { id: "col_black", value: "Black", label: "Black", display_order: 1 },
  { id: "col_white", value: "White", label: "White", display_order: 2 },
  { id: "col_navy", value: "Navy Blue", label: "Navy Blue", display_order: 3 },
  { id: "col_blue", value: "Blue", label: "Blue", display_order: 4 },
  { id: "col_grey", value: "Grey", label: "Grey", display_order: 5 },
  { id: "col_red", value: "Red", label: "Red", display_order: 6 },
  { id: "col_green", value: "Green", label: "Green", display_order: 7 },
  { id: "col_cream", value: "Cream", label: "Cream / Beige", display_order: 8 },
  { id: "col_pink", value: "Pink", label: "Pink", display_order: 9 },
  { id: "col_yellow", value: "Yellow", label: "Yellow", display_order: 10 },
  { id: "col_maroon", value: "Maroon", label: "Maroon", display_order: 11 },
  { id: "col_multi", value: "Multicolor", label: "Multicolor", display_order: 12 },
];

const FIT_OPTIONS: FilterOption[] = [
  { id: "fit_slim", value: "Slim", label: "Slim Fit", display_order: 1 },
  { id: "fit_reg", value: "Regular", label: "Regular Fit", display_order: 2 },
  { id: "fit_relax", value: "Relaxed", label: "Relaxed Fit", display_order: 3 },
  { id: "fit_boxy", value: "Boxy", label: "Boxy Fit", display_order: 4 },
  { id: "fit_over", value: "Oversized", label: "Oversized Fit", display_order: 5 },
];

const SLEEVE_OPTIONS: FilterOption[] = [
  { id: "slv_full", value: "Full Sleeve", label: "Full Sleeve", display_order: 1 },
  { id: "slv_half", value: "Half Sleeve", label: "Half Sleeve", display_order: 2 },
  { id: "slv_short", value: "Short Sleeve", label: "Short Sleeve", display_order: 3 },
  { id: "slv_less", value: "Sleeveless", label: "Sleeveless", display_order: 4 },
  { id: "slv_34", value: "3/4 Sleeve", label: "3/4 Sleeve", display_order: 5 },
];

const PATTERN_OPTIONS: FilterOption[] = [
  { id: "pat_solid", value: "Solid", label: "Solid", display_order: 1 },
  { id: "pat_chk", value: "Checked", label: "Checked", display_order: 2 },
  { id: "pat_str", value: "Striped", label: "Striped", display_order: 3 },
  { id: "pat_flr", value: "Floral", label: "Floral", display_order: 4 },
  { id: "pat_prn", value: "Printed", label: "Printed", display_order: 5 },
  { id: "pat_emb", value: "Embroidered", label: "Embroidered", display_order: 6 },
  { id: "pat_abs", value: "Abstract", label: "Abstract", display_order: 7 },
];

const SHIRT_FABRIC_OPTIONS: FilterOption[] = [
  { id: "fab_cot", value: "Cotton", label: "100% Cotton", display_order: 1 },
  { id: "fab_lin", value: "Linen", label: "Pure Linen", display_order: 2 },
  { id: "fab_oxf", value: "Cotton Oxford", label: "Cotton Oxford", display_order: 3 },
  { id: "fab_vis", value: "Viscose", label: "Viscose", display_order: 4 },
  { id: "fab_den", value: "Denim", label: "Denim", display_order: 5 },
  { id: "fab_poly", value: "Polyester Blend", label: "Poly-Cotton Blend", display_order: 6 },
];

const SHIRT_COLLAR_OPTIONS: FilterOption[] = [
  { id: "col_sprd", value: "Spread Collar", label: "Spread Collar", display_order: 1 },
  { id: "col_mand", value: "Mandarin Collar", label: "Mandarin / Band", display_order: 2 },
  { id: "col_btnd", value: "Button-Down", label: "Button-Down Collar", display_order: 3 },
  { id: "col_cuba", value: "Cuban Collar", label: "Cuban / Resort Collar", display_order: 4 },
];

const DRESS_TYPE_OPTIONS: FilterOption[] = [
  { id: "dt_aline", value: "A-Line", label: "A-Line", display_order: 1 },
  { id: "dt_flare", value: "Fit & Flare", label: "Fit & Flare", display_order: 2 },
  { id: "dt_maxi", value: "Maxi Dress", label: "Maxi Dress", display_order: 3 },
  { id: "dt_body", value: "Bodycon", label: "Bodycon", display_order: 4 },
  { id: "dt_shift", value: "Shift Dress", label: "Shift Dress", display_order: 5 },
  { id: "dt_wrap", value: "Wrap Dress", label: "Wrap Dress", display_order: 6 },
  { id: "dt_tiered", value: "Tiered", label: "Tiered Dress", display_order: 7 },
];

const DRESS_LENGTH_OPTIONS: FilterOption[] = [
  { id: "len_mini", value: "Mini", label: "Mini / Above Knee", display_order: 1 },
  { id: "len_knee", value: "Knee Length", label: "Knee Length", display_order: 2 },
  { id: "len_midi", value: "Midi", label: "Midi / Calf Length", display_order: 3 },
  { id: "len_maxi", value: "Maxi", label: "Maxi / Floor Length", display_order: 4 },
];

const DRESS_FABRIC_OPTIONS: FilterOption[] = [
  { id: "df_cot", value: "Cotton", label: "Cotton", display_order: 1 },
  { id: "df_ray", value: "Rayon", label: "Rayon", display_order: 2 },
  { id: "df_geo", value: "Georgette", label: "Georgette", display_order: 3 },
  { id: "df_chif", value: "Chiffon", label: "Chiffon", display_order: 4 },
  { id: "df_silk", value: "Silk", label: "Silk Blend", display_order: 5 },
  { id: "df_lin", value: "Linen", label: "Linen", display_order: 6 },
];

const OCCASION_OPTIONS: FilterOption[] = [
  { id: "occ_cas", value: "Casual", label: "Casual & Everyday", display_order: 1 },
  { id: "occ_pty", value: "Party", label: "Party & Festive", display_order: 2 },
  { id: "occ_off", value: "Office", label: "Formal & Office", display_order: 3 },
  { id: "occ_bch", value: "Vacation", label: "Vacation & Beach", display_order: 4 },
];

// ── 2. GROCERY & PERSONAL CARE FILTER DEFINITIONS ────────────────────────────

const PACK_SIZE_OPTIONS: FilterOption[] = [
  { id: "ps_250", value: "250g", label: "250 g", display_order: 1 },
  { id: "ps_500", value: "500g", label: "500 g", display_order: 2 },
  { id: "ps_1kg", value: "1kg", label: "1 kg", display_order: 3 },
  { id: "ps_2kg", value: "2kg", label: "2 kg", display_order: 4 },
  { id: "ps_5kg", value: "5kg", label: "5 kg", display_order: 5 },
  { id: "ps_10kg", value: "10kg", label: "10 kg", display_order: 6 },
  { id: "ps_1l", value: "1L", label: "1 Litre", display_order: 7 },
  { id: "ps_5l", value: "5L", label: "5 Litres", display_order: 8 },
];

const SKIN_TYPE_OPTIONS: FilterOption[] = [
  { id: "sk_all", value: "All Skin Types", label: "All Skin Types", display_order: 1 },
  { id: "sk_dry", value: "Dry", label: "Dry Skin", display_order: 2 },
  { id: "sk_oily", value: "Oily", label: "Oily & Acne Prone", display_order: 3 },
  { id: "sk_comb", value: "Combination", label: "Combination", display_order: 4 },
  { id: "sk_sens", value: "Sensitive", label: "Sensitive", display_order: 5 },
];

const HAIR_TYPE_OPTIONS: FilterOption[] = [
  { id: "hr_all", value: "All Hair Types", label: "All Hair Types", display_order: 1 },
  { id: "hr_dry", value: "Dry & Damaged", label: "Dry & Damaged", display_order: 2 },
  { id: "hr_fall", value: "Hair Fall", label: "Anti Hair Fall", display_order: 3 },
  { id: "hr_dan", value: "Anti-Dandruff", label: "Anti-Dandruff", display_order: 4 },
];

// ── 3. ELECTRONICS FILTER DEFINITIONS ────────────────────────────────────────

const RAM_OPTIONS: FilterOption[] = [
  { id: "ram_4", value: "4GB", label: "4 GB", display_order: 1 },
  { id: "ram_6", value: "6GB", label: "6 GB", display_order: 2 },
  { id: "ram_8", value: "8GB", label: "8 GB", display_order: 3 },
  { id: "ram_12", value: "12GB", label: "12 GB", display_order: 4 },
];

const STORAGE_OPTIONS: FilterOption[] = [
  { id: "st_64", value: "64GB", label: "64 GB", display_order: 1 },
  { id: "st_128", value: "128GB", label: "128 GB", display_order: 2 },
  { id: "st_256", value: "256GB", label: "256 GB", display_order: 3 },
  { id: "st_512", value: "512GB", label: "512 GB", display_order: 4 },
];

/**
 * Returns dynamic, category-aware filter definitions tailored specifically to the
 * chosen category, subcategory, and search query context.
 */
export function getCategoryAwareFilterDefinitions(
  categorySlug?: string,
  subcategorySlug?: string,
  productTypeSlug?: string,
  query?: string,
): FilterDefinition[] {
  const normCat = (categorySlug || "").toLowerCase();
  const normSub = (subcategorySlug || "").toLowerCase();
  const normPt = (productTypeSlug || "").toLowerCase();
  const normQ = (query || "").toLowerCase();

  const isShirtScope =
    normSub.includes("shirt") ||
    normPt.includes("shirt") ||
    normQ.includes("shirt") ||
    normSub === "shirts";
  const isDressScope =
    normSub.includes("dress") ||
    normPt.includes("dress") ||
    normQ.includes("dress") ||
    normSub === "dresses";
  const isTshirtScope =
    normSub.includes("tshirt") ||
    normSub.includes("t-shirt") ||
    normPt.includes("tshirt") ||
    normQ.includes("tshirt") ||
    normQ.includes("t-shirt");
  const isBottomScope =
    normSub.includes("jean") ||
    normSub.includes("pant") ||
    normSub.includes("trouser") ||
    normPt.includes("jean") ||
    normQ.includes("jean");
  const isEthnicScope =
    normSub.includes("saree") ||
    normSub.includes("kurti") ||
    normPt.includes("saree") ||
    normQ.includes("saree") ||
    normQ.includes("kurti") ||
    normCat.includes("boutique");

  const isClothing =
    normCat.includes("fashion") ||
    normCat.includes("clothing") ||
    normCat.includes("boutique") ||
    normCat.includes("apparel") ||
    isShirtScope ||
    isDressScope ||
    isTshirtScope ||
    isBottomScope ||
    isEthnicScope;

  const isGrocery =
    normCat.includes("grocery") ||
    normCat.includes("kirana") ||
    normCat.includes("supermarket") ||
    normCat.includes("flour") ||
    normCat.includes("palamuthir") ||
    normCat.includes("produce") ||
    normCat.includes("fresh");

  const isBeauty =
    normCat.includes("beauty") ||
    normCat.includes("care") ||
    normCat.includes("cosmetic") ||
    normCat.includes("pharmacy");

  const isElectronics =
    normCat.includes("electronic") ||
    normCat.includes("mobile") ||
    normCat.includes("smartphone") ||
    normCat.includes("gadget");

  // ── SHIRTS SPECIFIC SCOPE ──
  if (isShirtScope) {
    return [
      UNIVERSAL_BRAND_DEF,
      UNIVERSAL_PRICE_DEF,
      {
        id: "gender",
        key: "gender",
        label: "Audience / Gender",
        type: "single_select",
        is_universal: false,
        is_required: false,
        display_order: 8,
        options: GENDER_OPTIONS,
      },
      {
        id: "size",
        key: "size",
        label: "Size",
        type: "multi_select",
        is_universal: false,
        is_required: true,
        display_order: 10,
        options: SHIRT_SIZE_OPTIONS,
      },
      {
        id: "color",
        key: "color",
        label: "Color",
        type: "color",
        is_universal: false,
        is_required: true,
        display_order: 11,
        options: GENERAL_COLOR_OPTIONS,
      },
      {
        id: "fit",
        key: "fit",
        label: "Fit",
        type: "single_select",
        is_universal: false,
        is_required: false,
        display_order: 12,
        options: FIT_OPTIONS,
      },
      {
        id: "sleeve_type",
        key: "sleeve_type",
        label: "Sleeve Type",
        type: "single_select",
        is_universal: false,
        is_required: false,
        display_order: 13,
        options: SLEEVE_OPTIONS,
      },
      {
        id: "pattern",
        key: "pattern",
        label: "Pattern",
        type: "multi_select",
        is_universal: false,
        is_required: false,
        display_order: 14,
        options: PATTERN_OPTIONS,
      },
      {
        id: "fabric",
        key: "fabric",
        label: "Fabric",
        type: "multi_select",
        is_universal: false,
        is_required: false,
        display_order: 15,
        options: SHIRT_FABRIC_OPTIONS,
      },
      {
        id: "collar_type",
        key: "collar_type",
        label: "Collar Type",
        type: "single_select",
        is_universal: false,
        is_required: false,
        display_order: 16,
        options: SHIRT_COLLAR_OPTIONS,
      },
      UNIVERSAL_RATING_DEF,
    ];
  }

  // ── DRESSES SPECIFIC SCOPE ──
  if (isDressScope) {
    return [
      UNIVERSAL_BRAND_DEF,
      UNIVERSAL_PRICE_DEF,
      {
        id: "dress_type",
        key: "dress_type",
        label: "Dress Type",
        type: "chip_group",
        is_universal: false,
        is_required: false,
        display_order: 8,
        options: DRESS_TYPE_OPTIONS,
      },
      {
        id: "length",
        key: "length",
        label: "Length",
        type: "single_select",
        is_universal: false,
        is_required: false,
        display_order: 9,
        options: DRESS_LENGTH_OPTIONS,
      },
      {
        id: "size",
        key: "size",
        label: "Size",
        type: "multi_select",
        is_universal: false,
        is_required: true,
        display_order: 10,
        options: DRESS_SIZE_OPTIONS,
      },
      {
        id: "color",
        key: "color",
        label: "Color",
        type: "color",
        is_universal: false,
        is_required: true,
        display_order: 11,
        options: GENERAL_COLOR_OPTIONS,
      },
      {
        id: "fabric",
        key: "fabric",
        label: "Fabric",
        type: "multi_select",
        is_universal: false,
        is_required: false,
        display_order: 12,
        options: DRESS_FABRIC_OPTIONS,
      },
      {
        id: "pattern",
        key: "pattern",
        label: "Pattern",
        type: "multi_select",
        is_universal: false,
        is_required: false,
        display_order: 13,
        options: PATTERN_OPTIONS,
      },
      {
        id: "sleeve_type",
        key: "sleeve_type",
        label: "Sleeve Type",
        type: "single_select",
        is_universal: false,
        is_required: false,
        display_order: 14,
        options: SLEEVE_OPTIONS,
      },
      {
        id: "occasion",
        key: "occasion",
        label: "Occasion",
        type: "single_select",
        is_universal: false,
        is_required: false,
        display_order: 15,
        options: OCCASION_OPTIONS,
      },
      UNIVERSAL_RATING_DEF,
    ];
  }

  // ── GENERAL CLOTHING & FASHION ──
  if (isClothing) {
    return [
      UNIVERSAL_BRAND_DEF,
      UNIVERSAL_PRICE_DEF,
      {
        id: "gender",
        key: "gender",
        label: "Audience / Gender",
        type: "single_select",
        is_universal: false,
        is_required: false,
        display_order: 8,
        options: GENDER_OPTIONS,
      },
      {
        id: "fit",
        key: "fit",
        label: "Fit",
        type: "single_select",
        is_universal: false,
        is_required: false,
        display_order: 9,
        options: FIT_OPTIONS,
      },
      {
        id: "size",
        key: "size",
        label: "Size",
        type: "multi_select",
        is_universal: false,
        is_required: true,
        display_order: 10,
        options: [...SHIRT_SIZE_OPTIONS, ...BOTTOM_SIZE_OPTIONS.slice(0, 4)],
      },
      {
        id: "color",
        key: "color",
        label: "Color",
        type: "color",
        is_universal: false,
        is_required: true,
        display_order: 11,
        options: GENERAL_COLOR_OPTIONS,
      },
      {
        id: "fabric",
        key: "fabric",
        label: "Fabric",
        type: "multi_select",
        is_universal: false,
        is_required: false,
        display_order: 12,
        options: SHIRT_FABRIC_OPTIONS,
      },
      {
        id: "pattern",
        key: "pattern",
        label: "Pattern",
        type: "multi_select",
        is_universal: false,
        is_required: false,
        display_order: 13,
        options: PATTERN_OPTIONS,
      },
      UNIVERSAL_RATING_DEF,
    ];
  }

  // ── GROCERY & SUPERMARKET ──
  if (isGrocery) {
    return [
      UNIVERSAL_BRAND_DEF,
      UNIVERSAL_PRICE_DEF,
      {
        id: "pack_size",
        key: "pack_size",
        label: "Pack Size / Weight",
        type: "multi_select",
        is_universal: false,
        is_required: false,
        display_order: 10,
        options: PACK_SIZE_OPTIONS,
      },
      {
        id: "organic",
        key: "organic",
        label: "Organic",
        type: "boolean",
        is_universal: false,
        is_required: false,
        display_order: 11,
        options: [{ id: "org_true", value: "true", label: "Organic Certified", display_order: 1 }],
      },
      UNIVERSAL_RATING_DEF,
    ];
  }

  // ── BEAUTY & PERSONAL CARE ──
  if (isBeauty) {
    return [
      UNIVERSAL_BRAND_DEF,
      UNIVERSAL_PRICE_DEF,
      {
        id: "skin_type",
        key: "skin_type",
        label: "Skin Type",
        type: "single_select",
        is_universal: false,
        is_required: false,
        display_order: 10,
        options: SKIN_TYPE_OPTIONS,
      },
      {
        id: "hair_type",
        key: "hair_type",
        label: "Hair Type",
        type: "single_select",
        is_universal: false,
        is_required: false,
        display_order: 11,
        options: HAIR_TYPE_OPTIONS,
      },
      UNIVERSAL_RATING_DEF,
    ];
  }

  // ── ELECTRONICS & MOBILE ──
  if (isElectronics) {
    return [
      UNIVERSAL_BRAND_DEF,
      UNIVERSAL_PRICE_DEF,
      {
        id: "ram",
        key: "ram",
        label: "RAM",
        type: "multi_select",
        unit: "GB",
        is_universal: false,
        is_required: true,
        display_order: 10,
        options: RAM_OPTIONS,
      },
      {
        id: "storage",
        key: "storage",
        label: "Internal Storage",
        type: "multi_select",
        unit: "GB",
        is_universal: false,
        is_required: true,
        display_order: 11,
        options: STORAGE_OPTIONS,
      },
      UNIVERSAL_RATING_DEF,
    ];
  }

  // Default Universal Fallback
  return [UNIVERSAL_BRAND_DEF, UNIVERSAL_PRICE_DEF, UNIVERSAL_RATING_DEF];
}

/**
 * Validates which attribute keys are allowed for a specific category and subcategory.
 * Used during category transitions to eliminate incompatible filters (e.g. dress_type in grocery).
 */
export function getApplicableAttributeKeysForCategory(
  categorySlug?: string,
  subcategorySlug?: string,
): Set<string> {
  const defs = getCategoryAwareFilterDefinitions(categorySlug, subcategorySlug);
  const keys = new Set<string>();
  for (const def of defs) {
    if (!def.is_universal) {
      keys.add(def.key);
      keys.add(def.id);
    }
  }
  return keys;
}

/**
 * Reconciles active attribute selections when switching categories or subcategories.
 * Drops incompatible filters (e.g., sleeve_type when moving to sarees or dresses when moving to grocery),
 * while preserving compatible attributes (e.g., color, size, brand, price).
 */
export function reconcileAttributesOnCategoryChange(
  newCategory?: string,
  newSubcategory?: string,
  currentAttributes: Record<string, string[]> = {},
): Record<string, string[]> {
  const allowedKeys = getApplicableAttributeKeysForCategory(newCategory, newSubcategory);
  const reconciled: Record<string, string[]> = {};

  for (const [key, values] of Object.entries(currentAttributes)) {
    if (allowedKeys.has(key) && values && values.length > 0) {
      reconciled[key] = values;
    }
  }

  return reconciled;
}
