import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Star, MapPin, Store as StoreIcon, ShieldCheck, Truck, ShoppingBag, Clock, ChevronRight, Award } from "lucide-react";
import { resolveImageUrl, getFallbackProductImage } from "@/lib/image-utils";
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
  startingPrice?: number;
  deliveryAvailable?: boolean;
  pickupAvailable?: boolean;
  isVerified?: boolean;
  isCommunityFavorite?: boolean;
  address?: string;
  city?: string;
  description?: string;
}

interface ShopCardProps {
  shop: ShopCardData;
  searchQuery?: string;
  className?: string;
  variant?: "compact" | "standard" | "wide";
}

export function ShopCard({
  shop,
  searchQuery,
  className = "",
  variant = "standard",
}: ShopCardProps) {
  const [imgError, setImgError] = useState(false);

  const isClosed = shop.isOpen === false;
  const statusText = isClosed
    ? shop.openingTime ? `Opens ${shop.openingTime}` : "Closed"
    : shop.closingTime ? `Closes ${shop.closingTime}` : "Open Now";

  const resolvedImg = imgError || !shop.imageUrl
    ? getFallbackProductImage(shop.name, shop.category)
    : resolveImageUrl(shop.imageUrl, shop.name, shop.category);

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-card border border-border/80 shadow-md hover:shadow-xl hover:border-primary/40 transition-all duration-300 ${
        variant === "compact"
          ? "w-[260px] sm:w-[280px] shrink-0"
          : variant === "wide"
            ? "w-full"
            : "w-full max-w-[340px]"
      } ${className}`}
    >
      {/* Top Image Banner */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        <img
          src={resolvedImg}
          alt={shop.name}
          loading="lazy"
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

        {/* Top-Left Rating Badge */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 rounded-full bg-background/95 backdrop-blur-md px-2.5 py-1 text-xs font-black text-foreground border border-border/60 shadow-xs">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span>{Number(shop.rating || 4.5).toFixed(1)}</span>
          {shop.reviewCount !== undefined && shop.reviewCount > 0 && (
            <span className="text-[10px] text-muted-foreground font-semibold">
              ({shop.reviewCount})
            </span>
          )}
        </div>

        {/* Bottom Banner Info: Distance & Status */}
        <div className="absolute bottom-2.5 left-3 right-3 z-10 flex items-center justify-between text-white text-xs font-bold">
          <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
            <MapPin className="h-3 w-3 text-amber-400" />
            <span>{shop.distanceKm !== undefined ? `${shop.distanceKm.toFixed(1)} km away` : "Local"}</span>
          </div>

          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border backdrop-blur-md ${
              isClosed
                ? "bg-rose-950/80 text-rose-200 border-rose-500/40"
                : "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isClosed ? "bg-rose-400 animate-pulse" : "bg-emerald-400 animate-pulse"
              }`}
            />
            <span>{statusText}</span>
          </div>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Trust & Verification Badges Row */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            {shop.isVerified && (
              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                <span>Verified Store</span>
              </Badge>
            )}
            {shop.isCommunityFavorite && (
              <Badge className="bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                <Award className="h-3 w-3 text-amber-500 fill-amber-400" />
                <span>Community Favorite</span>
              </Badge>
            )}
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {shop.category}
            </span>
          </div>

          {/* Shop Title */}
          <Link
            to="/store/$storeId"
            params={{ storeId: shop.id }}
            search={{ sq: searchQuery, category: undefined }}
            className="group/title block"
          >
            <h3 className="text-lg font-extrabold text-foreground group-hover/title:text-primary transition-colors line-clamp-1 leading-snug">
              🏪 {shop.name}
            </h3>
          </Link>

          {shop.address && (
            <p className="text-xs text-muted-foreground truncate mt-0.5 font-medium">
              {shop.address}
            </p>
          )}
        </div>

        {/* Search Match Context (Relevant products & starting price) */}
        <div className="bg-muted/50 rounded-2xl p-2.5 border border-border/50 space-y-1.5 text-xs">
          {shop.matchingProductCount !== undefined && shop.matchingProductCount > 0 ? (
            <div className="flex items-center justify-between font-bold">
              <span className="text-primary flex items-center gap-1">
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>{shop.matchingProductCount} matching product{shop.matchingProductCount > 1 ? "s" : ""}</span>
              </span>
              {shop.startingPrice !== undefined && shop.startingPrice > 0 && (
                <span className="text-foreground">
                  From <strong className="font-extrabold text-sm">₹{shop.startingPrice.toLocaleString("en-IN")}</strong>
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between text-muted-foreground font-medium">
              <span>Full store catalog listed</span>
              {shop.startingPrice !== undefined && shop.startingPrice > 0 && (
                <span className="text-foreground font-bold">
                  From ₹{shop.startingPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>
          )}

          {/* Delivery & Self-Pickup Badges */}
          <div className="flex items-center gap-3 pt-1 border-t border-border/40 text-[11px] font-extrabold text-muted-foreground">
            <span
              className={`flex items-center gap-1 ${
                shop.deliveryAvailable !== false ? "text-emerald-600 dark:text-emerald-400" : "opacity-40"
              }`}
            >
              <Truck className="h-3.5 w-3.5" />
              <span>Delivery</span>
            </span>
            <span>•</span>
            <span
              className={`flex items-center gap-1 ${
                shop.pickupAvailable !== false ? "text-indigo-600 dark:text-indigo-400" : "opacity-40"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Self Pickup</span>
            </span>
          </div>
        </div>

        {/* View Shop CTA */}
        <Link
          to="/store/$storeId"
          params={{ storeId: shop.id }}
          search={{ sq: searchQuery, category: undefined }}
          className="w-full rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 px-4 text-xs font-extrabold flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200"
        >
          <StoreIcon className="h-3.5 w-3.5" />
          <span>View Local Shop</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
