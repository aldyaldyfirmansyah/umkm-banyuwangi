import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronRight, Clock, MapPin, MessageCircle, Package, Phone, Store, Tag, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/site/ShareButton";
import { ProductGrid } from "@/components/site/ProductCard";
import { StoreAvatar } from "@/components/site/StoreCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { formatRupiah, orderMessage, whatsappLink } from "@/lib/format";
import { productQuery } from "@/lib/queries";

export const Route = createFileRoute("/produk/$id")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(productQuery(params.id));
    if (!data) throw notFound();
    return { name: data.product.product_name, description: data.product.description, price: data.product.price };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Produk tidak tersedia — UMKM BANYUWANGI" }, { name: "robots", content: "noindex" }] };
    const title = `${loaderData.name} — UMKM BANYUWANGI`;
    const desc = `${formatRupiah(loaderData.price)} · ${loaderData.description.slice(0, 140)}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="container-page py-24 text-center">
      <h1 className="text-3xl font-semibold text-primary-deep">Produk tidak ditemukan</h1>
      <p className="mt-2 text-muted-foreground">Produk ini mungkin sudah tidak tersedia.</p>
      <Button asChild className="mt-6"><Link to="/katalog">Kembali ke katalog</Link></Button>
    </div>
  ),
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data } = useSuspenseQuery(productQuery(id));
  const product = data!.product;
  const related = data!.related;
  const gallery = Array.from(new Set([product.image, ...(product.images ?? [])].filter(Boolean))) as string[];
  const [active, setActive] = useState(0);
  const [url, setUrl] = useState("");
  const store = product.umkm;

  useEffect(() => {
    setActive(0);
    setUrl(window.location.href);
    supabase.rpc("increment_product_view", { _product_id: id }).then(() => undefined);
  }, [id]);

  const waHref = whatsappLink(store.whatsapp, orderMessage(product.product_name, product.price, url));
  const contactHref = whatsappLink(store.whatsapp, `Halo ${store.business_name}, saya ingin bertanya tentang produk ${product.product_name}.`);
  const inStock = product.stock > 0;

  function orderProduct() {
    if (!user) {
      toast.error("Silakan masuk terlebih dahulu untuk memesan produk.");
      navigate({ to: "/auth", search: { mode: "login", redirect: `/produk/${id}` } });
      return;
    }
    window.open(waHref, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="container-page py-8">
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-primary">Beranda</Link>
        <ChevronRight className="size-4" />
        <Link to="/katalog" className="hover:text-primary">Katalog</Link>
        {product.category && (
          <>
            <ChevronRight className="size-4" />
            <Link to="/katalog" search={{ kategori: product.category.slug }} className="hover:text-primary">{product.category.name}</Link>
          </>
        )}
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-3xl border bg-cream shadow-soft">
            {gallery[active] ? (
              <img src={gallery[active]} alt={product.product_name} className="size-full object-cover" width={800} height={800} />
            ) : (
              <div className="grid size-full place-items-center text-muted-foreground">Tidak ada foto</div>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {gallery.map((g, i) => (
                <button key={g} onClick={() => setActive(i)} className={`aspect-square overflow-hidden rounded-xl border-2 ${i === active ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`} aria-label={`Foto ${i + 1}`}>
                  <img src={g} alt="" className="size-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          {product.category && <Badge variant="soft" className="w-fit"><Tag className="mr-1 size-3" />{product.category.name}</Badge>}
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-primary-deep sm:text-4xl">{product.product_name}</h1>
          <p className="mt-4 font-display text-3xl font-semibold text-primary">{formatRupiah(product.price)}</p>
          <div className="mt-3 flex items-center gap-3 text-sm">
            {inStock ? (
              <Badge variant="success"><Package className="mr-1 size-3" />Stok tersedia: {product.stock}</Badge>
            ) : (
              <Badge variant="danger">Stok habis</Badge>
            )}
            <span className="text-muted-foreground">{product.views} kali dilihat</span>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button type="button" size="lg" variant="whatsapp" className="flex-1" onClick={orderProduct} disabled={!inStock}>
              <MessageCircle /> Pesan Melalui WhatsApp
            </Button>
            <Button asChild size="lg" variant="outline" className="flex-1">
              <a href={contactHref} target="_blank" rel="noreferrer"><Phone /> Hubungi Penjual</a>
            </Button>
          </div>
          <div className="mt-3"><ShareButton title={product.product_name} text={`Lihat ${product.product_name} di UMKM BANYUWANGI`} /></div>

          <div className="mt-8">
            <h2 className="font-sans text-lg font-semibold">Deskripsi produk</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-muted-foreground">{product.description || "Belum ada deskripsi."}</p>
          </div>

          <div className="mt-8 rounded-2xl border bg-cream/50 p-5">
            <div className="flex items-center gap-4">
              <StoreAvatar name={store.business_name} logo={store.logo} />
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Dijual oleh</p>
                <Link to="/umkm/$id" params={{ id: store.id }} className="block truncate font-semibold hover:text-primary">{store.business_name}</Link>
              </div>
              <Button asChild variant="soft" size="sm"><Link to="/umkm/$id" params={{ id: store.id }}><Store /> Kunjungi</Link></Button>
            </div>
            <dl className="mt-4 grid gap-2 text-sm text-muted-foreground">
              <div className="flex gap-2"><UserRound className="size-4 shrink-0" /><dt className="sr-only">Pemilik</dt><dd>Pemilik: {store.owner_name || "-"}</dd></div>
              <div className="flex gap-2"><MapPin className="size-4 shrink-0" /><dt className="sr-only">Lokasi</dt><dd>{[store.full_address || store.address, store.village, store.district ? `Kec. ${store.district.name}` : null, "Banyuwangi"].filter(Boolean).join(", ")}</dd></div>
              {store.opening_hours && <div className="flex gap-2"><Clock className="size-4 shrink-0" /><dt className="sr-only">Jam operasional</dt><dd>{store.opening_hours}</dd></div>}
            </dl>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-semibold text-primary-deep">Produk serupa</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
