import { Link } from "@tanstack/react-router";
import { BadgeCheck, Clock, MapPin, Package, Tag } from "lucide-react";
import { initials } from "@/lib/format";
import type { StoreCard as StoreCardData } from "@/lib/public.functions";

export function StoreAvatar({ name, logo, size = "md" }: { name: string; logo: string | null; size?: "md" | "lg" }) {
  const dim = size === "lg" ? "size-20 text-2xl" : "size-14 text-lg";
  return logo ? (
    <img src={logo} alt={`Logo ${name}`} className={`${dim} shrink-0 rounded-2xl object-cover ring-1 ring-border`} loading="lazy" />
  ) : (
    <div className={`${dim} grid shrink-0 place-items-center rounded-2xl bg-brand-gradient font-display font-semibold text-primary-foreground`}>
      {initials(name)}
    </div>
  );
}

export function VerifiedPill({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[0.7rem] font-semibold text-primary-deep">
      <BadgeCheck className="size-3" /> Terverifikasi
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[0.7rem] font-semibold text-muted-foreground">
      <Clock className="size-3" /> Belum terverifikasi
    </span>
  );
}

export function StoreCard({ store }: { store: StoreCardData }) {
  return (
    <Link
      to="/umkm/$id"
      params={{ id: store.id }}
      className="group flex h-full flex-col gap-4 rounded-2xl border bg-card p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="flex items-center gap-4">
        <StoreAvatar name={store.business_name} logo={store.logo} />
        <div className="min-w-0">
          <h3 className="truncate font-sans text-base font-semibold group-hover:text-primary">{store.business_name}</h3>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" /> {store.district ? `Kec. ${store.district}` : store.city}
          </p>
          <div className="mt-1"><VerifiedPill verified={store.verified} /></div>
        </div>
      </div>
      <p className="line-clamp-2 text-sm text-muted-foreground">{store.description || "Belum ada deskripsi usaha."}</p>
      <div className="mt-auto flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 font-medium text-primary"><Package className="size-3.5" /> {store.product_count} produk</span>
        {store.category && <span className="flex items-center gap-1 truncate text-muted-foreground"><Tag className="size-3.5" />{store.category}</span>}
      </div>
    </Link>
  );
}
