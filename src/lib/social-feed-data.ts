/**
 * LocalShore Social Commerce Data Layer
 * Models and data for Social Feeds, Stories, Live Market, Groups, and Events.
 */

export interface TaggedProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
  unit: string;
  storeId: string;
  storeName: string;
  discountPrice?: number;
}

export interface SocialStoryItem {
  id: string;
  mediaUrl: string;
  caption?: string;
  timestamp: string;
  durationSeconds?: number;
  isVideo?: boolean;
}

export interface SocialStory {
  id: string;
  shopId: string;
  shopName: string;
  shopAvatar: string;
  verified: boolean;
  thumbnailUrl: string;
  hasVideo?: boolean;
  category: string;
  stories: SocialStoryItem[];
}

export interface SocialComment {
  id: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: string;
  likes: number;
}

export interface SocialPost {
  id: string;
  shopId: string;
  shopName: string;
  shopAvatar: string;
  verified: boolean;
  locationName: string;
  distanceKm: number;
  timestamp: string;
  images: string[];
  badgeTag?: string;
  title: string;
  description: string;
  hashtags: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  isFollowing?: boolean;
  taggedProducts: TaggedProduct[];
  category: "all" | "deals" | "nearby" | "events" | "following" | "fresh";
  comments?: SocialComment[];
}

export interface LiveMarketSession {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  title: string;
  thumbnailUrl: string;
  streamVideoUrl?: string;
  viewerCount: number;
  isLive: boolean;
  category: string;
  taggedProducts: TaggedProduct[];
}

export interface LocalGroup {
  id: string;
  name: string;
  membersCount: string;
  avatar: string;
  category: string;
  description: string;
  isJoined?: boolean;
}

export interface LocalEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  imageUrl: string;
  interestedCount: number;
  isInterested?: boolean;
}

export const INITIAL_STORIES: SocialStory[] = [
  {
    id: "story_kovil_medicals",
    shopId: "s_kovilmedu_medicals",
    shopName: "Kovilmedu Medicals",
    shopAvatar:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&q=80",
    verified: true,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&q=80",
    category: "pharmacy",
    stories: [
      {
        id: "st_kovil_med",
        mediaUrl:
          "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80",
        caption: "24/7 First-aid & home wellness kits restocked! 💊",
        timestamp: "20m ago",
      },
    ],
  },
  {
    id: "story_roja_bakes",
    shopId: "s_roja_bakes",
    shopName: "Roja Bakes",
    shopAvatar:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
    verified: true,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
    hasVideo: true,
    category: "bakery",
    stories: [
      {
        id: "st_roja_1",
        mediaUrl:
          "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
        caption: "Evening hot chicken puffs coming fresh out of our ovens! 🥐",
        timestamp: "45m ago",
      },
    ],
  },
  {
    id: "story_sri_amman",
    shopId: "s_amman_flour",
    shopName: "Amman Mill",
    shopAvatar:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
    verified: true,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
    category: "flour_mill",
    stories: [
      {
        id: "st_amman_1",
        mediaUrl:
          "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80",
        caption: "Stone-ground Idli batter ready for dispatch! 🌾",
        timestamp: "1h ago",
      },
    ],
  },
  {
    id: "story_ravi",
    shopId: "s_paap1",
    shopName: "Ravi's Bakery",
    shopAvatar: "/assets/ravis-bakery-logo.png",
    verified: true,
    thumbnailUrl: "/assets/ravis-bakery-logo.png",
    hasVideo: true,
    category: "bakery",
    stories: [
      {
        id: "st_1",
        mediaUrl: "/assets/ravis-sourdough-hero.jpg",
        caption: "Golden sourdough loaves fresh out of the deck oven! 🥖",
        timestamp: "1h ago",
      },
      {
        id: "st_2",
        mediaUrl:
          "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=80",
        caption: "Flaky almond croissants ready for your morning coffee ☕",
        timestamp: "3h ago",
      },
    ],
  },
  {
    id: "story_meena",
    shopId: "s_kiran1",
    shopName: "Meena Fresh",
    shopAvatar:
      "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80",
    verified: true,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80",
    category: "fruits_veg",
    stories: [
      {
        id: "st_3",
        mediaUrl:
          "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=900&q=80",
        caption: "Juicy Salem mangoes arrived this morning! Direct farm fresh 🥭",
        timestamp: "2h ago",
      },
    ],
  },
  {
    id: "story_citybites",
    shopId: "s_haribhavanam",
    shopName: "City Bites",
    shopAvatar:
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80",
    verified: true,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80",
    hasVideo: true,
    category: "restaurants",
    stories: [
      {
        id: "st_4",
        mediaUrl:
          "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=900&q=80",
        caption: "Dum opening ritual! Aromatic seeraga samba biryani 🥘",
        timestamp: "3h ago",
      },
    ],
  },
  {
    id: "story_stylehub",
    shopId: "s_boutique1",
    shopName: "StyleHub",
    shopAvatar:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
    verified: true,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=400&q=80",
    category: "fashion",
    stories: [
      {
        id: "st_5",
        mediaUrl:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
        caption: "New premium cotton tees in pastel colors! 👕",
        timestamp: "5h ago",
      },
    ],
  },
  {
    id: "story_kumar",
    shopId: "s_groc2",
    shopName: "Kumar Stores",
    shopAvatar:
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=400&q=80",
    verified: true,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=400&q=80",
    hasVideo: true,
    category: "grocery",
    stories: [
      {
        id: "st_6",
        mediaUrl:
          "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=900&q=80",
        caption: "Cold-pressed coconut & groundnut oils restocked! 🥥",
        timestamp: "4h ago",
      },
    ],
  },
  {
    id: "story_greenfarmers",
    shopId: "s_organic1",
    shopName: "Green Farmers",
    shopAvatar:
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80",
    verified: true,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80",
    category: "fruits_veg",
    stories: [
      {
        id: "st_7",
        mediaUrl:
          "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80",
        caption: "Organic greens harvested at 5 AM today. Crisp & pesticide-free 🥬",
        timestamp: "6h ago",
      },
    ],
  },
];

export const INITIAL_POSTS: SocialPost[] = [
  {
    id: "post_kumar",
    shopId: "s_groc2",
    shopName: "Kumar Stores Groceries",
    shopAvatar:
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=400&q=80",
    verified: true,
    locationName: "Gandhipuram, Coimbatore",
    distanceKm: 1.4,
    timestamp: "4h ago",
    badgeTag: "Restocked",
    images: [
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
    ],
    title: "Cold-Pressed Oils & Groceries Restocked! 🥥",
    description:
      "Traditional groceries with natural nutrients. 100% chemical free.",
    hashtags: ["#WoodPressed", "#PureOils"],
    likesCount: 421,
    commentsCount: 42,
    sharesCount: 28,
    savesCount: 52,
    isLiked: false,
    isSaved: false,
    isFollowing: true,
    category: "all",
    taggedProducts: [
      {
        id: "prod_coconutoil_1",
        name: "Coconut Oil",
        price: 349,
        stock: 25,
        imageUrl:
          "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80",
        unit: "1L",
        storeId: "s_groc2",
        storeName: "Kumar Stores Groceries",
      },
      {
        id: "prod_sesameoil_1",
        name: "Sesame Oil",
        price: 299,
        stock: 20,
        imageUrl:
          "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80",
        unit: "1L",
        storeId: "s_groc2",
        storeName: "Kumar Stores Groceries",
      },
      {
        id: "prod_cowghee_1",
        name: "Cow Ghee",
        price: 549,
        stock: 15,
        imageUrl:
          "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&q=80",
        unit: "500g",
        storeId: "s_groc2",
        storeName: "Kumar Stores Groceries",
      },
    ],
    comments: [
      {
        id: "c_k1",
        userName: "Vignesh K",
        text: "Cold-pressed coconut oil quality is top-notch! 🥥",
        timestamp: "2h ago",
        likes: 3,
      },
    ],
  },
  {
    id: "post_2",
    shopId: "s_kiran1",
    shopName: "Namma Fresh Produce & Organics",
    shopAvatar:
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80",
    verified: true,
    locationName: "R.S. Puram, Coimbatore",
    distanceKm: 3,
    timestamp: "3h ago",
    badgeTag: "Farm Fresh",
    images: [
      "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
    ],
    title: "Fresh Morning Harvest of Alphonso Mangoes! 🥭",
    description:
      "Direct from local farms. Tree-ripened, juicy and chemical-free.",
    hashtags: ["#Alphonso", "#FarmFresh"],
    likesCount: 338,
    commentsCount: 17,
    sharesCount: 24,
    savesCount: 89,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    category: "all",
    taggedProducts: [
      {
        id: "prod_mango_1",
        name: "Alphonso",
        price: 240,
        stock: 35,
        imageUrl:
          "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80",
        unit: "kg",
        storeId: "s_kiran1",
        storeName: "Namma Fresh Produce & Organics",
      },
      {
        id: "prod_spinach_1",
        name: "Fresh Greens",
        price: 35,
        stock: 40,
        imageUrl:
          "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&q=80",
        unit: "bunch",
        storeId: "s_kiran1",
        storeName: "Namma Fresh Produce & Organics",
      },
      {
        id: "prod_tomato_1",
        name: "Tomato",
        price: 30,
        stock: 50,
        imageUrl:
          "https://images.unsplash.com/photo-1546470427-f5b9c4e9c7d4?auto=format&fit=crop&w=400&q=80",
        unit: "kg",
        storeId: "s_kiran1",
        storeName: "Namma Fresh Produce & Organics",
      },
    ],
    comments: [
      {
        id: "c_divya",
        userName: "Divya N",
        text: "The mangoes are super sweet, ordered two kilos yesterday!",
        timestamp: "3h ago",
        likes: 7,
      },
    ],
  },
  {
    id: "post_1",
    shopId: "s_paap1",
    shopName: "Ravi's Artisan Bakery",
    shopAvatar: "/assets/ravis-bakery-logo.png",
    verified: true,
    locationName: "RS Puram, Coimbatore",
    distanceKm: 2.1,
    timestamp: "2h ago",
    badgeTag: "Freshly Baked",
    images: [
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
      "/assets/ravis-sourdough-hero.jpg",
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
    ],
    title: "Artisan Breads & Pastries Baked Daily! 🥐",
    description:
      "Sourdough, croissants and more – freshly baked every morning.",
    hashtags: ["#Sourdough", "#FreshBakes"],
    likesCount: 296,
    commentsCount: 14,
    sharesCount: 11,
    savesCount: 16,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    category: "all",
    taggedProducts: [
      {
        id: "prod_croissant_1",
        name: "Croissant",
        price: 70,
        stock: 25,
        imageUrl:
          "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80",
        unit: "",
        storeId: "s_paap1",
        storeName: "Ravi's Artisan Bakery",
      },
      {
        id: "prod_sourdough_1",
        name: "Sourdough",
        price: 180,
        stock: 14,
        imageUrl: "/assets/ravis-sourdough-hero.jpg",
        unit: "",
        storeId: "s_paap1",
        storeName: "Ravi's Artisan Bakery",
      },
      {
        id: "prod_brownie_1",
        name: "Brownie",
        price: 120,
        stock: 20,
        imageUrl:
          "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80",
        unit: "",
        storeId: "s_paap1",
        storeName: "Ravi's Artisan Bakery",
      },
    ],
    comments: [
      {
        id: "c1",
        userName: "Karthik R",
        text: "The crust and texture is perfect! Just ordered again! ❤️",
        timestamp: "1h ago",
        likes: 5,
      },
      {
        id: "c2",
        userName: "Meena S",
        text: "Finally! Authentic sourdough in R.S.Puram! 😍",
        timestamp: "45m ago",
        likes: 8,
      },
    ],
  },
  {
    id: "post_4",
    shopId: "s_boutique1",
    shopName: "StyleHub Apparel",
    shopAvatar:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
    verified: true,
    locationName: "Avinashi Road, Coimbatore",
    distanceKm: 4.8,
    timestamp: "6h ago",
    badgeTag: "New Collection",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=800&q=80",
    ],
    title: "New Summer Collection Now Live! 👕",
    description:
      "Comfortable, stylish and premium quality everyday wear.",
    hashtags: ["#SummerStyle", "#CasualWear"],
    likesCount: 257,
    commentsCount: 9,
    sharesCount: 15,
    savesCount: 31,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    category: "all",
    taggedProducts: [
      {
        id: "prod_tshirt_1",
        name: "T-Shirt",
        price: 399,
        stock: 20,
        imageUrl:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
        unit: "",
        storeId: "s_boutique1",
        storeName: "StyleHub Apparel",
      },
      {
        id: "prod_polotee_1",
        name: "Polo Tee",
        price: 599,
        stock: 15,
        imageUrl:
          "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=400&q=80",
        unit: "",
        storeId: "s_boutique1",
        storeName: "StyleHub Apparel",
      },
      {
        id: "prod_cap_1",
        name: "Cap",
        price: 299,
        stock: 18,
        imageUrl:
          "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=400&q=80",
        unit: "",
        storeId: "s_boutique1",
        storeName: "StyleHub Apparel",
      },
    ],
  },
  {
    id: "post_6",
    shopId: "s_sweets1",
    shopName: "Sri Krishna Sweets",
    shopAvatar:
      "https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=400&q=80",
    verified: true,
    locationName: "RS Puram, Coimbatore",
    distanceKm: 0.8,
    timestamp: "1h ago",
    badgeTag: "Fresh Mithai",
    images: [
      "https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=800&q=80",
    ],
    title: "Pure Ghee Mysore Pak fresh from our copper kadai! 🧈",
    description:
      "Melt-in-your-mouth texture crafted with heritage A2 cow ghee and gram flour. The authentic taste of Coimbatore.",
    hashtags: ["#MysorePak", "#PureGhee", "#CoimbatoreTradition"],
    likesCount: 524,
    commentsCount: 42,
    sharesCount: 29,
    savesCount: 94,
    isLiked: false,
    isSaved: false,
    isFollowing: true,
    category: "fresh",
    taggedProducts: [
      {
        id: "prod_mysorepak_1",
        name: "Pure Ghee Mysore Pak (500g)",
        price: 340,
        stock: 22,
        imageUrl:
          "https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=400&q=80",
        unit: "box",
        storeId: "s_sweets1",
        storeName: "Sri Krishna Sweets",
      },
      {
        id: "prod_halwa_1",
        name: "Tirunelveli Wheat Halwa",
        price: 220,
        stock: 15,
        imageUrl:
          "https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=400&q=80",
        unit: "box",
        storeId: "s_sweets1",
        storeName: "Sri Krishna Sweets",
      },
    ],
  },
  {
    id: "post_7",
    shopId: "s_tiffin1",
    shopName: "Annapoorna Tiffin",
    shopAvatar:
      "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80",
    verified: true,
    locationName: "Gandhipuram, Coimbatore",
    distanceKm: 1.2,
    timestamp: "45m ago",
    badgeTag: "Hot Tiffin",
    images: [
      "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    ],
    title: "Crispy Golden Ghee Roast Dosa & Degree Filter Coffee ☕",
    description:
      "Fermented naturally for 14 hours. Served hot with 3 homemade chutneys, piping hot sambar, and authentic chicory coffee.",
    hashtags: ["#FilterCoffee", "#GheeRoast", "#BreakfastSpecial"],
    likesCount: 681,
    commentsCount: 67,
    sharesCount: 38,
    savesCount: 120,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    category: "fresh",
    taggedProducts: [
      {
        id: "prod_dosa_1",
        name: "Special Ghee Roast Dosa",
        price: 110,
        stock: 50,
        imageUrl:
          "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80",
        unit: "plate",
        storeId: "s_tiffin1",
        storeName: "Annapoorna Tiffin",
      },
      {
        id: "prod_coffee_1",
        name: "Degree Filter Coffee (Flask)",
        price: 80,
        stock: 35,
        imageUrl:
          "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80",
        unit: "flask",
        storeId: "s_tiffin1",
        storeName: "Annapoorna Tiffin",
      },
    ],
  },
  {
    id: "post_8",
    shopId: "s_organic1",
    shopName: "Green Farmers Organics",
    shopAvatar:
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80",
    verified: true,
    locationName: "Saibaba Colony, Coimbatore",
    distanceKm: 1.8,
    timestamp: "3h ago",
    badgeTag: "100% Organic",
    images: [
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=800&q=80",
    ],
    title: "Morning Harvest: Fresh Palak, Coriander & Free-Range Country Eggs 🥚",
    description:
      "Zero chemicals, zero artificial fertilizers. Hand-harvested at sunrise from Pollachi farms.",
    hashtags: ["#OrganicFarming", "#CountryEggs", "#FarmToTable"],
    likesCount: 310,
    commentsCount: 24,
    sharesCount: 15,
    savesCount: 62,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    category: "fresh",
    taggedProducts: [
      {
        id: "prod_country_eggs_1",
        name: "Free-Range Country Eggs (6 pcs)",
        price: 90,
        stock: 25,
        imageUrl:
          "https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=400&q=80",
        unit: "pack",
        storeId: "s_organic1",
        storeName: "Green Farmers Organics",
      },
      {
        id: "prod_palak_1",
        name: "Pollachi Farm Fresh Palak",
        price: 25,
        stock: 30,
        imageUrl:
          "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80",
        unit: "bunch",
        storeId: "s_organic1",
        storeName: "Green Farmers Organics",
      },
    ],
  },
  {
    id: "post_kovilmedu_medicals",
    shopId: "s_kovilmedu_medicals",
    shopName: "Kovilmedu Care Medicals & Chemist",
    shopAvatar:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&q=80",
    verified: true,
    locationName: "Junction Arch, Kovilmedu, Coimbatore",
    distanceKm: 0.2,
    timestamp: "30m ago",
    badgeTag: "Healthcare",
    images: [
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
    ],
    title: "24/7 Essential Healthcare & Wellness Care Packs 💊",
    description:
      "Serving our Kovilmedu neighborhood with verified medicines, daily vitamins and first aid essentials. Rapid 15-min delivery.",
    hashtags: ["#Healthcare", "#KovilmeduPharmacy", "#Wellness"],
    likesCount: 245,
    commentsCount: 16,
    sharesCount: 10,
    savesCount: 58,
    isLiked: false,
    isSaved: false,
    isFollowing: true,
    category: "nearby",
    taggedProducts: [
      {
        id: "prod_vitaminc_1",
        name: "Vitamin C Immune Boost (60 caps)",
        price: 180,
        stock: 40,
        imageUrl:
          "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80",
        unit: "bottle",
        storeId: "s_kovilmedu_medicals",
        storeName: "Kovilmedu Care Medicals & Chemist",
      },
      {
        id: "prod_firstaid_1",
        name: "Home First-Aid Antiseptic Kit",
        price: 120,
        stock: 25,
        imageUrl:
          "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&q=80",
        unit: "kit",
        storeId: "s_kovilmedu_medicals",
        storeName: "Kovilmedu Care Medicals & Chemist",
      },
    ],
  },
  {
    id: "post_roja_bakes",
    shopId: "s_roja_bakes",
    shopName: "Roja Bakes & Sweets",
    shopAvatar:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
    verified: true,
    locationName: "Thadagam Main Road, Kovilmedu, Coimbatore",
    distanceKm: 0.3,
    timestamp: "1h ago",
    badgeTag: "Oven Fresh",
    images: [
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=800&q=80",
    ],
    title: "Warm Crispy Egg Puffs & Honey Sponge Cake 🥐",
    description:
      "Fresh batch straight from the deck oven. Flaky layered crust with spicy Kovilmedu masala filling. Pair it with evening tea!",
    hashtags: ["#EveningSnacks", "#EggPuff", "#KovilmeduBakes"],
    likesCount: 412,
    commentsCount: 35,
    sharesCount: 18,
    savesCount: 77,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    category: "fresh",
    taggedProducts: [
      {
        id: "prod_eggpuff_1",
        name: "Crispy Masala Egg Puff (2 pcs)",
        price: 50,
        stock: 35,
        imageUrl:
          "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
        unit: "plate",
        storeId: "s_roja_bakes",
        storeName: "Roja Bakes & Sweets",
      },
      {
        id: "prod_honeycake_1",
        name: "Classic Honey Sponge Cake",
        price: 70,
        stock: 20,
        imageUrl:
          "https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=400&q=80",
        unit: "box",
        storeId: "s_roja_bakes",
        storeName: "Roja Bakes & Sweets",
      },
    ],
  },
  {
    id: "post_sri_amman",
    shopId: "s_amman_flour",
    shopName: "Sri Amman Flour & Masala Mill",
    shopAvatar:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
    verified: true,
    locationName: "Temple Street, Kovilmedu, Coimbatore",
    distanceKm: 0.3,
    timestamp: "2h ago",
    badgeTag: "Stone Milled",
    images: [
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80",
    ],
    title: "Freshly Stone-Ground Sambar Powder & Pure Rice Flour 🌾",
    description:
      "Traditional granite stone-ground flours. Preserves natural taste, fibers, and rich aroma. Milled daily here in Kovilmedu.",
    hashtags: ["#StoneGround", "#PureMasala", "#KovilmeduMill"],
    likesCount: 388,
    commentsCount: 29,
    sharesCount: 22,
    savesCount: 84,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    category: "nearby",
    taggedProducts: [
      {
        id: "prod_sambar_powder_1",
        name: "Authentic Stone-Ground Sambar Powder (250g)",
        price: 85,
        stock: 30,
        imageUrl:
          "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
        unit: "pack",
        storeId: "s_amman_flour",
        storeName: "Sri Amman Flour & Masala Mill",
      },
      {
        id: "prod_rice_flour_1",
        name: "Pure Raw Rice Flour (1 kg)",
        price: 65,
        stock: 40,
        imageUrl:
          "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=400&q=80",
        unit: "1 kg",
        storeId: "s_amman_flour",
        storeName: "Sri Amman Flour & Masala Mill",
      },
    ],
  },
  {
    id: "post_kovilmedu_super",
    shopId: "s_kovil_super",
    shopName: "Kovilmedu Supermarket & Kirana",
    shopAvatar:
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=400&q=80",
    verified: true,
    locationName: "Opp. Kovilmedu Arch, Thadagam Road, Coimbatore",
    distanceKm: 0.4,
    timestamp: "2h ago",
    badgeTag: "Daily Groceries",
    images: [
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80",
    ],
    title: "Monthly Ration & Daily Kitchen Staples Restocked! 🛒",
    description:
      "Top grade Sona Masoori rice, organic toor dal, Idhayam sesame oil, spices & dairy. Order your full home ration for quick 20-min delivery.",
    hashtags: ["#DailyKirana", "#KovilmeduGroceries", "#HomeDelivery"],
    likesCount: 310,
    commentsCount: 22,
    sharesCount: 11,
    savesCount: 46,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    category: "nearby",
    taggedProducts: [
      {
        id: "prod_sona_rice_1",
        name: "Premium Sona Masoori Rice (5kg)",
        price: 330,
        stock: 40,
        imageUrl:
          "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
        unit: "5kg bag",
        storeId: "s_kovil_super",
        storeName: "Kovilmedu Supermarket & Kirana",
      },
      {
        id: "prod_sesame_oil_1",
        name: "Idhayam Sesame Cooking Oil (1L)",
        price: 285,
        stock: 25,
        imageUrl:
          "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=400&q=80",
        unit: "1L pouch",
        storeId: "s_kovil_super",
        storeName: "Kovilmedu Supermarket & Kirana",
      },
    ],
  },
  {
    id: "post_kovilmedu_palamuthir",
    shopId: "s_kovil_pala",
    shopName: "Kovilmedu Organic Palamuthir Nilayam",
    shopAvatar:
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80",
    verified: true,
    locationName: "Thadagam Road, Near Bus Stop, Kovilmedu, Coimbatore",
    distanceKm: 0.5,
    timestamp: "3h ago",
    badgeTag: "Farm Fresh",
    images: [
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
    ],
    title: "Pollachi Tender Coconuts & Sirumalai Hill Bananas Arrived! 🥥🍌",
    description:
      "Freshly cut Pollachi elaneer with thick coconut malai, Sirumalai hill bananas, country tomatoes and crisp local greens. Handpicked from local farms.",
    hashtags: ["#PalamuthirNilayam", "#PollachiElaneer", "#HillBananas"],
    likesCount: 468,
    commentsCount: 39,
    sharesCount: 25,
    savesCount: 82,
    isLiked: false,
    isSaved: false,
    isFollowing: true,
    category: "fresh",
    taggedProducts: [
      {
        id: "prod_pollachi_elaneer_1",
        name: "Fresh Pollachi Tender Coconut",
        price: 55,
        stock: 60,
        imageUrl:
          "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80",
        unit: "piece",
        storeId: "s_kovil_pala",
        storeName: "Kovilmedu Organic Palamuthir Nilayam",
      },
      {
        id: "prod_hill_banana_1",
        name: "Sirumalai Hill Banana (1kg)",
        price: 75,
        stock: 30,
        imageUrl:
          "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80",
        unit: "1 kg",
        storeId: "s_kovil_pala",
        storeName: "Kovilmedu Organic Palamuthir Nilayam",
      },
    ],
  },
  {
    id: "post_kongu_country_meat",
    shopId: "s_kovil_meat",
    shopName: "Kongu Country Mutton & Chicken Stall",
    shopAvatar:
      "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80",
    verified: true,
    locationName: "Thadagam Main Road, Kovilmedu, Coimbatore",
    distanceKm: 0.6,
    timestamp: "4h ago",
    badgeTag: "Fresh Cut",
    images: [
      "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=80",
    ],
    title: "Morning Fresh Free-Range Country Chicken (Naattu Kozhi) & Tender Cuts 🍗",
    description:
      "100% farm-raised country chicken and fresh tender mutton cuts, cleaned, cut and packed hygienically. Perfect for Kongunadu style gravies.",
    hashtags: ["#KonguMeat", "#NaattuKozhi", "#KovilmeduFresh"],
    likesCount: 395,
    commentsCount: 33,
    sharesCount: 16,
    savesCount: 54,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    category: "deals",
    taggedProducts: [
      {
        id: "prod_naattu_kozhi_1",
        name: "Fresh Naattu Kozhi (Country Chicken)",
        price: 390,
        stock: 20,
        imageUrl:
          "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=400&q=80",
        unit: "1 kg",
        storeId: "s_kovil_meat",
        storeName: "Kongu Country Mutton & Chicken Stall",
      },
      {
        id: "prod_country_eggs_2",
        name: "Organic Country Chicken Eggs (6 pcs)",
        price: 60,
        stock: 40,
        imageUrl:
          "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&w=400&q=80",
        unit: "6 pack",
        storeId: "s_kovil_meat",
        storeName: "Kongu Country Mutton & Chicken Stall",
      },
    ],
  },
  {
    id: "post_meenakshi_jewellery",
    shopId: "s_kovil_jewel",
    shopName: "Meenakshi Fashion Jewellery & Gift Corner",
    shopAvatar:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=400&q=80",
    verified: true,
    locationName: "Bazaar Street, Kovilmedu, Coimbatore",
    distanceKm: 0.5,
    timestamp: "5h ago",
    badgeTag: "Handcrafted",
    images: [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80",
    ],
    title: "Antique Kemp Temple Jhumkas & Brass Pooja Gifts Collection ✨",
    description:
      "Exquisite traditional matte finish temple jhumkas, bridal accessories, and handcrafted brass vilakku gift sets. Perfect for festive occasions and gifting.",
    hashtags: ["#TempleJewellery", "#KempJhumkas", "#KovilmeduBazaar"],
    likesCount: 345,
    commentsCount: 26,
    sharesCount: 15,
    savesCount: 72,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    category: "nearby",
    taggedProducts: [
      {
        id: "prod_kemp_jhumka_1",
        name: "Antique Kemp Stone Temple Jhumkas",
        price: 280,
        stock: 18,
        imageUrl:
          "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=400&q=80",
        unit: "pair",
        storeId: "s_kovil_jewel",
        storeName: "Meenakshi Fashion Jewellery & Gift Corner",
      },
      {
        id: "prod_brass_diya_1",
        name: "Handcrafted Brass Lotus Diya Pair",
        price: 195,
        stock: 25,
        imageUrl:
          "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=400&q=80",
        unit: "pair",
        storeId: "s_kovil_jewel",
        storeName: "Meenakshi Fashion Jewellery & Gift Corner",
      },
    ],
  },
  {
    id: "post_kovilmedu_readymades",
    shopId: "s_kovil_cloth",
    shopName: "Kovilmedu Readymades & Menswear",
    shopAvatar:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80",
    verified: true,
    locationName: "Main Road, Kovilmedu, Coimbatore",
    distanceKm: 0.6,
    timestamp: "5h ago",
    badgeTag: "Kongu Weaves",
    images: [
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
    ],
    title: "Coimbatore Pure Combed Cotton Dhotis & Handloom Casual Shirts 👕",
    description:
      "Finest quality Kongu region woven cotton dhotis with gold zari borders, comfortable casual shirts, and traditional daily wear.",
    hashtags: ["#CottonDhoti", "#KonguHandloom", "#KovilmeduMenswear"],
    likesCount: 260,
    commentsCount: 14,
    sharesCount: 9,
    savesCount: 38,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    category: "nearby",
    taggedProducts: [
      {
        id: "prod_zari_dhoti_1",
        name: "Pure Cotton Gold Zari Dhoti (4 Mulam)",
        price: 380,
        stock: 25,
        imageUrl:
          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80",
        unit: "piece",
        storeId: "s_kovil_cloth",
        storeName: "Kovilmedu Readymades & Menswear",
      },
      {
        id: "prod_cotton_shirt_1",
        name: "Handloom Pure Cotton Casual Shirt",
        price: 549,
        stock: 20,
        imageUrl:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
        unit: "piece",
        storeId: "s_kovil_cloth",
        storeName: "Kovilmedu Readymades & Menswear",
      },
    ],
  },
  {
    id: "post_kovilmedu_event",
    shopId: "s_organic1",
    shopName: "Green Farmers Collective",
    shopAvatar: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80",
    verified: true,
    locationName: "Kovilmedu Community Grounds, Coimbatore",
    distanceKm: 0.7,
    timestamp: "2h ago",
    badgeTag: "Community Event",
    images: [
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80",
    ],
    title: "Weekend Kongu Organic Farmers Meet & Kitchen Garden Workshop 🌱",
    description:
      "Join 15+ neighborhood growers this Saturday 8:00 AM - 12:00 PM! Free demo on kitchen gardening, seed giveaways, and farm-fresh harvest tasting.",
    hashtags: ["#CoimbatoreCommunity", "#FarmersMarket", "#GreenLiving", "#LocalEvents"],
    likesCount: 480,
    commentsCount: 38,
    sharesCount: 29,
    savesCount: 77,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    category: "events",
    taggedProducts: [
      {
        id: "prod_organic_greens_basket",
        name: "Fresh Native Greens & Herb Basket",
        price: 150,
        discountPrice: 120,
        stock: 30,
        imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80",
        unit: "basket",
        storeId: "s_organic1",
        storeName: "Green Farmers Collective",
      },
    ],
  },
];

export const INITIAL_LIVE_MARKET: LiveMarketSession = {
  id: "live_1",
  sellerId: "s_kiran1",
  sellerName: "Kumar Stores",
  sellerAvatar:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  title: "Kumar Stores Fresh Mangoes Just Arrived! 🥭",
  thumbnailUrl:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
  streamVideoUrl:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  viewerCount: 312,
  isLive: true,
  category: "Fresh Fruits & Produce",
  taggedProducts: [
    {
      id: "prod_mango_live",
      name: "Salem Alphonso Mango (1 Kg)",
      price: 210,
      stock: 40,
      imageUrl:
        "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80",
      unit: "1 kg",
      storeId: "s_kiran1",
      storeName: "Kumar Stores",
    },
  ],
};

export const INITIAL_LOCAL_GROUPS: LocalGroup[] = [
  {
    id: "grp_1",
    name: "Coimbatore Foodies",
    membersCount: "12.4K members",
    avatar:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&q=80",
    category: "Food & Dining",
    description: "Discover hidden gems, biryani spots, street food, and authentic recipes in CBE.",
    isJoined: true,
  },
  {
    id: "grp_2",
    name: "Local Entrepreneurs",
    membersCount: "6.8K members",
    avatar:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=200&q=80",
    category: "Business",
    description: "Network of local founders, artisans, shop owners, and creators in Coimbatore.",
    isJoined: false,
  },
  {
    id: "grp_3",
    name: "Sustainable Coimbatore",
    membersCount: "3.1K members",
    avatar:
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=200&q=80",
    category: "Lifestyle",
    description:
      "Zero-waste living, organic farming, terrace gardening, and native seeds exchange.",
    isJoined: false,
  },
];

export const INITIAL_LOCAL_EVENTS: LocalEvent[] = [
  {
    id: "evt_1",
    title: "RS Puram Local Market Fest",
    date: "Sun, 10 Nov",
    time: "10 AM – 8 PM",
    location: "RS Puram, CBE",
    imageUrl:
      "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=600&q=80",
    interestedCount: 284,
    isInterested: false,
  },
  {
    id: "evt_2",
    title: "Artisanal Baker & Coffee Pop-up",
    date: "Sat, 16 Nov",
    time: "4 PM – 9 PM",
    location: "Race Course, CBE",
    imageUrl:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80",
    interestedCount: 167,
    isInterested: false,
  },
];

export const INITIAL_GROUPS = INITIAL_LOCAL_GROUPS;
export const INITIAL_EVENTS = INITIAL_LOCAL_EVENTS;


// ─── Bengaluru / JP Nagar Social Commerce Data Set ───

export const BENGALURU_POSTS: SocialPost[] = [
  {
    id: "post_jp_apparel",
    shopId: "s_jp_apparel",
    shopName: "JP Nagar Readymades & Menswear",
    shopAvatar: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80",
    verified: true,
    locationName: "15th Main Road, JP Nagar 2nd Phase, Bengaluru",
    distanceKm: 0.4,
    timestamp: "2h ago",
    badgeTag: "Bengaluru Handlooms",
    images: [
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
    ],
    title: "Pure Combed Cotton Shirts & Handloom Casuals 👕",
    description:
      "Finest quality pure cotton daily wear, formal shirts, and casual kurtas. Doorstep delivery in 30 mins!",
    hashtags: ["#CottonWear", "#HandloomCasuals", "#JPNagarMenswear"],
    likesCount: 342,
    commentsCount: 18,
    sharesCount: 12,
    savesCount: 45,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    category: "all",
    taggedProducts: [
      {
        id: "prod_jp_dhoti",
        name: "Cotton Dhoti",
        price: 380,
        stock: 25,
        imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80",
        unit: "piece",
        storeId: "s_jp_apparel",
        storeName: "JP Nagar Readymades & Menswear",
      },
      {
        id: "prod_jp_shirt",
        name: "Casual Shirt",
        price: 549,
        stock: 20,
        imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
        unit: "piece",
        storeId: "s_jp_apparel",
        storeName: "JP Nagar Readymades & Menswear",
      },
      {
        id: "prod_jp_kurta",
        name: "Cotton Kurta",
        price: 499,
        stock: 18,
        imageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=400&q=80",
        unit: "piece",
        storeId: "s_jp_apparel",
        storeName: "JP Nagar Readymades & Menswear",
      },
    ],
    comments: [
      {
        id: "c_jp_1",
        userName: "Karthik R",
        text: "The fabric and fitting look perfect! Just placed my order. 👕",
        timestamp: "1h ago",
        likes: 4,
      },
      {
        id: "c_jp_2",
        userName: "Meena S",
        text: "Finally! Great authentic handloom collection in JP Nagar 2nd Phase 😍",
        timestamp: "45m ago",
        likes: 6,
      },
    ],
  },
  {
    id: "post_jp_bakery",
    shopId: "s_jp_bakery",
    shopName: "Ravi's Artisan Bakery (JP Nagar)",
    shopAvatar: "/assets/ravis-bakery-logo.png",
    verified: true,
    locationName: "24th Main Road, JP Nagar 2nd Phase, Bengaluru",
    distanceKm: 0.3,
    timestamp: "3h ago",
    badgeTag: "Freshly Baked",
    images: [
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
      "/assets/ravis-sourdough-hero.jpg",
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
    ],
    title: "Woodfired Artisan Sourdough & Croissants Fresh Out! 🥐🔥",
    description:
      "Slow-fermented for 24 hours, baked crisp on the outside and pillowy inside. Fresh daily in JP Nagar!",
    hashtags: ["#FreshlyBaked", "#SourdoughLoaf", "#BengaluruBakes"],
    likesCount: 298,
    commentsCount: 24,
    sharesCount: 16,
    savesCount: 52,
    isLiked: false,
    isSaved: false,
    isFollowing: true,
    category: "fresh",
    taggedProducts: [
      {
        id: "prod_jp_croissant",
        name: "Croissant",
        price: 70,
        stock: 24,
        imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80",
        unit: "piece",
        storeId: "s_jp_bakery",
        storeName: "Ravi's Artisan Bakery (JP Nagar)",
      },
      {
        id: "prod_jp_sourdough",
        name: "Sourdough",
        price: 180,
        stock: 15,
        imageUrl: "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=400&q=80",
        unit: "loaf",
        storeId: "s_jp_bakery",
        storeName: "Ravi's Artisan Bakery (JP Nagar)",
      },
      {
        id: "prod_jp_brownie",
        name: "Brownie",
        price: 120,
        stock: 20,
        imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80",
        unit: "piece",
        storeId: "s_jp_bakery",
        storeName: "Ravi's Artisan Bakery (JP Nagar)",
      },
    ],
    comments: [
      {
        id: "c_jp_3",
        userName: "Anand Kumar",
        text: "Picked up a warm loaf this morning, incredible crust! 🍞",
        timestamp: "2h ago",
        likes: 5,
      },
    ],
  },
  {
    id: "post_jp_produce",
    shopId: "s_jp_produce",
    shopName: "Namma Fresh Produce & Organics",
    shopAvatar: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80",
    verified: true,
    locationName: "Ring Road Junction, JP Nagar 2nd Phase, Bengaluru",
    distanceKm: 0.4,
    timestamp: "4h ago",
    badgeTag: "Farm Fresh",
    images: [
      "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
    ],
    title: "Fresh Morning Harvest of Greens & Alphonso Mangoes! 🥭🥬",
    description:
      "Direct from local Karnataka farms! Tree-ripened Alphonso mangoes, fresh palak, and country tomatoes.",
    hashtags: ["#FarmFresh", "#OrganicVeg", "#JPNagarMarket"],
    likesCount: 420,
    commentsCount: 36,
    sharesCount: 22,
    savesCount: 68,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    category: "fresh",
    taggedProducts: [
      {
        id: "prod_jp_mango",
        name: "Alphonso",
        price: 240,
        stock: 40,
        imageUrl: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80",
        unit: "kg",
        storeId: "s_jp_produce",
        storeName: "Namma Fresh Produce & Organics",
      },
      {
        id: "prod_jp_palak",
        name: "Fresh Greens",
        price: 35,
        stock: 60,
        imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&q=80",
        unit: "bunch",
        storeId: "s_jp_produce",
        storeName: "Namma Fresh Produce & Organics",
      },
      {
        id: "prod_jp_tomato",
        name: "Tomato",
        price: 30,
        stock: 50,
        imageUrl: "https://images.unsplash.com/photo-1546470427-f5b9c4e9c7d4?auto=format&fit=crop&w=400&q=80",
        unit: "kg",
        storeId: "s_jp_produce",
        storeName: "Namma Fresh Produce & Organics",
      },
    ],
    comments: [
      {
        id: "c_jp_4",
        userName: "Divya Rao",
        text: "The mangoes were super sweet and naturally ripe! Ordering again.",
        timestamp: "3h ago",
        likes: 7,
      },
    ],
  },
  {
    id: "post_jp_dining",
    shopId: "s_jp_dining",
    shopName: "City Bites Kitchen & Mess (JP Nagar)",
    shopAvatar: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80",
    verified: true,
    locationName: "14th Cross Rd, JP Nagar 2nd Phase, Bengaluru",
    distanceKm: 0.5,
    timestamp: "5h ago",
    badgeTag: "Hot Tiffin",
    images: [
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    ],
    title: "Steaming Karnataka Thatte Idli & Filter Coffee ☕",
    description:
      "Freshly steamed soft thatte idlis with red chutney and aromatic sagu, paired with degree filter coffee.",
    hashtags: ["#BengaluruBreakfast", "#ThatteIdli", "#FilterCoffee"],
    likesCount: 380,
    commentsCount: 29,
    sharesCount: 15,
    savesCount: 51,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    category: "all",
    taggedProducts: [
      {
        id: "prod_jp_thatte",
        name: "Thatte Idli",
        price: 50,
        stock: 50,
        imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80",
        unit: "plate",
        storeId: "s_jp_dining",
        storeName: "City Bites Kitchen & Mess (JP Nagar)",
      },
      {
        id: "prod_jp_coffee",
        name: "Filter Coffee",
        price: 25,
        stock: 80,
        imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80",
        unit: "cup",
        storeId: "s_jp_dining",
        storeName: "City Bites Kitchen & Mess (JP Nagar)",
      },
      {
        id: "prod_jp_vada",
        name: "Crispy Vada",
        price: 30,
        stock: 40,
        imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80",
        unit: "piece",
        storeId: "s_jp_dining",
        storeName: "City Bites Kitchen & Mess (JP Nagar)",
      },
    ],
  },
  {
    id: "post_jp_mill",
    shopId: "s_jp_mill",
    shopName: "Sri Amman Flour & Grain Mill (JP Nagar)",
    shopAvatar: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
    verified: true,
    locationName: "9th Cross, JP Nagar 2nd Phase, Bengaluru",
    distanceKm: 0.3,
    timestamp: "6h ago",
    badgeTag: "Stone Milled",
    images: [
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
    ],
    title: "Fresh Idli & Dosa Batter + Whole Wheat Chakki Atta 🥣",
    description:
      "100% naturally fermented, no soda or preservatives. Ground fresh with mineral water and stone chakki.",
    hashtags: ["#FreshBatter", "#DosaBatter", "#ChakkiAtta", "#JPNagar"],
    likesCount: 245,
    commentsCount: 15,
    sharesCount: 8,
    savesCount: 39,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    category: "fresh",
    taggedProducts: [
      {
        id: "prod_jp_batter",
        name: "Fresh Idli & Dosa Batter (1 kg)",
        price: 45,
        stock: 40,
        imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
        unit: "pack",
        storeId: "s_jp_mill",
        storeName: "Sri Amman Flour & Grain Mill (JP Nagar)",
      },
    ],
  },
  {
    id: "post_jp_medicals",
    shopId: "s_jp_medicals",
    shopName: "Apollo Pharmacy & Wellness - JP Nagar",
    shopAvatar: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&q=80",
    verified: true,
    locationName: "15th Main Road, JP Nagar 2nd Phase, Bengaluru",
    distanceKm: 0.2,
    timestamp: "1h ago",
    badgeTag: "24/7 Care",
    images: [
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=800&q=80",
    ],
    title: "Essential Medicines, Immunity Boosters & Baby Care Express Delivery 💊",
    description:
      "Need urgent prescriptions or wellness essentials? Delivered to your door in JP Nagar 2nd Phase within 15 minutes.",
    hashtags: ["#PharmacyExpress", "#HealthCare", "#JPNagar"],
    likesCount: 190,
    commentsCount: 11,
    sharesCount: 6,
    savesCount: 28,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    category: "nearby",
    taggedProducts: [
      {
        id: "prod_jp_firstaid",
        name: "First Aid & Wellness Kit",
        price: 299,
        stock: 25,
        imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80",
        unit: "kit",
        storeId: "s_jp_medicals",
        storeName: "Apollo Pharmacy & Wellness - JP Nagar",
      },
    ],
  },
  {
    id: "post_jp_sweets",
    shopId: "s_jp_sweets",
    shopName: "Sri Krishna Sweets & Bakes (JP Nagar)",
    shopAvatar: "https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=400&q=80",
    verified: true,
    locationName: "100 Feet Ring Road, JP Nagar 2nd Phase, Bengaluru",
    distanceKm: 0.5,
    timestamp: "7h ago",
    badgeTag: "Pure Ghee",
    images: [
      "https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=800&q=80",
    ],
    title: "Hot Melt-in-Mouth Mysurpa & Ghee Savouries 🍯",
    description:
      "Prepared with fresh aromatic ghee. Order fresh box assortments delivered right to your home in JP Nagar.",
    hashtags: ["#Mysurpa", "#GheeSweets", "#BengaluruSweets"],
    likesCount: 310,
    commentsCount: 21,
    sharesCount: 14,
    savesCount: 42,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    category: "deals",
    taggedProducts: [
      {
        id: "prod_jp_mysurpa",
        name: "Original Pure Ghee Mysurpa (250g)",
        price: 195,
        stock: 30,
        imageUrl: "https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=400&q=80",
        unit: "box",
        storeId: "s_jp_sweets",
        storeName: "Sri Krishna Sweets & Bakes (JP Nagar)",
      },
    ],
  },
  {
    id: "post_jp_community_farmers",
    shopId: "s_jp_produce",
    shopName: "Namma Fresh Produce & Organics",
    shopAvatar: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80",
    verified: true,
    locationName: "24th Main Road, JP Nagar 2nd Phase, Bengaluru",
    distanceKm: 0.4,
    timestamp: "2h ago",
    badgeTag: "Community Event",
    images: [
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80",
    ],
    title: "Sunday Morning Organic Farmers Market & Heirloom Seed Swap 🌱",
    description:
      "Happening around JP Nagar this Sunday 7:30 AM to 11:30 AM! Meet local urban farmers, terrace gardeners, and sample fresh sourdough loaves. Free entry — bring your reusable bags.",
    hashtags: ["#JPNagarEvents", "#FarmersMarket", "#BengaluruCommunity", "#LocalEvents"],
    likesCount: 520,
    commentsCount: 42,
    sharesCount: 35,
    savesCount: 88,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    category: "events",
    taggedProducts: [
      {
        id: "prod_jp_farm_basket",
        name: "Weekly Organic Farm Basket (5 kg Assorted)",
        price: 350,
        discountPrice: 299,
        stock: 20,
        imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80",
        unit: "basket",
        storeId: "s_jp_produce",
        storeName: "Namma Fresh Produce & Organics",
      },
    ],
    comments: [
      {
        id: "c_ev_1",
        userName: "Preeti Shenoy",
        text: "Looking forward to bringing the kids for the seed planting session! 🌻",
        timestamp: "1h ago",
        likes: 12,
      },
    ],
  },
  {
    id: "post_jp_deals_bakery",
    shopId: "s_jp_bakery",
    shopName: "Ravi's Artisan Bakery (JP Nagar)",
    shopAvatar: "/assets/ravis-bakery-logo.png",
    verified: true,
    locationName: "24th Main Road, JP Nagar 2nd Phase, Bengaluru",
    distanceKm: 0.3,
    timestamp: "1h ago",
    badgeTag: "Flash Deal • 20% OFF",
    images: [
      "/assets/ravis-sourdough-hero.jpg",
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
    ],
    title: "Afternoon Deal: Sourdough + 2 Almond Croissants Combo 🏷️",
    description:
      "Limited afternoon batch! Grab our signature sourdough loaf with 2 flaky butter almond croissants at 20% off for the next 2 hours only.",
    hashtags: ["#DealsNearYou", "#AfternoonBakes", "#BakeryDeals", "#JPNagarDiscounts"],
    likesCount: 284,
    commentsCount: 19,
    sharesCount: 11,
    savesCount: 64,
    isLiked: false,
    isSaved: false,
    isFollowing: true,
    category: "deals",
    taggedProducts: [
      {
        id: "prod_jp_combo_deal",
        name: "Sourdough + 2 Almond Croissants Combo",
        price: 320,
        discountPrice: 249,
        stock: 12,
        imageUrl: "/assets/ravis-sourdough-hero.jpg",
        unit: "combo",
        storeId: "s_jp_bakery",
        storeName: "Ravi's Artisan Bakery (JP Nagar)",
      },
    ],
    comments: [
      {
        id: "c_dl_1",
        userName: "Gautam V",
        text: "Just snapped one! Amazing deal for tea time. ☕",
        timestamp: "30m ago",
        likes: 8,
      },
    ],
  },
];

export const BENGALURU_STORIES: SocialStory[] = [
  {
    id: "story_jp_bakery",
    shopId: "s_jp_bakery",
    shopName: "Ravi's Bakery",
    shopAvatar: "/assets/ravis-bakery-logo.png",
    verified: true,
    thumbnailUrl: "/assets/ravis-bakery-logo.png",
    hasVideo: false,
    category: "bakery",
    stories: [
      {
        id: "st_jp_b1",
        mediaUrl: "/assets/ravis-sourdough-hero.jpg",
        caption: "Fresh sourdough batch straight out of woodfire oven at JP Nagar! 🥖",
        timestamp: "1h ago",
        durationSeconds: 5,
      },
    ],
  },
  {
    id: "story_jp_fresh",
    shopId: "s_jp_produce",
    shopName: "Namma Fresh",
    shopAvatar: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80",
    verified: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80",
    hasVideo: true,
    category: "fresh",
    stories: [
      {
        id: "st_jp_f1",
        mediaUrl: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80",
        caption: "Farm sweet Alphonso mango crate opening at JP Nagar 2nd Phase! 🥭",
        timestamp: "3h ago",
        durationSeconds: 6,
        isVideo: true,
      },
    ],
  },
  {
    id: "story_jp_dining",
    shopId: "s_jp_dining",
    shopName: "City Bites",
    shopAvatar: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80",
    verified: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80",
    hasVideo: true,
    category: "food",
    stories: [
      {
        id: "st_jp_d1",
        mediaUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
        caption: "Morning tiffin breakfast hot thatte idlis ready in JP Nagar! ☕",
        timestamp: "4h ago",
        durationSeconds: 5,
        isVideo: true,
      },
    ],
  },
  {
    id: "story_jp_apparel",
    shopId: "s_jp_apparel",
    shopName: "StyleHub",
    shopAvatar: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80",
    verified: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80",
    hasVideo: false,
    category: "fashion",
    stories: [
      {
        id: "st_jp_a1",
        mediaUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
        caption: "New handloom cotton shirts and breezy kurtis arrived today! 👗",
        timestamp: "5h ago",
        durationSeconds: 5,
      },
    ],
  },
  {
    id: "story_jp_mill",
    shopId: "s_jp_mill",
    shopName: "Amman Mill",
    shopAvatar: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
    verified: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
    hasVideo: false,
    category: "grocery",
    stories: [
      {
        id: "st_jp_m1",
        mediaUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
        caption: "Traditional stone milled ragi and freshly churned batter! 🥣",
        timestamp: "6h ago",
        durationSeconds: 5,
      },
    ],
  },
];

export const BENGALURU_LOCAL_GROUPS: LocalGroup[] = [
  {
    id: "grp_blr_1",
    name: "Bengaluru Foodies Club",
    membersCount: "18.4K members",
    avatar: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&q=80",
    category: "Food & Dining",
    description: "Discover hidden breakfast joints, filter coffee spots, thatte idli, and authentic eateries across Bengaluru.",
    isJoined: true,
  },
  {
    id: "grp_blr_2",
    name: "JP Nagar Residents & Shoppers",
    membersCount: "9.2K members",
    avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=200&q=80",
    category: "Community",
    description: "Hyperlocal network of residents, local sellers, bakes, and neighborhood events in JP Nagar.",
    isJoined: true,
  },
  {
    id: "grp_blr_3",
    name: "Sustainable Bengaluru & Gardeners",
    membersCount: "5.6K members",
    avatar: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=200&q=80",
    category: "Lifestyle",
    description: "Terrace farming, organic native seeds, recycling, and sustainable living in Bengaluru.",
    isJoined: false,
  },
];

export const BENGALURU_LOCAL_EVENTS: LocalEvent[] = [
  {
    id: "evt_blr_1",
    title: "JP Nagar Weekend Organic & Artisan Mela",
    date: "Sun, 10 Nov",
    time: "9 AM – 7 PM",
    location: "100 Feet Rd, JP Nagar, BLR",
    imageUrl: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=600&q=80",
    interestedCount: 342,
    isInterested: false,
  },
  {
    id: "evt_blr_2",
    title: "Bengaluru Artisan Baker & Coffee Pop-up",
    date: "Sat, 16 Nov",
    time: "4 PM – 9 PM",
    location: "24th Main, JP Nagar 2nd Phase, BLR",
    imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80",
    interestedCount: 215,
    isInterested: false,
  },
];

export const BENGALURU_LIVE_MARKET: LiveMarketSession = {
  id: "live_blr_1",
  sellerId: "s_jp_produce",
  sellerName: "Kumar Stores (JP Nagar)",
  sellerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
  title: "Fresh Mangoes & Organic Coconut Live Auction 🥭🥥",
  thumbnailUrl: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80",
  viewerCount: 520,
  isLive: true,
  category: "Produce",
  taggedProducts: [
    {
      id: "prod_blr_mango_live",
      name: "Farm Mango Box (3kg)",
      price: 650,
      stock: 12,
      imageUrl: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80",
      unit: "box",
      storeId: "s_jp_produce",
      storeName: "Kumar Stores (JP Nagar)",
    },
  ],
};

// ─── Location-Aware Resolver Functions ───

export function isBengaluruLocation(
  loc?: { area?: string; city?: string; label?: string; lat?: number; lng?: number } | null,
): boolean {
  if (!loc) return false;
  const lat = loc.lat ?? 0;
  const lng = loc.lng ?? 0;
  const area = (loc.area || "").toLowerCase();
  const city = (loc.city || "").toLowerCase();
  const label = (loc.label || "").toLowerCase();

  return (
    (lat > 12.6 && lat < 13.4 && lng > 77.2 && lng < 77.9) ||
    area.includes("sfhs") ||
    label.includes("sfhs") ||
    area.includes("jp nagar") ||
    area.includes("jayanagar") ||
    area.includes("bengaluru") ||
    area.includes("bangalore") ||
    city.includes("bengaluru") ||
    city.includes("bangalore") ||
    label.includes("jp nagar") ||
    label.includes("bengaluru") ||
    label.includes("bangalore")
  );
}

export function getSocialPostsForLocation(
  loc?: { area?: string; city?: string; label?: string; lat?: number; lng?: number } | null,
): SocialPost[] {
  if (isBengaluruLocation(loc)) {
    return BENGALURU_POSTS;
  }
  return INITIAL_POSTS;
}

export function getSocialStoriesForLocation(
  loc?: { area?: string; city?: string; label?: string; lat?: number; lng?: number } | null,
): SocialStory[] {
  if (isBengaluruLocation(loc)) {
    return BENGALURU_STORIES;
  }
  return INITIAL_STORIES;
}

export function getLocalGroupsForLocation(
  loc?: { area?: string; city?: string; label?: string; lat?: number; lng?: number } | null,
): LocalGroup[] {
  const isBLR = isBengaluruLocation(loc);
  const currentArea = loc?.area || loc?.label?.split(",")[0] || (isBLR ? "SFHS Layout" : "RS Puram");
  const currentCity = isBLR ? "Bengaluru" : (loc?.city?.split(",")[0] || "Coimbatore");

  if (isBLR) {
    return [
      {
        id: "grp_blr_1",
        name: `${currentArea} Foodies`,
        membersCount: "12.4K members",
        avatar: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80",
        category: "Food & Dining",
        description: `Food lovers, street food trails, bakery reviews, and culinary treasures in ${currentArea} & ${currentCity}.`,
        isJoined: true,
      },
      {
        id: "grp_blr_2",
        name: `Local Entrepreneurs - ${currentCity}`,
        membersCount: "6.8K members",
        avatar: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=200&q=80",
        category: "Business",
        description: `Network of local founders, artisans, shop owners, and creators in ${currentCity}.`,
        isJoined: false,
      },
      {
        id: "grp_blr_3",
        name: `Sustainable ${currentArea}`,
        membersCount: "3.1K members",
        avatar: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=200&q=80",
        category: "Lifestyle",
        description: `Zero-waste living, organic farming, terrace gardening in ${currentArea}.`,
        isJoined: false,
      },
    ];
  }
  return INITIAL_LOCAL_GROUPS;
}

export function getLocalEventsForLocation(
  loc?: { area?: string; city?: string; label?: string; lat?: number; lng?: number } | null,
): LocalEvent[] {
  const isBLR = isBengaluruLocation(loc);
  const currentArea = loc?.area || loc?.label?.split(",")[0] || (isBLR ? "SFHS Layout" : "RS Puram");
  const currentCity = isBLR ? "Bengaluru" : (loc?.city?.split(",")[0] || "Coimbatore");

  if (isBLR) {
    return [
      {
        id: "evt_blr_1",
        title: `${currentArea} Local Market Fest`,
        date: "Sun, 10 Nov",
        time: "10 AM – 8 PM",
        location: `${currentArea}, ${currentCity}`,
        imageUrl: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=600&q=80",
        interestedCount: 342,
        isInterested: false,
      },
      {
        id: "evt_blr_2",
        title: `${currentArea} Artisan Baker & Coffee Pop-up`,
        date: "Sat, 16 Nov",
        time: "4 PM – 9 PM",
        location: `${currentArea}, ${currentCity}`,
        imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80",
        interestedCount: 215,
        isInterested: false,
      },
    ];
  }

  return [
    {
      id: "evt_1",
      title: `${currentArea} Local Market Fest`,
      date: "Sun, 10 Nov",
      time: "10 AM – 8 PM",
      location: `${currentArea}, ${currentCity}`,
      imageUrl: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=600&q=80",
      interestedCount: 284,
      isInterested: false,
    },
    {
      id: "evt_2",
      title: "Artisanal Baker & Coffee Pop-up",
      date: "Sat, 16 Nov",
      time: "4 PM – 9 PM",
      location: `Race Course, ${currentCity}`,
      imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80",
      interestedCount: 167,
      isInterested: false,
    },
  ];
}

export function getLiveMarketForLocation(
  loc?: { area?: string; city?: string; label?: string; lat?: number; lng?: number } | null,
): LiveMarketSession {
  if (isBengaluruLocation(loc)) {
    return BENGALURU_LIVE_MARKET;
  }
  return INITIAL_LIVE_MARKET;
}
