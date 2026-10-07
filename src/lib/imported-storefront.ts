import type { Product, Store } from "./mock-data";
import { getImportedCatalogItems } from "./imported-demo-cart";
import { toStoreCategory } from "./shop-categories";
import { getFallbackProductImage, getFallbackShopImage } from "./image-utils";
import type { ImportedShopRow } from "./imported-shops";

export function importedCatalogProducts(
  shopId: string,
  shopName: string,
  category: string,
): Product[] {
  const normalized = toStoreCategory(category);
  return getImportedCatalogItems(category).map((item) => ({
    id: `sample:${shopId}:${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    storeId: shopId,
    shopName,
    name: item.name,
    price: item.price,
    unit: "1 unit",
    category: normalized,
    stock: 99,
    imageUrl: getFallbackProductImage(item.name, normalized),
  }));
}

export function importedStorefront(shop: ImportedShopRow): {
  store: Store;
  products: Product[];
  imported: true;
  reviewCount: number;
} {
  const id = `imported:${shop.id}`;
  return {
    imported: true,
    reviewCount: shop.review_count ?? 0,
    store: {
      id,
      name: shop.business_name,
      category: toStoreCategory(shop.category),
      tagline: "Prototype catalog · representative products and sample prices",
      rating: Number(shop.rating ?? 0),
      isOpen: false,
      etaMin: 0,
      address: shop.formatted_address ?? [shop.city, shop.state].filter(Boolean).join(", "),
      lat: Number(shop.latitude),
      lng: Number(shop.longitude),
      imageUrl: shop.cover_image_url || getFallbackShopImage(shop.category, shop.id),
    },
    products: importedCatalogProducts(id, shop.business_name, shop.category),
  };
}
