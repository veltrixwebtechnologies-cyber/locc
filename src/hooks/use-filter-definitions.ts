import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type FilterDefinition } from "@/lib/filter-types";
import { getCategoryAwareFilterDefinitions } from "@/lib/category-filter-registry";

let isFilterDefRpcUnavailable = false;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("RPC_TIMEOUT")), timeoutMs);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export function useFilterDefinitions(
  categorySlug?: string,
  subcategorySlug?: string,
  productTypeSlug?: string,
  query?: string,
) {
  return useQuery<FilterDefinition[]>({
    queryKey: ["filter-definitions-v2", categorySlug, subcategorySlug, productTypeSlug, query],
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: false,
    queryFn: async () => {
      const fallbackDefs = getCategoryAwareFilterDefinitions(
        categorySlug,
        subcategorySlug,
        productTypeSlug,
        query,
      );

      if (!isFilterDefRpcUnavailable) {
        try {
          const rpcPromise = (supabase as any).rpc("get_applicable_filters", {
            p_category_slug: categorySlug ?? null,
            p_subcategory_slug: subcategorySlug ?? null,
            p_product_type_slug: productTypeSlug ?? null,
            p_query: query ?? null,
          });

          const { data, error } = (await withTimeout(rpcPromise, 800)) as any;

          if (error) {
            console.warn("RPC get_applicable_filters error, using category-aware definitions:", error);
            isFilterDefRpcUnavailable = true;
            return fallbackDefs;
          }

          if (data && Array.isArray(data) && data.length > 0) {
            // Merge options if remote options are empty
            const merged = data.map((remoteDef: FilterDefinition) => {
              if (!remoteDef.options || remoteDef.options.length === 0) {
                const foundFallback = fallbackDefs.find((f) => f.key === remoteDef.key);
                if (foundFallback && foundFallback.options.length > 0) {
                  return { ...remoteDef, options: foundFallback.options };
                }
              }
              return remoteDef;
            });

            // Ensure any category-aware filters missing from remote RPC are also included
            for (const fb of fallbackDefs) {
              if (!merged.some((m) => m.key === fb.key)) {
                merged.push(fb);
              }
            }

            return merged.sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99));
          }

          return fallbackDefs;
        } catch (err) {
          console.warn("Filter definitions query fallback:", err);
          isFilterDefRpcUnavailable = true;
          return fallbackDefs;
        }
      }
      return fallbackDefs;
    },
  });
}
