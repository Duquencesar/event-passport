import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
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
    <div
      className="grid-bg relative min-h-[100dvh] flex items-center justify-center overflow-hidden"
      style={{ background: "#05080f" }}
    >
      {/* Center lime radial glow */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div
          style={{
            width: "60vw",
            height: "60vw",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(132,228,0,0.05), transparent 65%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      {/* Form container */}
      <div className="relative z-10 w-full max-w-[360px] px-6">
        {/* Logo + subtitle */}
        <div className="mb-8 flex flex-col items-center text-center gap-5">
          <img
            src="/brand/ipe-city-logo.png"
            alt="Ipê City"
            style={{
              height: 22,
              opacity: 0.92,
              filter: "drop-shadow(0 0 12px rgba(132,228,0,0.35))",
            }}
          />
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "0.8125rem",
              fontWeight: 400,
              color: "oklch(0.38 0.04 255)",
              letterSpacing: "0.02em",
            }}
          >
            Sistema interno de check-in
          </p>
        </div>

        {/* Glass card */}
        <form
          onSubmit={handleSubmit}
          className="glass-strong rounded-[18px] flex flex-col gap-4"
          style={{
            padding: 28,
            boxShadow:
              "0 0 0 1px rgba(132,228,0,0.05), 0 32px 80px rgba(0,0,0,0.55)",
          }}
        >
          {/* Error */}
          {error && (
            <div
              aria-live="polite"
              style={{
                background: "rgba(224,87,87,0.08)",
                border: "1px solid rgba(224,87,87,0.2)",
                borderRadius: 9,
                padding: "9px 12px",
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "#E05757",
              }}
            >
              ⚠ E-mail ou senha incorretos. Tente novamente.
            </div>
          )}

          {/* E-mail */}
          <div className="flex flex-col gap-[5px]">
            <label
              htmlFor="email"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "oklch(0.38 0.04 255)",
              }}
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@ipe.city"
              autoComplete="email"
              required
              className="ipe-login-input"
              style={{
                height: 42,
                background: "rgba(5,8,15,0.85)",
                border: "1px solid rgba(238,242,255,0.07)",
                borderRadius: 10,
                padding: "0 14px",
                color: "#eef2ff",
                fontSize: 13,
                fontFamily: "var(--font-body)",
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                width: "100%",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(132,228,0,0.35)";
                e.target.style.boxShadow = "0 0 0 3px rgba(132,228,0,0.06)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(238,242,255,0.07)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Senha */}
          <div className="flex flex-col gap-[5px]">
            <label
              htmlFor="password"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "oklch(0.38 0.04 255)",
              }}
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              style={{
                height: 42,
                background: "rgba(5,8,15,0.85)",
                border: "1px solid rgba(238,242,255,0.07)",
                borderRadius: 10,
                padding: "0 14px",
                color: "#eef2ff",
                fontSize: 13,
                fontFamily: "var(--font-body)",
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                width: "100%",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(132,228,0,0.35)";
                e.target.style.boxShadow = "0 0 0 3px rgba(132,228,0,0.06)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(238,242,255,0.07)";
                e.target.style.boxShadow = "none";
              }}
            />
            <div className="flex justify-end mt-0.5">
              <a
                href="mailto:admin@ipe.city?subject=Reset de senha"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  color: "#84E400",
                  textDecoration: "none",
                  letterSpacing: "0.05em",
                }}
              >
                Esqueceu a senha?
              </a>
            </div>
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            aria-label="Entrar no sistema"
            style={{
              height: 44,
              background: loading ? "rgba(132,228,0,0.6)" : "#84E400",
              color: "#04080e",
              border: "none",
              borderRadius: 11,
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "var(--font-body)",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 6px 24px rgba(132,228,0,0.28)",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 4,
              width: "100%",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#96f200";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 8px 32px rgba(132,228,0,0.42)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#84E400";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 6px 24px rgba(132,228,0,0.28)";
              }
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: 13,
                    height: 13,
                    border: "2px solid rgba(4,8,14,0.3)",
                    borderTopColor: "#04080e",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "slow-spin 0.7s linear infinite",
                  }}
                />
                Entrando...
              </>
            ) : (
              "Acessar →"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
