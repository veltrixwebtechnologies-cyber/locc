import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ProductThumb } from "@/components/product-thumb";
import { QtyStepper } from "@/components/qty-stepper";
import { supabase } from "@/integrations/supabase/client";
import { fetchImportedShopById } from "@/lib/imported-shops";
import { importedStorefront } from "@/modules/shopper/services/imported-storefront";
import { getBrandCatalogProducts } from "@/lib/brand-products-catalog";
import {
  parseImportedProductId,
  importedProductDetails,
} from "@/modules/shopper/services/imported-product-details";
import { cartStore, useCart } from "@/modules/shopper/services/cart-store";
import { toast } from "sonner";
import { toStoreCategory } from "@/lib/shop-categories";

export function ImportedProductDetail({
  productId,
  lat,
  lng,
}: {
  productId: string;
  lat?: number;
  lng?: number;
}) {
  const identity = parseImportedProductId(productId);
  const cart = useCart();
  const shop = useQuery({
    queryKey: ["imported-shop-detail", identity?.shopId, lat, lng],
    enabled: !!identity,
    queryFn: () =>
      fetchImportedShopById(
        (name, args) => (supabase as any).rpc(name, args),
        identity!.shopId,
        lat,
        lng,
      ),
    staleTime: 300_000,
    retry: false,
  });
  const baseCatalog = shop.data ? importedStorefront(shop.data) : null;
  const brandProducts = shop.data
    ? getBrandCatalogProducts(`imported:${shop.data.id}`, shop.data.business_name, shop.data.category)
    : [];
  const catalog = baseCatalog
    ? {
        ...baseCatalog,
        products: brandProducts.length > 0 ? brandProducts : baseCatalog.products,
      }
    : null;
  const product = catalog?.products.find((item) => item.id === productId);
  const search = { shopLat: lat, shopLng: lng };
  if (!identity || (shop.isSuccess && !product))
    return (
      <AppShell>
        <div className="p-8" role="alert">
          Product not found.{" "}
          <Link to="/" search={{}}>
            Back to shops
          </Link>
        </div>
      </AppShell>
    );
  if (shop.isPending)
    return (
      <AppShell>
        <p className="p-8" role="status">
          Loading product details…
        </p>
      </AppShell>
    );
  if (shop.isError)
    return (
      <AppShell>
        <div className="p-8" role="alert">
          <p>{shop.error.message}</p>
          <button type="button" onClick={() => void shop.refetch()} className="mt-3 text-primary">
            Try again
          </button>
        </div>
      </AppShell>
    );
  if (!product || !catalog) return null;
  const details = importedProductDetails(product.name, product.category, identity?.slug);
  const quantity = cart.lines.find((line) => line.productId === product.id)?.qty ?? 0;
  const add = () => {
    if (
      cart.lines.length &&
      cart.storeId !== catalog.store.id &&
      !window.confirm(
        `Start a basket from ${catalog.store.name}? This will replace your current basket from ${cart.storeName}.`,
      )
    )
      return;
    cartStore.add(catalog.store.id, catalog.store.name, product);
    toast.success(`Added ${product.name} to cart`);
  };
  return (
    <AppShell>
      <main className="mx-auto max-w-6xl space-y-6 px-5 py-6">
        <Link
          to="/store/$storeId"
          params={{ storeId: catalog.store.id }}
          search={search}
          className="text-sm font-semibold text-primary"
        >
          ← Back to {catalog.store.name}
        </Link>
        <section className="grid gap-6 rounded-3xl border border-border bg-card p-5 md:grid-cols-2 md:p-8">
          <ProductThumb
            src={product.imageUrl}
            alt={product.name}
            category={toStoreCategory(product.category)}
            size="lg"
            fit="contain"
            className="aspect-square max-h-[480px]"
          />
          <div className="space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  {product.category.replace(/_/g, " ")}
                </span>
                {details.sku && (
                  <span className="text-xs font-mono text-muted-foreground">
                    SKU: {details.sku}
                  </span>
                )}
              </div>
              <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{product.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Store: {catalog.store.name}</p>
            </div>
            <div>
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-black text-foreground">₹{product.price.toLocaleString("en-IN")}</p>
                {details.mrp && details.mrp > product.price && (
                  <>
                    <span className="text-base text-muted-foreground line-through">
                      ₹{details.mrp.toLocaleString("en-IN")}
                    </span>
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {Math.round(((details.mrp - product.price) / details.mrp) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Price in INR · {product.unit}</p>
            </div>

            {details.variants && details.variants.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Available Sizes / Options
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {details.variants.map((v) => (
                    <span
                      key={v}
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="font-bold text-foreground">About this product</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {details.description}
              </p>
            </div>
            <QtyStepper
              qty={quantity}
              max={product.stock}
              onAdd={add}
              onChange={(next) => cartStore.setQty(product.id, next)}
              addClassName="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
            />
            {quantity > 0 && (
              <Link to="/cart" className="inline-block text-sm font-bold text-primary hover:underline">
                Review cart ({quantity} in basket) →
              </Link>
            )}
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
              Verified brand catalogue reference. Showroom stock and exact batch availability can be confirmed directly with this branch.
            </p>
          </div>
        </section>

        {details.specifications && Object.keys(details.specifications).length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-bold text-foreground">Product Specifications</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(details.specifications).map(([key, value]) => (
                <div key={key} className="rounded-xl bg-background p-3.5 border border-border/50">
                  <dt className="text-xs font-medium text-muted-foreground">{key}</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-bold text-foreground">Product information to confirm with the shop</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {details.checks.map((label) => (
              <div key={label} className="rounded-xl bg-background p-3 border border-border/40">
                <dt className="text-sm font-semibold text-foreground">{label}</dt>
                <dd className="mt-1 text-xs text-muted-foreground">
                  Not provided by this business yet
                </dd>
              </div>
            ))}
          </dl>
        </section>
        <section>
          <h2 className="mb-3 font-bold">Similar products from this shop</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {catalog.products
              .filter((item) => item.id !== product.id)
              .slice(0, 4)
              .map((item) => (
                <Link
                  key={item.id}
                  to="/product/$productId"
                  params={{ productId: item.id }}
                  search={search}
                  className="rounded-xl border border-border bg-card p-3"
                >
                  <ProductThumb
                    src={item.imageUrl}
                    alt={item.name}
                    category={toStoreCategory(item.category)}
                    size="lg"
                    className="aspect-square"
                  />
                  <p className="mt-2 text-sm font-bold">{item.name}</p>
                  <p className="text-sm">₹{item.price.toLocaleString("en-IN")}</p>
                </Link>
              ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
