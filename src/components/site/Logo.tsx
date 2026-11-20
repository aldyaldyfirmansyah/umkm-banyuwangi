import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("group flex items-center gap-2 rounded-xl px-1.5 py-1 transition-colors hover:bg-primary-soft/70", className)} aria-label="UMKM Banyuwangi beranda">
      <img src="/images/logo-banyuwangi.png" alt="Logo Pemerintah Kabupaten Banyuwangi" className="size-9 rounded-xl bg-card object-contain p-0.5 ring-1 ring-gold/40 transition-transform group-hover:scale-105 sm:size-10" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-semibold tracking-tight text-primary-deep">UMKM</span>
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-gold-foreground">Banyuwangi</span>
      </span>
    </Link>
  );
}
