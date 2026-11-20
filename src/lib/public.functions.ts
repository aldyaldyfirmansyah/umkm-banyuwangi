import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const clean = (s: string) => s.replace(/[%_,()]/g, "");

const PRODUCT_CARD_SELECT =
  "id, product_name, price, stock, image, created_at, views, category:categories(id, name, slug), umkm:umkm!inner(id, business_name, city, district_id, district:districts(name, slug))";

const STORE_CARD_SELECT =
  "id, business_name, city, description, logo, verification_status, created_at, district_id, category_id, district:districts(name, slug), category:categories(name, slug), products(count)";

type RawStore = {
  id: string;
  business_name: string;
  city: string;
  description: string | null;
  logo: string | null;
  verification_status: string;
  created_at: string;
  district: { name: string; slug: string } | null;
  category: { name: string; slug: string } | null;
  products: unknown;
};

function toStoreCard(s: RawStore): StoreCard {
  return {
    id: s.id,
    business_name: s.business_name,
    city: s.city,
    description: s.description,
    logo: s.logo,
    verified: s.verification_status === "approved",
    created_at: s.created_at,
    district: s.district?.name ?? null,
    category: s.category?.name ?? null,
    product_count: (s.products as { count: number }[] | null)?.[0]?.count ?? 0,
  };
}

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data } = await sb.from("site_settings").select("*").eq("id", 1).maybeSingle();
  return data;
});

export const getCatalogCategoryCounts = createServerFn({ method: "GET" })
  .validator((input: { kec?: string }) => input)
  .handler(async ({ data }) => {
    const sb = publicClient();
    let districtId: string | undefined;
    if (data.kec) {
      const { data: district } = await sb.from("districts").select("id").eq("slug", data.kec).maybeSingle();
      districtId = district?.id;
      if (!districtId) return {};
    }
    let query = sb.from("products").select("category_id, umkm!inner(district_id)");
    if (districtId) query = query.eq("umkm.district_id", districtId);
    const { data: products, error } = await query;
    if (error) return {};
    const counts: Record<string, number> = {};
    for (const product of products ?? []) {
      if (product.category_id) counts[product.category_id] = (counts[product.category_id] ?? 0) + 1;
    }
    return counts;
  });

export const getCategories = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const [{ data: cats, error }, { data: prods }] = await Promise.all([
    sb.from("categories").select("id, name, slug, description, icon").order("sort_order"),
    sb.from("products").select("category_id"),
  ]);
  if (error) return [];
  const counts = new Map<string, number>();
  for (const p of prods ?? []) if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
  return (cats ?? []).map((c) => ({ ...c, product_count: counts.get(c.id) ?? 0 }));
});

export const getDistricts = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const [{ data: rows, error }, { data: stores }] = await Promise.all([
    sb.from("districts").select("id, name, slug, latitude, longitude").order("sort_order"),
    sb.from("umkm").select("district_id").eq("verification_status", "approved"),
  ]);
  if (error) throw new Error(error.message);
  const counts = new Map<string, number>();
  for (const s of stores ?? []) if (s.district_id) counts.set(s.district_id, (counts.get(s.district_id) ?? 0) + 1);
  return (rows ?? []).map((d) => ({ ...d, umkm_count: counts.get(d.id) ?? 0 }));
});

export const getHomeData = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const [featured, newestProducts, stores, banners, productCount] = await Promise.all([
    sb.from("products").select(PRODUCT_CARD_SELECT).eq("is_featured", true).order("views", { ascending: false }).limit(8),
    sb.from("products").select(PRODUCT_CARD_SELECT).order("created_at", { ascending: false }).limit(4),
    sb.from("umkm").select(STORE_CARD_SELECT).eq("verification_status", "approved").order("created_at", { ascending: false }),
    sb.from("banners").select("id, title, description, image, link").order("sort_order").limit(3),
    sb.from("products").select("id", { count: "exact", head: true }),
  ]);
  const all = ((stores.data ?? []) as unknown as RawStore[]).map(toStoreCard);
  const districtsWithUmkm = new Set(all.map((s) => s.district).filter(Boolean));
  const byDistrictMap = new Map<string, StoreCard[]>();
  for (const s of all) {
    if (!s.district) continue;
    const arr = byDistrictMap.get(s.district) ?? [];
    arr.push(s);
    byDistrictMap.set(s.district, arr);
  }
  const rawBySlug = new Map(((stores.data ?? []) as unknown as RawStore[]).map((s) => [s.district?.name, s.district?.slug]));
  const byDistrict = Array.from(byDistrictMap.entries())
    .map(([name, list]) => ({ name, slug: rawBySlug.get(name) ?? "", stores: list.slice(0, 3), total: list.length }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);
  return {
    stats: { umkm: all.length, products: productCount.count ?? 0, districts: districtsWithUmkm.size },
    featured: featured.data ?? [],
    newestProducts: newestProducts.data ?? [],
    newestUmkm: all.slice(0, 3),
    chosenUmkm: [...all].sort((a, b) => b.product_count - a.product_count).slice(0, 6),
    byDistrict,
    banners: banners.data ?? [],
  };
});

export type CatalogSearch = {
  q?: string;
  kategori?: string;
  kec?: string;
  min?: number;
  max?: number;
  urut?: "terbaru" | "termurah" | "termahal" | "populer" | "harga_asc" | "harga_desc" | "terpopuler";
  hal?: number;
};

export const PAGE_SIZE = 12;

export const searchProducts = createServerFn({ method: "GET" })
  .validator((input: CatalogSearch) => input)
  .handler(async ({ data }) => {
    const sb = publicClient();
    let categoryId: string | null = null;
    let districtId: string | null = null;
    if (data.kategori) {
      const { data: cat } = await sb.from("categories").select("id").eq("slug", data.kategori).maybeSingle();
      if (!cat) return { items: [], total: 0 };
      categoryId = cat.id;
    }
    if (data.kec) {
      const { data: d } = await sb.from("districts").select("id").eq("slug", data.kec).maybeSingle();
      if (!d) return { items: [], total: 0 };
      districtId = d.id;
    }
    let query = sb.from("products").select(PRODUCT_CARD_SELECT, { count: "exact" });
    if (data.q) query = query.ilike("product_name", `%${clean(data.q)}%`);
    if (categoryId) query = query.eq("category_id", categoryId);
    if (districtId) query = query.eq("umkm.district_id", districtId);
    if (data.min != null) query = query.gte("price", data.min);
    if (data.max != null) query = query.lte("price", data.max);
    switch (data.urut) {
      case "termurah":
      case "harga_asc":
        query = query.order("price", { ascending: true });
        break;
      case "termahal":
      case "harga_desc":
        query = query.order("price", { ascending: false });
        break;
      case "populer":
      case "terpopuler":
        query = query.order("views", { ascending: false });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }
    const page = Math.max(1, data.hal ?? 1);
    const { data: items, count, error } = await query.range(0, page * PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    return { items: (items ?? []) as unknown as ProductCard[], total: count ?? 0 };
  });

export const getProduct = createServerFn({ method: "GET" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const sb = publicClient();
    if (!/^[0-9a-f-]{36}$/i.test(data.id)) return null;
    const { data: product } = await sb
      .from("products")
      .select(
        "id, product_name, description, price, stock, image, images, created_at, views, category_id, category:categories(id, name, slug), umkm:umkm!inner(id, business_name, owner_name, city, address, full_address, village, whatsapp, logo, description, opening_hours, instagram, facebook, tiktok, district:districts(name, slug))",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (!product) return null;
    let related: ProductCard[] = [];
    if (product.category_id) {
      const { data: rel } = await sb.from("products").select(PRODUCT_CARD_SELECT).eq("category_id", product.category_id).neq("id", product.id).limit(4);
      related = (rel ?? []) as unknown as ProductCard[];
    }
    return { product, related };
  });

export type DirectorySearch = { q?: string; kec?: string; kategori?: string; status?: "terverifikasi"; urut?: "terbaru" | "nama" };

export const listUmkm = createServerFn({ method: "GET" })
  .validator((input: DirectorySearch) => input)
  .handler(async ({ data }) => {
    const sb = publicClient();
    let query = sb.from("umkm").select(STORE_CARD_SELECT);
    if (data.kec) {
      const { data: d } = await sb.from("districts").select("id").eq("slug", data.kec).maybeSingle();
      if (!d) return [];
      query = query.eq("district_id", d.id);
    }
    if (data.kategori) {
      const { data: c } = await sb.from("categories").select("id").eq("slug", data.kategori).maybeSingle();
      if (!c) return [];
      query = query.eq("category_id", c.id);
    }
    if (data.status === "terverifikasi") query = query.eq("verification_status", "approved");
    if (data.q) query = query.ilike("business_name", `%${clean(data.q)}%`);
    query = data.urut === "nama" ? query.order("business_name") : query.order("created_at", { ascending: false });
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return ((rows ?? []) as unknown as RawStore[]).map(toStoreCard);
  });

export const getUmkm = createServerFn({ method: "GET" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const sb = publicClient();
    if (!/^[0-9a-f-]{36}$/i.test(data.id)) return null;
    const { data: store } = await sb
      .from("umkm")
      .select(
        "id, business_name, owner_name, city, address, full_address, village, whatsapp, logo, description, opening_hours, instagram, facebook, tiktok, created_at, verification_status, verified_at, latitude, longitude, district:districts(name, slug), category:categories(name, slug)",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (!store) return null;
    const { data: products } = await sb.from("products").select(PRODUCT_CARD_SELECT).eq("umkm_id", store.id).order("created_at", { ascending: false });
    return { store, products: (products ?? []) as unknown as ProductCard[] };
  });

export const getMapPoints = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("umkm")
    .select("id, business_name, logo, full_address, address, village, latitude, longitude, district:districts(name, slug, latitude, longitude), category:categories(name)")
    .eq("verification_status", "approved");
  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((d) => ({
      id: d.id,
      name: d.business_name,
      logo: d.logo,
      address: [d.full_address || d.address, d.village].filter(Boolean).join(", "),
      lat: d.latitude ?? d.district?.latitude,
      lng: d.longitude ?? d.district?.longitude,
      district: d.district?.name ?? "",
      districtSlug: d.district?.slug ?? "",
      category: d.category?.name ?? "Lainnya",
    }))
    .filter((point): point is typeof point & { lat: number; lng: number } => point.lat != null && point.lng != null);
});

export type MapPoint = Awaited<ReturnType<typeof getMapPoints>>[number];

export type ProductCard = {
  id: string;
  product_name: string;
  price: number;
  stock: number;
  image: string | null;
  created_at: string;
  views: number;
  category: { id: string; name: string; slug: string } | null;
  umkm: { id: string; business_name: string; city: string; district: { name: string; slug: string } | null };
};

export type StoreCard = {
  id: string;
  business_name: string;
  city: string;
  description: string | null;
  logo: string | null;
  verified: boolean;
  created_at: string;
  district: string | null;
  category: string | null;
  product_count: number;
};
