import { BadgeCheck, FileCheck2, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function TrustBadges({ verified, compact = false }: { verified: boolean; compact?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {verified && <Badge variant="soft"><BadgeCheck className="mr-1 size-3" /> Terverifikasi</Badge>}
      <Badge variant="outline"><FileCheck2 className="mr-1 size-3" /> NIB</Badge>
      {!compact && <Badge variant="outline"><ShieldCheck className="mr-1 size-3" /> Halal</Badge>}
      {!compact && <Badge variant="outline"><Sparkles className="mr-1 size-3" /> Kurasi Banyuwangi</Badge>}
    </div>
  );
}
