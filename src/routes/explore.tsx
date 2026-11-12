import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Compass,
  MapPin,
  Star,
  Layers,
  ChevronRight,
  ShoppingCart,
  Check,
  Map as MapIcon,
  List,
  Sparkles,
  Store,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { SocialCommerceShell } from "@/components/social-commerce/social-commerce-shell";
import { ALL_CATEGORIES_LIST } from "@/components/social-commerce/shop-by-category-section";
import { useDeliveryLocation } from "@/lib/location-store";
import { isBengaluruLocation } from "@/lib/social-feed-data";
import { cartStore, useCart } from "@/modules/shopper/services/cart-store";
import { toast } from "sonner";

export const Route = createFileRoute("/explore")({
  component: ExplorePage,
});

export type ExploreCategoryGroup =
  | "food"
  | "grocery"
  | "fashion"
  | "health"
  | "bakery"
  | "electronics";

const EXPLORE_CATEGORIES: { id: "all" | ExploreCategoryGroup; label: string }[] = [
  { id: "all", label: "All" },
  { id: "food", label: "Food" },
  { id: "grocery", label: "Grocery" },
  { id: "fashion", label: "Fashion" },
  { id: "health", label: "Health" },
  { id: "bakery", label: "Bakery" },
  { id: "electronics", label: "Electronics" },
];

export interface VerifiedShopItem {
  id: string;
  name: string;
  category: string;
  categoryGroup: ExploreCategoryGroup;
  rating: number;
  distanceKm: number;
  isOpen: boolean;
  address: string;
  image: string;
  tags: string[];
}

const VERIFIED_SHOPS: VerifiedShopItem[] = [
  // ── Health ──
  {
    id: "s_kovilmedu_medicals",
    name: "Kovilmedu Care Medicals & Chemist",
    category: "Individual Pharmacy",
    categoryGroup: "health",
    rating: 4.8,
    distanceKm: 0.2,
    isOpen: true,
    address: "Junction Arch, Kovilmedu, Coimbatore",
    image:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&q=80",
    tags: ["24/7 Chemist", "OTC Medicines", "Baby Care"],
  },
  {
    id: "s_apollo_ramnagar",
    name: "Apollo Pharmacy & Health Store",
    category: "Pharmacy & Wellness",
    categoryGroup: "health",
    rating: 4.9,
    distanceKm: 1.2,
    isOpen: true,
    address: "Ram Nagar, Gandhipuram, Coimbatore",
    image:
      "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=400&q=80",
    tags: ["Prescription Drugs", "Wellness", "First Aid"],
  },
  {
    id: "s_ayur_wellness",
    name: "AyurSanjeevi Herbal & Healthcare",
    category: "Ayurveda & Wellness",
    categoryGroup: "health",
    rating: 4.8,
    distanceKm: 0.9,
    isOpen: true,
    address: "DB Road, RS Puram, Coimbatore",
    image:
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=400&q=80",
    tags: ["Immunity Kadha", "Organic Oils", "Supplements"],
  },

  // ── Bakery ──
  {
    id: "s_roja_bakes",
    name: "Roja Bakes & Sweets",
    category: "Bakery & Sweets",
    categoryGroup: "bakery",
    rating: 4.9,
    distanceKm: 0.3,
    isOpen: true,
    address: "Thadagam Main Road, Kovilmedu, Coimbatore",
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
    tags: ["Fresh Bread", "Mysurpa", "Chicken Puffs"],
  },
  {
    id: "s_paap1",
    name: "Ravi's Artisan Bakery",
    category: "Bakery & Sweets",
    categoryGroup: "bakery",
    rating: 4.8,
    distanceKm: 0.9,
    isOpen: true,
    address: "Diwan Bahadur Road, RS Puram, Coimbatore",
    image: "/assets/ravis-sourdough-hero.jpg",
    tags: ["Artisan Sourdough", "Croissant", "Cakes"],
  },
  {
    id: "s_cream_corner",
    name: "Cream Corner Pastry Studio",
    category: "Bakery & Pastries",
    categoryGroup: "bakery",
    rating: 4.7,
    distanceKm: 1.5,
    isOpen: true,
    address: "Race Course Road, Coimbatore",
    image:
      "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=400&q=80",
    tags: ["Plum Cakes", "Chocolate Mousse", "Cookies"],
  },

  // ── Grocery ──
  {
    id: "s_kovil_super",
    name: "Kovilmedu Supermarket & Kirana",
    category: "Kirana & Grocery",
    categoryGroup: "grocery",
    rating: 4.8,
    distanceKm: 0.4,
    isOpen: true,
    address: "Opp. Kovilmedu Arch, Thadagam Road, Coimbatore",
    image:
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=400&q=80",
    tags: ["Daily Ration", "Cooking Oil", "Pulses"],
  },
  {
    id: "s_amman_flour",
    name: "Sri Amman Flour & Masala Mill",
    category: "Flour & Masala Mill",
    categoryGroup: "grocery",
    rating: 4.9,
    distanceKm: 0.3,
    isOpen: true,
    address: "Temple Street, Kovilmedu, Coimbatore",
    image:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
    tags: ["Idli Batter", "Sambar Powder", "Wheat Flour"],
  },
  {
    id: "s_kovil_pala",
    name: "Kovilmedu Organic Palamuthir Nilayam",
    category: "Palamuthir Nilayam",
    categoryGroup: "grocery",
    rating: 4.9,
    distanceKm: 0.5,
    isOpen: true,
    address: "Thadagam Road, Near Bus Stop, Kovilmedu, Coimbatore",
    image:
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80",
    tags: ["Tender Coconut", "Sirumalai Banana", "Veggies"],
  },
  {
    id: "s_kiran1",
    name: "Meena Fresh Produce",
    category: "Fruits & Vegetables",
    categoryGroup: "grocery",
    rating: 4.7,
    distanceKm: 1.6,
    isOpen: true,
    address: "NSR Road, Saibaba Colony, Coimbatore",
    image:
      "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80",
    tags: ["Salem Mangoes", "Organic Spinach", "Produce"],
  },
  {
    id: "s_groc2",
    name: "Kumar Stores Groceries",
    category: "Kirana & Grocery",
    categoryGroup: "grocery",
    rating: 4.6,
    distanceKm: 1.4,
    isOpen: true,
    address: "Cross Cut Road, Gandhipuram, Coimbatore",
    image:
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=400&q=80",
    tags: ["Cold-Pressed Oils", "Staples", "Provisions"],
  },

  // ── Food ──
  {
    id: "s_haribhavanam",
    name: "City Bites Kitchen (Haribhavanam)",
    category: "Restaurants & Dining",
    categoryGroup: "food",
    rating: 4.9,
    distanceKm: 0.8,
    isOpen: true,
    address: "Trichy Road, Sungam Junction, Coimbatore",
    image:
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80",
    tags: ["Seeraga Samba Biryani", "Chettinad", "Meals"],
  },
  {
    id: "s_kovil_meat",
    name: "Kongu Country Mutton & Chicken Stall",
    category: "Meat & Poultry",
    categoryGroup: "food",
    rating: 4.8,
    distanceKm: 0.6,
    isOpen: true,
    address: "Thadagam Main Road, Kovilmedu, Coimbatore",
    image:
      "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80",
    tags: ["Naattu Kozhi", "Fresh Mutton", "Farm Eggs"],
  },
  {
    id: "s_annapoorna",
    name: "Annapoorna Tiffin & Filter Coffee",
    category: "South Indian Dining",
    categoryGroup: "food",
    rating: 4.9,
    distanceKm: 0.7,
    isOpen: true,
    address: "DB Road, RS Puram, Coimbatore",
    image:
      "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80",
    tags: ["Ghee Roast Dosa", "Filter Coffee", "Sambar Vada"],
  },

  // ── Fashion ──
  {
    id: "s_kovil_cloth",
    name: "Kovilmedu Readymades & Menswear",
    category: "Individual Fashion",
    categoryGroup: "fashion",
    rating: 4.7,
    distanceKm: 0.6,
    isOpen: true,
    address: "Main Road, Kovilmedu, Coimbatore",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80",
    tags: ["Pure Cotton Dhoti", "Handloom Shirts", "Casuals"],
  },
  {
    id: "s_kovil_jewel",
    name: "Meenakshi Fashion Jewellery & Gifts",
    category: "Jewellery & Gifts",
    categoryGroup: "fashion",
    rating: 4.8,
    distanceKm: 0.5,
    isOpen: true,
    address: "Bazaar Street, Kovilmedu, Coimbatore",
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=400&q=80",
    tags: ["Temple Jhumkas", "Brass Diya", "Accessories"],
  },
  {
    id: "s_stylehub",
    name: "StyleHub Boutique & Apparel",
    category: "Fashion & Apparel",
    categoryGroup: "fashion",
    rating: 4.8,
    distanceKm: 1.1,
    isOpen: true,
    address: "100 Feet Road, Gandhipuram, Coimbatore",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=400&q=80",
    tags: ["Ethnic Kurtis", "Denim Wear", "Linen Shirts"],
  },

  // ── Electronics ──
  {
    id: "s_electroworld",
    name: "ElectroWorld Gadgets & Mobiles",
    category: "Smart Electronics & Audio",
    categoryGroup: "electronics",
    rating: 4.8,
    distanceKm: 0.7,
    isOpen: true,
    address: "Cross Cut Road, Gandhipuram, Coimbatore",
    image:
      "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80",
    tags: ["Smartphones", "Wireless Audio", "Smartwatches"],
  },
  {
    id: "s_kovai_mobiles",
    name: "Kovai Mobile Hub & Service Center",
    category: "Mobile & Tech Care",
    categoryGroup: "electronics",
    rating: 4.9,
    distanceKm: 0.8,
    isOpen: true,
    address: "DB Road, RS Puram, Coimbatore",
    image:
      "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=400&q=80",
    tags: ["Screen Guards", "Fast Chargers", "Repairs"],
  },
  {
    id: "s_tech_zone",
    name: "Supreme Digital & Smart Electronics",
    category: "Electronics & Computing",
    categoryGroup: "electronics",
    rating: 4.7,
    distanceKm: 1.1,
    isOpen: true,
    address: "100 Feet Road, Tatabad, Coimbatore",
    image:
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=400&q=80",
    tags: ["Bluetooth Speakers", "Earbuds", "Laptop Accessories"],
  },
];

export interface TrendingProductItem {
  id: string;
  name: string;
  storeId: string;
  storeName: string;
  price: number;
  mrp?: number;
  unit: string;
  categoryGroup: ExploreCategoryGroup;
  image: string;
}

const TRENDING_PRODUCTS: TrendingProductItem[] = [
  // ── Electronics ──
  {
    id: "prod_earbuds_1",
    name: "Wireless ANC Bluetooth Earbuds",
    storeId: "s_electroworld",
    storeName: "ElectroWorld",
    price: 1499,
    mrp: 2999,
    unit: "1 pair",
    categoryGroup: "electronics",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod_charger_1",
    name: "65W GaN Dual-Port Fast Charger",
    storeId: "s_kovai_mobiles",
    storeName: "Kovai Mobile Hub",
    price: 699,
    mrp: 1299,
    unit: "1 pc",
    categoryGroup: "electronics",
    image:
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod_smartwatch_1",
    name: "Fitness Smartwatch with AMOLED",
    storeId: "s_tech_zone",
    storeName: "Supreme Digital",
    price: 1999,
    mrp: 3499,
    unit: "1 pc",
    categoryGroup: "electronics",
    image:
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod_speaker_1",
    name: "Portable Waterproof Bass Speaker",
    storeId: "s_electroworld",
    storeName: "ElectroWorld",
    price: 1199,
    mrp: 1899,
    unit: "1 pc",
    categoryGroup: "electronics",
    image:
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=400&q=80",
  },

  // ── Food ──
  {
    id: "prod_biryani_1",
    name: "Seeraga Samba Mutton Biryani",
    storeId: "s_haribhavanam",
    storeName: "City Bites Kitchen",
    price: 280,
    mrp: 320,
    unit: "1 pack",
    categoryGroup: "food",
    image:
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod_dosa_1",
    name: "Crispy Ghee Roast Dosa Set",
    storeId: "s_annapoorna",
    storeName: "Annapoorna Tiffin",
    price: 95,
    mrp: 110,
    unit: "1 plate",
    categoryGroup: "food",
    image:
      "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod_chicken_1",
    name: "Naattu Kozhi Pepper Roast",
    storeId: "s_kovil_meat",
    storeName: "Kongu Country Stall",
    price: 220,
    mrp: 260,
    unit: "400g",
    categoryGroup: "food",
    image:
      "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80",
  },

  // ── Grocery ──
  {
    id: "prod_oil_1",
    name: "Cold-Pressed Coconut Oil",
    storeId: "s_groc2",
    storeName: "Kumar Stores",
    price: 260,
    mrp: 290,
    unit: "1L",
    categoryGroup: "grocery",
    image:
      "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod_mango_1",
    name: "Salem Alphonso Mango",
    storeId: "s_kiran1",
    storeName: "Meena Fresh",
    price: 220,
    mrp: 250,
    unit: "1 kg",
    categoryGroup: "grocery",
    image:
      "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod_batter_1",
    name: "Fresh Stone-Ground Idli Batter",
    storeId: "s_amman_flour",
    storeName: "Sri Amman Flour Mill",
    price: 60,
    mrp: 75,
    unit: "1 kg",
    categoryGroup: "grocery",
    image:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
  },

  // ── Fashion ──
  {
    id: "prod_tshirt_1",
    name: "Bio-Washed Cotton Tee",
    storeId: "s_stylehub",
    storeName: "StyleHub Apparel",
    price: 499,
    mrp: 699,
    unit: "piece",
    categoryGroup: "fashion",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod_dhoti_1",
    name: "Traditional Pure Cotton Dhoti",
    storeId: "s_kovil_cloth",
    storeName: "Kovilmedu Readymades",
    price: 399,
    mrp: 549,
    unit: "piece",
    categoryGroup: "fashion",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod_jhumka_1",
    name: "Temple Antique Jhumka Set",
    storeId: "s_kovil_jewel",
    storeName: "Meenakshi Jewellery",
    price: 299,
    mrp: 450,
    unit: "1 pair",
    categoryGroup: "fashion",
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=400&q=80",
  },

  // ── Health ──
  {
    id: "prod_vitaminc_1",
    name: "Vitamin C & Zinc Chewables",
    storeId: "s_kovilmedu_medicals",
    storeName: "Kovilmedu Medicals",
    price: 210,
    mrp: 260,
    unit: "60 tabs",
    categoryGroup: "health",
    image:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod_vaporizer_1",
    name: "Steam Inhaler Vaporizer Device",
    storeId: "s_apollo_ramnagar",
    storeName: "Apollo Pharmacy",
    price: 340,
    mrp: 450,
    unit: "1 unit",
    categoryGroup: "health",
    image:
      "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod_kadha_1",
    name: "Ayurvedic Immunity Herbal Tea",
    storeId: "s_ayur_wellness",
    storeName: "AyurSanjeevi Wellness",
    price: 160,
    mrp: 199,
    unit: "100g",
    categoryGroup: "health",
    image:
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=400&q=80",
  },

  // ── Bakery ──
  {
    id: "prod_sourdough_1",
    name: "Artisan Sourdough Loaf",
    storeId: "s_paap1",
    storeName: "Ravi's Bakery",
    price: 180,
    mrp: 200,
    unit: "loaf",
    categoryGroup: "bakery",
    image: "/assets/ravis-sourdough-hero.jpg",
  },
  {
    id: "prod_croissant_1",
    name: "Flaky Golden Butter Croissant",
    storeId: "s_paap1",
    storeName: "Ravi's Bakery",
    price: 70,
    mrp: 85,
    unit: "1 pc",
    categoryGroup: "bakery",
    image:
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod_mysurpa_1",
    name: "Special Pure Ghee Mysurpa",
    storeId: "s_roja_bakes",
    storeName: "Roja Bakes",
    price: 140,
    mrp: 160,
    unit: "250g",
    categoryGroup: "bakery",
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
  },
];

const BENGALURU_VERIFIED_SHOPS: VerifiedShopItem[] = [
  // ── Food ──
  {
    id: "s_jp_dining",
    name: "City Bites Kitchen & Mess (JP Nagar)",
    category: "Restaurants & Dining",
    categoryGroup: "food",
    rating: 4.9,
    distanceKm: 0.4,
    isOpen: true,
    address: "14th Cross Rd, JP Nagar 2nd Phase, Bengaluru",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80",
    tags: ["Thatte Idli", "Filter Coffee", "Crispy Vada"],
  },
  {
    id: "s_slv_jp",
    name: "SLV Swadisht Tiffin Room",
    category: "South Indian Tiffin",
    categoryGroup: "food",
    rating: 4.8,
    distanceKm: 0.3,
    isOpen: true,
    address: "15th Main Road, JP Nagar 2nd Phase, Bengaluru",
    image:
      "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80",
    tags: ["Masala Dosa", "Filter Coffee", "Khara Bath"],
  },
  {
    id: "s_annapoorna_blr",
    name: "Annapoorna Tiffin & Meals - JP Nagar",
    category: "South Indian Dining",
    categoryGroup: "food",
    rating: 4.9,
    distanceKm: 0.5,
    isOpen: true,
    address: "24th Main Road, JP Nagar 2nd Phase, Bengaluru",
    image:
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80",
    tags: ["Ghee Podi Dosa", "Filter Coffee", "South Thali"],
  },

  // ── Health ──
  {
    id: "s_jp_medicals",
    name: "Apollo Pharmacy & Wellness - JP Nagar",
    category: "Individual Pharmacy",
    categoryGroup: "health",
    rating: 4.9,
    distanceKm: 0.2,
    isOpen: true,
    address: "15th Main Road, JP Nagar 2nd Phase, Bengaluru",
    image:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&q=80",
    tags: ["24/7 Chemist", "Prescriptions", "Baby Care"],
  },
  {
    id: "s_healthplus_jp",
    name: "HealthPlus Pharmacy & Healthcare",
    category: "Pharmacy & Wellness",
    categoryGroup: "health",
    rating: 4.8,
    distanceKm: 0.4,
    isOpen: true,
    address: "14th Cross Rd, JP Nagar 2nd Phase, Bengaluru",
    image:
      "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=400&q=80",
    tags: ["OTC Medicines", "Health Supplements", "First Aid"],
  },
  {
    id: "s_ayur_jp",
    name: "AyurSanjeevi Herbal Care - Bengaluru",
    category: "Ayurveda & Wellness",
    categoryGroup: "health",
    rating: 4.8,
    distanceKm: 0.6,
    isOpen: true,
    address: "24th Main Road, JP Nagar 2nd Phase, Bengaluru",
    image:
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=400&q=80",
    tags: ["Herbal Kadha", "Cold-Pressed Oils", "Organic Skin Care"],
  },

  // ── Bakery ──
  {
    id: "s_jp_bakery",
    name: "Ravi's Artisan Bakery (JP Nagar)",
    category: "Bakery & Sweets",
    categoryGroup: "bakery",
    rating: 4.9,
    distanceKm: 0.3,
    isOpen: true,
    address: "24th Main Road, JP Nagar 2nd Phase, Bengaluru",
    image:
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80",
    tags: ["Woodfired Sourdough", "Butter Croissant", "Dark Brownie"],
  },
  {
    id: "s_warm_oven_jp",
    name: "Warm Oven & Pastry Studio",
    category: "Bakery & Pastries",
    categoryGroup: "bakery",
    rating: 4.8,
    distanceKm: 0.5,
    isOpen: true,
    address: "15th Main Road, JP Nagar 2nd Phase, Bengaluru",
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
    tags: ["Fresh Breads", "Plum Cakes", "Choco Lava"],
  },
  {
    id: "s_iyengar_jp",
    name: "Bengaluru Iyengar Bakery",
    category: "Traditional Bakery",
    categoryGroup: "bakery",
    rating: 4.8,
    distanceKm: 0.4,
    isOpen: true,
    address: "14th Cross Rd, JP Nagar 2nd Phase, Bengaluru",
    image:
      "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=400&q=80",
    tags: ["Dilpasand", "Khara Biscuit", "Veg Puff"],
  },

  // ── Grocery ──
  {
    id: "s_jp_produce",
    name: "Namma Fresh Produce & Organics",
    category: "Fresh Produce",
    categoryGroup: "grocery",
    rating: 4.9,
    distanceKm: 0.4,
    isOpen: true,
    address: "Ring Road Junction, JP Nagar 2nd Phase, Bengaluru",
    image:
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80",
    tags: ["Alphonso Mango", "Fresh Greens", "Country Tomato"],
  },
  {
    id: "s_anand_jp",
    name: "Anand Kirana & Provision Store",
    category: "Kirana & Grocery",
    categoryGroup: "grocery",
    rating: 4.8,
    distanceKm: 0.3,
    isOpen: true,
    address: "15th Main Road, JP Nagar 2nd Phase, Bengaluru",
    image:
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=400&q=80",
    tags: ["Cold-Pressed Oils", "Staples", "Daily Provisions"],
  },
  {
    id: "s_jp_mill",
    name: "Sri Amman Flour & Grain Mill (JP Nagar)",
    category: "Flour & Masala Mill",
    categoryGroup: "grocery",
    rating: 4.9,
    distanceKm: 0.3,
    isOpen: true,
    address: "9th Cross, JP Nagar 2nd Phase, Bengaluru",
    image:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
    tags: ["Fresh Batter", "Chakki Atta", "Pure Spices"],
  },

  // ── Fashion ──
  {
    id: "s_jp_apparel",
    name: "JP Nagar Readymades & Menswear",
    category: "Individual Fashion",
    categoryGroup: "fashion",
    rating: 4.8,
    distanceKm: 0.4,
    isOpen: true,
    address: "15th Main Road, JP Nagar 2nd Phase, Bengaluru",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80",
    tags: ["Pure Cotton Dhoti", "Casual Shirts", "Kurtas"],
  },
  {
    id: "s_stylehub_jp",
    name: "StyleHub Apparel & Boutique",
    category: "Fashion & Apparel",
    categoryGroup: "fashion",
    rating: 4.8,
    distanceKm: 0.5,
    isOpen: true,
    address: "15th Main Road, JP Nagar 2nd Phase, Bengaluru",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=400&q=80",
    tags: ["Ethnic Kurtis", "Denim Wear", "Linen Shirts"],
  },
  {
    id: "s_handloom_jp",
    name: "Karnataka Handloom Silk House",
    category: "Traditional Handlooms",
    categoryGroup: "fashion",
    rating: 4.9,
    distanceKm: 0.6,
    isOpen: true,
    address: "24th Main Road, JP Nagar 2nd Phase, Bengaluru",
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=400&q=80",
    tags: ["Mysore Silk", "Pure Cotton", "Traditional Dupattas"],
  },

  // ── Electronics ──
  {
    id: "s_electroworld_jp",
    name: "ElectroWorld Gadgets & Mobile Spares",
    category: "Smart Electronics",
    categoryGroup: "electronics",
    rating: 4.8,
    distanceKm: 0.4,
    isOpen: true,
    address: "15th Main Road, JP Nagar 2nd Phase, Bengaluru",
    image:
      "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80",
    tags: ["Wireless Audio", "Power Banks", "Cables"],
  },
  {
    id: "s_mobile_planet_jp",
    name: "Mobile Planet & Quick Tech Care",
    category: "Mobile Accessories",
    categoryGroup: "electronics",
    rating: 4.9,
    distanceKm: 0.5,
    isOpen: true,
    address: "14th Cross Rd, JP Nagar 2nd Phase, Bengaluru",
    image:
      "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=400&q=80",
    tags: ["Fast Chargers", "Screen Protectors", "Headphones"],
  },
  {
    id: "s_techzone_jp",
    name: "Supreme Digital Gadgets Hub",
    category: "Electronics & Computing",
    categoryGroup: "electronics",
    rating: 4.7,
    distanceKm: 0.6,
    isOpen: true,
    address: "24th Main Road, JP Nagar 2nd Phase, Bengaluru",
    image:
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=400&q=80",
    tags: ["Bluetooth Speakers", "Smartwatches", "Peripherals"],
  },
];

const SLUG_TO_GROUP: Record<string, ExploreCategoryGroup> = {
  fruits_veg: "grocery",
  meat_fish: "food",
  bakery: "bakery",
  pharmacy: "health",
  restaurants: "food",
  fashion: "fashion",
  electronics: "electronics",
  home_kitchen: "fashion",
};

function ExplorePage() {
  const navigate = useNavigate();
  const [deliveryLocation] = useDeliveryLocation();
  const isBLR = isBengaluruLocation(deliveryLocation);
  const currentAreaOrCity =
    deliveryLocation?.area ||
    deliveryLocation?.city?.split(",")[0] ||
    (isBLR ? "Bengaluru" : "Coimbatore");

  const [activeCategory, setActiveCategory] = useState<"all" | ExploreCategoryGroup>("all");
  const [shopViewMode, setShopViewMode] = useState<"list" | "map">("list");
  const cart = useCart();
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Set<string>>(new Set());

  const locationShops = useMemo(() => {
    return isBLR ? BENGALURU_VERIFIED_SHOPS : VERIFIED_SHOPS;
  }, [isBLR]);

  // Dynamic filter for verified shops
  const filteredShops = useMemo(() => {
    if (activeCategory === "all") return locationShops;
    return locationShops.filter((shop) => shop.categoryGroup === activeCategory);
  }, [activeCategory, locationShops]);

  // Dynamic filter for trending products
  const filteredProducts = useMemo(() => {
    if (activeCategory === "all") return TRENDING_PRODUCTS;
    return TRENDING_PRODUCTS.filter((prod) => prod.categoryGroup === activeCategory);
  }, [activeCategory]);

  const activeCategoryLabel = useMemo(() => {
    return EXPLORE_CATEGORIES.find((c) => c.id === activeCategory)?.label || "All";
  }, [activeCategory]);

  const handleAddToCart = (item: TrendingProductItem) => {
    cartStore.add(item.storeId, item.storeName, {
      id: item.id,
      name: item.name,
      price: item.price,
      unit: item.unit,
      stock: 15,
      imageUrl: item.image,
    });
    setRecentlyAddedIds((prev) => new Set(prev).add(item.id));
    toast.success(`Added ${item.name} to cart!`);
  };

  return (
    <SocialCommerceShell>
      <div className="space-y-6">
        {/* ── Page 01 Hero Banner: "Explore Your Neighborhood" ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FAF3FF] via-[#F4E8FC] to-[#ECD5F9] border border-[#E2E8F0] p-6 sm:p-8 shadow-xs">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#8B2FC9]/10 px-3 py-1 text-xs font-bold text-[#8B2FC9] mb-3">
              <Compass className="h-3.5 w-3.5" />
              <span>Explore {currentAreaOrCity}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0F172A] tracking-tight leading-tight">
              Explore Your <br className="hidden sm:block" />
              <span className="text-[#8B2FC9]">Neighborhood</span>
            </h1>
            <p className="mt-2 text-xs sm:text-sm font-semibold text-[#64748B]">
              Shops • Products • People • Collections
            </p>
          </div>

          {/* Decorative Cityscape Watermark Graphic */}
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-25 pointer-events-none hidden md:flex items-center justify-end pr-6">
            <Store className="h-44 w-44 text-[#8B2FC9]" />
          </div>
        </div>

        {/* ── Filter Category Pills (All, Food, Grocery, Fashion, Health, Bakery, Electronics) ── */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth">
            {EXPLORE_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`shrink-0 rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer select-none ${
                    isActive
                      ? "bg-[#8B2FC9] text-white shadow-[0_4px_14px_rgba(168,56,189,0.35)] scale-[1.02]"
                      : "bg-white text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] border border-[#E2E8F0]"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Active Filter Feedback Bar when filtering is active */}
          {activeCategory !== "all" && (
            <div className="flex items-center justify-between rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-2.5 animate-fadeIn">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#0F172A] flex-wrap">
                <span className="inline-flex items-center gap-1 font-bold text-[#8B2FC9]">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Filtered by:</span>
                </span>
                <span className="font-extrabold text-[#0F172A] bg-white px-2.5 py-0.5 rounded-full border border-[#E2E8F0] text-xs">
                  {activeCategoryLabel}
                </span>
                <span className="text-[#8E82A3]">•</span>
                <span className="text-xs font-semibold text-[#64748B]">
                  {filteredShops.length} {filteredShops.length === 1 ? "shop" : "shops"} &amp;{" "}
                  {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"} found
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#8B2FC9] hover:bg-[#F1F5F9] border border-[#E2E8F0] transition cursor-pointer shadow-2xs shrink-0"
              >
                <X className="h-3 w-3" />
                <span>Show All</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Shop by Category Grid ── */}
        <section className="rounded-3xl bg-white p-5 sm:p-6 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#8B2FC9]" />
              <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">Shop by Category</h2>
            </div>
            <Link
              to="/search"
              search={{ category: undefined, q: undefined }}
              className="group inline-flex items-center gap-1 text-xs font-bold text-[#8B2FC9] hover:text-[#581C87]"
            >
              <span>View All</span>
              <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-3">
            {ALL_CATEGORIES_LIST.map((cat) => {
              const matchedGroup = SLUG_TO_GROUP[cat.slug];
              const isSelected = activeCategory !== "all" && matchedGroup === activeCategory;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    if (matchedGroup) {
                      setActiveCategory(matchedGroup === activeCategory ? "all" : matchedGroup);
                    }
                  }}
                  className={`group flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl transition cursor-pointer text-center ${
                    isSelected
                      ? "bg-[#F1F5F9] border-2 border-[#8B2FC9] shadow-xs scale-102"
                      : "bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] hover:shadow-xs"
                  }`}
                >
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl overflow-hidden bg-white shadow-xs mb-2 group-hover:scale-105 transition-transform flex items-center justify-center">
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        if (e.currentTarget.parentElement) {
                          e.currentTarget.parentElement.innerText = cat.emoji || "🛍️";
                          e.currentTarget.parentElement.style.fontSize = "22px";
                        }
                      }}
                    />
                  </div>
                  <span
                    className={`text-xs font-bold leading-tight line-clamp-1 ${
                      isSelected ? "text-[#8B2FC9]" : "text-[#0F172A]"
                    }`}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Nearby Verified Shops ── */}
        <section className="rounded-3xl bg-white p-5 sm:p-6 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">
                {activeCategory === "all"
                  ? "Nearby Verified Shops"
                  : `Nearby Verified ${activeCategoryLabel} Shops`}
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                {activeCategory === "all"
                  ? "Local businesses ready for instant delivery in your neighborhood"
                  : `Showing verified ${activeCategoryLabel.toLowerCase()} stores ready for quick delivery`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-xl bg-[#F8FAFC] p-1 border border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShopViewMode("list")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    shopViewMode === "list"
                      ? "bg-white text-[#8B2FC9] shadow-xs"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                  <span>List</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShopViewMode("map");
                    void navigate({ to: "/near-me" });
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    shopViewMode === "map"
                      ? "bg-white text-[#8B2FC9] shadow-xs"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  <MapIcon className="h-3.5 w-3.5" />
                  <span>Map</span>
                </button>
              </div>

              <Link
                to="/near-me"
                className="group inline-flex items-center gap-1 text-xs font-bold text-[#8B2FC9] hover:text-[#581C87]"
              >
                <span>View All</span>
                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {filteredShops.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 px-4 rounded-3xl bg-[#F8FAFC] border border-dashed border-[#E2E8F0] text-center">
                <Store className="h-10 w-10 text-[#8B2FC9]/50 mb-2" />
                <h3 className="text-sm font-bold text-[#0F172A]">
                  No {activeCategoryLabel} shops nearby right now
                </h3>
                <p className="text-xs text-[#64748B] mt-1 max-w-sm">
                  We are expanding our verified partner network in your area.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveCategory("all")}
                  className="mt-3 inline-flex items-center gap-1 rounded-xl bg-[#8B2FC9] px-4 py-2 text-xs font-bold text-white hover:bg-[#7812B8] transition cursor-pointer shadow-xs"
                >
                  <span>Show All Shops</span>
                </button>
              </div>
            ) : (
              filteredShops.map((shop) => (
                <Link
                  key={shop.id}
                  to="/store/$storeId"
                  params={{ storeId: shop.id }}
                  className="group flex flex-col justify-between rounded-3xl bg-[#F8FAFC] p-4 border border-[#E2E8F0] hover:border-[#8B2FC9]/40 hover:shadow-md transition cursor-pointer min-h-[360px] h-full"
                >
                  <div>
                    <div className="h-36 w-full overflow-hidden rounded-2xl bg-white mb-3 relative">
                      <img
                        src={shop.image}
                        alt={shop.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2.5 left-2.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                        {shop.category}
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-[#8B2FC9] transition line-clamp-1">
                        {shop.name}
                      </h3>
                      <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200 shrink-0">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span>{shop.rating}</span>
                      </div>
                    </div>

                    {/* Address Slot */}
                    <div className="flex items-start gap-1 text-xs text-[#746A85] mt-1.5 line-clamp-2 h-8">
                      <MapPin className="h-3.5 w-3.5 text-[#8B2FC9] shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{shop.address}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-1.5">
                      <span>{shop.distanceKm} km away</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold">Open Now</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1 pt-2.5 border-t border-[#E2E8F0]">
                    {shop.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#64748B] border border-[#E2E8F0]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* ── Trending Products Near You ── */}
        <section className="rounded-3xl bg-white p-5 sm:p-6 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0F172A] flex items-center gap-1.5">
                <span>
                  {activeCategory === "all"
                    ? "Trending Products Near You"
                    : `Trending Products in ${activeCategoryLabel}`}
                </span>
                <Sparkles className="h-4 w-4 text-[#8B2FC9]" />
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                {activeCategory === "all"
                  ? "Popular items in stock and available for 30-min delivery"
                  : `Trending ${activeCategoryLabel.toLowerCase()} items available for instant delivery`}
              </p>
            </div>
            <Link
              to="/search"
              search={{ category: undefined, q: undefined }}
              className="group inline-flex items-center gap-1 text-xs font-bold text-[#8B2FC9] hover:text-[#581C87]"
            >
              <span>View All</span>
              <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-10 px-4 rounded-2xl bg-[#F8FAFC] border border-dashed border-[#E2E8F0] text-center">
                <Sparkles className="h-8 w-8 text-[#8B2FC9]/50 mb-1.5" />
                <h3 className="text-xs sm:text-sm font-bold text-[#0F172A]">
                  No trending products in {activeCategoryLabel} yet
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveCategory("all")}
                  className="mt-2 text-xs font-bold text-[#8B2FC9] hover:underline cursor-pointer"
                >
                  Show All Products
                </button>
              </div>
            ) : (
              filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="group flex flex-col justify-between rounded-2xl bg-[#F8FAFC] p-3 border border-[#E2E8F0] hover:shadow-md transition"
                >
                  <div>
                    <div className="aspect-square w-full overflow-hidden rounded-xl bg-white mb-2.5">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-[#8B2FC9]">{prod.storeName}</span>
                    <h3 className="text-xs sm:text-sm font-bold text-[#0F172A] line-clamp-1 mt-0.5">
                      {prod.name}
                    </h3>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-xs sm:text-sm font-extrabold text-[#0F172A]">
                        ₹{prod.price}
                      </span>
                      {prod.mrp && (
                        <span className="text-[10px] text-[#8E82A3] line-through">₹{prod.mrp}</span>
                      )}
                    </div>
                  </div>

                  {(() => {
                    const isAdded =
                      recentlyAddedIds.has(prod.id) ||
                      cart.lines.some((l) => l.productId === prod.id);
                    return (
                      <button
                        type="button"
                        onClick={() => handleAddToCart(prod)}
                        className={`mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-white shadow-xs active:scale-95 transition cursor-pointer ${
                          isAdded
                            ? "bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-600/20"
                            : "bg-[#8B2FC9] hover:bg-[#7812B8]"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                            <span>Added to Cart</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-3.5 w-3.5" />
                            <span>Add to Cart</span>
                          </>
                        )}
                      </button>
                    );
                  })()}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </SocialCommerceShell>
  );
}
