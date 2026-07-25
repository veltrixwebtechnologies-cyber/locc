import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";
import { useToggleWishlist, useWishlist } from "@/lib/merchandising";

export function WishlistButton({ productId, productName }: { productId: string; productName: string }) {
  const auth = useAuth();
  const wishlist = useWishlist();
  const toggle = useToggleWishlist();
  const isSaved = wishlist.data?.some((item: { product_id: string }) => item.product_id === productId) ?? false;

  return (
    <button
      type="button"
      aria-label={isSaved ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`}
      title={isSaved ? "Remove from wishlist" : "Add to wishlist"}
      disabled={toggle.isPending}
      onClick={() => {
        if (!auth.email && !auth.phone) {
          toast.error("Sign in to use your wishlist.");
          return;
        }
        toggle.mutate(
          { productId, active: isSaved },
          {
            onSuccess: () => toast.success(isSaved ? "Removed from wishlist" : "Added to wishlist"),
            onError: (error) => toast.error(error.message || "Could not update wishlist"),
          },
        );
      }}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border hairline bg-background text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
    >
      <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
    </button>
  );
}
