import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Facebook, Instagram, Mail, MapPin, Music2, Phone } from "lucide-react";
import { siteSettingsQuery } from "@/lib/queries";
import { Logo } from "./Logo";

export function Footer() {
  const { data: s } = useQuery(siteSettingsQuery());
  return (
    <footer className="relative mt-20 border-t bg-cream/60">
      <div className="gajah-oling h-3 w-full opacity-80" aria-hidden />
      <div className="container-page grid gap-8 py-10 sm:gap-10 sm:py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo />
          <p className="text-sm leading-relaxed text-muted-foreground">
            {s?.tagline ?? "Satu Platform, Ribuan Potensi UMKM Banyuwangi."} Pusat direktori, promosi, dan katalog produk UMKM di 25 kecamatan Kabupaten Banyuwangi.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary-deep">Navigasi</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/katalog" className="hover:text-primary">Katalog Produk</Link></li>
            <li><Link to="/kategori" className="hover:text-primary">Kategori</Link></li>
            <li><Link to="/umkm" className="hover:text-primary">Direktori UMKM</Link></li>
            <li><Link to="/peta" className="hover:text-primary">Peta UMKM</Link></li>
            <li><Link to="/tentang" className="hover:text-primary">Tentang Kami</Link></li>
            <li><Link to="/auth" search={{ mode: "register" }} className="hover:text-primary">Daftarkan Usaha Anda</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary-deep">Kontak</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            {s?.address && <li className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0" />{s.address}</li>}
            {s?.email && <li className="flex gap-2"><Mail className="mt-0.5 size-4 shrink-0" /><a href={`mailto:${s.email}`} className="hover:text-primary">{s.email}</a></li>}
            {s?.phone && <li className="flex gap-2"><Phone className="mt-0.5 size-4 shrink-0" />{s.phone}</li>}
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary-deep">Media Sosial</h4>
          <div className="flex gap-2">
            {s?.instagram && <a href={s.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid size-10 place-items-center rounded-xl border bg-card text-primary transition-colors hover:bg-primary hover:text-primary-foreground"><Instagram className="size-4" /></a>}
            {s?.facebook && <a href={s.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="grid size-10 place-items-center rounded-xl border bg-card text-primary transition-colors hover:bg-primary hover:text-primary-foreground"><Facebook className="size-4" /></a>}
            {s?.tiktok && <a href={s.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok" className="grid size-10 place-items-center rounded-xl border bg-card text-primary transition-colors hover:bg-primary hover:text-primary-foreground"><Music2 className="size-4" /></a>}
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-4 text-center text-xs text-muted-foreground sm:flex-row sm:py-5 sm:text-left">
          <p>© {new Date().getFullYear()} ALDY FIRMANSYAH. Hak cipta dilindungi.</p>
          <p>Bangga produk Banyuwangi — Kabupaten Banyuwangi, Jawa Timur</p>
        </div>
      </div>
    </footer>
  );
}
