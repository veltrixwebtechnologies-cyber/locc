import { Link } from "@tanstack/react-router";
import { Heart, Star } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useActiveCollections,
  useBestSellers,
  useClearance,
  useDeals,
  useFeaturedBrands,
  useNewArrivals,
  useRecommendedProducts,
  useToggleWishlist,
  useTrending,
  useWishlist,
  type MerchandisingProduct,
} from "@/lib/merchandising";
import { useAuth } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ProductSectionProps = { title: string; products: MerchandisingProduct[] | undefined };

function ProductCard({ product }: { product: MerchandisingProduct }) {
  const auth = useAuth();
  const wishlist = useWishlist();
  const toggle = useToggleWishlist();
  const [imageUrl, setImageUrl] = useState(product.image_url ?? "");
  useEffect(() => {
    let mounted = true;
    if (product.image_url && !/^(https?:|data:)/i.test(product.image_url)) {
      void supabase.storage.from("product-images").createSignedUrl(product.image_url, 3600).then(({ data }) => {
        if (mounted && data?.signedUrl) setImageUrl(data.signedUrl);
      });
    }
    return () => { mounted = false; };
  }, [product.image_url]);
  const isSaved = wishlist.data?.some((item: { product_id: string }) => item.product_id === product.id) ?? false;
  const discount = product.discount_price && product.mrp > product.discount_price
    ? Math.round(((product.mrp - product.discount_price) / product.mrp) * 100)
    : 0;
  return (
    <div className="relative min-w-[190px] overflow-hidden rounded-xl bg-card ring-1 ring-black/[0.05]">
      <Link to="/store/$storeId" params={{ storeId: "approved-catalog" }} className="block">
        <div className="aspect-square bg-[var(--sand)]">
          {imageUrl ? <img src={imageUrl} alt={product.name} loading="lazy" className="h-full w-full object-cover" /> : null}
        </div>
        <div className="p-3">
          <p className="truncate text-sm font-medium">{product.name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{product.shop_name}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-sm">₹{product.discount_price ?? product.selling_price}</span>
            {product.discount_price && <span className="text-xs text-muted-foreground line-through">₹{product.mrp}</span>}
            {discount > 0 && <span className="text-[10px] font-semibold text-emerald-700">{discount}% off</span>}
          </div>
          <span className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-[var(--marigold)] text-[var(--marigold)]" /> {Number(product.average_rating).toFixed(1)}
          </span>
        </div>
      </Link>
      <button
        type="button"
        aria-label={isSaved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        onClick={() => {
          if (!auth.email && !auth.phone) {
            toast.error("Sign in to use your wishlist.");
            return;
          }
          toggle.mutate({ productId: product.id, active: isSaved });
        }}
        className="absolute right-2 top-2 rounded-full bg-background/90 p-2 text-primary shadow-sm"
      >
        <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
      </button>
    </div>
  );
}

function ProductSection({ title, products }: ProductSectionProps) {
  if (!products?.length) return null;
  return (
    <section className="mt-8 px-5 md:px-8">
      <h2 className="font-display text-base font-bold md:text-xl">{title}</h2>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}

export function MerchandisingSections() {
  const arrivals = useNewArrivals();
  const deals = useDeals();
  const clearance = useClearance();
  const trending = useTrending();
  const recommendations = useRecommendedProducts();
  const collections = useActiveCollections();
  const brands = useFeaturedBrands();
  const [period, setPeriod] = useState<"today" | "this_week" | "this_month" | "all_time">("all_time");
  const best = useBestSellers(period);

  return (
    <div>
      <ProductSection title="New Arrivals" products={arrivals.data} />
      <section className="mt-8 px-5 md:px-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-bold md:text-xl">Best Sellers</h2>
          <select value={period} onChange={(event) => setPeriod(event.target.value as typeof period)} className="rounded-md bg-card px-2 py-1 text-xs ring-1 ring-black/[0.08]">
            <option value="today">Today</option><option value="this_week">This week</option><option value="this_month">This month</option><option value="all_time">All time</option>
          </select>
        </div>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{best.data?.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>
      <ProductSection title="Trending" products={trending.data} />
      <ProductSection title="Deals & Discounts" products={deals.data} />
      <ProductSection title="Clearance Sale" products={clearance.data} />
      <ProductSection title="Recommended for you" products={recommendations.data} />
      {(brands.data?.length || collections.data?.gift.length || collections.data?.seasonal.length) ? (
        <section className="mt-8 px-5 pb-6 md:px-8">
          <h2 className="font-display text-base font-bold md:text-xl">Explore collections</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[...(collections.data?.gift ?? []), ...(collections.data?.seasonal ?? [])].map((collection: any) => (
              <div key={collection.id} className="rounded-xl bg-card p-4 ring-1 ring-black/[0.05]"><p className="font-medium">{collection.name}</p><p className="mt-1 text-xs text-muted-foreground">{collection.description ?? "Shop the collection"}</p></div>
            ))}
            {(brands.data ?? []).map((brand: any) => <div key={brand.brand_id} className="rounded-xl bg-card p-4 ring-1 ring-black/[0.05]"><p className="font-medium">{brand.brands?.name ?? "Featured brand"}</p><p className="mt-1 text-xs text-muted-foreground">Featured brand</p></div>)}
          </div>
        </section>
      ) : null}
    </div>
  );
}
