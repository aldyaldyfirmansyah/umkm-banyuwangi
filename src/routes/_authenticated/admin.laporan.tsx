import { createFileRoute } from "@tanstack/react-router";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingBlock, PageTitle } from "@/components/dashboard/DashboardShell";
import { useAdminDistricts, useAdminUmkm } from "@/hooks/use-admin-data";
import { buildDistrictReport } from "@/lib/district-report";

export const Route = createFileRoute("/_authenticated/admin/laporan")({
  component: Laporan,
});

function Laporan() {
  const { data: umkm } = useAdminUmkm();
  const { data: districts } = useAdminDistricts();
  if (!umkm || !districts) return <LoadingBlock />;
  const rows = buildDistrictReport(districts, umkm);
  const sum = (k: "approved" | "pending" | "rejected" | "suspended" | "total" | "products") => rows.reduce((s, r) => s + r[k], 0);

  function exportCsv() {
    const header = ["No", "Kecamatan", "Terverifikasi", "Menunggu", "Ditolak", "Dinonaktifkan", "Total UMKM", "Total Produk"];
    const lines = rows.map((r, i) => [i + 1, r.name, r.approved, r.pending, r.rejected, r.suspended, r.total, r.products].join(","));
    const csv = [header.join(","), ...lines, ["", "TOTAL", sum("approved"), sum("pending"), sum("rejected"), sum("suspended"), sum("total"), sum("products")].join(",")].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `laporan-umkm-per-kecamatan-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <PageTitle
        title="Laporan UMKM per Kecamatan"
        description="Rekap jumlah UMKM dan produk di 25 kecamatan Kabupaten Banyuwangi."
        action={<div className="flex gap-2"><Button variant="outline" onClick={() => window.print()}><Printer /> Cetak</Button><Button onClick={exportCsv}><Download /> Unduh CSV</Button></div>}
      />
      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No</TableHead>
              <TableHead>Kecamatan</TableHead>
              <TableHead className="text-right">Terverifikasi</TableHead>
              <TableHead className="text-right">Menunggu</TableHead>
              <TableHead className="text-right">Ditolak</TableHead>
              <TableHead className="text-right">Nonaktif</TableHead>
              <TableHead className="text-right">Total UMKM</TableHead>
              <TableHead className="text-right">Produk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={r.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-right">{r.approved}</TableCell>
                <TableCell className="text-right">{r.pending}</TableCell>
                <TableCell className="text-right">{r.rejected}</TableCell>
                <TableCell className="text-right">{r.suspended}</TableCell>
                <TableCell className="text-right font-semibold">{r.total}</TableCell>
                <TableCell className="text-right">{r.products}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell />
              <TableCell className="font-semibold">Total</TableCell>
              <TableCell className="text-right">{sum("approved")}</TableCell>
              <TableCell className="text-right">{sum("pending")}</TableCell>
              <TableCell className="text-right">{sum("rejected")}</TableCell>
              <TableCell className="text-right">{sum("suspended")}</TableCell>
              <TableCell className="text-right font-semibold">{sum("total")}</TableCell>
              <TableCell className="text-right">{sum("products")}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </>
  );
}
