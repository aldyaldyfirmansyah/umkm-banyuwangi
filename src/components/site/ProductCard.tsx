import { Link } from "@tanstack/react-router";
import { MapPin, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah } from "@/lib/format";
import type { ProductCard as ProductCardData } from "@/lib/public.functions";

export function ProductCard({ product }: { product: ProductCardData }) {
  const soldOut = product.stock <= 0;
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <Link
        to="/produk/$id"
        params={{ id: product.id }}
        className="relative block aspect-square overflow-hidden bg-cream"
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.product_name}
            loading="lazy"
            width={600}
            height={600}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">Tidak ada foto</div>
        )}
        {product.category && (
          <Badge variant="cream" className="absolute left-3 top-3 shadow-soft">
            {product.category.name}
          </Badge>
        )}
        {soldOut && (
          <Badge variant="destructive" className="absolute right-3 top-3">
            Stok habis
          </Badge>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link to="/produk/$id" params={{ id: product.id }} className="line-clamp-2 font-semibold leading-snug hover:text-primary">
          {product.product_name}
        </Link>
        <p className="font-display text-lg font-semibold text-primary">{formatRupiah(product.price)}</p>
        <div className="mt-auto space-y-1 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5 truncate">
            <Store className="size-3.5 shrink-0" />
            {product.umkm.business_name}
          </p>
          <p className="flex items-center gap-1.5 truncate">
            <MapPin className="size-3.5 shrink-0" />
            {product.umkm.district ? `Kec. ${product.umkm.district.name}` : product.umkm.city}
          </p>
        </div>
        <Button asChild variant="soft" size="sm" className="mt-2 w-full">
          <Link to="/produk/$id" params={{ id: product.id }}>
            Lihat Detail
          </Link>
        </Button>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border bg-card">
          <Skeleton className="aspect-square rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
