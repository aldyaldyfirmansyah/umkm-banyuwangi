import { createFileRoute } from "@tanstack/react-router";
import { useAdminUmkm } from "@/hooks/use-admin-data";
import { LoadingBlock, PageTitle } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/_authenticated/admin/umkm")({ component: AdminUmkm });

function AdminUmkm() {
  const { data, isLoading } = useAdminUmkm();
  if (isLoading || !data) return <LoadingBlock />;
  return <><PageTitle title="Data UMKM" description="Kelola seluruh data UMKM yang terdaftar." /><div className="overflow-x-auto rounded-2xl border bg-card shadow-soft"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-4">Nama UMKM</th><th className="p-4">Pemilik</th><th className="p-4">Kecamatan</th><th className="p-4">Status</th><th className="p-4">Produk</th></tr></thead><tbody>{data.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="p-4 font-medium">{item.business_name}</td><td className="p-4">{item.owner_name}</td><td className="p-4">{item.district?.name ?? "-"}</td><td className="p-4">{item.verification_status}</td><td className="p-4">{item.product_count}</td></tr>)}</tbody></table></div></>;
}
