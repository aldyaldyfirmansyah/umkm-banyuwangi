import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/lupa-password")({
  head: () => ({
    meta: [
      { title: "Lupa Password — UMKM BANYUWANGI" },
      { name: "description", content: "Atur ulang password akun UMKM BANYUWANGI Anda." },
      { property: "og:title", content: "Lupa Password — UMKM BANYUWANGI" },
      { property: "og:description", content: "Kirim tautan untuk mengatur ulang password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LupaPassword,
});

function LupaPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = z.string().trim().email().safeParse(email);
    if (!parsed.success) return setError("Format email tidak valid");
    setError(null);
    setBusy(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (err) return toast.error(err.message);
    setSent(true);
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-lift">
        {sent ? (
          <div className="text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary"><MailCheck className="size-7" /></div>
            <h1 className="mt-4 text-2xl font-semibold">Cek email Anda</h1>
            <p className="mt-2 text-sm text-muted-foreground">Jika email terdaftar, tautan untuk mengatur ulang password telah dikirim.</p>
            <Button asChild variant="soft" className="mt-6"><Link to="/auth" search={{ mode: "login" }}>Kembali ke halaman masuk</Link></Button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-4">
            <h1 className="text-2xl font-semibold text-primary-deep">Lupa password?</h1>
            <p className="text-sm text-muted-foreground">Masukkan email akun Anda dan kami akan mengirimkan tautan untuk membuat password baru.</p>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={busy}>{busy && <Loader2 className="animate-spin" />} Kirim tautan</Button>
            <Link to="/auth" search={{ mode: "login" }} className="block text-center text-sm text-primary hover:underline">Kembali ke halaman masuk</Link>
          </form>
        )}
      </div>
    </div>
  );
}
