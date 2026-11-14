import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/site/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const url = z.string().trim().max(255).url("URL tidak valid (awali dengan https://)").or(z.literal(""));
const schema = z.object({
  business_name: z.string().trim().min(2, "Nama usaha minimal 2 karakter").max(100),
  owner_name: z.string().trim().min(2, "Nama pemilik minimal 2 karakter").max(100),
  whatsapp: z.string().trim().regex(/^(\+62|62|0)8[0-9]{7,12}$/, "Nomor WhatsApp tidak valid (contoh: 081234567890)"),
  address: z.string().trim().min(5, "Alamat minimal 5 karakter").max(255),
  city: z.string().trim().min(2, "Kota/kabupaten wajib diisi").max(80),
  description: z.string().trim().max(1000, "Deskripsi maksimal 1000 karakter"),
  instagram: url,
  facebook: url,
  tiktok: url,
});

type Umkm = Tables<"umkm">;

export function StoreForm({ store, defaults, onSaved, submitLabel = "Simpan profil" }: { store?: Umkm | null; defaults?: { owner_name?: string; whatsapp?: string }; onSaved?: () => void; submitLabel?: string }) {
  const qc = useQueryClient();
  const [logo, setLogo] = useState<string | null>(store?.logo ?? null);
  const [form, setForm] = useState({
    business_name: store?.business_name ?? "",
    owner_name: store?.owner_name ?? defaults?.owner_name ?? "",
    whatsapp: store?.whatsapp ?? defaults?.whatsapp ?? "",
    address: store?.address ?? "",
    city: store?.city ?? "",
    description: store?.description ?? "",
    instagram: store?.instagram ?? "",
    facebook: store?.facebook ?? "",
    tiktok: store?.tiktok ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[i.path[0] as string] ??= i.message;
      setErrors(errs);
      toast.error("Periksa kembali isian formulir");
      return;
    }
    setErrors({});
    setBusy(true);
    const payload = {
      ...parsed.data,
      logo,
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
    onSaved?.();
  }

  const F = ({ k, label, type = "text", placeholder }: { k: keyof typeof form; label: string; type?: string; placeholder?: string }) => (
    <div className="space-y-1.5">
      <Label htmlFor={`sf-${k}`}>{label}</Label>
      <Input id={`sf-${k}`} type={type} placeholder={placeholder} value={form[k]} onChange={set(k)} aria-invalid={!!errors[k]} />
      {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 md:grid-cols-[180px_1fr]">
      <div className="space-y-2">
        <Label>Logo / foto usaha</Label>
        <ImageUpload value={logo} onChange={setLogo} folder="logos" label="Unggah logo" />
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {F({ k: "business_name", label: "Nama usaha" })}
          {F({ k: "owner_name", label: "Nama pemilik" })}
          {F({ k: "whatsapp", label: "Nomor WhatsApp", placeholder: "081234567890" })}
          {F({ k: "city", label: "Kabupaten / Kota" })}
        </div>
        {F({ k: "address", label: "Alamat usaha" })}
        <div className="space-y-1.5">
          <Label htmlFor="sf-description">Deskripsi usaha</Label>
          <Textarea id="sf-description" rows={4} value={form.description} onChange={set("description")} aria-invalid={!!errors.description} />
          {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
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
