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
