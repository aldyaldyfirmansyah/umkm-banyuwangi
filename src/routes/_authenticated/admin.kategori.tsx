import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LoadingBlock, PageTitle } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/_authenticated/admin/kategori")({ component: AdminKategori });
function AdminKategori() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["admin-categories"], queryFn: async () => { const { data, error } = await supabase.from("categories").select("id,name,slug,sort_order").order("sort_order"); if (error) throw error; return data ?? []; } });

  async function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanSlug = slug.trim() || cleanName.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (cleanName.length < 2 || !cleanSlug) { toast.error("Nama kategori dan slug wajib diisi."); return; }
    setBusy(true);
    const { error } = await supabase.from("categories").insert({ name: cleanName, slug: cleanSlug, sort_order: (data?.length ?? 0) + 1 });
    setBusy(false);
    if (error) { toast.error(error.code === "23505" ? "Nama atau slug kategori sudah digunakan." : error.message); return; }
    setName(""); setSlug("");
    await queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    await queryClient.invalidateQueries({ queryKey: ["categories"] });
    toast.success("Kategori berhasil ditambahkan.");
  }

  if (isLoading || !data) return <LoadingBlock />;
  return <>
    <PageTitle title="Kategori" description="Daftar kategori produk UMKM." />
    <form onSubmit={addCategory} className="mb-6 rounded-2xl border bg-card p-5 shadow-soft">
      <h2 className="font-semibold">Tambah kategori</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="category-name">Nama kategori</Label><Input id="category-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Contoh: Kuliner" /></div>
        <div className="space-y-1.5"><Label htmlFor="category-slug">Slug (opsional)</Label><Input id="category-slug" value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="kuliner" /></div>
      </div>
      <Button type="submit" className="mt-4" disabled={busy}>{busy ? "Menyimpan..." : "Tambah kategori"}</Button>
    </form>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.map((item) => <div key={item.id} className="rounded-2xl border bg-card p-5 shadow-soft"><p className="font-semibold">{item.name}</p><p className="mt-1 text-sm text-muted-foreground">/{item.slug}</p></div>)}</div>
  </>;
}
