import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Globe2, HandHeart, Map, MapPin, Megaphone, Package, Store, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/site/SearchBar";
import { SectionHeading } from "@/components/site/SectionHeading";
import { CategoryIcon } from "@/components/site/CategoryIcon";
import { ProductGrid } from "@/components/site/ProductCard";
import { StoreAvatar, StoreCard } from "@/components/site/StoreCard";
import { EmptyState } from "@/components/site/EmptyState";
import { categoriesQuery, homeQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UMKM BANYUWANGI — Satu Platform, Ribuan Potensi UMKM Banyuwangi" },
      { name: "description", content: "Direktori, peta, dan katalog produk UMKM di 25 kecamatan Kabupaten Banyuwangi. Temukan produk lokal dan hubungi pemilik usaha langsung." },
      { property: "og:title", content: "UMKM BANYUWANGI — Satu Platform, Ribuan Potensi UMKM Banyuwangi" },
      { property: "og:description", content: "Temukan UMKM dan produk unggulan Banyuwangi, dari batik Gajah Oling hingga kopi lereng Ijen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(homeQuery()),
      context.queryClient.ensureQueryData(categoriesQuery()),
    ]);
  },
  component: Index,
});

const REASONS = [
  { icon: HandHeart, title: "Mendukung ekonomi lokal", text: "Setiap pembelian langsung membantu pelaku usaha di desa-desa Banyuwangi." },
  { icon: Megaphone, title: "Promosi lebih mudah", text: "UMKM cukup unggah produk, kami tampilkan ke calon pembeli dan wisatawan." },
  { icon: Users, title: "Jangkau lebih banyak pelanggan", text: "Produk Anda bisa ditemukan dari mana saja, tak hanya di pasar sekitar." },
  { icon: Globe2, title: "Kenalkan potensi daerah", text: "Dari budaya Osing hingga hasil bumi lereng Ijen, tunjukkan kekayaan Blambangan." },
];

function Index() {
  const { data } = useSuspenseQuery(homeQuery());
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const banner = data.banners[0];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero">
        <div className="gajah-oling absolute inset-y-0 right-0 hidden w-1/3 opacity-[0.07] lg:block" aria-hidden />
        <div className="container-page relative grid items-center gap-10 py-14 md:py-20 lg:grid-cols-2">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-xs font-medium text-primary-deep shadow-soft">
              <MapPin className="size-4 text-gold-foreground" /> Kabupaten Banyuwangi, Jawa Timur
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] text-primary-deep sm:text-5xl lg:text-6xl">
              Satu Platform, <span className="italic text-primary">Ribuan Potensi</span> UMKM Banyuwangi
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Pusat informasi, direktori, promosi, dan katalog produk UMKM dari 25 kecamatan di Bumi Blambangan.
            </p>
            <SearchBar large className="mt-7 max-w-xl" />
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="hero">
                <Link to="/umkm">Jelajahi UMKM <ArrowRight /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/peta"><Map /> Lihat Peta</Link>
              </Button>
            </div>
          </div>
          <div className="relative animate-rise [animation-delay:120ms]">
            <div className="absolute -inset-4 rounded-[2rem] bg-gold/20 blur-2xl" aria-hidden />
            <img
              src="/images/hero-banyuwangi.jpg"
              alt="Batik Gajah Oling, kopi lereng Ijen, madu, dan kerajinan khas Banyuwangi dengan latar Gunung Ijen"
              width={1536}
              height={1152}
              className="relative aspect-[4/3] w-full rounded-[1.75rem] object-cover shadow-lift"
            />
          </div>
        </div>
      </section>

      {/* Statistik */}
      <section className="container-page -mt-8 relative z-10">
        <div className="grid gap-3 rounded-3xl border bg-card p-4 shadow-lift sm:grid-cols-3 sm:p-6">
          {[
            { icon: Store, value: data.stats.umkm, label: "UMKM terverifikasi" },
            { icon: Package, value: data.stats.products, label: "Produk lokal" },
            { icon: MapPin, value: `${data.stats.districts}/25`, label: "Kecamatan memiliki UMKM" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-4 rounded-2xl p-3">
              <span className="grid size-12 place-items-center rounded-xl bg-gold/20 text-gold-foreground"><s.icon className="size-6" /></span>
              <div>
                <p className="font-display text-3xl font-semibold text-primary-deep">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Kategori */}
      <section className="container-page py-16">
        <SectionHeading eyebrow="Kategori" title="Kategori produk unggulan" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/katalog"
              search={{ kategori: c.slug }}
              className="group flex flex-col items-center gap-3 rounded-2xl border bg-card p-5 text-center shadow-soft transition-all hover:-translate-y-1 hover:border-primary hover:shadow-lift"
            >
              <span className="grid size-12 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <CategoryIcon name={c.icon} className="size-6" />
              </span>
              <span className="text-sm font-medium leading-tight">{c.name}</span>
              <span className="text-xs text-muted-foreground">{c.product_count} produk</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Banner */}
      {banner && (
        <section className="container-page pb-16">
          <Link to={(banner.link as "/katalog") || "/katalog"} className="group relative block overflow-hidden rounded-[2rem] shadow-lift">
            <img src={banner.image || "/images/banner-banyuwangi.jpg"} alt={banner.title} loading="lazy" width={1920} height={800} className="aspect-[16/9] w-full object-cover transition-transform duration-700 group-hover:scale-105 sm:aspect-[12/5]" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-deep/85 via-primary-deep/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center p-6 text-primary-foreground sm:p-12">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Potensi Banyuwangi</p>
              <h2 className="mt-2 max-w-lg text-3xl font-semibold sm:text-5xl">{banner.title}</h2>
              {banner.description && <p className="mt-3 max-w-md opacity-90">{banner.description}</p>}
              <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground">Jelajahi sekarang <ArrowRight className="size-4" /></span>
            </div>
          </Link>
        </section>
      )}

      {/* Produk unggulan */}
      <section className="container-page pb-16">
        <SectionHeading
          eyebrow="Pilihan kami"
          title="Produk Unggulan Banyuwangi"
          description="Produk terbaik dari UMKM terverifikasi yang paling banyak dilihat."
          action={<Button asChild variant="soft"><Link to="/katalog">Lihat semua <ArrowRight /></Link></Button>}
        />
        {data.featured.length ? <ProductGrid products={data.featured} /> : <EmptyState title="Belum ada produk unggulan" />}
      </section>

      {/* UMKM terbaru & pilihan */}
      <section className="bg-cream/50 py-16">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <SectionHeading eyebrow="Baru bergabung" title="UMKM Terbaru" />
            {data.newestUmkm.length ? (
              <ul className="space-y-3">
                {data.newestUmkm.map((s) => (
                  <li key={s.id}>
                    <Link to="/umkm/$id" params={{ id: s.id }} className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-soft transition-colors hover:border-primary">
                      <StoreAvatar name={s.business_name} logo={s.logo} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{s.business_name}</p>
                        <p className="text-xs text-muted-foreground">Kec. {s.district} · {s.category ?? "UMKM"}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <EmptyState title="Belum ada UMKM" />}
          </div>
          <div>
            <SectionHeading eyebrow="UMKM pilihan" title="UMKM Pilihan" action={<Button asChild variant="soft"><Link to="/umkm">Direktori <ArrowRight /></Link></Button>} />
            {data.chosenUmkm.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {data.chosenUmkm.slice(0, 4).map((s) => <StoreCard key={s.id} store={s} />)}
              </div>
            ) : <EmptyState title="Belum ada UMKM" />}
          </div>
        </div>
      </section>

      {/* Rekomendasi per kecamatan */}
      <section className="container-page py-16">
        <SectionHeading eyebrow="Jelajah wilayah" title="Rekomendasi UMKM per kecamatan" description="Temukan UMKM terdekat dari kecamatan Anda." action={<Button asChild variant="soft"><Link to="/peta"><Map /> Peta UMKM</Link></Button>} />
        {data.byDistrict.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.byDistrict.map((d) => (
              <div key={d.name} className="rounded-2xl border bg-card p-5 shadow-soft">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-sans text-base font-semibold">Kec. {d.name}</h3>
                  <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-semibold text-gold-foreground">{d.total} UMKM</span>
                </div>
                <ul className="space-y-2">
                  {d.stores.map((s) => (
                    <li key={s.id}>
                      <Link to="/umkm/$id" params={{ id: s.id }} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
                        <span className="truncate">{s.business_name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{s.category}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link to="/umkm" search={{ kec: d.slug }} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Lihat semua <ArrowRight className="size-3.5" /></Link>
              </div>
            ))}
          </div>
        ) : <EmptyState title="Belum ada UMKM terdaftar" />}
      </section>

      {/* Produk terbaru */}
      <section className="container-page pb-16">
        <SectionHeading eyebrow="Baru hadir" title="Produk Terbaru" action={<Button asChild variant="soft"><Link to="/katalog" search={{ urut: "terbaru" }}>Lihat semua <ArrowRight /></Link></Button>} />
        {data.newestProducts.length ? <ProductGrid products={data.newestProducts} /> : <EmptyState title="Belum ada produk" />}
      </section>

      {/* Alasan */}
      <section className="container-page pb-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand-gradient px-6 py-14 text-primary-foreground sm:px-12">
          <div className="gajah-oling absolute inset-0 opacity-[0.08]" aria-hidden />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Mengapa UMKM Banyuwangi</p>
            <h2 className="mt-2 max-w-xl text-3xl font-semibold sm:text-4xl">Tumbuh bersama, dari desa untuk Banyuwangi</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {REASONS.map((r) => (
                <div key={r.title} className="rounded-2xl bg-primary-foreground/10 p-5 backdrop-blur-sm">
                  <r.icon className="size-7 text-gold" />
                  <h3 className="mt-4 font-sans text-base font-semibold">{r.title}</h3>
                  <p className="mt-1 text-sm opacity-85">{r.text}</p>
                </div>
              ))}
            </div>
            <Button asChild size="lg" variant="gold" className="mt-10">
              <Link to="/auth" search={{ mode: "register" }}><BadgeCheck /> Daftarkan UMKM Anda</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
