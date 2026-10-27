import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";
import { useToggleWishlist, useWishlist, type WishlistCatalogItem } from "@/lib/merchandising";
import { AnimatePresence, m } from "motion/react";

export function WishlistButton({
  productId,
  productName,
  entityType = "product",
  className = "",
  item,
}: {
  productId: string;
  productName: string;
  entityType?: "product" | "shop";
  className?: string;
  item?: WishlistCatalogItem;
}) {
  const auth = useAuth();
  const wishlist = useWishlist();
  const toggle = useToggleWishlist();
  const isSaved =
    wishlist.data?.some((item: { product_id: string }) => item.product_id === productId) ?? false;

  const targetName = entityType === "shop" ? "favorite shops" : "wishlist";

  return (
    <m.button
      type="button"
      aria-label={
        isSaved ? `Remove ${productName} from ${targetName}` : `Add ${productName} to ${targetName}`
      }
      title={isSaved ? `Remove from ${targetName}` : `Save to ${targetName}`}
      disabled={toggle.isPending}
      onClick={() => {
        if (!auth.id) {
          toast.error("Sign in to save items to your wishlist.");
          return;
        }
        toggle.mutate(
          { productId, active: isSaved, item },
          {
            onSuccess: () =>
              toast.success(
                isSaved ? `Removed from ${targetName}` : `Saved to ${targetName}`,
              ),
            onError: (error) => toast.error(error.message || `Could not update ${targetName}`),
          },
        );
      }}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border hairline bg-background text-primary transition-colors hover:bg-primary/10 disabled:opacity-50 ${className}`}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.88 }}
      animate={{ scale: isSaved ? [1, 1.2, 1] : 1 }}
      transition={{ duration: 0.28 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={isSaved ? "saved" : "empty"}
          initial={{ scale: 0.55, opacity: 0, rotate: -12 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.55, opacity: 0, rotate: 12 }}
          className="inline-flex"
        >
          <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
        </m.span>
      </AnimatePresence>
    </m.button>
  );
}
