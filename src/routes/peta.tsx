import { lazy, Suspense, useMemo, useState, type FormEvent } from "react";
import { ClientOnly, createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MapPin, Search, Store } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHero } from "@/components/site/SectionHeading";
import { EmptyState } from "@/components/site/EmptyState";
import { districtsQuery, mapPointsQuery } from "@/lib/queries";
import { escapeHtml } from "@/lib/html";

const LeafletMap = lazy(() => import("@/components/site/LeafletMap"));

type S = { kec?: string; q?: string };

export const Route = createFileRoute("/peta")({
  validateSearch: (s: Record<string, unknown>): S => ({
    kec: typeof s.kec === "string" && s.kec ? s.kec : undefined,
    q: typeof s.q === "string" && s.q ? s.q : undefined,
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
  const [query, setQuery] = useState(search.q ?? "");
  const district = districts.find((d) => d.slug === search.kec);
  const visible = useMemo(() => {
    const keyword = (search.q ?? "").toLowerCase();
    return points.filter((p) => {
      const matchesDistrict = !search.kec || p.districtSlug === search.kec;
      const matchesQuery = !keyword || [p.name, p.category, p.district, p.address].some((value) => value.toLowerCase().includes(keyword));
      return matchesDistrict && matchesQuery;
    });
  }, [points, search.kec, search.q]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate({ search: { kec: search.kec, q: query.trim() || undefined } });
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
  const center: [number, number] | undefined = district?.latitude && district.longitude ? [district.latitude, district.longitude] : undefined;

  return (
    <>
      <PageHero eyebrow="Peta" title="Peta Persebaran UMKM" description="Titik lokasi diambil dari data UMKM yang telah diverifikasi admin. Klik titik untuk melihat detail.">
        <div className="mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row">
          <form onSubmit={submitSearch} role="search" className="flex flex-1 items-center gap-2 rounded-xl border bg-card p-1.5 shadow-soft focus-within:border-primary">
            <Search className="ml-2 size-4 shrink-0 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama UMKM, kategori, atau lokasi..." aria-label="Cari UMKM di peta" className="h-9 min-w-0 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground" />
            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Cari</button>
          </form>
          <div className="sm:w-56">
          <Select value={search.kec ?? "all"} onValueChange={(v) => navigate({ search: { kec: v === "all" ? undefined : v } })}>
            <SelectTrigger className="h-11 bg-card" aria-label="Filter kecamatan"><SelectValue placeholder="Semua kecamatan" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua kecamatan</SelectItem>
              {districts.map((d) => <SelectItem key={d.id} value={d.slug}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          </div>
        </div>
      </PageHero>
      <section className="container-page grid gap-6 py-8 lg:grid-cols-[1fr_320px]">
        <div className="h-[520px] overflow-hidden rounded-3xl border shadow-soft lg:h-[640px]">
          <ClientOnly fallback={<MapFallback />}>
            <Suspense fallback={<MapFallback />}>
              <LeafletMap markers={markers} center={center} zoom={center ? 13 : 10} className="size-full" />
            </Suspense>
          </ClientOnly>
        </div>
        <aside className="flex max-h-[640px] flex-col rounded-3xl border bg-card shadow-soft">
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
