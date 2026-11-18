import { createFileRoute } from "@tanstack/react-router";
import { useAdminDistricts } from "@/hooks/use-admin-data";
import { LoadingBlock, PageTitle } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/_authenticated/admin/kecamatan")({ component: AdminKecamatan });
function AdminKecamatan() {
  const { data, isLoading } = useAdminDistricts();
  if (isLoading || !data) return <LoadingBlock />;
  return <><PageTitle title="Kecamatan" description="Daftar kecamatan di Kabupaten Banyuwangi." /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.map((item) => <div key={item.id} className="rounded-2xl border bg-card p-5 shadow-soft"><p className="font-semibold">{item.name}</p><p className="mt-1 text-sm text-muted-foreground">{item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : "Koordinat belum tersedia"}</p></div>)}</div></>;
}
