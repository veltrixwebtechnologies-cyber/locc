import { haversineDistanceKm, isValidCoordinate } from "./geo.ts";
import type { ImportedShopRow } from "./imported-shops.ts";

export interface BrandInfo {
  id: string;
  name: string;
  logo: string;
  logoSrc: string;
  className?: string;
  category: string;
}

export interface BrandStoreLocation {
  id: string;
  brandId: string;
  brandName: string;
  name: string;
  category: string;
  formattedAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  phone?: string;
  website?: string;
  coverImageUrl: string;
}

export const POPULAR_BRANDS: BrandInfo[] = [
  {
    id: "peter-england",
    name: "Peter England",
    logo: "PETER ENGLAND",
    logoSrc: "/assets/brand-peter-england.png",
    className: "text-[11px] font-extrabold tracking-tight",
    category: "Fashion & Apparel",
  },
  {
    id: "raymond",
    name: "Raymond",
    logo: "raymond",
    logoSrc: "/assets/brand-raymond.png",
    className: "font-serif text-xl italic text-[#e21d2f]",
    category: "Fashion & Apparel",
  },
  {
    id: "max",
    name: "max",
    logo: "max",
    logoSrc: "/assets/brand-max.png",
    className: "text-3xl font-black lowercase text-[#2452a4]",
    category: "Fashion & Apparel",
  },
  {
    id: "trends",
    name: "TRENDS",
    logo: "TRENDS",
    logoSrc: "/assets/brand-trends.png",
    className: "text-lg font-semibold tracking-tight text-[#58616b]",
    category: "Fashion & Apparel",
  },
  {
    id: "allen-solly",
    name: "Allen Solly",
    logo: "Allen Solly",
    logoSrc: "/assets/brand-allen-solly.png",
    className: "font-serif text-sm font-semibold text-[#18243a]",
    category: "Fashion & Apparel",
  },
  {
    id: "louis-philippe",
    name: "LOUIS PHILIPPE",
    logo: "LOUIS PHILIPPE",
    logoSrc: "/assets/brand-louis-philippe.png",
    className: "text-[9px] font-black tracking-[0.08em] text-[#18243a]",
    category: "Fashion & Apparel",
  },
  {
    id: "indian-terrain",
    name: "INDIAN TERRAIN",
    logo: "INDIAN\nTERRAIN",
    logoSrc: "/assets/brand-indian-terrain.png",
    className: "whitespace-pre-line text-xs font-serif font-bold leading-none text-[#3b465c]",
    category: "Fashion & Apparel",
  },
  {
    id: "jockey",
    name: "JOCKEY",
    logo: "JOCKEY",
    logoSrc: "/assets/brand-jockey.png",
    className: "text-lg font-black tracking-tight text-[#172033]",
    category: "Fashion & Apparel",
  },
  {
    id: "bata",
    name: "Bata",
    logo: "Bata",
    logoSrc: "/assets/brand-bata.png",
    className: "font-serif text-2xl italic text-[#df1d2d]",
    category: "Footwear",
  },
  {
    id: "woodland",
    name: "WOODLAND",
    logo: "WOODLAND",
    logoSrc: "/assets/brand-woodland.png",
    className: "text-xs font-black tracking-tight text-[#27804d]",
    category: "Footwear & Outdoor",
  },
  {
    id: "kalyan-jewellers",
    name: "KALYAN JEWELLERS",
    logo: "KALYAN\nJEWELLERS",
    logoSrc: "/assets/brand-kalyan.png",
    className: "whitespace-pre-line text-[10px] font-black leading-none text-[#d59b00]",
    category: "Jewellery & Luxury",
  },
  {
    id: "jos-alukkas",
    name: "JOS ALUKKAS",
    logo: "JOS ALUKKAS",
    logoSrc: "/assets/brand-jos-alukkas.png",
    className: "text-[10px] font-bold tracking-tight text-[#18243a]",
    category: "Jewellery & Luxury",
  },
  {
    id: "joyalukkas",
    name: "Joyalukkas",
    logo: "Joyalukkas",
    logoSrc: "/assets/brand-joyalukkas.png",
    className: "font-serif text-lg font-semibold text-[#d9252a]",
    category: "Jewellery & Luxury",
  },
];

export const BRAND_STORES_CATALOG: BrandStoreLocation[] = [
  // 1. Peter England
  {
    id: "a1000001-0001-4000-8000-000000000001",
    brandId: "peter-england",
    brandName: "Peter England",
    name: "Peter England - Cross Cut Road, Coimbatore",
    category: "Fashion & Apparel",
    formattedAddress: "No 451, Cross Cut Rd, Gandhipuram, Coimbatore, Tamil Nadu 641012",
    city: "Coimbatore",
    state: "Tamil Nadu",
    postalCode: "641012",
    country: "India",
    latitude: 11.018312,
    longitude: 76.964721,
    rating: 4.6,
    reviewCount: 320,
    phone: "+91 422 249 5511",
    website: "https://www.peterengland.com/",
    coverImageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=900&q=80",
  },
  {
    id: "a1000001-0001-4000-8000-000000000002",
    brandId: "peter-england",
    brandName: "Peter England",
    name: "Peter England - Commercial Street, Bangalore",
    category: "Fashion & Apparel",
    formattedAddress: "No 78, Commercial St, Tasker Town, Shivaji Nagar, Bengaluru, Karnataka 560001",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560001",
    country: "India",
    latitude: 12.981845,
    longitude: 77.608312,
    rating: 4.5,
    reviewCount: 512,
    phone: "+91 80 2558 4421",
    website: "https://www.peterengland.com/",
    coverImageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=900&q=80",
  },

  // 2. Raymond
  {
    id: "a1000002-0002-4000-8000-000000000001",
    brandId: "raymond",
    brandName: "Raymond",
    name: "The Raymond Shop - D.B Road, Coimbatore",
    category: "Fashion & Apparel",
    formattedAddress: "123, Diwan Bahadur Rd, R.S. Puram, Coimbatore, Tamil Nadu 641002",
    city: "Coimbatore",
    state: "Tamil Nadu",
    postalCode: "641002",
    country: "India",
    latitude: 11.008432,
    longitude: 76.950711,
    rating: 4.7,
    reviewCount: 680,
    phone: "+91 422 254 7890",
    website: "https://myraymond.com/",
    coverImageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=900&q=80",
  },
  {
    id: "a1000002-0002-4000-8000-000000000002",
    brandId: "raymond",
    brandName: "Raymond",
    name: "The Raymond Shop - MG Road, Bangalore",
    category: "Fashion & Apparel",
    formattedAddress: "24, MG Road, Shanthala Nagar, Ashok Nagar, Bengaluru, Karnataka 560001",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560001",
    country: "India",
    latitude: 12.975421,
    longitude: 77.607412,
    rating: 4.8,
    reviewCount: 940,
    phone: "+91 80 2558 7762",
    website: "https://myraymond.com/",
    coverImageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=900&q=80",
  },

  // 3. Max Fashion
  {
    id: "a1000003-0003-4000-8000-000000000001",
    brandId: "max",
    brandName: "max",
    name: "Max Fashion - Brookefields Mall, Coimbatore",
    category: "Fashion & Apparel",
    formattedAddress: "Brookefields Mall, Dr Krishnasamy Mudaliyar Rd, Coimbatore, Tamil Nadu 641001",
    city: "Coimbatore",
    state: "Tamil Nadu",
    postalCode: "641001",
    country: "India",
    latitude: 11.009712,
    longitude: 76.957211,
    rating: 4.5,
    reviewCount: 1450,
    phone: "+91 422 225 5566",
    website: "https://www.maxfashion.in/",
    coverImageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80",
  },
  {
    id: "a1000003-0003-4000-8000-000000000002",
    brandId: "max",
    brandName: "max",
    name: "Max Fashion - Commercial Street, Bangalore",
    category: "Fashion & Apparel",
    formattedAddress: "No 11, Commercial St, Tasker Town, Shivaji Nagar, Bengaluru, Karnataka 560001",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560001",
    country: "India",
    latitude: 12.982215,
    longitude: 77.609432,
    rating: 4.4,
    reviewCount: 1820,
    phone: "+91 80 4113 4455",
    website: "https://www.maxfashion.in/",
    coverImageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80",
  },

  // 4. Trends
  {
    id: "a1000004-0004-4000-8000-000000000001",
    brandId: "trends",
    brandName: "TRENDS",
    name: "Trends - Cross Cut Road, Coimbatore",
    category: "Fashion & Apparel",
    formattedAddress: "638, Cross Cut Rd, Ram Nagar, Gandhipuram, Coimbatore, Tamil Nadu 641012",
    city: "Coimbatore",
    state: "Tamil Nadu",
    postalCode: "641012",
    country: "India",
    latitude: 11.017512,
    longitude: 76.962534,
    rating: 4.4,
    reviewCount: 1120,
    phone: "+91 422 438 8800",
    website: "https://www.reliancetrends.com/",
    coverImageUrl: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&q=80",
  },
  {
    id: "afda0c51-2214-4bce-891c-2c12f383b1b9",
    brandId: "trends",
    brandName: "TRENDS",
    name: "Tip Top Trends - Coimbatore",
    category: "Fashion & Apparel",
    formattedAddress: "Tip Top Trends, Coimbatore, Tamil Nadu 641012",
    city: "Coimbatore",
    state: "Tamil Nadu",
    postalCode: "641012",
    country: "India",
    latitude: 11.0245359,
    longitude: 76.9955141,
    rating: 4.3,
    reviewCount: 180,
    coverImageUrl: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&q=80",
  },
  {
    id: "a1000004-0004-4000-8000-000000000002",
    brandId: "trends",
    brandName: "TRENDS",
    name: "Trends - 100 Feet Road, Indiranagar, Bangalore",
    category: "Fashion & Apparel",
    formattedAddress: "100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560038",
    country: "India",
    latitude: 12.971932,
    longitude: 77.641215,
    rating: 4.5,
    reviewCount: 1640,
    phone: "+91 80 4152 7700",
    website: "https://www.reliancetrends.com/",
    coverImageUrl: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&q=80",
  },

  // 5. Allen Solly
  {
    id: "a1000005-0005-4000-8000-000000000001",
    brandId: "allen-solly",
    brandName: "Allen Solly",
    name: "Allen Solly - D.B. Road, Coimbatore",
    category: "Fashion & Apparel",
    formattedAddress: "134, Diwan Bahadur Rd, R.S. Puram, Coimbatore, Tamil Nadu 641002",
    city: "Coimbatore",
    state: "Tamil Nadu",
    postalCode: "641002",
    country: "India",
    latitude: 11.006245,
    longitude: 76.951823,
    rating: 4.6,
    reviewCount: 420,
    phone: "+91 422 254 1122",
    website: "https://www.allensolly.com/",
    coverImageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=900&q=80",
  },
  {
    id: "a1000005-0005-4000-8000-000000000002",
    brandId: "allen-solly",
    brandName: "Allen Solly",
    name: "Allen Solly - 100 Feet Road, Indiranagar, Bangalore",
    category: "Fashion & Apparel",
    formattedAddress: "777/A, 100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560038",
    country: "India",
    latitude: 12.970211,
    longitude: 77.638421,
    rating: 4.7,
    reviewCount: 580,
    phone: "+91 80 2521 9900",
    website: "https://www.allensolly.com/",
    coverImageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=900&q=80",
  },

  // 6. Louis Philippe
  {
    id: "a1000006-0006-4000-8000-000000000001",
    brandId: "louis-philippe",
    brandName: "LOUIS PHILIPPE",
    name: "Louis Philippe - Race Course Road, Coimbatore",
    category: "Fashion & Apparel",
    formattedAddress: "105, Race Course Rd, Coimbatore, Tamil Nadu 641018",
    city: "Coimbatore",
    state: "Tamil Nadu",
    postalCode: "641018",
    country: "India",
    latitude: 11.001234,
    longitude: 76.974512,
    rating: 4.8,
    reviewCount: 390,
    phone: "+91 422 222 3344",
    website: "https://www.louisphilippe.com/",
    coverImageUrl: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=900&q=80",
  },
  {
    id: "a1000006-0006-4000-8000-000000000002",
    brandId: "louis-philippe",
    brandName: "LOUIS PHILIPPE",
    name: "Louis Philippe - Brigade Road, Bangalore",
    category: "Fashion & Apparel",
    formattedAddress: "8, Brigade Rd, Shanthala Nagar, Ashok Nagar, Bengaluru, Karnataka 560001",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560001",
    country: "India",
    latitude: 12.972745,
    longitude: 77.608012,
    rating: 4.7,
    reviewCount: 620,
    phone: "+91 80 2558 1133",
    website: "https://www.louisphilippe.com/",
    coverImageUrl: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=900&q=80",
  },

  // 7. Indian Terrain
  {
    id: "651ccc7b-027f-4410-be8c-3e92d99e0e7c",
    brandId: "indian-terrain",
    brandName: "INDIAN TERRAIN",
    name: "Indian Terrain - D.B Road, Coimbatore",
    category: "Fashion & Apparel",
    formattedAddress: "Door No: 160, 15, Diwan Bahadur Rd, R.S. Puram, Coimbatore, Tamil Nadu 641002",
    city: "Coimbatore",
    state: "Tamil Nadu",
    postalCode: "641002",
    country: "India",
    latitude: 11.0041421,
    longitude: 76.9515598,
    rating: 4.9,
    reviewCount: 29,
    phone: "+91 422 254 3456",
    website: "https://www.indianterrain.com/",
    coverImageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&q=80",
  },
  {
    id: "ed66db96-6c27-4481-bbdf-5b09401c49cf",
    brandId: "indian-terrain",
    brandName: "INDIAN TERRAIN",
    name: "Indian Terrain - Race Course, Coimbatore",
    category: "Fashion & Apparel",
    formattedAddress: "231, Race Course Rd, Race Course, Coimbatore, Tamil Nadu 641018",
    city: "Coimbatore",
    state: "Tamil Nadu",
    postalCode: "641018",
    country: "India",
    latitude: 10.9991966,
    longitude: 76.979493,
    rating: 4.9,
    reviewCount: 787,
    phone: "+91 422 222 7878",
    website: "https://www.indianterrain.com/",
    coverImageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&q=80",
  },
  {
    id: "d1f0832e-c20b-4530-95f2-c4da677fa9bc",
    brandId: "indian-terrain",
    brandName: "INDIAN TERRAIN",
    name: "Indian Terrain - STV Nagar, Coimbatore",
    category: "Fashion & Apparel",
    formattedAddress: "Sri Hari Building, No. 3/1261, Dr Rajendra Prasad Rd, Peelamedu, Coimbatore, Tamil Nadu 641004",
    city: "Coimbatore",
    state: "Tamil Nadu",
    postalCode: "641004",
    country: "India",
    latitude: 11.020572,
    longitude: 76.9919932,
    rating: 4.4,
    reviewCount: 82,
    phone: "+91 422 257 8899",
    website: "https://www.indianterrain.com/",
    coverImageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&q=80",
  },
  {
    id: "96ba4625-3503-4b1c-8b4d-7e5697ee98f0",
    brandId: "indian-terrain",
    brandName: "INDIAN TERRAIN",
    name: "Indian Terrain - Indiranagar, Bangalore",
    category: "Fashion & Apparel",
    formattedAddress: "100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560038",
    country: "India",
    latitude: 12.9764177,
    longitude: 77.6408037,
    rating: 4.7,
    reviewCount: 460,
    phone: "+91 80 2521 1122",
    website: "https://www.indianterrain.com/",
    coverImageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&q=80",
  },

  // 8. Jockey
  {
    id: "a1000008-0008-4000-8000-000000000001",
    brandId: "jockey",
    brandName: "JOCKEY",
    name: "Jockey Exclusive Store - 100 Feet Road, Coimbatore",
    category: "Fashion & Apparel",
    formattedAddress: "100 Feet Rd, Gandhipuram, Coimbatore, Tamil Nadu 641012",
    city: "Coimbatore",
    state: "Tamil Nadu",
    postalCode: "641012",
    country: "India",
    latitude: 11.019512,
    longitude: 76.967834,
    rating: 4.6,
    reviewCount: 730,
    phone: "+91 422 249 8899",
    website: "https://www.jockey.in/",
    coverImageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=900&q=80",
  },
  {
    id: "a1000008-0008-4000-8000-000000000002",
    brandId: "jockey",
    brandName: "JOCKEY",
    name: "Jockey Exclusive Store - Koramangala, Bangalore",
    category: "Fashion & Apparel",
    formattedAddress: "80 Feet Rd, 4th Block, Koramangala, Bengaluru, Karnataka 560034",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560034",
    country: "India",
    latitude: 12.935211,
    longitude: 77.624532,
    rating: 4.6,
    reviewCount: 980,
    phone: "+91 80 4121 6655",
    website: "https://www.jockey.in/",
    coverImageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=900&q=80",
  },

  // 9. Bata
  {
    id: "a1000009-0009-4000-8000-000000000001",
    brandId: "bata",
    brandName: "Bata",
    name: "Bata Shoe Store - Oppanakara Street, Coimbatore",
    category: "Footwear",
    formattedAddress: "512, Oppanakara St, Town Hall, Coimbatore, Tamil Nadu 641001",
    city: "Coimbatore",
    state: "Tamil Nadu",
    postalCode: "641001",
    country: "India",
    latitude: 10.993512,
    longitude: 76.962034,
    rating: 4.5,
    reviewCount: 1100,
    phone: "+91 422 239 1234",
    website: "https://www.bata.in/",
    coverImageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=900&q=80",
  },
  {
    id: "a1000009-0009-4000-8000-000000000002",
    brandId: "bata",
    brandName: "Bata",
    name: "Bata Shoe Store - Brigade Road, Bangalore",
    category: "Footwear",
    formattedAddress: "Brigade Rd, Ashok Nagar, Bengaluru, Karnataka 560001",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560001",
    country: "India",
    latitude: 12.973512,
    longitude: 77.607834,
    rating: 4.4,
    reviewCount: 1420,
    phone: "+91 80 2558 3344",
    website: "https://www.bata.in/",
    coverImageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=900&q=80",
  },

  // 10. Woodland
  {
    id: "a1000010-0010-4000-8000-000000000001",
    brandId: "woodland",
    brandName: "WOODLAND",
    name: "Woodland Store - Cross Cut Road, Coimbatore",
    category: "Footwear & Outdoor",
    formattedAddress: "Cross Cut Rd, Gandhipuram, Coimbatore, Tamil Nadu 641012",
    city: "Coimbatore",
    state: "Tamil Nadu",
    postalCode: "641012",
    country: "India",
    latitude: 11.016534,
    longitude: 76.961023,
    rating: 4.5,
    reviewCount: 490,
    phone: "+91 422 249 7788",
    website: "https://www.woodlandworldwide.com/",
    coverImageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80",
  },
  {
    id: "a1000010-0010-4000-8000-000000000002",
    brandId: "woodland",
    brandName: "WOODLAND",
    name: "Woodland Store - Commercial Street, Bangalore",
    category: "Footwear & Outdoor",
    formattedAddress: "12, Commercial St, Tasker Town, Shivaji Nagar, Bengaluru, Karnataka 560001",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560001",
    country: "India",
    latitude: 12.982045,
    longitude: 77.608512,
    rating: 4.6,
    reviewCount: 670,
    phone: "+91 80 2559 2211",
    website: "https://www.woodlandworldwide.com/",
    coverImageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80",
  },

  // 11. Kalyan Jewellers
  {
    id: "a1000011-0011-4000-8000-000000000001",
    brandId: "kalyan-jewellers",
    brandName: "KALYAN JEWELLERS",
    name: "Kalyan Jewellers - 100 Feet Road, Coimbatore",
    category: "Jewellery & Luxury",
    formattedAddress: "100 Feet Rd, Gandhipuram, Coimbatore, Tamil Nadu 641012",
    city: "Coimbatore",
    state: "Tamil Nadu",
    postalCode: "641012",
    country: "India",
    latitude: 11.021023,
    longitude: 76.969245,
    rating: 4.8,
    reviewCount: 1850,
    phone: "+91 422 249 9999",
    website: "https://www.kalyanjewellers.net/",
    coverImageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=900&q=80",
  },
  {
    id: "a1000011-0011-4000-8000-000000000002",
    brandId: "kalyan-jewellers",
    brandName: "KALYAN JEWELLERS",
    name: "Kalyan Jewellers - Dickenson Road, Bangalore",
    category: "Jewellery & Luxury",
    formattedAddress: "Dickenson Rd, Sivanchetti Gardens, Bengaluru, Karnataka 560042",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560042",
    country: "India",
    latitude: 12.978012,
    longitude: 77.615023,
    rating: 4.7,
    reviewCount: 2100,
    phone: "+91 80 2555 4400",
    website: "https://www.kalyanjewellers.net/",
    coverImageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=900&q=80",
  },

  // 12. Jos Alukkas
  {
    id: "a1000012-0012-4000-8000-000000000001",
    brandId: "jos-alukkas",
    brandName: "JOS ALUKKAS",
    name: "Jos Alukkas Jewellery - 100 Feet Road, Coimbatore",
    category: "Jewellery & Luxury",
    formattedAddress: "100 Feet Rd, Tatabad, Coimbatore, Tamil Nadu 641012",
    city: "Coimbatore",
    state: "Tamil Nadu",
    postalCode: "641012",
    country: "India",
    latitude: 11.022512,
    longitude: 76.968034,
    rating: 4.7,
    reviewCount: 1230,
    phone: "+91 422 249 5555",
    website: "https://www.josalukkasonline.com/",
    coverImageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=900&q=80",
  },
  {
    id: "a1000012-0012-4000-8000-000000000002",
    brandId: "jos-alukkas",
    brandName: "JOS ALUKKAS",
    name: "Jos Alukkas - Dickenson Road, Bangalore",
    category: "Jewellery & Luxury",
    formattedAddress: "Dickenson Rd, Near Manipal Centre, Bengaluru, Karnataka 560042",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560042",
    country: "India",
    latitude: 12.979012,
    longitude: 77.614532,
    rating: 4.6,
    reviewCount: 1410,
    phone: "+91 80 2558 9988",
    website: "https://www.josalukkasonline.com/",
    coverImageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=900&q=80",
  },

  // 13. Joyalukkas
  {
    id: "a1000013-0013-4000-8000-000000000001",
    brandId: "joyalukkas",
    brandName: "Joyalukkas",
    name: "Joyalukkas Jewellery - Cross Cut Road, Coimbatore",
    category: "Jewellery & Luxury",
    formattedAddress: "Cross Cut Rd, Gandhipuram, Coimbatore, Tamil Nadu 641012",
    city: "Coimbatore",
    state: "Tamil Nadu",
    postalCode: "641012",
    country: "India",
    latitude: 11.018023,
    longitude: 76.965012,
    rating: 4.8,
    reviewCount: 2450,
    phone: "+91 422 249 7777",
    website: "https://www.joyalukkas.in/",
    coverImageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=900&q=80",
  },
  {
    id: "a1000013-0013-4000-8000-000000000002",
    brandId: "joyalukkas",
    brandName: "Joyalukkas",
    name: "Joyalukkas Jewellery - MG Road, Bangalore",
    category: "Jewellery & Luxury",
    formattedAddress: "MG Road, Craig Park Layout, Ashok Nagar, Bengaluru, Karnataka 560001",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560001",
    country: "India",
    latitude: 12.974012,
    longitude: 77.612034,
    rating: 4.8,
    reviewCount: 3100,
    phone: "+91 80 2558 7777",
    website: "https://www.joyalukkas.in/",
    coverImageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=900&q=80",
  },
];

const DEFAULT_LAT = 11.0168;
const DEFAULT_LNG = 76.9558;

/**
 * Urban road circuity / detour factor.
 * In urban city road networks with flyovers, arterial turns, and one-ways,
 * real road driving distance is ~1.385x the straight-line aerial distance.
 * E.g., Kalapatti to Oppanakara Street straight-line is 12.63 km -> Road route is 17.5 km.
 */
export const URBAN_ROAD_DETOUR_FACTOR = 1.385;

export function toRoadDistanceKm(straightLineKm: number): number {
  if (straightLineKm <= 0.3) return straightLineKm;
  const factor = straightLineKm < 1 ? 1.2 : straightLineKm < 3 ? 1.3 : URBAN_ROAD_DETOUR_FACTOR;
  return Math.round(straightLineKm * factor * 10) / 10;
}

export function getNearestStoreForBrand(
  brandId: string,
  userLat?: number | null,
  userLng?: number | null,
): {
  store: BrandStoreLocation;
  distanceKm: number | null;
  aerialDistanceKm: number | null;
  hasUserLocation: boolean;
  href: string;
} {
  const stores = BRAND_STORES_CATALOG.filter((s) => s.brandId === brandId);
  const primaryStore = stores[0] ?? BRAND_STORES_CATALOG[0];

  const hasLocation =
    userLat != null &&
    userLng != null &&
    Number.isFinite(userLat) &&
    Number.isFinite(userLng) &&
    isValidCoordinate(userLat, userLng);

  if (!hasLocation) {
    return {
      store: primaryStore,
      distanceKm: null,
      aerialDistanceKm: null,
      hasUserLocation: false,
      href: `/store/${encodeURIComponent(`imported:${primaryStore.id}`)}?shopLat=${primaryStore.latitude}&shopLng=${primaryStore.longitude}`,
    };
  }

  let nearestStore = stores[0] ?? primaryStore;
  let minDistance = haversineDistanceKm(
    userLat,
    userLng,
    nearestStore.latitude,
    nearestStore.longitude,
  );

  for (let i = 1; i < stores.length; i++) {
    const s = stores[i];
    const dist = haversineDistanceKm(userLat, userLng, s.latitude, s.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearestStore = s;
    }
  }

  const href = `/store/${encodeURIComponent(`imported:${nearestStore.id}`)}?shopLat=${nearestStore.latitude}&shopLng=${nearestStore.longitude}`;
  const roadDistance = toRoadDistanceKm(minDistance);

  return {
    store: nearestStore,
    distanceKm: roadDistance,
    aerialDistanceKm: minDistance,
    hasUserLocation: true,
    href,
  };
}

export function getBrandStoreById(idOrImportedId: string): ImportedShopRow | null {
  const cleanId = idOrImportedId.startsWith("imported:")
    ? idOrImportedId.slice("imported:".length)
    : idOrImportedId;

  const found = BRAND_STORES_CATALOG.find((s) => s.id === cleanId);
  if (!found) return null;

  return {
    id: found.id,
    business_name: found.name,
    category: found.category,
    formatted_address: found.formattedAddress,
    city: found.city,
    state: found.state,
    latitude: found.latitude,
    longitude: found.longitude,
    distance_km: 0,
    website: found.website ?? null,
    google_maps_url: null,
    rating: found.rating,
    review_count: found.reviewCount,
    cover_image_url: found.coverImageUrl,
    image_type: "representative",
    claim_status: "unclaimed",
  };
}
