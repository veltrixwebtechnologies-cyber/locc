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
} from "lucide-react";
import { resolveImageUrl, getFallbackShopImage } from "@/lib/image-utils";
import { WishlistButton } from "@/components/wishlist-button";

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
  const [isFollowing, setIsFollowing] = useState(false);

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

  const effectiveRating = Number(shop.rating && shop.rating > 0 ? shop.rating : 4.8);
  const effectiveReviews = shop.reviewCount && shop.reviewCount > 0 ? shop.reviewCount : 124;
  const categoryLabelStr = getShopCategoryLabel(shop.category);

  return (
    <div
      className={`group relative flex h-full min-h-[410px] flex-col justify-between overflow-hidden rounded-3xl bg-white border border-[#E2E8F0] shadow-xs hover:shadow-md hover:border-[#8B2FC9]/40 transition-all duration-300 w-full min-w-0 ${className}`}
    >
      {/* ── 1. Fixed Header (Height: 56px) ── */}
      <div className="flex h-[56px] items-center justify-between px-3.5 pt-3 pb-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
          <Link
            to="/store/$storeId"
            params={{ storeId: shop.id }}
            search={{
              shopLat: shop.latitude,
              shopLng: shop.longitude,
              category: activeCategory || shop.category || undefined,
            }}
            className="relative h-9 w-9 shrink-0 rounded-full p-[2px] bg-gradient-to-tr from-[#8B2FC9] via-[#F59E0B] to-[#D270D7] hover:scale-105 transition-transform"
          >
            <img
              src={resolvedImg}
              alt={shop.name}
              className="h-full w-full rounded-full object-cover bg-white"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <Link
                to="/store/$storeId"
                params={{ storeId: shop.id }}
                search={{
                  shopLat: shop.latitude,
                  shopLng: shop.longitude,
                  category: activeCategory || shop.category || undefined,
                }}
                className="text-xs font-bold text-[#0F172A] truncate hover:text-[#8B2FC9] transition block leading-tight"
              >
                {shop.name}
              </Link>
              <span
                title="Verified Local Partner"
                className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#8B2FC9] text-[8px] text-white font-bold"
              >
                ✓
              </span>
            </div>
            <p className="text-[10px] text-[#746A85] truncate leading-none mt-1">
              {categoryLabelStr}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsFollowing((prev) => !prev)}
          className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold transition cursor-pointer h-7 flex items-center justify-center ${
            isFollowing
              ? "bg-[#F8FAFC] border border-[#8B2FC9]/30 text-[#8B2FC9]"
              : "bg-[#F8FAFC] border border-[#E2E8F0] text-[#8B2FC9] hover:bg-[#8B2FC9] hover:text-white"
          }`}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      </div>

      {/* ── 2. Fixed Aspect Image Showcase ── */}
      <div className="px-3.5 w-full shrink-0">
        <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-900 shadow-xs">
          <img
            src={resolvedImg}
            alt={shop.name}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Gradient Overlay for Badges */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />

          {/* Wishlist Button */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <WishlistButton
              productId={`shop-${shop.id}`}
              productName={shop.name}
              entityType="shop"
              item={{
                productId: `shop-${shop.id}`,
                name: shop.name,
                shopName: shop.name,
                category: shop.category,
                price: 0,
                imageUrl: shop.imageUrl || "",
                sellerId: shop.id,
                itemType: "shop",
              }}
            />
          </div>

          {/* Top-Left Trust Badge */}
          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white border border-white/20 shadow-xs">
            <ShieldCheck className="h-3 w-3 text-[#F59E0B]" />
            <span>Local Partner</span>
          </div>

          {/* Bottom Banner Info: Distance & Status */}
          <div className="absolute bottom-2 left-2.5 right-2.5 z-10 flex items-center justify-between text-white text-[11px] font-bold">
            <div className="flex items-center gap-1 bg-black/55 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20">
              <MapPin className="h-3 w-3 text-[#F59E0B]" />
              <span>
                {typeof shop.distanceKm === "number" && Number.isFinite(shop.distanceKm) && shop.distanceKm >= 0
                  ? shop.distanceKm < 0.1
                    ? "<0.1 km away"
                    : `${shop.distanceKm.toFixed(1)} km away`
                  : "Nearby"}
              </span>
            </div>

            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border backdrop-blur-md ${
                isClosed
                  ? "bg-rose-950/80 text-rose-200 border-rose-500/40"
                  : "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isClosed ? "bg-rose-400" : "bg-emerald-400 animate-pulse"
                }`}
              />
              <span>{statusText}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Fixed Body (Address, Strip & CTA Button) ── */}
      <div className="p-3.5 pt-2.5 flex-1 flex flex-col justify-between gap-2.5">
        {/* Standardized 2-line Address Slot (Fixed 36px height for strict equal alignment across all cards) */}
        <div className="h-9 overflow-hidden flex items-start justify-between gap-2 shrink-0">
          <p className="line-clamp-2 text-xs text-[#746A85] leading-relaxed flex items-start gap-1 min-w-0 flex-1">
            <MapPin className="h-3.5 w-3.5 text-[#8B2FC9] shrink-0 mt-0.5" />
            <span className="line-clamp-2">{shop.address || "Local neighborhood store"}</span>
          </p>
          <div className="flex items-center gap-1 text-xs font-bold text-[#0F172A] shrink-0 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 leading-none mt-0.5">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>{effectiveRating.toFixed(1)}</span>
          </div>
        </div>

        {/* Delivery & Self Pickup Strip (Height: 32px) */}
        <div className="h-8 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/60 px-2.5 flex items-center justify-between text-[11px] font-semibold text-[#746A85] shrink-0">
          <span className="flex items-center gap-1 text-[#0F172A] font-medium">
            <Truck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>Fast Delivery</span>
          </span>
          <span className="text-[#E2E8F0]">•</span>
          <span className="flex items-center gap-1 text-[#0F172A] font-medium">
            <ShoppingBag className="h-3.5 w-3.5 text-[#8B2FC9] shrink-0" />
            <span>Self Pickup</span>
          </span>
        </div>

        {/* View Local Shop CTA Button (Height: 36px) */}
        <div className="pt-0.5 mt-auto">
          <Link
            to="/store/$storeId"
            params={{ storeId: shop.id }}
            search={{
              shopLat: shop.latitude,
              shopLng: shop.longitude,
              category: activeCategory || shop.category || undefined,
            }}
            className="w-full h-9 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#8B2FC9] to-[#581C87] hover:opacity-95 active:scale-[0.98] px-3 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
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
