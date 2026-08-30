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
import { Reveal, SkeletonCard, cardMotion, spring } from "@/components/motion/presets";
import { cartStore, useCart } from "@/lib/cart-store";
import { QtyStepper } from "@/components/qty-stepper";
import { flyProductToCart } from "@/lib/fly-to-cart";
import { SafeProductImage } from "@/lib/image-utils";

type ProductSectionProps = {
  title: string;
  products: MerchandisingProduct[] | undefined;
  loading?: boolean;
};

export function ProductCard({
  product,
  compact = false,
}: {
  product: MerchandisingProduct;
  compact?: boolean;
}) {
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

  const sellingPrice = Number(product.discount_price ?? product.selling_price ?? 0);
  const mrp = Number(product.mrp ?? (sellingPrice ? Math.round(sellingPrice * 1.25) : 0));
  const discountPercent =
    mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
  const dealTag = `${discountPercent}% OFF`;

  return (
    <div
      data-product-id={product.id}
      className={`group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-amber-300/80 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-amber-400 hover:shadow-md hover:shadow-amber-500/10 active:scale-[0.98] ${
        compact ? "p-2.5" : "p-3.5"
      }`}
    >
      {/* Top right Wishlist button overlay */}
      <div className="absolute right-2.5 top-2.5 z-10">
        <WishlistButton
          productId={product.id}
          productName={product.name}
          item={{
            productId: product.id,
            name: product.name,
            shopName: product.shop_name,
            category: product.category ?? "Other",
            price: sellingPrice,
            imageUrl: product.image_url ?? undefined,
            sellerId: product.seller_id,
          }}
        />
      </div>

      <Link
        to="/product/$productId"
        params={{ productId: product.id }}
        className="flex flex-col h-full"
        onClick={() => {
          void recordProductEvent(product.id, "view");
          void recordRecentProductView(product.id);
        }}
      >
        {/* Grey inner padded image container frame */}
        <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-50 p-2 flex items-center justify-center border border-amber-200/50 relative">
          <div className="h-full w-full flex items-center justify-center">
            <SafeProductImage
              src={imageUrl}
              productName={product.name}
              category={product.category}
              alt={product.name}
              loading="lazy"
              decoding="async"
              data-product-image
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>

        {/* Product details */}
        <div className="mt-3 flex flex-col justify-between flex-1">
          <div>
            <h3 className="line-clamp-1 text-sm font-bold text-slate-800 group-hover:text-purple-700 transition-colors">
              {product.name}
            </h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-sm font-black text-slate-900">
                ₹{sellingPrice}
              </span>
              {mrp > sellingPrice && (
                <span className="text-[11px] font-medium text-slate-400 line-through">
                  ₹{mrp}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs font-black text-purple-700">
              {dealTag}
            </p>
          </div>
        </div>
      </Link>

      {/* Add to cart / Qty stepper at bottom */}
      <div className="mt-3 pt-2 border-t border-slate-100">
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
              price: sellingPrice,
              stock: product.stock,
            });
          }}
          onChange={(nextQuantity) => cartStore.setQty(product.id, nextQuantity)}
          addClassName="w-full rounded-xl bg-purple-50 py-1.5 text-xs font-bold text-purple-700 border border-purple-200/60 transition hover:bg-purple-700 hover:text-white"
        />
      </div>
    </div>
  );
}

function ProductSection({ title, products, loading = false }: ProductSectionProps) {
  if (!products || products.length === 0) return null;
  return (
    <div className="mt-6 px-5 md:px-8">
      <h2 className="font-display text-lg font-bold md:text-xl">{title}</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 pb-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
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
  const flashProductIds = (flashSales.data ?? []).flatMap((sale: any) =>
    (sale.flash_sale_products ?? []).map((item: any) => item.product_id),
  );
  const flashProducts = useFlashSaleProducts(flashProductIds);
  const [period, setPeriod] = useState<"today" | "this_week" | "this_month" | "all_time">(
    "all_time",
  );
  const best = useBestSellers(period);

  return (
    <div>
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
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {best.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}
      <ProductSection
        title="Trending"
        products={trending.data ?? []}
        loading={trending.isLoading}
      />
      <ProductSection
        title="Deals & Discounts"
        products={deals.data ?? []}
        loading={deals.isLoading}
      />
      <ProductSection
        title="Clearance Sale"
        products={clearance.data ?? []}
        loading={clearance.isLoading}
      />
      <ProductSection
        title="Flash Sales"
        products={flashProducts.data ?? []}
        loading={flashProducts.isLoading}
      />
      <ProductSection
        title="Recently viewed"
        products={recentlyViewed.data ?? []}
        loading={recentlyViewed.isLoading}
      />
      <ProductSection
        title="Recommended for you"
        products={recommendations.data ?? []}
        loading={recommendations.isLoading}
      />
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
                  search={{
                    kind: (collections.data?.gift.some((item: any) => item.id === collection.id)
                      ? "gift"
                      : "seasonal") as "gift" | "seasonal",
                  }}
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
              <Link
                to="/brand/$brandId"
                params={{ brandId: brand.brand_id }}
                key={brand.brand_id}
                className="rounded-xl bg-card p-4 ring-1 ring-black/[0.05]"
              >
                <p className="font-medium">{brand.brands?.name ?? "Featured brand"}</p>
                <p className="mt-1 text-xs text-muted-foreground">Featured brand</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      <ProductSection
        title="New Arrivals"
        products={arrivals.data ?? []}
        loading={arrivals.isLoading}
      />
    </div>
  );
}
