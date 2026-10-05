import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, MapPin, Search, Star } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { fetchImportedShopById } from "@/lib/imported-shops";
import { getFallbackShopImage, getRepresentativeItemImages } from "@/lib/image-utils";
import { ImportedDemoCatalog } from "@/components/imported-demo-catalog";
import { getDemoPrice } from "@/lib/imported-demo-cart";

const PREVIEW_LABELS: Record<string, string> = {
  "photo-1489987707025-afc232f7ea0f": "Clothing",
  "photo-1551488831-00ddcb6c6bd3": "Shirts",
  "photo-1541099649105-f69ad21f3246": "Jeans",
  "photo-1558769132-cb1aea458c5e": "Boutique clothing",
  "photo-1555041469-a586c61ea9bc": "Sofas",
  "photo-1505693416388-ac5ce068fe85": "Bedroom furniture",
  "photo-1513519245088-0e12902e5a38": "Home decor",
  "photo-1493663284031-b7e3aefcae8e": "Living room furniture",
};

export function ImportedShopPage({ shopId, lat, lng }: { shopId: string; lat?: number; lng?: number }) {
  const [search, setSearch] = useState("");
  const shopQuery = useQuery({
    queryKey: ["imported-shop-detail", shopId, lat, lng],
    queryFn: () => fetchImportedShopById((name, args) => (supabase as any).rpc(name, args), shopId, lat, lng),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const shop = shopQuery.data;
  const previews = shop ? getRepresentativeItemImages(shop.category, shopId).map((imageUrl) => ({
    imageUrl,
    name: PREVIEW_LABELS[imageUrl.split("/").pop()?.split("?")[0] ?? ""] ?? `${shop.category} preview`,
  })).map((item, index) => ({ ...item, id: `demo:${shopId}:${index}`, price: getDemoPrice(item.name, shop.category) })) : [];
  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6">
        <Link to="/" search={{ category: undefined, q: undefined }} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to shops
        </Link>
        {shopQuery.isPending ? (
          <div className="grid min-h-64 place-items-center rounded-3xl border bg-card" role="status"><p className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Loading selected shop…</p></div>
        ) : shopQuery.isError ? (
          <div className="rounded-3xl border bg-card p-8" role="alert">
            <h1 className="font-display text-xl font-bold">Shop could not load</h1>
            <p className="mt-2 text-sm text-muted-foreground">{shopQuery.error.message}</p>
            <button onClick={() => void shopQuery.refetch()} className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Retry this shop</button>
          </div>
        ) : shop ? (
          <>
            <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
              <div className="grid sm:grid-cols-[240px_1fr]">
                <div>
                  <img src={shop.cover_image_url || getFallbackShopImage(shop.category, shop.id)} alt={`${shop.business_name} ${shop.image_type === "seller" ? "seller cover" : "representative category cover"}`} className="h-48 w-full object-cover sm:h-64" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = getFallbackShopImage(shop.category, shop.id); }} />
                  <p className="px-3 py-2 text-[11px] text-muted-foreground">{shop.image_type === "seller" ? "Seller supplied cover" : "Representative image from Unsplash"}</p>
                </div>
                <div className="p-5 sm:p-7">
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">Public shop listing</span>
                  <h1 className="mt-3 font-display text-2xl font-black sm:text-3xl">{shop.business_name}</h1>
                  <p className="mt-2 text-sm font-semibold text-primary">{shop.category}</p>
                  <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{shop.formatted_address || [shop.city, shop.state].filter(Boolean).join(", ")}</p>
                  {Number(shop.rating) > 0 && <p className="mt-3 flex items-center gap-1 text-sm font-semibold"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{Number(shop.rating).toFixed(1)} {shop.review_count != null && <span className="font-normal text-muted-foreground">({shop.review_count} reviews)</span>}</p>}
                </div>
              </div>
            </section>
            <section className="mt-6">
              <h2 className="font-display text-xl font-bold">Demo product catalog</h2>
              <p className="mt-1 text-sm text-muted-foreground">Try shopping with representative {shop.category.toLowerCase()} images from Unsplash and sample prices. Not this business’s confirmed inventory. Demo checkout only — no real payment or delivery.</p>
              <label className="mt-4 flex items-center gap-3 rounded-2xl border bg-card px-4 py-3"><Search className="h-4 w-4 text-primary" /><input aria-label="Search product previews" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product previews…" className="w-full bg-transparent text-sm outline-none" /></label>
              <ImportedDemoCatalog key={shopId} shopId={shopId} shopName={shop.business_name} items={previews} search={search} />
            </section>
          </>
        ) : null}
      </main>
    </AppShell>
  );
}
