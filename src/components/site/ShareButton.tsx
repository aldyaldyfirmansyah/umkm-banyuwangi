import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareButton({ title, text }: { title: string; text?: string }) {
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        /* dibatalkan pengguna */
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Tautan produk disalin");
    } catch {
      toast.error("Gagal menyalin tautan");
    }
  }
  return (
    <Button type="button" variant="outline" onClick={share}>
      <Share2 /> Bagikan
    </Button>
  );
}
