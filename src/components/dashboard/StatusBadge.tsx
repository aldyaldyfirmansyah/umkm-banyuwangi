import { Badge } from "@/components/ui/badge";

export function VerificationBadge({ status, suspended }: { status: string; suspended?: boolean }) {
  if (suspended) return <Badge variant="danger">Dinonaktifkan</Badge>;
  if (status === "approved") return <Badge variant="success">Terverifikasi</Badge>;
  if (status === "rejected") return <Badge variant="danger">Ditolak</Badge>;
  return <Badge variant="warning">Menunggu verifikasi</Badge>;
}

export function ModerationBadge({ status }: { status: string }) {
  if (status === "approved") return <Badge variant="success">Disetujui</Badge>;
  if (status === "hidden") return <Badge variant="danger">Disembunyikan</Badge>;
  return <Badge variant="warning">Menunggu review</Badge>;
}

export function ProductStatusBadge({ status, stock }: { status: string; stock: number }) {
  if (status !== "active") return <Badge variant="muted">Nonaktif</Badge>;
  if (stock <= 0) return <Badge variant="danger">Stok habis</Badge>;
  return <Badge variant="soft">Aktif</Badge>;
}
