import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useMemo } from "react";
import type { MerchandisingProduct } from "@/lib/merchandising";
import { cartStore, useCart } from "@/lib/cart-store";
import { productsByStore, stores, type StoreCategory } from "@/lib/mock-data";
import { useDeliveryLocation } from "@/lib/location-store";
import { haversineDistanceKm } from "@/lib/geo";
import { ProductThumb } from "@/components/product-thumb";
import { QtyStepper } from "@/components/qty-stepper";
import { WishlistButton } from "@/components/wishlist-button";
import { toast } from "sonner";
import { adaptMockProduct, getRecommendations } from "@/lib/recommendations/recommendation-engine";
import type {
  RecommendationCandidate,
  ScoredRecommendation,
} from "@/lib/recommendations/recommendation-types";

function categoryFor(product: MerchandisingProduct): StoreCategory {
  const category = (product.category ?? "grocery").toLowerCase();
  if (category.includes("pharm") || category.includes("beauty")) return "pharmacy";
  if (category.includes("fashion") || category.includes("cloth")) return "fashion";
  if (category.includes("foot")) return "footwear";
  if (category.includes("elect") || category.includes("mobile")) return "electronics";
  if (category.includes("bak")) return "bakery";
  if (category.includes("meat") || category.includes("fish")) return "meat_fish";
  return "grocery";
}

function deliveryLabel(product: RecommendationCandidate) {
  const shop = stores.find((store) => store.id === product.seller_id);
  return shop?.etaMin
    ? `${shop.etaMin}-${shop.etaMin + 10} min delivery`
    : "Local delivery available";
}

function RelatedProductCard({
  recommendation,
  cart,
}: {
  recommendation: ScoredRecommendation;
  cart: ReturnType<typeof useCart>;
}) {
  const product = recommendation.product;
  const price = Number(product.discount_price ?? product.selling_price);
  const quantity = cart.lines.find((line) => line.productId === product.id)?.qty ?? 0;
  return (
    <article className="group flex w-[190px] shrink-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-background p-2.5 shadow-xs transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:w-[210px]">
      <div className="relative">
        <Link to="/product/$productId" params={{ productId: product.id }} className="block">
          <ProductThumb
            src={product.image_url ?? undefined}
            alt={product.name}
            category={categoryFor(product)}
            fit="contain"
            className="h-32 w-full rounded-lg bg-[var(--sand)]"
          />
        </Link>
        <div className="absolute right-2 top-2">
          <WishlistButton
            productId={product.id}
            productName={product.name}
            item={{
              productId: product.id,
              name: product.name,
              shopName: product.shop_name,
              category: product.category ?? "Item",
              price,
              imageUrl: product.image_url ?? undefined,
              sellerId: product.seller_id,
            }}
          />
        </div>
      </div>
      <Link
        to="/product/$productId"
        params={{ productId: product.id }}
        className="mt-2 line-clamp-2 min-h-8 text-xs font-bold leading-tight text-foreground hover:text-primary"
      >
        {product.name}
      </Link>
      <p className="mt-1 truncate text-[10px] font-semibold text-muted-foreground">
        {product.shop_name}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-0.5 text-amber-600">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{" "}
          {(product.average_rating || 4.5).toFixed(1)}
        </span>
        <span>•</span>
        <span>
          {recommendation.distanceKm !== undefined
            ? `${recommendation.distanceKm.toFixed(1)} km`
            : "Set location"}
        </span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div>
          <p className="text-sm font-black text-foreground">₹{price.toLocaleString("en-IN")}</p>
          {product.mrp > price && (
            <p className="text-[10px] text-muted-foreground line-through">
              ₹{product.mrp.toLocaleString("en-IN")}
            </p>
          )}
          <p className="text-[10px] font-semibold text-emerald-700">
            {product.stock > 0 ? "In stock" : "Unavailable"}
          </p>
        </div>
        <QtyStepper
          qty={quantity}
          max={product.stock}
          onAdd={() => {
            cartStore.add(product.seller_id, product.shop_name, {
              id: product.id,
              name: product.name,
              unit: product.category ?? "item",
              price,
              stock: product.stock,
            });
            toast.success(`Added ${product.name} to cart`);
          }}
          onChange={(next) => cartStore.setQty(product.id, next)}
          addClassName="rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-bold text-primary-foreground hover:bg-primary/90"
        />
      </div>
      <p className="mt-1 text-[9px] text-muted-foreground">{deliveryLabel(product)}</p>
    </article>
  );
}

export function RelatedProductsSection({
  sourceProduct,
  candidates,
  queryLabel,
  selectedShopId,
  selectedShopName,
}: {
  sourceProduct: MerchandisingProduct;
  candidates: MerchandisingProduct[];
  queryLabel?: string;
  selectedShopId?: string;
  selectedShopName?: string;
}) {
  const [deliveryLocation] = useDeliveryLocation();
  const cart = useCart();
  const relatedProducts = useMemo(() => {
    const unique = new Map<string, RecommendationCandidate>();
    candidates.forEach((candidate) => {
      if (candidate.id !== sourceProduct.id && candidate.stock > 0)
        unique.set(candidate.id, candidate);
    });
    const prepared = [...unique.values()].map((candidate) => {
      const shop = stores.find((store) => store.id === candidate.seller_id);
      return {
        ...candidate,
        distance_km:
          deliveryLocation && shop
            ? haversineDistanceKm(deliveryLocation.lat, deliveryLocation.lng, shop.lat, shop.lng)
            : candidate.distance_km,
      };
    });
    return getRecommendations({
      sourceProducts: [sourceProduct],
      candidates: prepared,
      cartProductIds: new Set(cart.lines.map((line) => line.productId)),
      selectedShopId,
      maxResults: 8,
    });
  }, [candidates, cart.lines, deliveryLocation, selectedShopId, sourceProduct]);
  const shopProducts = useMemo(
    () =>
      candidates
        .filter(
          (product) =>
            product.seller_id === selectedShopId &&
            product.id !== sourceProduct.id &&
            product.stock > 0,
        )
        .filter(
          (product, index, all) =>
            all.findIndex((candidate) => candidate.id === product.id) === index,
        )
        .sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0))
        .slice(0, 8)
        .map((product) => ({ product, type: "SAME_CATEGORY" as const, score: 0 })),
    [candidates, selectedShopId, sourceProduct.id],
  );
  if (!relatedProducts.length && !shopProducts.length) return null;
  const renderProducts = (items: ScoredRecommendation[]) => (
    <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => (
        <RelatedProductCard key={item.product.id} recommendation={item} cart={cart} />
      ))}
    </div>
  );
  return (
    <div className="space-y-4">
      {relatedProducts.length > 0 && (
        <section
          className="rounded-2xl border border-[#ead9a8] bg-card p-4 shadow-sm sm:p-5"
          aria-label="You may also need"
        >
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">You may also need</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Relevant products to complete your purchase of {queryLabel || sourceProduct.name}
              </p>
            </div>
            {!deliveryLocation && (
              <span className="text-[10px] font-semibold text-muted-foreground">
                Set location for distance
              </span>
            )}
          </div>
          {renderProducts(relatedProducts)}
        </section>
      )}
      {shopProducts.length > 0 && (
        <section
          className="rounded-2xl border border-[#ead9a8] bg-card p-4 shadow-sm sm:p-5"
          aria-label="More from this shop"
        >
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">
                More from this shop
              </h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Available from {selectedShopName || sourceProduct.shop_name}
              </p>
            </div>
            <Link
              to="/store/$storeId"
              params={{ storeId: selectedShopId ?? sourceProduct.seller_id }}
              className="text-[11px] font-bold text-primary hover:underline"
            >
              View shop
            </Link>
          </div>
          {renderProducts(shopProducts)}
        </section>
      )}
    </div>
  );
}

export function CartRelatedProducts() {
  const cart = useCart();
  const [deliveryLocation] = useDeliveryLocation();
  const suggestions = useMemo(() => {
    if (!cart.lines.length) return [];
    const sourceProducts = cart.lines.map((line) =>
      adaptMockProduct({
        id: line.productId,
        storeId: line.storeId,
        name: line.name,
        unit: line.unit,
        price: line.price,
        category: line.unit,
        stock: line.availableStock ?? 20,
      }),
    );
    const pool = Object.values(productsByStore)
      .flat()
      .map(adaptMockProduct)
      .map((candidate) => {
        const shop = stores.find((store) => store.id === candidate.seller_id);
        return {
          ...candidate,
          distance_km:
            deliveryLocation && shop
              ? haversineDistanceKm(deliveryLocation.lat, deliveryLocation.lng, shop.lat, shop.lng)
              : candidate.distance_km,
        };
      });
    return getRecommendations({
      sourceProducts,
      candidates: pool,
      cartProductIds: new Set(cart.lines.map((line) => line.productId)),
      selectedShopId: cart.storeId ?? undefined,
      maxResults: 6,
    });
  }, [cart.lines, cart.storeId, deliveryLocation]);
  if (!suggestions.length) return null;
  return (
    <div className="min-w-0 max-w-full rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-sm font-bold text-foreground">
        You might also need <span className="text-primary">✨</span>
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Based on everything in your basket. Products already in your cart are hidden.
      </p>
      <div tabIndex={0} role="region" aria-label="Suggested products, scroll horizontally for more" className="mt-3 flex w-full min-w-0 max-w-full snap-x snap-proximity gap-3 overflow-x-auto overscroll-x-contain pb-3 [&>article]:snap-start">
        {suggestions.map((recommendation) => (
          <RelatedProductCard
            key={recommendation.product.id}
            recommendation={recommendation}
            cart={cart}
          />
        ))}
      </div>
    </div>
  );
}
