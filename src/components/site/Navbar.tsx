import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, LayoutDashboard, LogOut, Menu, MessageCircle, MoreHorizontal, ShieldCheck, Sparkles, Store, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { initials } from "@/lib/format";
import { getInquiries, subscribeStorage } from "@/lib/local-store";
import { Logo } from "./Logo";

const NAV = [
  { to: "/", label: "Beranda" },
  { to: "/katalog", label: "Katalog" },
  { to: "/kategori", label: "Kategori" },
  { to: "/umkm", label: "UMKM" },
  { to: "/koleksi", label: "Koleksi" },
] as const;

export function Navbar() {
  const { user, ready, isAdmin, isUmkm, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [inquiryCount, setInquiryCount] = useState(0);
  const navigate = useNavigate();
  const name = (user?.user_metadata?.["full_name"] as string) || user?.email || "";
  useEffect(() => {
    const sync = () => setInquiryCount(getInquiries().reduce((total, item) => total + item.qty, 0));
    sync();
    return subscribeStorage(sync);
  }, []);
  return (
    <header className="sticky top-3 z-40 px-3 sm:px-4">
      <div className="container-page relative flex h-14 items-center justify-between gap-2 rounded-2xl border border-gold/30 bg-background/90 px-3 shadow-lift backdrop-blur-xl sm:h-16 sm:gap-4 sm:px-4 before:absolute before:inset-x-8 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-gold before:to-transparent">
        <Logo />
        <nav className="hidden items-center gap-1 rounded-xl border border-border/70 bg-muted/40 p-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              onClick={undefined}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:bg-card hover:text-primary data-[status=active]:bg-card data-[status=active]:text-primary-deep data-[status=active]:shadow-soft xl:px-3 xl:text-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-1 lg:flex">
          <Link to="/pertanyaan" className="relative grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary" aria-label="Pertanyaan">
            <MessageCircle className="size-4" />
            {inquiryCount > 0 && <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground">{inquiryCount > 9 ? "9+" : inquiryCount}</span>}
          </Link>
          <Link to="/favorit" className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary" aria-label="Favorit"><Heart className="size-4" /></Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-semibold" aria-label="Buka menu lainnya"><MoreHorizontal className="size-4" /> Lainnya</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate({ to: "/favorit" })}><Heart /> Favorit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: "/pertanyaan" })}><MessageCircle /> Pertanyaan</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: "/peta" })}><Store /> Peta UMKM</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: "/tentang" })}>Tentang</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: "/kontak" })}>Kontak</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          {ready && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-full border border-primary/20 bg-card py-1 pl-1 pr-3 text-sm font-medium shadow-soft transition-all hover:border-gold hover:shadow-lift"
                  aria-label="Menu akun"
                >
                  <span className="grid size-7 place-items-center rounded-full bg-brand-gradient text-xs text-primary-foreground">
                    {initials(name) || "U"}
                  </span>
                  <span className="hidden max-w-28 truncate sm:inline">{name.split(" ")[0]}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
                  <UserRound /> Akun Saya
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/toko" })}>
                  <Store /> {isUmkm ? "Dashboard Toko" : "Daftarkan UMKM"}
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                    <ShieldCheck /> Dashboard Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
                  <LogOut /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth" search={{ mode: "login" }}>
                  Masuk
                </Link>
              </Button>
              <Button asChild size="sm" className="hidden bg-brand-gradient shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift sm:inline-flex">
                <Link to="/auth" search={{ mode: "register" }}>
                  Daftar UMKM
                </Link>
              </Button>
            </>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="size-9 lg:hidden" aria-label="Buka menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(86vw,20rem)]">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-2 flex flex-col gap-1 px-4">
                {NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    activeOptions={{ exact: item.to === "/" }}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted data-[status=active]:bg-primary-soft data-[status=active]:text-primary-deep"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="my-3 h-px bg-border" />
                <div className="grid grid-cols-2 gap-1">
                  <Link to="/favorit" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm hover:bg-muted">Favorit</Link>
                  <Link to="/pertanyaan" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm hover:bg-muted">Pertanyaan</Link>
                  <Link to="/peta" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm hover:bg-muted">Peta UMKM</Link>
                  <Link to="/kontak" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm hover:bg-muted">Kontak</Link>
                </div>
                {user ? (
                  <>
                    <Link to="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm hover:bg-muted">
                      <LayoutDashboard className="size-4" /> Akun Saya
                    </Link>
                    <Link to="/toko" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm hover:bg-muted">
                      <Store className="size-4" /> {isUmkm ? "Dashboard Toko" : "Daftarkan UMKM"}
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm hover:bg-muted">
                        <ShieldCheck className="size-4" /> Dashboard Admin
                      </Link>
                    )}
                    <Button variant="outline" className="mt-2" onClick={() => { setOpen(false); signOut(); }}>
                      <LogOut /> Keluar
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button asChild variant="outline">
                      <Link to="/auth" search={{ mode: "login" }} onClick={() => setOpen(false)}>Masuk</Link>
                    </Button>
                    <Button asChild>
                      <Link to="/auth" search={{ mode: "register" }} onClick={() => setOpen(false)}>Daftar UMKM</Link>
                    </Button>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
