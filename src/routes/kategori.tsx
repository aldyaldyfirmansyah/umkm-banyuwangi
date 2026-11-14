import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/site/SectionHeading";
import { CategoryIcon } from "@/components/site/CategoryIcon";
import { EmptyState } from "@/components/site/EmptyState";
import { categoriesQuery } from "@/lib/queries";

export const Route = createFileRoute("/kategori")({
  head: () => ({
    meta: [
      { title: "Kategori Produk UMKM — UMKM BANYUWANGI" },
      { name: "description", content: "Jelajahi produk UMKM berdasarkan kategori: makanan, fashion, kerajinan, kecantikan, pertanian, dan rumah tangga." },
      { property: "og:title", content: "Kategori Produk UMKM — UMKM BANYUWANGI" },
      { property: "og:description", content: "Pilih kategori dan temukan produk lokal favorit Anda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(categoriesQuery()),
  component: KategoriPage,
});

function KategoriPage() {
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  return (
    <>
      <PageHero eyebrow="Kategori" title="Kategori Produk" description="Setiap kategori berisi produk asli karya pelaku UMKM Indonesia." />
      <section className="container-page py-12">
        {categories.length === 0 ? (
          <EmptyState title="Belum ada kategori" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                to="/katalog"
                search={{ kategori: c.slug }}
                className="group flex items-start gap-4 rounded-2xl border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:border-primary hover:shadow-lift"
              >
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <CategoryIcon name={c.icon} className="size-7" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-sans text-lg font-semibold">{c.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{c.description || "Produk pilihan UMKM."}</p>
                  <p className="mt-3 flex items-center gap-1 text-sm font-medium text-primary">
                    {c.product_count} produk <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
