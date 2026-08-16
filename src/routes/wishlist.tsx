import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Loader2, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-store";
import { cartStore } from "@/lib/cart-store";
import { resolveProductImageUrl, useToggleWishlist, useWishlist, useWishlistProducts, type MerchandisingProduct } from "@/lib/merchandising";
import { APPROVED_STORE } from "@/lib/mock-data";

export const Route = createFileRoute("/wishlist")({
  component: WishlistPage,
});

function WishlistPage() {
  const auth = useAuth();
  const wishlist = useWishlist();
  const products = useWishlistProducts();
  const signedIn = Boolean(auth.id);

  return (
    <AppShell>
      <div className="px-5 pt-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Saved products</p>
        <h1 className="mt-1 font-display text-3xl">Wishlist</h1>
      </div>

      {!signedIn ? (
        <EmptyState title="Sign in to view your wishlist">
          <Link to="/auth" search={{ redirect: "/wishlist" }} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Sign in
          </Link>
        </EmptyState>
      ) : wishlist.isLoading || products.isLoading ? (
        <div className="py-16 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" /></div>
      ) : wishlist.error || products.error ? (
        <EmptyState title="Wishlist could not be loaded">
          <button type="button" onClick={() => { void wishlist.refetch(); void products.refetch(); }} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Try again
          </button>
        </EmptyState>
      ) : !products.data?.length ? (
        <EmptyState title="Your wishlist is empty">
          <Link to="/" search={{ category: undefined, q: undefined }} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Find products
          </Link>
        </EmptyState>
      ) : (
        <ul className="mx-5 mt-5 grid gap-3 pb-8 md:grid-cols-2">
          {products.data.map((product) => <WishlistRow key={product.id} product={product} />)}
        </ul>
      )}
    </AppShell>
  );
}

function WishlistRow({ product }: { product: MerchandisingProduct }) {
  const toggle = useToggleWishlist();
  const [imageUrl, setImageUrl] = useState(product.image_url ?? "");

  useEffect(() => {
    let active = true;
    if (product.image_url && !/^(https?:|data:)/i.test(product.image_url)) {
      void resolveProductImageUrl(product.image_url).then((url) => {
        if (active && url) setImageUrl(url);
      });
    }
    return () => { active = false; };
  }, [product.image_url]);

  const price = Number(product.discount_price ?? product.selling_price);
  const remove = async () => {
    await toggle.mutateAsync({ productId: product.id, active: true });
  };

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-[#ead9a8] bg-card p-3 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
        {imageUrl ? <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <Link to="/product/$productId" params={{ productId: product.id }} className="block truncate text-sm font-semibold hover:text-primary hover:underline">{product.name}</Link>
        <p className="truncate text-xs text-muted-foreground">{product.shop_name}</p>
        <p className="mt-1 font-mono text-sm">₹{price}</p>
      </div>
      <div className="flex w-full shrink-0 gap-2 sm:w-auto">
        <button
          type="button"
          title="Move to cart"
          aria-label={`Move ${product.name} to cart`}
          onClick={async () => {
            cartStore.add(product.seller_id || APPROVED_STORE.id, product.shop_name || APPROVED_STORE.name, {
              id: product.id,
              name: product.name,
              unit: product.category ?? "",
              price,
              stock: product.stock,
            });
            try {
              await remove();
              toast.success("Moved to cart");
            } catch (error: any) {
              toast.error(error?.message ?? "Added to cart, but could not remove from wishlist");
            }
          }}
          disabled={toggle.isPending}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 sm:flex-none"
        >
          <ShoppingBag className="h-3.5 w-3.5" /> Add to cart
        </button>
        <button
          type="button"
          title="Remove"
          aria-label={`Remove ${product.name} from wishlist`}
          disabled={toggle.isPending}
          onClick={() => void remove().then(() => toast.success("Removed from wishlist")).catch((error) => toast.error(error.message))}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border hairline px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-60"
        >
          <Trash2 className="h-3.5 w-3.5" /> Remove
        </button>
      </div>
    </li>
  );
}

function EmptyState({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-5 mt-8 rounded-xl border hairline bg-card p-8 text-center">
      <Heart className="mx-auto h-7 w-7 text-primary" />
      <p className="mt-3 font-display text-lg">{title}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}
