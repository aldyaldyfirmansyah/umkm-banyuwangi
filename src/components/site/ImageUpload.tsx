import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadImage, validateImage } from "@/lib/storage";
import { cn } from "@/lib/utils";

export function ImageUpload({
  value,
  onChange,
  folder,
  label = "Unggah foto",
  className,
  square = true,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: "products" | "logos" | "banners";
  label?: string;
  className?: string;
  square?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const problem = validateImage(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setBusy(true);
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
      toast.success("Foto berhasil diunggah");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengunggah foto");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {value ? (
        <div className={cn("relative overflow-hidden rounded-xl border bg-cream", square ? "aspect-square" : "aspect-[16/7]")}>
          <img src={value} alt="Pratinjau" className="size-full object-cover" />
          <div className="absolute right-2 top-2 flex gap-1">
            <Button type="button" size="sm" variant="secondary" onClick={() => inputRef.current?.click()} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : "Ganti"}
            </Button>
            <Button type="button" size="icon" variant="secondary" className="size-8" onClick={() => onChange(null)} aria-label="Hapus foto">
              <X />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-muted/40 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary",
            square ? "aspect-square" : "aspect-[16/7]",
          )}
        >
          {busy ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
          <span>{busy ? "Mengunggah..." : label}</span>
          <span className="text-xs">JPG, PNG, WEBP · maks. 5 MB</span>
        </button>
      )}
    </div>
  );
}
