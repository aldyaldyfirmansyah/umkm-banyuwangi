import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)} aria-label="UMKM Banyuwangi beranda">
      <img src="/images/logo-banyuwangi.png" alt="Logo Pemerintah Kabupaten Banyuwangi" className="size-10 rounded-xl object-contain" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-semibold tracking-tight text-primary-deep">UMKM</span>
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-gold-foreground">Banyuwangi</span>
      </span>
    </Link>
  );
}
