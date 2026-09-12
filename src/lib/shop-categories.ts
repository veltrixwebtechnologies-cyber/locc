/**
 * LocalShore Centralized Shop Category Configuration
 *
 * LocalShore is a HYPERLOCAL MARKETPLACE focused on INDIVIDUAL LOCAL SHOPS.
 * Primary organization is around TYPES OF LOCAL BUSINESSES / SHOPS.
 *
 * Flow: USER → SHOP CATEGORY → NEARBY INDIVIDUAL SHOPS → SHOP PRODUCTS → ORDER
 */

import {
  Grid,
  Star,
  ShoppingBag,
  Store,
  Cake,
  Candy,
  Utensils,
  Coffee,
  Pill,
  Apple,
  Drumstick,
  Shirt,
  Sparkles,
  Footprints,
  Gem,
  Tv,
  Smartphone,
  BookOpen,
  Heart,
  CookingPot,
  Armchair,
  Hammer,
  Dumbbell,
  Baby,
  Gift,
  Flower2,
  Dog,
  Flame,
  Bike,
  Wrench,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_PHOTOS: Record<string, string> = {
  all: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=160&q=80",
  favorites: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=160&q=80",
  grocery: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=160&q=80",
  supermarkets: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=160&q=80",
  bakery: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=160&q=80",
  sweet_shops: "https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=160&q=80",
  restaurants: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=160&q=80",
  cafes: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=160&q=80",
  pharmacy: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=160&q=80",
  fruits_veg: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=160&q=80",
  meat_fish: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=160&q=80",
  fashion: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=160&q=80",
  boutiques: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=160&q=80",
  footwear: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=160&q=80",
  jewellery: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=160&q=80",
  electronics: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=160&q=80",
  mobile: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=160&q=80",
  home_kitchen: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=160&q=80",
  furniture: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=160&q=80",
  beauty: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=160&q=80",
  books_stationery: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=160&q=80",
  sports: "https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&w=160&q=80",
  toys: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=160&q=80",
};

export interface ShopCategoryConfig {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  icon: LucideIcon;
  description: string;
  parentCategory?: string;
  displayOrder: number;
  active: boolean;
  keywords: string[];
  desktopPriority: boolean;
  mobilePriority: boolean;
  heading: string;
  subheading: string;
}

export const ALL_SHOP_CATEGORIES: ShopCategoryConfig[] = [
  {
    id: "all",
    name: "All Shops",
    slug: "all-shops",
    iconName: "Grid",
    icon: Grid,
    description:
      "Explore all verified local businesses, specialty stores, and markets near your location.",
    displayOrder: 1,
    active: true,
    keywords: ["all", "shops", "stores", "local", "everything", "bazaar", "market"],
    desktopPriority: true,
    mobilePriority: true,
    heading: "Shops Around You",
    subheading: "Discover verified local businesses and neighborhood markets",
  },
  {
    id: "favorites",
    name: "⭐ Local Favorites",
    slug: "local-favorites",
    iconName: "Star",
    icon: Star,
    description:
      "Curated local shops with highest customer ratings, repeat buyers, and top community trust.",
    displayOrder: 2,
    active: true,
    keywords: ["favorite", "favorites", "popular", "top rated", "curated", "best", "trusted"],
    desktopPriority: false,
    mobilePriority: false,
    heading: "Local Favorites Near You",
    subheading: "Highly rated local stores trusted and loved by your community",
  },
  {
    id: "grocery",
    name: "Kirana & Grocery",
    slug: "kirana-grocery",
    iconName: "ShoppingBag",
    icon: ShoppingBag,
    description:
      "Daily kitchen ration, staples, cold-pressed oils, fresh batter, rice & neighborhood provisions.",
    displayOrder: 3,
    active: true,
    keywords: [
      "kirana",
      "grocery",
      "groceries",
      "ration",
      "provisions",
      "flour",
      "rice",
      "pulses",
      "oil",
      "maavu",
      "batter",
    ],
    desktopPriority: true,
    mobilePriority: true,
    heading: "Groceries Near You",
    subheading: "Fresh provisions & daily kitchen essentials from neighborhood Kirana stores",
  },
  {
    id: "supermarkets",
    name: "Supermarkets",
    slug: "supermarkets",
    iconName: "Store",
    icon: Store,
    description:
      "Multi-departmental supermarkets for complete monthly family ration & household goods.",
    displayOrder: 4,
    active: true,
    keywords: ["supermarket", "supermarkets", "mart", "departmental", "hypermarket", "bulk"],
    desktopPriority: false,
    mobilePriority: false,
    heading: "Supermarkets Near You",
    subheading: "Full range supermarkets for family provisions and household supplies",
  },
  {
    id: "bakery",
    name: "Bakeries",
    slug: "bakeries",
    iconName: "Cake",
    icon: Cake,
    description:
      "Fresh bread, hot chicken/veg puffs, birthday cakes, butter biscuits, tea rusks & pastries.",
    displayOrder: 5,
    active: true,
    keywords: [
      "bakery",
      "bakeries",
      "cake",
      "cakes",
      "bread",
      "puffs",
      "baked",
      "pastry",
      "rusk",
      "cookies",
      "bakes",
    ],
    desktopPriority: true,
    mobilePriority: true,
    heading: "Best Bakeries Near You",
    subheading: "Fresh bakes, hot puffs and custom cakes from local bakery shops",
  },
  {
    id: "sweet_shops",
    name: "Sweet Shops",
    slug: "sweet-shops",
    iconName: "Candy",
    icon: Candy,
    description:
      "Traditional South Indian sweets, melt-in-mouth mysurpa, halwa, savouries & festive mithai.",
    displayOrder: 6,
    active: true,
    keywords: [
      "sweet",
      "sweets",
      "mithai",
      "savouries",
      "laddu",
      "mysurpa",
      "halwa",
      "karasev",
      "snacks",
    ],
    desktopPriority: false,
    mobilePriority: false,
    heading: "Sweet Shops Near You",
    subheading: "Authentic traditional sweets & fresh savouries from local sweet stalls",
  },
  {
    id: "restaurants",
    name: "Restaurants",
    slug: "restaurants",
    iconName: "Utensils",
    icon: Utensils,
    description:
      "Authentic South Indian non-veg meals, Chettinad biryani, tiffin & local dining spots.",
    displayOrder: 7,
    active: true,
    keywords: [
      "restaurant",
      "restaurants",
      "food",
      "hotel",
      "meals",
      "biryani",
      "tiffin",
      "dining",
      "eatery",
    ],
    desktopPriority: true,
    mobilePriority: true,
    heading: "Restaurants Near You",
    subheading: "Delicious local tiffin, meals and dining spots around your location",
  },
  {
    id: "cafes",
    name: "Cafés & Tea Shops",
    slug: "cafes-tea-shops",
    iconName: "Coffee",
    icon: Coffee,
    description: "Filter coffee, hot tea, fresh fruit juices, coolers & quick evening snacks.",
    displayOrder: 8,
    active: true,
    keywords: [
      "cafe",
      "cafes",
      "tea",
      "coffee",
      "juice",
      "beverage",
      "snacks",
      "filter coffee",
      "chai",
    ],
    desktopPriority: false,
    mobilePriority: false,
    heading: "Cafés & Tea Shops Near You",
    subheading: "Fresh filter coffee, hot tea and refreshing snacks nearby",
  },
  {
    id: "pharmacy",
    name: "Pharmacies & Medicals",
    slug: "pharmacies",
    iconName: "Pill",
    icon: Pill,
    description:
      "24/7 chemist shops, prescribed medicines, healthcare products, OTC care & surgicals.",
    displayOrder: 9,
    active: true,
    keywords: [
      "pharmacy",
      "pharmacies",
      "medical",
      "medicals",
      "chemist",
      "medicine",
      "health",
      "wellness",
      "otc",
      "first aid",
    ],
    desktopPriority: true,
    mobilePriority: true,
    heading: "Medical Shops Near You",
    subheading: "Trusted chemists, medicines and wellness care from local pharmacies",
  },
  {
    id: "fruits_veg",
    name: "Fruits & Vegetables",
    slug: "fruits-vegetables",
    iconName: "Apple",
    icon: Apple,
    description:
      "Palamuthir Nilayam, farm-fresh organic fruits, green leafy veggies, tender coconut & daily produce.",
    displayOrder: 10,
    active: true,
    keywords: [
      "palamuthir",
      "fruits",
      "vegetables",
      "veggies",
      "organic",
      "greens",
      "coconut",
      "produce",
      "farm",
    ],
    desktopPriority: false,
    mobilePriority: false,
    heading: "Fruits & Vegetable Markets Near You",
    subheading: "Farm fresh fruits, organic vegetables and daily greens from local stalls",
  },
  {
    id: "meat_fish",
    name: "Meat & Fish",
    slug: "meat-fish",
    iconName: "Drumstick",
    icon: Drumstick,
    description:
      "Tender mutton, country chicken (nattu kozhi), fresh sea fish, prawns, crab & farm eggs.",
    displayOrder: 11,
    active: true,
    keywords: [
      "meat",
      "fish",
      "chicken",
      "mutton",
      "seafood",
      "eggs",
      "poultry",
      "vanjaram",
      "prawns",
      "nattu kozhi",
    ],
    desktopPriority: false,
    mobilePriority: false,
    heading: "Meat & Seafood Outlets Near You",
    subheading: "Fresh mutton, country chicken and daily sea fish from local butchery stalls",
  },
  {
    id: "fashion",
    name: "Fashion & Clothing",
    slug: "fashion-clothing",
    iconName: "Shirt",
    icon: Shirt,
    description:
      "Local menswear, cotton dhotis, readymade shirts, women ethnic wear & kids apparel.",
    displayOrder: 12,
    active: true,
    keywords: [
      "fashion",
      "clothing",
      "apparel",
      "shirts",
      "dhotis",
      "readymade",
      "dress",
      "garments",
      "menswear",
    ],
    desktopPriority: true,
    mobilePriority: true,
    heading: "Fashion Stores Near You",
    subheading: "Local menswear, readymade apparel and family clothing shops",
  },
  {
    id: "boutiques",
    name: "Boutiques",
    slug: "boutiques",
    iconName: "Sparkles",
    icon: Sparkles,
    description:
      "Designer boutiques, Kanchipuram silk sarees, custom kurti stitching & Aari embroidery.",
    displayOrder: 13,
    active: true,
    keywords: [
      "boutique",
      "boutiques",
      "designer",
      "silk saree",
      "saree",
      "kurti",
      "embroidery",
      "aari",
      "bridal",
      "tailoring",
    ],
    desktopPriority: false,
    mobilePriority: false,
    heading: "Designer Boutiques Near You",
    subheading: "Handloom silk sarees, custom tailoring and designer bridal studios",
  },
  {
    id: "footwear",
    name: "Footwear",
    slug: "footwear",
    iconName: "Footprints",
    icon: Footprints,
    description:
      "Daily slippers, formal leather shoes, ethnic sandals, sports shoes & school footwear.",
    displayOrder: 14,
    active: true,
    keywords: ["footwear", "shoes", "slippers", "sandals", "chappal", "boots", "leather"],
    desktopPriority: false,
    mobilePriority: false,
    heading: "Footwear & Shoe Stores Near You",
    subheading: "Quality footwear, sandals and shoe shops around your location",
  },
  {
    id: "jewellery",
    name: "Jewellery & Watches",
    slug: "jewellery-watches",
    iconName: "Gem",
    icon: Gem,
    description:
      "Gold-plated kammal, chains, silver anklets, bangles, watches & gift accessory sets.",
    displayOrder: 15,
    active: true,
    keywords: [
      "jewellery",
      "watches",
      "gold",
      "silver",
      "kammal",
      "bangles",
      "chain",
      "anklets",
      "earrings",
      "gifts",
    ],
    desktopPriority: false,
    mobilePriority: false,
    heading: "Jewellery & Watch Stores Near You",
    subheading: "Traditional jewellery, gold-plated accessories and watch stores nearby",
  },
  {
    id: "electronics",
    name: "Electronics",
    slug: "electronics",
    iconName: "Tv",
    icon: Tv,
    description:
      "Smart TVs, soundbars, home appliances, refrigerators & consumer electronics showrooms.",
    displayOrder: 16,
    active: true,
    keywords: [
      "electronics",
      "tv",
      "appliances",
      "fridge",
      "washing machine",
      "audio",
      "showrooms",
      "gadgets",
    ],
    desktopPriority: true,
    mobilePriority: true,
    heading: "Electronics Shops Near You",
    subheading: "Branded home electronics, televisions and appliance showrooms",
  },
  {
    id: "mobile",
    name: "Mobile & Accessories",
    slug: "mobile-accessories",
    iconName: "Smartphone",
    icon: Smartphone,
    description:
      "Smartphones, chargers, bluetooth earphones, back covers, glass guards & mobile repair.",
    displayOrder: 17,
    active: true,
    keywords: [
      "mobile",
      "smartphone",
      "cellphone",
      "charger",
      "earphones",
      "accessories",
      "screen guard",
      "case",
    ],
    desktopPriority: false,
    mobilePriority: false,
    heading: "Mobile & Accessory Stores Near You",
    subheading: "Smartphones, mobile repair and original accessories from local mobile hubs",
  },
  {
    id: "books_stationery",
    name: "Books & Stationery",
    slug: "books-stationery",
    iconName: "BookOpen",
    icon: BookOpen,
    description:
      "Textbooks, school notebooks, pens, office supplies, greeting cards & art materials.",
    displayOrder: 18,
    active: true,
    keywords: [
      "books",
      "stationery",
      "notebooks",
      "pens",
      "school",
      "office",
      "textbooks",
      "paper",
      "book stall",
    ],
    desktopPriority: true,
    mobilePriority: false,
    heading: "Book & Stationery Shops Near You",
    subheading: "School notebooks, office supplies, books and stationery stores",
  },
  {
    id: "beauty",
    name: "Beauty & Care",
    slug: "beauty-care",
    iconName: "Heart",
    icon: Heart,
    description:
      "Cosmetics, skincare, herbal hair oils, soaps, perfumes & personal grooming products.",
    displayOrder: 19,
    active: true,
    keywords: [
      "beauty",
      "care",
      "cosmetics",
      "skincare",
      "hair oil",
      "perfume",
      "grooming",
      "makeup",
    ],
    desktopPriority: true,
    mobilePriority: false,
    heading: "Beauty & Care Near You",
    subheading: "Cosmetics, personal care and grooming products from nearby specialty stores",
  },
  {
    id: "home_kitchen",
    name: "Home & Kitchen",
    slug: "home-kitchen",
    iconName: "CookingPot",
    icon: CookingPot,
    description:
      "Stainless steel vessels, mixer grinders, pressure cookers, non-stick cookware & gas stoves.",
    displayOrder: 20,
    active: true,
    keywords: [
      "kitchen",
      "home",
      "cookware",
      "utensils",
      "cooker",
      "mixer",
      "grinder",
      "stoves",
      "vessels",
    ],
    desktopPriority: false,
    mobilePriority: false,
    heading: "Home & Kitchen Stores Near You",
    subheading: "Stainless steel vessels, pressure cookers and kitchen appliances",
  },
  {
    id: "furniture",
    name: "Furniture & Home Decor",
    slug: "furniture-home-decor",
    iconName: "Armchair",
    icon: Armchair,
    description:
      "Interior decor studios, brass Agal lamps, designer curtains, wallpapers & home furnishings.",
    displayOrder: 21,
    active: true,
    keywords: [
      "furniture",
      "decor",
      "interior",
      "curtains",
      "sofa",
      "brass",
      "lamps",
      "wallpapers",
      "mats",
    ],
    desktopPriority: false,
    mobilePriority: false,
    heading: "Furniture & Home Decor Near You",
    subheading: "Interior furnishings, curtains, brass lamps and home decor studios",
  },
  {
    id: "hardware",
    name: "Home & Hardware",
    slug: "hardware-electrical",
    iconName: "Hammer",
    icon: Hammer,
    description:
      "Electrical fittings, LED bulbs, switches, plumbing, tools, paint & hardware supplies.",
    displayOrder: 22,
    active: true,
    keywords: ["hardware", "electrical", "plumbing", "tools", "paint", "bulbs", "wires", "pipes"],
    desktopPriority: true,
    mobilePriority: false,
    heading: "Home & Hardware Shops Near You",
    subheading: "Electrical fittings, plumbing supplies and hardware tools",
  },
  {
    id: "sports",
    name: "Sports & Fitness",
    slug: "sports-fitness",
    iconName: "Dumbbell",
    icon: Dumbbell,
    description: "Cricket bats, badminton rackets, fitness gear, gym wear & sports accessories.",
    displayOrder: 23,
    active: true,
    keywords: ["sports", "fitness", "cricket", "badminton", "racket", "gym", "dumbbells", "ball"],
    desktopPriority: false,
    mobilePriority: false,
    heading: "Sports & Fitness Shops Near You",
    subheading: "Sports goods, fitness equipment and athletic gear from local sports shops",
  },
  {
    id: "toys",
    name: "Toys & Baby",
    slug: "toys-baby",
    iconName: "Baby",
    icon: Baby,
    description: "Educational toys, baby products, diapers, board games & action figures.",
    displayOrder: 24,
    active: true,
    keywords: ["toys", "baby", "kids", "diapers", "games", "tricycle", "dolls"],
    desktopPriority: false,
    mobilePriority: false,
    heading: "Toys & Baby Stores Near You",
    subheading: "Baby care essentials, toys and educational games",
  },
  {
    id: "gifts",
    name: "Gift Shops",
    slug: "gift-shops",
    iconName: "Gift",
    icon: Gift,
    description: "Customized gifts, photo frames, greeting cards, fancy items & party novelties.",
    displayOrder: 25,
    active: true,
    keywords: ["gifts", "gift", "greeting cards", "frames", "fancy", "novelties", "presents"],
    desktopPriority: false,
    mobilePriority: false,
    heading: "Gift Shops Near You",
    subheading: "Unique gift items, fancy novelties and greeting card shops",
  },
  {
    id: "flowers",
    name: "Flower Shops",
    slug: "flower-shops",
    iconName: "Flower2",
    icon: Flower2,
    description:
      "Fresh jasmine garlands (mullai/malli), puja flowers, bouquets & floral arrangements.",
    displayOrder: 26,
    active: true,
    keywords: ["flowers", "florist", "malli", "jasmine", "garland", "puja flowers", "bouquets"],
    desktopPriority: false,
    mobilePriority: false,
    heading: "Flower Shops & Florists Near You",
    subheading: "Fresh garlands, puja flowers and bouquets from local florists",
  },
  {
    id: "pet_shops",
    name: "Pet Shops",
    slug: "pet-shops",
    iconName: "Dog",
    icon: Dog,
    description: "Dog food, cat treats, fish aquariums, bird seeds & pet care accessories.",
    displayOrder: 27,
    active: true,
    keywords: ["pet", "pet_shops", "dog", "cat", "fish", "aquarium", "pet food", "birds"],
    desktopPriority: false,
    mobilePriority: false,
    heading: "Pet Shops & Care Near You",
    subheading: "Pet food, aquarium supplies and pet care items",
  },
  {
    id: "pooja",
    name: "Pooja Stores",
    slug: "pooja-stores",
    iconName: "Flame",
    icon: Flame,
    description:
      "Camphor, incense sticks (agarbatti), brass lamps, pooja oil, kumkum & divine items.",
    displayOrder: 28,
    active: true,
    keywords: ["pooja", "puja", "agarbatti", "camphor", "incense", "sambrani", "kumkum", "divine"],
    desktopPriority: false,
    mobilePriority: false,
    heading: "Pooja & Divine Stores Near You",
    subheading: "Incense sticks, camphor, pooja oil and divine items",
  },
  {
    id: "auto",
    name: "Auto & Bike",
    slug: "auto-bike",
    iconName: "Bike",
    icon: Bike,
    description: "Helmets, bike spare parts, motor oils, car seat covers & auto accessories.",
    displayOrder: 29,
    active: true,
    keywords: ["auto", "bike", "helmet", "spares", "motor oil", "car", "accessories"],
    desktopPriority: false,
    mobilePriority: false,
    heading: "Auto & Bike Accessories Near You",
    subheading: "Helmets, spare parts and bike accessory shops",
  },
  {
    id: "repair",
    name: "Repair Shops",
    slug: "repair-shops",
    iconName: "Wrench",
    icon: Wrench,
    description: "Mobile phone repair, gas stove servicing, mixer repair & watch battery service.",
    displayOrder: 30,
    active: true,
    keywords: ["repair", "service", "mobile repair", "stove service", "watch repair", "mechanic"],
    desktopPriority: false,
    mobilePriority: false,
    heading: "Local Repair Shops Near You",
    subheading: "Mobile repair, appliance servicing and local repair experts",
  },
  {
    id: "local_services",
    name: "Local Services",
    slug: "local-services",
    iconName: "Briefcase",
    icon: Briefcase,
    description:
      "Xerox & printing, DTP, key duplication, tailoring & neighborhood service centers.",
    displayOrder: 31,
    active: true,
    keywords: [
      "services",
      "local_services",
      "xerox",
      "printing",
      "dtp",
      "key duplication",
      "laundry",
      "tailor",
    ],
    desktopPriority: false,
    mobilePriority: false,
    heading: "Local Services Near You",
    subheading: "Neighborhood printing, xerox, tailoring and local services",
  },
];

/**
 * Desktop Priority Categories (11 exact header secondary navigation items)
 */
export const DESKTOP_PRIORITY_CATEGORIES: ShopCategoryConfig[] = [
  ALL_SHOP_CATEGORIES.find((c) => c.id === "all")!,
  ALL_SHOP_CATEGORIES.find((c) => c.id === "fruits_veg")!,
  ALL_SHOP_CATEGORIES.find((c) => c.id === "meat_fish")!,
  ALL_SHOP_CATEGORIES.find((c) => c.id === "bakery")!,
  ALL_SHOP_CATEGORIES.find((c) => c.id === "fashion")!,
  ALL_SHOP_CATEGORIES.find((c) => c.id === "beauty")!,
  ALL_SHOP_CATEGORIES.find((c) => c.id === "electronics")!,
  ALL_SHOP_CATEGORIES.find((c) => c.id === "home_kitchen")!,
  ALL_SHOP_CATEGORIES.find((c) => c.id === "pharmacy")!,
  ALL_SHOP_CATEGORIES.find((c) => c.id === "toys")!,
  ALL_SHOP_CATEGORIES.find((c) => c.id === "favorites")!,
];

/**
 * Mobile Priority Categories (Exact 11 header secondary navigation items)
 */
export const MOBILE_PRIORITY_CATEGORIES: ShopCategoryConfig[] = [
  ALL_SHOP_CATEGORIES.find((c) => c.id === "all")!,
  ALL_SHOP_CATEGORIES.find((c) => c.id === "fruits_veg")!,
  ALL_SHOP_CATEGORIES.find((c) => c.id === "meat_fish")!,
  ALL_SHOP_CATEGORIES.find((c) => c.id === "bakery")!,
  ALL_SHOP_CATEGORIES.find((c) => c.id === "fashion")!,
  ALL_SHOP_CATEGORIES.find((c) => c.id === "beauty")!,
  ALL_SHOP_CATEGORIES.find((c) => c.id === "electronics")!,
  ALL_SHOP_CATEGORIES.find((c) => c.id === "home_kitchen")!,
  ALL_SHOP_CATEGORIES.find((c) => c.id === "pharmacy")!,
  ALL_SHOP_CATEGORIES.find((c) => c.id === "toys")!,
  ALL_SHOP_CATEGORIES.find((c) => c.id === "favorites")!,
];

/**
 * Category lookup helper by ID or Slug
 */
export function getCategoryByIdOrSlug(idOrSlug?: string | null): ShopCategoryConfig {
  if (!idOrSlug || idOrSlug === "all" || idOrSlug === "all-shops") {
    return ALL_SHOP_CATEGORIES[0];
  }

  const normalized = idOrSlug.toLowerCase().trim();
  const found = ALL_SHOP_CATEGORIES.find(
    (c) => c.id.toLowerCase() === normalized || c.slug.toLowerCase() === normalized,
  );

  if (found) return found;

  // Fallback matching by keyword
  const keywordMatch = ALL_SHOP_CATEGORIES.find((c) =>
    c.keywords.some((k) => normalized.includes(k) || k.includes(normalized)),
  );

  return keywordMatch || ALL_SHOP_CATEGORIES[0];
}

import type { StoreCategory } from "@/lib/mock-data";

/**
 * Normalizes any category string into a valid StoreCategory
 */
export function toStoreCategory(value?: string | null): StoreCategory {
  if (!value) return "grocery";
  const catLower = value.toLowerCase().trim();

  // Direct match to any category id or slug
  const direct = ALL_SHOP_CATEGORIES.find(
    (c) => c.id.toLowerCase() === catLower || c.slug.toLowerCase() === catLower,
  );
  if (direct && direct.id !== "all" && direct.id !== "favorites") {
    return direct.id as StoreCategory;
  }

  // Specific keyword mapping rules
  if (catLower.includes("palamuthir") || catLower.includes("fruit") || catLower.includes("veggie"))
    return "fruits_veg";
  if (
    catLower.includes("flour") ||
    catLower.includes("mill") ||
    catLower.includes("maavu") ||
    catLower.includes("batter")
  )
    return "flour_mill";
  if (
    catLower.includes("meat") ||
    catLower.includes("fish") ||
    catLower.includes("chicken") ||
    catLower.includes("mutton")
  )
    return "meat_fish";
  if (
    catLower.includes("kammal") ||
    catLower.includes("chain") ||
    catLower.includes("jewel") ||
    catLower.includes("gold") ||
    catLower.includes("silver") ||
    catLower.includes("accessory")
  )
    return "jewellery";
  if (
    catLower.includes("boutique") ||
    catLower.includes("silk") ||
    catLower.includes("saree") ||
    catLower.includes("stitching")
  )
    return "boutiques";
  if (
    catLower.includes("showroom") ||
    catLower.includes("appliance") ||
    catLower.includes("electro") ||
    catLower.includes("tv")
  )
    return "electronics";
  if (
    catLower.includes("mobile") ||
    catLower.includes("phone") ||
    catLower.includes("smartphone")
  )
    return "mobile";
  if (catLower.includes("fast_fashion") || catLower.includes("zudio")) return "fast_fashion";
  if (catLower.includes("individual_fashion")) return "individual_fashion";
  if (
    catLower.includes("fashion") ||
    catLower.includes("cloth") ||
    catLower.includes("garment") ||
    catLower.includes("shirt") ||
    catLower.includes("wear") ||
    catLower.includes("dress") ||
    catLower.includes("readymade") ||
    catLower.includes("dhoti")
  )
    return "fashion";
  if (
    catLower.includes("shoe") ||
    catLower.includes("footwear") ||
    catLower.includes("slipper")
  )
    return "footwear";
  if (
    catLower.includes("kitchen") ||
    catLower.includes("vessel") ||
    catLower.includes("cooker") ||
    catLower.includes("mixer")
  )
    return "home_kitchen";
  if (
    catLower.includes("decor") ||
    catLower.includes("interior") ||
    catLower.includes("furniture") ||
    catLower.includes("curtain")
  )
    return "furniture";
  if (
    catLower.includes("pharm") ||
    catLower.includes("med") ||
    catLower.includes("health") ||
    catLower.includes("wellness") ||
    catLower.includes("care")
  )
    return "pharmacy";
  if (
    catLower.includes("station") ||
    catLower.includes("book") ||
    catLower.includes("office") ||
    catLower.includes("paper")
  )
    return "books_stationery";
  if (
    catLower.includes("bake") ||
    catLower.includes("cake") ||
    catLower.includes("bread") ||
    catLower.includes("pastry")
  )
    return "bakery";
  if (catLower.includes("sweet") || catLower.includes("mithai") || catLower.includes("halwa"))
    return "sweet_shops";
  if (
    catLower.includes("restaurant") ||
    catLower.includes("hotel") ||
    catLower.includes("biryani") ||
    catLower.includes("food") ||
    catLower.includes("tiffin") ||
    catLower.includes("dining") ||
    catLower.includes("meals")
  )
    return "restaurants";
  if (catLower.includes("cafe") || catLower.includes("coffee") || catLower.includes("tea"))
    return "cafes";
  if (
    catLower.includes("supermarket") ||
    catLower.includes("mart") ||
    catLower.includes("departmental")
  )
    return "supermarkets";
  if (catLower.includes("beauty") || catLower.includes("cosmetic")) return "beauty";
  if (
    catLower.includes("hardware") ||
    catLower.includes("tool") ||
    catLower.includes("electric")
  )
    return "hardware";
  if (
    catLower.includes("sport") ||
    catLower.includes("gym") ||
    catLower.includes("fitness")
  )
    return "sports";
  if (catLower.includes("toy") || catLower.includes("baby")) return "toys";
  if (catLower.includes("gift")) return "gifts";
  if (catLower.includes("flower") || catLower.includes("florist")) return "flowers";
  if (catLower.includes("pet")) return "pet_shops";
  if (
    catLower.includes("pooja") ||
    catLower.includes("puja") ||
    catLower.includes("incense") ||
    catLower.includes("agarbatti")
  )
    return "pooja";
  if (catLower.includes("auto") || catLower.includes("bike") || catLower.includes("helmet"))
    return "auto";
  if (catLower.includes("repair") || catLower.includes("service")) return "repair";

  // Fallback lookup by getCategoryByIdOrSlug
  const cat = getCategoryByIdOrSlug(catLower);
  return (cat && cat.id !== "all" ? cat.id : "grocery") as StoreCategory;
}

/**
 * Robust Shop Category Matching Engine
 * Checks if a store's primary or legacy category matches the target selected category.
 */
export function isStoreInCategory(
  storeCategory: string,
  targetCategoryIdOrSlug: string,
  storeRating: number = 4.5,
): boolean {
  if (
    !targetCategoryIdOrSlug ||
    targetCategoryIdOrSlug === "all" ||
    targetCategoryIdOrSlug === "all-shops"
  ) {
    return true;
  }

  const targetCategory = getCategoryByIdOrSlug(targetCategoryIdOrSlug);
  const targetId = targetCategory.id;

  // Special Non-Standard Category: Local Favorites
  if (targetId === "favorites") {
    return storeRating >= 4.7;
  }

  const storeCatLower = (storeCategory || "").toLowerCase().trim();

  // Direct ID or slug match
  if (storeCatLower === targetId || storeCatLower === targetCategory.slug) {
    return true;
  }

  // Check normalized category match
  const normCat = toStoreCategory(storeCatLower);
  if (normCat === targetId) {
    return true;
  }

  // Legacy mappings from existing mock-data / database categories
  switch (targetId) {
    case "grocery":
      return (
        storeCatLower === "grocery" ||
        storeCatLower === "kirana" ||
        storeCatLower === "flour_mill" ||
        storeCatLower.includes("flour") ||
        storeCatLower.includes("ration") ||
        storeCatLower.includes("provision")
      );
    case "supermarkets":
      return (
        storeCatLower === "supermarket" ||
        storeCatLower === "supermarkets" ||
        storeCatLower.includes("supermarket") ||
        storeCatLower.includes("mart")
      );
    case "bakery":
      return (
        storeCatLower === "bakery" ||
        storeCatLower.includes("bake") ||
        storeCatLower.includes("cake")
      );
    case "sweet_shops":
      return storeCatLower.includes("sweet") || storeCatLower.includes("mithai");
    case "restaurants":
      return (
        storeCatLower.includes("restaurant") ||
        storeCatLower.includes("hotel") ||
        storeCatLower.includes("meals") ||
        storeCatLower.includes("biryani") ||
        storeCatLower.includes("tiffin")
      );
    case "cafes":
      return (
        storeCatLower.includes("cafe") ||
        storeCatLower.includes("tea") ||
        storeCatLower.includes("coffee")
      );
    case "pharmacy":
      return (
        storeCatLower === "pharmacy" ||
        storeCatLower.includes("pharm") ||
        storeCatLower.includes("med")
      );
    case "fruits_veg":
      return (
        storeCatLower === "palamuthir" ||
        storeCatLower.includes("fruit") ||
        storeCatLower.includes("veggie")
      );
    case "meat_fish":
      return (
        storeCatLower === "meat_fish" ||
        storeCatLower.includes("meat") ||
        storeCatLower.includes("fish") ||
        storeCatLower.includes("chicken") ||
        storeCatLower.includes("mutton")
      );
    case "fashion":
      return (
        storeCatLower === "fashion" ||
        storeCatLower === "individual_fashion" ||
        storeCatLower === "fast_fashion" ||
        storeCatLower === "boutiques" ||
        storeCatLower.includes("fashion") ||
        storeCatLower.includes("cloth") ||
        storeCatLower.includes("garment") ||
        storeCatLower.includes("boutique") ||
        storeCatLower.includes("shirt")
      );
    case "boutiques":
      return (
        storeCatLower === "boutiques" ||
        storeCatLower.includes("boutique") ||
        storeCatLower.includes("silk")
      );
    case "footwear":
      return storeCatLower.includes("footwear") || storeCatLower.includes("shoe");
    case "jewellery":
      return (
        storeCatLower === "fashion_accessories" ||
        storeCatLower.includes("jewel") ||
        storeCatLower.includes("kammal") ||
        storeCatLower.includes("chain")
      );
    case "electronics":
      return (
        storeCatLower === "showrooms" ||
        storeCatLower === "electronics" ||
        storeCatLower.includes("electro") ||
        storeCatLower.includes("tv")
      );
    case "mobile":
      return storeCatLower.includes("mobile") || storeCatLower.includes("phone");
    case "books_stationery":
      return (
        storeCatLower === "stationery" ||
        storeCatLower.includes("stationer") ||
        storeCatLower.includes("book")
      );
    case "beauty":
      return (
        storeCatLower.includes("beauty") ||
        storeCatLower.includes("care") ||
        storeCatLower.includes("cosmetic")
      );
    case "home_kitchen":
      return (
        storeCatLower === "kitchen_appliances" ||
        storeCatLower.includes("kitchen") ||
        storeCatLower.includes("vessel")
      );
    case "furniture":
      return (
        storeCatLower === "home_decor" ||
        storeCatLower.includes("decor") ||
        storeCatLower.includes("furniture")
      );
    case "hardware":
      return storeCatLower.includes("hardware") || storeCatLower.includes("electric");
    case "sports":
      return storeCatLower.includes("sport") || storeCatLower.includes("gym");
    case "toys":
      return storeCatLower.includes("toy") || storeCatLower.includes("baby");
    case "gifts":
      return storeCatLower.includes("gift");
    case "flowers":
      return storeCatLower.includes("flower") || storeCatLower.includes("florist");
    case "pet_shops":
      return storeCatLower.includes("pet");
    case "pooja":
      return storeCatLower.includes("pooja") || storeCatLower.includes("puja");
    case "auto":
      return storeCatLower.includes("auto") || storeCatLower.includes("bike");
    case "repair":
      return storeCatLower.includes("repair") || storeCatLower.includes("service");
    case "local_services":
      return storeCatLower.includes("service") || storeCatLower.includes("xerox");
    default:
      return targetCategory.keywords.some((k) => storeCatLower.includes(k));
  }
}

