import { lazy, Suspense, useMemo, useState } from "react";
import { ClientOnly, createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MapPin, Search, Store, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/site/SectionHeading";
import { StoreCard } from "@/components/site/StoreCard";
import { EmptyState } from "@/components/site/EmptyState";
import { categoriesQuery, districtsQuery, mapPointsQuery, umkmListQuery } from "@/lib/queries";
import { escapeHtml } from "@/lib/html";

const LeafletMap = lazy(() => import("@/components/site/LeafletMap"));
import type { DirectorySearch } from "@/lib/public.functions";

export const Route = createFileRoute("/umkm/")({
  validateSearch: (s: Record<string, unknown>): DirectorySearch => ({
    q: typeof s.q === "string" && s.q ? s.q.slice(0, 100) : undefined,
    kec: typeof s.kec === "string" && s.kec ? s.kec : undefined,
    kategori: typeof s.kategori === "string" && s.kategori ? s.kategori : undefined,
    status: s.status === "terverifikasi" ? "terverifikasi" : undefined,
    urut: s.urut === "nama" ? "nama" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Direktori UMKM Banyuwangi — UMKM BANYUWANGI" },
      { name: "description", content: "Direktori seluruh UMKM di 25 kecamatan Kabupaten Banyuwangi. Cari berdasarkan nama, kecamatan, dan kategori usaha." },
      { property: "og:title", content: "Direktori UMKM Banyuwangi" },
      { property: "og:description", content: "Temukan UMKM terdekat di kecamatan Anda dan hubungi pemiliknya langsung." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(umkmListQuery(deps)),
      context.queryClient.ensureQueryData(districtsQuery()),
      context.queryClient.ensureQueryData(categoriesQuery()),
      context.queryClient.ensureQueryData(mapPointsQuery()),
    ]);
  },
  component: UmkmDirectory,
});

function UmkmDirectory() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/umkm/" });
  const { data: stores } = useSuspenseQuery(umkmListQuery(search));
  const { data: districts } = useSuspenseQuery(districtsQuery());
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const { data: points } = useSuspenseQuery(mapPointsQuery());
  const [q, setQ] = useState(search.q ?? "");
  const [view, setView] = useState<"grid" | "map">("grid");
  const update = (patch: Partial<DirectorySearch>) => navigate({ search: (p) => ({ ...p, ...patch }) });
  const filtered = !!(search.q || search.kec || search.kategori || search.status);
  const visiblePoints = useMemo(() => points.filter((point) => {
    const keyword = (search.q ?? "").toLowerCase();
    return (!search.kec || point.districtSlug === search.kec) &&
      (!search.kategori || point.category.toLowerCase() === (categories.find((category) => category.slug === search.kategori)?.name ?? "").toLowerCase()) &&
      (!keyword || [point.name, point.category, point.district, point.address].some((value) => value.toLowerCase().includes(keyword)));
  }), [categories, points, search.kategori, search.kec, search.q]);
  const markers = useMemo(() => visiblePoints.map((point) => ({
    id: point.id,
    lat: point.lat,
    lng: point.lng,
    popupHtml: `<div style="min-width:180px"><p style="font-weight:600;margin:0 0 2px">${escapeHtml(point.name)}</p><p style="margin:0;font-size:12px">${escapeHtml(point.category)} · Kec. ${escapeHtml(point.district)}</p><p style="margin:6px 0;font-size:12px">${escapeHtml(point.address)}</p><a href="/umkm/${encodeURIComponent(point.id)}" style="font-weight:600;font-size:12px">Lihat profil →</a><br/><a href="https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}" target="_blank" rel="noreferrer" style="font-size:12px">Buka di Google Maps</a></div>`,
  })), [visiblePoints]);

  return (
    <>
      <PageHero eyebrow="Direktori" title="Direktori UMKM Banyuwangi" description="Seluruh UMKM terdaftar di 25 kecamatan. UMKM bertanda terverifikasi telah diperiksa oleh admin.">
        <form className="mt-6 flex max-w-2xl gap-2" onSubmit={(e) => { e.preventDefault(); update({ q: q.trim() || undefined }); }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama UMKM" className="h-11 bg-card pl-9" maxLength={100} aria-label="Cari nama UMKM" />
          </div>
          <Button type="submit" size="lg">Cari</Button>
        </form>
      </PageHero>
      <section className="container-page py-8">
        <div className="mb-6 grid gap-3 rounded-2xl border bg-card p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-4 lg:items-center">
          <Select value={search.kec ?? "all"} onValueChange={(v) => update({ kec: v === "all" ? undefined : v })}>
            <SelectTrigger aria-label="Filter kecamatan"><SelectValue placeholder="Semua kecamatan" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua kecamatan</SelectItem>
              {districts.map((d) => <SelectItem key={d.id} value={d.slug}>{d.name} ({d.umkm_count})</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={search.kategori ?? "all"} onValueChange={(v) => update({ kategori: v === "all" ? undefined : v })}>
            <SelectTrigger aria-label="Filter kategori usaha"><SelectValue placeholder="Semua kategori" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua kategori usaha</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={search.urut ?? "terbaru"} onValueChange={(v) => update({ urut: v === "nama" ? "nama" : undefined })}>
            <SelectTrigger aria-label="Urutkan"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="terbaru">Terbaru</SelectItem>
              <SelectItem value="nama">Nama (A–Z)</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center gap-3 px-1 text-sm font-medium">
            <Switch checked={search.status === "terverifikasi"} onCheckedChange={(c) => update({ status: c ? "terverifikasi" : undefined })} />
            Hanya terverifikasi
          </label>
        </div>
         <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
           <p><span className="font-semibold text-foreground">{stores.length}</span> UMKM ditemukan</p>
           <div className="flex items-center gap-2">
             {filtered && <Link to="/umkm" className="inline-flex items-center gap-1 font-medium hover:text-primary"><X className="size-4" /> Reset</Link>}
             <div className="flex rounded-lg border bg-card p-1">
               <button type="button" onClick={() => setView("grid")} className={`rounded-md px-3 py-1.5 text-xs font-medium ${view === "grid" ? "bg-primary-soft text-primary-deep" : "hover:bg-muted"}`}>Daftar</button>
               <button type="button" onClick={() => setView("map")} className={`rounded-md px-3 py-1.5 text-xs font-medium ${view === "map" ? "bg-primary-soft text-primary-deep" : "hover:bg-muted"}`}><MapPin className="mr-1 inline size-3.5" />Peta</button>
             </div>
           </div>
         </div>
         {view === "map" ? (
           <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
             <div className="h-[420px] overflow-hidden rounded-2xl border shadow-soft sm:h-[560px]">
               <ClientOnly fallback={<div className="grid size-full place-items-center bg-muted text-sm text-muted-foreground">Memuat peta...</div>}>
                 <Suspense fallback={<div className="grid size-full place-items-center bg-muted text-sm text-muted-foreground">Memuat peta...</div>}>
                   <LeafletMap markers={markers} zoom={10} className="size-full" />
                 </Suspense>
               </ClientOnly>
             </div>
             <aside className="max-h-[560px] overflow-y-auto rounded-2xl border bg-card shadow-soft">
               <div className="border-b p-4"><p className="font-semibold">{visiblePoints.length} UMKM di peta</p><p className="text-xs text-muted-foreground">Klik daftar untuk melihat profil dan alamat lengkap.</p></div>
               {visiblePoints.length ? <ul className="divide-y">{visiblePoints.map((point) => <li key={point.id}><Link to="/umkm/$id" params={{ id: point.id }} className="flex gap-3 p-4 hover:bg-muted"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"><Store className="size-4" /></span><span className="min-w-0"><span className="block truncate font-medium">{point.name}</span><span className="block text-xs text-muted-foreground">{point.category} · Kec. {point.district}</span><span className="mt-1 block line-clamp-2 text-xs text-muted-foreground">{point.address || "Alamat belum tersedia"}</span></span></Link></li>)}</ul> : <div className="p-4"><EmptyState title="Belum ada titik lokasi" description="Coba ubah filter pencarian." /></div>}
             </aside>
           </div>
         ) : stores.length === 0 ? (
           <EmptyState title="UMKM tidak ditemukan" description="Coba ubah kata kunci, kecamatan, atau kategori." />
         ) : (
           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
             {stores.map((s) => <StoreCard key={s.id} store={s} />)}
           </div>
         )}
      </section>
    </>
  );
}
