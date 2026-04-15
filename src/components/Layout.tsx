import { Link, useLocation } from "@tanstack/react-router";
import { Users, Upload, BarChart3, ClipboardList } from "lucide-react";

const navItems = [
  { to: "/" as const, label: "Check-in", icon: ClipboardList },
  { to: "/pessoas" as const, label: "Inscritos", icon: Users },
  { to: "/import" as const, label: "Importar", icon: Upload },
  { to: "/dashboard" as const, label: "Dashboard", icon: BarChart3 },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen text-foreground">
      <header className="glass-strong sticky top-0 z-50 border-b border-border/30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-lg font-semibold tracking-tight">
              <span className="text-primary font-bold">Ipê</span>{" "}
              <span className="text-foreground/80">Village</span>
              <span className="text-muted-foreground text-sm font-normal ml-2 hidden sm:inline">
                Check-In
              </span>
            </h1>
            <nav className="flex items-center gap-0.5">
              {navItems.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? "bg-primary/12 text-primary shadow-sm"
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
          <span className="text-sm text-muted-foreground capitalize font-medium">
            {today}
          </span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
