import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LoadingBlock, PageTitle } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/_authenticated/admin/pengguna")({ component: AdminPengguna });
function AdminPengguna() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: async () => { const { data, error } = await supabase.from("profiles").select("id,email,full_name,phone,is_active,created_at").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; } });
  if (isLoading || !data) return <LoadingBlock />;
  return <><PageTitle title="Pengguna" description="Daftar pengguna yang terdaftar di platform." /><div className="overflow-x-auto rounded-2xl border bg-card shadow-soft"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-4">Nama</th><th className="p-4">Email</th><th className="p-4">Telepon</th><th className="p-4">Status</th></tr></thead><tbody>{data.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="p-4 font-medium">{item.full_name}</td><td className="p-4">{item.email}</td><td className="p-4">{item.phone ?? "-"}</td><td className="p-4">{item.is_active ? "Aktif" : "Nonaktif"}</td></tr>)}</tbody></table></div></>;
}
