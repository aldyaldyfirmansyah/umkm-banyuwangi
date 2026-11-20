import { lazy, Suspense } from "react";
import { ClientOnly, createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Clock, Facebook, Instagram, MapPin, MessageCircle, Music2, Tag, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/site/ProductCard";
import { StoreAvatar, VerifiedPill } from "@/components/site/StoreCard";

const LeafletMap = lazy(() => import("@/components/site/LeafletMap"));
import { EmptyState } from "@/components/site/EmptyState";
import { whatsappLink } from "@/lib/format";
import { umkmQuery } from "@/lib/queries";
import { FavoriteButton } from "@/components/site/FavoriteButton";
import { recordAnalytics, recordVisit } from "@/lib/local-store";
import { useEffect } from "react";

export const Route = createFileRoute("/umkm/$id")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(umkmQuery(params.id));
    if (!data) throw notFound();
    return { name: data.store.business_name, city: data.store.district?.name ? `Kec. ${data.store.district.name}` : data.store.city, description: data.store.description };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "UMKM tidak tersedia — UMKM BANYUWANGI" }, { name: "robots", content: "noindex" }] };
    const title = `${loaderData.name} (${loaderData.city}) — UMKM BANYUWANGI`;
    const desc = loaderData.description?.slice(0, 150) || `Produk dari ${loaderData.name}, ${loaderData.city}.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="container-page py-24 text-center">
      <h1 className="text-3xl font-semibold text-primary-deep">UMKM tidak ditemukan</h1>
      <Button asChild className="mt-6"><Link to="/umkm">Lihat daftar UMKM</Link></Button>
    </div>
  ),
  component: UmkmDetail,
});

function UmkmDetail() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(umkmQuery(id));
  const { store, products } = data!;
  useEffect(() => {
    recordVisit({ id, kind: "umkm", name: store.business_name, href: `/umkm/${id}`, image: store.logo });
    recordAnalytics("umkm_view", id);
  }, [id, store.business_name, store.logo]);
  return (
    <>
      <section className="relative overflow-hidden border-b bg-hero">
        <div className="leaf-pattern absolute inset-0 opacity-60" aria-hidden />
        <div className="container-page relative flex flex-col gap-6 py-12 md:flex-row md:items-center">
          <StoreAvatar name={store.business_name} logo={store.logo} size="lg" />
          <div className="flex-1">
            <VerifiedPill verified={store.verification_status === "approved"} />
             <div className="mt-1 flex items-start justify-between gap-3">
               <h1 className="text-4xl font-semibold text-primary-deep">{store.business_name}</h1>
               <FavoriteButton id={store.id} kind="umkm" name={store.business_name} href={`/umkm/${store.id}`} image={store.logo} compact />
             </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><UserRound className="size-4" />{store.owner_name || "-"}</span>
              <span className="flex items-center gap-1"><MapPin className="size-4" />{[store.full_address || store.address, store.village, store.district ? `Kec. ${store.district.name}` : null, "Banyuwangi"].filter(Boolean).join(", ")}</span>
              {store.category && <span className="flex items-center gap-1"><Tag className="size-4" />{store.category.name}</span>}
              {store.opening_hours && <span className="flex items-center gap-1"><Clock className="size-4" />{store.opening_hours}</span>}
            </div>
            {store.description && <p className="mt-4 max-w-2xl text-muted-foreground">{store.description}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Button asChild variant="whatsapp" size="lg">
              <a href={whatsappLink(store.whatsapp, `Halo ${store.business_name}, saya menemukan toko Anda di UMKM BANYUWANGI.`)} target="_blank" rel="noreferrer"><MessageCircle /> Chat WhatsApp</a>
            </Button>
            <div className="flex justify-center gap-2">
              {store.instagram && <a href={store.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid size-9 place-items-center rounded-lg border bg-card text-primary hover:bg-primary-soft"><Instagram className="size-4" /></a>}
              {store.facebook && <a href={store.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="grid size-9 place-items-center rounded-lg border bg-card text-primary hover:bg-primary-soft"><Facebook className="size-4" /></a>}
              {store.tiktok && <a href={store.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok" className="grid size-9 place-items-center rounded-lg border bg-card text-primary hover:bg-primary-soft"><Music2 className="size-4" /></a>}
            </div>
          </div>
        </div>
      </section>
      <section className="container-page py-12">
        {store.verification_status !== "approved" && (
          <p className="mb-6 rounded-2xl border border-warning/50 bg-warning/15 p-4 text-sm text-warning-foreground">UMKM ini masih dalam proses verifikasi admin. Produknya akan tampil setelah terverifikasi.</p>
        )}
        <div className={store.latitude != null && store.longitude != null && store.verification_status === "approved" ? "grid gap-8 lg:grid-cols-[1fr_340px]" : ""}>
          <div>
            <h2 className="mb-6 text-2xl font-semibold text-primary-deep">Produk ({products.length})</h2>
            {products.length ? <ProductGrid products={products} /> : <EmptyState title="Belum ada produk" description="UMKM ini belum menampilkan produk." />}
          </div>
          {store.latitude != null && store.longitude != null && store.verification_status === "approved" && (
            <aside>
              <h2 className="mb-6 text-2xl font-semibold text-primary-deep">Lokasi</h2>
              <div className="h-72 overflow-hidden rounded-2xl border shadow-soft">
                <ClientOnly fallback={<div className="size-full bg-muted" />}>
                  <Suspense fallback={<div className="size-full bg-muted" />}>
                    <LeafletMap markers={[{ id: store.id, lat: store.latitude, lng: store.longitude }]} center={[store.latitude, store.longitude]} zoom={15} className="size-full" />
                  </Suspense>
                </ClientOnly>
              </div>
              <a href={`https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">Buka di Google Maps</a>
            </aside>
          )}
        </div>
      </section>
    </>
  );
}
