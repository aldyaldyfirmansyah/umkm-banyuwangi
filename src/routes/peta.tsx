import { lazy, Suspense, useMemo, useState, type FormEvent } from "react";
import { ClientOnly, createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MapPin, Search, Store } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHero } from "@/components/site/SectionHeading";
import { EmptyState } from "@/components/site/EmptyState";
import { categoriesQuery, districtsQuery, mapPointsQuery } from "@/lib/queries";
import { escapeHtml } from "@/lib/html";

const LeafletMap = lazy(() => import("@/components/site/LeafletMap"));

type S = { kec?: string; q?: string; kategori?: string };
const BANYUWANGI_CENTER: [number, number] = [-8.2192, 114.3691];

export const Route = createFileRoute("/peta")({
  validateSearch: (s: Record<string, unknown>): S => ({
    ...(typeof s["kec"] === "string" && s["kec"] ? { kec: s["kec"] } : {}),
    ...(typeof s["q"] === "string" && s["q"] ? { q: s["q"].slice(0, 100) } : {}),
    ...(typeof s["kategori"] === "string" && s["kategori"] ? { kategori: s["kategori"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Peta Persebaran UMKM Banyuwangi — UMKM BANYUWANGI" },
      { name: "description", content: "Peta interaktif lokasi UMKM terverifikasi di 25 kecamatan Kabupaten Banyuwangi." },
      { property: "og:title", content: "Peta Persebaran UMKM Banyuwangi" },
      { property: "og:description", content: "Lihat lokasi UMKM terverifikasi di peta dan kunjungi profilnya." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(mapPointsQuery()),
      context.queryClient.ensureQueryData(districtsQuery()),
      context.queryClient.ensureQueryData(categoriesQuery()),
    ]);
  },
  component: PetaPage,
});

function MapFallback() {
  return <div className="grid h-full place-items-center bg-muted text-sm text-muted-foreground">Memuat peta...</div>;
}

function PetaPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/peta" });
  const { data: points } = useSuspenseQuery(mapPointsQuery());
  const { data: districts } = useSuspenseQuery(districtsQuery());
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const [query, setQuery] = useState(search.q ?? "");
  const district = districts.find((d) => d.slug === search.kec);
  const visible = useMemo(() => {
    const keyword = (search.q ?? "").toLowerCase();
    return points.filter((p) => {
      const matchesDistrict = !search.kec || p.districtSlug === search.kec;
       const matchesCategory = !search.kategori || p.category.toLowerCase() === categories.find((category) => category.slug === search.kategori)?.name.toLowerCase();
       const matchesQuery = !keyword || [p.name, p.category, p.district, p.address].some((value) => value.toLowerCase().includes(keyword));
       return matchesDistrict && matchesCategory && matchesQuery;
    });
  }, [categories, points, search.kategori, search.kec, search.q]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
     navigate({ search: { ...(search.kec ? { kec: search.kec } : {}), ...(search.kategori ? { kategori: search.kategori } : {}), ...(query.trim() ? { q: query.trim() } : {}) } });
  }
  const markers = useMemo(
    () =>
      visible.map((p) => ({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        popupHtml: `<div style="min-width:180px"><p style="font-weight:600;margin:0 0 2px">${escapeHtml(p.name)}</p><p style="margin:0;font-size:12px;opacity:.75">${escapeHtml(p.category)} · Kec. ${escapeHtml(p.district)}</p><p style="margin:6px 0;font-size:12px">${escapeHtml(p.address)}</p><a href="/umkm/${encodeURIComponent(p.id)}" style="font-weight:600;font-size:12px">Lihat profil UMKM →</a></div>`,
      })),
    [visible],
  );
  const center: [number, number] = district?.latitude && district.longitude ? [district.latitude, district.longitude] : BANYUWANGI_CENTER;

  return (
    <>
      <PageHero eyebrow="Peta" title="Peta Persebaran UMKM" description="Titik lokasi diambil dari data UMKM yang telah diverifikasi admin. Klik titik untuk melihat detail.">
        <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
          <form onSubmit={submitSearch} role="search" className="flex min-w-0 items-center gap-2 rounded-xl border bg-card p-1.5 shadow-soft focus-within:border-primary">
            <Search className="ml-2 size-4 shrink-0 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama UMKM atau lokasi..." aria-label="Cari UMKM di peta" className="h-9 min-w-0 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground" />
            <button type="submit" className="min-h-9 shrink-0 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">Cari</button>
          </form>
           <Select value={search.kec ?? "all"} onValueChange={(v) => navigate({ search: { ...(v !== "all" ? { kec: v } : {}), ...(search.kategori ? { kategori: search.kategori } : {}), ...(search.q ? { q: search.q } : {}) } })}>
            <SelectTrigger className="h-12 bg-card sm:h-11" aria-label="Filter kecamatan"><SelectValue placeholder="Semua kecamatan" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua kecamatan</SelectItem>
              {districts.map((d) => <SelectItem key={d.id} value={d.slug}>{d.name}</SelectItem>)}
            </SelectContent>
           </Select>
           <Select value={search.kategori ?? "all"} onValueChange={(v) => navigate({ search: { ...(search.kec ? { kec: search.kec } : {}), ...(v !== "all" ? { kategori: v } : {}), ...(search.q ? { q: search.q } : {}) } })}>
             <SelectTrigger className="h-12 bg-card sm:h-11" aria-label="Filter kategori"><SelectValue placeholder="Semua kategori" /></SelectTrigger>
             <SelectContent>
               <SelectItem value="all">Semua kategori</SelectItem>
               {categories.map((category) => <SelectItem key={category.id} value={category.slug}>{category.name}</SelectItem>)}
             </SelectContent>
           </Select>
         </div>
       </PageHero>
      <section className="container-page grid gap-5 py-6 sm:gap-6 sm:py-8 lg:grid-cols-[1fr_320px]">
        <div className="h-[360px] overflow-hidden rounded-2xl border shadow-soft sm:h-[520px] sm:rounded-3xl lg:h-[640px]">
          <ClientOnly fallback={<MapFallback />}>
            <Suspense fallback={<MapFallback />}>
              <LeafletMap markers={markers} center={center} zoom={district ? 13 : 10} className="size-full" />
            </Suspense>
          </ClientOnly>
        </div>
        <aside className="flex max-h-[420px] flex-col rounded-2xl border bg-card shadow-soft sm:max-h-[640px] sm:rounded-3xl">
          <div className="border-b p-4">
            <p className="font-semibold">{visible.length} UMKM di peta</p>
            <p className="text-xs text-muted-foreground">{district ? `Kecamatan ${district.name}` : "Seluruh Kabupaten Banyuwangi"}</p>
          </div>
          {visible.length === 0 ? (
            <div className="p-4"><EmptyState title="Belum ada titik lokasi" description="Belum ada UMKM terverifikasi dengan koordinat di wilayah ini." icon={<MapPin className="size-7" />} /></div>
          ) : (
            <ul className="divide-y overflow-y-auto">
              {visible.map((p) => (
                <li key={p.id}>
                  <Link to="/umkm/$id" params={{ id: p.id }} className="flex gap-3 p-4 hover:bg-muted/60">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"><Store className="size-4" /></span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category} · Kec. {p.district}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{p.address}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </section>
    </>
  );
}
