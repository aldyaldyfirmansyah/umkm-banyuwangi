import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SearchBar({ initial = "", className, large }: { initial?: string; className?: string; large?: boolean }) {
  const [q, setQ] = useState(initial);
  const navigate = useNavigate();
  function submit(e: FormEvent) {
    e.preventDefault();
    navigate({ to: "/katalog", search: { q: q.trim() || undefined } });
  }
  return (
    <form
      onSubmit={submit}
      role="search"
      className={cn(
        "flex items-center gap-2 rounded-2xl border bg-card p-1.5 shadow-soft focus-within:border-primary",
        className,
      )}
    >
      <Search className="ml-3 size-5 shrink-0 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari batik, kopi, kerajinan..."
        aria-label="Cari produk"
        maxLength={100}
        className={cn("min-w-0 flex-1 bg-transparent px-1 outline-none placeholder:text-muted-foreground", large ? "h-11 text-base" : "h-9 text-sm")}
      />
      <Button type="submit" size={large ? "lg" : "default"}>
        Cari
      </Button>
    </form>
  );
}
