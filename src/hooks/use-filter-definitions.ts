import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type FilterDefinition } from "@/lib/filter-types";

export function useFilterDefinitions(
  categorySlug?: string,
  productTypeSlug?: string
) {
  return useQuery<FilterDefinition[]>({
    queryKey: ["filter-definitions", categorySlug, productTypeSlug],
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any).rpc("get_applicable_filters", {
          p_category_slug: categorySlug ?? null,
          p_product_type_slug: productTypeSlug ?? null,
        });

        if (error) {
          console.warn("RPC get_applicable_filters error, using fallback definitions:", error);
          return getFallbackFilterDefinitions(categorySlug);
        }

        return (data as FilterDefinition[]) ?? getFallbackFilterDefinitions(categorySlug);
      } catch (err) {
        console.warn("Filter definitions query fallback:", err);
        return getFallbackFilterDefinitions(categorySlug);
      }
    },
  });
}

function getFallbackFilterDefinitions(categorySlug?: string): FilterDefinition[] {
  const norm = (categorySlug || "").toLowerCase();

  const brandDef: FilterDefinition = {
    id: "brand",
    key: "brand",
    label: "Brand",
    type: "multi_select",
    is_universal: true,
    is_required: false,
    display_order: 1,
    options: [
      { id: "b1", value: "Nike", label: "Nike", display_order: 1 },
      { id: "b2", value: "Adidas", label: "Adidas", display_order: 2 },
      { id: "b3", value: "Puma", label: "Puma", display_order: 3 },
      { id: "b4", value: "Samsung", label: "Samsung", display_order: 4 },
      { id: "b5", value: "Apple", label: "Apple", display_order: 5 },
    ],
  };

  const priceDef: FilterDefinition = {
    id: "price",
    key: "price",
    label: "Price Range",
    type: "range",
    unit: "₹",
    is_universal: true,
    is_required: false,
    display_order: 2,
    options: [],
  };

  const ratingDef: FilterDefinition = {
    id: "rating",
    key: "rating",
    label: "Customer Rating",
    type: "rating",
    is_universal: true,
    is_required: false,
    display_order: 3,
    options: [],
  };

  if (norm.includes("fashion") || norm.includes("t-shirt") || norm.includes("clothing")) {
    return [
      brandDef,
      priceDef,
      {
        id: "size",
        key: "size",
        label: "Size",
        type: "multi_select",
        is_universal: false,
        is_required: true,
        display_order: 10,
        options: [
          { id: "s1", value: "XS", label: "XS", display_order: 1 },
          { id: "s2", value: "S", label: "S", display_order: 2 },
          { id: "s3", value: "M", label: "M", display_order: 3 },
          { id: "s4", value: "L", label: "L", display_order: 4 },
          { id: "s5", value: "XL", label: "XL", display_order: 5 },
          { id: "s6", value: "XXL", label: "XXL", display_order: 6 },
        ],
      },
      {
        id: "color",
        key: "color",
        label: "Color",
        type: "color",
        is_universal: false,
        is_required: true,
        display_order: 11,
        options: [
          { id: "c1", value: "Black", label: "Black", display_order: 1 },
          { id: "c2", value: "White", label: "White", display_order: 2 },
          { id: "c3", value: "Blue", label: "Navy Blue", display_order: 3 },
          { id: "c4", value: "Red", label: "Red", display_order: 4 },
          { id: "c5", value: "Green", label: "Olive Green", display_order: 5 },
        ],
      },
      {
        id: "fabric",
        key: "fabric",
        label: "Fabric",
        type: "multi_select",
        is_universal: false,
        is_required: false,
        display_order: 12,
        options: [
          { id: "f1", value: "Cotton", label: "Pure Cotton", display_order: 1 },
          { id: "f2", value: "Linen", label: "Linen", display_order: 2 },
          { id: "f3", value: "Polyester", label: "Polyester", display_order: 3 },
        ],
      },
      ratingDef,
    ];
  }

  if (norm.includes("mobile") || norm.includes("smartphone") || norm.includes("electronics")) {
    return [
      brandDef,
      priceDef,
      {
        id: "ram",
        key: "ram",
        label: "RAM",
        type: "multi_select",
        unit: "GB",
        is_universal: false,
        is_required: true,
        display_order: 10,
        options: [
          { id: "r1", value: "4GB", label: "4 GB", display_order: 1 },
          { id: "r2", value: "6GB", label: "6 GB", display_order: 2 },
          { id: "r3", value: "8GB", label: "8 GB", display_order: 3 },
          { id: "r4", value: "12GB", label: "12 GB", display_order: 4 },
        ],
      },
      {
        id: "storage",
        key: "storage",
        label: "Internal Storage",
        type: "multi_select",
        unit: "GB",
        is_universal: false,
        is_required: true,
        display_order: 11,
        options: [
          { id: "st1", value: "64GB", label: "64 GB", display_order: 1 },
          { id: "st2", value: "128GB", label: "128 GB", display_order: 2 },
          { id: "st3", value: "256GB", label: "256 GB", display_order: 3 },
          { id: "st4", value: "512GB", label: "512 GB", display_order: 4 },
        ],
      },
      {
        id: "network",
        key: "network",
        label: "Network",
        type: "single_select",
        is_universal: false,
        is_required: false,
        display_order: 12,
        options: [
          { id: "n1", value: "5G", label: "5G Supported", display_order: 1 },
          { id: "n2", value: "4G", label: "4G VoLTE", display_order: 2 },
        ],
      },
      ratingDef,
    ];
  }

  if (norm.includes("grocery") || norm.includes("kirana")) {
    return [
      brandDef,
      priceDef,
      {
        id: "pack_size",
        key: "pack_size",
        label: "Pack Size / Weight",
        type: "multi_select",
        is_universal: false,
        is_required: false,
        display_order: 10,
        options: [
          { id: "ps1", value: "500g", label: "500 g", display_order: 1 },
          { id: "ps2", value: "1kg", label: "1 kg", display_order: 2 },
          { id: "ps3", value: "5kg", label: "5 kg", display_order: 3 },
          { id: "ps4", value: "10kg", label: "10 kg", display_order: 4 },
        ],
      },
      {
        id: "organic",
        key: "organic",
        label: "Organic",
        type: "boolean",
        is_universal: false,
        is_required: false,
        display_order: 11,
        options: [],
      },
      ratingDef,
    ];
  }

  return [brandDef, priceDef, ratingDef];
}
