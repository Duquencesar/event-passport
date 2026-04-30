import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Users,
  Upload,
  ClipboardList,
  CalendarDays,
  LogOut,
  Menu,
  Settings,
  BarChart2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatBrasiliaLongDate } from "@/lib/brasilia-time";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { to: "/eventos" as const, label: "Eventos", icon: CalendarDays },
  { to: "/checkin" as const, label: "Check-in", icon: ClipboardList },
  { to: "/pessoas" as const, label: "Inscritos", icon: Users },
  { to: "/dashboard" as const, label: "Dashboard", icon: BarChart2 },
  { to: "/import" as const, label: "Importar", icon: Upload },
  { to: "/configuracoes" as const, label: "Config", icon: Settings },
];

const LIME = "#84E400";
const FGM  = "oklch(0.38 0.04 255)";

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

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex" style={{ background: "#05080f" }}>
      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col shrink-0"
        style={{
          width: 220,
          background: "rgba(5,8,15,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(238,242,255,0.055)",
          position: "sticky",
          top: 0,
          height: "100vh",
          padding: "20px 12px",
          gap: 4,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Logo */}
        <div style={{ padding: "4px 10px 20px" }}>
          <img
            src="/brand/ipe-city-logo.png"
            alt="Ipê City"
            style={{ height: 16, opacity: 0.88 }}
          />
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 9,
                  border: "none",
                  cursor: "pointer",
                  background: active ? "rgba(132,228,0,0.1)" : "transparent",
                  color: active ? LIME : FGM,
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  fontFamily: "var(--font-body)",
                  transition: "all 0.18s",
                  textAlign: "left",
                  width: "100%",
                  letterSpacing: "0.01em",
                  textDecoration: "none",
                  position: "relative",
                }}
              >
                <Icon
                  style={{
                    width: 15,
                    height: 15,
                    opacity: active ? 1 : 0.55,
                    flexShrink: 0,
                  }}
                />
                {label}
                {active && (
                  <span
                    style={{
                      marginLeft: "auto",
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: LIME,
                      boxShadow: `0 0 8px ${LIME}`,
                      animation: "pulse-dot 2s ease-in-out infinite",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid rgba(238,242,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: LIME,
                boxShadow: `0 0 8px ${LIME}`,
                animation: "pulse-dot 2s ease-in-out infinite",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 8,
                color: LIME,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Sistema Ativo
            </span>
          </div>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 8,
              color: FGM,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            {today}
          </p>
          <button
            onClick={logout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "8px 10px",
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: FGM,
              fontSize: 12,
              fontFamily: "var(--font-body)",
              cursor: "pointer",
              transition: "all 0.18s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(238,242,255,0.05)";
              (e.currentTarget as HTMLButtonElement).style.color = "#eef2ff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = FGM;
            }}
          >
            <LogOut style={{ width: 13, height: 13, opacity: 0.6 }} />
            Sair
          </button>
        </div>
      </aside>

      {/* ── Mobile topbar ──────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 h-14"
        style={{
          background: "rgba(5,8,15,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(238,242,255,0.055)",
        }}
      >
        <img
          src="/brand/ipe-city-logo.png"
          alt="Ipê City"
          style={{ height: 16, opacity: 0.88 }}
        />
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <button
              className="text-muted-foreground p-2 rounded-lg"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[260px] p-0 flex flex-col border-0"
            style={{
              background: "rgba(5,8,15,0.96)",
              backdropFilter: "blur(24px)",
              borderLeft: "1px solid rgba(238,242,255,0.055)",
            }}
          >
            <div style={{ padding: "20px 16px 8px" }}>
              <img
                src="/brand/ipe-city-logo.png"
                alt="Ipê City"
                style={{ height: 16, opacity: 0.88 }}
              />
            </div>
            <nav className="flex flex-col gap-1 px-3 flex-1">
              {navItems.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 9,
                      background: active ? "rgba(132,228,0,0.1)" : "transparent",
                      color: active ? LIME : FGM,
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      fontFamily: "var(--font-body)",
                      textDecoration: "none",
                    }}
                  >
                    <Icon style={{ width: 15, height: 15, opacity: active ? 1 : 0.55 }} />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(238,242,255,0.05)" }}>
              <button
                onClick={() => { setDrawerOpen(false); logout(); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: "transparent",
                  color: FGM,
                  fontSize: 13,
                  fontFamily: "var(--font-body)",
                  cursor: "pointer",
                }}
              >
                <LogOut style={{ width: 14, height: 14 }} />
                Sair
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ── Main content ──────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {/* Mobile top padding */}
        <div className="md:hidden h-14" />
        <div className="px-6 py-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
