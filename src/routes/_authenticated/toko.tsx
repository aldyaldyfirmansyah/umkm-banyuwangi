import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AlertTriangle, BadgeCheck, Clock, LayoutDashboard, Package, Settings, Store, XCircle } from "lucide-react";
import { DashboardShell, LoadingBlock, PageTitle } from "@/components/dashboard/DashboardShell";
import { StoreForm } from "@/components/dashboard/StoreForm";
import { useMyUmkm } from "@/hooks/use-my-umkm";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/toko")({
  head: () => ({ meta: [{ title: "Dashboard Toko — UMKM BANYUWANGI" }, { name: "robots", content: "noindex" }] }),
  component: TokoLayout,
});

const ITEMS = [
  { to: "/toko", label: "Ringkasan", icon: LayoutDashboard, exact: true },
  { to: "/toko/produk", label: "Produk", icon: Package },
  { to: "/toko/profil", label: "Profil UMKM", icon: Store },
  { to: "/toko/pengaturan", label: "Pengaturan Toko", icon: Settings },
];

function StatusNotice({ status, reason, suspended }: { status: string; reason: string | null; suspended: boolean }) {
  if (suspended)
    return (
      <div className="mb-6 flex gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <AlertTriangle className="size-5 shrink-0 text-destructive" />
        <div><p className="font-semibold text-destructive">Toko dinonaktifkan oleh admin</p><p className="text-muted-foreground">Toko dan produk Anda tidak tampil di publik. Hubungi admin UMKM BANYUWANGI untuk informasi lebih lanjut.</p></div>
      </div>
    );
  if (status === "pending")
    return (
      <div className="mb-6 flex gap-3 rounded-2xl border border-warning/50 bg-warning/15 p-4 text-sm">
        <Clock className="size-5 shrink-0 text-warning-foreground" />
        <div><p className="font-semibold text-warning-foreground">Menunggu verifikasi admin</p><p className="text-muted-foreground">Anda sudah bisa menambahkan produk. Toko akan tampil di katalog setelah diverifikasi.</p></div>
      </div>
    );
  if (status === "rejected")
    return (
      <div className="mb-6 flex gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <XCircle className="size-5 shrink-0 text-destructive" />
        <div><p className="font-semibold text-destructive">Pendaftaran UMKM ditolak</p><p className="text-muted-foreground">{reason ? `Alasan: ${reason}. ` : ""}Perbarui profil Anda lalu ajukan ulang dari menu Pengaturan Toko.</p></div>
      </div>
    );
  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary-soft/60 p-4 text-sm">
      <BadgeCheck className="size-5 shrink-0 text-primary" />
      <p><span className="font-semibold text-primary-deep">Toko terverifikasi.</span> <span className="text-muted-foreground">Produk aktif Anda tampil di katalog publik.</span></p>
    </div>
  );
}

function TokoLayout() {
  const { data: store, isLoading } = useMyUmkm();
  const { user } = useAuth();

  if (isLoading) return <div className="container-page py-10"><LoadingBlock /></div>;

  if (!store) {
    return (
      <div className="container-page max-w-4xl py-10">
        <PageTitle title="Daftarkan UMKM Anda" description="Lengkapi profil usaha. Admin akan memverifikasi sebelum toko Anda tampil di katalog." />
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <StoreForm
            defaults={{ owner_name: (user?.user_metadata?.full_name as string) ?? "", whatsapp: (user?.user_metadata?.phone as string) ?? "" }}
            submitLabel="Daftarkan UMKM"
          />
        </div>
      </div>
    );
  }

  return (
    <DashboardShell
      title={store.business_name}
      subtitle="Dashboard UMKM"
      items={ITEMS}
      banner={<StatusNotice status={store.verification_status} reason={store.rejection_reason} suspended={store.is_suspended} />}
    >
      <Outlet />
    </DashboardShell>
  );
}
