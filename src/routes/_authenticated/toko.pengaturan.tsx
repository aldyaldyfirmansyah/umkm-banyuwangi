import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LoadingBlock, PageTitle } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useMyUmkm } from "@/hooks/use-my-umkm";

export const Route = createFileRoute("/_authenticated/toko/pengaturan")({
  component: TokoPengaturan,
});

function TokoPengaturan() {
  const { data: store, isLoading } = useMyUmkm();
  if (isLoading || !store) return <LoadingBlock />;
  return <SettingsForm key={store.updated_at} store={store} />;
}

function SettingsForm({ store }: { store: NonNullable<ReturnType<typeof useMyUmkm>["data"]> }) {
  const qc = useQueryClient();
  const [active, setActive] = useState(store.is_active);
  const [whatsapp, setWhatsapp] = useState(store.whatsapp);
  const [hours, setHours] = useState(store.opening_hours ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!/^(\+62|62|0)8[0-9]{7,12}$/.test(whatsapp.trim())) errs.whatsapp = "Nomor WhatsApp tidak valid (contoh: 081234567890)";
    if (hours.length > 120) errs.hours = "Maksimal 120 karakter";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    const { error } = await supabase.from("umkm").update({ is_active: active, whatsapp: whatsapp.trim(), opening_hours: hours.trim() || null }).eq("id", store.id);
    setBusy(false);
    if (error) return toast.error("Gagal menyimpan: " + error.message);
    toast.success("Pengaturan toko disimpan");
    qc.invalidateQueries({ queryKey: ["my-umkm"] });
  }

  async function resubmit() {
    const { error } = await supabase.from("umkm").update({ verification_status: "pending" }).eq("id", store.id);
    if (error) return toast.error(error.message);
    toast.success("Pengajuan verifikasi dikirim ulang");
    qc.invalidateQueries({ queryKey: ["my-umkm"] });
  }

  return (
    <>
      <PageTitle title="Pengaturan Toko" />
      <form onSubmit={save} noValidate className="space-y-6 rounded-2xl border bg-card p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4 rounded-xl bg-muted/50 p-4">
          <div>
            <p className="font-semibold">Status toko</p>
            <p className="text-sm text-muted-foreground">{active ? "Toko aktif dan dapat dilihat pengunjung." : "Toko disembunyikan sementara dari publik."}</p>
          </div>
          <Switch checked={active} onCheckedChange={setActive} aria-label="Status toko aktif" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="wa">Nomor WhatsApp pemesanan</Label>
            <Input id="wa" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} aria-invalid={!!errors.whatsapp} />
            {errors.whatsapp && <p className="text-xs text-destructive">{errors.whatsapp}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hours">Jam operasional</Label>
            <Input id="hours" placeholder="Senin–Sabtu, 08.00–17.00" value={hours} onChange={(e) => setHours(e.target.value)} aria-invalid={!!errors.hours} />
            {errors.hours && <p className="text-xs text-destructive">{errors.hours}</p>}
          </div>
        </div>
        <Button type="submit" size="lg" disabled={busy}>{busy && <Loader2 className="animate-spin" />} Simpan pengaturan</Button>
      </form>
      {store.verification_status === "rejected" && (
        <div className="mt-6 rounded-2xl border bg-card p-6 shadow-soft">
          <p className="font-semibold">Ajukan ulang verifikasi</p>
          <p className="mt-1 text-sm text-muted-foreground">Pastikan profil UMKM sudah diperbaiki sesuai catatan admin.</p>
          <Button className="mt-4" variant="soft" onClick={resubmit}><RotateCcw /> Ajukan ulang</Button>
        </div>
      )}
    </>
  );
}
