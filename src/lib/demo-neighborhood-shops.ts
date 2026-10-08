import type { StoreCategory } from "./mock-data";

/** User-supplied business examples. These are previews, not registered sellers. */
export interface DemoNeighborhoodShop {
  id: string;
  name: string;
  hub: string;
  area: string;
  city: "Coimbatore" | "Bengaluru";
  category: StoreCategory;
  lat: number;
  lng: number;
  sampleProducts: string[];
  sampleProductImages: string[];
  sampleProductPrices: number[];
}

const sampleProducts: Record<string, string[]> = {
  grocery: ["Sona Masoori rice", "Cold pressed coconut oil", "Unpolished toor dal"],
  clothing: ["Cotton casual shirt", "Floral printed kurti", "Stretch denim jeans"],
  books: ["Fiction and novels", "A4 notebooks", "Gel pens"],
  market: ["Fresh country tomatoes", "Green spinach bunch", "Fresh farm red apples", "Sona Masoori rice", "Cold pressed coconut oil", "Unpolished toor dal"],
  gifts: ["Wooden photo frame", "Greeting cards", "Gift hamper"],
  stationery: ["A4 notebooks", "Gel pens", "Art supplies"],
  electronics: ["Smart LED television", "Bluetooth soundbar", "Laptop computer"],
  mobile: ["Smartphone", "Wireless earbuds", "Fast charger"],
  bags: ["Everyday backpack", "Travel bag", "Wallet"],
  shopping: ["Cotton casual shirt", "Home décor", "Gift hamper"],
};

// Illustrative prices for the preview basket only. They are not seller quotes.
const sampleProductPrices: Record<keyof typeof sampleProducts, number[]> = {
  grocery: [340, 240, 145],
  clothing: [599, 799, 899],
  books: [299, 79, 49],
  market: [38, 30, 160, 340, 240, 145],
  gifts: [349, 89, 699],
  stationery: [79, 49, 149],
  electronics: [18999, 2499, 44999],
  mobile: [14999, 1299, 799],
  bags: [999, 1499, 499],
  shopping: [599, 799, 699],
};

// Product photography already used by LocalShore's sample catalog. These
// pictures illustrate product types; they are not a seller's stock photos.
const productPhoto = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;
const sampleProductImages: Record<keyof typeof sampleProducts, string[]> = {
  grocery: ["photo-1586201375761-83865001e31c", "photo-1474979266404-7eaacbcd87c5", "photo-1515543904379-3d757afe72e4"],
  clothing: ["photo-1489987707025-afc232f7ea0f", "photo-1583391733956-6c78276477e2", "photo-1541099649105-f69ad21f3246"],
  books: ["photo-1544716278-ca5e3f4abd8c", "photo-1531346878377-a5be20888e57", "photo-1583485088034-697b5bc36b92"],
  market: ["photo-1592924357228-91a4daadcfea", "photo-1576045057995-568f588f82fb", "photo-1610832958506-aa56368176cf", "photo-1586201375761-83865001e31c", "photo-1474979266404-7eaacbcd87c5", "photo-1515543904379-3d757afe72e4"],
  gifts: ["photo-1549465220-1a8b9238cd48", "photo-1512909006721-3d6018887383", "photo-1513519245088-0e12902e5a38"],
  stationery: ["photo-1531346878377-a5be20888e57", "photo-1583485088034-697b5bc36b92", "photo-1456513080510-7bf3a84b82f8"],
  electronics: ["photo-1593784991095-a205069470b6", "photo-1545454675-3531b543be5d", "photo-1496181133206-80ce9b88a853"],
  mobile: ["photo-1511707171634-5f897ff02aa9", "photo-1598327105666-5b89351aff97", "photo-1601784551446-20c9e07cdbdb"],
  bags: ["photo-1553062407-98eeb64c6a62", "photo-1622560480605-d83c853bc5c3", "photo-1627123424574-724758594e93"],
  shopping: ["photo-1489987707025-afc232f7ea0f", "photo-1513519245088-0e12902e5a38", "photo-1549465220-1a8b9238cd48"],
};

type Example = [id: string, name: string, hub: string, area: string, city: DemoNeighborhoodShop["city"], kind: keyof typeof sampleProducts, category: StoreCategory, lat: number, lng: number];

// Coordinates are neighborhood centers, not geocoded storefront entrances.
// Small, stable offsets keep examples in the same area individually selectable.
const examples: Example[] = [
  ["cbe-doraisingh", "Doraisingh Supermarket", "CBE-01", "Gandhipuram", "Coimbatore", "grocery", "grocery", 11.0182714, 76.9677744],
  ["cbe-pothys", "POTHYS - Gandhipuram, Coimbatore", "CBE-01", "Gandhipuram", "Coimbatore", "grocery", "grocery", 11.0182714, 76.9677744],
  ["cbe-majestic-books", "Majestic Book House", "CBE-01", "Town Hall", "Coimbatore", "books", "books_stationery", 10.9967718, 76.9556171],
  ["cbe-bhura-market", "Bhura Market", "CBE-01", "Ukkadam", "Coimbatore", "market", "grocery", 10.9913011, 76.9628106],
  ["cbe-jeyaa-stores", "Jeyaa Stores", "CBE-02", "Saravanampatti", "Coimbatore", "grocery", "grocery", 11.0747296, 77.0027116],
  ["cbe-star-collections", "STAR Collections (Women's Hub)", "CBE-02", "Saravanampatti", "Coimbatore", "clothing", "fashion", 11.0747296, 77.0027116],
  ["cbe-v-mart", "V-Mart", "CBE-02", "Saravanampatti", "Coimbatore", "clothing", "fashion", 11.0747296, 77.0027116],
  ["cbe-signature-gifting", "Signature, Bespoke Gifting - Hope College", "CBE-03", "Hope College", "Coimbatore", "gifts", "gifts", 11.025, 77.01],
  ["cbe-bharathiraja-books", "Bharathiraja Books & Stationary", "CBE-03", "Hope College", "Coimbatore", "stationery", "books_stationery", 11.025, 77.01],
  ["cbe-cheran-mart", "Cheran Mart", "CBE-03", "Kalapatti", "Coimbatore", "grocery", "grocery", 11.0787684, 77.0370419],
  ["cbe-devapaul", "DevaPaul Supermarket", "CBE-03", "Kalapatti", "Coimbatore", "grocery", "grocery", 11.0787684, 77.0370419],
  ["cbe-rk-store", "RK Store", "CBE-04", "Singanallur", "Coimbatore", "grocery", "grocery", 11.0124691, 77.0391191],
  ["cbe-petti-shop", "singanallur petti shop", "CBE-04", "Singanallur", "Coimbatore", "market", "grocery", 11.0124691, 77.0391191],
  ["cbe-reliance-digital", "Reliance Digital", "CBE-04", "Singanallur", "Coimbatore", "electronics", "electronics", 11.0124691, 77.0391191],
  ["cbe-poorvika", "Poorvika Mobiles Vadavalli", "CBE-05", "Vadavalli", "Coimbatore", "mobile", "mobile", 11.0253387, 76.9051251],
  ["cbe-style-union", "Style Union - Vadavalli, Coimbatore", "CBE-05", "Vadavalli", "Coimbatore", "clothing", "fashion", 11.0253387, 76.9051251],
  ["cbe-easybuy", "EasyBuy - Vadavalli", "CBE-05", "Vadavalli", "Coimbatore", "clothing", "fashion", 11.0253387, 76.9051251],
  ["cbe-priyaas", "PRIYAA'S SUPERMARKET", "CBE-05", "Vadavalli side", "Coimbatore", "grocery", "grocery", 11.0253387, 76.9051251],
  ["blr-city-shop", "City Shop", "BLR-01", "Majestic", "Bengaluru", "bags", "fashion_accessories", 12.9779079, 77.5723936],
  ["blr-local-market", "Local market banglore", "BLR-01", "Majestic", "Bengaluru", "market", "grocery", 12.9779079, 77.5723936],
  ["blr-shivaji-complex", "Shivaji Nagar Shopping Complex", "BLR-01", "Shivajinagar", "Bengaluru", "shopping", "gifts", 12.9855286, 77.6054496],
  ["blr-commercial-street", "Commercial Street", "BLR-01", "Shivajinagar", "Bengaluru", "shopping", "fashion", 12.9855286, 77.6054496],
  ["blr-city-super-bazaar", "City Super Bazaar", "BLR-02", "Hoodi", "Bengaluru", "grocery", "grocery", 12.9959233, 77.7192796],
  ["blr-dress-circle", "Dress Circle Shopping Mall- Whitefield", "BLR-02", "Whitefield", "Bengaluru", "clothing", "fashion", 12.9957428, 77.7579489],
  ["blr-easybuy", "EasyBuy", "BLR-02", "Whitefield", "Bengaluru", "clothing", "fashion", 12.9957428, 77.7579489],
  ["blr-two-sisters", "TWO SISTERS NORTHEAST STORE - Bellandur", "BLR-03", "Bellandur", "Bengaluru", "grocery", "grocery", 12.9320495, 77.6842915],
  ["blr-tk-store", "Tk store", "BLR-03", "Bellandur", "Bengaluru", "grocery", "grocery", 12.9320495, 77.6842915],
  ["blr-my-wow", "MY WOW STOREE", "BLR-04", "Jayanagar", "Bengaluru", "clothing", "fashion", 12.9292731, 77.5824229],
  ["blr-jayanagar-market", "Jayanagar Market", "BLR-04", "Jayanagar", "Bengaluru", "market", "grocery", 12.9292731, 77.5824229],
  ["blr-reliance-digital", "Reliance Digital", "BLR-05", "RR Nagar", "Bengaluru", "electronics", "electronics", 12.9274413, 77.5155224],
  ["blr-gopalan-arcade", "Gopalan Arcade Mall", "BLR-05", "Mysore Road/RR Nagar", "Bengaluru", "shopping", "gifts", 12.9274413, 77.5155224],
  ["blr-discount-retail", "The Discount Retail Rajajinagar", "BLR-06", "Rajajinagar", "Bengaluru", "electronics", "electronics", 13.0005359, 77.5496996],
  ["blr-gt-world", "GT World Mall - Bengaluru", "BLR-06", "Vijayanagar/Magadi Rd", "Bengaluru", "shopping", "gifts", 12.9709537, 77.5373851],
  ["blr-croma", "Croma - Yelahanka", "BLR-07", "Yelahanka", "Bengaluru", "electronics", "electronics", 13.1006982, 77.5963454],
  ["blr-style-union-vidyaranyapura", "Style Union - Vidyaranyapura, Bengaluru", "BLR-07", "Vidyaranyapura", "Bengaluru", "clothing", "fashion", 13.0766407, 77.5577315],
  ["blr-style-union-horamavu", "Style Union", "BLR-08", "Horamavu", "Bengaluru", "clothing", "fashion", 13.0273312, 77.6601508],
  ["blr-home-shoppe", "Home Shoppe", "BLR-08", "Kalyan Nagar", "Bengaluru", "grocery", "grocery", 13.0221416, 77.6403368],
];

const areaCounts = new Map<string, number>();

export const demoNeighborhoodShops: DemoNeighborhoodShop[] = examples.map(
  ([id, name, hub, area, city, kind, category, areaLat, areaLng]) => {
    const areaKey = `${city}:${areaLat.toFixed(4)}:${areaLng.toFixed(4)}`;
    const index = areaCounts.get(areaKey) ?? 0;
    areaCounts.set(areaKey, index + 1);
    return {
      id: `demo-neighborhood-${id}`,
      name,
      hub,
      area,
      city,
      category,
      lat: areaLat + (index % 3) * 0.00055,
      lng: areaLng + Math.floor(index / 3) * 0.00055,
      sampleProducts: sampleProducts[kind],
      sampleProductImages: sampleProductImages[kind].map(productPhoto),
      sampleProductPrices: sampleProductPrices[kind],
    };
  },
);

export const getDemoNeighborhoodShop = (id: string) => demoNeighborhoodShops.find((shop) => shop.id === id);

export const isGeneratedDemoShopName = (name: string) =>
  /\(demo\)|^LocalShore\s+(?:Demo\s+)?(?:CBE|BLR)-\d{2}\b/i.test(name);
