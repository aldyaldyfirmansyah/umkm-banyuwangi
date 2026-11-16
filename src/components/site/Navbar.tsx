import { useState, type MouseEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu, ShieldCheck, Store, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
import { Logo } from "./Logo";

const NAV = [
  { to: "/", label: "Beranda" },
  { to: "/katalog", label: "Katalog Produk" },
  { to: "/kategori", label: "Kategori" },
  { to: "/umkm", label: "Direktori UMKM" },
  { to: "/peta", label: "Peta UMKM" },
  { to: "/tentang", label: "Tentang" },
  { to: "/kontak", label: "Kontak" },
] as const;

export function Navbar() {
  const { user, ready, isAdmin, isUmkm, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const name = (user?.user_metadata?.full_name as string) || user?.email || "";
  const openProtectedPage = (event: MouseEvent) => {
    if (ready && user) return;
    event.preventDefault();
    toast.error("Silakan masuk terlebih dahulu untuk mengakses halaman ini.");
    navigate({ to: "/auth", search: { mode: "login" } });
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              onClick={openProtectedPage}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary data-[status=active]:bg-primary-soft data-[status=active]:text-primary-deep"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {ready && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-3 text-sm font-medium shadow-soft transition-colors hover:border-primary"
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
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link to="/auth" search={{ mode: "register" }}>
                  Daftar UMKM
                </Link>
              </Button>
            </>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Buka menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-2 flex flex-col gap-1 px-4">
                {NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={(event) => { setOpen(false); if (item.to !== "/") openProtectedPage(event); }}
                    activeOptions={{ exact: item.to === "/" }}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted data-[status=active]:bg-primary-soft data-[status=active]:text-primary-deep"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="my-3 h-px bg-border" />
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
