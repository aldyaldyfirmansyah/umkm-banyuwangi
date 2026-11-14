import { createFileRoute } from "@tanstack/react-router";
import { LoadingBlock, PageTitle } from "@/components/dashboard/DashboardShell";
import { StoreForm } from "@/components/dashboard/StoreForm";
import { useMyUmkm } from "@/hooks/use-my-umkm";

export const Route = createFileRoute("/_authenticated/toko/profil")({
  component: TokoProfil,
});

function TokoProfil() {
  const { data: store, isLoading } = useMyUmkm();
  if (isLoading || !store) return <LoadingBlock />;
  return (
    <>
      <PageTitle title="Profil UMKM" description="Informasi ini tampil di halaman profil dan direktori UMKM." />
      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <StoreForm key={store.updated_at} store={store} />
      </div>
    </>
  );
}
