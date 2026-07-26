import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useActiveCollections,
  useBestSellers,
  useClearance,
  useDeals,
  useFeaturedBrands,
  useNewArrivals,
  useRecommendedProducts,
  useTrending,
  type MerchandisingProduct,
} from "@/lib/merchandising";
import { supabase } from "@/integrations/supabase/client";
import { WishlistButton } from "@/components/wishlist-button";
import { m } from "motion/react";
import { Reveal } from "@/components/motion/presets";

type ProductSectionProps = { title: string; products: MerchandisingProduct[] | undefined };

function ProductCard({ product }: { product: MerchandisingProduct }) {
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
  const discount = product.discount_price && product.mrp > product.discount_price
    ? Math.round(((product.mrp - product.discount_price) / product.mrp) * 100)
    : 0;
  return (
    <m.div
      variants={{
        hidden: { opacity: 0, x: 12 },
        visible: { opacity: 1, x: 0 },
      }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group relative min-w-[190px] overflow-hidden rounded-xl bg-card ring-1 ring-black/[0.05] transition-shadow duration-300 hover:shadow-lg"
    >
      <Link to="/store/$storeId" params={{ storeId: "approved-catalog" }} className="block">
        <div className="aspect-square bg-[var(--sand)]">
          {imageUrl ? <img src={imageUrl} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : null}
        </div>
        <div className="p-3">
          <p className="truncate text-sm font-medium">{product.name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{product.shop_name}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-sm">₹{product.discount_price ?? product.selling_price}</span>
            {product.discount_price && <span className="text-xs text-muted-foreground line-through">₹{product.mrp}</span>}
            {discount > 0 && (
              <m.span
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-[10px] font-semibold text-emerald-700"
              >
                {discount}% off
              </m.span>
            )}
          </div>
          <span className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-[var(--marigold)] text-[var(--marigold)]" /> {Number(product.average_rating).toFixed(1)}
          </span>
        </div>
      </Link>
      <div className="absolute right-2 top-2">
        <WishlistButton productId={product.id} productName={product.name} />
      </div>
    </m.div>
  );
}

function ProductSection({ title, products }: ProductSectionProps) {
  if (!products?.length) return null;
  return (
    <Reveal className="mt-8 px-5 md:px-8">
      <h2 className="font-display text-base font-bold md:text-xl">{title}</h2>
      <m.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={{ visible: { transition: { staggerChildren: 0.055 } } }}
        className="mt-3 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </m.div>
    </Reveal>
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
