import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleButton } from "@/components/site/GoogleButton";
import { Logo } from "@/components/site/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { homeForCurrentUser } from "@/lib/post-login";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Masuk — UMKM BANYUWANGI" },
      { name: "description", content: "Masuk ke akun UMKM BANYUWANGI." },
    ],
  }),
  component: LoginPage,
});

const loginSchema = z.object({
  email: z.string().trim().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) {
      homeForCurrentUser().then((target) => navigate({ to: target, replace: true }));
    }
  }, [navigate, ready, user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0] as string, issue.message])));
      return;
    }

    setErrors({});
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);

    if (error) {
      toast.error(/invalid login/i.test(error.message) ? "Email atau password salah." : error.message);
      return;
    }

    toast.success("Berhasil masuk. Selamat datang!");
    const target = await homeForCurrentUser();
    navigate({ to: target, replace: true });
  }

  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-hero px-4 py-12">
      <div className="leaf-pattern absolute inset-0 opacity-60" aria-hidden="true" />
      <section className="relative w-full max-w-md rounded-3xl border bg-card p-6 shadow-lift sm:p-8">
        <Logo className="mb-8" />
        <div className="mb-7">
          <h1 className="font-display text-3xl font-semibold text-primary-deep">Selamat datang kembali</h1>
          <p className="mt-2 text-sm text-muted-foreground">Masuk untuk mengelola usaha dan produk Anda.</p>
        </div>
        <form onSubmit={submit} noValidate className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input id="login-email" type="email" autoComplete="email" placeholder="nama@email.com" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={!!errors.email} />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">Password</Label>
              <Link to="/lupa-password" className="text-xs font-medium text-primary hover:underline">Lupa password?</Link>
            </div>
            <div className="relative">
              <Input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} aria-invalid={!!errors.password} className="pr-10" />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} Masuk
          </Button>
        </form>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />atau<span className="h-px flex-1 bg-border" /></div>
        <GoogleButton onSignedIn={async () => navigate({ to: await homeForCurrentUser(), replace: true })} />
        <p className="mt-6 text-center text-sm text-muted-foreground">Belum punya akun? <Link to="/auth" search={{ mode: "register" }} className="font-medium text-primary hover:underline">Daftar sekarang</Link></p>
      </section>
    </main>
  );
}
