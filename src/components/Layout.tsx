import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Users, Upload, ClipboardList, CalendarDays, LogOut, Menu, X, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatBrasiliaLongDate } from "@/lib/brasilia-time";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { to: "/eventos" as const, label: "Eventos", icon: CalendarDays },
  { to: "/checkin" as const, label: "Check-in", icon: ClipboardList },
  { to: "/pessoas" as const, label: "Inscritos", icon: Users },
  { to: "/import" as const, label: "Importar", icon: Upload },
  { to: "/configuracoes" as const, label: "Config", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading, logout } = useAuth();
  const [today, setToday] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setToday(formatBrasiliaLongDate(new Date()));
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [loading, isAuthenticated, navigate]);

  // Close drawer when route changes
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen text-foreground">
      <header className="glass-strong sticky top-0 z-50 border-b border-border/30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo — always visible */}
          <div className="flex items-center gap-8">
            <h1 className="text-lg font-semibold tracking-tight shrink-0">
              <span className="text-primary" style={{ fontFamily: "var(--font-display)" }}>Ipê</span>{" "}
              <span className="text-foreground/80 tracking-tight">Village</span>
              <span className="text-muted-foreground text-sm font-normal ml-2 hidden sm:inline">
                Check-In
              </span>
            </h1>

            {/* Desktop nav — hidden on mobile */}
            <nav className="hidden md:flex items-center gap-0.5">
              {navItems.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? "bg-primary/10 text-primary relative after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:rounded-full after:bg-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 md:gap-4">
            <span className="text-sm text-muted-foreground capitalize font-medium hidden lg:block">
              {today}
            </span>
            <button
              onClick={logout}
              className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-xl hover:bg-accent/60 hidden md:flex"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Hamburger button — visible only on mobile */}
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger asChild>
                <button
                  className="md:hidden text-muted-foreground hover:text-foreground transition-colors p-2 rounded-xl hover:bg-accent/60"
                  aria-label="Abrir menu"
                >
                  {drawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0 flex flex-col">
                {/* Drawer header */}
                <div className="px-6 py-5 border-b border-border/30 flex items-center justify-between">
                  <h2 className="font-semibold">
                    <span className="text-primary" style={{ fontFamily: "var(--font-display)" }}>Ipê</span>{" "}
                    <span className="text-foreground/80 tracking-tight">Village</span>
                  </h2>
                  <span className="text-xs text-muted-foreground capitalize">{today}</span>
                </div>

                {/* Drawer nav */}
                <nav className="flex flex-col gap-1 p-4 flex-1">
                  {navItems.map(({ to, label, icon: Icon }) => {
                    const active = location.pathname === to;
                    return (
                      <Link
                        key={to}
                        to={to}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          active
                            ? "bg-primary/10 text-primary relative after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:rounded-full after:bg-[#84E400]"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {label}
                      </Link>
                    );
                  })}
                </nav>

                {/* Drawer footer */}
                <div className="p-4 border-t border-border/30">
                  <button
                    onClick={() => { setDrawerOpen(false); logout(); }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all duration-200"
                  >
                    <LogOut className="w-5 h-5" />
                    Sair
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
