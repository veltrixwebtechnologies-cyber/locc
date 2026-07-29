import { ArrowLeftRight } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export function CompareButton({ productId }: { productId: string }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const key = ["compare", auth.email || auth.phone || "signed-out"];
  const comparison = useQuery({ queryKey: key, enabled: Boolean(auth.email || auth.phone), queryFn: async () => {
    const { data, error } = await (supabase as any).from("product_comparisons").select("product_id").order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row: { product_id: string }) => row.product_id);
  } });
  const mutation = useMutation({ mutationFn: async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) throw new Error("Sign in to compare products.");
    const ids = comparison.data ?? [];
    if (ids.includes(productId)) {
      const { error } = await (supabase as any).from("product_comparisons").delete().eq("product_id", productId).eq("user_id", session.session.user.id);
      if (error) throw error;
    } else {
      if (ids.length >= 4) throw new Error("You can compare up to 4 products.");
      const { error } = await (supabase as any).from("product_comparisons").insert({ user_id: session.session.user.id, product_id: productId });
      if (error) throw error;
    }
  }, onSuccess: () => void queryClient.invalidateQueries({ queryKey: key }), onError: (error: Error) => toast.error(error.message) });
  const active = comparison.data?.includes(productId) ?? false;
  return <button type="button" aria-label={active ? "Remove from compare" : "Add to compare"} onClick={() => mutation.mutate()} disabled={mutation.isPending} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs ring-1 ring-black/[0.08] ${active ? "bg-primary text-primary-foreground" : "bg-background"}`}><ArrowLeftRight className="h-3.5 w-3.5" />{active ? "Compared" : "Compare"}</button>;
}
