export function formatRupiah(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

/** Normalises Indonesian phone numbers to the international form WhatsApp expects (62xxxx). */
export function normalizeWhatsapp(phone: string | null | undefined): string {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  else if (digits.startsWith("8")) digits = "62" + digits;
  return digits;
}

export function whatsappLink(phone: string | null | undefined, message: string): string {
  const number = normalizeWhatsapp(phone);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function orderMessage(productName: string, price: number | string, url?: string): string {
  return [
    `Halo, saya tertarik dengan produk *${productName}* (${formatRupiah(price)}) yang saya lihat di UMKM BANYUWANGI.`,
    "Apakah produk ini masih tersedia dan bagaimana cara pemesanannya?",
    url ? `\n${url}` : "",
  ]
    .join("\n")
    .trim();
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(value),
  );
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
