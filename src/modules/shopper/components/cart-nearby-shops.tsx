import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/modules/shopper/services/cart-store";
import { useDeliveryLocation } from "@/lib/location-store";
import {
  hasConfirmedCoordinates,
  DEFAULT_SHOP_DISCOVERY_RADIUS_KM,
} from "@/lib/location-visibility";
import { supabase } from "@/integrations/supabase/client";
import { runCatalogRpcWithTimeout, shouldRetryCatalogQuery } from "@/lib/catalog-rpc";
import { fetchNearbyImportedShops } from "@/lib/imported-shops";
import {
  nearbyCartShops,
  type NearbyCartProduct,
} from "@/modules/shopper/services/cart-nearby-shops";
import { ProductThumb } from "@/components/product-thumb";
import { toStoreCategory, catalogCategoryKey } from "@/lib/shop-categories";

export function CartNearbyShops() {
  const cart = useCart();
  const [location] = useDeliveryLocation();
  const query = useQuery({
    queryKey: [
      "cart-nearby-shops",
      cart.storeId,
      cart.lines.map((line) => [line.name, line.category]),
      location?.lat,
      location?.lng,
    ],
    enabled: !!cart.lines.length && hasConfirmedCoordinates(location),
    staleTime: 60_000,
    retry: shouldRetryCatalogQuery,
    queryFn: async () => {
      if (!hasConfirmedCoordinates(location)) return { shops: [], partial: false };
      const rpc = (name: string, args: Record<string, unknown>) =>
        (supabase as any).rpc(name, args);
      const [products, listings] = await Promise.allSettled([
        Promise.all(
          [...new Set(cart.lines.map((line) => catalogCategoryKey(line.category)))].map(
            (category) =>
              runCatalogRpcWithTimeout(
                rpc("get_customer_visible_products", {
                  p_lat: location.lat,
                  p_lng: location.lng,
                  p_query: null,
                  p_category_slug: category,
                  p_limit: 100,
                  p_offset: 0,
                }),
              ).then((result) => {
                if (result.error)
                  throw new Error(result.error.message || "Could not load products");
                return (Array.isArray(result.data) ? result.data : []) as NearbyCartProduct[];
              }),
          ),
        ).then((rows) => rows.flat()),
        fetchNearbyImportedShops(rpc, {
          lat: location.lat,
          lng: location.lng,
          radiusKm: DEFAULT_SHOP_DISCOVERY_RADIUS_KM,
        }),
      ]);
      if (products.status === "rejected" && listings.status === "rejected")
        throw new Error("Nearby suggestions could not load. Please retry.");
      return {
        partial: products.status === "rejected" || listings.status === "rejected",
        shops: nearbyCartShops(
          cart.lines,
          cart.storeId,
          products.status === "fulfilled" ? products.value : [],
          listings.status === "fulfilled" ? listings.value : [],
        ),
      };
    },
  });
  return (
    <section
      className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm"
      aria-label="Nearby shops with similar products"
    >
      <h2 className="text-sm font-bold">Similar products at nearby shops</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Matching inventory within 5 km; related public shop listings within 7 km. Visiting another
        shop does not change your basket.
      </p>
      {!hasConfirmedCoordinates(location) ? (
        <p className="mt-3 text-sm">Select your delivery location to see nearby shops.</p>
      ) : query.isPending ? (
        <p className="mt-3 text-sm" role="status">
          Finding similar products nearby…
        </p>
      ) : query.isError ? (
        <div className="mt-3 text-sm" role="alert">
          Couldn’t load nearby suggestions.{" "}
          <button
            type="button"
            className="font-bold text-primary"
            onClick={() => void query.refetch()}
          >
            Try again
          </button>
        </div>
      ) : !query.data?.shops.length ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {query.data?.partial
            ? "Some nearby results could not load. Please try again."
            : "No matching nearby inventory or related shop listings were found."}
        </p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {query.data?.partial && (
            <p className="text-xs text-amber-800 sm:col-span-2" role="status">
              Some results are unavailable.{" "}
              <button type="button" className="font-bold" onClick={() => void query.refetch()}>
                Retry
              </button>
            </p>
          )}
          {query.data.shops.map((shop) => (
            <article key={shop.id} className="rounded-xl border border-border p-3">
              <h3 className="text-sm font-bold">{shop.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {shop.distanceKm.toFixed(1)} km away ·{" "}
                {shop.imported
                  ? "Public listing · inventory not confirmed"
                  : "Matching catalog products"}
              </p>
              {shop.products.slice(0, 3).map((product) => (
                <a
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="mt-2 flex items-center gap-2 rounded-lg bg-background p-2"
                >
                  <ProductThumb
                    src={product.image_url}
                    alt={product.name}
                    category={toStoreCategory(product.category)}
                  />
                  <span className="min-w-0 text-xs">
                    <span className="block font-semibold">{product.name}</span>
                    <span>₹{Number(product.selling_price).toLocaleString("en-IN")}</span>
                  </span>
                </a>
              ))}
              <a
                href={shop.href}
                className="mt-3 inline-block rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
              >
                View Local Shop →
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
