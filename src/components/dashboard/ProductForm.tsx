import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/site/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const schema = z.object({
  product_name: z.string().trim().min(3, "Nama produk minimal 3 karakter").max(120),
  category_id: z.string().uuid("Pilih kategori"),
  price: z.coerce.number({ invalid_type_error: "Harga harus angka" }).min(100, "Harga minimal Rp100").max(1_000_000_000),
  stock: z.coerce.number({ invalid_type_error: "Stok harus angka" }).int("Stok harus bilangan bulat").min(0, "Stok tidak boleh negatif").max(1_000_000),
  description: z.string().trim().min(10, "Deskripsi minimal 10 karakter").max(3000, "Deskripsi maksimal 3000 karakter"),
});

type Product = Tables<"products">;
type Category = Tables<"categories">;

export function ProductForm({
  product,
  umkmId,
  categories,
  onSaved,
  adminMode,
}: {
  product?: Product | null;
  umkmId: string;
  categories: Category[];
  onSaved: () => void;
  adminMode?: boolean;
}) {
  const [form, setForm] = useState({
    product_name: product?.product_name ?? "",
    category_id: product?.category_id ?? "",
    price: product?.price?.toString() ?? "",
    stock: product?.stock?.toString() ?? "",
    description: product?.description ?? "",
  });
  const [active, setActive] = useState(product ? product.status === "active" : true);
  const [featured, setFeatured] = useState(product?.is_featured ?? false);
  const [mainImage, setMainImage] = useState<string | null>(product?.image ?? null);
  const [extra, setExtra] = useState<string[]>((product?.images ?? []).filter((i) => i !== product?.image));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    const errs: Record<string, string> = {};
    if (!parsed.success) for (const i of parsed.error.issues) errs[i.path[0] as string] ??= i.message;
    if (!mainImage) errs.image = "Foto utama produk wajib diunggah";
    if (Object.keys(errs).length || !parsed.success) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    const payload = {
      ...parsed.data,
      image: mainImage,
      images: [mainImage!, ...extra],
      status: (active ? "active" : "inactive") as "active" | "inactive",
      ...(adminMode ? { is_featured: featured } : {}),
    };
    const { error } = product
      ? await supabase.from("products").update(payload).eq("id", product.id)
      : await supabase.from("products").insert({ ...payload, umkm_id: umkmId });
    setBusy(false);
    if (error) {
      toast.error("Gagal menyimpan produk: " + error.message);
      return;
    }
    toast.success(product ? "Produk berhasil diperbarui" : adminMode ? "Produk ditambahkan" : "Produk ditambahkan dan menunggu persetujuan admin");
    onSaved();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
        <div className="space-y-2">
          <Label>Foto utama</Label>
          <ImageUpload value={mainImage} onChange={setMainImage} folder="products" />
          {errors.image && <p className="text-xs text-destructive">{errors.image}</p>}
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pf-name">Nama produk</Label>
            <Input id="pf-name" value={form.product_name} onChange={set("product_name")} aria-invalid={!!errors.product_name} />
            {errors.product_name && <p className="text-xs text-destructive">{errors.product_name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Kategori</Label>
            <Select value={form.category_id} onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))}>
              <SelectTrigger aria-invalid={!!errors.category_id}><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.category_id && <p className="text-xs text-destructive">{errors.category_id}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pf-price">Harga (Rp)</Label>
              <Input id="pf-price" inputMode="numeric" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value.replace(/[^\d]/g, "") }))} aria-invalid={!!errors.price} />
              {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-stock">Stok</Label>
              <Input id="pf-stock" inputMode="numeric" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value.replace(/[^\d]/g, "") }))} aria-invalid={!!errors.stock} />
              {errors.stock && <p className="text-xs text-destructive">{errors.stock}</p>}
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Foto tambahan (maks. 4)</Label>
        <div className="grid grid-cols-4 gap-2">
          {extra.map((img, i) => (
            <ImageUpload key={img} value={img} folder="products" onChange={(v) => setExtra((arr) => (v ? arr.map((x, j) => (j === i ? v : x)) : arr.filter((_, j) => j !== i)))} />
          ))}
          {extra.length < 4 && (
            <ImageUpload value={null} folder="products" label="Tambah" onChange={(v) => v && setExtra((arr) => [...arr, v])} />
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pf-desc">Deskripsi</Label>
        <Textarea id="pf-desc" rows={5} value={form.description} onChange={set("description")} aria-invalid={!!errors.description} />
        {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
      </div>
      <div className="flex flex-wrap gap-6 rounded-xl bg-muted/50 p-4">
        <label className="flex items-center gap-3 text-sm font-medium">
          <Switch checked={active} onCheckedChange={setActive} /> Produk aktif (tampil di katalog)
        </label>
        {adminMode && (
          <label className="flex items-center gap-3 text-sm font-medium">
            <Switch checked={featured} onCheckedChange={setFeatured} /> Produk unggulan
          </label>
        )}
      </div>
      <Button type="submit" size="lg" disabled={busy} className="w-full sm:w-auto">
        {busy ? <Loader2 className="animate-spin" /> : <Plus />} {product ? "Simpan perubahan" : "Tambah produk"}
      </Button>
    </form>
  );
}
