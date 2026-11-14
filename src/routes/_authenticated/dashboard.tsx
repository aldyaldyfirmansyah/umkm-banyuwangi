import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Loader2, ShieldCheck, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingBlock } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Akun Saya — UMKM BANYUWANGI" }, { name: "robots", content: "noindex" }] }),
  component: AkunPage,
});

function AkunPage() {
  const { user, isAdmin, isUmkm } = useAuth();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container-page max-w-4xl py-10">
      <h1 className="text-3xl font-semibold text-primary-deep">Akun Saya</h1>
      <p className="mt-1 text-muted-foreground">{user?.email}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link to="/toko" className="group flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-soft hover:border-primary">
          <span className="grid size-12 place-items-center rounded-xl bg-primary-soft text-primary"><Store className="size-6" /></span>
          <div className="flex-1"><p className="font-semibold">{isUmkm ? "Dashboard Toko" : "Daftarkan UMKM"}</p><p className="text-sm text-muted-foreground">{isUmkm ? "Kelola produk dan profil usaha" : "Mulai berjualan di UMKM Banyuwangi"}</p></div>
          <ArrowRight className="size-5 text-muted-foreground group-hover:text-primary" />
        </Link>
        {isAdmin && (
          <Link to="/admin" className="group flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-soft hover:border-primary">
            <span className="grid size-12 place-items-center rounded-xl bg-gold/20 text-gold-foreground"><ShieldCheck className="size-6" /></span>
            <div className="flex-1"><p className="font-semibold">Dashboard Admin</p><p className="text-sm text-muted-foreground">Kelola platform dan verifikasi UMKM</p></div>
            <ArrowRight className="size-5 text-muted-foreground group-hover:text-primary" />
          </Link>
        )}
      </div>
      <div className="mt-8 rounded-2xl border bg-card p-6 shadow-soft">
        <h2 className="font-sans text-lg font-semibold">Data diri</h2>
        {isLoading || !profile ? <LoadingBlock /> : <ProfileForm key={profile.id} profile={profile} />}
      </div>
    </div>
  );
}

function ProfileForm({ profile }: { profile: { id: string; full_name: string; phone: string | null } }) {
  const qc = useQueryClient();
  const [name, setName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  async function save(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (name.trim().length < 2 || name.length > 100) errs.name = "Nama 2–100 karakter";
    if (phone && !/^(\+62|62|0)8[0-9]{7,12}$/.test(phone.trim())) errs.phone = "Nomor tidak valid";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ full_name: name.trim(), phone: phone.trim() || null }).eq("id", profile.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profil disimpan");
    qc.invalidateQueries({ queryKey: ["my-profile"] });
  }
  return (
    <form onSubmit={save} noValidate className="mt-4 grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5"><Label htmlFor="pn">Nama lengkap</Label><Input id="pn" value={name} onChange={(e) => setName(e.target.value)} />{errors.name && <p className="text-xs text-destructive">{errors.name}</p>}</div>
      <div className="space-y-1.5"><Label htmlFor="pp">Nomor HP</Label><Input id="pp" value={phone} onChange={(e) => setPhone(e.target.value)} />{errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}</div>
      <div><Button type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" />} Simpan</Button></div>
    </form>
  );
}
