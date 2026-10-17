export interface ImportedDemoItem {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
}
export type ImportedDemoQuantities = Record<string, number>;

/** Same category product range used by the existing sample seed catalog. */
export function getImportedCatalogItems(category: string): { name: string; price: number }[] {
  const rows: [string, number][] = /bakery|baker/i.test(category)
    ? [
        ["Birthday Cake", 650],
        ["Chocolate Cake", 680],
        ["Black Forest Cake", 720],
        ["Bread Loaf", 45],
        ["Bun", 12],
        ["Puffs", 25],
        ["Cookies", 80],
        ["Samosa", 18],
        ["Gulab Jamun", 140],
        ["Mysore Pak", 220],
      ]
    : /furniture/i.test(category)
      ? [
          ["Sofas", 14999],
          ["Coffee Table", 3499],
          ["Dining Table", 12999],
          ["Dining Chairs", 2499],
          ["Beds", 19999],
          ["Wardrobes", 15999],
          ["Bookshelves", 4999],
          ["Office Chairs", 5999],
          ["Side Tables", 1999],
          ["Home Decor", 999],
        ]
      : /electro/i.test(category)
        ? [
            ["4K Smart LED TV 43 Inch", 22990],
            ["Surround Soundbar 120W Speaker", 4990],
            ["True Wireless Bluetooth Earbuds", 1299],
            ["Type-C 65W Fast Charger Adapter", 699],
            ["10000mAh Power Bank Fast Charge", 1199],
            ["Smart Fitness Watch with SpO2", 2499],
            ["Portable Bluetooth Speaker Waterproof", 1799],
            ["Mixer Grinder 750W 3 Jars", 3299],
            ["Electric Steam Iron 1200W", 999],
            ["Induction Cooktop 2000W", 2799],
          ]
        : /flower|florist/i.test(category)
          ? [
              ["Fresh Jasmine Garland (மல்லிப்பூ)", 80],
              ["Red Rose Flower Bouquet", 299],
              ["Mixed Floral Bouquet (Lilies & Roses)", 499],
              ["Traditional Pooja Flower Mix (உதிரிப்பூ)", 60],
              ["Marigold Garland (சாமந்தி மாலை)", 120],
              ["Lotus Flowers for Pooja (Pack of 2)", 50],
              ["Fragrant Tube Rose Garland (சம்பங்கி)", 100],
              ["Orchid Table Flower Arrangement", 599],
              ["Bridal Flower Veni for Hair", 350],
              ["Carnation Flower Bunch (10 Stems)", 320],
            ]
          : /gift/i.test(category)
            ? [
                ["Customized Wooden Photo Frame", 399],
                ["Personalized Magic Ceramic Mug", 299],
                ["Handmade Festive Gift Hamper", 699],
                ["Scented Soy Wax Candle Set", 349],
                ["Crystal Rotating LED Photo Lamp", 899],
                ["Teddy Bear & Chocolate Gift Combo", 499],
                ["Laser Engraved Metal Pen & Keychain Set", 399],
                ["Vintage Musical Box Gift", 549],
                ["Personalized Name LED Night Lamp", 649],
                ["Celebration Greeting Card with Envelope", 99],
              ]
            : [
                ["T-Shirts", 399],
                ["Jeans", 999],
                ["Shirts", 699],
                ["Sarees", 1299],
                ["Kurtis", 599],
                ["Chudidars", 899],
                ["Leggings", 299],
                ["Dresses", 1199],
                ["Innerwear", 249],
                ["Kids Wear", 499],
              ];
  return rows.map(([name, price]) => ({ name, price }));
}

// Sample prices only, never business inventory or values sent to live checkout.
export function getDemoPrice(name: string, category: string): number {
  if (/furniture/i.test(category))
    return /sofa/i.test(name)
      ? 14999
      : /bedroom/i.test(name)
        ? 19999
        : /decor/i.test(name)
          ? 999
          : 8999;
  if (/electro/i.test(category))
    return /tv/i.test(name)
      ? 22990
      : /soundbar/i.test(name)
        ? 4990
        : /earbud|speaker/i.test(name)
          ? 1499
          : /charger/i.test(name)
            ? 699
            : 2499;
  if (/flower|florist/i.test(category))
    return /jasmine|மல்லி/i.test(name)
      ? 80
      : /rose|bouquet/i.test(name)
        ? 299
        : /garland|மாலை/i.test(name)
          ? 120
          : 150;
  if (/gift/i.test(category))
    return /frame/i.test(name)
      ? 399
      : /hamper/i.test(name)
        ? 699
        : /lamp/i.test(name)
          ? 899
          : 349;
  return /jeans/i.test(name) ? 1299 : /boutique/i.test(name) ? 1499 : 799;
}

export function getImportedDemoTotal(
  items: ImportedDemoItem[],
  quantities: ImportedDemoQuantities,
): number {
  return items.reduce((total, item) => {
    const qty = quantities[item.id] ?? 0;
    if (!Number.isSafeInteger(qty) || qty < 0 || qty > 99) throw new Error("Invalid demo quantity");
    return total + item.price * qty;
  }, 0);
}
