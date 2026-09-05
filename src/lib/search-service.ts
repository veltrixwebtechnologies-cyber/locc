import { stores, productsByStore, categoryLabel, Store, Product } from "./mock-data";
import { supabase } from "@/integrations/supabase/client";

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  type: "Restaurant" | "Shop" | "Dish" | "Product";
  imageUrl: string;
  url: string;
  storeId?: string;
  storeName?: string;
  price?: number;
  matchScore: number;
}

const DEFAULT_DISH_IMG = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=75";
const DEFAULT_SHOP_IMG = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=75";

export function getInstantSearchResults(query: string): SearchResultItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchResultItem[] = [];

  // 1. Search Stores / Restaurants
  for (const store of stores) {
    const nameLower = store.name.toLowerCase();
    const taglineLower = store.tagline.toLowerCase();
    const categoryLower = (categoryLabel[store.category] || store.category).toLowerCase();

    let score = 0;
    if (nameLower === q) {
      score += 120;
    } else if (nameLower.startsWith(q)) {
      score += 100;
    } else if (nameLower.includes(q)) {
      score += 60;
    } else if (taglineLower.includes(q) || categoryLower.includes(q)) {
      score += 30;
    }

    if (score > 0) {
      const isRestaurant = store.category === "grocery" || store.category === "bakery" || nameLower.includes("restaurant") || nameLower.includes("bakes") || nameLower.includes("sweets");
      results.push({
        id: `store-${store.id}`,
        title: store.name,
        subtitle: isRestaurant ? "Restaurant" : (categoryLabel[store.category] || "Shop"),
        type: isRestaurant ? "Restaurant" : "Shop",
        imageUrl: store.imageUrl || DEFAULT_SHOP_IMG,
        url: `/store/${store.id}`,
        storeId: store.id,
        storeName: store.name,
        matchScore: score,
      });
    }
  }

  // 2. Search Products / Dishes
  const allProducts = Object.values(productsByStore).flat();
  for (const prod of allProducts) {
    const nameLower = prod.name.toLowerCase();
    const catLower = prod.category.toLowerCase();
    const parentStore = stores.find((s) => s.id === prod.storeId);
    const storeNameLower = (parentStore?.name || "").toLowerCase();

    let score = 0;
    if (nameLower === q) {
      score += 110;
    } else if (nameLower.startsWith(q)) {
      score += 95;
    } else if (nameLower.includes(q)) {
      score += 55;
    } else if (catLower.includes(q)) {
      score += 25;
    } else if (storeNameLower.includes(q)) {
      score += 20;
    }

    if (score > 0) {
      const isDish = catLower.includes("dish") || catLower.includes("biryani") || catLower.includes("mutton") || catLower.includes("chicken") || catLower.includes("paneer") || catLower.includes("kebab") || catLower.includes("sauce") || catLower.includes("starter") || catLower.includes("fresh batter") || parentStore?.category === "bakery" || parentStore?.category === "grocery";
      results.push({
        id: `prod-${prod.id}`,
        title: prod.name,
        subtitle: parentStore?.name || (isDish ? "Dish" : "Product"),
        type: isDish ? "Dish" : "Product",
        imageUrl: prod.imageUrl || DEFAULT_DISH_IMG,
        url: `/product/${prod.id}`,
        storeId: prod.storeId,
        storeName: parentStore?.name,
        price: prod.price,
        matchScore: score,
      });
    }
  }

  // Sort by match score descending, then by title length
  return results.sort((a, b) => b.matchScore - a.matchScore || a.title.length - b.title.length);
}
