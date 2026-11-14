import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Building2, Clock, MapPin, Package, Tags, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingBlock, PageTitle, StatCard } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAdminDistricts, useAdminUmkm } from "@/hooks/use-admin-data";
import { buildDistrictReport } from "@/lib/district-report";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const { data: umkm } = useAdminUmkm();
  const { data: districts } = useAdminDistricts();
  const { data: counts } = useQuery({
    queryKey: ["admin-counts"],
    queryFn: async () => {
      const [p, c, u, pp] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("moderation_status", "pending"),
      ]);
      return { products: p.count ?? 0, categories: c.count ?? 0, users: u.count ?? 0, pendingProducts: pp.count ?? 0 };
    },
  });

  if (!umkm || !districts || !counts) return <LoadingBlock />;
  const pending = umkm.filter((u) => u.verification_status === "pending");
  const report = buildDistrictReport(districts, umkm);
  const covered = report.filter((r) => r.approved > 0).length;
  const chart = report.map((r) => ({ name: r.name, Terverifikasi: r.approved, Menunggu: r.pending }));

  return (
    <>
      <PageTitle title="Statistik Platform" description="Pantau perkembangan UMKM di setiap kecamatan Banyuwangi." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="UMKM terdaftar" value={umkm.length} icon={Building2} />
        <StatCard label="Menunggu verifikasi" value={pending.length} icon={Clock} tone="warning" />
        <StatCard label="Kecamatan terjangkau" value={`${covered}/${districts.length}`} icon={MapPin} tone="cream" />
        <StatCard label="Total produk" value={counts.products} icon={Package} hint={`${counts.pendingProducts} menunggu review`} />
        <StatCard label="Total kategori" value={counts.categories} icon={Tags} tone="cream" />
        <StatCard label="Total pengguna" value={counts.users} icon={Users} />
      </div>

      <div className="mt-8 rounded-2xl border bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-sans font-semibold">Persebaran UMKM per kecamatan</h3>
          <Button asChild variant="soft" size="sm"><Link to="/admin/laporan">Lihat laporan</Link></Button>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
              <Bar dataKey="Terverifikasi" stackId="a" fill="var(--primary)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Menunggu" stackId="a" fill="var(--gold)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="font-sans font-semibold">Pendaftaran menunggu verifikasi</h3>
          <Button asChild variant="soft" size="sm"><Link to="/admin/umkm" search={{ status: "pending" }}>Kelola</Link></Button>
        </div>
        {pending.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">Tidak ada pendaftaran baru.</p>
        ) : (
          <ul className="divide-y">
            {pending.slice(0, 6).map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{u.business_name}</p>
                  <p className="text-xs text-muted-foreground">{u.owner_name} · Kec. {u.district?.name ?? "-"} · {formatDate(u.created_at)}</p>
                </div>
                <Button asChild size="sm" variant="outline"><Link to="/admin/umkm" search={{ status: "pending" }}>Tinjau</Link></Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
