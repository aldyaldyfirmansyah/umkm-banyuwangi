export type ReportUmkm = { district_id: string | null; verification_status: string; is_suspended: boolean; product_count: number };
export type ReportDistrict = { id: string; name: string };
export type DistrictReportRow = { id: string; name: string; approved: number; pending: number; rejected: number; suspended: number; total: number; products: number };

/** Counts UMKM per kecamatan by verification status. Suspended stores count only as suspended. */
export function buildDistrictReport(districts: ReportDistrict[], umkm: ReportUmkm[]): DistrictReportRow[] {
  const rows = new Map<string, DistrictReportRow>(
    districts.map((d) => [d.id, { id: d.id, name: d.name, approved: 0, pending: 0, rejected: 0, suspended: 0, total: 0, products: 0 }]),
  );
  for (const u of umkm) {
    if (!u.district_id) continue;
    const row = rows.get(u.district_id);
    if (!row) continue;
    row.total += 1;
    row.products += u.product_count;
    if (u.is_suspended) row.suspended += 1;
    else if (u.verification_status === "approved") row.approved += 1;
    else if (u.verification_status === "rejected") row.rejected += 1;
    else row.pending += 1;
  }
  return Array.from(rows.values());
}
