import { useState } from "react";
import { ShoppingBasket, Pill, PenLine, Croissant } from "lucide-react";
import type { StoreCategory } from "@/lib/mock-data";

const iconFor: Record<StoreCategory, React.ComponentType<{ className?: string }>> = {
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
}

export function ProductThumb({ src, alt, category, size = "sm" }: Props) {
  const [failed, setFailed] = useState(false);
  const Icon = iconFor[category];
  const showPlaceholder = !src || failed;

  return (
    <div data-product-image className={`relative shrink-0 overflow-hidden rounded-lg bg-[var(--sand)] ring-1 ring-black/[0.04] ${size === "lg" ? "h-full w-full" : "h-14 w-14"}`}>
      {showPlaceholder ? (
        <div className="flex h-full w-full items-center justify-center bg-[color-mix(in_oklab,var(--teal)_10%,var(--sand))]">
          <Icon className="h-6 w-6 text-[var(--teal)] opacity-70" />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
