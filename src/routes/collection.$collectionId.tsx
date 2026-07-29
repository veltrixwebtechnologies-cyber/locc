import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { ProductCard } from "@/components/merchandising-sections";
import { supabase } from "@/integrations/supabase/client";
import { useCollectionProducts, type MerchandisingProduct } from "@/lib/merchandising";

export const Route = createFileRoute("/collection/$collectionId")({ component: CollectionPage });

function CollectionPage() {
  const { collectionId } = Route.useParams();
  const kind = (Route.useSearch() as { kind?: "gift" | "seasonal" }).kind ?? "gift";
  const collection = useQuery({ queryKey: ["collection", kind, collectionId], queryFn: async () => {
    const { data, error } = await (supabase as any).from(kind === "gift" ? "gift_collections" : "seasonal_collections").select("id,name,description,image_url").eq("id", collectionId).single();
    if (error) throw error;
    return data;
  } });
  const products = useCollectionProducts(collectionId, kind);
  return <AppShell><div className="px-5 py-6 md:px-8"><Link to="/" search={{ category: undefined, q: undefined }} className="text-sm text-muted-foreground">Back to shops</Link><div className="mt-5 rounded-xl bg-card p-6 ring-1 ring-black/[0.05]"><h1 className="font-display text-3xl">{collection.data?.name ?? "Collection"}</h1><p className="mt-1 text-sm text-muted-foreground">{collection.data?.description ?? "Curated picks from approved local vendors."}</p></div><div className="mt-6 flex gap-3 overflow-x-auto pb-3">{(products.data as MerchandisingProduct[] | undefined)?.map(product => <ProductCard key={product.id} product={product} />)}</div>{!products.data?.length && <p className="mt-6 text-center text-sm text-muted-foreground">No products in this collection yet.</p>}</div></AppShell>;
}
