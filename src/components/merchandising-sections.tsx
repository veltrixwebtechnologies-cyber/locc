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
  const discountPercent = mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
  const unit = (product as any).unit || (product as any).weight || "1 unit";

  return (
    <div
      data-product-id={product.id}
      className={`group relative flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:border-purple-300 hover:shadow-md transition-all duration-200 ${
        compact ? "p-2.5" : "p-3"
      }`}
    >
      <div>
        {/* Top Image Frame with floating badges */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-50/90 border border-slate-100 p-2 flex items-center justify-center">
          {/* Wishlist button top-right */}
          <div className="absolute right-2 top-2 z-10">
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

          {/* Unit weight tag bottom-left inside image frame */}
          <div className="absolute bottom-2 left-2 z-10 rounded-md bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
            {unit}
          </div>

          <Link
            to="/product/$productId"
            params={{ productId: product.id }}
            className="h-full w-full flex items-center justify-center"
            onClick={() => {
              void recordProductEvent(product.id, "view");
              void recordRecentProductView(product.id);
            }}
          >
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
          </Link>

          {/* ADD Button positioned at bottom-right corner of image frame (Matching Image 2 position!) */}
          <div className="absolute right-2 bottom-2 z-20">
            {quantity === 0 ? (
              <button
                type="button"
                onClick={() => {
                  void recordProductEvent(product.id, "add_to_cart");
                  flyProductToCart(product.id);
                  cartStore.add(product.seller_id, product.shop_name, {
                    id: product.id,
                    name: product.name,
                    unit: unit,
                    price: sellingPrice,
                    stock: product.stock,
                  });
                }}
                className="rounded-lg bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white px-3.5 py-1 text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1"
              >
                <span>ADD</span>
              </button>
            ) : (
              <QtyStepper
                qty={quantity}
                max={product.stock}
                onAdd={() => {
                  void recordProductEvent(product.id, "add_to_cart");
                  flyProductToCart(product.id);
                  cartStore.add(product.seller_id, product.shop_name, {
                    id: product.id,
                    name: product.name,
                    unit: unit,
                    price: sellingPrice,
                    stock: product.stock,
                  });
                }}
                onChange={(nextQuantity) => cartStore.setQty(product.id, nextQuantity)}
                addClassName="rounded-lg bg-emerald-700 text-white px-2 py-0.5 text-xs font-bold shadow-sm"
              />
            )}
          </div>
        </div>

        {/* Product details section */}
        <Link
          to="/product/$productId"
          params={{ productId: product.id }}
          className="mt-2.5 block space-y-1"
          onClick={() => {
            void recordProductEvent(product.id, "view");
            void recordRecentProductView(product.id);
          }}
        >
          {/* Price line with strikethrough MRP */}
          <div className="flex items-baseline gap-2">
            <span className="text-base font-black text-slate-900">₹{sellingPrice}</span>
            {mrp > sellingPrice && (
              <span className="text-xs font-semibold text-slate-400 line-through">₹{mrp}</span>
            )}
          </div>

          {discountPercent > 0 && (
            <p className="text-[11px] font-extrabold text-blue-600 uppercase tracking-tight">
              {discountPercent}% OFF ON MRP
            </p>
          )}

          {/* Title */}
          <h3 className="line-clamp-2 text-xs sm:text-sm font-bold text-slate-800 leading-snug group-hover:text-[#981495] transition-colors">
            {product.name}
          </h3>

          {/* Rating & ETA */}
          <div className="flex items-center gap-2 pt-0.5 text-[11px] font-bold text-slate-600">
            <span className="flex items-center gap-0.5 text-amber-600">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {(product.average_rating ?? 4.8).toFixed(1)}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">⏱ 15 mins</span>
          </div>

          {/* Category pill with arrow */}
          <div className="pt-1">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 group-hover:bg-purple-50 group-hover:text-[#981495] transition-colors">
              <span>All {product.category || "Item"}</span>
              <span className="text-[8px]">▶</span>
            </span>
          </div>
        </Link>
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
