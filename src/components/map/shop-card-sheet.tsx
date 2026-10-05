import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  MapPin,
  Star,
  Navigation,
  ArrowRight,
  Clock,
  CheckCircle2,
  Store as StoreIcon,
  X,
} from "lucide-react";
import type { MapMarkerItem } from "@/lib/map-service/types";
import { categoryColor, categoryLabel } from "@/lib/mock-data";
import { getFallbackProductImage, getRepresentativeItemImages, isValidImageUrl } from "@/lib/image-utils";
import { fetchMapRoute } from "@/lib/map-service/providers";
import { toast } from "sonner";

interface Props {
  marker: MapMarkerItem;
  userLocation: { lat: number; lng: number };
  onClose: () => void;
  onDirectionsCalculated?: (
    geometry: [number, number][],
    distanceKm: number,
    durationMins: number,
  ) => void;
}

export function ShopCardSheet({ marker, userLocation, onClose, onDirectionsCalculated }: Props) {
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleDirections = async () => {
    setLoadingRoute(true);
    try {
      const route = await fetchMapRoute(userLocation, { lat: marker.lat, lng: marker.lng });
      if (route) {
        const distKm = Math.round(((route.distanceMeters ?? 0) / 1000) * 10) / 10;
        const durMins = Math.round((route.durationSeconds ?? 0) / 60);
        onDirectionsCalculated?.(route.geometry, distKm, durMins);
        toast.success(`Route calculated: ${distKm} km (${durMins} mins drive)`);
      } else {
        toast.error("Could not calculate route to shop.");
      }
    } catch (err) {
      toast.error("Failed to load directions.");
    } finally {
      setLoadingRoute(false);
    }
  };

  const imageSrc = isValidImageUrl(marker.productImage)
    ? marker.productImage
    : getFallbackProductImage(marker.productName, marker.category);

  const catBg = categoryColor[marker.category] || "#111827";
  const catLabelStr = categoryLabel[marker.category] || marker.category;

  // Strikethrough estimate price for showcase
  const originalPrice = Math.round(marker.minPrice * 1.15);

  if (marker.isImported) {
    return (
      <div className="animate-in slide-in-from-bottom-6 fade-in-20 duration-300 pointer-events-auto relative w-full max-w-lg overflow-hidden rounded-[28px] border border-border bg-card p-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-900">Public listing · {marker.claimStatus === "unclaimed" ? "Unclaimed" : marker.claimStatus}</span>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80" aria-label="Close card"><X className="h-4 w-4" /></button>
        </div>
        <img src={imageSrc} alt={`${marker.shopName} ${marker.imageType === "seller" ? "seller" : "representative"} ${marker.category} image`} loading="lazy" className="aspect-[16/8] w-full rounded-2xl border border-border/50 bg-muted object-cover" onError={(event) => { event.currentTarget.src = getFallbackProductImage(marker.shopName, marker.category); }} />
        <div className="mt-3 space-y-2 px-1">
          <div className="flex items-start justify-between gap-3">
            <div><h3 className="font-display text-base font-extrabold text-foreground">{marker.shopName}</h3><p className="mt-1 text-xs text-muted-foreground">{marker.category} · {marker.distanceKm.toFixed(1)} km away</p></div>
            {marker.rating > 0 && <div className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1 text-xs font-bold"><Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />{marker.rating.toFixed(1)}{marker.reviewCount != null && <span className="text-muted-foreground">({marker.reviewCount})</span>}</div>}
          </div>
          {marker.address && <p className="text-xs leading-relaxed text-muted-foreground">{marker.address}</p>}
          <p className="text-[11px] text-muted-foreground">{marker.imageType === "seller" ? "Image supplied by the claimed seller." : "Representative category image; not a photo of this business."} {marker.claimStatus === "unclaimed" && "This public listing has no LocalShore seller catalog and cannot accept orders."}</p>
          <div>
            <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground">Example product imagery · representative only, not shop stock</p>
            <div className="grid grid-cols-3 gap-2" aria-label="Representative category product imagery">
              {getRepresentativeItemImages(marker.category, marker.shopId).map((imageUrl, index) => (
                <img key={`${marker.id}-example-${index}`} src={imageUrl} alt={`${marker.category} representative product example ${index + 1}`} loading="lazy" decoding="async" className="h-16 w-full rounded-lg border border-border/60 bg-muted object-cover" />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <Link to="/store/$storeId" params={{ storeId: marker.shopId }} search={{ shopLat: marker.lat, shopLng: marker.lng }} className="flex items-center justify-center gap-1.5 rounded-2xl bg-foreground px-3 py-2.5 text-xs font-bold text-background">View Local Shop <ArrowRight className="h-4 w-4" /></Link>
          <button onClick={handleDirections} disabled={loadingRoute} className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-muted/60 px-3 py-2.5 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-50"><Navigation className={`h-4 w-4 text-primary ${loadingRoute ? "animate-spin" : ""}`} />{loadingRoute ? "Routing…" : "Directions"}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-bottom-6 fade-in-20 duration-300 pointer-events-auto relative w-full max-w-lg overflow-hidden rounded-[28px] border border-border bg-card p-4 shadow-2xl backdrop-blur-xl">
      {/* Top Banner Tag */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
          <span>🏷️</span>
          <span>Prices include all local taxes & delivery</span>
        </div>
        <button
          onClick={onClose}
          className="grid h-7 w-7 place-items-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
          aria-label="Close card"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Shop Card Image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-muted border border-border/50">
        <img
          src={imageSrc}
          alt={marker.productName}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = getFallbackProductImage(
              marker.productName,
              marker.category,
            );
          }}
        />

        {/* Guest favourite / Verified Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-extrabold text-gray-900 shadow-md backdrop-blur-xs">
          <span>🏆</span>
          <span>{marker.distanceKm <= 2 ? "Guest favourite" : "Verified Shop"}</span>
        </div>

        {/* Wishlist Button */}
        <button
          onClick={() => {
            setIsWishlisted(!isWishlisted);
            toast.success(
              isWishlisted ? "Removed from Wishlist" : `Saved ${marker.shopName} to Wishlist`,
            );
          }}
          className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur-xs hover:bg-black/60 transition-colors"
        >
          <svg
            className={`h-5 w-5 stroke-current stroke-[2.2] transition-colors ${
              isWishlisted ? "fill-rose-500 stroke-rose-500" : "fill-none text-white"
            }`}
            viewBox="0 0 24 24"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Category Pill Tag */}
        <span
          className="absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow-md backdrop-blur-xs"
          style={{ backgroundColor: catBg }}
        >
          {catLabelStr}
        </span>
      </div>

      {/* Card Details Section */}
      <div className="mt-3.5 space-y-2 px-1">
        {/* Title & Rating */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-extrabold text-foreground line-clamp-1">
              {marker.shopName}
            </h3>
            <p className="text-xs font-medium text-muted-foreground line-clamp-1">
              {marker.productName} · {marker.distanceKm.toFixed(1)} km away
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1 text-xs font-extrabold text-foreground shrink-0 border border-amber-500/20">
            <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
            <span>{marker.rating.toFixed(2)}</span>
            <span className="font-normal text-muted-foreground">
              ({Math.floor(marker.rating * 15)})
            </span>
          </div>
        </div>

        {/* Instant delivery indicator */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span>In Stock · Available for instant local pickup & fast delivery</span>
        </div>

        {/* Pricing Line */}
        <div className="flex items-baseline gap-2 pt-1 border-t border-border/50">
          <span className="text-xs text-muted-foreground line-through font-medium">
            ₹{originalPrice}
          </span>
          <span className="font-display text-xl font-black text-foreground">
            {marker.priceDisplay}
          </span>
          <span className="text-xs text-muted-foreground font-medium">total per item</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Link
          to="/store/$storeId"
          params={{ storeId: marker.shopId }}
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-foreground px-4 py-2.5 text-xs font-bold text-background shadow-md hover:opacity-95 active:scale-[0.98] transition-transform"
        >
          <span>Open Shop</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
        <button
          onClick={handleDirections}
          disabled={loadingRoute}
          className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-muted/60 px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          <Navigation className={`h-4 w-4 text-primary ${loadingRoute ? "animate-spin" : ""}`} />
          <span>{loadingRoute ? "Routing..." : "Directions"}</span>
        </button>
      </div>
    </div>
  );
}
