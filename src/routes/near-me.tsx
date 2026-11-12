import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import { getGoogleMapOptions, LOCALSHORE_MAP_STYLES } from "@/lib/map-settings";
import {
  MapPin,
  LocateFixed,
  Layers,
  Plus,
  Minus,
  Search,
  SlidersHorizontal,
  X,
  Star,
  Navigation,
  Store as StoreIcon,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Bike,
  ShoppingBag,
  Clock,
  Sparkles,
  Check,
  CheckCircle2,
  Utensils,
  BookOpen,
  ShoppingCart,
  Shirt,
  Leaf,
  Smartphone,
  RefreshCw,
  Home,
  Compass,
  Users,
  MessageSquare,
  Heart,
  MessageCircle,
  Bell,
  Sliders,
} from "lucide-react";
import {
  useDeliveryLocation,
  setActiveDeliveryLocation,
  type DeliveryLocation,
} from "@/lib/location-store";
import { requestLocationModal } from "@/components/app-shell";
import { haversineDistanceKm } from "@/lib/geo";
import { fetchMapRoute, getMapLibreStyle } from "@/lib/map-service/providers";
import { isBengaluruLocation } from "@/lib/social-feed-data";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TopNavbar } from "@/components/social-commerce/top-navbar";
import { LeftSidebar } from "@/components/social-commerce/left-sidebar";

export const Route = createFileRoute("/near-me")({
  component: NearMePage,
});

// ─── Interfaces ───

interface NearShop {
  id: string;
  name: string;
  category: string;
  type: "bakery" | "grocery" | "pharmacy" | "fashion" | "restaurants" | "books" | "electronics" | "fresh";
  rating: number;
  reviewsCount: number;
  distanceKm: number;
  isOpen: boolean;
  hasDelivery: boolean;
  hasPickup: boolean;
  image: string;
  address: string;
  locality: string;
  lat: number;
  lng: number;
}

// ─── Categories Filter Definition Matching Image 1 & 2 ───
const CATEGORY_CHIPS = [
  { id: "all", label: "All", icon: "all" },
  { id: "bakery", label: "Bakery", icon: "bakery" },
  { id: "grocery", label: "Grocery", icon: "grocery" },
  { id: "pharmacy", label: "Pharmacy", icon: "pharmacy" },
  { id: "fashion", label: "Fashion", icon: "fashion" },
  { id: "restaurants", label: "Restaurants", icon: "restaurants" },
  { id: "fresh", label: "Fresh Produce", icon: "fresh" },
];

// ─── 18 Authentic Verified Shops for Coimbatore (Matches Image 1 & 2 exactly) ───
const COIMBATORE_18_SHOPS: NearShop[] = [
  {
    id: "s_book_nook",
    name: "The Book Nook & Stationery",
    category: "Books & Stationery",
    type: "books",
    rating: 4.8,
    reviewsCount: 2143,
    distanceKm: 0.7,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80",
    address: "Diwan Bahadur Road, RS Puram, Coimbatore",
    locality: "RS Puram",
    lat: 11.0138,
    lng: 76.9538,
  },
  {
    id: "s_paap1",
    name: "Ravi's Artisan Bakery",
    category: "Bakery & Sweets",
    type: "bakery",
    rating: 4.7,
    reviewsCount: 1420,
    distanceKm: 0.9,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
    address: "DB Road, RS Puram, Coimbatore",
    locality: "RS Puram",
    lat: 11.0125,
    lng: 76.9535,
  },
  {
    id: "s_kovai_fresh",
    name: "Kovai Fresh Mart",
    category: "Fresh Produce",
    type: "fresh",
    rating: 4.6,
    reviewsCount: 3210,
    distanceKm: 1.2,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80",
    address: "NSR Road, Saibaba Colony, Coimbatore",
    locality: "Saibaba Colony",
    lat: 11.025,
    lng: 76.945,
  },
  {
    id: "s_apollo_ramnagar",
    name: "Apollo Pharmacy",
    category: "Pharmacy & Healthcare",
    type: "pharmacy",
    rating: 4.8,
    reviewsCount: 5620,
    distanceKm: 1.5,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&q=80",
    address: "Cross Cut Road, Ram Nagar, Coimbatore",
    locality: "Ram Nagar",
    lat: 11.018,
    lng: 76.962,
  },
  {
    id: "s_kovilmedu_medicals",
    name: "Kovilmedu Care Medicals",
    category: "Individual Pharmacy",
    type: "pharmacy",
    rating: 4.8,
    reviewsCount: 220,
    distanceKm: 0.2,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80",
    address: "Junction Arch, Kovilmedu, Coimbatore",
    locality: "Kovilmedu",
    lat: 11.0286,
    lng: 76.9256,
  },
  {
    id: "s_roja_bakes",
    name: "Roja Bakes & Sweets",
    category: "Bakery & Sweets",
    type: "bakery",
    rating: 4.9,
    reviewsCount: 380,
    distanceKm: 0.3,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80",
    address: "Thadagam Main Road, Kovilmedu, Coimbatore",
    locality: "Kovilmedu",
    lat: 11.0288,
    lng: 76.926,
  },
  {
    id: "s_amman_flour",
    name: "Sri Amman Flour & Masala Mill",
    category: "Flour & Masala Mill",
    type: "grocery",
    rating: 4.9,
    reviewsCount: 290,
    distanceKm: 0.3,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
    address: "Temple Street, Kovilmedu, Coimbatore",
    locality: "Kovilmedu",
    lat: 11.0278,
    lng: 76.925,
  },
  {
    id: "s_boutique1",
    name: "StyleHub Apparel",
    category: "Individual Fashion",
    type: "fashion",
    rating: 4.8,
    reviewsCount: 215,
    distanceKm: 2.1,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
    address: "Cross Cut Road, Gandhipuram, Coimbatore",
    locality: "Gandhipuram",
    lat: 11.0195,
    lng: 76.9682,
  },
  {
    id: "s_paap4",
    name: "City Bites Kitchen & Mess",
    category: "Restaurants & Dining",
    type: "restaurants",
    rating: 4.9,
    reviewsCount: 420,
    distanceKm: 0.8,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80",
    address: "Trichy Road, Sungam Junction, Coimbatore",
    locality: "Sungam",
    lat: 10.9995,
    lng: 76.9745,
  },
  {
    id: "s_sweets1",
    name: "Sri Krishna Sweets",
    category: "Bakery & Sweets",
    type: "bakery",
    rating: 4.9,
    reviewsCount: 520,
    distanceKm: 0.8,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=400&q=80",
    address: "Diwan Bahadur Road, RS Puram, Coimbatore",
    locality: "RS Puram",
    lat: 11.0135,
    lng: 76.9542,
  },
  {
    id: "s_kovil_chicken",
    name: "Kongu Country Chicken Stall",
    category: "Meat, Fish & Chicken",
    type: "restaurants",
    rating: 4.8,
    reviewsCount: 195,
    distanceKm: 0.5,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80",
    address: "West Corner, Kovilmedu, Coimbatore",
    locality: "Kovilmedu",
    lat: 11.0274,
    lng: 76.9245,
  },
  {
    id: "s_kovil_super",
    name: "Kovilmedu Supermarket",
    category: "Kirana & Grocery",
    type: "grocery",
    rating: 4.7,
    reviewsCount: 165,
    distanceKm: 0.4,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=400&q=80",
    address: "Bus Stop Junction, Kovilmedu, Coimbatore",
    locality: "Kovilmedu",
    lat: 11.0292,
    lng: 76.9265,
  },
  {
    id: "s_meenakshi_fashions",
    name: "Meenakshi Fashions & Sarees",
    category: "Individual Fashion",
    type: "fashion",
    rating: 4.6,
    reviewsCount: 140,
    distanceKm: 0.7,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=400&q=80",
    address: "Near Panchayat Office, Kovilmedu, Coimbatore",
    locality: "Kovilmedu",
    lat: 11.0298,
    lng: 76.927,
  },
  {
    id: "s_anand_organics",
    name: "Kovilmedu Organics & Millets",
    category: "Organic Grocery",
    type: "fresh",
    rating: 4.9,
    reviewsCount: 180,
    distanceKm: 0.6,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80",
    address: "School Road, Kovilmedu, Coimbatore",
    locality: "Kovilmedu",
    lat: 11.0282,
    lng: 76.9238,
  },
  {
    id: "s_cbe_doraisingh",
    name: "Doraisingh Supermarket",
    category: "Kirana & Grocery",
    type: "grocery",
    rating: 4.8,
    reviewsCount: 480,
    distanceKm: 2.4,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
    address: "7th Street, Gandhipuram, Coimbatore",
    locality: "Gandhipuram",
    lat: 11.0182,
    lng: 76.9677,
  },
  {
    id: "s_cbe_pothys",
    name: "POTHYS Gandhipuram",
    category: "Fashion & Textiles",
    type: "fashion",
    rating: 4.7,
    reviewsCount: 1820,
    distanceKm: 2.4,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=400&q=80",
    address: "Cross Cut Road, Gandhipuram, Coimbatore",
    locality: "Gandhipuram",
    lat: 11.0182,
    lng: 76.9677,
  },
  {
    id: "s_cbe_poorvika",
    name: "Poorvika Mobiles Vadavalli",
    category: "Electronics & Mobile",
    type: "electronics",
    rating: 4.6,
    reviewsCount: 310,
    distanceKm: 2.8,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80",
    address: "Marudhamalai Main Rd, Vadavalli, Coimbatore",
    locality: "Vadavalli",
    lat: 11.0253,
    lng: 76.9051,
  },
  {
    id: "s_cbe_cheran",
    name: "Cheran Mart",
    category: "Kirana & Grocery",
    type: "grocery",
    rating: 4.7,
    reviewsCount: 240,
    distanceKm: 3.2,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=400&q=80",
    address: "Kalapatti Main Rd, Coimbatore",
    locality: "Kalapatti",
    lat: 11.0787,
    lng: 77.037,
  },
];

// ─── 18 Authentic Verified Shops for Bengaluru / JP Nagar ───
const BENGALURU_18_SHOPS: NearShop[] = [
  {
    id: "s_jp_books",
    name: "The Book Nook & Stationery (JP Nagar)",
    category: "Books & Stationery",
    type: "books",
    rating: 4.8,
    reviewsCount: 1650,
    distanceKm: 0.6,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80",
    address: "24th Main, JP Nagar 2nd Phase, Bengaluru",
    locality: "JP Nagar",
    lat: 12.914,
    lng: 77.5825,
  },
  {
    id: "s_jp_bakery",
    name: "Ravi's Artisan Bakery (JP Nagar)",
    category: "Bakery & Sweets",
    type: "bakery",
    rating: 4.9,
    reviewsCount: 1420,
    distanceKm: 0.3,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "/assets/ravis-sourdough-hero.jpg",
    address: "24th Main Road, JP Nagar 2nd Phase, Bengaluru",
    locality: "JP Nagar",
    lat: 12.9125,
    lng: 77.584,
  },
  {
    id: "s_jp_produce",
    name: "Namma Fresh Produce & Organics",
    category: "Fresh Produce",
    type: "fresh",
    rating: 4.9,
    reviewsCount: 3100,
    distanceKm: 0.4,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80",
    address: "Ring Road Junction, JP Nagar 2nd Phase, Bengaluru",
    locality: "JP Nagar",
    lat: 12.9082,
    lng: 77.5878,
  },
  {
    id: "s_jp_medicals",
    name: "Apollo Pharmacy & Care - JP Nagar",
    category: "Pharmacy & Healthcare",
    type: "pharmacy",
    rating: 4.8,
    reviewsCount: 4210,
    distanceKm: 0.2,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&q=80",
    address: "15th Main Road, JP Nagar 2nd Phase, Bengaluru",
    locality: "JP Nagar",
    lat: 12.9112,
    lng: 77.5852,
  },
  {
    id: "s_jp_apparel",
    name: "JP Nagar Readymades & Menswear",
    category: "Individual Fashion",
    type: "fashion",
    rating: 4.8,
    reviewsCount: 230,
    distanceKm: 0.4,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80",
    address: "15th Main Road, JP Nagar 2nd Phase, Bengaluru",
    locality: "JP Nagar",
    lat: 12.9055,
    lng: 77.591,
  },
  {
    id: "s_jp_dining",
    name: "City Bites Kitchen & Mess (JP Nagar)",
    category: "Restaurants & Dining",
    type: "restaurants",
    rating: 4.8,
    reviewsCount: 380,
    distanceKm: 0.5,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80",
    address: "14th Cross Rd, JP Nagar 2nd Phase, Bengaluru",
    locality: "JP Nagar",
    lat: 12.9135,
    lng: 77.5868,
  },
  {
    id: "s_jp_sweets",
    name: "Sri Krishna Sweets & Bakes",
    category: "Bakery & Sweets",
    type: "bakery",
    rating: 4.9,
    reviewsCount: 460,
    distanceKm: 0.5,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=400&q=80",
    address: "100 Feet Ring Road, JP Nagar 2nd Phase, Bengaluru",
    locality: "JP Nagar",
    lat: 12.907,
    lng: 77.589,
  },
  {
    id: "s_jp_mill",
    name: "Sri Amman Flour & Grain Mill",
    category: "Flour & Masala Mill",
    type: "grocery",
    rating: 4.9,
    reviewsCount: 290,
    distanceKm: 0.3,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
    address: "9th Cross, JP Nagar 2nd Phase, Bengaluru",
    locality: "JP Nagar",
    lat: 12.9095,
    lng: 77.5865,
  },
  {
    id: "s_jp_kirana",
    name: "JP Nagar Supermarket & Provisions",
    category: "Kirana & Grocery",
    type: "grocery",
    rating: 4.8,
    reviewsCount: 340,
    distanceKm: 0.5,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=400&q=80",
    address: "21st Main, JP Nagar 2nd Phase, Bengaluru",
    locality: "JP Nagar",
    lat: 12.909,
    lng: 77.583,
  },
  {
    id: "s_jp_boutique",
    name: "StyleHub Boutique & Apparel",
    category: "Individual Fashion",
    type: "fashion",
    rating: 4.8,
    reviewsCount: 285,
    distanceKm: 0.7,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
    address: "Bannerghatta Main Road, JP Nagar 3rd Phase, Bengaluru",
    locality: "JP Nagar",
    lat: 12.9055,
    lng: 77.591,
  },
  {
    id: "s_jp_organics",
    name: "Green Leaf Organics & Farm Produce",
    category: "Organic Fruits & Vegetables",
    type: "fresh",
    rating: 4.8,
    reviewsCount: 190,
    distanceKm: 0.8,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80",
    address: "6th Main, JP Nagar 3rd Phase, Bengaluru",
    locality: "JP Nagar",
    lat: 12.9045,
    lng: 77.5925,
  },
  {
    id: "s_jp_croma",
    name: "Croma Electronics & Mobiles",
    category: "Electronics & Smart Devices",
    type: "electronics",
    rating: 4.7,
    reviewsCount: 310,
    distanceKm: 0.6,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80",
    address: "Outer Ring Road, JP Nagar 2nd Phase, Bengaluru",
    locality: "JP Nagar",
    lat: 12.9065,
    lng: 77.584,
  },
  {
    id: "s_jp_kongu",
    name: "Kongu Country Kitchen (JP Nagar)",
    category: "South Indian Mess & Kitchen",
    type: "restaurants",
    rating: 4.9,
    reviewsCount: 510,
    distanceKm: 0.9,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80",
    address: "5th Phase Ring Rd, JP Nagar, Bengaluru",
    locality: "JP Nagar",
    lat: 12.903,
    lng: 77.587,
  },
  {
    id: "s_jp_meats",
    name: "Fresh Catch Seafood & Country Cuts",
    category: "Meat, Fish & Chicken",
    type: "restaurants",
    rating: 4.8,
    reviewsCount: 275,
    distanceKm: 1.0,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80",
    address: "8th Main Road, JP Nagar 3rd Phase, Bengaluru",
    locality: "JP Nagar",
    lat: 12.904,
    lng: 77.594,
  },
  {
    id: "s_jp_meena",
    name: "Meena General Store & Spices",
    category: "Kirana & Spices",
    type: "grocery",
    rating: 4.7,
    reviewsCount: 220,
    distanceKm: 0.4,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=400&q=80",
    address: "12th Cross, JP Nagar 2nd Phase, Bengaluru",
    locality: "JP Nagar",
    lat: 12.9118,
    lng: 77.5885,
  },
  {
    id: "s_blr_jayanagar",
    name: "Jayanagar Market Provisions",
    category: "Kirana & Grocery",
    type: "grocery",
    rating: 4.7,
    reviewsCount: 650,
    distanceKm: 2.1,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
    address: "4th Block, Jayanagar, Bengaluru",
    locality: "Jayanagar",
    lat: 12.9292,
    lng: 77.5824,
  },
  {
    id: "s_blr_mywow",
    name: "MY WOW Fashion & Trends",
    category: "Clothing & Fashion",
    type: "fashion",
    rating: 4.8,
    reviewsCount: 390,
    distanceKm: 2.1,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=400&q=80",
    address: "11th Main, Jayanagar 4th Block, Bengaluru",
    locality: "Jayanagar",
    lat: 12.9292,
    lng: 77.5824,
  },
  {
    id: "s_blr_gtworld",
    name: "GT World Mall Stores",
    category: "Shopping & Lifestyle",
    type: "fashion",
    rating: 4.6,
    reviewsCount: 890,
    distanceKm: 5.4,
    isOpen: true,
    hasDelivery: true,
    hasPickup: true,
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80",
    address: "Magadi Main Rd, Vijayanagar, Bengaluru",
    locality: "Vijayanagar",
    lat: 12.9709,
    lng: 77.5373,
  },
];

// ─── Custom Category SVG Marker Icons (Sharp vector renderings for MapLibre pins) ───
function getCategoryIconSvgPath(type: string): string {
  switch (type) {
    case "grocery":
      return `<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>`;
    case "pharmacy":
      return `<rect width="18" height="18" x="3" y="3" rx="4"/><path d="M12 8v8"/><path d="M8 12h8"/>`;
    case "fashion":
      return `<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>`;
    case "restaurants":
    case "food":
      return `<path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/><path d="M15 2v19"/><path d="M6 2v20"/><path d="M6 6h4"/><path d="M6 10h4"/>`;
    case "books":
      return `<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/>`;
    case "fresh":
    case "fresh_produce":
      return `<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>`;
    case "electronics":
      return `<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>`;
    case "bakery":
      return `<path d="m3.5 13 2.5-5 5-2 5 2 2.5 5"/><path d="M3.5 13c1.5 3 4 5 7.5 5s6-2 7.5-5"/><path d="M6 8v3"/><path d="M15 8v3"/>`;
    default:
      return `<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/>`;
  }
}

function getCategoryIconSvg(type: NearShop["type"]): string {
  const path = getCategoryIconSvgPath(type);
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

function createGoogleShopMarkerIcon(type: string, isSelected: boolean) {
  const pinColor = isSelected ? "#581C87" : "#8B2FC9";
  const size = isSelected ? 46 : 38;
  const height = isSelected ? 56 : 46;
  const iconPath = getCategoryIconSvgPath(type);
  const iconOffset = (size - 18) / 2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${height}" viewBox="0 0 ${size} ${height}">
    <defs>
      <filter id="lsShadow" x="-25%" y="-20%" width="150%" height="150%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#4A0B48" flood-opacity="0.38"/>
      </filter>
    </defs>
    <g filter="url(#lsShadow)">
      <path d="M${size / 2} ${height - 2} C${size / 2 - 4} ${height - 10} 2 ${size - 4} 2 ${size / 2} A${size / 2 - 2} ${size / 2 - 2} 0 1 1 ${size - 2} ${size / 2} C${size - 2} ${size - 4} ${size / 2 + 4} ${height - 10} ${size / 2} ${height - 2} Z" fill="${pinColor}" stroke="#FFFFFF" stroke-width="2.5"/>
    </g>
    <g transform="translate(${iconOffset}, ${iconOffset - 1})" stroke="#FFFFFF" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      ${iconPath}
    </g>
  </svg>`;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: typeof google !== "undefined" && google?.maps ? new google.maps.Size(size, height) : undefined,
    anchor: typeof google !== "undefined" && google?.maps ? new google.maps.Point(size / 2, height - 2) : undefined,
  };
}

function getGoogleUserPinIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="90" height="60" viewBox="0 0 90 60">
    <rect x="6" y="2" width="78" height="22" rx="11" fill="#2563EB" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
    <text x="45" y="17" fill="#FFFFFF" font-family="Arial,sans-serif" font-size="10.5" font-weight="800" text-anchor="middle">You are here</text>
    <circle cx="45" cy="42" r="16" fill="#2563EB" fill-opacity="0.25"/>
    <circle cx="45" cy="42" r="8" fill="#2563EB" stroke="#FFFFFF" stroke-width="2.5"/>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: typeof google !== "undefined" && google?.maps ? new google.maps.Size(90, 60) : undefined,
    anchor: typeof google !== "undefined" && google?.maps ? new google.maps.Point(45, 42) : undefined,
  };
}

// ─── Map Tile Providers (Clean, Zero POI Red Cross Clutter) ───
const MAP_LAYERS = {
  streets: {
    label: "Streets",
    tiles: [
      "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
      "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
      "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
    ],
  },
  light: {
    label: "Light / Clean",
    tiles: [
      "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    ],
  },
  satellite: {
    label: "Satellite",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
  },
};

function NearMePage() {
  const navigate = useNavigate();
  const [deliveryLocation] = useDeliveryLocation();
  const isBLR = isBengaluruLocation(deliveryLocation);

  // Active locality information
  const userLat = deliveryLocation?.lat ?? (isBLR ? 12.9105 : 11.0138);
  const userLng = deliveryLocation?.lng ?? (isBLR ? 77.5857 : 76.9538);
  const currentArea =
    deliveryLocation?.area ||
    deliveryLocation?.label?.split(",")[0]?.trim() ||
    (isBLR ? "JP Nagar 2nd Phase" : "Coimbatore, TN");

  // ─── Filter States ───
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedShopId, setSelectedShopId] = useState<string | null>(() => (isBLR ? "s_jp_books" : "s_book_nook"));
  const [maxRadiusKm, setMaxRadiusKm] = useState<number>(3); // default 3 km matching mockup
  const [onlyOpenNow, setOnlyOpenNow] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [onlyDelivery, setOnlyDelivery] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [mapLayer, setMapLayer] = useState<keyof typeof MAP_LAYERS>("streets");

  // ─── Desktop vs Mobile View Toggles ───
  const [desktopViewMode, setDesktopViewMode] = useState<"map" | "list">("map");

  // ─── Mobile Bottom Sheet States ("collapsed" | "half" | "expanded") ───
  const [sheetState, setSheetState] = useState<"collapsed" | "half" | "expanded">("half");
  const sheetTouchStartY = useRef<number | null>(null);

  // ─── Map Container & Google Maps / MapLibre References ───
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapEngine, setMapEngine] = useState<"google" | "maplibre">("google");
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const googleMarkersRef = useRef<Record<string, google.maps.Marker>>({});
  const googleUserMarkerRef = useRef<google.maps.Marker | null>(null);
  const googleRouteLinesRef = useRef<google.maps.Polyline[]>([]);

  // MapLibre fallback references
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersOnMapRef = useRef<Record<string, maplibregl.Marker>>({});
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  // ─── "Search This Area" Floating Pill State ───
  const [showSearchThisArea, setShowSearchThisArea] = useState(false);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number }>({
    lat: userLat,
    lng: userLng,
  });
  const searchCenterRef = useRef(searchCenter);
  searchCenterRef.current = searchCenter;

  // ─── Synchronize searchCenter, selectedShopId and map camera whenever deliveryLocation changes ───
  useEffect(() => {
    setSearchCenter({ lat: userLat, lng: userLng });
    setShowSearchThisArea(false);
    setSelectedShopId(isBLR ? "s_jp_books" : "s_book_nook");
    if (googleMapRef.current) {
      googleMapRef.current.panTo({ lat: userLat, lng: userLng });
    } else if (mapRef.current) {
      mapRef.current.flyTo({
        center: [userLng, userLat],
        zoom: 13.8,
        speed: 1.4,
      });
    }
  }, [userLat, userLng, isBLR]);

  // Window resize listener to keep MapLibre WebGL canvas synced
  useEffect(() => {
    const handleResize = () => {
      mapRef.current?.resize();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Map resize when desktopViewMode switches back to map
  useEffect(() => {
    if (desktopViewMode === "map") {
      setTimeout(() => {
        mapRef.current?.resize();
      }, 50);
    }
  }, [desktopViewMode]);

  // ─── Active Driving Route Info ───
  const [activeRoute, setActiveRoute] = useState<{
    distanceKm: number;
    durationMins: number;
    shopName: string;
  } | null>(null);

  // ─── Native MapLibre Popup Reference ───
  const shopPopupRef = useRef<maplibregl.Popup | null>(null);

  // ─── Compute Filtered Shops ───
  const baseShops = isBLR ? BENGALURU_18_SHOPS : COIMBATORE_18_SHOPS;

  const computedShops = useMemo(() => {
    return baseShops.map((shop) => {
      const dist = haversineDistanceKm(searchCenter.lat, searchCenter.lng, shop.lat, shop.lng);
      return {
        ...shop,
        distanceKm: Number(dist.toFixed(1)),
      };
    });
  }, [baseShops, searchCenter.lat, searchCenter.lng]);

  const filteredShops = useMemo(() => {
    return computedShops
      .filter((shop) => {
        // Category filter
        if (activeCategory !== "all" && shop.type !== activeCategory) {
          return false;
        }
        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = shop.name.toLowerCase().includes(q);
          const matchesCat = shop.category.toLowerCase().includes(q);
          const matchesAddr = shop.address.toLowerCase().includes(q);
          const matchesLoc = shop.locality.toLowerCase().includes(q);
          if (!matchesName && !matchesCat && !matchesAddr && !matchesLoc) {
            return false;
          }
        }
        // Radius filter
        if (shop.distanceKm > maxRadiusKm) {
          return false;
        }
        // Open now filter
        if (onlyOpenNow && !shop.isOpen) {
          return false;
        }
        // Rating filter
        if (minRating > 0 && shop.rating < minRating) {
          return false;
        }
        // Delivery filter
        if (onlyDelivery && !shop.hasDelivery) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [
    computedShops,
    activeCategory,
    searchQuery,
    maxRadiusKm,
    onlyOpenNow,
    minRating,
    onlyDelivery,
  ]);

  const activeShop = useMemo(() => {
    if (!selectedShopId) return null;
    return (
      filteredShops.find((s) => s.id === selectedShopId) ||
      computedShops.find((s) => s.id === selectedShopId) ||
      null
    );
  }, [filteredShops, computedShops, selectedShopId]);

  // Sync selectedShopId on initial load or if current selected is no longer in filtered list
  useEffect(() => {
    if (
      selectedShopId !== null &&
      filteredShops.length > 0 &&
      !filteredShops.some((s) => s.id === selectedShopId)
    ) {
      setSelectedShopId(filteredShops[0].id);
    }
  }, [filteredShops, selectedShopId]);

  // ─── Initialize Map (Google Maps Primary, MapLibre Clean Fallback) ───
  useEffect(() => {
    let cancelled = false;
    if (!mapContainerRef.current) return;

    loadGoogleMaps()
      .then((googleApi) => {
        if (cancelled || !mapContainerRef.current) return;
        setMapEngine("google");
        const map = new googleApi.maps.Map(
          mapContainerRef.current,
          getGoogleMapOptions({
            center: { lat: userLat, lng: userLng },
            zoom: 14.5,
            maxZoom: 21,
            zoomControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            clickableIcons: false,
          }),
        );
        googleMapRef.current = map;

        // Trigger "Search this area" on user dragging
        map.addListener("dragend", () => {
          const center = map.getCenter();
          if (center) {
            const dist = haversineDistanceKm(
              searchCenterRef.current.lat,
              searchCenterRef.current.lng,
              center.lat(),
              center.lng(),
            );
            if (dist > 0.4) setShowSearchThisArea(true);
          }
        });
      })
      .catch((err) => {
        if (cancelled || !mapContainerRef.current) return;
        console.warn("Falling back to clean MapLibre for NearMe:", err);
        setMapEngine("maplibre");
        const layerConfig = MAP_LAYERS[mapLayer];
        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: {
            version: 8,
            sources: {
              "base-tiles": {
                type: "raster",
                tiles: layerConfig.tiles,
                tileSize: 256,
                attribution: '&copy; CartoDB &copy; OpenStreetMap',
              },
            },
            layers: [
              {
                id: "base-tiles-layer",
                type: "raster",
                source: "base-tiles",
                minzoom: 0,
                maxzoom: 19,
              },
            ],
          },
          center: [userLng, userLat],
          zoom: 13.8,
          attributionControl: false,
        });
        mapRef.current = map;

        map.on("dragend", () => {
          const center = map.getCenter();
          const distFromUser = haversineDistanceKm(
            searchCenterRef.current.lat,
            searchCenterRef.current.lng,
            center.lat,
            center.lng,
          );
          if (distFromUser > 0.4) setShowSearchThisArea(true);
        });
      });

    return () => {
      cancelled = true;
      if (googleMapRef.current) {
        googleRouteLinesRef.current.forEach((line) => line.setMap(null));
        googleRouteLinesRef.current = [];
        Object.values(googleMarkersRef.current).forEach((m) => {
          window.google?.maps?.event?.clearInstanceListeners(m);
          m.setMap(null);
        });
        googleMarkersRef.current = {};
        if (googleUserMarkerRef.current) {
          window.google?.maps?.event?.clearInstanceListeners(googleUserMarkerRef.current);
          googleUserMarkerRef.current.setMap(null);
          googleUserMarkerRef.current = null;
        }
        googleMapRef.current = null;
      }
      if (mapRef.current) {
        if (userMarkerRef.current) {
          userMarkerRef.current.remove();
          userMarkerRef.current = null;
        }
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update MapLibre style when layer changes (if MapLibre fallback is active)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const layerConfig = MAP_LAYERS[mapLayer];
    const source = map.getSource("base-tiles") as maplibregl.RasterTileSource;
    if (source) {
      map.setStyle({
        version: 8,
        sources: {
          "base-tiles": {
            type: "raster",
            tiles: layerConfig.tiles,
            tileSize: 256,
            attribution: '&copy; CartoDB &copy; OpenStreetMap',
          },
        },
        layers: [
          {
            id: "base-tiles-layer",
            type: "raster",
            source: "base-tiles",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      });
    }
  }, [mapLayer]);

  // ─── Directions Calculation ───
  const handleCalculateDirections = useCallback(async (shop: NearShop) => {
    toast.loading("Calculating fastest driving route...");
    try {
      const route = await fetchMapRoute(
        { lat: userLat, lng: userLng },
        { lat: shop.lat, lng: shop.lng },
      );

      if (route && route.geometry && route.geometry.length > 0) {
        toast.dismiss();
        const distKm = Math.round(((route.distanceMeters ?? 0) / 1000) * 10) / 10;
        const durMins = Math.max(1, Math.round((route.durationSeconds ?? 0) / 60));

        setActiveRoute({
          distanceKm: distKm,
          durationMins: durMins,
          shopName: shop.name,
        });

        // 1. Google Maps Route Rendering
        if (googleMapRef.current && window.google?.maps) {
          googleRouteLinesRef.current.forEach((l) => l.setMap(null));
          googleRouteLinesRef.current = [];

          const path = route.geometry.map(([lng, lat]: [number, number]) => ({ lat, lng }));

          const casing = new window.google.maps.Polyline({
            map: googleMapRef.current,
            path,
            strokeColor: "#F59E0B",
            strokeOpacity: 0.6,
            strokeWeight: 8,
          });

          const inner = new window.google.maps.Polyline({
            map: googleMapRef.current,
            path,
            strokeColor: "#581C87",
            strokeOpacity: 0.95,
            strokeWeight: 4,
          });

          googleRouteLinesRef.current = [casing, inner];

          const bounds = new window.google.maps.LatLngBounds();
          path.forEach((pt: { lat: number; lng: number }) => bounds.extend(pt));
          googleMapRef.current.fitBounds(bounds, 80);
        } else if (mapRef.current) {
          // 2. MapLibre Route Rendering
          const routeGeoJSON: any = {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: route.geometry,
            },
          };

          if (mapRef.current.getSource("directions-route")) {
            (mapRef.current.getSource("directions-route") as maplibregl.GeoJSONSource).setData(routeGeoJSON);
          } else {
            mapRef.current.addSource("directions-route", {
              type: "geojson",
              data: routeGeoJSON,
            });

            mapRef.current.addLayer({
              id: "directions-route-casing",
              type: "line",
              source: "directions-route",
              layout: { "line-join": "round", "line-cap": "round" },
              paint: {
                "line-color": "#F59E0B",
                "line-width": 8,
                "line-opacity": 0.6,
              },
            });

            mapRef.current.addLayer({
              id: "directions-route-line",
              type: "line",
              source: "directions-route",
              layout: { "line-join": "round", "line-cap": "round" },
              paint: {
                "line-color": "#581C87",
                "line-width": 4,
                "line-opacity": 0.95,
              },
            });
          }

          const bounds = new maplibregl.LngLatBounds();
          route.geometry.forEach((coord) => bounds.extend(coord as [number, number]));
          mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 15.5 });
        }

        toast.success(`Directions ready: ${distKm} km (~${durMins} mins drive)`);
      } else {
        toast.dismiss();
        toast.error("Could not calculate road route.");
      }
    } catch {
      toast.dismiss();
      toast.error("Failed to load directions.");
    }
  }, [userLat, userLng]);

  const handleClearRoute = () => {
    setActiveRoute(null);
    googleRouteLinesRef.current.forEach((l) => l.setMap(null));
    googleRouteLinesRef.current = [];
    const map = mapRef.current;
    if (map) {
      if (map.getLayer("directions-route-line")) map.removeLayer("directions-route-line");
      if (map.getLayer("directions-route-casing")) map.removeLayer("directions-route-casing");
      if (map.getSource("directions-route")) map.removeSource("directions-route");
    }
    toast.info("Route cleared");
  };

  // ─── Select Shop Handler ───
  const handleSelectShop = useCallback((shop: NearShop) => {
    setSelectedShopId(shop.id);

    if (googleMapRef.current) {
      googleMapRef.current.panTo({ lat: shop.lat, lng: shop.lng });
      if ((googleMapRef.current.getZoom() ?? 14) < 15) {
        googleMapRef.current.setZoom(15);
      }
    } else if (mapRef.current) {
      const isMobile = window.innerWidth < 768;
      const offsetY = isMobile ? -80 : -20;
      mapRef.current.flyTo({
        center: [shop.lng, shop.lat],
        zoom: Math.max(mapRef.current.getZoom(), 14.5),
        offset: [0, offsetY],
        speed: 1.2,
      });
    }

    // Smooth scroll the corresponding carousel card into view on both mobile and desktop
    const mobileEl = document.getElementById(`shop-card-${shop.id}`);
    if (mobileEl) {
      mobileEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
    const desktopEl = document.getElementById(`desktop-shop-card-${shop.id}`);
    if (desktopEl) {
      desktopEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, []);

  // ─── Synchronize Map Markers (ONLY LocalShore Shops, Zero Clutter) ───
  useEffect(() => {
    // 1. Google Maps Mode
    if (googleMapRef.current && window.google?.maps) {
      const googleMap = googleMapRef.current;

      // Remove previous markers cleanly to prevent listener leaks
      Object.values(googleMarkersRef.current).forEach((m) => {
        window.google?.maps?.event?.clearInstanceListeners(m);
        m.setMap(null);
      });
      googleMarkersRef.current = {};

      // User location marker
      if (!googleUserMarkerRef.current) {
        googleUserMarkerRef.current = new window.google.maps.Marker({
          map: googleMap,
          position: { lat: userLat, lng: userLng },
          title: "You are here",
          icon: getGoogleUserPinIcon(),
          zIndex: 100,
        });
      } else {
        googleUserMarkerRef.current.setPosition({ lat: userLat, lng: userLng });
      }

      // Shop markers (ONLY verified LocalShore shops)
      filteredShops.forEach((shop) => {
        const isSelected = shop.id === selectedShopId;
        const iconConfig = createGoogleShopMarkerIcon(shop.type, isSelected);
        const marker = new window.google.maps.Marker({
          map: googleMap,
          position: { lat: shop.lat, lng: shop.lng },
          title: shop.name,
          icon: iconConfig,
          zIndex: isSelected ? 60 : 30,
        });

        marker.addListener("click", () => {
          handleSelectShop(shop);
        });

        googleMarkersRef.current[shop.id] = marker;
      });
      return;
    }

    // 2. MapLibre Fallback Mode
    const map = mapRef.current;
    if (!map) return;

    Object.values(markersOnMapRef.current).forEach((marker) => marker.remove());
    markersOnMapRef.current = {};

    if (!userMarkerRef.current) {
      const userEl = document.createElement("div");
      userEl.className =
        "ls-user-pin flex flex-col items-center pointer-events-none select-none -translate-x-1/2 -translate-y-1/2";
      userEl.innerHTML = `
        <div style="background:#2563EB;color:white;font-size:10px;font-weight:800;padding:2px 8px;border-radius:9999px;box-shadow:0 4px 10px rgba(37,99,235,0.3);margin-bottom:2px;white-space:nowrap;">
          You are here
        </div>
        <div style="position:relative;display:flex;align-items:center;justify-content:center;width:24px;height:24px;">
          <div style="position:absolute;width:38px;height:38px;border-radius:9999px;background:rgba(37,99,235,0.22);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="width:14px;height:14px;border-radius:9999px;background:#2563EB;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);z-index:2;"></div>
        </div>
      `;
      userMarkerRef.current = new maplibregl.Marker({ element: userEl, anchor: "center" })
        .setLngLat([userLng, userLat])
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat([userLng, userLat]);
    }

    filteredShops.forEach((shop) => {
      const isSelected = shop.id === selectedShopId;
      const el = document.createElement("div");
      el.id = `map-marker-${shop.id}`;
      el.className = "ls-shop-marker relative flex flex-col items-center cursor-pointer select-none";
      el.style.zIndex = isSelected ? "40" : "20";

      const iconSvg = getCategoryIconSvg(shop.type);
      const pinColor = isSelected ? "#581C87" : "#8B2FC9";

      el.innerHTML = `
        <div class="marker-pulse-ring" style="display:${isSelected ? "block" : "none"};position:absolute;top:-8px;left:-8px;width:56px;height:56px;border-radius:9999px;background:rgba(168,56,189,0.28);animation:ping 2s infinite;pointer-events:none;"></div>
        <div class="marker-pin-circle" style="width:40px;height:40px;border-radius:9999px;background:${pinColor};display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 4px 14px rgba(112,11,110,0.35);border:2.5px solid white;transform:${isSelected ? "scale(1.18)" : "scale(1)"};transition:transform 0.2s ease, background 0.2s ease;">
          ${iconSvg}
        </div>
        <div class="marker-pin-tip" style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid ${pinColor};margin-top:-1px;"></div>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        handleSelectShop(shop);
      });

      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([shop.lng, shop.lat])
        .addTo(map);

      markersOnMapRef.current[shop.id] = marker;
    });
  }, [filteredShops, userLat, userLng, selectedShopId, handleSelectShop]);

  // ─── Search This Area Handler ───
  const handleSearchThisArea = () => {
    if (googleMapRef.current) {
      const center = googleMapRef.current.getCenter();
      if (center) {
        setSearchCenter({ lat: center.lat(), lng: center.lng() });
        setShowSearchThisArea(false);
        toast.success("Updated shops for current map area! 📍");
      }
      return;
    }
    const map = mapRef.current;
    if (!map) return;
    const center = map.getCenter();
    setSearchCenter({ lat: center.lat, lng: center.lng });
    setShowSearchThisArea(false);
    toast.success("Updated shops for current map area! 📍");
  };

  // ─── Current Location Button ───
  const handleFlyToMyLocation = () => {
    if (googleMapRef.current) {
      googleMapRef.current.panTo({ lat: userLat, lng: userLng });
      googleMapRef.current.setZoom(15);
    } else if (mapRef.current) {
      mapRef.current.flyTo({ center: [userLng, userLat], zoom: 14.5, speed: 1.3 });
    }
    setSearchCenter({ lat: userLat, lng: userLng });
    setShowSearchThisArea(false);
    toast.success("Centered on your current location!");
  };

  // ─── Zoom Controls ───
  const handleZoomIn = () => {
    if (googleMapRef.current) {
      googleMapRef.current.setZoom((googleMapRef.current.getZoom() ?? 14) + 1);
    } else if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };
  const handleZoomOut = () => {
    if (googleMapRef.current) {
      googleMapRef.current.setZoom(Math.max((googleMapRef.current.getZoom() ?? 14) - 1, 3));
    } else if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  // ─── Cycle Map Layer ───
  const handleCycleLayer = () => {
    if (googleMapRef.current) {
      const currentType = googleMapRef.current.getMapTypeId();
      const nextType = currentType === "roadmap" ? "hybrid" : "roadmap";
      googleMapRef.current.setMapTypeId(nextType);
      toast.info(`Map layer switched to ${nextType === "hybrid" ? "Satellite" : "Clean Map"}`);
      return;
    }
    const layers: (keyof typeof MAP_LAYERS)[] = ["streets", "light", "satellite"];
    const currentIdx = layers.indexOf(mapLayer);
    const nextLayer = layers[(currentIdx + 1) % layers.length];
    setMapLayer(nextLayer);
    toast.info(`Map layer switched to ${MAP_LAYERS[nextLayer].label}`);
  };

  // ─── Touch Drag Handlers for Mobile Bottom Sheet ───
  const handleSheetTouchStart = (e: React.TouchEvent) => {
    sheetTouchStartY.current = e.touches[0].clientY;
  };

  const handleSheetTouchEnd = (e: React.TouchEvent) => {
    if (sheetTouchStartY.current === null) return;
    const deltaY = e.changedTouches[0].clientY - sheetTouchStartY.current;
    sheetTouchStartY.current = null;

    if (deltaY < -40) {
      // Swiped UP
      if (sheetState === "collapsed") setSheetState("half");
      else if (sheetState === "half") setSheetState("expanded");
    } else if (deltaY > 40) {
      // Swiped DOWN
      if (sheetState === "expanded") setSheetState("half");
      else if (sheetState === "half") setSheetState("collapsed");
    }
  };

  return (
    <div className="relative w-full min-h-screen md:min-h-screen h-[100dvh] md:h-auto overflow-hidden md:overflow-y-auto bg-[#F8FAFC] flex flex-col font-sans select-none">
      {/* ── 0. Desktop Sticky Top Navbar (Hidden on Mobile) ── */}
      <div className="hidden md:block sticky top-0 z-50 bg-white shadow-2xs">
        <TopNavbar />
      </div>

      {/* ── 1. Mobile Top Header Bar (Hidden on Desktop, Matching Image 1 & 5) ── */}
      <header className="md:hidden shrink-0 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-3.5 py-2.5 z-40">
        <div className="flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#581C87] to-[#8B2FC9] text-white shadow-xs">
              <Heart className="h-4 w-4 fill-current" />
            </div>
            <div>
              <span className="text-sm font-black tracking-tight text-[#581C87] block leading-none">
                LocalShore
              </span>
              <span className="text-[9px] font-bold text-[#8C82A0] uppercase tracking-wider block mt-0.5">
                Shop • Share • Support Local
              </span>
            </div>
          </Link>

          {/* Location Selector Pill */}
          <button
            type="button"
            onClick={requestLocationModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] transition cursor-pointer max-w-[180px] truncate"
          >
            <MapPin className="h-3.5 w-3.5 text-[#8B2FC9] shrink-0" />
            <span className="truncate">{currentArea}</span>
            <ChevronDown className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
          </button>

          {/* Right Action Icons (Notifications & Profile) */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/notifications"
              className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-[#F8FAFC] text-[#0F172A] hover:bg-[#F1F5F9] border border-[#E2E8F0] transition"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#F59E0B] ring-2 ring-white" />
            </Link>

            <Link
              to="/profile"
              className="flex h-8 w-8 items-center justify-center rounded-xl overflow-hidden border border-[#E2E8F0] bg-[#F8FAFC]"
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                alt="Profile"
                className="h-full w-full object-cover"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* ── 2. Mobile Top Search & Filter Bar (Hidden on Desktop) ── */}
      <div className="md:hidden shrink-0 bg-white border-b border-[#E2E8F0] px-3.5 py-2 z-30 shadow-2xs">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B2FC9]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find shops, products, services..."
              className="w-full pl-9 pr-8 py-2 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-medium text-[#0F172A] placeholder-[#8C82A0] focus:outline-none focus:ring-2 focus:ring-[#8B2FC9]/40 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#8C82A0] hover:text-[#0F172A]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter Sliders Button */}
          <button
            type="button"
            onClick={() => setIsFilterModalOpen(true)}
            aria-label="Filter Options"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#F8FAFC] hover:bg-[#F3E8FF] border border-[#E2E8F0] text-[#8B2FC9] transition cursor-pointer shadow-2xs active:scale-95"
          >
            <SlidersHorizontal className="h-4 w-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Horizontal Category Chips */}
        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 touch-pan-x">
          {CATEGORY_CHIPS.map((chip) => {
            const isActive = activeCategory === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setActiveCategory(chip.id)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                  isActive
                    ? "bg-[#8B2FC9] text-white shadow-sm ring-2 ring-[#8B2FC9]/30"
                    : "bg-[#F8FAFC] text-[#554968] hover:bg-[#F3E8FF] hover:text-[#0F172A] border border-[#E2E8F0]"
                }`}
              >
                {chip.id === "all" && <StoreIcon className="h-3.5 w-3.5" />}
                {chip.id === "bakery" && <span className="text-sm">🥐</span>}
                {chip.id === "grocery" && <ShoppingCart className="h-3.5 w-3.5" />}
                {chip.id === "pharmacy" && <span className="text-sm">➕</span>}
                {chip.id === "fashion" && <Shirt className="h-3.5 w-3.5" />}
                {chip.id === "restaurants" && <Utensils className="h-3.5 w-3.5" />}
                {chip.id === "fresh" && <Leaf className="h-3.5 w-3.5 text-emerald-600" />}
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Layout Body: Desktop Sidebar + Content or Mobile Map Column ── */}
      <div className="flex-1 w-full min-h-0 flex flex-col md:mx-auto md:max-w-[1440px] md:px-6 md:pt-4">
        <div className="flex-1 min-h-0 md:flex md:gap-6 md:items-start">
          {/* Desktop Left Persistent Sidebar */}
          <aside className="hidden md:block w-64 shrink-0">
            <LeftSidebar />
          </aside>

          {/* Main Column */}
          <main className="flex-1 min-w-0 flex flex-col h-full md:h-auto">
            {/* ── Desktop Banner (Matching Image 2 / 6) ── */}
            <div className="hidden md:block mb-4 overflow-hidden rounded-3xl bg-gradient-to-r from-[#F8FAFC] via-[#F6ECFC] to-[#F8FAFC] border border-[#E2E8F0] p-5 shadow-xs">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#F59E0B] shadow-sm text-[#581C87]">
                    <MapPin className="h-6 w-6 text-[#581C87] fill-[#581C87]" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">
                      Discover shops near you
                    </h1>
                    <p className="text-xs sm:text-sm text-[#64748B] font-medium mt-1">
                      Find local shops, fresh products, daily essentials and more around {isBLR ? "JP Nagar, Bengaluru" : "Coimbatore"}.
                    </p>
                  </div>
                </div>
                {/* Mountain skyline illustration */}
                <div className="hidden lg:block shrink-0 opacity-75 pointer-events-none">
                  <svg width="240" height="60" viewBox="0 0 240 60" fill="none">
                    <path d="M0 60 L35 38 L60 48 L95 24 L125 44 L160 16 L190 42 L215 32 L240 60 Z" fill="#E2E8F0" opacity="0.6"/>
                    <path d="M20 60 L65 32 L95 52 L140 20 L180 46 L205 28 L240 60 Z" fill="#D9C2E8" opacity="0.7"/>
                    <rect x="155" y="18" width="10" height="24" rx="2" fill="#8B2FC9" opacity="0.5"/>
                    <polygon points="160,10 153,18 167,18" fill="#581C87" opacity="0.6"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* ── Desktop Controls Bar (Category chips, Radius, Map/List Toggle) ── */}
            <div className="hidden md:flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E2E8F0] shadow-2xs mb-4">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {CATEGORY_CHIPS.map((chip) => {
                  const isActive = activeCategory === chip.id;
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setActiveCategory(chip.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer select-none ${
                        isActive
                          ? "bg-[#8B2FC9] text-white shadow-xs"
                          : "bg-[#F8FAFC] text-[#554968] hover:bg-[#F3E8FF] border border-[#E2E8F0]"
                      }`}
                    >
                      {chip.id === "all" && <StoreIcon className="h-3.5 w-3.5" />}
                      {chip.id === "bakery" && <span>🥐</span>}
                      {chip.id === "grocery" && <ShoppingCart className="h-3.5 w-3.5" />}
                      {chip.id === "pharmacy" && <span>➕</span>}
                      {chip.id === "fashion" && <Shirt className="h-3.5 w-3.5" />}
                      {chip.id === "restaurants" && <Utensils className="h-3.5 w-3.5" />}
                      {chip.id === "fresh" && <Leaf className="h-3.5 w-3.5 text-emerald-600" />}
                      <span>{chip.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2.5">
                {/* Distance Radius Dropdown */}
                <div className="relative">
                  <select
                    value={maxRadiusKm}
                    onChange={(e) => setMaxRadiusKm(Number(e.target.value))}
                    className="appearance-none pl-3 pr-8 py-1.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#581C87] hover:bg-[#F1F5F9] cursor-pointer focus:outline-none"
                  >
                    <option value={1}>Within 1 km</option>
                    <option value={3}>Within 3 km</option>
                    <option value={5}>Within 5 km</option>
                    <option value={10}>Within 10 km</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8B2FC9] pointer-events-none" />
                </div>

                {/* View Mode Toggle: [Map] [List] */}
                <div className="flex items-center rounded-xl bg-[#F8FAFC] p-1 border border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => setDesktopViewMode("map")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      desktopViewMode === "map"
                        ? "bg-[#8B2FC9] text-white shadow-2xs"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    <span>Map</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDesktopViewMode("list")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      desktopViewMode === "list"
                        ? "bg-[#8B2FC9] text-white shadow-2xs"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    <span>List</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Interactive Map Canvas Container (Full on Mobile, Framed 520px on Desktop) ── */}
            <div
              className={`relative w-full overflow-hidden ${
                desktopViewMode === "list"
                  ? "hidden md:hidden"
                  : "flex-1 min-h-0 h-full md:h-[520px] md:flex-none md:rounded-3xl md:border md:border-[#E2E8F0] md:shadow-xs"
              }`}
            >
              {/* Map Mount Container */}
              <div ref={mapContainerRef} className="absolute inset-0 w-full h-full bg-[#FAF7FC]" />

              {/* Active Shop Popup Card Overlay on Desktop Map View */}
              {activeShop && desktopViewMode === "map" && (
                <div className="absolute top-3.5 left-3.5 z-40 w-[295px] sm:w-[335px] rounded-3xl bg-white p-3 sm:p-3.5 shadow-2xl border border-[#E2E8F0] select-none animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-start gap-3">
                    <img
                      src={activeShop.image}
                      alt={activeShop.name}
                      className="h-12 w-12 rounded-xl object-cover border border-[#E2E8F0] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <h4 className="font-bold text-sm text-[#0F172A] truncate">{activeShop.name}</h4>
                          <CheckCircle2 className="h-3.5 w-3.5 fill-[#581C87] text-white shrink-0" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedShopId(null)}
                          className="h-6 w-6 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#64748B]">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span className="font-bold text-[#0F172A]">{activeShop.rating}</span>
                        <span>({activeShop.reviewsCount > 999 ? `${(activeShop.reviewsCount / 1000).toFixed(1)}k` : activeShop.reviewsCount} reviews)</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#64748B]">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-3 w-3 text-[#8B2FC9]" />
                          {activeShop.distanceKm} km away
                        </span>
                        <span className={`font-semibold ${activeShop.isOpen ? "text-emerald-600" : "text-rose-500"}`}>
                          {activeShop.isOpen ? "Open now" : "Closed"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-[#F0E4F8] flex items-center gap-2">
                    <Link
                      to="/store/$storeId"
                      params={{ storeId: activeShop.id }}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-[#581C87] text-white text-xs font-bold text-center hover:bg-[#590957] transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <StoreIcon className="h-3.5 w-3.5" />
                      <span>View Shop</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleCalculateDirections(activeShop)}
                      className="flex-1 py-1.5 px-3 rounded-xl border border-[#8B2FC9] text-[#581C87] text-xs font-bold text-center hover:bg-[#F8FAFC] transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Navigation className="h-3.5 w-3.5 text-[#8B2FC9]" />
                      <span>Directions</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Floating "Search this area" Button */}
              {showSearchThisArea && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-top-2">
                  <button
                    type="button"
                    onClick={handleSearchThisArea}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-[#581C87] text-xs font-extrabold shadow-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition active:scale-95 cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-[#8B2FC9] animate-spin-slow" />
                    <span>Search this area</span>
                  </button>
                </div>
              )}

              {/* Active Driving Route Banner */}
              {activeRoute && (
                <div className="absolute top-3 left-4 right-14 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto z-30">
                  <div className="flex items-center justify-between gap-3 px-4 py-2 rounded-2xl bg-white shadow-xl border border-amber-300 text-xs font-bold text-[#0F172A]">
                    <div className="flex items-center gap-2 truncate">
                      <Navigation className="h-4 w-4 text-[#8B2FC9] shrink-0" />
                      <span className="truncate">
                        Driving to {activeRoute.shopName}:{" "}
                        <span className="text-[#8B2FC9]">{activeRoute.distanceKm} km</span> (~
                        {activeRoute.durationMins} mins)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearRoute}
                      className="text-xs text-rose-600 hover:underline shrink-0 font-bold cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Floating Map Controls on Right Edge */}
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex flex-col items-end gap-2 z-30">
                {/* Current Location Button */}
                <button
                  type="button"
                  onClick={handleFlyToMyLocation}
                  title="My Location"
                  className="flex h-10 w-10 md:h-10 md:w-auto md:px-3 items-center justify-center gap-1.5 rounded-2xl bg-white text-[#0F172A] shadow-md border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:text-[#8B2FC9] transition active:scale-95 cursor-pointer"
                >
                  <LocateFixed className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden md:inline text-xs font-bold">My Location</span>
                </button>

                {/* Map Layer Selector Button */}
                <button
                  type="button"
                  onClick={handleCycleLayer}
                  title={`Current: ${MAP_LAYERS[mapLayer].label}`}
                  className="flex h-10 w-10 md:h-10 md:w-auto md:px-3 items-center justify-center gap-1.5 rounded-2xl bg-white text-[#0F172A] shadow-md border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:text-[#8B2FC9] transition active:scale-95 cursor-pointer"
                >
                  <Layers className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden md:inline text-xs font-bold">Map Layers</span>
                </button>

                {/* Desktop Radius Pill indicator */}
                <div className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-white text-[#581C87] shadow-md border border-[#E2E8F0] text-xs font-bold">
                  <Navigation className="h-3.5 w-3.5 text-[#8B2FC9]" />
                  <span>Radius: {maxRadiusKm} km</span>
                </div>

                {/* Zoom In & Out Controls */}
                <div className="flex flex-col rounded-2xl bg-white shadow-md border border-[#E2E8F0] overflow-hidden">
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    title="Zoom In"
                    className="flex h-9 w-10 items-center justify-center text-[#0F172A] hover:bg-[#F8FAFC] hover:text-[#8B2FC9] transition border-b border-[#F0E4F8] active:scale-95 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    title="Zoom Out"
                    className="flex h-9 w-10 items-center justify-center text-[#0F172A] hover:bg-[#F8FAFC] hover:text-[#8B2FC9] transition active:scale-95 cursor-pointer"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Desktop List View (When View Mode is set to 'list') ── */}
            {desktopViewMode === "list" && (
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
                {filteredShops.map((shop) => (
                  <div
                    key={shop.id}
                    onClick={() => handleSelectShop(shop)}
                    className="rounded-2xl border border-[#E2E8F0] bg-white p-4 hover:border-[#8B2FC9] hover:shadow-md transition cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={shop.image}
                        alt={shop.name}
                        className="h-20 w-20 rounded-xl object-cover shrink-0"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between">
                          <h4 className="font-extrabold text-sm text-[#0F172A] truncate flex items-center gap-1">
                            <span className="truncate">{shop.name}</span>
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#8B2FC9] fill-[#8B2FC9] text-white shrink-0" />
                          </h4>
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            ★ {shop.rating}
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B] font-medium truncate mt-0.5">
                          {shop.category}
                        </p>
                        <p className="text-xs text-[#64748B] mt-1.5 truncate flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-[#8B2FC9] shrink-0" />
                          <span>{shop.distanceKm} km away • {shop.locality}</span>
                        </p>
                        <div className="mt-3 pt-2 border-t border-[#F5EDFD] flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Open now
                          </span>
                          <Link
                            to="/store/$storeId"
                            params={{ storeId: shop.id }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-bold text-[#8B2FC9] hover:text-[#581C87] flex items-center gap-1"
                          >
                            <span>View Shop</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Desktop Bottom Carousel Strip (Matching Image 2 / 6) ── */}
            <div className="hidden md:block mt-4 bg-white border border-[#E2E8F0] rounded-3xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <StoreIcon className="h-5 w-5 text-[#8B2FC9]" />
                  <h3 className="font-black text-sm text-[#0F172A]">
                    {filteredShops.length} shops nearby
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("desktop-shop-carousel");
                      if (el) el.scrollBy({ left: -340, behavior: "smooth" });
                    }}
                    className="h-8 w-8 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F3E8FF] text-[#8B2FC9] flex items-center justify-center transition cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("desktop-shop-carousel");
                      if (el) el.scrollBy({ left: 340, behavior: "smooth" });
                    }}
                    className="h-8 w-8 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F3E8FF] text-[#8B2FC9] flex items-center justify-center transition cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div
                id="desktop-shop-carousel"
                className="overflow-x-auto no-scrollbar flex items-center gap-3.5 pb-1 touch-pan-x"
              >
                {filteredShops.map((shop) => {
                  const isSelected = shop.id === selectedShopId;
                  return (
                    <div
                      key={shop.id}
                      id={`desktop-shop-card-${shop.id}`}
                      onClick={() => handleSelectShop(shop)}
                      className={`shrink-0 w-[300px] xl:w-[330px] rounded-2xl border bg-white p-3 shadow-xs cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "border-2 border-[#8B2FC9] ring-2 ring-[#8B2FC9]/20 shadow-md scale-[1.02]"
                          : "border-[#E2E8F0] hover:border-[#8B2FC9]/40 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={shop.image}
                          alt={shop.name}
                          className="h-20 w-20 rounded-xl object-cover shrink-0"
                          loading="lazy"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-sm text-[#0F172A] truncate flex items-center gap-1">
                            <span className="truncate">{shop.name}</span>
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#8B2FC9] fill-[#8B2FC9] text-white shrink-0" />
                          </h4>
                          <p className="text-xs text-[#64748B] font-medium truncate mt-0.5">
                            {shop.category}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs mt-1.5">
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                            <span className="font-bold text-[#0F172A]">{shop.rating}</span>
                            <span className="text-[#8C82A0] text-[11px]">
                              ({shop.reviewsCount > 999 ? `${(shop.reviewsCount / 1000).toFixed(1)}K` : shop.reviewsCount})
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                              Open now
                            </span>
                          </div>
                          <p className="text-xs text-[#64748B] font-medium mt-1 truncate flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-[#8B2FC9] shrink-0" />
                            <span>
                              {shop.distanceKm} km • {shop.locality}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* ── 5. Mobile Draggable Bottom Sheet (Collapsed, Half, Expanded Snap States) ── */}
      <div
        className={`fixed inset-x-0 bottom-14 z-30 bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-[#E2E8F0] flex flex-col transition-all duration-300 md:hidden ${
          sheetState === "collapsed"
            ? "h-[68px]"
            : sheetState === "expanded"
              ? "h-[75vh]"
              : "h-[275px]"
        }`}
      >
        {/* Drag Handle Bar */}
        <div
          onTouchStart={handleSheetTouchStart}
          onTouchEnd={handleSheetTouchEnd}
          onClick={() => {
            if (sheetState === "collapsed") setSheetState("half");
            else if (sheetState === "half") setSheetState("expanded");
            else setSheetState("half");
          }}
          className="pt-2.5 pb-1 flex justify-center cursor-grab touch-none"
        >
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Sheet Header: Count & Toggle */}
        <div className="px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <StoreIcon className="h-5 w-5 text-[#8B2FC9]" />
            <h3 className="font-black text-sm sm:text-base text-[#0F172A]">
              {filteredShops.length} shops nearby
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setSheetState(sheetState === "expanded" ? "half" : "expanded")}
            className="text-xs font-black text-[#8B2FC9] hover:text-[#581C87] flex items-center gap-1 cursor-pointer"
          >
            <span>{sheetState === "expanded" ? "Show Map" : "View All"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Half State: Horizontal Carousel */}
        {sheetState !== "expanded" && (
          <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-3 px-4 pb-3 touch-pan-x">
            {filteredShops.map((shop) => {
              const isSelected = shop.id === selectedShopId;
              return (
                <div
                  key={shop.id}
                  id={`shop-card-${shop.id}`}
                  onClick={() => handleSelectShop(shop)}
                  className={`shrink-0 w-[255px] xs:w-[275px] sm:w-[310px] rounded-2xl border bg-white p-3 shadow-xs cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "border-2 border-[#8B2FC9] ring-2 ring-[#8B2FC9]/20 shadow-md scale-[1.02]"
                      : "border-[#E2E8F0] hover:border-[#8B2FC9]/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={shop.image}
                      alt={shop.name}
                      className="h-20 w-22 rounded-xl object-cover shrink-0"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-sm text-[#0F172A] truncate flex items-center gap-1">
                        <span className="truncate">{shop.name}</span>
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#8B2FC9] fill-[#8B2FC9] text-white shrink-0" />
                      </h4>
                      <p className="text-xs text-[#64748B] font-medium truncate mt-0.5">
                        {shop.category}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs mt-1.5">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        <span className="font-bold text-[#0F172A]">{shop.rating}</span>
                        <span className="text-[#8C82A0] text-[11px]">
                          ({shop.reviewsCount > 999 ? `${(shop.reviewsCount / 1000).toFixed(1)}K` : shop.reviewsCount})
                        </span>
                        <span className="px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          Open now
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] font-medium mt-1 truncate flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[#8B2FC9] shrink-0" />
                        <span>
                          {shop.distanceKm} km • {shop.locality}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Expanded State: Full Vertical List */}
        {sheetState === "expanded" && (
          <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-8">
            {filteredShops.map((shop) => {
              const isSelected = shop.id === selectedShopId;
              return (
                <div
                  key={shop.id}
                  onClick={() => {
                    handleSelectShop(shop);
                    setSheetState("half");
                  }}
                  className={`rounded-2xl border p-3.5 transition-all bg-white cursor-pointer ${
                    isSelected
                      ? "border-2 border-[#8B2FC9] ring-2 ring-[#8B2FC9]/20 shadow-md"
                      : "border-[#E2E8F0] hover:border-[#8B2FC9]/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={shop.image}
                      alt={shop.name}
                      className="h-20 w-22 rounded-xl object-cover shrink-0"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-extrabold text-sm text-[#0F172A] truncate flex items-center gap-1">
                            <span>{shop.name}</span>
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#8B2FC9] fill-[#8B2FC9] text-white shrink-0" />
                          </h4>
                          <p className="text-xs text-[#64748B] font-medium mt-0.5">
                            {shop.category}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{shop.rating}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs mt-2">
                        <span className="font-bold text-[#0F172A] flex items-center gap-1">
                          <Navigation className="h-3 w-3 text-[#8B2FC9]" />
                          {shop.distanceKm} km away
                        </span>
                        <span className="text-[#8C82A0]">•</span>
                        <span className="text-[#64748B]">{shop.address}</span>
                      </div>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#F5EDFD]">
                        <div className="flex items-center gap-2 text-[11px]">
                          {shop.hasDelivery && (
                            <span className="flex items-center gap-1 rounded-full bg-[#F8FAFC] px-2 py-0.5 text-[#8B2FC9] font-medium border border-[#E2E8F0]">
                              <Bike className="h-3 w-3" />
                              <span>Delivery</span>
                            </span>
                          )}
                          {shop.hasPickup && (
                            <span className="flex items-center gap-1 rounded-full bg-[#F8FAFC] px-2 py-0.5 text-[#64748B] font-medium border border-[#E2E8F0]">
                              <ShoppingBag className="h-3 w-3" />
                              <span>Pickup</span>
                            </span>
                          )}
                        </div>

                        <Link
                          to="/store/$storeId"
                          params={{ storeId: shop.id }}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-bold text-[#8B2FC9] hover:text-[#581C87] flex items-center gap-1"
                        >
                          <span>Visit Shop</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 7. Persistent Mobile Bottom Navigation (Matching Image 1) ── */}
      <nav className="fixed bottom-0 inset-x-0 h-14 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] z-40 flex items-center justify-around px-2 md:hidden">
        {/* Home */}
        <Link
          to="/"
          className="flex flex-col items-center justify-center py-1 px-3 text-[#64748B] hover:text-[#8B2FC9] transition"
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-bold mt-0.5">Home</span>
        </Link>

        {/* Explore */}
        <Link
          to="/explore"
          className="flex flex-col items-center justify-center py-1 px-3 text-[#64748B] hover:text-[#8B2FC9] transition"
        >
          <Compass className="h-5 w-5" />
          <span className="text-[10px] font-bold mt-0.5">Explore</span>
        </Link>

        {/* Near Me (Active Highlighted Brand Purple Capsule) */}
        <Link
          to="/near-me"
          className="flex flex-col items-center justify-center py-1 px-4 rounded-2xl bg-[#F8FAFC] text-[#8B2FC9] border border-[#E2E8F0] shadow-xs"
        >
          <MapPin className="h-5 w-5 text-[#8B2FC9]" />
          <span className="text-[10px] font-extrabold mt-0.5 text-[#581C87]">Near Me</span>
        </Link>

        {/* Community */}
        <Link
          to="/community"
          className="flex flex-col items-center justify-center py-1 px-3 text-[#64748B] hover:text-[#8B2FC9] transition"
        >
          <Users className="h-5 w-5" />
          <span className="text-[10px] font-bold mt-0.5">Community</span>
        </Link>

        {/* Profile */}
        <Link
          to="/profile"
          className="flex flex-col items-center justify-center py-1 px-3 text-[#64748B] hover:text-[#8B2FC9] transition"
        >
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
            alt="Profile"
            className="h-5 w-5 rounded-full object-cover border border-[#E2E8F0]"
          />
          <span className="text-[10px] font-bold mt-0.5">Profile</span>
        </Link>
      </nav>

      {/* ── 8. Filter Options Modal (Opened via sliders button) ── */}
      <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
        <DialogContent className="max-w-md p-5 rounded-3xl bg-white shadow-2xl border border-[#E2E8F0]">
          <DialogTitle className="text-base sm:text-lg font-black text-[#0F172A] flex items-center justify-between">
            <span>Filter Shops</span>
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(false)}
              className="p-1 rounded-full text-[#8C82A0] hover:text-[#0F172A]"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogTitle>

          <div className="space-y-4 mt-3">
            {/* Radius Selector */}
            <div>
              <label className="text-xs font-bold text-[#64748B] block mb-2">Distance Radius</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 3, 5, 10].map((km) => (
                  <button
                    key={km}
                    type="button"
                    onClick={() => setMaxRadiusKm(km)}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      maxRadiusKm === km
                        ? "bg-[#8B2FC9] text-white border-[#8B2FC9]"
                        : "bg-[#F8FAFC] text-[#0F172A] border-[#E2E8F0] hover:bg-[#F1F5F9]"
                    }`}
                  >
                    {km} km
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Filter Toggles */}
            <div className="space-y-2 pt-2 border-t border-[#F5EDFD]">
              <label className="text-xs font-bold text-[#64748B] block">Preferences</label>

              {/* Open Now */}
              <button
                type="button"
                onClick={() => setOnlyOpenNow(!onlyOpenNow)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border text-xs font-bold transition ${
                  onlyOpenNow
                    ? "bg-[#F8FAFC] border-[#8B2FC9] text-[#581C87]"
                    : "bg-white border-[#E2E8F0] text-[#0F172A]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#8B2FC9]" />
                  <span>Open Now Only</span>
                </div>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                    onlyOpenNow ? "bg-[#8B2FC9] border-[#8B2FC9] text-white" : "border-[#D1C4E9]"
                  }`}
                >
                  {onlyOpenNow && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
              </button>

              {/* Rating 4.0+ */}
              <button
                type="button"
                onClick={() => setMinRating(minRating === 4.0 ? 0 : 4.0)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border text-xs font-bold transition ${
                  minRating === 4.0
                    ? "bg-[#F8FAFC] border-[#8B2FC9] text-[#581C87]"
                    : "bg-white border-[#E2E8F0] text-[#0F172A]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span>Rated 4.0 & Above</span>
                </div>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                    minRating === 4.0 ? "bg-[#8B2FC9] border-[#8B2FC9] text-white" : "border-[#D1C4E9]"
                  }`}
                >
                  {minRating === 4.0 && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
              </button>

              {/* Fast Delivery */}
              <button
                type="button"
                onClick={() => setOnlyDelivery(!onlyDelivery)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border text-xs font-bold transition ${
                  onlyDelivery
                    ? "bg-[#F8FAFC] border-[#8B2FC9] text-[#581C87]"
                    : "bg-white border-[#E2E8F0] text-[#0F172A]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bike className="h-4 w-4 text-[#8B2FC9]" />
                  <span>Fast Delivery Available</span>
                </div>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                    onlyDelivery ? "bg-[#8B2FC9] border-[#8B2FC9] text-white" : "border-[#D1C4E9]"
                  }`}
                >
                  {onlyDelivery && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setMaxRadiusKm(10);
                  setOnlyOpenNow(false);
                  setMinRating(0);
                  setOnlyDelivery(false);
                }}
                className="flex-1 py-2.5 rounded-full border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:bg-[#F8FAFC]"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFilterModalOpen(false);
                  toast.success("Filters applied!");
                }}
                className="flex-1 py-2.5 rounded-full bg-[#8B2FC9] text-white text-xs font-bold hover:bg-[#7812B8] shadow-xs"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
