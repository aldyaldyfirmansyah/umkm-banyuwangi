import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Crosshair, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LeafletMap = lazy(() => import("@/components/site/LeafletMap"));

export const BANYUWANGI_BOUNDS = { minLat: -8.8, maxLat: -7.8, minLng: 113.8, maxLng: 114.7 };

export function insideBanyuwangi(lat: number, lng: number) {
  return lat >= BANYUWANGI_BOUNDS.minLat && lat <= BANYUWANGI_BOUNDS.maxLat && lng >= BANYUWANGI_BOUNDS.minLng && lng <= BANYUWANGI_BOUNDS.maxLng;
}

export function LocationPicker({
  lat,
  lng,
  onChange,
  center,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number | null, lng: number | null) => void;
  center?: [number, number];
}) {
  function pick(a: number, b: number) {
    if (!insideBanyuwangi(a, b)) {
      toast.error("Lokasi harus berada di wilayah Kabupaten Banyuwangi");
      return;
    }
    onChange(Number(a.toFixed(6)), Number(b.toFixed(6)));
  }

  function useMyLocation() {
    if (!navigator.geolocation) return toast.error("Perangkat tidak mendukung GPS");
    navigator.geolocation.getCurrentPosition(
      (pos) => pick(pos.coords.latitude, pos.coords.longitude),
      () => toast.error("Gagal mengambil lokasi. Izinkan akses lokasi di browser."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const has = lat != null && lng != null;
  const mapCenter: [number, number] | undefined = has ? [lat!, lng!] : center;

  return (
    <div className="space-y-3">
      <div className="h-64 overflow-hidden rounded-xl border">
        <ClientOnly fallback={<div className="size-full bg-muted" />}>
          <Suspense fallback={<div className="size-full bg-muted" />}>
            <LeafletMap
              markers={has ? [{ id: "me", lat: lat!, lng: lng! }] : []}
              center={mapCenter}
              zoom={has ? 15 : center ? 13 : 10}
              fitToMarkers={false}
              onMapClick={pick}
              className="size-full cursor-crosshair"
            />
          </Suspense>
        </ClientOnly>
      </div>
      <p className="text-xs text-muted-foreground">Klik peta untuk menandai lokasi usaha, atau gunakan GPS perangkat Anda.</p>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="lp-lat">Latitude</Label>
          <Input id="lp-lat" inputMode="decimal" value={lat ?? ""} onChange={(e) => { const v = parseFloat(e.target.value); onChange(Number.isFinite(v) ? v : null, lng); }} placeholder="-8.2192" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lp-lng">Longitude</Label>
          <Input id="lp-lng" inputMode="decimal" value={lng ?? ""} onChange={(e) => { const v = parseFloat(e.target.value); onChange(lat, Number.isFinite(v) ? v : null); }} placeholder="114.3691" />
        </div>
        <Button type="button" variant="soft" onClick={useMyLocation}><Crosshair /> Lokasi saya</Button>
        {has && <Button type="button" variant="ghost" onClick={() => onChange(null, null)}><X /> Hapus</Button>}
      </div>
    </div>
  );
}
