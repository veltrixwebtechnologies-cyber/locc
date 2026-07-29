import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Star } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProductThumb } from "@/components/product-thumb";
import { CompareButton } from "@/components/compare-button";
import { WishlistButton } from "@/components/wishlist-button";
import { supabase } from "@/integrations/supabase/client";
import { recordProductEvent, recordRecentProductView, type MerchandisingProduct } from "@/lib/merchandising";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$productId")({ component: ProductPage });

function ProductPage() {
  const { productId } = Route.useParams();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const product = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("public_merchandising_products").select("*").eq("id", productId).single();
      if (error) throw error;
      void recordProductEvent(productId, "view");
      void recordRecentProductView(productId);
      return data as MerchandisingProduct;
    },
  });
  const reviews = useQuery({
    queryKey: ["product-reviews", productId],
    enabled: Boolean(product.data),
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("reviews").select("id,rating,title,body,created_at,user_id").eq("product_id", productId).eq("status", "approved").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const submitReview = useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) throw new Error("Sign in to review this product.");
      if (!body.trim()) throw new Error("Write a short review first.");
      const { error } = await (supabase as any).from("reviews").insert({ product_id: productId, user_id: session.session.user.id, rating, body: body.trim(), status: "pending" });
      if (error) throw error;
    },
    onSuccess: () => { setBody(""); toast.success("Review submitted for approval"); void queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] }); },
    onError: (error: Error) => toast.error(error.message),
  });

  if (product.isLoading) return <AppShell><div className="p-8 text-center text-sm text-muted-foreground">Loading product...</div></AppShell>;
  if (product.error || !product.data) return <AppShell><div className="p-8 text-center"><p className="font-display text-xl">Product unavailable</p><Link className="mt-3 inline-block text-primary underline" to="/">Back to shops</Link></div></AppShell>;
  const item = product.data;
  return <AppShell>
    <div className="px-5 py-6 md:px-8">
      <Link to="/" search={{ category: undefined, q: undefined }} className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Back to shops</Link>
      <div className="mt-5 grid gap-6 md:grid-cols-[minmax(260px,380px)_1fr]">
        <div className="rounded-xl bg-card p-4 ring-1 ring-black/[0.05]"><ProductThumb src={item.image_url ?? undefined} alt={item.name} category="grocery" /></div>
        <div>
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">{item.shop_name}</p><h1 className="mt-1 font-display text-3xl">{item.name}</h1></div><WishlistButton productId={item.id} productName={item.name} item={{ productId: item.id, name: item.name, shopName: item.shop_name, category: item.category ?? "Other", price: Number(item.discount_price ?? item.selling_price), imageUrl: item.image_url ?? undefined, sellerId: item.seller_id }} /></div>
          <p className="mt-3 text-sm text-muted-foreground">{item.category ?? "Product"} {item.brand_name ? `· ${item.brand_name}` : ""}</p>
          <div className="mt-5 flex items-center gap-3"><span className="font-mono text-2xl font-bold">₹{item.discount_price ?? item.selling_price}</span>{item.discount_price && <span className="text-sm text-muted-foreground line-through">₹{item.mrp}</span>}<span className="inline-flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-[var(--marigold)] text-[var(--marigold)]" /> {Number(item.average_rating).toFixed(1)} ({item.review_count})</span></div>
          <p className="mt-4 text-sm">{item.stock > 0 ? `${item.stock} available` : "Out of stock"}</p>
          <div className="mt-5 flex items-center gap-2"><Link to="/store/$storeId" params={{ storeId: item.seller_id }} className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Visit {item.shop_name}</Link><CompareButton productId={item.id} /></div>
        </div>
      </div>
      <section className="mt-8 rounded-xl bg-card p-5 ring-1 ring-black/[0.05]"><h2 className="font-display text-xl font-bold">Customer reviews</h2>{auth.email || auth.phone ? <div className="mt-4 grid gap-2 md:max-w-xl"><label className="text-sm">Your rating <select value={rating} onChange={e => setRating(Number(e.target.value))} className="ml-2 rounded border px-2 py-1">{[5,4,3,2,1].map(v => <option key={v} value={v}>{v} stars</option>)}</select></label><textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Share your experience" className="min-h-24 rounded-lg border bg-background p-3 text-sm" /><button type="button" disabled={submitReview.isPending} onClick={() => submitReview.mutate()} className="w-fit rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{submitReview.isPending ? "Submitting..." : "Submit review"}</button></div> : <p className="mt-3 text-sm text-muted-foreground">Sign in to write a review.</p>}<div className="mt-6 space-y-3">{reviews.data?.map((review: any) => <article key={review.id} className="border-t pt-3"><p className="text-sm font-semibold">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p><p className="mt-1 text-sm">{review.body}</p></article>)}{!reviews.data?.length && <p className="text-sm text-muted-foreground">No approved reviews yet.</p>}</div></section>
    </div>
  </AppShell>;
}
