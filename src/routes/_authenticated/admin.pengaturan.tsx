import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LoadingBlock, PageTitle } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/_authenticated/admin/pengaturan")({ component: AdminPengaturan });
function AdminPengaturan() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-settings"], queryFn: async () => { const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(); if (error) throw error; return data; } });
  if (isLoading) return <LoadingBlock />;
  return <><PageTitle title="Pengaturan" description="Informasi konfigurasi platform saat ini." /><div className="rounded-2xl border bg-card p-6 shadow-soft"><dl className="grid gap-4 sm:grid-cols-2">{[["Nama situs", data?.site_name], ["Email", data?.email], ["Telepon", data?.phone], ["Alamat", data?.address]].map(([label, value]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value || "Belum diatur"}</dd></div>)}</dl></div></>;
}
