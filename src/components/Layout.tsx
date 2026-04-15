import { Link, useLocation } from "@tanstack/react-router";
import { Users, Upload, BarChart3 } from "lucide-react";

const navItems = [
  { to: "/" as const, label: "Check-in", icon: Users },
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-primary">Ipê</span> Village
              <span className="text-muted-foreground text-sm font-normal ml-2">Check-In</span>
            </h1>
            <nav className="flex items-center gap-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    location.pathname === to
                      ? "bg-primary/15 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <span className="text-sm text-muted-foreground capitalize">{today}</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
