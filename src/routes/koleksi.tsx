import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Coffee, Map, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/koleksi")({ component: CollectionsPage });

const COLLECTIONS = [
  { icon: ShoppingBag, title: "Oleh-Oleh Wajib dari Banyuwangi", text: "Pilihan produk yang praktis dibawa pulang untuk keluarga dan teman.", query: "oleh-oleh" },
  { icon: Coffee, title: "Kopi & Hasil Bumi Lereng Ijen", text: "Kenali rasa kopi, madu, dan hasil bumi dari kawasan pegunungan Banyuwangi.", query: "kopi" },
  { icon: Sparkles, title: "Wastra & Kriya Blambangan", text: "Batik Gajah Oling, anyaman, dan karya tangan dengan cerita lokal.", query: "batik" },
  { icon: ShoppingBag, title: "Kuliner Tahan Lama untuk Perjalanan", text: "Camilan khas yang cocok menemani perjalanan wisata Anda.", query: "camilan" },
];

const TRIPS = [
  ["Kawah Ijen", "Cari kopi dan hasil bumi dari sentra UMKM di sekitar Licin dan Kalipuro."],
  ["Pantai Pulau Merah", "Temukan oleh-oleh dan kuliner lokal sebelum melanjutkan perjalanan."],
  ["Baluran & Alas Purwo", "Simpan rekomendasi produk lokal untuk bekal dan buah tangan."],
  ["Jawatan Benculuk", "Jelajahi kriya dan produk khas dari wilayah selatan Banyuwangi."],
];

function CollectionsPage() {
  return (
    <div className="container-page py-10">
      <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-wider text-primary">Kurasi lokal</p><h1 className="mt-2 text-3xl font-semibold text-primary-deep sm:text-4xl">Jelajah Banyuwangi lewat UMKM</h1><p className="mt-3 text-muted-foreground">Koleksi tematik dan panduan singkat untuk membantu pembeli dan wisatawan menemukan produk lokal.</p></div>
      <section className="mt-8 grid gap-4 sm:grid-cols-2">{COLLECTIONS.map((item) => <article key={item.title} className="rounded-2xl border bg-card p-5 shadow-soft"><span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary"><item.icon className="size-5" /></span><h2 className="mt-4 text-xl font-semibold text-primary-deep">{item.title}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p><Button asChild variant="soft" className="mt-5"><Link to="/katalog" search={{ q: item.query }}>Lihat produk <ArrowRight /></Link></Button></article>)}</section>
      <section className="mt-12 rounded-3xl bg-brand-gradient p-6 text-primary-foreground sm:p-9"><div className="flex items-center gap-2 text-gold"><Map className="size-5" /><p className="text-xs font-semibold uppercase tracking-wider">Panduan perjalanan</p></div><h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Rute wisata dan UMKM terdekat</h2><div className="mt-6 grid gap-3 sm:grid-cols-2">{TRIPS.map(([title, text]) => <div key={title} className="rounded-2xl bg-primary-foreground/10 p-4"><h3 className="font-sans font-semibold">{title}</h3><p className="mt-1 text-sm opacity-85">{text}</p></div>)}</div><Button asChild variant="gold" className="mt-6"><Link to="/peta">Buka peta UMKM <ArrowRight /></Link></Button></section>
    </div>
  );
}
