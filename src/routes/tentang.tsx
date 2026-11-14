import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, HandHeart, MessageCircle, Search, Store, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/site/SectionHeading";
import { siteSettingsQuery } from "@/lib/queries";

export const Route = createFileRoute("/tentang")({
  head: () => ({
    meta: [
      { title: "Tentang Kami — UMKM BANYUWANGI" },
      { name: "description", content: "UMKM BANYUWANGI membantu pelaku UMKM Indonesia memasarkan produk secara online dan menjangkau lebih banyak pembeli." },
      { property: "og:title", content: "Tentang UMKM BANYUWANGI" },
      { property: "og:description", content: "Misi kami: mendukung produk lokal dan memajukan UMKM Indonesia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(siteSettingsQuery()),
  component: Tentang,
});

const STEPS_SELLER = [
  { icon: Store, title: "Daftar UMKM", text: "Buat akun dan isi profil usaha Anda." },
  { icon: BadgeCheck, title: "Verifikasi admin", text: "Tim kami memeriksa data usaha sebelum toko tampil." },
  { icon: Upload, title: "Unggah produk", text: "Tambahkan foto, harga, stok, dan deskripsi." },
];
const STEPS_BUYER = [
  { icon: Search, title: "Cari produk", text: "Gunakan pencarian dan filter di katalog." },
  { icon: MessageCircle, title: "Hubungi penjual", text: "Pesan langsung lewat WhatsApp penjual." },
  { icon: HandHeart, title: "Dukung UMKM", text: "Produk dikirim langsung oleh pelaku usaha." },
];

function Tentang() {
  const { data: s } = useSuspenseQuery(siteSettingsQuery());
  return (
    <>
      <PageHero eyebrow="Tentang Kami" title="Dari daerah, untuk Indonesia" description={s?.tagline ?? undefined} />
      <section className="container-page grid gap-10 py-14 lg:grid-cols-2 lg:items-center">
        <img src="/images/hero-banyuwangi.jpg" alt="Produk-produk UMKM Indonesia" loading="lazy" width={1536} height={1152} className="aspect-[4/3] w-full rounded-3xl object-cover shadow-lift" />
        <div>
          <h2 className="text-3xl font-semibold text-primary-deep">Misi kami</h2>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">{s?.about}</p>
          <Button asChild className="mt-6" variant="hero" size="lg"><Link to="/katalog">Jelajahi Produk <ArrowRight /></Link></Button>
        </div>
      </section>
      <section className="bg-cream/50 py-14">
        <div className="container-page grid gap-12 md:grid-cols-2">
          {[{ title: "Untuk pelaku UMKM", steps: STEPS_SELLER }, { title: "Untuk pembeli", steps: STEPS_BUYER }].map((block) => (
            <div key={block.title}>
              <h2 className="text-2xl font-semibold text-primary-deep">{block.title}</h2>
              <ol className="mt-6 space-y-4">
                {block.steps.map((st, i) => (
                  <li key={st.title} className="flex gap-4 rounded-2xl border bg-card p-4 shadow-soft">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><st.icon className="size-5" /></span>
                    <div>
                      <p className="font-semibold">{i + 1}. {st.title}</p>
                      <p className="text-sm text-muted-foreground">{st.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
