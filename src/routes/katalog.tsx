import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Loader2, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PageHero } from "@/components/site/SectionHeading";
import { SearchBar } from "@/components/site/SearchBar";
import { ProductGrid, ProductGridSkeleton } from "@/components/site/ProductCard";
import { EmptyState } from "@/components/site/EmptyState";
import { catalogCategoryCountsQuery, catalogQuery, categoriesQuery, districtsQuery } from "@/lib/queries";
import { PAGE_SIZE, type CatalogSearch } from "@/lib/public.functions";

const SORTS = ["terbaru", "termurah", "termahal", "populer", "harga_asc", "harga_desc", "terpopuler"] as const;

function toNum(v: unknown): number | undefined {
  const n = Number(v);
  return v === undefined || v === "" || !Number.isFinite(n) || n < 0 ? undefined : n;
}

export const Route = createFileRoute("/katalog")({
  validateSearch: (s: Record<string, unknown>): CatalogSearch => ({
    q: typeof s.q === "string" && s.q ? s.q.slice(0, 100) : undefined,
    kategori: typeof s.kategori === "string" && s.kategori ? s.kategori : undefined,
    kec: typeof s.kec === "string" && s.kec ? s.kec : undefined,
    min: toNum(s.min),
    max: toNum(s.max),
    urut: SORTS.includes((s.urut ?? s.sort) as (typeof SORTS)[number]) ? ((s.urut ?? s.sort) as CatalogSearch["urut"]) : undefined,
    hal: toNum(s.hal) ? Math.floor(toNum(s.hal)!) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Katalog Produk UMKM — UMKM BANYUWANGI" },
      { name: "description", content: "Cari produk UMKM Banyuwangi berdasarkan nama, kategori, harga, dan kecamatan." },
      { property: "og:title", content: "Katalog Produk UMKM — UMKM BANYUWANGI" },
      { property: "og:description", content: "Produk lokal dari UMKM di seluruh Kabupaten Banyuwangi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(catalogQuery(deps)),
      context.queryClient.ensureQueryData(categoriesQuery()),
      context.queryClient.ensureQueryData(catalogCategoryCountsQuery(deps.kec)),
      context.queryClient.ensureQueryData(districtsQuery()),
    ]);
  },
  component: Katalog,
});

function Filters({ search, onDone }: { search: CatalogSearch; onDone?: () => void }) {
  const navigate = useNavigate({ from: "/katalog" });
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const { data: districts } = useSuspenseQuery(districtsQuery());
  const { data: categoryCounts = {} } = useQuery(catalogCategoryCountsQuery(search.kec));
  const [min, setMin] = useState(search.min?.toString() ?? "");
  const [max, setMax] = useState(search.max?.toString() ?? "");
  const [priceError, setPriceError] = useState<string | null>(null);

  useEffect(() => {
    setMin(search.min?.toString() ?? "");
    setMax(search.max?.toString() ?? "");
  }, [search.min, search.max]);

  function update(patch: Partial<CatalogSearch>) {
    navigate({ search: (prev) => ({ ...prev, ...patch, hal: undefined }) });
  }

  function applyPrice() {
    const a = min ? Number(min) : undefined;
    const b = max ? Number(max) : undefined;
    if ((a !== undefined && (isNaN(a) || a < 0)) || (b !== undefined && (isNaN(b) || b < 0))) {
      setPriceError("Harga harus berupa angka positif.");
      return;
    }
    if (a !== undefined && b !== undefined && a > b) {
      setPriceError("Harga minimum tidak boleh melebihi maksimum.");
      return;
    }
    setPriceError(null);
    update({ min: a, max: b });
    onDone?.();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Kategori</Label>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => { update({ kategori: undefined }); onDone?.(); }}
            className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${!search.kategori ? "bg-primary-soft font-semibold text-primary-deep" : "hover:bg-muted"}`}
          >
            Semua kategori
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => { update({ kategori: c.slug }); onDone?.(); }}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${search.kategori === c.slug ? "bg-primary-soft font-semibold text-primary-deep" : "hover:bg-muted"}`}
            >
              <span>{c.name}</span>
              <span className="text-xs text-muted-foreground">{categoryCounts[c.id] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Kecamatan</Label>
        <Select value={search.kec ?? "all"} onValueChange={(v) => { update({ kec: v === "all" ? undefined : v }); onDone?.(); }}>
          <SelectTrigger><SelectValue placeholder="Semua kecamatan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua kecamatan</SelectItem>
            {districts.map((d) => (
              <SelectItem key={d.id} value={d.slug}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Rentang harga (Rp)</Label>
        <div className="flex items-center gap-2">
          <Input inputMode="numeric" placeholder="Min" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} />
          <span className="text-muted-foreground">–</span>
          <Input inputMode="numeric" placeholder="Maks" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} />
        </div>
        {priceError && <p className="text-xs text-destructive">{priceError}</p>}
        <Button variant="soft" className="w-full" onClick={applyPrice}>Terapkan harga</Button>
      </div>
    </div>
  );
}

function Katalog() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/katalog" });
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data, isFetching, isPlaceholderData } = useQuery({ ...catalogQuery(search), placeholderData: keepPreviousData });
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const { data: districts } = useSuspenseQuery(districtsQuery());
  const page = search.hal ?? 1;
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasMore = items.length < total;
  const activeCategory = categories.find((c) => c.slug === search.kategori);

  const chips: { label: string; clear: Partial<CatalogSearch> }[] = [];
  if (search.q) chips.push({ label: `"${search.q}"`, clear: { q: undefined } });
  if (activeCategory) chips.push({ label: activeCategory.name, clear: { kategori: undefined } });
  const activeDistrict = districts.find((d) => d.slug === search.kec);
  if (activeDistrict) chips.push({ label: `Kec. ${activeDistrict.name}`, clear: { kec: undefined } });
  if (search.min != null || search.max != null)
    chips.push({ label: `Rp${search.min ?? 0} – ${search.max != null ? "Rp" + search.max : "∞"}`, clear: { min: undefined, max: undefined } });

  return (
    <>
      <PageHero eyebrow="Katalog" title="Katalog Produk" description="Temukan produk lokal terbaik dari UMKM di 25 kecamatan Banyuwangi.">
        <SearchBar key={search.q} initial={search.q ?? ""} className="mt-6 max-w-2xl" large />
      </PageHero>
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border bg-card p-5 shadow-soft">
            <Filters search={search} />
          </div>
        </aside>
        <div>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Menampilkan <span className="font-semibold text-foreground">{items.length}</span> dari {total} produk
              {isFetching && <Loader2 className="ml-2 inline size-4 animate-spin" />}
            </p>
              <div className="flex w-full items-center gap-2 sm:w-auto">
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden"><SlidersHorizontal /> Filter</Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[min(20rem,86vw)] overflow-y-auto">
                  <SheetHeader><SheetTitle>Filter produk</SheetTitle></SheetHeader>
                  <div className="px-4 pb-6"><Filters search={search} onDone={() => setSheetOpen(false)} /></div>
                </SheetContent>
              </Sheet>
              <Select value={search.urut ?? "terbaru"} onValueChange={(v) => navigate({ search: (prev) => ({ ...prev, urut: v as CatalogSearch["urut"], hal: undefined }) })}>
                <SelectTrigger className="w-full sm:w-44" aria-label="Urutkan"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="terbaru">Terbaru</SelectItem>
                  <SelectItem value="termurah">Harga termurah</SelectItem>
                  <SelectItem value="termahal">Harga termahal</SelectItem>
                  <SelectItem value="populer">Terpopuler</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {chips.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2">
              {chips.map((c) => (
                <button key={c.label} onClick={() => navigate({ search: (prev) => ({ ...prev, ...c.clear, hal: undefined }) })} className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary-deep hover:bg-primary-soft/70">
                  {c.label} <X className="size-3" />
                </button>
              ))}
              <Link to="/katalog" className="px-2 py-1 text-xs font-medium text-muted-foreground hover:text-primary">Hapus semua</Link>
            </div>
          )}
          {!data ? (
            <ProductGridSkeleton />
          ) : items.length === 0 ? (
            <EmptyState
              title="Produk tidak ditemukan"
              description="Coba ubah kata kunci atau filter pencarian Anda."
              action={<Button asChild variant="soft"><Link to="/katalog">Lihat semua produk</Link></Button>}
            />
          ) : (
            <div className={isPlaceholderData ? "opacity-60 transition-opacity" : ""}>
              <ProductGrid products={items} />
            </div>
          )}
          {hasMore && (
            <div className="mt-10 flex justify-center">
              <Button
                variant="outline"
                size="lg"
                disabled={isFetching}
                onClick={() => navigate({ search: (prev) => ({ ...prev, hal: page + 1 }), resetScroll: false, replace: true })}
              >
                {isFetching ? <Loader2 className="animate-spin" /> : null} Muat lebih banyak
              </Button>
            </div>
          )}
          {!hasMore && items.length > PAGE_SIZE && (
            <p className="mt-10 text-center text-sm text-muted-foreground">Semua produk sudah ditampilkan.</p>
          )}
        </div>
      </div>
    </>
  );
}
