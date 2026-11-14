import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHero } from "@/components/site/SectionHeading";
import { siteSettingsQuery } from "@/lib/queries";
import { whatsappLink } from "@/lib/format";

export const Route = createFileRoute("/kontak")({
  head: () => ({
    meta: [
      { title: "Kontak — UMKM BANYUWANGI" },
      { name: "description", content: "Hubungi tim UMKM BANYUWANGI untuk pertanyaan, kerja sama, atau bantuan pendaftaran UMKM." },
      { property: "og:title", content: "Hubungi UMKM BANYUWANGI" },
      { property: "og:description", content: "Kami siap membantu pelaku UMKM dan pembeli." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(siteSettingsQuery()),
  component: Kontak,
});

const schema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().trim().email("Format email tidak valid").max(255),
  subject: z.string().trim().min(3, "Subjek minimal 3 karakter").max(150),
  message: z.string().trim().min(10, "Pesan minimal 10 karakter").max(1000, "Pesan maksimal 1000 karakter"),
});

function Kontak() {
  const { data: s } = useSuspenseQuery(siteSettingsQuery());
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0] as string, i.message])));
      return;
    }
    setErrors({});
    const text = `Halo UMKM BANYUWANGI,\n\nNama: ${parsed.data.name}\nEmail: ${parsed.data.email}\nSubjek: ${parsed.data.subject}\n\n${parsed.data.message}`;
    window.open(whatsappLink(s?.whatsapp, text), "_blank", "noopener");
    toast.success("Pesan Anda siap dikirim lewat WhatsApp");
    setForm({ name: "", email: "", subject: "", message: "" });
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value })),
    "aria-invalid": !!errors[key],
  });

  return (
    <>
      <PageHero eyebrow="Kontak" title="Ada yang bisa kami bantu?" description="Kirim pertanyaan seputar pendaftaran UMKM, kerja sama, atau kendala penggunaan." />
      <section className="container-page grid gap-8 py-12 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          {[
            { icon: MapPin, label: "Alamat", value: s?.address },
            { icon: Mail, label: "Email", value: s?.email, href: s?.email ? `mailto:${s.email}` : undefined },
            { icon: Phone, label: "Telepon", value: s?.phone },
            { icon: MessageCircle, label: "WhatsApp", value: s?.whatsapp ? "+" + s.whatsapp : undefined, href: s?.whatsapp ? whatsappLink(s.whatsapp, "Halo UMKM BANYUWANGI") : undefined },
          ].filter((i) => i.value).map((i) => (
            <div key={i.label} className="flex items-start gap-4 rounded-2xl border bg-card p-5 shadow-soft">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><i.icon className="size-5" /></span>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{i.label}</p>
                {i.href ? <a href={i.href} target="_blank" rel="noreferrer" className="font-medium hover:text-primary">{i.value}</a> : <p className="font-medium">{i.value}</p>}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={submit} noValidate className="space-y-4 rounded-2xl border bg-card p-6 shadow-soft">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="name">Nama lengkap</Label><Input id="name" {...field("name")} />{errors.name && <p className="text-xs text-destructive">{errors.name}</p>}</div>
            <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" {...field("email")} />{errors.email && <p className="text-xs text-destructive">{errors.email}</p>}</div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="subject">Subjek</Label><Input id="subject" {...field("subject")} />{errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}</div>
          <div className="space-y-1.5"><Label htmlFor="message">Pesan</Label><Textarea id="message" rows={6} {...field("message")} />{errors.message && <p className="text-xs text-destructive">{errors.message}</p>}</div>
          <Button type="submit" size="lg" className="w-full sm:w-auto"><Send /> Kirim Pesan</Button>
        </form>
      </section>
    </>
  );
}
