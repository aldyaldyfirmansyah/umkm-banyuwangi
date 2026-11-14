import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";

export type MapMarker = { id: string; lat: number; lng: number; popupHtml?: string };

export const BANYUWANGI_CENTER: [number, number] = [-8.32, 114.2];

const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40"><path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 25 15 25s15-14 15-25C30 6.7 23.3 0 15 0z" fill="var(--primary)"/><circle cx="15" cy="15" r="6" fill="var(--gold)"/></svg>`;

/** Browser-only Leaflet map. Import this module only via React.lazy behind <ClientOnly>. */
export default function LeafletMap({
  markers,
  center = BANYUWANGI_CENTER,
  zoom = 10,
  className,
  onMapClick,
  fitToMarkers = true,
}: {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  onMapClick?: (lat: number, lng: number) => void;
  fitToMarkers?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const layerRef = useRef<Leaflet.LayerGroup | null>(null);
  const LRef = useRef<typeof Leaflet | null>(null);
  const clickRef = useRef(onMapClick);
  clickRef.current = onMapClick;

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      const L = (mod as unknown as { default?: typeof Leaflet }).default ?? (mod as unknown as typeof Leaflet);
      if (cancelled || !ref.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(ref.current, { scrollWheelZoom: true }).setView(center, zoom);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      map.on("click", (e: Leaflet.LeafletMouseEvent) => clickRef.current?.(e.latlng.lat, e.latlng.lng));
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      renderMarkers();
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function renderMarkers() {
    const L = LRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer) return;
    layer.clearLayers();
    const icon = L.divIcon({ html: PIN_SVG, className: "", iconSize: [30, 40], iconAnchor: [15, 40], popupAnchor: [0, -36] });
    for (const m of markers) {
      const marker = L.marker([m.lat, m.lng], { icon });
      if (m.popupHtml) marker.bindPopup(m.popupHtml);
      marker.addTo(layer);
    }
    if (fitToMarkers && markers.length > 1) {
      map.fitBounds(L.latLngBounds(markers.map((m) => [m.lat, m.lng])), { padding: [40, 40], maxZoom: 14 });
    } else if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], Math.max(map.getZoom(), 14));
    } else {
      map.setView(center, zoom);
    }
  }

  useEffect(() => {
    renderMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, center[0], center[1], zoom]);

  return <div ref={ref} className={className} role="application" aria-label="Peta lokasi UMKM" />;
}
