import { createFileRoute } from "@tanstack/react-router";
import { useAdminProducts } from "@/hooks/use-admin-data";
import { LoadingBlock, PageTitle } from "@/components/dashboard/DashboardShell";
import { formatRupiah } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/produk")({ component: AdminProduk });

function AdminProduk() {
  const { data, isLoading } = useAdminProducts();
  if (isLoading || !data) return <LoadingBlock />;
  return <><PageTitle title="Produk" description="Pantau produk yang terdaftar di platform." /><div className="overflow-x-auto rounded-2xl border bg-card shadow-soft"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-4">Produk</th><th className="p-4">UMKM</th><th className="p-4">Harga</th><th className="p-4">Status</th></tr></thead><tbody>{data.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="p-4 font-medium">{item.product_name}</td><td className="p-4">{item.umkm?.business_name ?? "-"}</td><td className="p-4">{formatRupiah(item.price)}</td><td className="p-4">{item.moderation_status}</td></tr>)}</tbody></table></div></>;
}
