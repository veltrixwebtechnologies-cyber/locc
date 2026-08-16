import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { ProductCard } from "@/components/merchandising-sections";
import { supabase } from "@/integrations/supabase/client";
import type { MerchandisingProduct } from "@/lib/merchandising";

export const Route = createFileRoute("/brand/$brandId")({ component: BrandPage });

function BrandPage() {
  const { brandId } = Route.useParams();
  const query = useQuery({
    queryKey: ["brand-store", brandId],
    queryFn: async () => {
      const [brand, products] = await Promise.all([
        (supabase as any).from("brands").select("id,name,logo_url").eq("id", brandId).single(),
        (supabase as any)
          .from("public_merchandising_products")
          .select(
            "id,seller_id,name,brand,brand_id,brand_name,category,selling_price,mrp,discount_price,discount_starts_at,discount_ends_at,clearance,stock,image_url,average_rating,review_count,shop_name,created_at",
          )
          .eq("brand_id", brandId)
          .order("created_at", { ascending: false }),
      ]);
      if (brand.error) throw brand.error;
      if (products.error) throw products.error;
      return { brand: brand.data, products: (products.data ?? []) as MerchandisingProduct[] };
    },
  });
  return (
    <AppShell>
      <div className="px-5 py-6 md:px-8">
        <Link
          to="/"
          search={{ category: undefined, q: undefined }}
          className="text-sm text-muted-foreground"
        >
          Back to shops
        </Link>
        <div className="mt-5 rounded-xl bg-card p-6 ring-1 ring-black/[0.05]">
          <h1 className="font-display text-3xl">{query.data?.brand?.name ?? "Brand store"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Shop approved products from this brand.
          </p>
        </div>
        <div className="mt-6 flex gap-3 overflow-x-auto pb-3">
          {query.data?.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {!query.data?.products.length && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            No products available from this brand yet.
          </p>
        )}
      </div>
    </AppShell>
  );
}
