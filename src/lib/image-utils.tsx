import { useState, useEffect, ImgHTMLAttributes } from "react";

export function getFallbackProductImage(name?: string | null, category?: string | null): string {
  const n = (name || "").toLowerCase();
  const c = (category || "").toLowerCase();

  // Prefer a product-specific image over a broad category image whenever the
  // catalog gives us a recognizable product name.
  if (n.includes("water bottle") || n.includes("bottle")) {
    return "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80";
  }
  if (n.includes("pressure cooker")) {
    return "https://images.unsplash.com/photo-1612476930934-b7ef769cbae9?auto=format&fit=crop&w=800&q=80";
  }
  if (n.includes("non-stick") || n.includes("nonstick") || n.includes("frying pan")) {
    return "https://images.unsplash.com/photo-1556912167-f556f1f39fdf?auto=format&fit=crop&w=800&q=80";
  }
  if (n.includes("dinner set") || n.includes("dinnerware") || n.includes("plate set")) {
    return "https://images.unsplash.com/photo-1603199506016-b9a594b593c0?auto=format&fit=crop&w=800&q=80";
  }
  if (n.includes("cookware") || n.includes("pot set") || n.includes("kitchen set")) {
    return "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80";
  }
  if (n.includes("wheat flour") || n.includes("flour") || n.includes("atta")) {
    return "https://images.unsplash.com/photo-1627485937980-221c88ac04f9?auto=format&fit=crop&w=800&q=80";
  }
  if (n.includes("cooking oil") || n.includes("sunflower oil") || n.includes("groundnut oil")) {
    return "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80";
  }
  if (n.includes("sugar")) {
    return "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=800&q=80";
  }
  if (n.includes("salt") || n.includes("spices") || n.includes("masala")) {
    return "https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=800&q=80";
  }
  if (n === "tea" || n.includes(" tea ") || n.includes("tea leaves")) {
    return "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80";
  }
  if (n.includes("biscuit") || n.includes("cookie")) {
    return "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80";
  }

  if (
    c.includes("hardware") ||
    c.includes("repair") ||
    n.includes("hardware") ||
    n.includes("drill") ||
    n.includes("screw") ||
    n.includes("tool")
  ) {
    return "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80";
  }

  if (c.includes("toys") || c.includes("baby") || n.includes("toy") || n.includes("doll")) {
    return "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80";
  }

  if (
    c.includes("flower") ||
    c.includes("gift") ||
    n.includes("flower") ||
    n.includes("bouquet")
  ) {
    return "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80";
  }

  if (
    n.includes("kitchen") ||
    n.includes("vessel") ||
    n.includes("cooker") ||
    n.includes("mixer") ||
    n.includes("utensil") ||
    n.includes("stove") ||
    c.includes("kitchen")
  ) {
    return "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80";
  }

  if (
    n.includes("tv") ||
    n.includes("electr") ||
    n.includes("fridge") ||
    n.includes("appliance") ||
    n.includes("showroom") ||
    c.includes("showroom")
  ) {
    return "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80";
  }

  if (
    n.includes("saree") ||
    n.includes("silk") ||
    n.includes("kurti") ||
    n.includes("boutique") ||
    c.includes("boutique")
  ) {
    return "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80";
  }

  if (
    n.includes("shirt") ||
    n.includes("dhoti") ||
    n.includes("readymade") ||
    n.includes("pant") ||
    n.includes("fashion") ||
    c.includes("fashion")
  ) {
    return "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80";
  }

  if (
    n.includes("mutton") ||
    n.includes("chicken") ||
    n.includes("fish") ||
    n.includes("meat") ||
    c.includes("meat")
  ) {
    return "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=800&q=80";
  }

  if (
    n.includes("tiramisu") ||
    n.includes("cake") ||
    n.includes("bread") ||
    n.includes("pastry") ||
    n.includes("bakery") ||
    n.includes("cookie") ||
    n.includes("puff") ||
    c.includes("bakery")
  ) {
    return "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80";
  }

  if (
    n.includes("coconut oil") ||
    n.includes("oil") ||
    n.includes("ghee") ||
    n.includes("butter")
  ) {
    return "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80";
  }

  if (
    n.includes("rice") ||
    n.includes("sona") ||
    n.includes("grain") ||
    n.includes("flour") ||
    n.includes("atta") ||
    n.includes("basmati") ||
    n.includes("batter") ||
    c.includes("flour_mill")
  ) {
    return "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80";
  }

  if (
    n.includes("dal") ||
    n.includes("pulse") ||
    n.includes("lentil") ||
    n.includes("toor") ||
    n.includes("moong")
  ) {
    return "https://images.unsplash.com/photo-1585996847058-2997e01b3b3a?auto=format&fit=crop&w=800&q=80";
  }

  if (n.includes("egg") || n.includes("eggs")) {
    return "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80";
  }

  if (
    n.includes("milk") ||
    n.includes("amul") ||
    n.includes("dairy") ||
    n.includes("curd") ||
    n.includes("paneer") ||
    n.includes("cheese")
  ) {
    return "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=800&q=80";
  }

  if (
    n.includes("med") ||
    n.includes("pharma") ||
    n.includes("tablet") ||
    n.includes("paracetamol") ||
    n.includes("syrup") ||
    c.includes("pharmacy")
  ) {
    return "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80";
  }

  if (
    n.includes("book") ||
    n.includes("pen") ||
    n.includes("notebook") ||
    n.includes("stationery") ||
    c.includes("stationery")
  ) {
    return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80";
  }

  if (
    c.includes("electronics") ||
    c.includes("mobile") ||
    c.includes("tech") ||
    n.includes("phone") ||
    n.includes("laptop") ||
    n.includes("headphone")
  ) {
    return "https://images.unsplash.com/photo-1498047996603-5c9c2f5e4b2f?auto=format&fit=crop&w=800&q=80";
  }

  if (
    c.includes("restaurant") ||
    c.includes("restaurants") ||
    c.includes("food") ||
    n.includes("restaurant") ||
    n.includes("cafe")
  ) {
    return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80";
  }

  if (
    c.includes("home") ||
    c.includes("decor") ||
    c.includes("furniture") ||
    c.includes("kitchen")
  ) {
    return "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80";
  }

  if (
    c.includes("fruits_veg") ||
    c.includes("produce") ||
    c.includes("vegetable") ||
    c.includes("palamuthir")
  ) {
    return "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80";
  }

  if (
    c.includes("grocery") ||
    c.includes("kirana")
  ) {
    return "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80";
  }

  return "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80";
}

const SHOP_IMAGE_VARIANTS: Record<string, string[]> = {
  fruits_veg: [
    "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=800&q=80",
  ],
  meat_fish: [
    "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1510130387422-82bed34b37e9?auto=format&fit=crop&w=800&q=80",
  ],
  bakery: [
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80",
  ],
  grocery: [
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80",
  ],
  pharmacy: [
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
  ],
  restaurants: [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=800&q=80",
  ],
  cafes: [
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=800&q=80",
  ],
  fashion: [
    "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=800&q=80",
  ],
  boutiques: [
    "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80",
  ],
  footwear: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=800&q=80",
  ],
  jewellery: [
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=800&q=80",
  ],
  electronics: [
    "https://images.unsplash.com/photo-1498047996603-5c9c2f5e4b2f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
  ],
  flowers: [
    "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1487070183336-b863922373d4?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=800&q=80",
  ],
  gifts: [
    "https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=800&q=80",
  ],
  mobile: [
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=800&q=80",
  ],
  beauty: [
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80",
  ],
  home_kitchen: [
    "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1556912167-f556f1f39fdf?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
  ],
  furniture: [
    "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
  ],
  hardware: [
    "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1581147036324-c17ac41f8b7b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=800&q=80",
  ],
  books_stationery: [
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
  ],
  sports: [
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
  ],
  toys: [
    "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1560961911-ba7ef651a56c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&w=800&q=80",
  ],
  pet_shops: [
    "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80",
  ],
  pooja: [
    "https://images.unsplash.com/photo-1604608672516-f1b9f2f8f7f8?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=800&q=80",
  ],
  auto: [
    "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1558981359-219d6364c9c8?auto=format&fit=crop&w=800&q=80",
  ],
  repair: [
    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=800&q=80",
  ],
  local_services: [
    "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=800&q=80",
  ],
};

const REPRESENTATIVE_ITEM_IMAGES: Record<string, string[]> = {
  fashion: [
    "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=320&q=75",
    "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=320&q=75",
    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=320&q=75",
    "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=320&q=75",
  ],
  furniture: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=320&q=75",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=320&q=75",
    "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=320&q=75",
    "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=320&q=75",
  ],
};

/** Generic category examples for directory-only shops; never seller stock photos. */
export function getRepresentativeItemImages(category?: string | null, seed?: string | null): string[] {
  const normalized = String(category ?? "").toLowerCase();
  const key = normalized.includes("furniture") ? "furniture" : "fashion";
  const images = REPRESENTATIVE_ITEM_IMAGES[key];
  const seedText = String(seed ?? "localshore-shop");
  const offset = [...seedText].reduce((total, char) => total + char.charCodeAt(0), 0) % images.length;
  return Array.from({ length: 3 }, (_, index) => images[(offset + index) % images.length]);
}

/** Deterministic, category-appropriate storefront fallback for shop cards. */
export function getFallbackShopImage(category?: string | null, seed?: string | null): string {
  const normalized = String(category ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const key = Object.keys(SHOP_IMAGE_VARIANTS).find((candidate) => normalized.includes(candidate));
  const variants = (key && SHOP_IMAGE_VARIANTS[key]) || [getFallbackProductImage("LocalShore shop", category)];
  const seedText = String(seed ?? "localshore-shop");
  const hash = [...seedText].reduce((total, char) => total + char.charCodeAt(0), 0);
  return variants[hash % variants.length];
}

export function isValidImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (trimmed === "" || trimmed === "null" || trimmed === "undefined") return false;
  return true;
}

function shouldUseCategoryFallback(
  url: string | null | undefined,
  name?: string | null,
  category?: string | null,
): boolean {
  if (!url) return true;
  const source = url.toLowerCase();
  const text = `${name ?? ""} ${category ?? ""}`.toLowerCase();

  // These URLs are used by the demo coverage migrations as generic images.
  // Do not show them for a product whose name/category clearly belongs to a
  // different department (for example, rice imagery for cookware).
  if (
    source.includes("photo-1586201375761-83865001e31c") &&
    (/(wheat flour|flour|atta|sugar|salt|oil|tea|biscuit|spice)/.test(text) ||
      !/(rice|grain|grocery|kirana|staple)/.test(text))
  ) {
    return true;
  }
  if (
    source.includes("photo-1542838132-92c53300491e") &&
    (/(oil|ghee|butter|rice|flour|sugar|salt|tea|biscuit|spice)/.test(text) ||
      !/(fruit|vegetable|produce|grocery|kirana|food)/.test(text))
  ) {
    return true;
  }
  if (
    source.includes("photo-1496181133206-80ce9b88a853") &&
    !/(electronic|mobile|phone|laptop|computer|tech)/.test(text)
  ) {
    return true;
  }
  if (
    source.includes("photo-1556911220-e15b29be8c8f") &&
    !/(cookware|kitchen set|pot set)/.test(text)
  ) {
    return true;
  }
  if (
    source.includes("photo-1607623814075-e51df1bdc82f") &&
    !/(meat|fish|chicken|mutton)/.test(text)
  ) {
    return true;
  }
  if (
    source.includes("photo-1504148455328-c376907d081c") &&
    !/(hardware|repair|drill|screw|tool)/.test(text)
  ) {
    return true;
  }
  if (
    source.includes("photo-1596461404969-9ae70f2830c1") &&
    !/(toy|baby|doll|kids|children)/.test(text)
  ) {
    return true;
  }
  if (
    source.includes("photo-1607623814075-e51df1bdc82f") &&
    /(flower|gift|bouquet)/.test(text)
  ) {
    return true;
  }
  return false;
}

export function resolveImageUrl(
  url?: string | null,
  name?: string | null,
  category?: string | null,
): string {
  const fallback = getFallbackProductImage(name, category);
  if (!url || typeof url !== "string") return fallback;
  const trimmed = url.trim();
  if (trimmed === "" || trimmed === "null" || trimmed === "undefined") return fallback;
  if (shouldUseCategoryFallback(trimmed, name, category)) return fallback;
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;

  // If it's a relative storage path (e.g. GUID/filename.jpg), format as a valid Supabase public storage URL
  const SUPABASE_URL =
    import.meta.env.VITE_SUPABASE_URL || "https://flbygucibbrfcwcgzyea.supabase.co";
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${trimmed}`;
}

interface SafeProductImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  productName?: string | null;
  category?: string | null;
  fallbackSrc?: string;
}

export function SafeProductImage({
  src,
  productName,
  category,
  fallbackSrc,
  alt,
  className,
  ...props
}: SafeProductImageProps) {
  const defaultFallback = fallbackSrc || getFallbackProductImage(productName, category);
  const resolvedSrc = resolveImageUrl(src, productName, category);
  const [currentSrc, setCurrentSrc] = useState<string>(resolvedSrc);

  useEffect(() => {
    setCurrentSrc(resolveImageUrl(src, productName, category));
  }, [src, productName, category]);

  return (
    <img
      {...props}
      src={currentSrc}
      alt={alt || productName || "Product"}
      className={className}
      onError={() => {
        if (currentSrc !== defaultFallback) {
          setCurrentSrc(defaultFallback);
        }
      }}
    />
  );
}
