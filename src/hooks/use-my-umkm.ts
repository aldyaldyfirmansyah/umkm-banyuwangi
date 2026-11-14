import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export function useMyUmkm() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-umkm", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("umkm").select("*").eq("owner_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useAllCategories() {
  return useQuery({
    queryKey: ["categories-raw"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}
