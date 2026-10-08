import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, MapPin, Search, Star } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { fetchImportedShopById } from "@/lib/imported-shops";
import { getFallbackShopImage, getFallbackProductImage } from "@/lib/image-utils";
import { ImportedDemoCatalog } from "@/modules/shopper/components/imported-demo-catalog";
import { getImportedCatalogItems } from "@/modules/shopper/services/imported-demo-cart";

export function ImportedShopPage({
  shopId,
  lat,
  lng,
}: {
  shopId: string;
  lat?: number;
  lng?: number;
}) {
  const [search, setSearch] = useState("");
  const shopQuery = useQuery({
    queryKey: ["imported-shop-detail", shopId, lat, lng],
    queryFn: () =>
      fetchImportedShopById((name, args) => (supabase as any).rpc(name, args), shopId, lat, lng),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const shop = shopQuery.data;
  const previews = shop
    ? getImportedCatalogItems(shop.category).map((item) => ({
        ...item,
        id: `demo:${shopId}:${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        imageUrl: getFallbackProductImage(
          item.name,
          /bakery|baker/i.test(shop.category)
            ? "bakery"
            : /furniture/i.test(shop.category)
              ? "home_decor"
              : "individual_fashion",
        ),
      }))
    : [];
  return (
    <AppShell hideFloatingCart>
      <main className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6">
        <Link
          to="/"
          search={{ category: undefined, q: undefined }}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to shops
        </Link>
        {shopQuery.isPending ? (
          <div
            className="grid min-h-64 place-items-center rounded-3xl border bg-card"
            role="status"
          >
            <p className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading selected shop…
            </p>
          </div>
        ) : shopQuery.isError ? (
          <div className="rounded-3xl border bg-card p-8" role="alert">
            <h1 className="font-display text-xl font-bold">Shop could not load</h1>
            <p className="mt-2 text-sm text-muted-foreground">{shopQuery.error.message}</p>
            <button
              onClick={() => void shopQuery.refetch()}
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
            >
              Retry this shop
            </button>
          </div>
        ) : shop ? (
          <>
            <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
              <div className="grid sm:grid-cols-[240px_1fr]">
                <div>
                  <img
                    src={shop.cover_image_url || getFallbackShopImage(shop.category, shop.id)}
                    alt={`${shop.business_name} ${shop.image_type === "seller" ? "seller cover" : "representative category cover"}`}
                    className="h-48 w-full object-cover sm:h-64"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = getFallbackShopImage(shop.category, shop.id);
                    }}
                  />
                  <p className="px-3 py-2 text-[11px] text-muted-foreground">
                    {shop.image_type === "seller"
                      ? "Seller supplied cover"
                      : "Representative image from Unsplash"}
                  </p>
                </div>
                <div className="p-5 sm:p-7">
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">
                    Public shop listing
                  </span>
                  <h1 className="mt-3 font-display text-2xl font-black sm:text-3xl">
                    {shop.business_name}
                  </h1>
                  <p className="mt-2 text-sm font-semibold text-primary">{shop.category}</p>
                  <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    {shop.formatted_address || [shop.city, shop.state].filter(Boolean).join(", ")}
                  </p>
                  {Number(shop.rating) > 0 && (
                    <p className="mt-3 flex items-center gap-1 text-sm font-semibold">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      {Number(shop.rating).toFixed(1)}{" "}
                      {shop.review_count != null && (
                        <span className="font-normal text-muted-foreground">
                          ({shop.review_count} reviews)
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </section>
            <section className="mt-6">
              <h2 className="font-display text-xl font-bold">Demo product catalog</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Try shopping with representative {shop.category.toLowerCase()} images from Unsplash
                and sample prices. Not this business’s confirmed inventory. Demo checkout only — no
                real payment or delivery.
              </p>
              <label className="mt-4 flex items-center gap-3 rounded-2xl border bg-card px-4 py-3">
                <Search className="h-4 w-4 text-primary" />
                <input
                  aria-label="Search product previews"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search product previews…"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </label>
              <ImportedDemoCatalog
                key={shopId}
                shopId={shopId}
                shopName={shop.business_name}
                category={shop.category}
                items={previews}
                search={search}
              />
            </section>
          </>
        ) : null}
      </main>
    </AppShell>
  );
}
