import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Eye, EyeOff, Loader2, MailCheck, ShoppingBag, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoriesQuery, districtsQuery } from "@/lib/queries";
import { GoogleButton } from "@/components/site/GoogleButton";
import { Logo } from "@/components/site/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { homeForCurrentUser, safeRedirect } from "@/lib/post-login";
import { cn } from "@/lib/utils";

type S = { mode?: "login" | "register"; redirect?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): S => ({
    mode: s.mode === "register" ? "register" : s.mode === "login" ? "login" : undefined,
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Masuk atau Daftar — UMKM BANYUWANGI" },
      { name: "description", content: "Masuk ke akun UMKM BANYUWANGI atau daftarkan usaha Anda untuk mulai berjualan online." },
      { property: "og:title", content: "Masuk atau Daftar — UMKM BANYUWANGI" },
      { property: "og:description", content: "Daftarkan UMKM Anda dan jangkau lebih banyak pembeli." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const loginSchema = z.object({
  email: z.string().trim().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

const registerSchema = z
  .object({
    accountType: z.enum(["umkm", "user"]),
    fullName: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
    email: z.string().trim().email("Format email tidak valid").max(255),
    phone: z.string().trim().regex(/^(\+62|62|0)8[0-9]{7,12}$/, "Nomor WhatsApp tidak valid (contoh: 081234567890)"),
    businessName: z.string().trim().max(100).optional(),
    categoryId: z.string().optional(),
    description: z.string().trim().max(1000, "Deskripsi maksimal 1000 karakter").optional(),
    fullAddress: z.string().trim().max(255).optional(),
    districtId: z.string().optional(),
    village: z.string().trim().max(100).optional(),
    password: z.string().min(8, "Password minimal 8 karakter").regex(/[A-Za-z]/, "Password harus mengandung huruf").regex(/[0-9]/, "Password harus mengandung angka"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Konfirmasi password tidak sama" })
  .refine((d) => d.accountType !== "umkm" || (d.businessName && d.businessName.length >= 2), { path: ["businessName"], message: "Nama usaha wajib diisi" })
  .refine((d) => d.accountType !== "umkm" || !!d.categoryId, { path: ["categoryId"], message: "Pilih kategori usaha" })
  .refine((d) => d.accountType !== "umkm" || (d.description && d.description.length >= 20), { path: ["description"], message: "Deskripsi usaha minimal 20 karakter" })
  .refine((d) => d.accountType !== "umkm" || (d.fullAddress && d.fullAddress.length >= 10), { path: ["fullAddress"], message: "Alamat lengkap minimal 10 karakter" })
  .refine((d) => d.accountType !== "umkm" || !!d.districtId, { path: ["districtId"], message: "Pilih kecamatan di Kabupaten Banyuwangi" })
  .refine((d) => d.accountType !== "umkm" || (d.village && d.village.length >= 3), { path: ["village"], message: "Desa/kelurahan wajib diisi" });

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-destructive">{msg}</p> : null;
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(search.mode ?? "login");

  useEffect(() => setTab(search.mode ?? "login"), [search.mode]);

  async function goHome() {
    const target = safeRedirect(search.redirect) ?? (await homeForCurrentUser());
    navigate({ to: target, replace: true });
  }

  useEffect(() => {
    if (ready && user) goHome();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-hero">
      <div className="leaf-pattern absolute inset-0 opacity-60" aria-hidden />
      <div className="container-page relative grid items-center gap-10 py-12 lg:grid-cols-2">
        <div className="hidden lg:block">
          <h1 className="text-5xl font-semibold leading-tight text-primary-deep">Bawa usaha Anda ke <span className="italic text-primary">pasar digital</span>.</h1>
          <p className="mt-4 max-w-md text-lg text-muted-foreground">Daftarkan UMKM Banyuwangi Anda, unggah produk, dan terima pesanan langsung lewat WhatsApp. Gratis.</p>
          <img src="/images/hero-banyuwangi.jpg" alt="" className="mt-8 aspect-[4/3] w-full max-w-lg rounded-3xl object-cover shadow-lift" />
        </div>
        <div className="mx-auto w-full max-w-md rounded-3xl border bg-card p-6 shadow-lift sm:p-8">
          <Logo className="mb-6" />
          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="register">Daftar</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-6"><LoginForm onDone={goHome} /></TabsContent>
            <TabsContent value="register" className="mt-6"><RegisterForm /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function PasswordInput({ id, value, onChange, invalid, autoComplete }: { id: string; value: string; onChange: (v: string) => void; invalid?: boolean; autoComplete?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input id={id} type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid} autoComplete={autoComplete} className="pr-10" />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground" aria-label={show ? "Sembunyikan password" : "Tampilkan password"}>
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function LoginForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0] as string, i.message])));
      return;
    }
    setErrors({});
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) {
      const msg = /invalid login/i.test(error.message)
        ? "Email atau password salah."
        : /not confirmed/i.test(error.message)
          ? "Email belum dikonfirmasi. Periksa kotak masuk Anda."
          : /banned/i.test(error.message)
            ? "Akun Anda dinonaktifkan. Hubungi admin."
            : error.message;
      toast.error(msg);
      return;
    }
    toast.success("Berhasil masuk. Selamat datang!");
    onDone();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="login-email">Email</Label>
        <Input id="login-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} />
        <FieldError msg={errors.email} />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password">Password</Label>
          <Link to="/lupa-password" className="text-xs font-medium text-primary hover:underline">Lupa password?</Link>
        </div>
        <PasswordInput id="login-password" value={password} onChange={setPassword} invalid={!!errors.password} autoComplete="current-password" />
        <FieldError msg={errors.password} />
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={busy}>
        {busy && <Loader2 className="animate-spin" />} Masuk
      </Button>
      <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />atau<span className="h-px flex-1 bg-border" /></div>
      <GoogleButton onSignedIn={onDone} />
    </form>
  );
}

function RegisterForm() {
  const [form, setForm] = useState({ accountType: "umkm" as "umkm" | "user", fullName: "", email: "", phone: "", businessName: "", categoryId: "", description: "", fullAddress: "", districtId: "", village: "", password: "", confirm: "" });
  const { data: districts = [] } = useQuery(districtsQuery());
  const { data: categories = [] } = useQuery(categoriesQuery());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[i.path[0] as string] ??= i.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    const d = parsed.data;
    const { data, error } = await supabase.auth.signUp({
      email: d.email,
      password: d.password,
      options: {
        emailRedirectTo: window.location.origin + "/auth",
        data: {
          full_name: d.fullName,
          phone: d.phone,
          account_type: d.accountType,
          ...(d.accountType === "umkm"
            ? {
                business_name: d.businessName,
                category_id: d.categoryId,
                description: d.description,
                full_address: d.fullAddress,
                district_id: d.districtId,
                village: d.village,
              }
            : {}),
        },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(/already registered/i.test(error.message) ? "Email sudah terdaftar. Silakan masuk." : error.message);
      return;
    }
    if (data.user && data.user.identities?.length === 0) {
      toast.error("Email sudah terdaftar. Silakan masuk.");
      return;
    }
    setSentTo(d.email);
  }

  if (sentTo) {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary"><MailCheck className="size-7" /></div>
        <h3 className="mt-4 text-xl font-semibold">Cek email Anda</h3>
        <p className="mt-2 text-sm text-muted-foreground">Kami mengirim tautan konfirmasi ke <b>{sentTo}</b>. Klik tautan tersebut untuk mengaktifkan akun.</p>
        {form.accountType === "umkm" && <p className="mt-3 rounded-xl bg-cream p-3 text-xs text-cream-foreground">Setelah akun aktif, masuk ke Dashboard Toko untuk mengunggah foto usaha dan menandai lokasi di peta. Admin akan memverifikasi UMKM Anda.</p>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Jenis akun">
        {([
          { v: "umkm", label: "Pelaku UMKM", icon: Store },
          { v: "user", label: "Pembeli", icon: ShoppingBag },
        ] as const).map((o) => (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={form.accountType === o.v}
            onClick={() => setForm((f) => ({ ...f, accountType: o.v }))}
            className={cn("flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-medium transition-colors", form.accountType === o.v ? "border-primary bg-primary-soft text-primary-deep" : "hover:border-primary/40")}
          >
            <o.icon className="size-4" /> {o.label}
          </button>
        ))}
      </div>
      <div className="space-y-1.5"><Label htmlFor="r-name">{form.accountType === "umkm" ? "Nama pemilik usaha" : "Nama lengkap"}</Label><Input id="r-name" value={form.fullName} onChange={set("fullName")} autoComplete="name" aria-invalid={!!errors.fullName} /><FieldError msg={errors.fullName} /></div>
      {form.accountType === "umkm" && (
        <>
          <p className="rounded-xl bg-gold/15 p-3 text-xs text-gold-foreground">Pendaftaran khusus UMKM yang berlokasi di Kabupaten Banyuwangi.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="r-biz">Nama UMKM</Label><Input id="r-biz" value={form.businessName} onChange={set("businessName")} aria-invalid={!!errors.businessName} /><FieldError msg={errors.businessName} /></div>
            <div className="space-y-1.5">
              <Label>Kategori usaha</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger aria-invalid={!!errors.categoryId}><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              <FieldError msg={errors.categoryId} />
            </div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="r-desc">Deskripsi usaha</Label><Textarea id="r-desc" rows={3} value={form.description} onChange={set("description")} aria-invalid={!!errors.description} /><FieldError msg={errors.description} /></div>
          <div className="space-y-1.5"><Label htmlFor="r-addr">Alamat lengkap</Label><Input id="r-addr" placeholder="Nama jalan, nomor, dusun/RT/RW" value={form.fullAddress} onChange={set("fullAddress")} aria-invalid={!!errors.fullAddress} /><FieldError msg={errors.fullAddress} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Kecamatan</Label>
              <Select value={form.districtId} onValueChange={(v) => setForm((f) => ({ ...f, districtId: v }))}>
                <SelectTrigger aria-invalid={!!errors.districtId}><SelectValue placeholder="Pilih kecamatan" /></SelectTrigger>
                <SelectContent>{districts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
              <FieldError msg={errors.districtId} />
            </div>
            <div className="space-y-1.5"><Label htmlFor="r-village">Desa / Kelurahan</Label><Input id="r-village" value={form.village} onChange={set("village")} aria-invalid={!!errors.village} /><FieldError msg={errors.village} /></div>
          </div>
        </>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="r-email">Email</Label><Input id="r-email" type="email" value={form.email} onChange={set("email")} autoComplete="email" aria-invalid={!!errors.email} /><FieldError msg={errors.email} /></div>
        <div className="space-y-1.5"><Label htmlFor="r-phone">No. WhatsApp</Label><Input id="r-phone" inputMode="tel" placeholder="0812xxxxxxx" value={form.phone} onChange={set("phone")} aria-invalid={!!errors.phone} /><FieldError msg={errors.phone} /></div>
      </div>
      <div className="space-y-1.5"><Label htmlFor="r-pass">Password</Label><PasswordInput id="r-pass" value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} invalid={!!errors.password} autoComplete="new-password" /><FieldError msg={errors.password} /></div>
      <div className="space-y-1.5"><Label htmlFor="r-confirm">Konfirmasi password</Label><PasswordInput id="r-confirm" value={form.confirm} onChange={(v) => setForm((f) => ({ ...f, confirm: v }))} invalid={!!errors.confirm} autoComplete="new-password" /><FieldError msg={errors.confirm} /></div>
      <Button type="submit" className="w-full" size="lg" disabled={busy}>
        {busy && <Loader2 className="animate-spin" />} {form.accountType === "umkm" ? "Daftarkan UMKM" : "Buat Akun"}
      </Button>
    </form>
  );
}
