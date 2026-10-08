import type { LocalShoreRole } from "@/shared/core/roles";
export type { LocalShoreRole } from "@/shared/core/roles";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";



export function useLocalShoreRoles() {
  const auth = useAuth();
  const query = useQuery({
    queryKey: ["localshore-roles", auth.id],
    enabled: Boolean(auth.id),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("user_roles")
        .select("role,status")
        .eq("user_id", auth.id);
      if (error) throw error;
      return (data ?? []).map((row: { role: string }) => row.role as LocalShoreRole);
    },
  });
  return {
    ...query,
    roles: query.data ?? [],
    hasRole: (role: LocalShoreRole) => (query.data ?? []).includes(role),
  };
}
