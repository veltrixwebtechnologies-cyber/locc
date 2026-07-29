import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/compare")({ component: ComparePage });

function ComparePage() {
  const auth = useAuth();
  const query = useQuery({ queryKey: ["compare-page", auth.email || auth.phone], enabled: Boolean(auth.email || auth.phone), queryFn: async () => {
    const { data: rows, error } = await (supabase as any).from("product_comparisons").select("product_id").order("created_at", { ascending: true });
    if (error) throw error;
    const ids = (rows ?? []).map((row: any) => row.product_id);
    if (!ids.length) return [];
    const products = await (supabase as any).from("public_merchandising_products").select("id,name,brand_name,category,selling_price,mrp,discount_price,stock,average_rating,review_count,shop_name").in("id", ids);
    if (products.error) throw products.error;
    const byId = new Map((products.data ?? []).map((p: any) => [p.id, p]));
    return ids.map((id: string) => byId.get(id)).filter(Boolean);
  } });
  return <AppShell><div className="px-5 py-6 md:px-8"><Link to="/" search={{ category: undefined, q: undefined }} className="text-sm text-muted-foreground">Back to shops</Link><h1 className="mt-2 font-display text-3xl">Compare products</h1>{!auth.email && !auth.phone ? <p className="mt-6 text-sm text-muted-foreground">Sign in to compare products.</p> : query.data?.length ? <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">{query.data.map((p: any) => <div key={p.id} className="rounded-xl bg-card p-4 ring-1 ring-black/[0.05]"><h2 className="font-semibold">{p.name}</h2><dl className="mt-4 space-y-2 text-sm"><div><dt className="text-muted-foreground">Price</dt><dd>₹{p.discount_price ?? p.selling_price}</dd></div><div><dt className="text-muted-foreground">Brand</dt><dd>{p.brand_name ?? "-"}</dd></div><div><dt className="text-muted-foreground">Category</dt><dd>{p.category ?? "-"}</dd></div><div><dt className="text-muted-foreground">Rating</dt><dd>{Number(p.average_rating).toFixed(1)} ({p.review_count})</dd></div><div><dt className="text-muted-foreground">Availability</dt><dd>{p.stock > 0 ? "In stock" : "Out of stock"}</dd></div></dl></div>)}</div> : <p className="mt-6 text-sm text-muted-foreground">Add up to four products from the product page to compare them.</p>}</div></AppShell>;
}
