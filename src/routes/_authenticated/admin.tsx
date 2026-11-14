import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { BarChart3, Building2, LayoutDashboard, MapPinned, Package, Settings, Tags, Users } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: (context as { userId: string }).userId, _role: "admin" });
    if (!data) throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [{ title: "Dashboard Admin — UMKM BANYUWANGI" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const ITEMS = [
  { to: "/admin", label: "Statistik", icon: LayoutDashboard, exact: true },
  { to: "/admin/umkm", label: "Data UMKM", icon: Building2 },
  { to: "/admin/produk", label: "Produk", icon: Package },
  { to: "/admin/kategori", label: "Kategori", icon: Tags },
  { to: "/admin/kecamatan", label: "Kecamatan", icon: MapPinned },
  { to: "/admin/laporan", label: "Laporan", icon: BarChart3 },
  { to: "/admin/pengguna", label: "Pengguna", icon: Users },
  { to: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
];

function AdminLayout() {
  return (
    <DashboardShell title="Panel Admin" subtitle="UMKM Banyuwangi" items={ITEMS}>
      <Outlet />
    </DashboardShell>
  );
}
