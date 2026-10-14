import type { CartLine } from "@/shared/core/cart";
import type { ImportedShopRow } from "@/shared/core/imported-shops";
import { catalogCategoryKey } from "@/lib/shop-categories";
import { isValidCoordinate } from "@/lib/geo";
import {
  CUSTOMER_VISIBILITY_RADIUS_KM,
  DEFAULT_SHOP_DISCOVERY_RADIUS_KM,
} from "@/lib/location-visibility";
import { getImportedShopHref } from "@/lib/imported-shops";

export interface NearbyCartProduct {
  id: string;
  name: string;
  seller_id: string;
  shop_name: string;
  category: string;
  stock: number;
  selling_price: number;
  distance_km: number;
  image_url?: string;
}

export function nearbyCartShops(
  lines: CartLine[],
  currentStoreId: string | null,
  products: NearbyCartProduct[],
  imported: ImportedShopRow[],
) {
  const categories = new Set(
    lines.map((line) => catalogCategoryKey(line.category)).filter(Boolean),
  );
  const names = new Set(lines.map((line) => line.name.toLowerCase().trim()));
  const groups = new Map<
    string,
    {
      id: string;
      name: string;
      distanceKm: number;
      href: string;
      imported: boolean;
      products: NearbyCartProduct[];
    }
  >();
  for (const product of products) {
    if (
      !product.id ||
      !product.seller_id ||
      product.seller_id === currentStoreId ||
      !Number.isFinite(Number(product.stock)) ||
      Number(product.stock) <= 0 ||
      !Number.isFinite(product.distance_km) ||
      product.distance_km < 0 ||
      product.distance_km > CUSTOMER_VISIBILITY_RADIUS_KM ||
      !Number.isFinite(Number(product.selling_price)) ||
      (!names.has(product.name.toLowerCase().trim()) &&
        !categories.has(catalogCategoryKey(product.category)))
    )
      continue;
    const group = groups.get(product.seller_id) ?? {
      id: product.seller_id,
      name: product.shop_name || "Local shop",
      distanceKm: product.distance_km,
      href: `/store/${product.seller_id}`,
      imported: false,
      products: [],
    };
    if (!group.products.some((item) => item.id === product.id)) group.products.push(product);
    groups.set(group.id, group);
  }
  for (const shop of imported) {
    const id = `imported:${shop.id}`;
    const distanceKm = Number(shop.distance_km);
    if (
      id === currentStoreId ||
      !shop.id ||
      !shop.business_name ||
      shop.latitude == null ||
      shop.longitude == null ||
      !isValidCoordinate(Number(shop.latitude), Number(shop.longitude)) ||
      !categories.has(catalogCategoryKey(shop.category)) ||
      shop.distance_km == null ||
      !Number.isFinite(distanceKm) ||
      distanceKm < 0 ||
      distanceKm > DEFAULT_SHOP_DISCOVERY_RADIUS_KM
    )
      continue;
    groups.set(id, {
      id,
      name: shop.business_name,
      distanceKm,
      href: getImportedShopHref(shop.id, Number(shop.latitude), Number(shop.longitude)),
      imported: true,
      products: [],
    });
  }
  return [...groups.values()]
    .sort((a, b) => Number(a.imported) - Number(b.imported) || a.distanceKm - b.distanceKm)
    .slice(0, 6);
}
