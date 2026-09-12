/**
 * LocalShoree Dynamic 4-Tier Category & Dynamic Filter Taxonomy Engine
 *
 * Architecture:
 * SHOP CATEGORY → SUBCATEGORY → PRODUCT TYPE → DYNAMIC FILTERS → PRODUCTS
 *
 * Tier 1: Shop Category (e.g. Fashion & Clothing, Kirana & Grocery, Electronics)
 * Tier 2: Subcategory (e.g. Men's Clothing, Women's Clothing, Daily Ration, Mobile Devices)
 * Tier 3: Product Type (e.g. T-Shirts, Shirts, Rice, Smartphones, Cakes)
 * Tier 4: Dynamic Filters (e.g. Size, Color, Fabric, Fit, RAM, Storage, Egg/Eggless)
 */

export type FilterControlType =
  | "single_select"
  | "multi_select"
  | "boolean_toggle"
  | "range"
  | "chip_group";

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface DynamicAttributeFilter {
  id: string;
  name: string;
  type: FilterControlType;
  options: FilterOption[];
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  tooltip?: string;
}

export interface ProductTypeTaxonomy {
  id: string;
  name: string;
  slug: string;
  description?: string;
  keywords?: string[];
  filters: DynamicAttributeFilter[];
}

export interface SubcategoryTaxonomy {
  id: string;
  name: string;
  slug: string;
  iconName?: string;
  productTypes: ProductTypeTaxonomy[];
  defaultFilters?: DynamicAttributeFilter[];
}

export interface UniversalFilterSchema {
  id: string;
  name: string;
  type: FilterControlType;
  options: FilterOption[];
}

export interface CategoryTaxonomy {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  subcategories: SubcategoryTaxonomy[];
  categoryFilters: DynamicAttributeFilter[];
}

/**
 * Universal Filters available across almost all shop categories
 */
export const UNIVERSAL_FILTERS: UniversalFilterSchema[] = [
  {
    id: "price_range",
    name: "Price Range",
    type: "range",
    options: [
      { label: "Under ₹100", value: "0-100" },
      { label: "₹100 - ₹500", value: "100-500" },
      { label: "₹500 - ₹2,000", value: "500-2000" },
      { label: "₹2,000 - ₹10,000", value: "2000-10000" },
      { label: "Above ₹10,000", value: "10000-above" },
    ],
  },
  {
    id: "distance",
    name: "Distance",
    type: "chip_group",
    options: [
      { label: "Within 1 km", value: "1km" },
      { label: "Within 3 km", value: "3km" },
      { label: "Within 5 km", value: "5km" },
      { label: "All Nearby", value: "all" },
    ],
  },
  {
    id: "rating",
    name: "Customer Rating",
    type: "single_select",
    options: [
      { label: "4.5★ & Above", value: "4.5" },
      { label: "4.0★ & Above", value: "4.0" },
      { label: "3.5★ & Above", value: "3.5" },
    ],
  },
  {
    id: "open_now",
    name: "Open Now",
    type: "boolean_toggle",
    options: [
      { label: "Open Shops Only", value: "true" },
    ],
  },
  {
    id: "delivery_time",
    name: "Delivery Time",
    type: "chip_group",
    options: [
      { label: "< 20 mins", value: "20" },
      { label: "< 30 mins", value: "30" },
      { label: "< 45 mins", value: "45" },
    ],
  },
  {
    id: "offers",
    name: "Offers & Discounts",
    type: "multi_select",
    options: [
      { label: "Discounts & Deals", value: "discount" },
      { label: "Buy 1 Get 1", value: "bogo" },
      { label: "Free Delivery", value: "free_delivery" },
    ],
  },
];

/**
 * COMPLETE CATEGORY TAXONOMY DATABASE FOR ALL 30+ CATEGORIES
 */
export const CATEGORY_TAXONOMIES: Record<string, CategoryTaxonomy> = {
  // ───────────────────────────────────────────────────────────────────────────
  // 🛒 1. ESSENTIALS & DAILY SHOPPING
  // ───────────────────────────────────────────────────────────────────────────
  all: {
    categoryId: "all",
    categoryName: "All Shops",
    categorySlug: "all-shops",
    subcategories: [
      {
        id: "all_shops",
        name: "Shop Type",
        slug: "shop-type",
        productTypes: [
          { id: "grocery_type", name: "Grocery", slug: "grocery", filters: [] },
          { id: "supermarket_type", name: "Supermarket", slug: "supermarket", filters: [] },
          { id: "pharmacy_type", name: "Pharmacy", slug: "pharmacy", filters: [] },
          { id: "fruits_veg_type", name: "Fruits & Vegetables", slug: "fruits-vegetables", filters: [] },
          { id: "meat_fish_type", name: "Meat & Fish", slug: "meat-fish", filters: [] },
          { id: "bakery_type", name: "Bakery", slug: "bakery", filters: [] },
          { id: "dairy_type", name: "Dairy", slug: "dairy", filters: [] },
          { id: "convenience_type", name: "Convenience Store", slug: "convenience-store", filters: [] },
          { id: "organic_type", name: "Organic Store", slug: "organic-store", filters: [] },
          { id: "local_market_type", name: "Local Market", slug: "local-market", filters: [] },
          { id: "dept_store_type", name: "Department Store", slug: "department-store", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "store_type",
        name: "Store Type",
        type: "multi_select",
        options: [
          { label: "Kirana & Grocery", value: "grocery" },
          { label: "Supermarket", value: "supermarkets" },
          { label: "Pharmacy", value: "pharmacy" },
          { label: "Fruits & Veg", value: "fruits_veg" },
          { label: "Meat & Fish", value: "meat_fish" },
          { label: "Bakery", value: "bakery" },
          { label: "Fashion", value: "fashion" },
          { label: "Electronics", value: "electronics" },
        ],
      },
    ],
  },

  favorites: {
    categoryId: "favorites",
    categoryName: "⭐ Local Favorites",
    categorySlug: "local-favorites",
    subcategories: [
      {
        id: "favorite_types",
        name: "Favorite Sector",
        slug: "favorite-sector",
        productTypes: [
          { id: "fav_grocery", name: "Grocery", slug: "grocery", filters: [] },
          { id: "fav_food", name: "Food", slug: "food", filters: [] },
          { id: "fav_bakery", name: "Bakery", slug: "bakery", filters: [] },
          { id: "fav_pharmacy", name: "Pharmacy", slug: "pharmacy", filters: [] },
          { id: "fav_fashion", name: "Fashion", slug: "fashion", filters: [] },
          { id: "fav_electronics", name: "Electronics", slug: "electronics", filters: [] },
          { id: "fav_home", name: "Home", slug: "home", filters: [] },
          { id: "fav_services", name: "Services", slug: "services", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "trust_badge",
        name: "Community Trust",
        type: "multi_select",
        options: [
          { label: "Highly Rated (4.7★+)", value: "high_rated" },
          { label: "Most Ordered", value: "most_ordered" },
          { label: "Nearby (<1.5km)", value: "nearby" },
        ],
      },
    ],
  },

  grocery: {
    categoryId: "grocery",
    categoryName: "Kirana & Grocery",
    categorySlug: "kirana-grocery",
    subcategories: [
      {
        id: "rice_grains",
        name: "Rice, Grains & Atta",
        slug: "rice-grains-atta",
        productTypes: [
          { id: "rice", name: "Rice", slug: "rice", filters: [] },
          { id: "dal_pulses", name: "Dal & Pulses", slug: "dal-pulses", filters: [] },
          { id: "flour_atta", name: "Flour & Atta", slug: "flour-atta", filters: [] },
          { id: "grains_millets", name: "Grains & Millets", slug: "grains-millets", filters: [] },
        ],
      },
      {
        id: "cooking_essentials",
        name: "Oil, Ghee & Spices",
        slug: "oil-ghee-spices",
        productTypes: [
          { id: "oil_ghee", name: "Oil & Ghee", slug: "oil-ghee", filters: [] },
          { id: "sugar_salt", name: "Sugar & Salt", slug: "sugar-salt", filters: [] },
          { id: "spices_masala", name: "Spices & Masala", slug: "spices-masala", filters: [] },
        ],
      },
      {
        id: "snacks_breakfast",
        name: "Snacks & Instant Foods",
        slug: "snacks-instant-foods",
        productTypes: [
          { id: "pasta_noodles", name: "Pasta & Noodles", slug: "pasta-noodles", filters: [] },
          { id: "breakfast_foods", name: "Breakfast Foods", slug: "breakfast-foods", filters: [] },
          { id: "snacks", name: "Snacks", slug: "snacks", filters: [] },
          { id: "biscuits", name: "Biscuits", slug: "biscuits", filters: [] },
          { id: "instant_foods", name: "Instant Foods", slug: "instant-foods", filters: [] },
          { id: "pickles", name: "Pickles", slug: "pickles", filters: [] },
          { id: "sauces_spreads", name: "Sauces & Spreads", slug: "sauces-spreads", filters: [] },
        ],
      },
      {
        id: "dairy_beverages",
        name: "Dairy, Eggs & Drinks",
        slug: "dairy-eggs-drinks",
        productTypes: [
          { id: "dairy", name: "Dairy", slug: "dairy", filters: [] },
          { id: "eggs", name: "Eggs", slug: "eggs", filters: [] },
          { id: "beverages", name: "Beverages", slug: "beverages", filters: [] },
          { id: "water", name: "Water", slug: "water", filters: [] },
          { id: "baby_food", name: "Baby Food", slug: "baby-food", filters: [] },
          { id: "household_cleaning", name: "Household Cleaning", slug: "household-cleaning", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "brand",
        name: "Brand",
        type: "multi_select",
        options: [
          { label: "Aashirvaad", value: "aashirvaad" },
          { label: "Fortune", value: "fortune" },
          { label: "Tata Sampann", value: "tata" },
          { label: "Heritage", value: "heritage" },
          { label: "Aavin", value: "aavin" },
          { label: "Sunland", value: "sunland" },
          { label: "Local Mill", value: "local_mill" },
        ],
      },
      {
        id: "dietary",
        name: "Dietary & Prep",
        type: "multi_select",
        options: [
          { label: "Vegetarian", value: "veg" },
          { label: "Vegan", value: "vegan" },
          { label: "Organic", value: "organic" },
          { label: "Sugar-Free", value: "sugar_free" },
          { label: "Gluten-Free", value: "gluten_free" },
          { label: "Local & Fresh", value: "local" },
        ],
      },
      {
        id: "pack_size",
        name: "Pack Size / Weight",
        type: "chip_group",
        options: [
          { label: "250g / 500g", value: "500g" },
          { label: "1 kg", value: "1kg" },
          { label: "5 kg", value: "5kg" },
          { label: "10 kg", value: "10kg" },
          { label: "Bulk Pack", value: "bulk" },
        ],
      },
    ],
  },

  supermarkets: {
    categoryId: "supermarkets",
    categoryName: "Supermarkets",
    categorySlug: "supermarkets",
    subcategories: [
      {
        id: "super_dept",
        name: "Department",
        slug: "department",
        productTypes: [
          { id: "super_grocery", name: "Grocery", slug: "grocery", filters: [] },
          { id: "super_produce", name: "Fruits & Vegetables", slug: "fruits-veg", filters: [] },
          { id: "super_dairy", name: "Dairy", slug: "dairy", filters: [] },
          { id: "super_meat", name: "Meat & Fish", slug: "meat-fish", filters: [] },
          { id: "super_bakery", name: "Bakery", slug: "bakery", filters: [] },
          { id: "super_bev", name: "Beverages", slug: "beverages", filters: [] },
          { id: "super_personal", name: "Personal Care", slug: "personal-care", filters: [] },
          { id: "super_household", name: "Household & Cleaning", slug: "household", filters: [] },
          { id: "super_baby", name: "Baby Care", slug: "baby-care", filters: [] },
          { id: "super_pet", name: "Pet Care", slug: "pet-care", filters: [] },
          { id: "super_stationery", name: "Stationery", slug: "stationery", filters: [] },
          { id: "super_kitchen", name: "Kitchen", slug: "kitchen", filters: [] },
          { id: "super_electronics", name: "Electronics", slug: "electronics", filters: [] },
          { id: "super_clothing", name: "Clothing", slug: "clothing", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "fulfillment",
        name: "Fulfilment Option",
        type: "chip_group",
        options: [
          { label: "Express Delivery (<30 mins)", value: "express" },
          { label: "Bulk Order Available", value: "bulk" },
          { label: "Self Pickup Available", value: "pickup" },
        ],
      },
    ],
  },

  pharmacy: {
    categoryId: "pharmacy",
    categoryName: "Pharmacies & Medicals",
    categorySlug: "pharmacies",
    subcategories: [
      {
        id: "medicines",
        name: "Medicines & Care",
        slug: "medicines-care",
        productTypes: [
          { id: "prescription_meds", name: "Prescription Medicines", slug: "prescription-medicines", filters: [] },
          { id: "otc_meds", name: "OTC Medicines", slug: "otc-medicines", filters: [] },
          { id: "pain_relief", name: "Pain Relief", slug: "pain-relief", filters: [] },
          { id: "cold_cough", name: "Cold & Cough", slug: "cold-cough", filters: [] },
          { id: "diabetes_care", name: "Diabetes Care", slug: "diabetes-care", filters: [] },
        ],
      },
      {
        id: "supplements_devices",
        name: "Vitamins, Devices & Wellness",
        slug: "supplements-devices",
        productTypes: [
          { id: "vitamins_supplements", name: "Vitamins & Supplements", slug: "vitamins-supplements", filters: [] },
          { id: "first_aid", name: "First Aid", slug: "first-aid", filters: [] },
          { id: "medical_devices", name: "Medical Devices", slug: "medical-devices", filters: [] },
          { id: "masks_sanitizers", name: "Masks & Sanitizers", slug: "masks-sanitizers", filters: [] },
          { id: "ortho_supports", name: "Orthopedic Supports", slug: "orthopedic-supports", filters: [] },
          { id: "health_equipment", name: "Healthcare Equipment", slug: "healthcare-equipment", filters: [] },
        ],
      },
      {
        id: "personal_family_care",
        name: "Personal & Family Care",
        slug: "personal-family-care",
        productTypes: [
          { id: "pharm_personal", name: "Personal Care", slug: "personal-care", filters: [] },
          { id: "pharm_baby", name: "Baby Care", slug: "baby-care", filters: [] },
          { id: "pharm_women", name: "Women's Care", slug: "womens-care", filters: [] },
          { id: "pharm_men", name: "Men's Care", slug: "mens-care", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "med_form",
        name: "Dosage Form",
        type: "chip_group",
        options: [
          { label: "Tablet", value: "tablet" },
          { label: "Capsule", value: "capsule" },
          { label: "Syrup", value: "syrup" },
          { label: "Cream / Ointment", value: "cream" },
          { label: "Powder / Drops", value: "powder" },
        ],
      },
      {
        id: "prescription_type",
        name: "Prescription Requirement",
        type: "single_select",
        options: [
          { label: "OTC (Over The Counter)", value: "otc" },
          { label: "Prescription Required", value: "prescription_required" },
        ],
      },
      {
        id: "brand_type",
        name: "Brand Category",
        type: "chip_group",
        options: [
          { label: "Generic Medicine", value: "generic" },
          { label: "Branded Healthcare", value: "branded" },
        ],
      },
    ],
  },

  fruits_veg: {
    categoryId: "fruits_veg",
    categoryName: "Fruits & Vegetables",
    categorySlug: "fruits-vegetables",
    subcategories: [
      {
        id: "fresh_produce",
        name: "Produce Type",
        slug: "produce-type",
        productTypes: [
          { id: "fruits", name: "Fruits", slug: "fruits", filters: [] },
          { id: "vegetables", name: "Vegetables", slug: "vegetables", filters: [] },
          { id: "leafy_veg", name: "Leafy Vegetables", slug: "leafy-vegetables", filters: [] },
          { id: "exotic_fruits", name: "Exotic Fruits", slug: "exotic-fruits", filters: [] },
          { id: "exotic_veg", name: "Exotic Vegetables", slug: "exotic-vegetables", filters: [] },
          { id: "organic_produce", name: "Organic Produce", slug: "organic", filters: [] },
          { id: "cut_ready", name: "Cut & Ready-to-Cook", slug: "cut-ready-to-cook", filters: [] },
          { id: "herbs", name: "Herbs & Spices", slug: "herbs", filters: [] },
          { id: "tender_coconut", name: "Coconut & Water", slug: "coconut", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "farming_type",
        name: "Farm Source & Quality",
        type: "multi_select",
        options: [
          { label: "Farm Fresh Daily", value: "farm_fresh" },
          { label: "Organic Certified", value: "organic" },
          { label: "Local Farm", value: "local" },
          { label: "Seasonal Produce", value: "seasonal" },
        ],
      },
      {
        id: "prep_state",
        name: "Preparation",
        type: "chip_group",
        options: [
          { label: "Whole", value: "whole" },
          { label: "Cut & Cleaned", value: "cut" },
          { label: "Peeled / Ready to Cook", value: "ready_cook" },
        ],
      },
      {
        id: "quantity_unit",
        name: "Selling Unit",
        type: "chip_group",
        options: [
          { label: "Per Piece", value: "piece" },
          { label: "Per Kg", value: "kg" },
          { label: "Box / Pack", value: "box" },
        ],
      },
    ],
  },

  meat_fish: {
    categoryId: "meat_fish",
    categoryName: "Meat & Fish",
    categorySlug: "meat-fish",
    subcategories: [
      {
        id: "poultry_meat",
        name: "Meat & Poultry",
        slug: "meat-poultry",
        productTypes: [
          { id: "chicken", name: "Chicken", slug: "chicken", filters: [] },
          { id: "country_chicken", name: "Country Chicken (Nattu Kozhi)", slug: "country-chicken", filters: [] },
          { id: "mutton", name: "Mutton", slug: "mutton", filters: [] },
          { id: "beef", name: "Beef", slug: "beef", filters: [] },
          { id: "eggs_poultry", name: "Eggs", slug: "eggs", filters: [] },
        ],
      },
      {
        id: "seafood",
        name: "Fish & Seafood",
        slug: "fish-seafood",
        productTypes: [
          { id: "fish", name: "Fish", slug: "fish", filters: [] },
          { id: "prawns", name: "Prawns", slug: "prawns", filters: [] },
          { id: "crab", name: "Crab", slug: "crab", filters: [] },
          { id: "seafood_items", name: "Seafood Mix", slug: "seafood", filters: [] },
          { id: "ready_cook_meat", name: "Ready-to-Cook Marinated", slug: "ready-to-cook", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "freshness",
        name: "State",
        type: "chip_group",
        options: [
          { label: "Fresh Catch Daily", value: "fresh" },
          { label: "Frozen / Chilled", value: "frozen" },
        ],
      },
      {
        id: "cut_type",
        name: "Cut & Cleaning Option",
        type: "multi_select",
        options: [
          { label: "Curry Cut", value: "curry_cut" },
          { label: "Biryani Cut", value: "biryani_cut" },
          { label: "Boneless", value: "boneless" },
          { label: "Skinless", value: "skinless" },
          { label: "Fillet", value: "fillet" },
          { label: "Whole Cleaned", value: "whole_cleaned" },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 🍰 2. FOOD, BAKERIES & SWEETS
  // ───────────────────────────────────────────────────────────────────────────
  bakery: {
    categoryId: "bakery",
    categoryName: "Bakeries",
    categorySlug: "bakeries",
    subcategories: [
      {
        id: "fresh_bakes",
        name: "Fresh Bakes & Puffs",
        slug: "fresh-bakes-puffs",
        productTypes: [
          { id: "bread", name: "Bread", slug: "bread", filters: [] },
          { id: "buns", name: "Buns", slug: "buns", filters: [] },
          { id: "puffs", name: "Puffs", slug: "puffs", filters: [] },
          { id: "cookies", name: "Cookies", slug: "cookies", filters: [] },
          { id: "biscuits", name: "Biscuits", slug: "biscuits", filters: [] },
          { id: "rusks", name: "Rusks", slug: "rusks", filters: [] },
          { id: "donuts", name: "Donuts", slug: "donuts", filters: [] },
          { id: "sandwiches", name: "Sandwiches", slug: "sandwiches", filters: [] },
          { id: "savories", name: "Savories", slug: "savories", filters: [] },
        ],
      },
      {
        id: "cakes_pastries",
        name: "Cakes & Celebration",
        slug: "cakes-celebration",
        productTypes: [
          { id: "cakes", name: "Cakes", slug: "cakes", filters: [] },
          { id: "pastries", name: "Pastries", slug: "pastries", filters: [] },
          { id: "birthday_cakes", name: "Birthday Cakes", slug: "birthday-cakes", filters: [] },
          { id: "custom_cakes", name: "Custom Cakes", slug: "custom-cakes", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "dietary_egg",
        name: "Egg / Eggless",
        type: "chip_group",
        options: [
          { label: "Eggless (100% Veg)", value: "eggless" },
          { label: "Contains Egg", value: "egg" },
        ],
      },
      {
        id: "cake_flavor",
        name: "Flavor",
        type: "multi_select",
        options: [
          { label: "Chocolate / Truffle", value: "chocolate" },
          { label: "Black Forest", value: "black_forest" },
          { label: "Butterscotch", value: "butterscotch" },
          { label: "Red Velvet", value: "red_velvet" },
          { label: "Pineapple / Fruit", value: "pineapple" },
          { label: "Vanilla", value: "vanilla" },
        ],
      },
      {
        id: "customizable",
        name: "Customization",
        type: "chip_group",
        options: [
          { label: "Custom Message on Cake", value: "custom_message" },
          { label: "Custom Photo / Theme", value: "custom_photo" },
        ],
      },
    ],
  },

  sweet_shops: {
    categoryId: "sweet_shops",
    categoryName: "Sweet Shops",
    categorySlug: "sweet-shops",
    subcategories: [
      {
        id: "sweets_type",
        name: "Sweet Category",
        slug: "sweet-category",
        productTypes: [
          { id: "mysurpa", name: "Mysurpa", slug: "mysurpa", filters: [] },
          { id: "halwa", name: "Halwa", slug: "halwa", filters: [] },
          { id: "ladoo", name: "Ladoo", slug: "ladoo", filters: [] },
          { id: "jalebi", name: "Jalebi", slug: "jalebi", filters: [] },
          { id: "gulab_jamun", name: "Gulab Jamun", slug: "gulab-jamun", filters: [] },
          { id: "kaju_sweets", name: "Kaju Sweets", slug: "kaju-sweets", filters: [] },
          { id: "milk_sweets", name: "Milk Sweets", slug: "milk-sweets", filters: [] },
          { id: "bengali_sweets", name: "Bengali Sweets", slug: "bengali-sweets", filters: [] },
          { id: "traditional_sweets", name: "Traditional Sweets", slug: "traditional-sweets", filters: [] },
        ],
      },
      {
        id: "savouries_type",
        name: "Savories & Snacks",
        slug: "savories-snacks",
        productTypes: [
          { id: "sweet_savories", name: "Savories", slug: "savories", filters: [] },
          { id: "mixtures", name: "Mixtures", slug: "mixtures", filters: [] },
          { id: "karasev", name: "Karasev", slug: "karasev", filters: [] },
          { id: "murukku", name: "Murukku", slug: "murukku", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "sweet_base",
        name: "Base Ingredient",
        type: "chip_group",
        options: [
          { label: "Pure Ghee-based", value: "ghee" },
          { label: "Milk-based", value: "milk" },
          { label: "Dry Fruit Specialty", value: "dry_fruit" },
          { label: "Sugar-Free / Jaggery", value: "sugar_free" },
        ],
      },
      {
        id: "pack_box_size",
        name: "Box Size",
        type: "chip_group",
        options: [
          { label: "250g", value: "250g" },
          { label: "500g", value: "500g" },
          { label: "1 kg", value: "1kg" },
          { label: "Festive Gift Box", value: "gift_box" },
        ],
      },
    ],
  },

  restaurants: {
    categoryId: "restaurants",
    categoryName: "Restaurants",
    categorySlug: "restaurants",
    subcategories: [
      {
        id: "cuisine_type",
        name: "Cuisine & Meal",
        slug: "cuisine-meal",
        productTypes: [
          { id: "south_indian", name: "South Indian Tiffin & Meals", slug: "south-indian", filters: [] },
          { id: "north_indian", name: "North Indian Curries & Naan", slug: "north-indian", filters: [] },
          { id: "chinese", name: "Chinese & Indo-Chinese", slug: "chinese", filters: [] },
          { id: "chettinad", name: "Chettinad Non-Veg", slug: "chettinad", filters: [] },
          { id: "biryani", name: "Biryani Special", slug: "biryani", filters: [] },
          { id: "fast_food", name: "Fast Food & Rolls", slug: "fast-food", filters: [] },
          { id: "pizza_burger", name: "Pizza & Burger", slug: "pizza-burger", filters: [] },
          { id: "seafood_dining", name: "Seafood Specialties", slug: "seafood", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "veg_nonveg",
        name: "Dietary Preference",
        type: "chip_group",
        options: [
          { label: "Pure Veg 🟢", value: "veg" },
          { label: "Non-Veg 🔴", value: "non_veg" },
          { label: "Jain Available", value: "jain" },
          { label: "Vegan Options", value: "vegan" },
        ],
      },
      {
        id: "spice_level",
        name: "Spiciness",
        type: "chip_group",
        options: [
          { label: "Mild / Kids", value: "mild" },
          { label: "Medium", value: "medium" },
          { label: "Authentic Spicy 🌶️", value: "spicy" },
        ],
      },
      {
        id: "meal_time",
        name: "Meal Slot",
        type: "chip_group",
        options: [
          { label: "Breakfast Tiffin", value: "breakfast" },
          { label: "Full Lunch Meals", value: "lunch" },
          { label: "Evening Snacks", value: "snacks" },
          { label: "Dinner Special", value: "dinner" },
        ],
      },
    ],
  },

  cafes: {
    categoryId: "cafes",
    categoryName: "Cafés & Tea Shops",
    categorySlug: "cafes-tea-shops",
    subcategories: [
      {
        id: "beverage_types",
        name: "Drinks & Bites",
        slug: "drinks-bites",
        productTypes: [
          { id: "filter_coffee", name: "Filter Coffee", slug: "filter-coffee", filters: [] },
          { id: "tea_chai", name: "Tea & Chai", slug: "tea", filters: [] },
          { id: "milkshakes", name: "Milkshakes", slug: "milkshakes", filters: [] },
          { id: "juices_smoothies", name: "Juices & Smoothies", slug: "juices", filters: [] },
          { id: "cafe_snacks", name: "Snacks & Sandwiches", slug: "snacks", filters: [] },
          { id: "chaats", name: "Chaats & Street Food", slug: "chaats", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "temp_pref",
        name: "Temperature",
        type: "chip_group",
        options: [
          { label: "Hot Beverages ☕", value: "hot" },
          { label: "Cold / Iced 🥤", value: "cold" },
        ],
      },
      {
        id: "sugar_dairy_options",
        name: "Dietary Adjustments",
        type: "multi_select",
        options: [
          { label: "Sugar-Free Available", value: "sugar_free" },
          { label: "Dairy-Free / Oat Milk", value: "dairy_free" },
          { label: "Caffeine-Free", value: "caffeine_free" },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 👗 3. FASHION, ACCESSORIES & BEAUTY
  // ───────────────────────────────────────────────────────────────────────────
  fashion: {
    categoryId: "fashion",
    categoryName: "Fashion & Clothing",
    categorySlug: "fashion-clothing",
    subcategories: [
      {
        id: "mens_wear",
        name: "Men's Fashion",
        slug: "mens-fashion",
        productTypes: [
          { id: "tshirts", name: "T-Shirts", slug: "tshirts", filters: [] },
          { id: "shirts", name: "Shirts", slug: "shirts", filters: [] },
          { id: "pants", name: "Pants & Trousers", slug: "pants", filters: [] },
          { id: "jeans", name: "Jeans", slug: "jeans", filters: [] },
          { id: "shorts", name: "Shorts", slug: "shorts", filters: [] },
          { id: "dhotis", name: "Dhotis", slug: "dhotis", filters: [] },
          { id: "kurtas", name: "Kurtas & Ethnic", slug: "kurtas", filters: [] },
          { id: "innerwear_men", name: "Innerwear & Nightwear", slug: "innerwear", filters: [] },
          { id: "jackets_men", name: "Jackets & Blazers", slug: "jackets", filters: [] },
        ],
      },
      {
        id: "womens_wear",
        name: "Women's Fashion",
        slug: "womens-fashion",
        productTypes: [
          { id: "sarees", name: "Sarees", slug: "sarees", filters: [] },
          { id: "kurtis", name: "Kurtis", slug: "kurtis", filters: [] },
          { id: "salwar_suits", name: "Salwar Suits & Leggings", slug: "salwar-suits", filters: [] },
          { id: "dresses_skirts", name: "Dresses & Skirts", slug: "dresses-skirts", filters: [] },
          { id: "tops_tshirts_women", name: "Tops & T-Shirts", slug: "tops-tshirts", filters: [] },
          { id: "nightwear_women", name: "Nightwear & Lounge", slug: "nightwear", filters: [] },
        ],
      },
      {
        id: "kids_wear",
        name: "Kids & Uniforms",
        slug: "kids-fashion",
        productTypes: [
          { id: "boys_clothing", name: "Boys Wear", slug: "boys-wear", filters: [] },
          { id: "girls_clothing", name: "Girls Wear", slug: "girls-wear", filters: [] },
          { id: "school_uniforms", name: "School Uniforms", slug: "school-uniforms", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "gender_target",
        name: "Department",
        type: "chip_group",
        options: [
          { label: "Men's", value: "men" },
          { label: "Women's", value: "women" },
          { label: "Kids & Baby", value: "kids" },
        ],
      },
      {
        id: "apparel_size",
        name: "Size",
        type: "chip_group",
        options: [
          { label: "S", value: "S" },
          { label: "M", value: "M" },
          { label: "L", value: "L" },
          { label: "XL", value: "XL" },
          { label: "XXL+", value: "XXL" },
        ],
      },
      {
        id: "fabric_material",
        name: "Fabric",
        type: "multi_select",
        options: [
          { label: "100% Pure Cotton", value: "cotton" },
          { label: "Silk / Handloom", value: "silk" },
          { label: "Linen", value: "linen" },
          { label: "Denim", value: "denim" },
          { label: "Polyester / Blend", value: "blend" },
        ],
      },
      {
        id: "fit_style",
        name: "Fit",
        type: "chip_group",
        options: [
          { label: "Regular Fit", value: "regular" },
          { label: "Slim Fit", value: "slim" },
          { label: "Oversized / Loose", value: "oversized" },
        ],
      },
    ],
  },

  boutiques: {
    categoryId: "boutiques",
    categoryName: "Boutiques",
    categorySlug: "boutiques",
    subcategories: [
      {
        id: "boutique_apparel",
        name: "Boutique Collection",
        slug: "boutique-collection",
        productTypes: [
          { id: "silk_sarees", name: "Kanchipuram Silk Sarees", slug: "silk-sarees", filters: [] },
          { id: "designer_sarees", name: "Designer Sarees", slug: "designer-sarees", filters: [] },
          { id: "boutique_kurtis", name: "Designer Kurtis", slug: "designer-kurtis", filters: [] },
          { id: "lehengas", name: "Lehengas & Party Gowns", slug: "lehengas", filters: [] },
          { id: "blouses", name: "Designer Blouses", slug: "blouses", filters: [] },
          { id: "bridal_wear", name: "Bridal Wear Studio", slug: "bridal-wear", filters: [] },
          { id: "custom_stitching", name: "Custom Stitching & Tailoring", slug: "custom-stitching", filters: [] },
          { id: "aari_embroidery", name: "Aari Work & Embroidery", slug: "aari-work", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "work_style",
        name: "Craftsmanship",
        type: "multi_select",
        options: [
          { label: "Handmade / Artisan", value: "handmade" },
          { label: "Custom Embroidery", value: "embroidery" },
          { label: "Aari Work", value: "aari" },
          { label: "Custom Stitchable", value: "customizable" },
        ],
      },
      {
        id: "occasion_type",
        name: "Occasion",
        type: "chip_group",
        options: [
          { label: "Bridal / Wedding 💍", value: "bridal" },
          { label: "Festive & Temple 🪔", value: "festive" },
          { label: "Party Wear ✨", value: "party" },
          { label: "Casual Designer 🌸", value: "casual" },
        ],
      },
    ],
  },

  footwear: {
    categoryId: "footwear",
    categoryName: "Footwear",
    categorySlug: "footwear",
    subcategories: [
      {
        id: "shoe_types",
        name: "Footwear Category",
        slug: "footwear-category",
        productTypes: [
          { id: "slippers_chappal", name: "Slippers & Chappals", slug: "slippers", filters: [] },
          { id: "sandals", name: "Sandals", slug: "sandals", filters: [] },
          { id: "formal_shoes", name: "Formal Leather Shoes", slug: "formal-shoes", filters: [] },
          { id: "sports_shoes", name: "Sports & Running Shoes", slug: "sports-shoes", filters: [] },
          { id: "school_shoes", name: "School Shoes", slug: "school-shoes", filters: [] },
          { id: "heels_flats", name: "Heels & Flats", slug: "heels-flats", filters: [] },
          { id: "ethnic_footwear", name: "Ethnic Mojaris & Sandals", slug: "ethnic-footwear", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "footwear_size",
        name: "Size (UK/India)",
        type: "chip_group",
        options: [
          { label: "UK 6", value: "6" },
          { label: "UK 7", value: "7" },
          { label: "UK 8", value: "8" },
          { label: "UK 9", value: "9" },
          { label: "UK 10+", value: "10" },
        ],
      },
      {
        id: "material_sole",
        name: "Material & Sole",
        type: "multi_select",
        options: [
          { label: "Genuine Leather", value: "leather" },
          { label: "Waterproof / Rubber", value: "waterproof" },
          { label: "Cushioned Comfort Sole", value: "cushioned" },
          { label: "Canvas / Fabric", value: "canvas" },
        ],
      },
    ],
  },

  jewellery: {
    categoryId: "jewellery",
    categoryName: "Jewellery & Watches",
    categorySlug: "jewellery-watches",
    subcategories: [
      {
        id: "jewel_items",
        name: "Jewellery & Accessory Type",
        slug: "jewellery-type",
        productTypes: [
          { id: "earrings_kammal", name: "Earrings & Kammal", slug: "earrings", filters: [] },
          { id: "chains_necklaces", name: "Chains & Necklaces", slug: "necklaces", filters: [] },
          { id: "bangles_bracelets", name: "Bangles & Bracelets", slug: "bangles", filters: [] },
          { id: "rings", name: "Rings", slug: "rings", filters: [] },
          { id: "anklets", name: "Silver Anklets (Kolusu)", slug: "anklets", filters: [] },
          { id: "nose_pins", name: "Nose Pins", slug: "nose-pins", filters: [] },
          { id: "watches", name: "Watches", slug: "watches", filters: [] },
          { id: "smart_watches", name: "Smart Watches", slug: "smart-watches", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "metal_purity",
        name: "Material & Purity",
        type: "chip_group",
        options: [
          { label: "22K Pure Gold", value: "gold_22k" },
          { label: "925 Sterling Silver", value: "silver_925" },
          { label: "Gold Plated 1-Gram", value: "gold_plated" },
          { label: "Fashion / Artificial", value: "artificial" },
        ],
      },
      {
        id: "stone_type",
        name: "Stone",
        type: "multi_select",
        options: [
          { label: "Cubic Zirconia / AD", value: "cz" },
          { label: "Kemp & Temple Stones", value: "kemp" },
          { label: "Pearls", value: "pearl" },
          { label: "Plain Metal", value: "plain" },
        ],
      },
    ],
  },

  beauty: {
    categoryId: "beauty",
    categoryName: "Beauty & Care",
    categorySlug: "beauty-care",
    subcategories: [
      {
        id: "beauty_dept",
        name: "Beauty & Care Category",
        slug: "beauty-category",
        productTypes: [
          { id: "makeup", name: "Makeup (Lipstick, Foundation, Eyeliner)", slug: "makeup", filters: [] },
          { id: "skincare", name: "Skincare (Facewash, Moisturizer, Sunscreen)", slug: "skincare", filters: [] },
          { id: "haircare", name: "Hair Care (Shampoo, Oil, Conditioner)", slug: "haircare", filters: [] },
          { id: "perfumes_deos", name: "Perfume & Deodorant", slug: "perfume-deodorant", filters: [] },
          { id: "mens_grooming", name: "Men's Grooming", slug: "mens-grooming", filters: [] },
          { id: "bath_body", name: "Bath & Body Soaps", slug: "bath-body", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "skin_hair_type",
        name: "Skin / Hair Type",
        type: "chip_group",
        options: [
          { label: "All Skin Types", value: "all" },
          { label: "Dry / Sensitive", value: "dry" },
          { label: "Oily / Acne-Prone", value: "oily" },
          { label: "Ayurvedic / Herbal", value: "herbal" },
        ],
      },
      {
        id: "beauty_certifications",
        name: "Attributes & Claims",
        type: "multi_select",
        options: [
          { label: "100% Organic", value: "organic" },
          { label: "Vegan & Cruelty Free 🐰", value: "vegan" },
          { label: "Paraben / Sulphate Free", value: "chemical_free" },
          { label: "SPF Sun Protection ☀️", value: "spf" },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 📺 4. ELECTRONICS, GADGETS & SPARES
  // ───────────────────────────────────────────────────────────────────────────
  electronics: {
    categoryId: "electronics",
    categoryName: "Electronics",
    categorySlug: "electronics",
    subcategories: [
      {
        id: "home_appliances",
        name: "TV & Appliances",
        slug: "tv-appliances",
        productTypes: [
          { id: "tv", name: "Smart TV & Televisions", slug: "tv", filters: [] },
          { id: "refrigerator", name: "Refrigerator", slug: "refrigerator", filters: [] },
          { id: "washing_machine", name: "Washing Machine", slug: "washing-machine", filters: [] },
          { id: "ac", name: "Air Conditioner (AC)", slug: "ac", filters: [] },
          { id: "microwave_oven", name: "Microwave & Oven", slug: "microwave-oven", filters: [] },
          { id: "mixer_grinder", name: "Mixer Grinder", slug: "mixer-grinder", filters: [] },
          { id: "air_cooler_fans", name: "Air Cooler & Fans", slug: "air-cooler-fans", filters: [] },
          { id: "soundbars_speakers", name: "Soundbar & Home Theater", slug: "soundbar-speakers", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "brand_electronics",
        name: "Brand",
        type: "multi_select",
        options: [
          { label: "Samsung", value: "samsung" },
          { label: "LG", value: "lg" },
          { label: "Sony", value: "sony" },
          { label: "Preethi", value: "preethi" },
          { label: "Butterfly", value: "butterfly" },
          { label: "Whirlpool", value: "whirlpool" },
          { label: "Havells", value: "havells" },
        ],
      },
      {
        id: "energy_rating",
        name: "Energy Efficiency",
        type: "chip_group",
        options: [
          { label: "5 Star Rated ⚡", value: "5star" },
          { label: "3 Star Rated", value: "3star" },
          { label: "Inverter Technology", value: "inverter" },
        ],
      },
      {
        id: "smart_features",
        name: "Connectivity",
        type: "chip_group",
        options: [
          { label: "Smart TV / Wi-Fi Enabled", value: "smart" },
          { label: "Bluetooth", value: "bluetooth" },
        ],
      },
    ],
  },

  mobile: {
    categoryId: "mobile",
    categoryName: "Mobile & Accessories",
    categorySlug: "mobile-accessories",
    subcategories: [
      {
        id: "devices",
        name: "Phones & Tablets",
        slug: "phones-tablets",
        productTypes: [
          { id: "smartphones", name: "Smartphones", slug: "smartphones", filters: [] },
          { id: "feature_phones", name: "Feature Phones", slug: "feature-phones", filters: [] },
          { id: "tablets", name: "Tablets", slug: "tablets", filters: [] },
        ],
      },
      {
        id: "accessories",
        name: "Mobile Accessories & Spares",
        slug: "mobile-accessories",
        productTypes: [
          { id: "chargers_cables", name: "Chargers & Cables", slug: "chargers-cables", filters: [] },
          { id: "power_banks", name: "Power Banks", slug: "power-banks", filters: [] },
          { id: "earphones_headphones", name: "Earphones & Wireless Buds", slug: "earphones-headphones", filters: [] },
          { id: "cases_covers", name: "Cases & Back Covers", slug: "cases-covers", filters: [] },
          { id: "screen_protectors", name: "Screen Guards & Tempered Glass", slug: "screen-protectors", filters: [] },
          { id: "memory_cards", name: "Memory Cards & Pendrives", slug: "memory-cards", filters: [] },
          { id: "mobile_parts", name: "Mobile Spare Parts & Battery", slug: "mobile-parts", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "ram_capacity",
        name: "RAM",
        type: "chip_group",
        options: [
          { label: "4 GB", value: "4gb" },
          { label: "6 GB", value: "6gb" },
          { label: "8 GB", value: "8gb" },
          { label: "12 GB+", value: "12gb" },
        ],
      },
      {
        id: "storage_capacity",
        name: "Internal Storage",
        type: "chip_group",
        options: [
          { label: "64 GB", value: "64gb" },
          { label: "128 GB", value: "128gb" },
          { label: "256 GB+", value: "256gb" },
        ],
      },
      {
        id: "network_tech",
        name: "Network",
        type: "chip_group",
        options: [
          { label: "5G Enabled ⚡", value: "5g" },
          { label: "4G VoLTE", value: "4g" },
        ],
      },
    ],
  },

  auto: {
    categoryId: "auto",
    categoryName: "Auto & Bike",
    categorySlug: "auto-bike",
    subcategories: [
      {
        id: "auto_spares_accessories",
        name: "Vehicle Parts & Accessories",
        slug: "vehicle-parts-accessories",
        productTypes: [
          { id: "helmets", name: "Helmets & Safety Gear", slug: "helmets", filters: [] },
          { id: "bike_accessories", name: "Bike Accessories", slug: "bike-accessories", filters: [] },
          { id: "car_accessories", name: "Car Accessories & Covers", slug: "car-accessories", filters: [] },
          { id: "engine_oil_lubricants", name: "Engine Oil & Lubricants", slug: "engine-oil", filters: [] },
          { id: "tyres_batteries", name: "Tyres & Batteries", slug: "tyres-batteries", filters: [] },
          { id: "brake_lights_spares", name: "Brake Parts & Lights", slug: "spare-parts", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "vehicle_compatibility",
        name: "Vehicle Type",
        type: "chip_group",
        options: [
          { label: "Two Wheeler / Bike 🏍️", value: "bike" },
          { label: "Four Wheeler / Car 🚗", value: "car" },
          { label: "Auto / Commercial 🛺", value: "commercial" },
        ],
      },
      {
        id: "part_origin",
        name: "Part Type",
        type: "chip_group",
        options: [
          { label: "OEM Genuine Spares", value: "oem" },
          { label: "Aftermarket Brand", value: "aftermarket" },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 🏠 5. HOME, HARDWARE & SUPPLIES
  // ───────────────────────────────────────────────────────────────────────────
  home_kitchen: {
    categoryId: "home_kitchen",
    categoryName: "Home & Kitchen",
    categorySlug: "home-kitchen",
    subcategories: [
      {
        id: "cookware_vessels",
        name: "Cookware & Vessels",
        slug: "cookware-vessels",
        productTypes: [
          { id: "cookware_pans", name: "Cookware, Tawa & Pans", slug: "cookware-tawa-pans", filters: [] },
          { id: "pressure_cookers", name: "Pressure Cookers", slug: "pressure-cookers", filters: [] },
          { id: "steel_vessels", name: "Stainless Steel Vessels", slug: "steel-vessels", filters: [] },
          { id: "plates_cutlery", name: "Plates, Cups & Cutlery", slug: "plates-cutlery", filters: [] },
          { id: "storage_containers", name: "Storage Containers & Water Bottles", slug: "storage-bottles", filters: [] },
          { id: "stoves_tools", name: "Gas Stoves & Kitchen Tools", slug: "stoves-tools", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "vessel_material",
        name: "Material",
        type: "multi_select",
        options: [
          { label: "Stainless Steel", value: "steel" },
          { label: "Cast Iron / Pre-Seasoned", value: "cast_iron" },
          { label: "Non-Stick Coated", value: "non_stick" },
          { label: "Brass / Copper", value: "brass" },
          { label: "BPA-Free Plastic", value: "plastic" },
        ],
      },
      {
        id: "stove_compatibility",
        name: "Stove Compatibility",
        type: "chip_group",
        options: [
          { label: "Induction Compatible ⚡", value: "induction" },
          { label: "Gas Stove Compatible 🔥", value: "gas" },
        ],
      },
    ],
  },

  furniture: {
    categoryId: "furniture",
    categoryName: "Furniture & Home Decor",
    categorySlug: "furniture-home-decor",
    subcategories: [
      {
        id: "furniture_furnishing",
        name: "Furniture & Interior Decor",
        slug: "furniture-decor",
        productTypes: [
          { id: "sofa_seating", name: "Sofa & Chairs", slug: "sofa-chairs", filters: [] },
          { id: "bed_mattress", name: "Bed & Mattress", slug: "bed-mattress", filters: [] },
          { id: "tables_wardrobes", name: "Tables & Wardrobes", slug: "tables-wardrobes", filters: [] },
          { id: "curtains_carpets", name: "Curtains, Carpets & Cushions", slug: "curtains-carpets", filters: [] },
          { id: "lamps_lighting", name: "Lamps, Mirrors & Brass Decor", slug: "lamps-decor", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "furniture_material",
        name: "Material",
        type: "multi_select",
        options: [
          { label: "Solid Teak Wood", value: "teak_wood" },
          { label: "Plywood / Engineered", value: "plywood" },
          { label: "Metal / Wrought Iron", value: "metal" },
          { label: "Brass / Traditional", value: "brass" },
        ],
      },
    ],
  },

  hardware: {
    categoryId: "hardware",
    categoryName: "Home & Hardware",
    categorySlug: "hardware-electrical",
    subcategories: [
      {
        id: "electrical_plumbing",
        name: "Electrical & Plumbing",
        slug: "electrical-plumbing",
        productTypes: [
          { id: "led_bulbs_switches", name: "LED Bulbs, Switches & Wires", slug: "electrical-bulbs-switches", filters: [] },
          { id: "pipes_taps_plumbing", name: "Pipes, Taps & Plumbing Fittings", slug: "plumbing-pipes-taps", filters: [] },
          { id: "tools_hardware", name: "Tools, Screws, Locks & Adhesives", slug: "tools-hardware", filters: [] },
          { id: "paints_coatings", name: "Paint, Emulsion & Primer", slug: "paints", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "hardware_brand",
        name: "Brand",
        type: "multi_select",
        options: [
          { label: "Havells", value: "havells" },
          { label: "Anchor / Panasonic", value: "anchor" },
          { label: "Finolex", value: "finolex" },
          { label: "Asian Paints", value: "asian_paints" },
          { label: "Bosch Tools", value: "bosch" },
        ],
      },
    ],
  },

  pooja: {
    categoryId: "pooja",
    categoryName: "Pooja Stores",
    categorySlug: "pooja-stores",
    subcategories: [
      {
        id: "pooja_items",
        name: "Divine & Spiritual Goods",
        slug: "divine-goods",
        productTypes: [
          { id: "agarbatti_incense", name: "Agarbatti & Camphor", slug: "agarbatti-camphor", filters: [] },
          { id: "brass_lamps_diyas", name: "Brass Lamps & Diyas", slug: "brass-lamps-diyas", filters: [] },
          { id: "pooja_oil_kumkum", name: "Pooja Oil, Kumkum & Turmeric", slug: "pooja-oil-kumkum", filters: [] },
          { id: "idols_garlands", name: "Deity Idols & Garlands", slug: "idols-garlands", filters: [] },
          { id: "pooja_kits", name: "Festival Pooja Kits", slug: "pooja-kits", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "pooja_material",
        name: "Material",
        type: "chip_group",
        options: [
          { label: "Pure Brass", value: "brass" },
          { label: "Silver Plated", value: "silver" },
          { label: "Clay / Terracotta", value: "clay" },
          { label: "Handmade Organic", value: "organic" },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 📚 6. BOOKS, LEISURE & NEIGHBORHOOD SERVICES
  // ───────────────────────────────────────────────────────────────────────────
  books_stationery: {
    categoryId: "books_stationery",
    categoryName: "Books & Stationery",
    categorySlug: "books-stationery",
    subcategories: [
      {
        id: "books_academic",
        name: "Books & Exam Prep",
        slug: "books-exam-prep",
        productTypes: [
          { id: "school_college_books", name: "School & College Textbooks", slug: "textbooks", filters: [] },
          { id: "competitive_books", name: "Competitive Exam Books (TNPSC, NEET)", slug: "competitive-books", filters: [] },
          { id: "novels_children", name: "Novels & Children's Books", slug: "novels-children-books", filters: [] },
        ],
      },
      {
        id: "stationery_supplies",
        name: "Stationery & Office Supplies",
        slug: "stationery-supplies",
        productTypes: [
          { id: "notebooks_diaries", name: "Notebooks & Diaries", slug: "notebooks-diaries", filters: [] },
          { id: "pens_art_supplies", name: "Pens, Pencils & Art Supplies", slug: "pens-art-supplies", filters: [] },
          { id: "office_files_paper", name: "Office Files & Printing Paper", slug: "office-files-paper", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "language_filter",
        name: "Language",
        type: "chip_group",
        options: [
          { label: "Tamil (தமிழ்)", value: "tamil" },
          { label: "English", value: "english" },
        ],
      },
    ],
  },

  sports: {
    categoryId: "sports",
    categoryName: "Sports & Fitness",
    categorySlug: "sports-fitness",
    subcategories: [
      {
        id: "sports_gear",
        name: "Sports Goods & Equipment",
        slug: "sports-goods",
        productTypes: [
          { id: "cricket_gear", name: "Cricket Bats & Gear", slug: "cricket", filters: [] },
          { id: "badminton_tennis", name: "Badminton & Rackets", slug: "badminton", filters: [] },
          { id: "football_volleyball", name: "Football, Volleyball & Basketball", slug: "team-sports", filters: [] },
          { id: "gym_fitness_equip", name: "Dumbbells & Gym Equipment", slug: "gym-equipment", filters: [] },
          { id: "sportswear_wear", name: "Sportswear & Fitness Accessories", slug: "sportswear", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "sport_name",
        name: "Sport",
        type: "chip_group",
        options: [
          { label: "Cricket 🏏", value: "cricket" },
          { label: "Badminton 🏸", value: "badminton" },
          { label: "Gym & Fitness 🏋️", value: "gym" },
          { label: "Football ⚽", value: "football" },
        ],
      },
    ],
  },

  toys: {
    categoryId: "toys",
    categoryName: "Toys & Baby",
    categorySlug: "toys-baby",
    subcategories: [
      {
        id: "baby_toys_dept",
        name: "Toys & Baby Products",
        slug: "toys-baby-products",
        productTypes: [
          { id: "baby_clothes_diapers", name: "Baby Clothes & Diapers", slug: "baby-diapers-clothes", filters: [] },
          { id: "educational_toys", name: "Educational & Puzzles", slug: "educational-toys", filters: [] },
          { id: "rc_cars_dolls", name: "Remote Control Cars & Dolls", slug: "rc-cars-dolls", filters: [] },
          { id: "outdoor_baby_toys", name: "Outdoor Toys & Tricycles", slug: "outdoor-toys", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "age_group",
        name: "Age Group",
        type: "chip_group",
        options: [
          { label: "0 - 2 Years (Infant)", value: "0_2" },
          { label: "2 - 5 Years (Toddler)", value: "2_5" },
          { label: "5 - 10 Years", value: "5_10" },
          { label: "10+ Years", value: "10_plus" },
        ],
      },
    ],
  },

  gifts: {
    categoryId: "gifts",
    categoryName: "Gift Shops",
    categorySlug: "gift-shops",
    subcategories: [
      {
        id: "gift_items_dept",
        name: "Gifts & Novelties",
        slug: "gifts-novelties",
        productTypes: [
          { id: "birthday_wedding_gifts", name: "Birthday & Wedding Gifts", slug: "birthday-wedding-gifts", filters: [] },
          { id: "photo_frames_mugs", name: "Custom Photo Frames & Mugs", slug: "frames-mugs", filters: [] },
          { id: "greeting_cards_soft_toys", name: "Greeting Cards & Soft Toys", slug: "cards-soft-toys", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "gift_occasion",
        name: "Occasion",
        type: "chip_group",
        options: [
          { label: "Birthday 🎂", value: "birthday" },
          { label: "Wedding / Anniversary 💍", value: "wedding" },
          { label: "Personalized Special ✨", value: "personalized" },
        ],
      },
    ],
  },

  flowers: {
    categoryId: "flowers",
    categoryName: "Flower Shops",
    categorySlug: "flower-shops",
    subcategories: [
      {
        id: "floral_arrangements",
        name: "Flowers & Garlands",
        slug: "flowers-garlands",
        productTypes: [
          { id: "jasmine_garlands", name: "Jasmine Garlands (Mullai/Malli)", slug: "jasmine-garlands", filters: [] },
          { id: "puja_wedding_flowers", name: "Pooja & Wedding Flowers", slug: "puja-flowers", filters: [] },
          { id: "bouquets_baskets", name: "Rose Bouquets & Flower Baskets", slug: "bouquets", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "flower_type",
        name: "Flower Variety",
        type: "chip_group",
        options: [
          { label: "Madurai Malli / Jasmine", value: "jasmine" },
          { label: "Rose", value: "rose" },
          { label: "Lotus / Marigold", value: "marigold" },
        ],
      },
    ],
  },

  pet_shops: {
    categoryId: "pet_shops",
    categoryName: "Pet Shops",
    categorySlug: "pet-shops",
    subcategories: [
      {
        id: "pet_supplies",
        name: "Pet Food & Supplies",
        slug: "pet-supplies",
        productTypes: [
          { id: "dog_cat_food", name: "Dog & Cat Food & Treats", slug: "dog-cat-food", filters: [] },
          { id: "pet_toys_beds", name: "Pet Toys, Beds & Collars", slug: "pet-toys-accessories", filters: [] },
          { id: "aquarium_fish_food", name: "Aquarium Supplies & Fish Food", slug: "aquarium-fish-food", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "pet_type",
        name: "Pet Type",
        type: "chip_group",
        options: [
          { label: "Dog 🐶", value: "dog" },
          { label: "Cat 🐱", value: "cat" },
          { label: "Fish / Aquarium 🐠", value: "fish" },
          { label: "Birds 🦜", value: "bird" },
        ],
      },
    ],
  },

  repair: {
    categoryId: "repair",
    categoryName: "Repair Shops",
    categorySlug: "repair-shops",
    subcategories: [
      {
        id: "repair_services",
        name: "Local Service & Repairs",
        slug: "local-repairs",
        productTypes: [
          { id: "mobile_laptop_repair", name: "Mobile & Laptop Repair", slug: "mobile-laptop-repair", filters: [] },
          { id: "appliance_repair", name: "TV, Fridge, AC & Washing Machine Repair", slug: "appliance-repair", filters: [] },
          { id: "stove_mixer_repair", name: "Gas Stove, Mixer & Watch Repair", slug: "stove-mixer-repair", filters: [] },
          { id: "electrical_plumbing_service", name: "Electrical & Plumbing On-Site Repair", slug: "electrical-plumbing-repair", filters: [] },
          { id: "bike_car_repair", name: "Bike & Car Repair Mechanics", slug: "bike-car-repair", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "service_delivery_mode",
        name: "Service Mode",
        type: "chip_group",
        options: [
          { label: "Home Pickup & Delivery 🚚", value: "pickup_delivery" },
          { label: "On-Site Home Service 🏡", value: "onsite" },
          { label: "Shop Walk-in", value: "walkin" },
          { label: "Emergency Express Service ⚡", value: "emergency" },
        ],
      },
    ],
  },

  local_services: {
    categoryId: "local_services",
    categoryName: "Local Services",
    categorySlug: "local-services",
    subcategories: [
      {
        id: "neighborhood_services",
        name: "Printing & Neighborhood Services",
        slug: "printing-neighborhood-services",
        productTypes: [
          { id: "xerox_printing", name: "Xerox, Color Printing & DTP", slug: "xerox-printing", filters: [] },
          { id: "lamination_binding", name: "Lamination & Binding", slug: "lamination-binding", filters: [] },
          { id: "passport_photos", name: "Passport Photos", slug: "passport-photos", filters: [] },
          { id: "key_duplication", name: "Key Duplication", slug: "key-duplication", filters: [] },
          { id: "tailoring_embroidery", name: "Tailoring & Alterations", slug: "tailoring-alterations", filters: [] },
        ],
      },
    ],
    categoryFilters: [
      {
        id: "service_speed",
        name: "Turnaround Time",
        type: "chip_group",
        options: [
          { label: "Same-Day Instant ⚡", value: "same_day" },
          { label: "Home Pickup / Delivery 🛵", value: "delivery" },
        ],
      },
    ],
  },
};

/**
 * Helper function to retrieve the full taxonomy for a given category ID or slug
 */
export function getCategoryTaxonomy(categoryIdOrSlug?: string | null): CategoryTaxonomy {
  if (!categoryIdOrSlug || categoryIdOrSlug === "all" || categoryIdOrSlug === "all-shops") {
    return CATEGORY_TAXONOMIES.all;
  }
  const key = categoryIdOrSlug.toLowerCase().trim().replace("-", "_");
  return CATEGORY_TAXONOMIES[key] || CATEGORY_TAXONOMIES[categoryIdOrSlug] || CATEGORY_TAXONOMIES.all;
}
