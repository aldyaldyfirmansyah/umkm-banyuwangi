import { Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)} aria-label="UMKM Banyuwangi beranda">
      <span className="grid size-9 place-items-center rounded-xl bg-brand-gradient text-primary-foreground shadow-soft">
        <Leaf className="size-5" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-semibold tracking-tight text-primary-deep">UMKM</span>
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-gold-foreground">Banyuwangi</span>
      </span>
    </Link>
  );
}
