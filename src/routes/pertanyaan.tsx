import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getInquiries, removeInquiry, subscribeStorage, upsertInquiry, whatsappInquiryMessage, type InquiryItem } from "@/lib/local-store";
import { whatsappLink, formatRupiah } from "@/lib/format";

export const Route = createFileRoute("/pertanyaan")({ component: InquiryPage });

function InquiryPage() {
  const [items, setItems] = useState<InquiryItem[]>([]);
  useEffect(() => {
    const sync = () => setItems(getInquiries());
    sync();
    return subscribeStorage(sync);
  }, []);
  const groups = useMemo(() => Array.from(new Map(items.map((item) => [item.storeId, { storeId: item.storeId, storeName: item.storeName, whatsapp: item.storeWhatsapp }])).values()), [items]);
  function update(item: InquiryItem, patch: Partial<InquiryItem>) {
    upsertInquiry({ ...item, ...patch });
    setItems(getInquiries());
  }
  return (
    <div className="container-page py-10">
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Keranjang pertanyaan</p><h1 className="mt-1 text-3xl font-semibold text-primary-deep">Tanya beberapa produk</h1><p className="mt-2 text-sm text-muted-foreground">Pertanyaan tersimpan di browser ini dan dikelompokkan per UMKM.</p></div><Button asChild variant="outline"><Link to="/katalog">Kembali</Link></Button></div>
      {groups.length === 0 ? <div className="mt-8 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Belum ada produk dalam daftar pertanyaan.</div> : <div className="mt-8 space-y-5">{groups.map((group) => { const groupItems = items.filter((item) => item.storeId === group.storeId); return <section key={group.storeId} className="rounded-2xl border bg-card p-4 shadow-soft sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold text-primary-deep">{group.storeName}</h2><Button asChild variant="whatsapp" size="sm"><a href={whatsappLink(group.whatsapp, whatsappInquiryMessage(group.storeName, groupItems, typeof window !== "undefined" ? window.location.href : undefined))} target="_blank" rel="noreferrer"><MessageCircle /> Kirim via WhatsApp</a></Button></div><div className="mt-4 divide-y">{groupItems.map((item) => <div key={item.productId} className="flex gap-3 py-3 first:pt-0 last:pb-0">{item.image ? <img src={item.image} alt="" className="size-16 rounded-xl object-cover" /> : <div className="size-16 rounded-xl bg-muted" />}<div className="min-w-0 flex-1"><p className="truncate font-medium">{item.name}</p><p className="text-sm text-primary">{formatRupiah(item.price)}</p><div className="mt-2 flex flex-wrap gap-2"><div className="flex items-center rounded-lg border"><button type="button" className="p-2" aria-label="Kurangi jumlah" onClick={() => update(item, { qty: Math.max(1, item.qty - 1) })}><Minus className="size-3" /></button><span className="min-w-8 text-center text-sm">{item.qty}</span><button type="button" className="p-2" aria-label="Tambah jumlah" onClick={() => update(item, { qty: item.qty + 1 })}><Plus className="size-3" /></button></div><Input value={item.note} onChange={(event) => update(item, { note: event.target.value })} placeholder="Catatan" className="h-9 max-w-48" /><Button type="button" variant="ghost" size="icon" aria-label="Hapus produk" onClick={() => { removeInquiry(item.productId, item.storeId); setItems(getInquiries()); }}><Trash2 className="size-4 text-destructive" /></Button></div></div></div>)}</div></section>; })}</div>}
    </div>
  );
}
