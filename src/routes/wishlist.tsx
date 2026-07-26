import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Loader2, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-store";
import { cartStore } from "@/lib/cart-store";
import { useToggleWishlist, useWishlist, useWishlistProducts, type MerchandisingProduct } from "@/lib/merchandising";
import { APPROVED_STORE } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/wishlist")({
  component: WishlistPage,
});

function WishlistPage() {
  const auth = useAuth();
  const wishlist = useWishlist();
  const products = useWishlistProducts();
  const signedIn = Boolean(auth.email || auth.phone);

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
      void supabase.storage.from("product-images").createSignedUrl(product.image_url, 3600).then(({ data }) => {
        if (active && data?.signedUrl) setImageUrl(data.signedUrl);
      });
    }
    return () => { active = false; };
  }, [product.image_url]);

  const price = Number(product.discount_price ?? product.selling_price);
  const remove = async () => {
    await toggle.mutateAsync({ productId: product.id, active: true });
  };

  return (
    <li className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-black/[0.05]">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
        {imageUrl ? <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{product.name}</p>
        <p className="truncate text-xs text-muted-foreground">{product.shop_name}</p>
        <p className="mt-1 font-mono text-sm">₹{price}</p>
      </div>
      <div className="flex shrink-0 gap-1">
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
            });
            try {
              await remove();
              toast.success("Moved to cart");
            } catch (error: any) {
              toast.error(error?.message ?? "Added to cart, but could not remove from wishlist");
            }
          }}
          className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground"
        >
          <ShoppingBag className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Remove"
          aria-label={`Remove ${product.name} from wishlist`}
          onClick={() => void remove().then(() => toast.success("Removed from wishlist")).catch((error) => toast.error(error.message))}
          className="grid h-9 w-9 place-items-center rounded-lg border hairline text-destructive"
        >
          <Trash2 className="h-4 w-4" />
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
