import { useState } from "react";
import { ShoppingBasket, Pill, PenLine, Croissant } from "lucide-react";
import type { StoreCategory } from "@/lib/mock-data";
import { SafeProductImage } from "@/lib/image-utils";

const iconFor: Partial<Record<StoreCategory, React.ComponentType<{ className?: string }>>> = {
  grocery: ShoppingBasket,
  pharmacy: Pill,
  stationery: PenLine,
  bakery: Croissant,
};

interface Props {
  src?: string;
  alt: string;
  category: StoreCategory;
  size?: "sm" | "lg";
  fit?: "cover" | "contain";
  className?: string;
}

export function ProductThumb({ src, alt, category, size = "sm", fit = "cover", className }: Props) {
  return (
    <div
      data-product-image
      className={`relative shrink-0 overflow-hidden rounded-lg bg-[var(--sand)] ring-1 ring-black/[0.04] ${size === "lg" ? "h-full w-full" : "h-14 w-14"} ${className ?? ""}`}
    >
      <SafeProductImage
        src={src}
        productName={alt}
        category={category}
        alt={alt}
        loading="lazy"
        className={`h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"}`}
      />
    </div>
  );
}
