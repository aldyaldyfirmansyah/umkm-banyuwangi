import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Eye, Package, PackageCheck, PackageX, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingBlock, PageTitle, StatCard } from "@/components/dashboard/DashboardShell";
import { ModerationBadge, ProductStatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/site/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useMyUmkm } from "@/hooks/use-my-umkm";
import { formatDate, formatRupiah } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/toko/")({
  component: TokoRingkasan,
});

function TokoRingkasan() {
  const { data: store } = useMyUmkm();
  const { data: products, isLoading } = useQuery({
    queryKey: ["my-products", store?.id],
    enabled: !!store,
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("umkm_id", store!.id).order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading || !products) return <LoadingBlock />;
  const active = products.filter((p) => p.status === "active" && p.stock > 0).length;
  const soldOut = products.filter((p) => p.stock <= 0).length;
  const views = products.reduce((s, p) => s + p.views, 0);

  return (
    <>
      <PageTitle title="Ringkasan" description="Pantau performa produk toko Anda." action={<Button asChild><Link to="/toko/produk" search={{ baru: true }}><Plus /> Tambah produk</Link></Button>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total produk" value={products.length} icon={Package} />
        <StatCard label="Produk aktif" value={active} icon={PackageCheck} tone="cream" />
        <StatCard label="Produk habis" value={soldOut} icon={PackageX} tone="danger" />
        <StatCard label="Kunjungan produk" value={views} icon={Eye} tone="warning" />
      </div>
      <div className="mt-8 rounded-2xl border bg-card shadow-soft">
        <div className="border-b px-5 py-4"><h3 className="font-sans font-semibold">Aktivitas terbaru</h3></div>
        {products.length === 0 ? (
          <div className="p-5"><EmptyState title="Belum ada produk" description="Tambahkan produk pertama Anda agar pembeli bisa menemukannya." action={<Button asChild><Link to="/toko/produk" search={{ baru: true }}><Plus /> Tambah produk</Link></Button>} /></div>
        ) : (
          <ul className="divide-y">
            {products.slice(0, 6).map((p) => (
              <li key={p.id} className="flex items-center gap-4 px-5 py-3">
                {p.image ? <img src={p.image} alt="" className="size-12 rounded-lg object-cover" /> : <div className="size-12 rounded-lg bg-muted" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.product_name}</p>
                  <p className="text-xs text-muted-foreground">{formatRupiah(p.price)} · diperbarui {formatDate(p.updated_at)} · {p.views} kunjungan</p>
                </div>
                <div className="hidden gap-1 sm:flex"><ProductStatusBadge status={p.status} stock={p.stock} /><ModerationBadge status={p.moderation_status} /></div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
