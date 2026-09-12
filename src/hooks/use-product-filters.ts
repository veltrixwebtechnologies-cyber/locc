import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type ProductFilterState, type FilteredProduct, type FacetResult } from "@/lib/filter-types";

// Module-level circuit breaker and in-memory cache for ultra-fast response
let isProductRpcUnavailable = false;
let isFacetRpcUnavailable = false;
let cachedCatalogRows: FilteredProduct[] | null = null;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("RPC_TIMEOUT")), timeoutMs);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export function useProductFilters(filterState: ProductFilterState) {
  const productsQuery = useQuery<{ products: FilteredProduct[]; total: number }>({
    queryKey: ["filter-products", filterState],
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    retry: false,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      if (!isProductRpcUnavailable) {
        try {
          const rpcPromise = (supabase as any).rpc("filter_marketplace_products", {
            p_category_slug: filterState.category ?? null,
            p_subcategory_slug: filterState.subcategory ?? null,
            p_product_type_slug: filterState.productType ?? null,
            p_query: filterState.query ?? null,
            p_min_price: filterState.minPrice ?? null,
            p_max_price: filterState.maxPrice ?? null,
            p_min_rating: filterState.minRating ?? null,
            p_in_stock: filterState.inStock ?? null,
            p_on_sale: filterState.onSale ?? null,
            p_open_now: filterState.openNow ?? null,
            p_brand_names: filterState.brands.length > 0 ? filterState.brands : null,
            p_shop_ids: filterState.shopIds.length > 0 ? filterState.shopIds : null,
            p_attributes: filterState.attributes && Object.keys(filterState.attributes).length > 0 ? filterState.attributes : {},
            p_sort_by: filterState.sortBy || "relevance",
            p_limit: 24,
            p_offset: ((filterState.page || 1) - 1) * 24,
          });

          const { data, error } = (await withTimeout(rpcPromise, 800)) as any;

          if (error) {
            console.warn("RPC filter_marketplace_products unavailable:", error);
            isProductRpcUnavailable = true;
          } else if (data) {
            const products = (data as FilteredProduct[]) || [];
            const total = products.length > 0 ? Number(products[0].total_count) : 0;
            return { products, total };
          }
        } catch (err) {
          console.warn("RPC filter_marketplace_products timed out/failed:", err);
          isProductRpcUnavailable = true;
        }
      }

      return await fallbackMerchandisingProducts(filterState);
    },
  });

  const facetsQuery = useQuery<FacetResult>({
    queryKey: ["filter-facets", filterState.category, filterState.query, filterState.minPrice, filterState.maxPrice, filterState.brands, filterState.attributes],
    staleTime: 1000 * 60 * 5,
    retry: false,
    queryFn: async () => {
      if (!isFacetRpcUnavailable) {
        try {
          const rpcPromise = (supabase as any).rpc("get_marketplace_facets", {
            p_category_slug: filterState.category ?? null,
            p_subcategory_slug: filterState.subcategory ?? null,
            p_product_type_slug: filterState.productType ?? null,
            p_query: filterState.query ?? null,
            p_min_price: filterState.minPrice ?? null,
            p_max_price: filterState.maxPrice ?? null,
            p_brand_names: filterState.brands.length > 0 ? filterState.brands : null,
            p_attributes: filterState.attributes || {},
          });

          const { data, error } = (await withTimeout(rpcPromise, 800)) as any;

          if (error) {
            isFacetRpcUnavailable = true;
          } else if (data) {
            return (data as FacetResult) || defaultFacetResult();
          }
        } catch (err) {
          isFacetRpcUnavailable = true;
        }
      }
      return defaultFacetResult();
    },
  });

  return {
    products: productsQuery.data?.products ?? [],
    total: productsQuery.data?.total ?? 0,
    loading: productsQuery.isLoading,
    isFetching: productsQuery.isFetching,
    error: productsQuery.error,
    facets: facetsQuery.data ?? defaultFacetResult(),
    facetsLoading: facetsQuery.isLoading,
    refetch: productsQuery.refetch,
  };
}

function defaultFacetResult(): FacetResult {
  return {
    min_price: 0,
    max_price: 10000,
    total_products: 0,
    brand_facets: [],
    shop_facets: [],
    attributes: {},
  };
}

const MOCK_MERCHANDISING_CATALOG: FilteredProduct[] = [
  // ── 1. Fashion & Clothing ──────────────────────────────────────────────────
  {
    id: "prod-tshirt-1",
    seller_id: "seller-fashion-1",
    name: "Men Oversized Cotton T-Shirt",
    sku: "TSHIRT-NIKE-01",
    brand: "Nike",
    brand_id: "brand-nike",
    brand_name: "Nike",
    category: "Fashion & Clothing",
    category_id: "cat-fashion",
    subcategory_id: null,
    product_type_id: null,
    description: "Premium heavy-weight 240 GSM pure cotton oversized crewneck t-shirt.",
    mrp: 1499,
    selling_price: 799,
    discount_price: 799,
    stock: 25,
    image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "250g",
    attributes: { color: ["Black", "Blue"], size: ["M", "L", "XL"], fabric: "Cotton", fit: "Oversized" },
    shop_name: "Trendz Fashion Hub",
    distance_km: 0.8,
    rating: 4.8,
    review_count: 34,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },
  {
    id: "prod-tshirt-2",
    seller_id: "seller-fashion-1",
    name: "Classic Solid Crewneck T-Shirt",
    sku: "TSHIRT-ADI-02",
    brand: "Adidas",
    brand_id: "brand-adidas",
    brand_name: "Adidas",
    category: "Fashion & Clothing",
    category_id: "cat-fashion",
    subcategory_id: null,
    product_type_id: null,
    description: "Breathable sports performance cotton t-shirt with classic stripes.",
    mrp: 1299,
    selling_price: 699,
    discount_price: 699,
    stock: 18,
    image_url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "200g",
    attributes: { color: ["White", "Black"], size: ["S", "M", "L"], fabric: "Cotton", fit: "Regular" },
    shop_name: "Kovai Sports & Readymades",
    distance_km: 1.2,
    rating: 4.6,
    review_count: 19,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },
  {
    id: "prod-tshirt-3",
    seller_id: "seller-fashion-2",
    name: "Polo Collar Slim Fit T-Shirt",
    sku: "TSHIRT-PUMA-03",
    brand: "Puma",
    brand_id: "brand-puma",
    brand_name: "Puma",
    category: "Fashion & Clothing",
    category_id: "cat-fashion",
    subcategory_id: null,
    product_type_id: null,
    description: "Smart casual polo collar t-shirt with rib cuffs and button placket.",
    mrp: 1699,
    selling_price: 899,
    discount_price: 899,
    stock: 30,
    image_url: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "220g",
    attributes: { color: ["Blue", "Red"], size: ["M", "L", "XXL"], fabric: "Polyester", fit: "Slim" },
    shop_name: "Urban Style Menswear",
    distance_km: 2.1,
    rating: 4.7,
    review_count: 42,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },
  {
    id: "prod-tshirt-4",
    seller_id: "seller-fashion-2",
    name: "Graphic Printed Streetwear T-Shirt",
    sku: "TSHIRT-NIKE-04",
    brand: "Nike",
    brand_id: "brand-nike",
    brand_name: "Nike",
    category: "Fashion & Clothing",
    category_id: "cat-fashion",
    subcategory_id: null,
    product_type_id: null,
    description: "Trendy graphic print chest artwork relaxed fit streetwear t-shirt.",
    mrp: 1799,
    selling_price: 999,
    discount_price: 999,
    stock: 12,
    image_url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "230g",
    attributes: { color: ["Black", "White"], size: ["M", "L"], fabric: "Cotton", fit: "Oversized" },
    shop_name: "Trendz Fashion Hub",
    distance_km: 0.8,
    rating: 4.9,
    review_count: 57,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },
  {
    id: "prod-jeans-1",
    seller_id: "seller-fashion-1",
    name: "Slim Fit Stretch Denim Jeans",
    sku: "JEANS-LEVIS-01",
    brand: "Levi's",
    brand_id: "brand-levis",
    brand_name: "Levi's",
    category: "Fashion & Clothing",
    category_id: "cat-fashion",
    subcategory_id: null,
    product_type_id: null,
    description: "Classic blue stretch denim jeans with 5-pocket styling and durable stitching.",
    mrp: 3299,
    selling_price: 1999,
    discount_price: 1999,
    stock: 20,
    image_url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "600g",
    attributes: { color: ["Blue", "Black"], size: ["30", "32", "34"], fabric: "Denim", fit: "Slim" },
    shop_name: "Trendz Fashion Hub",
    distance_km: 0.8,
    rating: 4.8,
    review_count: 45,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },
  {
    id: "prod-saree-1",
    seller_id: "seller-boutique-1",
    name: "Kanchipuram Pure Silk Saree",
    sku: "SAREE-SILK-01",
    brand: "Vogue Handloom",
    brand_id: "brand-vogue",
    brand_name: "Vogue Handloom",
    category: "Boutiques",
    category_id: "cat-boutique",
    subcategory_id: null,
    product_type_id: null,
    description: "Handwoven pure Kanchipuram silk saree with rich zari pallu.",
    mrp: 14999,
    selling_price: 8499,
    discount_price: 8499,
    stock: 8,
    image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "800g",
    attributes: { color: ["Red", "Gold"], fabric: "Silk" },
    shop_name: "Vogue Handloom Silk Boutique",
    distance_km: 0.9,
    rating: 4.9,
    review_count: 28,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },

  // ── 2. Mobile & Electronics ────────────────────────────────────────────────
  {
    id: "prod-phone-1",
    seller_id: "seller-elec-1",
    name: "Galaxy 5G Smartphone 128GB",
    sku: "PHONE-SAMSUNG-01",
    brand: "Samsung",
    brand_id: "brand-samsung",
    brand_name: "Samsung",
    category: "Mobile & Accessories",
    category_id: "cat-mobile",
    subcategory_id: null,
    product_type_id: null,
    description: "6.7 inch AMOLED 120Hz display with 50MP camera and 5000mAh battery.",
    mrp: 24999,
    selling_price: 18999,
    discount_price: 18999,
    stock: 15,
    image_url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "190g",
    attributes: { ram: "8GB", storage: "128GB", network: "5G" },
    shop_name: "Premier Mobile World",
    distance_km: 1.5,
    rating: 4.8,
    review_count: 89,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },
  {
    id: "prod-phone-2",
    seller_id: "seller-elec-1",
    name: "iPhone 15 Pro 256GB",
    sku: "PHONE-APPLE-15",
    brand: "Apple",
    brand_id: "brand-apple",
    brand_name: "Apple",
    category: "Mobile & Accessories",
    category_id: "cat-mobile",
    subcategory_id: null,
    product_type_id: null,
    description: "Titanium design, A17 Pro chip, 48MP main camera with 3x optical zoom.",
    mrp: 134900,
    selling_price: 119900,
    discount_price: 119900,
    stock: 10,
    image_url: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "187g",
    attributes: { ram: "8GB", storage: "256GB", network: "5G" },
    shop_name: "Premier Mobile World",
    distance_km: 1.5,
    rating: 4.9,
    review_count: 142,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },
  {
    id: "prod-phone-3",
    seller_id: "seller-elec-1",
    name: "OnePlus Nord CE 3 5G 8GB/128GB",
    sku: "PHONE-ONEPLUS-03",
    brand: "OnePlus",
    brand_id: "brand-oneplus",
    brand_name: "OnePlus",
    category: "Mobile & Accessories",
    category_id: "cat-mobile",
    subcategory_id: null,
    product_type_id: null,
    description: "Snapdragon 782G processor, 80W SUPERVOOC charging, 50MP Sony IMX890 OIS camera.",
    mrp: 26999,
    selling_price: 22999,
    discount_price: 22999,
    stock: 22,
    image_url: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "184g",
    attributes: { ram: "8GB", storage: "128GB", network: "5G" },
    shop_name: "Poorvika Mobile Hub",
    distance_km: 0.8,
    rating: 4.7,
    review_count: 53,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },
  {
    id: "prod-phone-4",
    seller_id: "seller-elec-1",
    name: "Redmi Note 13 5G 6GB/128GB",
    sku: "PHONE-XIAOMI-13",
    brand: "Xiaomi",
    brand_id: "brand-xiaomi",
    brand_name: "Xiaomi",
    category: "Mobile & Accessories",
    category_id: "cat-mobile",
    subcategory_id: null,
    product_type_id: null,
    description: "Super slim 108MP 3X in-sensor zoom camera, 120Hz FHD+ AMOLED display.",
    mrp: 19999,
    selling_price: 15499,
    discount_price: 15499,
    stock: 28,
    image_url: "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "173g",
    attributes: { ram: "6GB", storage: "128GB", network: "5G" },
    shop_name: "Poorvika Mobile Hub",
    distance_km: 0.8,
    rating: 4.6,
    review_count: 67,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },
  {
    id: "prod-phone-5",
    seller_id: "seller-elec-1",
    name: "Realme 12 Pro+ 5G 12GB/256GB",
    sku: "PHONE-REALME-12",
    brand: "Realme",
    brand_id: "brand-realme",
    brand_name: "Realme",
    category: "Mobile & Accessories",
    category_id: "cat-mobile",
    subcategory_id: null,
    product_type_id: null,
    description: "64MP Periscope Portrait Camera, Luxury Watch Design with Snapdragon 7s Gen 2.",
    mrp: 34999,
    selling_price: 29999,
    discount_price: 29999,
    stock: 14,
    image_url: "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "196g",
    attributes: { ram: "12GB", storage: "256GB", network: "5G" },
    shop_name: "Premier Mobile World",
    distance_km: 1.5,
    rating: 4.8,
    review_count: 38,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },
  {
    id: "prod-phone-6",
    seller_id: "seller-elec-1",
    name: "Samsung Galaxy A15 4G 4GB/64GB",
    sku: "PHONE-SAMSUNG-A15",
    brand: "Samsung",
    brand_id: "brand-samsung",
    brand_name: "Samsung",
    category: "Mobile & Accessories",
    category_id: "cat-mobile",
    subcategory_id: null,
    product_type_id: null,
    description: "Super AMOLED 90Hz display, 50MP triple camera, Knox Security & 5000mAh battery.",
    mrp: 14999,
    selling_price: 11999,
    discount_price: 11999,
    stock: 20,
    image_url: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "200g",
    attributes: { ram: "4GB", storage: "64GB", network: "4G" },
    shop_name: "Poorvika Mobile Hub",
    distance_km: 0.8,
    rating: 4.5,
    review_count: 42,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },
  {
    id: "prod-earbuds-1",
    seller_id: "seller-elec-1",
    name: "Wireless Active Noise Cancelling Earbuds",
    sku: "EARBUDS-BOAT-01",
    brand: "boAt",
    brand_id: "brand-boat",
    brand_name: "boAt",
    category: "Mobile & Accessories",
    category_id: "cat-mobile",
    subcategory_id: null,
    product_type_id: null,
    description: "32dB ANC, 40 hours playback time, quad mics with ENx technology.",
    mrp: 3499,
    selling_price: 1499,
    discount_price: 1499,
    stock: 35,
    image_url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "45g",
    attributes: { color: ["Black"], network: "Bluetooth 5.3" },
    shop_name: "Premier Mobile World",
    distance_km: 1.5,
    rating: 4.6,
    review_count: 76,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },

  // ── 3. Grocery & Staples ───────────────────────────────────────────────────
  {
    id: "prod-groc-1",
    seller_id: "seller-groc-1",
    name: "Organic Sona Masoori Rice 5kg",
    sku: "RICE-ORGANIC-05",
    brand: "Organic India",
    brand_id: "brand-organic",
    brand_name: "Organic India",
    category: "Grocery",
    category_id: "cat-grocery",
    subcategory_id: null,
    product_type_id: null,
    description: "Unpolished pesticide-free organic Sona Masoori raw rice.",
    mrp: 550,
    selling_price: 450,
    discount_price: 450,
    stock: 50,
    image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "5kg",
    attributes: { pack_size: "5kg", organic: true, dietary: ["Vegetarian", "Vegan"] },
    shop_name: "Roja Organic Supermarket",
    distance_km: 0.6,
    rating: 4.9,
    review_count: 112,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },
  {
    id: "prod-groc-2",
    seller_id: "seller-groc-1",
    name: "Cold Pressed Pure Coconut Oil 1L",
    sku: "OIL-COCONUT-1L",
    brand: "Sri Selvamani",
    brand_id: "brand-selvamani",
    brand_name: "Sri Selvamani",
    category: "Grocery",
    category_id: "cat-grocery",
    subcategory_id: null,
    product_type_id: null,
    description: "100% natural wood-pressed marachekku coconut oil for cooking & hair care.",
    mrp: 340,
    selling_price: 280,
    discount_price: 280,
    stock: 40,
    image_url: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "1L",
    attributes: { pack_size: "1L", organic: true, dietary: ["Vegetarian", "Vegan"] },
    shop_name: "Sri Selvamani Flour & Masala Mill",
    distance_km: 0.4,
    rating: 4.9,
    review_count: 84,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },

  // ── 4. Bakery & Sweets ─────────────────────────────────────────────────────
  {
    id: "prod-bakery-1",
    seller_id: "seller-bakery-1",
    name: "Roja Special Pure Ghee Mysurpa 500g",
    sku: "SWEET-MYSURPA-500G",
    brand: "Roja Bakes",
    brand_id: "brand-roja",
    brand_name: "Roja Bakes",
    category: "Bakery & Sweets",
    category_id: "cat-bakery",
    subcategory_id: null,
    product_type_id: null,
    description: "Melt-in-mouth traditional pure cow ghee Mysurpa prepared fresh daily.",
    mrp: 400,
    selling_price: 340,
    discount_price: 340,
    stock: 30,
    image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "500g",
    attributes: { pack_size: "500g", dietary: ["Vegetarian"] },
    shop_name: "Roja Bakes & Sweets",
    distance_km: 0.4,
    rating: 4.9,
    review_count: 156,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },
  {
    id: "prod-bakery-2",
    seller_id: "seller-bakery-1",
    name: "Oven Fresh Chicken Puffs (Pack of 4)",
    sku: "PUFFS-CHICKEN-4P",
    brand: "Roja Bakes",
    brand_id: "brand-roja",
    brand_name: "Roja Bakes",
    category: "Bakery & Sweets",
    category_id: "cat-bakery",
    subcategory_id: null,
    product_type_id: null,
    description: "Flaky golden crust stuffed with spiced minced chicken masala.",
    mrp: 140,
    selling_price: 120,
    discount_price: 120,
    stock: 20,
    image_url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "400g",
    attributes: { pack_size: "4 Pcs" },
    shop_name: "Roja Bakes & Sweets",
    distance_km: 0.4,
    rating: 4.8,
    review_count: 98,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },

  // ── 5. Food & Restaurants ──────────────────────────────────────────────────
  {
    id: "prod-food-1",
    seller_id: "seller-food-1",
    name: "Chettinad Chicken Biryani Special",
    sku: "FOOD-BIRYANI-CHKN",
    brand: "Haribhavanam",
    brand_id: "brand-haribhavanam",
    brand_name: "Haribhavanam",
    category: "Food & Restaurants",
    category_id: "cat-food",
    subcategory_id: null,
    product_type_id: null,
    description: "Seeraga samba rice cooked with authentic Chettinad spices, tender chicken & egg.",
    mrp: 320,
    selling_price: 280,
    discount_price: 280,
    stock: 40,
    image_url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "750g",
    attributes: { food_type: "Non-Veg", cuisine: ["Biryani", "Chettinad", "South Indian"] },
    shop_name: "Haribhavanam Restaurant",
    distance_km: 0.8,
    rating: 4.9,
    review_count: 230,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },

  // ── 6. Footwear ────────────────────────────────────────────────────────────
  {
    id: "prod-shoes-1",
    seller_id: "seller-shoe-1",
    name: "Pro Cushion Running Shoes",
    sku: "SHOES-PUMA-01",
    brand: "Puma",
    brand_id: "brand-puma",
    brand_name: "Puma",
    category: "Footwear",
    category_id: "cat-footwear",
    subcategory_id: null,
    product_type_id: null,
    description: "Lightweight mesh upper with softfoam+ sockliner for ultimate running comfort.",
    mrp: 3999,
    selling_price: 2499,
    discount_price: 2499,
    stock: 15,
    image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "450g",
    attributes: { color: ["Black", "Grey"], size: ["8", "9", "10"] },
    shop_name: "Kovai Footwear Hub",
    distance_km: 1.6,
    rating: 4.7,
    review_count: 61,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },

  // ── 7. Furniture & Home Decor ──────────────────────────────────────────────
  {
    id: "prod-decor-1",
    seller_id: "seller-decor-1",
    name: "Handcrafted Brass Kuthu Vilakku Lamp",
    sku: "DECOR-LAMP-BRASS",
    brand: "Royal Brass",
    brand_id: "brand-royalbrass",
    brand_name: "Royal Brass",
    category: "Home & Kitchen",
    category_id: "cat-furniture",
    subcategory_id: null,
    product_type_id: null,
    description: "Traditional 5-face solid brass oil lamp for home puja and festive decor.",
    mrp: 1899,
    selling_price: 1299,
    discount_price: 1299,
    stock: 10,
    image_url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "1.2kg",
    attributes: { material: "Brass", style: "Traditional" },
    shop_name: "Royal Brass Agal & Lamps Emporium",
    distance_km: 4.0,
    rating: 4.9,
    review_count: 48,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },

  // ── 8. Fresh & Produce ──────────────────────────────────────────────────────
  {
    id: "prod-fresh-1",
    seller_id: "seller-fresh-1",
    name: "Farm Fresh Alphonso Mangoes (1 kg)",
    sku: "FRESH-MANGO-01",
    brand: "Palamuthir",
    brand_id: "brand-palamuthir",
    brand_name: "Palamuthir",
    category: "Fresh",
    category_id: "cat-fresh",
    subcategory_id: null,
    product_type_id: null,
    description: "Sweet, juicy organic Alphonso mangoes fresh from local orchards.",
    mrp: 240,
    selling_price: 180,
    discount_price: 180,
    stock: 40,
    image_url: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "1kg",
    attributes: { organic: true },
    shop_name: "Kovai Pazhamudir Nilayam",
    distance_km: 0.5,
    rating: 4.9,
    review_count: 112,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },
  {
    id: "prod-fresh-2",
    seller_id: "seller-fresh-1",
    name: "Fresh Red Pomegranate & Tender Coconut",
    sku: "FRESH-POM-02",
    brand: "Palamuthir",
    brand_id: "brand-palamuthir",
    brand_name: "Palamuthir",
    category: "Fresh",
    category_id: "cat-fresh",
    subcategory_id: null,
    product_type_id: null,
    description: "Ruby red sweet pomegranates rich in antioxidants.",
    mrp: 230,
    selling_price: 190,
    discount_price: 190,
    stock: 30,
    image_url: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "1kg",
    attributes: { organic: true },
    shop_name: "Green Farm Organic Produce",
    distance_km: 0.6,
    rating: 4.8,
    review_count: 64,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },

  // ── 9. Meat & Fish ──────────────────────────────────────────────────────────
  {
    id: "prod-meat-1",
    seller_id: "seller-meat-1",
    name: "Tender Mutton Curry Cut (500g)",
    sku: "MEAT-MUTTON-01",
    brand: "Kongu Butchery",
    brand_id: "brand-kongu",
    brand_name: "Kongu Butchery",
    category: "Meat & Fish",
    category_id: "cat-meat",
    subcategory_id: null,
    product_type_id: null,
    description: "Freshly dressed tender goat mutton curry cut pieces.",
    mrp: 520,
    selling_price: 440,
    discount_price: 440,
    stock: 20,
    image_url: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "500g",
    attributes: {},
    shop_name: "Kongu Country Mutton & Chicken Stall",
    distance_km: 0.6,
    rating: 4.9,
    review_count: 88,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },
  {
    id: "prod-meat-2",
    seller_id: "seller-meat-1",
    name: "Fresh Seer Fish / Vanjaram Slices (500g)",
    sku: "MEAT-FISH-02",
    brand: "Kadalkani",
    brand_id: "brand-kadalkani",
    brand_name: "Kadalkani",
    category: "Meat & Fish",
    category_id: "cat-meat",
    subcategory_id: null,
    product_type_id: null,
    description: "Daily fresh sea-caught Vanjaram fish steak slices.",
    mrp: 680,
    selling_price: 580,
    discount_price: 580,
    stock: 15,
    image_url: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "500g",
    attributes: {},
    shop_name: "Kadalkani Fresh Fish & Seafood",
    distance_km: 1.5,
    rating: 4.8,
    review_count: 52,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },

  // ── 10. Beauty & Care ───────────────────────────────────────────────────────
  {
    id: "prod-beauty-1",
    seller_id: "seller-beauty-1",
    name: "Herbal Cold-Pressed Hair Oil (200ml)",
    sku: "BEAUTY-OIL-01",
    brand: "Nykaa Care",
    brand_id: "brand-nykaa",
    brand_name: "Nykaa Care",
    category: "Beauty & Care",
    category_id: "cat-beauty",
    subcategory_id: null,
    product_type_id: null,
    description: "Traditional herbal hair oil infused with amla, bhringraj, and neem.",
    mrp: 220,
    selling_price: 160,
    discount_price: 160,
    stock: 45,
    image_url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "200ml",
    attributes: { organic: true },
    shop_name: "Nykaa Beauty & Personal Care Hub",
    distance_km: 1.1,
    rating: 4.8,
    review_count: 73,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },
  {
    id: "prod-beauty-2",
    seller_id: "seller-beauty-1",
    name: "Organic Aloe & Neem Radiance Face Wash",
    sku: "BEAUTY-WASH-02",
    brand: "Nykaa Care",
    brand_id: "brand-nykaa",
    brand_name: "Nykaa Care",
    category: "Beauty & Care",
    category_id: "cat-beauty",
    subcategory_id: null,
    product_type_id: null,
    description: "Deep cleansing ayurvedic face wash for glowing, acne-free skin.",
    mrp: 250,
    selling_price: 180,
    discount_price: 180,
    stock: 35,
    image_url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "150ml",
    attributes: {},
    shop_name: "Nykaa Beauty & Personal Care Hub",
    distance_km: 1.1,
    rating: 4.7,
    review_count: 41,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },

  // ── 11. Pharmacy ───────────────────────────────────────────────────────────
  {
    id: "prod-pharm-1",
    seller_id: "seller-pharm-1",
    name: "Digital Pulse Oximeter & Heart Rate Monitor",
    sku: "PHARM-OXI-01",
    brand: "Care Wellness",
    brand_id: "brand-care",
    brand_name: "Care Wellness",
    category: "Pharmacy",
    category_id: "cat-pharmacy",
    subcategory_id: null,
    product_type_id: null,
    description: "Accurate fingertip oxygen saturation SpO2 and pulse monitor.",
    mrp: 999,
    selling_price: 450,
    discount_price: 450,
    stock: 25,
    image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "120g",
    attributes: {},
    shop_name: "Sri Lakshmi Medicals & Healthcare",
    distance_km: 0.2,
    rating: 4.9,
    review_count: 94,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },

  // ── 12. Kids & Sports ──────────────────────────────────────────────────────
  {
    id: "prod-sports-1",
    seller_id: "seller-sports-1",
    name: "Kashmir Willow Cricket Bat (Size 6)",
    sku: "SPORT-BAT-01",
    brand: "Champion Sports",
    brand_id: "brand-champion",
    brand_name: "Champion Sports",
    category: "Kids & Sports",
    category_id: "cat-sports",
    subcategory_id: null,
    product_type_id: null,
    description: "Handcrafted Kashmir willow cricket bat with durable rubber grip.",
    mrp: 1899,
    selling_price: 1150,
    discount_price: 1150,
    stock: 12,
    image_url: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "1.1kg",
    attributes: {},
    shop_name: "Champion Sports & Fitness",
    distance_km: 1.3,
    rating: 4.8,
    review_count: 36,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },
  {
    id: "prod-toys-1",
    seller_id: "seller-toys-1",
    name: "Wooden Educational Building Blocks Toy Set",
    sku: "TOY-BLOCKS-01",
    brand: "Little Angels",
    brand_id: "brand-angels",
    brand_name: "Little Angels",
    category: "Kids & Sports",
    category_id: "cat-toys",
    subcategory_id: null,
    product_type_id: null,
    description: "Non-toxic wooden geometric shape sorter building blocks for toddlers.",
    mrp: 899,
    selling_price: 499,
    discount_price: 499,
    stock: 18,
    image_url: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=600&q=75",
    images: [],
    weight: "600g",
    attributes: {},
    shop_name: "Little Angels Toys & Baby Care",
    distance_km: 0.7,
    rating: 4.9,
    review_count: 55,
    is_open: true,
    accepts_orders: true,
    total_count: 1,
  },
];

async function fallbackMerchandisingProducts(state: ProductFilterState): Promise<{ products: FilteredProduct[]; total: number }> {
  try {
    if (!cachedCatalogRows) {
      let rows: FilteredProduct[] = [];

      try {
        const fetchPromise = (supabase as any)
          .from("public_merchandising_products")
          .select("*")
          .order("created_at", { ascending: false });

        const { data } = (await withTimeout(fetchPromise, 1000)) as any;

        if (data && data.length > 0) {
          rows = data.map((p: any) => ({
            id: p.id,
            seller_id: p.seller_id,
            name: p.name,
            sku: p.sku || "",
            brand: p.brand || null,
            brand_id: p.brand_id || null,
            brand_name: p.brand_name || p.brand || null,
            category: p.category || "",
            category_id: p.category_id || null,
            subcategory_id: null,
            product_type_id: null,
            description: p.description || "",
            mrp: Number(p.mrp || p.selling_price),
            selling_price: Number(p.selling_price),
            discount_price: p.discount_price ? Number(p.discount_price) : null,
            stock: Number(p.stock || 10),
            image_url: p.image_url || "",
            images: p.images || [],
            weight: p.weight || null,
            attributes: p.attributes || p.specifications || {},
            shop_name: p.shop_name || "Local Shop",
            distance_km: 1.2,
            rating: Number(p.average_rating || 4.5),
            review_count: Number(p.review_count || 12),
            is_open: true,
            accepts_orders: true,
            total_count: 1,
          }));
        }
      } catch {
        // Ignore DB fetch errors on fallback
      }

      // Merge mock catalog if rows are sparse or missing matching queries
      const combinedMap = new Map<string, FilteredProduct>();
      for (const p of [...rows, ...MOCK_MERCHANDISING_CATALOG]) {
        if (!combinedMap.has(p.id)) combinedMap.set(p.id, p);
      }
      cachedCatalogRows = Array.from(combinedMap.values());
    }

    let list = [...cachedCatalogRows];

    // Category filter with robust category group alias matching across all 11 categories
    if (state.category && state.category !== "all" && state.category !== "all-shops") {
      const normCat = state.category.toLowerCase().replace(/[^a-z0-9]+/g, "");
      list = list.filter((p) => {
        if (!p.category) return false;
        const normProdCat = p.category.toLowerCase().replace(/[^a-z0-9]+/g, "");
        return (
          normProdCat.includes(normCat) ||
          normCat.includes(normProdCat) ||
          (normCat.includes("fashion") && (normProdCat.includes("fashion") || normProdCat.includes("boutique"))) ||
          ((normCat.includes("mobile") || normCat.includes("electronic")) && (normProdCat.includes("mobile") || normProdCat.includes("electronic"))) ||
          (normCat.includes("grocery") && normProdCat.includes("grocery")) ||
          (normCat.includes("bakery") && (normProdCat.includes("bakery") || normProdCat.includes("sweet"))) ||
          (normCat.includes("food") && (normProdCat.includes("food") || normProdCat.includes("restaurant"))) ||
          (normCat.includes("footwear") && normProdCat.includes("footwear")) ||
          ((normCat.includes("home") || normCat.includes("kitchen") || normCat.includes("furniture") || normCat.includes("decor")) &&
            (normProdCat.includes("home") || normProdCat.includes("kitchen") || normProdCat.includes("furniture") || normProdCat.includes("decor"))) ||
          ((normCat.includes("fresh") || normCat.includes("fruit") || normCat.includes("veg") || normCat.includes("palamuthir")) &&
            (normProdCat.includes("fresh") || normProdCat.includes("fruit") || normProdCat.includes("veg") || normProdCat.includes("produce"))) ||
          ((normCat.includes("meat") || normCat.includes("fish")) &&
            (normProdCat.includes("meat") || normProdCat.includes("fish") || normProdCat.includes("chicken") || normProdCat.includes("mutton") || normProdCat.includes("seafood"))) ||
          ((normCat.includes("pharmacy") || normCat.includes("medical")) &&
            (normProdCat.includes("pharmacy") || normProdCat.includes("medical") || normProdCat.includes("otc") || normProdCat.includes("wellness"))) ||
          (normCat.includes("beauty") && (normProdCat.includes("beauty") || normProdCat.includes("care") || normProdCat.includes("cosmetic"))) ||
          ((normCat.includes("toy") || normCat.includes("sport") || normCat.includes("kid") || normCat.includes("baby")) &&
            (normProdCat.includes("toy") || normProdCat.includes("sport") || normProdCat.includes("baby") || normProdCat.includes("kid"))) ||
          (normCat.includes("favorite") && p.rating >= 4.7)
        );
      });
    }

    // Subcategory filter (e.g. mens_wear, womens_wear, rice_grains, bakery)
    if (state.subcategory && state.subcategory.trim()) {
      const normSub = state.subcategory.toLowerCase().replace(/[^a-z0-9]+/g, "");
      list = list.filter((p) => {
        const fullText = `${p.name} ${p.category || ""} ${p.description || ""} ${JSON.stringify(p.attributes || {})}`.toLowerCase().replace(/[^a-z0-9]+/g, "");
        
        if (normSub.includes("men") && !normSub.includes("women")) {
          // Men's clothing: exclude explicit women's wear/sarees/kurtis
          return !fullText.includes("women") && !fullText.includes("saree") && !fullText.includes("kurti") && !fullText.includes("dress") && !fullText.includes("handloom");
        } else if (normSub.includes("women")) {
          return fullText.includes("women") || fullText.includes("saree") || fullText.includes("kurti") || fullText.includes("dress");
        } else {
          const stemmedSub = normSub.replace(/wear|clothing|apparel|store|shops|shop/g, "");
          return fullText.includes(normSub) || (stemmedSub.length >= 3 && fullText.includes(stemmedSub));
        }
      });
    }

    // Product Type filter (e.g. tshirts / t-shirts -> matches T-Shirts, crewnecks, polos, excludes Jeans, Sarees, Shoes)
    if (state.productType && state.productType.trim()) {
      const normPt = state.productType.toLowerCase().replace(/[^a-z0-9]+/g, "");
      list = list.filter((p) => {
        const nameLower = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "");
        const attrStr = JSON.stringify(p.attributes || {}).toLowerCase().replace(/[^a-z0-9]+/g, "");
        const descLower = (p.description || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

        if (normPt.includes("tshirt") || normPt.includes("t-shirt") || normPt.includes("tee")) {
          return (
            nameLower.includes("tshirt") || nameLower.includes("tee") || nameLower.includes("crewneck") || nameLower.includes("polo") ||
            attrStr.includes("tshirt") || descLower.includes("tshirt")
          );
        } else if (normPt.includes("jean") || normPt.includes("denim")) {
          return nameLower.includes("jean") || nameLower.includes("denim");
        } else if (normPt.includes("saree") || normPt.includes("silk")) {
          return nameLower.includes("saree") || nameLower.includes("silk");
        } else if (normPt.includes("shirt")) {
          return nameLower.includes("shirt");
        } else {
          const stemmedPt = normPt.endsWith("s") && normPt.length > 3 ? normPt.slice(0, -1) : normPt;
          return (
            nameLower.includes(normPt) || nameLower.includes(stemmedPt) ||
            attrStr.includes(normPt) || attrStr.includes(stemmedPt) ||
            descLower.includes(normPt) || descLower.includes(stemmedPt)
          );
        }
      });
    }

    // Flexible query matching (handles t-shirts / t-shirt / tshirt / tshirts / plurals)
    if (state.query && state.query.trim()) {
      const rawQ = state.query.trim().toLowerCase();
      const cleanQ = rawQ.replace(/[^a-z0-9]+/g, "");
      const tokens = rawQ
        .replace(/[^a-z0-9]+/g, " ")
        .split(" ")
        .filter(Boolean)
        .map((t) => (t.endsWith("s") && t.length > 3 ? t.slice(0, -1) : t)); // stemmed tokens

      list = list.filter((p) => {
        const targetText = `${p.name} ${p.brand || ""} ${p.category || ""} ${p.description || ""} ${JSON.stringify(p.attributes || {})}`.toLowerCase();
        const normTarget = targetText.replace(/[^a-z0-9]+/g, "");
        const targetTokens = targetText.replace(/[^a-z0-9]+/g, " ").split(" ").filter(Boolean);

        return (
          normTarget.includes(cleanQ) ||
          tokens.every((token) => targetTokens.some((tt) => tt.includes(token) || token.includes(tt)))
        );
      });
    }

    // Price filter
    if (state.minPrice !== undefined) {
      list = list.filter((p) => Number(p.discount_price ?? p.selling_price) >= state.minPrice!);
    }
    if (state.maxPrice !== undefined) {
      list = list.filter((p) => Number(p.discount_price ?? p.selling_price) <= state.maxPrice!);
    }

    // Brand filter
    if (state.brands && state.brands.length > 0) {
      const brandSet = new Set(state.brands.map((b) => b.toLowerCase()));
      list = list.filter((p) => p.brand && brandSet.has(p.brand.toLowerCase()));
    }

    // Dynamic Attribute filter
    if (state.attributes && Object.keys(state.attributes).length > 0) {
      for (const [attrKey, selectedVals] of Object.entries(state.attributes)) {
        if (!selectedVals || selectedVals.length === 0) continue;
        list = list.filter((p) => {
          const productAttr = p.attributes?.[attrKey];
          if (!productAttr) return false;
          if (Array.isArray(productAttr)) {
            return selectedVals.some((sv) => productAttr.includes(sv));
          }
          return selectedVals.includes(String(productAttr));
        });
      }
    }

    // Rating filter
    if (state.minRating !== undefined && state.minRating > 0) {
      list = list.filter((p) => p.rating >= state.minRating!);
    }

    // In Stock filter
    if (state.inStock || state.inStockOnly) {
      list = list.filter((p) => p.stock > 0);
    }

    // Shop & Location filters
    if (state.maxDistanceKm !== undefined && state.maxDistanceKm > 0) {
      list = list.filter((p) => (p.distance_km ?? 0) <= state.maxDistanceKm!);
    }

    if (state.openNowOnly) {
      list = list.filter((p) => p.is_open !== false);
    }

    if (state.localFavoriteOnly) {
      list = list.filter((p) => p.rating >= 4.7);
    }

    if (state.verifiedShopOnly) {
      list = list.filter((p) => p.rating >= 4.5);
    }

    const total = list.length;
    const offset = ((state.page || 1) - 1) * 24;
    const paginated = list.slice(offset, offset + 24).map((p) => ({ ...p, total_count: total }));

    return { products: paginated, total };
  } catch (err) {
    console.error("Critical fallback failed:", err);
    return { products: [], total: 0 };
  }
}
