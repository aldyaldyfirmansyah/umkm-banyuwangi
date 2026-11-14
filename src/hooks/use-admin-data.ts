import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminUmkm() {
  return useQuery({
    queryKey: ["admin-umkm"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("umkm")
        .select("*, district:districts(id, name, slug), category:categories(id, name), products(count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((u) => ({ ...u, product_count: (u.products as unknown as { count: number }[])?.[0]?.count ?? 0 }));
    },
  });
}

export function useAdminDistricts() {
  return useQuery({
    queryKey: ["admin-districts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("districts").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, umkm:umkm(id, business_name, district:districts(name)), category:categories(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type AdminUmkm = NonNullable<ReturnType<typeof useAdminUmkm>["data"]>[number];
