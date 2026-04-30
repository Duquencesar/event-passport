import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionBadge } from "@/components/SectionBadge";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Login — Ipê Village" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate({ to: "/" });
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message || "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-background flex items-center justify-center overflow-hidden px-6 py-8">
      {/* Bottom-right radial glow */}
      <div
        className="absolute bottom-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full bg-[#29B6F6]/[0.04] blur-[80px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-5xl grid md:grid-cols-[55fr_45fr] gap-12 items-center">
        {/* Left column — hero */}
        <div className="hidden md:flex flex-col justify-center gap-8 relative">
          {/* Radial glow accent */}
          <div
            className="absolute top-[-150px] left-[-150px] w-[400px] h-[400px] rounded-full bg-primary/[0.06] blur-[60px] pointer-events-none"
            aria-hidden="true"
          />

          <SectionBadge
            label="ACESSO"
            pulse={false}
            className="fade-up self-start"
            style={{ animationDelay: "0.1s" }}
          />

          <h1
            className="text-[3rem] sm:text-[3.5rem] md:text-[5.25rem] leading-[1.05] tracking-[-0.02em] fade-up"
            style={{ fontFamily: "var(--font-display)", animationDelay: "0.2s" }}
          >
            Bem-vindo ao{" "}
            <span className="gradient-text">Ipê Village</span>
          </h1>

          <p
            className="text-base md:text-lg text-muted-foreground max-w-sm fade-up"
            style={{ animationDelay: "0.3s" }}
          >
            Gerencie check-ins com velocidade e elegância.
          </p>

          {/* Animated graphic */}
          <div
            className="relative flex items-center justify-center fade-up"
            style={{ animationDelay: "0.4s" }}
          >
            {/* Spinning dashed ring */}
            <div
              className="absolute w-72 h-72 rounded-full border-2 border-dashed border-primary/25 slow-spin dashed-ring"
              aria-hidden="true"
            />

            {/* 3x3 dot grid - top right */}
            <div
              className="absolute top-0 right-4 grid grid-cols-3 gap-2"
              aria-hidden="true"
            >
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/20" />
              ))}
            </div>

            {/* Float card 1 */}
            <div
              className="absolute top-4 left-4 glass-strong rounded-xl shadow-lg px-4 py-3 float-card-1 flex items-center gap-2"
              aria-hidden="true"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">Carlos Mendes</p>
                <p className="text-[10px] text-muted-foreground">Check-in registrado</p>
              </div>
            </div>

            {/* Float card 2 */}
            <div
              className="absolute bottom-4 right-4 glass-strong rounded-xl shadow-lg px-4 py-3 float-card-2 flex items-center gap-2"
              aria-hidden="true"
            >
              <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">47 presentes</p>
                <p className="text-[10px] text-muted-foreground">Evento Ativo</p>
              </div>
            </div>

            {/* Corner accent block */}
            <div
              className="absolute bottom-0 left-4 w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-[var(--shadow-accent)]"
              aria-hidden="true"
            />

            {/* Center spacer for the ring */}
            <div className="w-72 h-72" />
          </div>
        </div>

        {/* Right column — card */}
        <div className="w-full max-w-sm mx-auto">
          {/* Mobile-only header text */}
          <div className="md:hidden text-center mb-6">
            <SectionBadge label="ACESSO" pulse={false} />
            <h1
              className="mt-4 text-[2rem] leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Bem-vindo ao <span className="gradient-text">Ipê Village</span>
            </h1>
          </div>

          {/* Login card */}
          <form
            onSubmit={handleSubmit}
            className="glass-strong rounded-2xl p-8 space-y-5 border border-border shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
          >
            {error && (
              <div
                aria-live="polite"
                className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3 flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                E-mail ou senha incorretos. Tente novamente.
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="email">
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="h-12 rounded-xl"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 rounded-xl"
                autoComplete="current-password"
                required
              />
              <div className="flex justify-end mt-1">
                <a
                  href="mailto:admin@ipe.city?subject=Reset de senha"
                  className="text-xs text-primary hover:underline"
                >
                  Esqueceu a senha?
                </a>
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              aria-label="Entrar no sistema"
              className="w-full h-12 rounded-xl text-base font-medium"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Entrando...
                </span>
              ) : (
                "Entrar →"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
