export type StoreCategory =
  | "showrooms"
  | "boutiques"
  | "fast_fashion"
  | "individual_fashion"
  | "flour_mill"
  | "palamuthir"
  | "meat_fish"
  | "pharmacy"
  | "stationery"
  | "home_decor"
  | "kitchen_appliances"
  | "fashion_accessories"
  | "bakery"
  | "grocery";

export interface Store {
  id: string;
  name: string;
  category: StoreCategory;
  tagline: string;
  distanceKm: number;
  rating: number;
  isOpen: boolean;
  etaMin: number;
  address: string;
  lat: number;
  lng: number;
  imageUrl: string;
}

export interface DeliveryCategory {
  id: string;
  label: string;
  imageUrl: string;
  filter?: StoreCategory;
}

const catImg = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=300&q=75`;
const storeImg = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=75`;
const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=300&q=75`;

export const APPROVED_STORE: Store = {
  id: "approved-catalog",
  name: "Verified local products",
  category: "grocery",
  tagline: "Approved by Seller Hub",
  distanceKm: 2,
  rating: 5,
  isOpen: true,
  etaMin: 30,
  address: "Available from approved local vendors",
  lat: 9.9816,
  lng: 76.2999,
  imageUrl: catImg("photo-1542838132-92c53300491e"),
};

export const deliveryCategories: DeliveryCategory[] = [
  {
    id: "palamuthir",
    label: "Palamuthir Nilayam (பழமுதிர்)",
    imageUrl: catImg("photo-1610832958506-aa56368176cf"),
    filter: "palamuthir",
  },
  {
    id: "flour_mill",
    label: "Flour Mill (மாவு ஆலை)",
    imageUrl: catImg("photo-1586201375761-83865001e31c"),
    filter: "flour_mill",
  },
  {
    id: "meat_fish",
    label: "Meat, Fish & Chicken",
    imageUrl: catImg("photo-1607623814075-e51df1bdc82f"),
    filter: "meat_fish",
  },
  {
    id: "fashion_accessories",
    label: "Chain, Kammal & Gifts",
    imageUrl: catImg("photo-1535632066927-ab7c9ab60908"),
    filter: "fashion_accessories",
  },
  {
    id: "boutiques",
    label: "Designer Boutiques",
    imageUrl: catImg("photo-1583391733956-6c78276477e2"),
    filter: "boutiques",
  },
  {
    id: "fast_fashion",
    label: "Fast Fashion (Branded)",
    imageUrl: catImg("photo-1489987707025-afc232f7ea0f"),
    filter: "fast_fashion",
  },
  {
    id: "showrooms",
    label: "Showrooms",
    imageUrl: catImg("photo-1555529669-e69e7aa0ba9a"),
    filter: "showrooms",
  },
  {
    id: "kitchen_appliances",
    label: "Kitchen Appliances (பாத்திரம்)",
    imageUrl: catImg("photo-1584990347449-716c15a3a17a"),
    filter: "kitchen_appliances",
  },
  {
    id: "home_decor",
    label: "Interior & Home Decor",
    imageUrl: catImg("photo-1513519245088-0e12902e5a38"),
    filter: "home_decor",
  },
  {
    id: "individual_fashion",
    label: "Individual Fashion",
    imageUrl: catImg("photo-1441986300917-64674bd600d8"),
    filter: "individual_fashion",
  },
  {
    id: "pharmacy",
    label: "Individual Pharmacy",
    imageUrl: catImg("photo-1587854692152-cbe660dbde88"),
    filter: "pharmacy",
  },
  {
    id: "stationery",
    label: "Book Stall & Stationery",
    imageUrl: catImg("photo-1519682337058-a94d519337bc"),
    filter: "stationery",
  },
];

export interface Product {
  id: string;
  storeId: string;
  name: string;
  unit: string;
  price: number;
  category: string;
  imageUrl?: string;
  stock?: number;
}

export const categoryColor: Record<StoreCategory, string> = {
  showrooms: "#4F46E5",
  boutiques: "#DB2777",
  fast_fashion: "#7C3AED",
  individual_fashion: "#E11D48",
  flour_mill: "#D97706",
  palamuthir: "#16A34A",
  meat_fish: "#DC2626",
  pharmacy: "#0284C7",
  stationery: "#CA8A04",
  home_decor: "#059669",
  kitchen_appliances: "#475569",
  fashion_accessories: "#EC4899",
  bakery: "#B36A3E",
  grocery: "#2A6F77",
};

export const categoryLabel: Record<StoreCategory, string> = {
  showrooms: "Showrooms",
  boutiques: "Designer Boutiques",
  fast_fashion: "Fast Fashion (Branded)",
  individual_fashion: "Individual Fashion",
  flour_mill: "Flour & Masala Mill (மாவு & மசாலா ஆலை)",
  palamuthir: "Palamuthir Nilayam (பழமுதிர்)",
  meat_fish: "Meat, Fish & Chicken",
  pharmacy: "Individual Pharmacy",
  stationery: "Book Stalls & Stationery",
  home_decor: "Interior & Home Decor",
  kitchen_appliances: "Kitchen Appliances",
  fashion_accessories: "Fashion Accessories & Gifts",
  bakery: "Bakery",
  grocery: "Grocery",
};

export const stores: Store[] = [
  {
    id: "s_flour1",
    name: "Sri Lakshmi Flour & Masala Mill (மாவு & மசாலா ஆலை)",
    category: "flour_mill",
    tagline: "Fresh Idli/Dosa batter, milled wheat & freshly ground individual masalas",
    distanceKm: 0.5,
    rating: 4.9,
    isOpen: true,
    etaMin: 18,
    address: "14, Temple Car Street, Bazaar",
    lat: 9.968,
    lng: 76.244,
    imageUrl: storeImg("photo-1586201375761-83865001e31c"),
  },
  {
    id: "s_pala1",
    name: "Kovai Pazhamudir Nilayam (பழமுதிர்)",
    category: "palamuthir",
    tagline: "Daily fresh organic fruits, tender coconut & veggies",
    distanceKm: 0.7,
    rating: 4.8,
    isOpen: true,
    etaMin: 20,
    address: "88, Main Road Cross",
    lat: 9.972,
    lng: 76.249,
    imageUrl: storeImg("photo-1610832958506-aa56368176cf"),
  },
  {
    id: "s_meat1",
    name: "Annachi Mutton & Farm Chicken Stall",
    category: "meat_fish",
    tagline: "Tender Mutton, Country Chicken & Farm Eggs",
    distanceKm: 0.9,
    rating: 4.8,
    isOpen: true,
    etaMin: 22,
    address: "42, Meat Market Lane",
    lat: 9.965,
    lng: 76.252,
    imageUrl: storeImg("photo-1607623814075-e51df1bdc82f"),
  },
  {
    id: "s_acc1",
    name: "Meenakshi Fashion Jewellery & Gift Corner",
    category: "fashion_accessories",
    tagline: "Gold-plated chains, Kammal/Earrings, Thodu, Bangles & Gifts",
    distanceKm: 1.0,
    rating: 4.9,
    isOpen: true,
    etaMin: 24,
    address: "5, Fancy Bazaar Street",
    lat: 9.974,
    lng: 76.244,
    imageUrl: storeImg("photo-1535632066927-ab7c9ab60908"),
  },
  {
    id: "s_bout1",
    name: "Ananya Designer Boutique",
    category: "boutiques",
    tagline: "Handloom Silk Sarees, Designer Kurtis & Bridal Tailoring",
    distanceKm: 1.2,
    rating: 4.9,
    isOpen: true,
    etaMin: 25,
    address: "18, Heritage Avenue",
    lat: 9.971,
    lng: 76.258,
    imageUrl: storeImg("photo-1583391733956-6c78276477e2"),
  },
  {
    id: "s_show1",
    name: "Sri Saravana Textiles & Electronics Showroom",
    category: "showrooms",
    tagline: "Multistory showroom for silk, smart TVs & appliances",
    distanceKm: 1.4,
    rating: 4.7,
    isOpen: true,
    etaMin: 28,
    address: "100 Feet Commercial Complex",
    lat: 9.976,
    lng: 76.241,
    imageUrl: storeImg("photo-1555529669-e69e7aa0ba9a"),
  },
  {
    id: "s_fast1",
    name: "Trendz & Zudio Fast Fashion Outlet",
    category: "fast_fashion",
    tagline: "Branded youth apparel, casuals, denims & footwear",
    distanceKm: 1.6,
    rating: 4.6,
    isOpen: true,
    etaMin: 30,
    address: "Plaza Mall Ground Floor",
    lat: 9.978,
    lng: 76.251,
    imageUrl: storeImg("photo-1489987707025-afc232f7ea0f"),
  },
  {
    id: "s_fash1",
    name: "Kumaran Readymades & Menswear",
    category: "individual_fashion",
    tagline: "Individual shop for cotton shirts, pants, dhotis & tailoring",
    distanceKm: 1.1,
    rating: 4.5,
    isOpen: true,
    etaMin: 25,
    address: "29, North Car Street",
    lat: 9.964,
    lng: 76.246,
    imageUrl: storeImg("photo-1441986300917-64674bd600d8"),
  },
  {
    id: "s_kitch1",
    name: "Murugan Stainless Steel & Pressure Cooker House",
    category: "kitchen_appliances",
    tagline: "Stainless steel utensils, mixer grinders & pressure cookers",
    distanceKm: 1.3,
    rating: 4.7,
    isOpen: true,
    etaMin: 26,
    address: "63, Vessels Bazaar Road",
    lat: 9.962,
    lng: 76.248,
    imageUrl: storeImg("photo-1584990347449-716c15a3a17a"),
  },
  {
    id: "s_decor1",
    name: "Vasantham Interior Home Decor Studio",
    category: "home_decor",
    tagline: "Wallpapers, curtains, brass Agal lamps & wall art",
    distanceKm: 1.8,
    rating: 4.8,
    isOpen: true,
    etaMin: 32,
    address: "7, Lakeview Boulevard",
    lat: 9.969,
    lng: 76.261,
    imageUrl: storeImg("photo-1513519245088-0e12902e5a38"),
  },
  {
    id: "s_fish1",
    name: "Kadalkani Fresh Fish & Seafood Stall",
    category: "meat_fish",
    tagline: "Daily fresh Vanjaram slices, Mathi, Nethili & Prawns",
    distanceKm: 1.5,
    rating: 4.8,
    isOpen: true,
    etaMin: 24,
    address: "Harbour Jetty Road",
    lat: 9.959,
    lng: 76.253,
    imageUrl: storeImg("photo-1534422298391-e4f8c172dddb"),
  },
  {
    id: "s_pharm1",
    name: "Sri Ram Medicals & Chemist",
    category: "pharmacy",
    tagline: "24/7 individual chemist, OTC medicines & surgicals",
    distanceKm: 0.8,
    rating: 4.6,
    isOpen: true,
    etaMin: 20,
    address: "Corner of 5th Cross",
    lat: 9.9702,
    lng: 76.2478,
    imageUrl: storeImg("photo-1587854692152-cbe660dbde88"),
  },
  {
    id: "s_book1",
    name: "Higginbothams Local Book Stall & Stationery",
    category: "stationery",
    tagline: "School lists, competitive exam books & art supplies",
    distanceKm: 1.5,
    rating: 4.4,
    isOpen: true,
    etaMin: 30,
    address: "Market Street 12",
    lat: 9.975,
    lng: 76.2555,
    imageUrl: storeImg("photo-1519682337058-a94d519337bc"),
  },
  {
    id: "s_flour2",
    name: "Amman Maavu Mill & Pure Spices",
    category: "flour_mill",
    tagline: "Pure Ground Rice flour, Chilly & Sambar powder",
    distanceKm: 1.7,
    rating: 4.7,
    isOpen: true,
    etaMin: 28,
    address: "51, South Street",
    lat: 9.979,
    lng: 76.246,
    imageUrl: storeImg("photo-1615485290382-441e4d049cb5"),
  },
  {
    id: "s_bakery1",
    name: "Coastline Wood-fired Bakes",
    category: "bakery",
    tagline: "Oven fresh bread, puffs, rusks & buns",
    distanceKm: 1.1,
    rating: 4.9,
    isOpen: true,
    etaMin: 25,
    address: "Harbour Lane 3",
    lat: 9.9635,
    lng: 76.251,
    imageUrl: storeImg("photo-1509440159596-0249088772ff"),
  },
  {
    id: "s_kiran1",
    name: "Anand Kirana Provision Store",
    category: "grocery",
    tagline: "Rice, pulses, coconut oil & daily kitchen ration",
    distanceKm: 0.4,
    rating: 4.7,
    isOpen: true,
    etaMin: 22,
    address: "12, Beach Road",
    lat: 9.967,
    lng: 76.242,
    imageUrl: storeImg("photo-1604719312566-8912e9227c6a"),
  },
];

const seedProducts = (storeId: string, cat: StoreCategory): Product[] => {
  const catalogs: Record<StoreCategory, Array<Omit<Product, "id" | "storeId">>> = {
    flour_mill: [
      {
        name: "Fresh Idli & Dosa Batter (மாவு)",
        unit: "1 kg",
        price: 45,
        category: "Fresh Batter",
        imageUrl: img("photo-1586201375761-83865001e31c"),
      },
      {
        name: "Freshly Milled Wheat Atta (சம்பா கோதுமை மாவு)",
        unit: "1 kg",
        price: 58,
        category: "Flour",
        imageUrl: img("photo-1509440159596-0249088772ff"),
      },
      {
        name: "Pure Ragi Flour (கேழ்வரகு மாவு)",
        unit: "500 g",
        price: 35,
        category: "Flour",
        imageUrl: img("photo-1615485290382-441e4d049cb5"),
      },
      {
        name: "Freshly Ground Turmeric Powder (மஞ்சள் தூள்)",
        unit: "200 g",
        price: 60,
        category: "Individual Masalas",
        imageUrl: img("photo-1615485290382-441e4d049cb5"),
      },
      {
        name: "Home Made Sambar Powder (சாம்பார் பொடி)",
        unit: "250 g",
        price: 85,
        category: "Individual Masalas",
        imageUrl: img("photo-1596040033229-a9821ebd058d"),
      },
      {
        name: "Pure Red Chilli Powder (தனி மிளகாய் தூள்)",
        unit: "250 g",
        price: 75,
        category: "Individual Masalas",
        imageUrl: img("photo-1596040033229-a9821ebd058d"),
      },
      {
        name: "Fresh Coriander Powder (மல்லி தூள்)",
        unit: "250 g",
        price: 65,
        category: "Individual Masalas",
        imageUrl: img("photo-1596040033229-a9821ebd058d"),
      },
      {
        name: "Authentic Idli Milagai Podi (இட்லி பொடி)",
        unit: "200 g",
        price: 70,
        category: "Individual Masalas",
        imageUrl: img("photo-1596040033229-a9821ebd058d"),
      },
      {
        name: "Chettinad Fish & Chicken Masala (செட்டிநாடு மசாலா)",
        unit: "200 g",
        price: 90,
        category: "Individual Masalas",
        imageUrl: img("photo-1596040033229-a9821ebd058d"),
      },
    ],
    palamuthir: [
      {
        name: "Farm Fresh Alphonso Mangoes",
        unit: "1 kg",
        price: 180,
        category: "Fruits",
        imageUrl: img("photo-1553279768-865429fa0078"),
      },
      {
        name: "Fresh Red Pomegranate (மாதுளை)",
        unit: "1 kg",
        price: 190,
        category: "Fruits",
        imageUrl: img("photo-1610832958506-aa56368176cf"),
      },
      {
        name: "Sweet Tender Coconut (இளநீர்)",
        unit: "1 pc",
        price: 50,
        category: "Fresh Drinks",
        imageUrl: img("photo-1525385133512-2f3bdd039054"),
      },
      {
        name: "Fresh Country Tomatoes (தக்காளி)",
        unit: "1 kg",
        price: 38,
        category: "Vegetables",
        imageUrl: img("photo-1592924357228-91a4daadcfea"),
      },
      {
        name: "Fresh Green Spinach Bunch (கீரைகள்)",
        unit: "2 bunches",
        price: 30,
        category: "Vegetables",
        imageUrl: img("photo-1576045057995-568f588f82fb"),
      },
    ],
    meat_fish: [
      {
        name: "Tender Mutton Curry Cut (ஆட்டு இறைச்சி)",
        unit: "500 g",
        price: 440,
        category: "Mutton",
        imageUrl: img("photo-1607623814075-e51df1bdc82f"),
      },
      {
        name: "Fresh Country Chicken Skinless (நாட்டுக் கோழி)",
        unit: "1 kg",
        price: 260,
        category: "Chicken",
        imageUrl: img("photo-1587593810167-a84920ea0781"),
      },
      {
        name: "Fresh Seer Fish / Vanjaram Slices (வஞ்சரம் மீன்)",
        unit: "500 g",
        price: 580,
        category: "Fish",
        imageUrl: img("photo-1534422298391-e4f8c172dddb"),
      },
      {
        name: "Tiger Prawns Cleaned (இறால்)",
        unit: "500 g",
        price: 390,
        category: "Seafood",
        imageUrl: img("photo-1565680018434-b513d5e5fd47"),
      },
      {
        name: "Farm Fresh Country Eggs (நாட்டு முட்டை)",
        unit: "6 pcs",
        price: 84,
        category: "Eggs",
        imageUrl: img("photo-1582722872445-44dc5f7e3c8f"),
      },
    ],
    fashion_accessories: [
      {
        name: "Gold-Plated Designer Chain (செயின்)",
        unit: "1 pc",
        price: 380,
        category: "Jewellery",
        imageUrl: img("photo-1535632066927-ab7c9ab60908"),
      },
      {
        name: "Traditional Temple Jhumka Kammal (கம்மல் / தோடு)",
        unit: "1 pair",
        price: 220,
        category: "Earrings",
        imageUrl: img("photo-1630019852942-f89202989a59"),
      },
      {
        name: "Silk Thread Bangle Set (வளையல்கள்)",
        unit: "Set of 12",
        price: 260,
        category: "Bangles",
        imageUrl: img("photo-1611591475777-233cd7579624"),
      },
      {
        name: "Handcrafted Gift Hamper Box",
        unit: "1 set",
        price: 490,
        category: "Gifts",
        imageUrl: img("photo-1549465220-1a8b9238cd48"),
      },
    ],
    boutiques: [
      {
        name: "Kanchipuram Soft Silk Saree",
        unit: "1 pc",
        price: 3450,
        category: "Sarees",
        imageUrl: img("photo-1610030469983-98e550d6193c"),
      },
      {
        name: "Handloom Cotton Kurti & Dupatta Set",
        unit: "1 set",
        price: 1150,
        category: "Kurtis",
        imageUrl: img("photo-1583391733956-6c78276477e2"),
      },
      {
        name: "Custom Embroidery Designer Blouse Stitching",
        unit: "1 pc",
        price: 850,
        category: "Stitching",
        imageUrl: img("photo-1537633552985-df8429e8048b"),
      },
    ],
    showrooms: [
      {
        name: "Smart 4K Ultra HD LED TV 43\"",
        unit: "1 unit",
        price: 22990,
        category: "Electronics",
        imageUrl: img("photo-1593784991095-a205069470b6"),
      },
      {
        name: "Pure Silk Kanchipuram Bridal Wedding Saree",
        unit: "1 pc",
        price: 7800,
        category: "Textiles",
        imageUrl: img("photo-1610030469983-98e550d6193c"),
      },
    ],
    fast_fashion: [
      {
        name: "Pure Cotton Casual Slim Fit Shirt",
        unit: "1 pc",
        price: 699,
        category: "Men",
        imageUrl: img("photo-1489987707025-afc232f7ea0f"),
      },
      {
        name: "High-Rise Stretch Denim Jeans",
        unit: "1 pc",
        price: 999,
        category: "Women",
        imageUrl: img("photo-1541099649105-f69ad21f3246"),
      },
    ],
    individual_fashion: [
      {
        name: "Traditional Pure Cotton Dhoti & Shirt Combo",
        unit: "1 set",
        price: 899,
        category: "Traditional",
        imageUrl: img("photo-1441986300917-64674bd600d8"),
      },
    ],
    kitchen_appliances: [
      {
        name: "Preethi 750W 3-Jar Mixer Grinder",
        unit: "1 unit",
        price: 3290,
        category: "Appliances",
        imageUrl: img("photo-1584990347449-716c15a3a17a"),
      },
      {
        name: "Hawkins 3 Litre Stainless Steel Pressure Cooker",
        unit: "1 unit",
        price: 1450,
        category: "Cookware",
        imageUrl: img("photo-1584990347449-716c15a3a17a"),
      },
    ],
    home_decor: [
      {
        name: "Traditional Handcrafted Brass Agal Lamp (குத்துவிளக்கு)",
        unit: "1 pair",
        price: 650,
        category: "Decor",
        imageUrl: img("photo-1513519245088-0e12902e5a38"),
      },
      {
        name: "Velvet Designer Cushion Covers (Set of 5)",
        unit: "5 pcs",
        price: 399,
        category: "Furnishings",
        imageUrl: img("photo-1584100936595-c0654b55a2e2"),
      },
    ],
    pharmacy: [
      {
        name: "Paracetamol 500mg OTC",
        unit: "10 tabs",
        price: 22,
        category: "OTC Medicines",
        imageUrl: img("photo-1584308666744-24d5c474f2ae"),
      },
      {
        name: "Pulse Oximeter & Digital Monitor",
        unit: "1 pc",
        price: 450,
        category: "Wellness",
        imageUrl: img("photo-1584362917165-526a968579e8"),
      },
    ],
    stationery: [
      {
        name: "Classmate A4 Ruled Notebooks (Pack of 6)",
        unit: "6 pcs",
        price: 240,
        category: "Notebooks",
        imageUrl: img("photo-1531346878377-a5be20888e57"),
      },
      {
        name: "Gel Pens Blue Set",
        unit: "5 pcs",
        price: 60,
        category: "Pens",
        imageUrl: img("photo-1583485088034-697b5bc36b92"),
      },
    ],
    bakery: [
      {
        name: "Fresh Oven Butter Croissant",
        unit: "1 pc",
        price: 65,
        category: "Bakes",
        imageUrl: img("photo-1555507036-ab1f4038808a"),
      },
    ],
    grocery: [
      {
        name: "Sona Masoori Rice",
        unit: "5 kg",
        price: 420,
        category: "Staples",
        imageUrl: img("photo-1586201375761-83865001e31c"),
      },
    ],
  };
  return (catalogs[cat] || catalogs.grocery).map((p, i) => ({
    ...p,
    id: `${storeId}-p${i}`,
    storeId,
  }));
};

export const productsByStore: Record<string, Product[]> = Object.fromEntries(
  stores.map((s) => [s.id, seedProducts(s.id, s.category)])
);

export const getStore = (id: string) => stores.find((s) => s.id === id);
