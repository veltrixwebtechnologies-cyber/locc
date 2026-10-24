import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Star,
  MapPin,
  Store as StoreIcon,
  ShieldCheck,
  Truck,
  ShoppingBag,
  ChevronRight,
  Award,
} from "lucide-react";
import { resolveImageUrl, getFallbackShopImage } from "@/lib/image-utils";
import { WishlistButton } from "@/components/wishlist-button";
import { Badge } from "@/components/ui/badge";

export interface ShopCardData {
  id: string;
  name: string;
  category: string;
  categorySlug?: string;
  imageUrl?: string | null;
  rating: number;
  reviewCount?: number;
  distanceKm?: number;
  isOpen?: boolean;
  closingTime?: string;
  openingTime?: string;
  matchingProductCount?: number;
  featuredProductName?: string;
  startingPrice?: number;
  deliveryAvailable?: boolean;
  pickupAvailable?: boolean;
  isVerified?: boolean;
  isCommunityFavorite?: boolean;
  address?: string;
  city?: string;
  description?: string;
  isFallback?: boolean;
  fallbackZoneName?: string;
  isImported?: boolean;
  claimStatus?: string;
  imageType?: string;
  website?: string;
  googleMapsUrl?: string;
  latitude?: number;
  longitude?: number;
}

interface ShopCardProps {
  shop: ShopCardData;
  searchQuery?: string;
  activeCategory?: string;
  className?: string;
  variant?: "compact" | "standard" | "wide";
  priority?: boolean;
}

const SHOP_CATEGORY_LABELS: Record<string, string> = {
  fruits_veg: "Fresh Produce",
  meat_fish: "Meat & Fish",
  bakery: "Bakery & Sweets",
  grocery: "Kirana & Grocery",
  pharmacy: "Pharmacy & Care",
  fashion: "Fashion & Apparel",
  electronics: "Electronics & Appliances",
  home_kitchen: "Home & Kitchen",
  flowers: "Flower Shops & Florists",
  gifts: "Gift Shops & Novelties",
};

function getShopCategoryLabel(category: string) {
  return SHOP_CATEGORY_LABELS[category.toLowerCase()] ?? category.replaceAll("_", " ");
}

export function ShopCard({
  shop,
  searchQuery,
  activeCategory,
  className = "",
  variant = "standard",
  priority = false,
}: ShopCardProps) {
  const [imgError, setImgError] = useState(false);

  const isClosed = shop.isOpen === false;
  const statusText = isClosed
    ? shop.openingTime
      ? `Opens ${shop.openingTime}`
      : "Closed"
    : shop.closingTime
      ? `Closes ${shop.closingTime}`
      : "Open Now";

  const resolvedImg =
    imgError || !shop.imageUrl
      ? getFallbackShopImage(shop.category, shop.id)
      : resolveImageUrl(shop.imageUrl, shop.name, shop.category);

  const effectiveRating = Number(shop.rating && shop.rating > 0 ? shop.rating : 4.5);
  const effectiveReviews = shop.reviewCount && shop.reviewCount > 0 ? shop.reviewCount : 124;
  const categoryLabelStr = getShopCategoryLabel(shop.category);

  return (
    <div
      className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-card border border-border/80 shadow-xs hover:shadow-xl hover:border-primary/40 transition-all duration-300 ${
        variant === "compact"
          ? "w-[260px] sm:w-[280px] shrink-0"
          : variant === "wide"
            ? "w-full"
            : "w-full max-w-[340px]"
      } ${className}`}
    >
      {/* Top Image Banner */}
      <div className="relative aspect-[16/10] max-[639px]:aspect-[16/8] w-full overflow-hidden bg-muted">
        <img
          src={resolvedImg}
          alt={shop.name}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient Overlay for Readable Badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Wishlist Button */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <WishlistButton
            productId={`shop-${shop.id}`}
            productName={shop.name}
            item={{
              productId: `shop-${shop.id}`,
              name: shop.name,
              shopName: shop.name,
              category: shop.category,
              price: shop.startingPrice || 0,
              imageUrl: shop.imageUrl || "",
              sellerId: shop.id,
            }}
          />
        </div>

        {/* Top-Left Trust Badge */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 rounded-full bg-background/95 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-foreground border border-border/60 shadow-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>Local Partner</span>
        </div>

        {/* Bottom Banner Info: Distance & Status */}
        <div className="absolute bottom-2.5 left-3 right-3 z-10 flex items-center justify-between text-white text-xs font-bold">
          <div className="flex items-center gap-1.5 bg-black/55 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
            <MapPin className="h-3 w-3 text-amber-400" />
            <span>
              {typeof shop.distanceKm === "number" && Number.isFinite(shop.distanceKm) && shop.distanceKm >= 0
                ? shop.distanceKm < 0.1
                  ? "<0.1 km away"
                  : `${shop.distanceKm.toFixed(1)} km away`
                : "Nearby"}
            </span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border backdrop-blur-md ${
              isClosed
                ? "bg-rose-950/80 text-rose-200 border-rose-500/40"
                : "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isClosed ? "bg-rose-400" : "bg-emerald-400 animate-pulse"
              }`}
            />
            <span>{statusText}</span>
          </div>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        {/* Top Info Block with Fixed Height Slots */}
        <div className="space-y-1.5">
          {/* Category Tag & Rating Row */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
              {categoryLabelStr}
            </span>
            <div className="flex items-center gap-1 text-xs font-bold text-foreground shrink-0">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{effectiveRating.toFixed(1)}</span>
              <span className="text-[10px] text-muted-foreground font-medium">
                ({effectiveReviews})
              </span>
            </div>
          </div>

          {/* Shop Title - Strictly 1 Line */}
          <Link
            to="/store/$storeId"
            params={{ storeId: shop.id }}
            search={{ shopLat: shop.latitude, shopLng: shop.longitude, category: activeCategory || shop.category || undefined }}
            className="group/title block"
          >
            <h3 className="text-base font-extrabold text-foreground line-clamp-1 leading-snug group-hover/title:text-primary transition-colors">
              {shop.name}
            </h3>
          </Link>

          {/* Standardized Address Slot (Fixed 2-line height for perfect horizontal alignment) */}
          <div className="h-9 overflow-hidden">
            <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed flex items-start gap-1">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{shop.address || "Local neighborhood store"}</span>
            </p>
          </div>
        </div>

        {/* Middle Feature Strip (Production Delivery & Pickup Promise) */}
        <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-1.5 text-foreground font-medium">
            <Truck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>Fast Delivery</span>
          </span>
          <span className="text-muted-foreground/40">•</span>
          <span className="flex items-center gap-1.5 text-foreground font-medium">
            <ShoppingBag className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Self Pickup</span>
          </span>
        </div>

        {/* Bottom CTA Button - Pinned to Exact Bottom (mt-auto) */}
        <div className="mt-auto pt-1">
          <Link
            to="/store/$storeId"
            params={{ storeId: shop.id }}
            search={{ shopLat: shop.latitude, shopLng: shop.longitude, category: activeCategory || shop.category || undefined }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] py-2.5 px-4 text-xs font-bold text-primary-foreground shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <StoreIcon className="h-3.5 w-3.5" />
            <span>View Local Shop</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
