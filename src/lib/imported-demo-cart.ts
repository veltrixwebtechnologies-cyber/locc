export interface ImportedDemoItem {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
}
export type ImportedDemoQuantities = Record<string, number>;

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
