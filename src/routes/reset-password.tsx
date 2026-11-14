import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Atur Password Baru — UMKM BANYUWANGI" },
      { name: "description", content: "Buat password baru untuk akun UMKM BANYUWANGI Anda." },
      { property: "og:title", content: "Atur Password Baru — UMKM BANYUWANGI" },
      { property: "og:description", content: "Buat password baru untuk akun Anda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) setRecovery(true);
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return setError("Password minimal 8 karakter dan mengandung huruf serta angka.");
    if (password !== confirm) return setError("Konfirmasi password tidak sama.");
    setError(null);
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) return toast.error(err.message);
    toast.success("Password berhasil diperbarui");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <form onSubmit={submit} noValidate className="w-full max-w-md space-y-4 rounded-3xl border bg-card p-8 shadow-lift">
        <h1 className="text-2xl font-semibold text-primary-deep">Atur password baru</h1>
        {!recovery && <p className="rounded-xl bg-cream p-3 text-xs text-cream-foreground">Buka halaman ini dari tautan yang dikirim ke email Anda.</p>}
        <div className="space-y-1.5"><Label htmlFor="pw">Password baru</Label><Input id="pw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="pw2">Konfirmasi password</Label><Input id="pw2" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={busy}>{busy && <Loader2 className="animate-spin" />} Simpan password</Button>
      </form>
    </div>
  );
}
