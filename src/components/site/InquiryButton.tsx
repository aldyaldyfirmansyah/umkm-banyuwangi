import { MessageCircle, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { recordAnalytics, upsertInquiry, type InquiryItem } from "@/lib/local-store";
import { toast } from "sonner";

export function InquiryButton({ item }: { item: InquiryItem }) {
  const [qty, setQty] = useState(String(item.qty || 1));
  const [note, setNote] = useState(item.note);
  const [open, setOpen] = useState(false);
  function save() {
    upsertInquiry({ ...item, qty: Math.max(1, Number(qty) || 1), note });
    recordAnalytics("inquiry_added", item.productId);
    setOpen(false);
    toast.success("Ditambahkan ke daftar pertanyaan");
  }
  return (
    <div className="space-y-2">
      <Button type="button" variant="soft" className="w-full" onClick={() => setOpen((value) => !value)}>
        <Plus /> Tambah ke pertanyaan
      </Button>
      {open && (
        <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
          <div className="flex gap-2">
            <Input value={qty} onChange={(event) => setQty(event.target.value.replace(/\D/g, ""))} inputMode="numeric" aria-label="Jumlah" placeholder="Jumlah" />
            <Input value={note} onChange={(event) => setNote(event.target.value)} aria-label="Catatan" placeholder="Catatan pembeli" />
          </div>
          <Button type="button" size="sm" className="w-full" onClick={save}><MessageCircle /> Simpan pertanyaan</Button>
        </div>
      )}
    </div>
  );
}
