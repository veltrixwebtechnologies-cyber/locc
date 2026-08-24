export type StoreCategory = "grocery" | "pharmacy" | "stationery" | "bakery";

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

const catImg = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=240&q=70`;

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
    id: "fresh",
    label: "Fresh & Daily Needs",
    imageUrl: catImg("photo-1542838132-92c53300491e"),
    filter: "grocery",
  },
  {
    id: "ready",
    label: "Instant & Ready-to-Cook",
    imageUrl: catImg("photo-1585032226651-759b368d7246"),
    filter: "grocery",
  },
  {
    id: "personal",
    label: "Personal Care & Toiletries",
    imageUrl: catImg("photo-1556228720-195a672e8a03"),
    filter: "pharmacy",
  },
  {
    id: "home",
    label: "Home Essentials & Cleaning",
    imageUrl: catImg("photo-1583947215259-38e31be8751f"),
    filter: "grocery",
  },
  {
    id: "pharmacy",
    label: "OTC Pharmacy & Wellness",
    imageUrl: catImg("photo-1587854692152-cbe660dbde88"),
    filter: "pharmacy",
  },
  {
    id: "electronics",
    label: "Mobile & Small Electronics",
    imageUrl: catImg("photo-1600294037681-c80b4cb5b434"),
  },
  {
    id: "stationery",
    label: "Stationery & Office",
    imageUrl: catImg("photo-1519682337058-a94d519337bc"),
    filter: "stationery",
  },
  {
    id: "snacks",
    label: "Snacks & Beverages",
    imageUrl: catImg("photo-1621939514649-280e2ee25f60"),
    filter: "bakery",
  },
  { id: "fashion", label: "Fashion", imageUrl: catImg("photo-1441986300917-64674bd600d8") },
  { id: "accessories", label: "Accessories", imageUrl: catImg("photo-1508296695146-257a814070b4") },
  { id: "footwear", label: "Footwear", imageUrl: catImg("photo-1542291026-7eec264c27ff") },
  {
    id: "kitchen",
    label: "Kitchen Utensils",
    imageUrl: catImg("photo-1584990347449-716c15a3a17a"),
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
  grocery: "#2A6F77", // teal
  pharmacy: "#D9584C", // coral
  stationery: "#E3A72E", // marigold
  bakery: "#B36A3E", // warm brown
};

export const categoryLabel: Record<StoreCategory, string> = {
  grocery: "Grocery",
  pharmacy: "Pharmacy",
  stationery: "Stationery",
  bakery: "Bakery",
};

const storeImg = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=75`;

export const stores: Store[] = [
  {
    id: "s1",
    name: "Anand Kirana Store",
    category: "grocery",
    tagline: "Since 1978 · Ration & fresh produce",
    distanceKm: 0.4,
    rating: 4.7,
    isOpen: true,
    etaMin: 22,
    address: "12, Beach Road",
    lat: 9.967,
    lng: 76.242,
    imageUrl: storeImg("photo-1604719312566-8912e9227c6a"),
  },
  {
    id: "s2",
    name: "Sagar Medicals",
    category: "pharmacy",
    tagline: "24-hour chemist",
    distanceKm: 0.8,
    rating: 4.6,
    isOpen: true,
    etaMin: 28,
    address: "Corner of 5th Cross",
    lat: 9.9702,
    lng: 76.2478,
    imageUrl: storeImg("photo-1587854692152-cbe660dbde88"),
  },
  {
    id: "s3",
    name: "Coastline Bakes",
    category: "bakery",
    tagline: "Wood-fired bread, daily 6am",
    distanceKm: 1.1,
    rating: 4.9,
    isOpen: true,
    etaMin: 30,
    address: "Harbour Lane 3",
    lat: 9.9635,
    lng: 76.251,
    imageUrl: storeImg("photo-1509440159596-0249088772ff"),
  },
  {
    id: "s4",
    name: "Kavya Book & Stationery",
    category: "stationery",
    tagline: "School lists, art supplies",
    distanceKm: 1.5,
    rating: 4.4,
    isOpen: false,
    etaMin: 35,
    address: "Market Street",
    lat: 9.975,
    lng: 76.2555,
    imageUrl: storeImg("photo-1519682337058-a94d519337bc"),
  },
  {
    id: "s5",
    name: "Nadar Provision Stores",
    category: "grocery",
    tagline: "Coconut oil, spices, staples",
    distanceKm: 1.8,
    rating: 4.5,
    isOpen: true,
    etaMin: 38,
    address: "Old Bazaar",
    lat: 9.9585,
    lng: 76.2395,
    imageUrl: storeImg("photo-1578916171728-46686eac8d58"),
  },
  {
    id: "s6",
    name: "Pillai Fresh Bakery",
    category: "bakery",
    tagline: "Puffs, buns, cakes",
    distanceKm: 2.2,
    rating: 4.3,
    isOpen: true,
    etaMin: 42,
    address: "Church Road",
    lat: 9.98,
    lng: 76.26,
    imageUrl: storeImg("photo-1555507036-ab1f4038808a"),
  },
];

// Unsplash source URLs picked per item — small, cropped thumbnails
const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=200&q=70`;

const seedProducts = (storeId: string, cat: StoreCategory): Product[] => {
  const catalogs: Record<StoreCategory, Array<Omit<Product, "id" | "storeId">>> = {
    grocery: [
      {
        name: "Sona Masoori Rice",
        unit: "5 kg",
        price: 420,
        category: "Staples",
        imageUrl: img("photo-1586201375761-83865001e31c"),
      },
      {
        name: "Toor Dal",
        unit: "1 kg",
        price: 165,
        category: "Staples",
        imageUrl: img("photo-1615485500704-8e990f9900f7"),
      },
      {
        name: "Cold-pressed Coconut Oil",
        unit: "500 ml",
        price: 280,
        category: "Oils",
        imageUrl: img("photo-1590332763361-c73dc0e0dd8b"),
      },
      {
        name: "Farm Eggs",
        unit: "6 pcs",
        price: 72,
        category: "Dairy & Eggs",
        imageUrl: img("photo-1582722872445-44dc5f7e3c8f"),
      },
      {
        name: "Amul Milk",
        unit: "1 L",
        price: 68,
        category: "Dairy & Eggs",
        imageUrl: img("photo-1550583724-b2692b85b150"),
      },
      {
        name: "Bananas (Nendran)",
        unit: "1 dozen",
        price: 90,
        category: "Fresh",
        imageUrl: img("photo-1571771894821-ce9b6c11b08e"),
      },
      {
        name: "Tomatoes",
        unit: "1 kg",
        price: 40,
        category: "Fresh",
        imageUrl: img("photo-1592924357228-91a4daadcfea"),
      },
      {
        name: "Onions",
        unit: "1 kg",
        price: 35,
        category: "Fresh",
        imageUrl: img("photo-1618512496248-a07fe83aa8cb"),
      },
      {
        name: "Turmeric Powder",
        unit: "200 g",
        price: 55,
        category: "Spices",
        imageUrl: img("photo-1615485290382-441e4d049cb5"),
      },
      {
        name: "Pampers Baby Diapers (M)",
        unit: "32 pcs",
        price: 549,
        category: "Baby Care",
        imageUrl: img("photo-1515488042361-ee00e0ddd4e4"),
      },
      {
        name: "Gentle Baby Wipes",
        unit: "72 wipes",
        price: 185,
        category: "Baby Care",
        imageUrl: img("photo-1522337360788-8b13dee7a37e"),
      },
      {
        name: "Pedigree Adult Dog Food",
        unit: "1.2 kg",
        price: 340,
        category: "Pet Care",
        imageUrl: img("photo-1568640347023-a616a30bc3bd"),
      },
      {
        name: "Whiskas Cat Food Treats",
        unit: "450 g",
        price: 210,
        category: "Pet Care",
        imageUrl: img("photo-1514888286974-6c03e2ca1dba"),
      },
    ],
    pharmacy: [
      {
        name: "Paracetamol 500mg",
        unit: "10 tabs",
        price: 22,
        category: "OTC medicines",
        imageUrl: img("photo-1584308666744-24d5c474f2ae"),
      },
      {
        name: "ORS Electrolyte Drink",
        unit: "5 pcs",
        price: 60,
        category: "OTC medicines",
        imageUrl: img("photo-1550572017-edd951b55104"),
      },
      {
        name: "Digital Pulse Thermometer",
        unit: "1 pc",
        price: 220,
        category: "Wellness devices",
        imageUrl: img("photo-1584362917165-526a968579e8"),
      },
      {
        name: "Adhesive First Aid Bandages",
        unit: "20 pcs",
        price: 45,
        category: "First aid",
        imageUrl: img("photo-1603398938378-e54eab446dde"),
      },
      {
        name: "Herbal Cold & Cough Syrup",
        unit: "100 ml",
        price: 95,
        category: "Cold & cough",
        imageUrl: img("photo-1631549916768-4119b2e5f926"),
      },
      {
        name: "Daily Multivitamin & Mineral",
        unit: "30 tabs",
        price: 340,
        category: "Supplements",
        imageUrl: img("photo-1626202372950-f691929787eb"),
      },
      {
        name: "Pain Relief Balm & Ointment",
        unit: "50 g",
        price: 85,
        category: "Pain relief",
        imageUrl: img("photo-1584017911766-d451b3d0e843"),
      },
      {
        name: "Digestive Enzyme Syrup",
        unit: "200 ml",
        price: 130,
        category: "Digestive care",
        imageUrl: img("photo-1577401239170-897942555fb3"),
      },
      {
        name: "Nourishing Herbal Shampoo",
        unit: "200 ml",
        price: 175,
        category: "Shampoo",
        imageUrl: img("photo-1535585209827-a15fcdbc4c2d"),
      },
      {
        name: "Moisturizing Bathing Soap",
        unit: "3x100g",
        price: 99,
        category: "Soap",
        imageUrl: img("photo-1600857544200-b2f666a9a2ec"),
      },
      {
        name: "Herbal Oral Care Toothpaste",
        unit: "150 g",
        price: 80,
        category: "Oral care",
        imageUrl: img("photo-1559598467-f8b76c8155d0"),
      },
      {
        name: "Gentle Skin Care Moisturizer",
        unit: "100 g",
        price: 210,
        category: "Skin care",
        imageUrl: img("photo-1556228720-195a672e8a03"),
      },
      {
        name: "Ultra Thin Sanitary Pads",
        unit: "12 pads",
        price: 140,
        category: "Sanitary care",
        imageUrl: img("photo-1584308666744-24d5c474f2ae"),
      },
      {
        name: "Gentle Baby Care Lotion & Powder",
        unit: "200 ml",
        price: 265,
        category: "Baby care",
        imageUrl: img("photo-1515488042361-ee00e0ddd4e4"),
      },
      {
        name: "N95 Protective Face Masks",
        unit: "5 pcs",
        price: 150,
        category: "Masks",
        imageUrl: img("photo-1584634731339-252c581abfc5"),
      },
      {
        name: "Instant Hand Sanitizer Spray",
        unit: "100 ml",
        price: 65,
        category: "Sanitizers",
        imageUrl: img("photo-1584483766114-2cea6facdf57"),
      },
    ],
    stationery: [
      {
        name: "A4 Ruled Notebook",
        unit: "200 pgs",
        price: 85,
        category: "Notebooks",
        imageUrl: img("photo-1531346878377-a5be20888e57"),
      },
      {
        name: "Gel Pens (Blue)",
        unit: "5 pcs",
        price: 60,
        category: "Pens",
        imageUrl: img("photo-1583485088034-697b5bc36b92"),
      },
      {
        name: "Sticky Notes",
        unit: "3x3in",
        price: 45,
        category: "Office",
        imageUrl: img("photo-1586282391129-76a6df230234"),
      },
      {
        name: "Watercolor Set",
        unit: "12 shades",
        price: 180,
        category: "Art",
        imageUrl: img("photo-1513364776144-60967b0f800f"),
      },
      {
        name: "Geometry Box",
        unit: "1 set",
        price: 140,
        category: "School",
        imageUrl: img("photo-1602934585418-f588bea4215c"),
      },
    ],
    bakery: [
      {
        name: "Sourdough Loaf",
        unit: "500 g",
        price: 180,
        category: "Bread",
        imageUrl: img("photo-1509440159596-0249088772ff"),
      },
      {
        name: "Butter Croissant",
        unit: "1 pc",
        price: 65,
        category: "Viennoiserie",
        imageUrl: img("photo-1555507036-ab1f4038808a"),
      },
      {
        name: "Veg Puff",
        unit: "1 pc",
        price: 25,
        category: "Savoury",
        imageUrl: img("photo-1601050690597-df0568f70950"),
      },
      {
        name: "Chocolate Brownie",
        unit: "1 pc",
        price: 90,
        category: "Sweets",
        imageUrl: img("photo-1606313564200-e75d5e30476c"),
      },
      {
        name: "Whole Wheat Buns",
        unit: "6 pcs",
        price: 70,
        category: "Bread",
        imageUrl: img("photo-1568471173242-461f0a730452"),
      },
    ],
  };
  return catalogs[cat].map((p, i) => ({ ...p, id: `${storeId}-p${i}`, storeId }));
};

export const productsByStore: Record<string, Product[]> = Object.fromEntries(
  stores.map((s) => [s.id, seedProducts(s.id, s.category)]),
);

export const getStore = (id: string) => stores.find((s) => s.id === id);
