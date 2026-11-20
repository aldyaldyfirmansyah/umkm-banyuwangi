import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFavorites, getVisits, subscribeStorage, type FavoriteItem, type VisitItem } from "@/lib/local-store";

export const Route = createFileRoute("/favorit")({ component: FavoritesPage });

function Item({ item }: { item: FavoriteItem | VisitItem }) {
  return (
    <Link to={item.href} className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-soft hover:border-primary">
      {item.image ? <img src={item.image} alt="" className="size-14 rounded-lg object-cover" /> : <span className="grid size-14 place-items-center rounded-lg bg-primary-soft text-primary"><Heart className="size-5" /></span>}
      <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
    </Link>
  );
}

function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [visits, setVisits] = useState<VisitItem[]>([]);
  useEffect(() => {
    const sync = () => { setFavorites(getFavorites()); setVisits(getVisits()); };
    sync();
    return subscribeStorage(sync);
  }, []);
  return (
    <div className="container-page py-10">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Koleksi Anda</p><h1 className="mt-1 text-3xl font-semibold text-primary-deep">Favorit & Riwayat</h1></div>
        <Button asChild variant="outline"><Link to="/">Kembali</Link></Button>
      </div>
      <section className="mt-8"><h2 className="mb-4 flex items-center gap-2 text-xl font-semibold"><Heart className="size-5 text-primary" /> Favorit ({favorites.length})</h2>{favorites.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{favorites.map((item) => <Item key={`${item.kind}-${item.id}`} item={item} />)}</div> : <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">Belum ada produk atau UMKM yang disimpan.</p>}</section>
      <section className="mt-10"><h2 className="mb-4 flex items-center gap-2 text-xl font-semibold"><History className="size-5 text-primary" /> Baru dikunjungi ({visits.length})</h2>{visits.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{visits.map((item) => <Item key={`${item.kind}-${item.id}`} item={item} />)}</div> : <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">Riwayat kunjungan akan muncul setelah Anda membuka detail.</p>}</section>
    </div>
  );
}
