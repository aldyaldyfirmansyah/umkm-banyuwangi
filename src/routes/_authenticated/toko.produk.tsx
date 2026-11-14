import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingBlock, PageTitle } from "@/components/dashboard/DashboardShell";
import { ProductForm } from "@/components/dashboard/ProductForm";
import { ModerationBadge, ProductStatusBadge } from "@/components/dashboard/StatusBadge";
import { ConfirmDialog } from "@/components/site/ConfirmDialog";
import { EmptyState } from "@/components/site/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAllCategories, useMyUmkm } from "@/hooks/use-my-umkm";
import { formatRupiah } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/toko/produk")({
  validateSearch: (s: Record<string, unknown>): { baru?: boolean } => ({ baru: s.baru === true || s.baru === "true" ? true : undefined }),
  component: TokoProduk,
});

function TokoProduk() {
  const search = Route.useSearch();
  const qc = useQueryClient();
  const { data: store } = useMyUmkm();
  const { data: categories = [] } = useAllCategories();
  const [editing, setEditing] = useState<Tables<"products"> | null>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => { if (search.baru) { setEditing(null); setOpen(true); } }, [search.baru]);

  const { data: products, isLoading } = useQuery({
    queryKey: ["my-products", store?.id],
    enabled: !!store,
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("umkm_id", store!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["my-products"] });

  async function toggle(p: Tables<"products">, active: boolean) {
    const { error } = await supabase.from("products").update({ status: active ? "active" : "inactive" }).eq("id", p.id);
    if (error) return toast.error("Gagal mengubah status: " + error.message);
    toast.success(active ? "Produk diaktifkan" : "Produk dinonaktifkan");
    refresh();
  }

  async function remove(p: Tables<"products">) {
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast.error("Gagal menghapus: " + error.message);
    toast.success("Produk dihapus");
    refresh();
  }

  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "-";
  const list = (products ?? []).filter((p) => p.product_name.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageTitle title="Manajemen Produk" description="Produk baru akan ditinjau admin sebelum tampil di katalog." action={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus /> Tambah produk</Button>} />
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari produk saya" className="pl-9" />
      </div>
      {isLoading || !products ? (
        <LoadingBlock />
      ) : list.length === 0 ? (
        <EmptyState title={products.length ? "Produk tidak ditemukan" : "Belum ada produk"} description="Tambahkan produk dengan foto menarik dan deskripsi lengkap." action={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus /> Tambah produk</Button>} />
      ) : (
        <div className="space-y-3">
          {list.map((p) => (
            <div key={p.id} className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-soft sm:flex-row sm:items-center">
              {p.image ? <img src={p.image} alt="" className="size-20 rounded-xl object-cover" /> : <div className="size-20 rounded-xl bg-muted" />}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{p.product_name}</p>
                <p className="text-sm text-muted-foreground">{catName(p.category_id)} · {formatRupiah(p.price)} · Stok {p.stock} · {p.views} kunjungan</p>
                <div className="mt-2 flex flex-wrap gap-1"><ProductStatusBadge status={p.status} stock={p.stock} /><ModerationBadge status={p.moderation_status} /></div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-muted-foreground"><Switch checked={p.status === "active"} onCheckedChange={(c) => toggle(p, c)} aria-label="Aktifkan produk" /> Aktif</label>
                {p.moderation_status === "approved" && p.status === "active" && (
                  <Button asChild variant="ghost" size="icon" aria-label="Lihat di katalog"><Link to="/produk/$id" params={{ id: p.id }}><ExternalLink /></Link></Button>
                )}
                <Button variant="outline" size="sm" onClick={() => { setEditing(p); setOpen(true); }}><Pencil /> Edit</Button>
                <ConfirmDialog
                  title="Hapus produk?"
                  description={`"${p.product_name}" akan dihapus permanen dan tidak dapat dikembalikan.`}
                  onConfirm={() => remove(p)}
                  trigger={<Button variant="ghost" size="icon" className="text-destructive" aria-label="Hapus"><Trash2 /></Button>}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit produk" : "Tambah produk"}</DialogTitle></DialogHeader>
          {store && (
            <ProductForm key={editing?.id ?? "new"} product={editing} umkmId={store.id} categories={categories} onSaved={() => { setOpen(false); refresh(); }} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
