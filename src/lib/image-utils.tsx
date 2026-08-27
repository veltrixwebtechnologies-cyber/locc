import { useState, useEffect, ImgHTMLAttributes } from "react";

export function getFallbackProductImage(name?: string | null, category?: string | null): string {
  const n = (name || "").toLowerCase();
  const c = (category || "").toLowerCase();

  if (
    n.includes("tiramisu") ||
    n.includes("cake") ||
    n.includes("bread") ||
    n.includes("pastry") ||
    n.includes("bakery") ||
    n.includes("cookie") ||
    c.includes("bakery")
  ) {
    return "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80";
  }

  if (
    n.includes("coconut oil") ||
    n.includes("oil") ||
    n.includes("ghee") ||
    n.includes("butter")
  ) {
    return "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80";
  }

  if (
    n.includes("rice") ||
    n.includes("sona") ||
    n.includes("grain") ||
    n.includes("flour") ||
    n.includes("atta") ||
    n.includes("basmati")
  ) {
    return "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80";
  }

  if (
    n.includes("dal") ||
    n.includes("pulse") ||
    n.includes("lentil") ||
    n.includes("toor") ||
    n.includes("moong")
  ) {
    return "https://images.unsplash.com/photo-1585996847058-2997e01b3b3a?auto=format&fit=crop&w=600&q=80";
  }

  if (n.includes("egg") || n.includes("eggs")) {
    return "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80";
  }

  if (
    n.includes("milk") ||
    n.includes("amul") ||
    n.includes("dairy") ||
    n.includes("curd") ||
    n.includes("paneer") ||
    n.includes("cheese")
  ) {
    return "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80";
  }

  if (
    n.includes("med") ||
    n.includes("pharma") ||
    n.includes("tablet") ||
    n.includes("paracetamol") ||
    n.includes("syrup") ||
    c.includes("pharmacy")
  ) {
    return "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80";
  }

  if (
    n.includes("book") ||
    n.includes("pen") ||
    n.includes("notebook") ||
    n.includes("stationery") ||
    n.includes("sudhan") ||
    n.includes("sss") ||
    c.includes("stationery")
  ) {
    return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80";
  }

  return "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";
}

export function isValidImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (trimmed === "" || trimmed === "null" || trimmed === "undefined") return false;
  return true;
}

export function resolveImageUrl(url?: string | null, name?: string | null, category?: string | null): string {
  const fallback = getFallbackProductImage(name, category);
  if (!url || typeof url !== "string") return fallback;
  const trimmed = url.trim();
  if (trimmed === "" || trimmed === "null" || trimmed === "undefined") return fallback;
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;
  
  // If it's a relative storage path (e.g. GUID/filename.jpg), format as a valid Supabase public storage URL
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://flbygucibbrfcwcgzyea.supabase.co";
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
