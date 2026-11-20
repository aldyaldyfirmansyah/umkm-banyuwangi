import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { isFavorite, recordAnalytics, subscribeStorage, toggleFavorite, type FavoriteKind } from "@/lib/local-store";
import { toast } from "sonner";

type Props = {
  id: string;
  kind: FavoriteKind;
  name: string;
  href: string;
  image?: string | null;
  compact?: boolean;
};

export function FavoriteButton({ id, kind, name, href, image, compact = false }: Props) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const sync = () => setActive(isFavorite(id, kind));
    sync();
    return subscribeStorage(sync);
  }, [id, kind]);

  return (
    <Button
      type="button"
      variant={compact ? "outline" : "soft"}
      size={compact ? "icon" : "sm"}
      aria-label={active ? `Hapus ${name} dari favorit` : `Simpan ${name} ke favorit`}
      aria-pressed={active}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const nextActive = toggleFavorite({ id, kind, name, href, ...(image !== undefined ? { image } : {}) });
        recordAnalytics("favorite_toggle", id);
        setActive(nextActive);
        toast.success(active ? "Dihapus dari favorit" : "Ditambahkan ke favorit");
      }}
      className={active ? "text-destructive" : undefined}
    >
      <Heart className={active ? "fill-current" : undefined} />
      {!compact && (active ? "Tersimpan" : "Simpan")}
    </Button>
  );
}
