// ── LocalShore Platform Data (Notifications, Support, Travel, Cities, News, Brands, Best Shops)

// ─── Notifications ─────────────────────────────────────────────────────────
export type NotificationCategory =
  | "orders"
  | "offers"
  | "rewards"
  | "shops"
  | "brands"
  | "updates"
  | "travel"
  | "system";

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  icon: string;
  read: boolean;
  timestamp: string;
  deepLink?: string;
}

export const SAMPLE_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    category: "orders",
    title: "Your order is out for delivery 🚴",
    body: "Order #LS12345 from Sri Krishna Sweets is on its way!",
    icon: "📦",
    read: false,
    timestamp: "2026-08-30T14:30:00",
    deepLink: "/order/LS12345",
  },
  {
    id: "n2",
    category: "rewards",
    title: "You earned 150 Shore Points!",
    body: "Points credited for your recent order. Keep shopping local!",
    icon: "🪙",
    read: false,
    timestamp: "2026-08-30T12:00:00",
    deepLink: "/rewards",
  },
  {
    id: "n3",
    category: "offers",
    title: "Your favorite shop has a new offer",
    body: "Sri Krishna Sweets: 20% off on all bakery items today!",
    icon: "🏷️",
    read: true,
    timestamp: "2026-08-29T10:00:00",
  },
  {
    id: "n4",
    category: "travel",
    title: "New travel opportunity available",
    body: "Explore Japan's local shopping culture with LocalShore.",
    icon: "✈️",
    read: true,
    timestamp: "2026-08-28T09:00:00",
    deepLink: "/explore",
  },
  {
    id: "n5",
    category: "shops",
    title: "New shop near you!",
    body: "Amman Maavu Mill just joined LocalShore in your area.",
    icon: "🏪",
    read: true,
    timestamp: "2026-08-27T16:00:00",
  },
  {
    id: "n6",
    category: "updates",
    title: "LocalShore now in Salem!",
    body: "We've expanded to Salem. Tell your friends!",
    icon: "🎉",
    read: true,
    timestamp: "2026-08-26T08:00:00",
    deepLink: "/cities",
  },
  {
    id: "n7",
    category: "brands",
    title: "Nike Official Store is live",
    body: "Shop authentic Nike products on LocalShore.",
    icon: "👟",
    read: true,
    timestamp: "2026-08-25T11:00:00",
    deepLink: "/brands",
  },
  {
    id: "n8",
    category: "system",
    title: "App updated to v2.5",
    body: "New features: Rewards, Gift Cards, and more!",
    icon: "⚙️",
    read: true,
    timestamp: "2026-08-24T07:00:00",
  },
];

// ─── Support / Customer Care ───────────────────────────────────────────────
export interface SupportCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export const SUPPORT_CATEGORIES: SupportCategory[] = [
  { id: "order", label: "Order Issue", icon: "📦", description: "Problem with an order" },
  { id: "missing", label: "Missing Item", icon: "❓", description: "Item missing from delivery" },
  { id: "wrong", label: "Wrong Item", icon: "🔄", description: "Received wrong product" },
  { id: "damaged", label: "Damaged Item", icon: "💔", description: "Product arrived damaged" },
  {
    id: "payment",
    label: "Payment Issue",
    icon: "💳",
    description: "Payment failed or charged extra",
  },
  { id: "refund", label: "Refund Issue", icon: "💰", description: "Refund not received" },
  { id: "delivery", label: "Delivery Issue", icon: "🚴", description: "Late or undelivered order" },
  { id: "account", label: "Account Issue", icon: "👤", description: "Login, profile, or security" },
  { id: "gift_card", label: "Gift Card Issue", icon: "🎁", description: "Gift card problems" },
  { id: "rewards", label: "Rewards Issue", icon: "🪙", description: "Points not credited" },
  { id: "shop", label: "Shop Issue", icon: "🏪", description: "Problem with a shop" },
  { id: "other", label: "Other", icon: "📝", description: "Something else" },
];

export const SUPPORT_FAQS = [
  {
    q: "How do I track my order?",
    a: "Go to Orders → tap your active order to see live tracking with delivery partner location.",
  },
  {
    q: "How do I get a refund?",
    a: "Open the order → Report issue → Select the problem. Refunds are processed within 3-5 business days.",
  },
  {
    q: "My delivery is late, what should I do?",
    a: "Check the order tracker for real-time updates. If it's been over 45 minutes past the estimate, raise a support ticket.",
  },
  {
    q: "How do Shore Points work?",
    a: "Earn points on every purchase (1 point per ₹10). Redeem them for discounts, free delivery, or gift cards.",
  },
  {
    q: "Can I cancel my order?",
    a: "Orders can be cancelled before the shop starts preparing. Go to Orders → Cancel order.",
  },
  {
    q: "How do I use a gift card?",
    a: "At checkout, enter your gift card code or it will auto-apply if linked to your account.",
  },
];

// ─── Travel / Explore ──────────────────────────────────────────────────────
export interface TravelOpportunity {
  id: string;
  destination: string;
  country: string;
  flag: string;
  tagline: string;
  type: "culture" | "retail" | "business" | "food" | "tech";
  priceRange: string;
  imageUrl: string;
  partner: string;
  sponsored: boolean;
  available: boolean;
}

export const TRAVEL_OPPORTUNITIES: TravelOpportunity[] = [
  {
    id: "t1",
    destination: "Tokyo",
    country: "Japan",
    flag: "🇯🇵",
    tagline: "Local culture & shopping experience",
    type: "culture",
    priceRange: "₹85,000 – ₹1,50,000",
    imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80",
    partner: "JapanTravel Co.",
    sponsored: false,
    available: true,
  },
  {
    id: "t2",
    destination: "Singapore",
    country: "Singapore",
    flag: "🇸🇬",
    tagline: "Retail & technology experience",
    type: "retail",
    priceRange: "₹55,000 – ₹95,000",
    imageUrl: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=80",
    partner: "SG Explore",
    sponsored: true,
    available: true,
  },
  {
    id: "t3",
    destination: "Dubai",
    country: "UAE",
    flag: "🇦🇪",
    tagline: "Shopping & business experience",
    type: "business",
    priceRange: "₹70,000 – ₹1,20,000",
    imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80",
    partner: "Gulf Partners",
    sponsored: false,
    available: true,
  },
  {
    id: "t4",
    destination: "Bangkok",
    country: "Thailand",
    flag: "🇹🇭",
    tagline: "Street food & local market discovery",
    type: "food",
    priceRange: "₹35,000 – ₹65,000",
    imageUrl: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80",
    partner: "Thai Voyages",
    sponsored: true,
    available: true,
  },
  {
    id: "t5",
    destination: "Seoul",
    country: "South Korea",
    flag: "🇰🇷",
    tagline: "K-beauty & tech innovation tour",
    type: "tech",
    priceRange: "₹75,000 – ₹1,30,000",
    imageUrl: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600&q=80",
    partner: "Korea Connect",
    sponsored: false,
    available: false,
  },
];

// ─── Cities ────────────────────────────────────────────────────────────────
export interface CityData {
  id: string;
  name: string;
  state: string;
  region: string;
  status: "active" | "coming_soon";
  shopCount?: number;
  popularCategories?: string[];
  imageUrl: string;
}

export const CITIES: CityData[] = [
  {
    id: "cbe",
    name: "Coimbatore",
    state: "Tamil Nadu",
    region: "Tamil Nadu",
    status: "active",
    shopCount: 120,
    popularCategories: ["Grocery", "Pharmacy", "Bakery", "Fashion"],
    imageUrl: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&q=80",
  },
  {
    id: "chn",
    name: "Chennai",
    state: "Tamil Nadu",
    region: "Tamil Nadu",
    status: "active",
    shopCount: 340,
    popularCategories: ["Grocery", "Electronics", "Fashion", "Food"],
    imageUrl: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&q=80",
  },
  {
    id: "mdu",
    name: "Madurai",
    state: "Tamil Nadu",
    region: "Tamil Nadu",
    status: "active",
    shopCount: 85,
    popularCategories: ["Grocery", "Flowers", "Sweets"],
    imageUrl: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&q=80",
  },
  {
    id: "slm",
    name: "Salem",
    state: "Tamil Nadu",
    region: "Tamil Nadu",
    status: "active",
    shopCount: 45,
    popularCategories: ["Grocery", "Steel"],
    imageUrl: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&q=80",
  },
  {
    id: "trc",
    name: "Tiruchirappalli",
    state: "Tamil Nadu",
    region: "Tamil Nadu",
    status: "coming_soon",
    imageUrl: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&q=80",
  },
  {
    id: "blr",
    name: "Bengaluru",
    state: "Karnataka",
    region: "Karnataka",
    status: "coming_soon",
    imageUrl: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400&q=80",
  },
  {
    id: "mys",
    name: "Mysuru",
    state: "Karnataka",
    region: "Karnataka",
    status: "coming_soon",
    imageUrl: "https://images.unsplash.com/photo-1600689082347-58e46a0f7dbd?w=400&q=80",
  },
  {
    id: "kch",
    name: "Kochi",
    state: "Kerala",
    region: "Kerala",
    status: "coming_soon",
    imageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&q=80",
  },
];

// ─── News / Stories ────────────────────────────────────────────────────────
export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  category: "launch" | "seller_story" | "brand" | "guide" | "community" | "update" | "travel";
  author: string;
  publishedAt: string;
  readingTime: number;
  imageUrl: string;
  featured?: boolean;
}

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: "a1",
    title: "LocalShore launches in Salem — 45 shops and counting!",
    excerpt:
      "We're excited to bring LocalShore to Salem with grocery, pharmacy, and fashion shops from day one.",
    category: "launch",
    author: "LocalShore Team",
    publishedAt: "2026-08-28",
    readingTime: 3,
    imageUrl: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=600&q=80",
    featured: true,
  },
  {
    id: "a2",
    title: "Meet Selvamani — The flour mill owner who went digital",
    excerpt:
      "How a 30-year-old flour mill in Pappampatti Pirivu joined LocalShore and tripled its reach.",
    category: "seller_story",
    author: "Priya Raman",
    publishedAt: "2026-08-25",
    readingTime: 5,
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80",
  },
  {
    id: "a3",
    title: "Nike Official Store now on LocalShore",
    excerpt: "Shop authentic Nike products with local delivery speed.",
    category: "brand",
    author: "LocalShore Team",
    publishedAt: "2026-08-22",
    readingTime: 2,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
  },
  {
    id: "a4",
    title: "Your guide to the best bakeries in Coimbatore",
    excerpt:
      "From Mysurpa to fresh croissants — discover Coimbatore's best bakery shops on LocalShore.",
    category: "guide",
    author: "Food Team",
    publishedAt: "2026-08-20",
    readingTime: 4,
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80",
  },
  {
    id: "a5",
    title: "Supporting local: How LocalShore helps neighborhood businesses",
    excerpt: "Our mission is to make local shops thrive in the digital age.",
    category: "community",
    author: "LocalShore Team",
    publishedAt: "2026-08-18",
    readingTime: 6,
    imageUrl: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&q=80",
  },
  {
    id: "a6",
    title: "Introducing Shore Points — rewards for shopping local",
    excerpt:
      "Earn points on every purchase and redeem them for discounts, free delivery, and more.",
    category: "update",
    author: "Product Team",
    publishedAt: "2026-08-15",
    readingTime: 3,
    imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80",
  },
];

// ─── Brands ────────────────────────────────────────────────────────────────
export interface BrandData {
  id: string;
  name: string;
  logoUrl: string;
  coverUrl: string;
  category: string;
  verified: boolean;
  featured: boolean;
  productCount: number;
  tagline: string;
}

export const BRANDS: BrandData[] = [
  {
    id: "b1",
    name: "Nike",
    logoUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80",
    coverUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    category: "Footwear & Sportswear",
    verified: true,
    featured: true,
    productCount: 48,
    tagline: "Just Do It",
  },
  {
    id: "b2",
    name: "Amul",
    logoUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&q=80",
    coverUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80",
    category: "Dairy & Food",
    verified: true,
    featured: true,
    productCount: 35,
    tagline: "The Taste of India",
  },
  {
    id: "b3",
    name: "Fabindia",
    logoUrl: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=200&q=80",
    coverUrl: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80",
    category: "Ethnic Wear & Home",
    verified: true,
    featured: true,
    productCount: 62,
    tagline: "Celebrate India",
  },
  {
    id: "b4",
    name: "Patanjali",
    logoUrl: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200&q=80",
    coverUrl: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80",
    category: "Ayurveda & Wellness",
    verified: true,
    featured: false,
    productCount: 120,
    tagline: "Prakriti ka Ashirwad",
  },
  {
    id: "b5",
    name: "Prestige",
    logoUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=200&q=80",
    coverUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&q=80",
    category: "Kitchen Appliances",
    verified: true,
    featured: false,
    productCount: 28,
    tagline: "The World's Kitchen",
  },
  {
    id: "b6",
    name: "Boat",
    logoUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80",
    coverUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
    category: "Audio & Wearables",
    verified: true,
    featured: false,
    productCount: 42,
    tagline: "Plug Into Nirvana",
  },
];

// ─── Best Shops ────────────────────────────────────────────────────────────
export interface ShopMetrics {
  shopId: string;
  shopName: string;
  rating: number;
  totalOrders: number;
  repeatCustomerRate: number;
  avgDeliveryMins: number;
  satisfactionScore: number;
  badge: "top_rated" | "rising_star" | "most_loved" | "fastest" | "best_value";
  badgeLabel: string;
  category: string;
  distanceKm: number;
  imageUrl: string;
  popularProduct: string;
}

export const BEST_SHOPS: ShopMetrics[] = [
  {
    shopId: "s_paap1",
    shopName: "Sri Krishna Sweets & Bakery",
    rating: 4.9,
    totalOrders: 2400,
    repeatCustomerRate: 78,
    avgDeliveryMins: 18,
    satisfactionScore: 96,
    badge: "top_rated",
    badgeLabel: "🏆 Top Rated",
    category: "Bakery & Sweets",
    distanceKm: 0.3,
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
    popularProduct: "Mysurpa",
  },
  {
    shopId: "s_pala2",
    shopName: "Green Coast Organic Fruit Bazaar",
    rating: 4.9,
    totalOrders: 1800,
    repeatCustomerRate: 82,
    avgDeliveryMins: 22,
    satisfactionScore: 97,
    badge: "most_loved",
    badgeLabel: "❤️ Most Loved",
    category: "Fruits & Vegetables",
    distanceKm: 1.2,
    imageUrl: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80",
    popularProduct: "Organic Mango",
  },
  {
    shopId: "s_paap5",
    shopName: "Sri Lakshmi Medicals",
    rating: 4.7,
    totalOrders: 3200,
    repeatCustomerRate: 85,
    avgDeliveryMins: 12,
    satisfactionScore: 94,
    badge: "fastest",
    badgeLabel: "⚡ Fastest Delivery",
    category: "Pharmacy",
    distanceKm: 0.2,
    imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&q=80",
    popularProduct: "OTC Medicines",
  },
  {
    shopId: "s_acc1",
    shopName: "Meenakshi Fashion Jewellery",
    rating: 4.9,
    totalOrders: 950,
    repeatCustomerRate: 72,
    avgDeliveryMins: 24,
    satisfactionScore: 98,
    badge: "best_value",
    badgeLabel: "💎 Best Value",
    category: "Fashion Accessories",
    distanceKm: 1.0,
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&q=80",
    popularProduct: "Gold-plated Jhumka",
  },
  {
    shopId: "s_flour1",
    shopName: "Sri Lakshmi Flour & Masala Mill",
    rating: 4.9,
    totalOrders: 1600,
    repeatCustomerRate: 88,
    avgDeliveryMins: 18,
    satisfactionScore: 95,
    badge: "rising_star",
    badgeLabel: "🌟 Rising Star",
    category: "Flour Mill",
    distanceKm: 0.5,
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
    popularProduct: "Fresh Idli Batter",
  },
];

export interface BestSeller {
  productId: string;
  name: string;
  shopName: string;
  price: number;
  soldCount: number;
  imageUrl: string;
  category: string;
  trending: boolean;
}

export const BEST_SELLERS: BestSeller[] = [
  {
    productId: "bs1",
    name: "Fresh Idli/Dosa Batter (1kg)",
    shopName: "Sri Lakshmi Flour Mill",
    price: 60,
    soldCount: 1200,
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80",
    category: "Flour Mill",
    trending: true,
  },
  {
    productId: "bs2",
    name: "Mysurpa Sweet Box (250g)",
    shopName: "Sri Krishna Sweets",
    price: 180,
    soldCount: 890,
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80",
    category: "Sweets",
    trending: true,
  },
  {
    productId: "bs3",
    name: "Country Chicken (1kg)",
    shopName: "Kongu Country Mutton",
    price: 320,
    soldCount: 650,
    imageUrl: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300&q=80",
    category: "Meat",
    trending: false,
  },
  {
    productId: "bs4",
    name: "Gold-plated Jhumka Set",
    shopName: "Meenakshi Fashion Jewellery",
    price: 450,
    soldCount: 420,
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300&q=80",
    category: "Accessories",
    trending: true,
  },
  {
    productId: "bs5",
    name: "Organic Hill Banana (12pcs)",
    shopName: "Green Coast Organic",
    price: 85,
    soldCount: 780,
    imageUrl: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&q=80",
    category: "Fruits",
    trending: false,
  },
  {
    productId: "bs6",
    name: "Paracetamol + Cough Syrup Pack",
    shopName: "Sri Lakshmi Medicals",
    price: 120,
    soldCount: 1100,
    imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&q=80",
    category: "Pharmacy",
    trending: false,
  },
];
