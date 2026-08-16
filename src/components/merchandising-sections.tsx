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
  useRecentlyViewed,
  useTrending,
  useActiveFlashSales,
  useFlashSaleProducts,
  recordProductEvent,
  recordRecentProductView,
  resolveProductImageUrl,
  type MerchandisingProduct,
} from "@/lib/merchandising";
import { WishlistButton } from "@/components/wishlist-button";
import { m } from "motion/react";
import { Reveal, cardMotion, spring } from "@/components/motion/presets";
import { cartStore, useCart } from "@/lib/cart-store";
import { QtyStepper } from "@/components/qty-stepper";
import { flyProductToCart } from "@/lib/fly-to-cart";

type ProductSectionProps = { title: string; products: MerchandisingProduct[] | undefined };

export function ProductCard({ product }: { product: MerchandisingProduct }) {
  const [imageUrl, setImageUrl] = useState(product.image_url ?? "");
  const cart = useCart();
  const quantity = cart.lines.find((line) => line.productId === product.id)?.qty ?? 0;
  useEffect(() => {
    let mounted = true;
    if (product.image_url && !/^(https?:|data:)/i.test(product.image_url)) {
      void resolveProductImageUrl(product.image_url).then((url) => {
        if (mounted && url) setImageUrl(url);
      });
    }
    return () => {
      mounted = false;
    };
  }, [product.image_url]);
  const discount =
    product.discount_price && product.mrp > product.discount_price
      ? Math.round(((product.mrp - product.discount_price) / product.mrp) * 100)
      : 0;
  return (
    <m.div
      variants={cardMotion}
      whileHover={{ y: -4, scale: 1.012 }}
      whileTap={{ scale: 0.965 }}
      transition={spring}
      data-product-id={product.id}
      className="group relative min-w-[164px] max-w-[164px] overflow-hidden rounded-lg bg-card ring-1 ring-black/[0.06] transition-shadow duration-300 hover:shadow-lg md:min-w-[184px] md:max-w-[184px]"
    >
      <Link
        to="/product/$productId"
        params={{ productId: product.id }}
        className="block"
        onClick={() => {
          void recordProductEvent(product.id, "view");
          void recordRecentProductView(product.id);
        }}
      >
        <div className="relative aspect-square bg-[var(--sand)]">
          {imageUrl ? (
            <m.div layoutId={`product-image-${product.id}`} className="h-full w-full">
              <img
                src={imageUrl}
                alt={product.name}
                loading="lazy"
                decoding="async"
                data-product-image
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </m.div>
          ) : null}
          <span className="absolute bottom-2 left-2 rounded bg-background/95 px-1.5 py-1 text-[9px] font-bold text-foreground shadow-sm">
            20-40 min
          </span>
        </div>
        <div className="px-3 pt-3">
          <p className="line-clamp-2 min-h-10 text-sm font-semibold leading-5">{product.name}</p>
          <p className="mt-1 truncate text-[11px] text-muted-foreground">
            {product.category || product.shop_name}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-sm font-bold">
              ₹{product.discount_price ?? product.selling_price}
            </span>
            {product.discount_price && (
              <span className="text-xs text-muted-foreground line-through">₹{product.mrp}</span>
            )}
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
          <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Star className="h-3 w-3 fill-[var(--marigold)] text-[var(--marigold)]" />{" "}
            {Number(product.average_rating).toFixed(1)}
          </span>
        </div>
      </Link>
      <div className="absolute right-2 top-2">
        <WishlistButton
          productId={product.id}
          productName={product.name}
          item={{ productId: product.id, name: product.name, shopName: product.shop_name, category: product.category ?? "Other", price: Number(product.discount_price ?? product.selling_price), imageUrl: product.image_url ?? undefined, sellerId: product.seller_id }}
        />
      </div>
      <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-2">
        <p className="min-w-0 truncate text-[10px] text-muted-foreground">{product.shop_name}</p>
        <QtyStepper
          qty={quantity}
          max={product.stock}
          onAdd={() => {
            void recordProductEvent(product.id, "add_to_cart");
            flyProductToCart(product.id);
            cartStore.add(product.seller_id, product.shop_name, {
              id: product.id,
              name: product.name,
              unit: product.category ?? "",
              price: Number(product.discount_price ?? product.selling_price),
              stock: product.stock,
            });
          }}
          onChange={(nextQuantity) => cartStore.setQty(product.id, nextQuantity)}
        />
      </div>
    </m.div>
  );
}

function ProductSection({ title, products }: ProductSectionProps) {
  if (!products?.length) return null;
  return (
    <Reveal className="mt-8 px-5 md:px-8">
      <h2 className="font-display text-lg font-bold md:text-xl">{title}</h2>
      <m.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={{ visible: { transition: { staggerChildren: 0.055 } } }}
        className="mt-3 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </m.div>
    </Reveal>
  );
}

export function MerchandisingSections({
  fallbackProducts = [],
}: {
  fallbackProducts?: MerchandisingProduct[];
}) {
  const arrivals = useNewArrivals();
  const deals = useDeals();
  const clearance = useClearance();
  const trending = useTrending();
  const recommendations = useRecommendedProducts();
  const recentlyViewed = useRecentlyViewed();
  const collections = useActiveCollections();
  const brands = useFeaturedBrands();
  const flashSales = useActiveFlashSales();
  const flashProductIds = (flashSales.data ?? []).flatMap((sale: any) => (sale.flash_sale_products ?? []).map((item: any) => item.product_id));
  const flashProducts = useFlashSaleProducts(flashProductIds);
  const [period, setPeriod] = useState<"today" | "this_week" | "this_month" | "all_time">(
    "all_time",
  );
  const best = useBestSellers(period);

  return (
    <div>
      <ProductSection title="Products near you" products={fallbackProducts} />
      {best.data?.length ? (
        <section className="mt-8 px-5 md:px-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-bold md:text-xl">Best Sellers</h2>
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value as typeof period)}
              className="rounded-md bg-card px-2 py-1 text-xs ring-1 ring-black/[0.08]"
            >
              <option value="today">Today</option>
              <option value="this_week">This week</option>
              <option value="this_month">This month</option>
              <option value="all_time">All time</option>
            </select>
          </div>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {best.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}
      <ProductSection title="Trending" products={trending.data} />
      <ProductSection title="Deals & Discounts" products={deals.data} />
      <ProductSection title="Clearance Sale" products={clearance.data} />
      <ProductSection title="Flash Sales" products={flashProducts.data} />
      <ProductSection title="Recently viewed" products={recentlyViewed.data} />
      <ProductSection title="Recommended for you" products={recommendations.data} />
      {brands.data?.length || collections.data?.gift.length || collections.data?.seasonal.length ? (
        <section className="mt-8 px-5 pb-6 md:px-8">
          <h2 className="font-display text-base font-bold md:text-xl">Explore collections</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[...(collections.data?.gift ?? []), ...(collections.data?.seasonal ?? [])].map(
              (collection: any) => (
                <Link
                  key={collection.id}
                  to="/collection/$collectionId"
                  params={{ collectionId: collection.id }}
                  search={{ kind: (collections.data?.gift.some((item: any) => item.id === collection.id) ? "gift" : "seasonal") as "gift" | "seasonal" }}
                  className="rounded-xl bg-card p-4 ring-1 ring-black/[0.05]"
                >
                  <p className="font-medium">{collection.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {collection.description ?? "Shop the collection"}
                  </p>
                </Link>
              ),
            )}
            {(brands.data ?? []).map((brand: any) => (
              <Link to="/brand/$brandId" params={{ brandId: brand.brand_id }} key={brand.brand_id} className="rounded-xl bg-card p-4 ring-1 ring-black/[0.05]">
                <p className="font-medium">{brand.brands?.name ?? "Featured brand"}</p>
                <p className="mt-1 text-xs text-muted-foreground">Featured brand</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      <ProductSection title="New Arrivals" products={arrivals.data} />
    </div>
  );
}
