import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/site/ImageUpload";
import { insideBanyuwangi, LocationPicker } from "./LocationPicker";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { categoriesQuery, districtsQuery } from "@/lib/queries";

const url = z.string().trim().max(255).url("URL tidak valid (awali dengan https://)").or(z.literal(""));
const schema = z.object({
  business_name: z.string().trim().min(2, "Nama usaha minimal 2 karakter").max(100),
  owner_name: z.string().trim().min(2, "Nama pemilik minimal 2 karakter").max(100),
  whatsapp: z.string().trim().regex(/^(\+62|62|0)8[0-9]{7,12}$/, "Nomor WhatsApp tidak valid (contoh: 081234567890)"),
  category_id: z.string().uuid("Pilih kategori usaha"),
  district_id: z.string().uuid("Pilih kecamatan di Kabupaten Banyuwangi"),
  village: z.string().trim().min(3, "Desa/kelurahan wajib diisi").max(100),
  full_address: z.string().trim().min(10, "Alamat lengkap minimal 10 karakter").max(255),
  description: z.string().trim().min(20, "Deskripsi minimal 20 karakter").max(1000, "Deskripsi maksimal 1000 karakter"),
  instagram: url,
  facebook: url,
  tiktok: url,
});

type Umkm = Tables<"umkm">;

export function StoreForm({
  store,
  defaults,
  onSaved,
  submitLabel = "Simpan profil",
  requirePhoto = true,
}: {
  store?: Umkm | null;
  defaults?: { owner_name?: string; whatsapp?: string };
  onSaved?: () => void;
  submitLabel?: string;
  requirePhoto?: boolean;
}) {
  const qc = useQueryClient();
  const { data: districts = [] } = useQuery(districtsQuery());
  const { data: categories = [] } = useQuery(categoriesQuery());
  const [logo, setLogo] = useState<string | null>(store?.logo ?? null);
  const [lat, setLat] = useState<number | null>(store?.latitude ?? null);
  const [lng, setLng] = useState<number | null>(store?.longitude ?? null);
  const [form, setForm] = useState({
    business_name: store?.business_name ?? "",
    owner_name: store?.owner_name ?? defaults?.owner_name ?? "",
    whatsapp: store?.whatsapp ?? defaults?.whatsapp ?? "",
    category_id: store?.category_id ?? "",
    district_id: store?.district_id ?? "",
    village: store?.village ?? "",
    full_address: store?.full_address ?? store?.address ?? "",
    description: store?.description ?? "",
    instagram: store?.instagram ?? "",
    facebook: store?.facebook ?? "",
    tiktok: store?.tiktok ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const district = districts.find((d) => d.id === form.district_id);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    const errs: Record<string, string> = {};
    if (!parsed.success) for (const i of parsed.error.issues) errs[i.path[0] as string] ??= i.message;
    if (requirePhoto && !logo) errs.logo = "Foto usaha wajib diunggah";
    if ((lat == null) !== (lng == null)) errs.location = "Isi latitude dan longitude bersamaan";
    else if (lat != null && lng != null && !insideBanyuwangi(lat, lng)) errs.location = "Koordinat harus berada di Kabupaten Banyuwangi";
    if (!parsed.success || Object.keys(errs).length) {
      setErrors(errs);
      toast.error("Periksa kembali isian formulir");
      return;
    }
    setErrors({});
    setBusy(true);
    const payload = {
      ...parsed.data,
      address: parsed.data.full_address,
      city: "Banyuwangi",
      logo,
      latitude: lat,
      longitude: lng,
      instagram: parsed.data.instagram || null,
      facebook: parsed.data.facebook || null,
      tiktok: parsed.data.tiktok || null,
    };
    let error;
    if (store) {
      ({ error } = await supabase.from("umkm").update(payload).eq("id", store.id));
    } else {
      const { data: auth } = await supabase.auth.getUser();
      ({ error } = await supabase.from("umkm").insert({ ...payload, owner_id: auth.user!.id }));
    }
    setBusy(false);
    if (error) {
      toast.error("Gagal menyimpan: " + error.message);
      return;
    }
    toast.success(store ? "Profil UMKM diperbarui" : "UMKM berhasil didaftarkan, menunggu verifikasi admin");
    await qc.invalidateQueries({ queryKey: ["my-umkm"] });
    await qc.invalidateQueries({ queryKey: ["my-roles"] });
    await qc.invalidateQueries({ queryKey: ["admin-umkm"] });
    onSaved?.();
  }

  const F = ({ k, label, placeholder }: { k: keyof typeof form; label: string; placeholder?: string }) => (
    <div className="space-y-1.5">
      <Label htmlFor={`sf-${k}`}>{label}</Label>
      <Input id={`sf-${k}`} placeholder={placeholder} value={form[k]} onChange={set(k)} aria-invalid={!!errors[k]} />
      {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 md:grid-cols-[180px_1fr]">
      <div className="space-y-2">
        <Label>Logo / foto usaha</Label>
        <ImageUpload value={logo} onChange={setLogo} folder="logos" label="Unggah foto" />
        {errors.logo && <p className="text-xs text-destructive">{errors.logo}</p>}
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {F({ k: "business_name", label: "Nama UMKM" })}
          {F({ k: "owner_name", label: "Nama pemilik" })}
          {F({ k: "whatsapp", label: "Nomor WhatsApp", placeholder: "081234567890" })}
          <div className="space-y-1.5">
            <Label>Kategori usaha</Label>
            <Select value={form.category_id} onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))}>
              <SelectTrigger aria-invalid={!!errors.category_id}><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            {errors.category_id && <p className="text-xs text-destructive">{errors.category_id}</p>}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sf-description">Deskripsi usaha</Label>
          <Textarea id="sf-description" rows={4} value={form.description} onChange={set("description")} aria-invalid={!!errors.description} />
          {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
        </div>
        <div className="rounded-2xl border bg-muted/30 p-4">
          <p className="mb-3 text-sm font-semibold">Lokasi usaha <span className="font-normal text-muted-foreground">— Kabupaten Banyuwangi</span></p>
          <div className="space-y-4">
            {F({ k: "full_address", label: "Alamat lengkap", placeholder: "Nama jalan, nomor, dusun/RT/RW" })}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Kecamatan</Label>
                <Select value={form.district_id} onValueChange={(v) => setForm((f) => ({ ...f, district_id: v }))}>
                  <SelectTrigger aria-invalid={!!errors.district_id}><SelectValue placeholder="Pilih kecamatan" /></SelectTrigger>
                  <SelectContent>{districts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
                {errors.district_id && <p className="text-xs text-destructive">{errors.district_id}</p>}
              </div>
              {F({ k: "village", label: "Desa / Kelurahan" })}
            </div>
            <div>
              <Label className="mb-2 block">Titik koordinat (opsional)</Label>
              <LocationPicker
                lat={lat}
                lng={lng}
                onChange={(a, b) => { setLat(a); setLng(b); }}
                center={district?.latitude && district.longitude ? [district.latitude, district.longitude] : undefined}
              />
              {errors.location && <p className="mt-1 text-xs text-destructive">{errors.location}</p>}
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {F({ k: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." })}
          {F({ k: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." })}
          {F({ k: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@..." })}
        </div>
        <Button type="submit" size="lg" disabled={busy}>{busy && <Loader2 className="animate-spin" />} {submitLabel}</Button>
      </div>
    </form>
  );
}
