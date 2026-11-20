export type FavoriteKind = "product" | "umkm";

export type FavoriteItem = {
  id: string;
  kind: FavoriteKind;
  name: string;
  image?: string | null;
  href: string;
  createdAt: number;
};

export type InquiryItem = {
  productId: string;
  name: string;
  price: number;
  image?: string | null;
  storeId: string;
  storeName: string;
  storeWhatsapp: string | null;
  qty: number;
  note: string;
};

export type AnalyticsEvent = {
  type: "product_view" | "umkm_view" | "whatsapp_click" | "favorite_toggle" | "inquiry_added" | "search";
  entityId?: string;
  createdAt: number;
};

export type VisitItem = {
  id: string;
  kind: FavoriteKind;
  name: string;
  image?: string | null;
  href: string;
  visitedAt: number;
};

const KEYS = {
  favorites: "umkm-banyuwangi:favorites",
  inquiries: "umkm-banyuwangi:inquiries",
  visits: "umkm-banyuwangi:visits",
  analytics: "umkm-banyuwangi:analytics",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("umkm-storage", { detail: key }));
}

export function getFavorites() {
  return read<FavoriteItem[]>(KEYS.favorites, []);
}

export function isFavorite(id: string, kind: FavoriteKind) {
  return getFavorites().some((item) => item.id === id && item.kind === kind);
}

export function toggleFavorite(item: Omit<FavoriteItem, "createdAt">) {
  const current = getFavorites();
  const exists = current.some((value) => value.id === item.id && value.kind === item.kind);
  const next = exists
    ? current.filter((value) => !(value.id === item.id && value.kind === item.kind))
    : [{ ...item, createdAt: Date.now() }, ...current].slice(0, 100);
  write(KEYS.favorites, next);
  return !exists;
}

export function getInquiries() {
  return read<InquiryItem[]>(KEYS.inquiries, []);
}

export function upsertInquiry(item: InquiryItem) {
  const current = getInquiries();
  const index = current.findIndex((value) => value.productId === item.productId && value.storeId === item.storeId);
  const next = [...current];
  if (index >= 0) next[index] = item;
  else next.unshift(item);
  write(KEYS.inquiries, next);
  return next;
}

export function removeInquiry(productId: string, storeId: string) {
  const next = getInquiries().filter((item) => !(item.productId === productId && item.storeId === storeId));
  write(KEYS.inquiries, next);
  return next;
}

export function getAnalytics() {
  return read<AnalyticsEvent[]>(KEYS.analytics, []);
}

export function recordAnalytics(type: AnalyticsEvent["type"], entityId?: string) {
  const next = [{ type, ...(entityId ? { entityId } : {}), createdAt: Date.now() }, ...getAnalytics()].slice(0, 200);
  write(KEYS.analytics, next);
  return next;
}

export function getVisits() {
  return read<VisitItem[]>(KEYS.visits, []);
}

export function recordVisit(item: Omit<VisitItem, "visitedAt">) {
  const next = [{ ...item, visitedAt: Date.now() }, ...getVisits().filter((value) => !(value.id === item.id && value.kind === item.kind))].slice(0, 20);
  write(KEYS.visits, next);
  return next;
}

export function subscribeStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("umkm-storage", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("umkm-storage", callback);
  };
}

export function whatsappInquiryMessage(storeName: string, items: InquiryItem[], url?: string) {
  return [
    `Halo ${storeName}, saya ingin bertanya tentang produk berikut:`,
    ...items.map((item) => `- ${item.name} x${item.qty} (${item.note || "tanpa catatan"})`),
    "Mohon info ketersediaan dan cara pemesanannya.",
    url ? `\n${url}` : "",
  ].join("\n").trim();
}
