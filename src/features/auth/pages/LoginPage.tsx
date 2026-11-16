import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Skull } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { requestPasswordReset, signInWithEmail, signUpWithEmail } from "@/services/authService";
import { useI18n } from "@/i18n";
import { validateEmail, validatePassword, validateUsername } from "@/utils/validation";
import Loading from "@/components/animations/Loading";

type Mode = "login" | "signup" | "reset";

export default function LoginPage() {
  const { session, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;
  if (session) return <Navigate to="/app/dashboard" replace />;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!validateEmail(email)) {
      setError(t("auth.invalidEmail"));
      return;
    }

    if (mode === "signup") {
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.valid) {
        setError(usernameValidation.messageKey ? t(usernameValidation.messageKey) : t("auth.invalidUsername"));
        return;
      }
    }

    if (mode !== "reset") {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        setError(passwordValidation.messageKey ? t(passwordValidation.messageKey) : t("auth.invalidPassword"));
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === "reset") {
        const { error: resetError } = await requestPasswordReset(email);
        if (resetError) throw resetError;
        setMessage(t("auth.resetSent"));
      } else if (mode === "signup") {
        const { data, error: signUpError } = await signUpWithEmail(email, password, username);
        if (signUpError) throw signUpError;
        if (data.session) {
          navigate("/app/dashboard", { replace: true });
        } else {
          setMessage(t("auth.signupConfirm"));
        }
      } else {
        const { error: signInError } = await signInWithEmail(email, password);
        if (signInError) throw signInError;
        navigate("/app/dashboard", { replace: true });
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : t("auth.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-ritual-black px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Skull size={40} className="text-ritual-accent" aria-hidden="true" />
          <h1 className="font-display text-2xl font-bold uppercase tracking-widest">
            RitualKiller
          </h1>
          <p className="text-sm text-zinc-400">
            {mode === "signup"
              ? t("auth.createAccount")
              : mode === "reset"
                ? t("auth.forgot")
                : t("auth.welcomeBack")}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
          {error && (
            <p role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="mb-4 rounded-lg border border-ritual-accent/30 bg-ritual-accent/10 p-3 text-sm text-ritual-accent">
              {message}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                minLength={2}
                maxLength={30}
                required
                autoComplete="username"
                placeholder={t("auth.username")}
                className="min-h-11 w-full rounded-lg border border-zinc-700 bg-black px-4 text-white outline-none focus:border-ritual-accent"
              />
            )}

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              placeholder={t("auth.email")}
              className="min-h-11 w-full rounded-lg border border-zinc-700 bg-black px-4 text-white outline-none focus:border-ritual-accent"
            />

            {mode !== "reset" && (
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder={t("auth.password")}
                className="min-h-11 w-full rounded-lg border border-zinc-700 bg-black px-4 text-white outline-none focus:border-ritual-accent"
              />
            )}

            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-ritual-accent font-bold text-black transition-colors hover:bg-emerald-400 disabled:opacity-50"
            >
              {busy
                ? t("common.loading")
                : mode === "signup"
                  ? t("auth.signup")
                  : mode === "reset"
                    ? t("auth.sendLink")
                    : t("auth.login")}
            </button>
          </form>

          <div className="mt-4 flex flex-col items-center gap-2 text-xs text-zinc-400">
            {mode === "login" && (
              <button type="button" onClick={() => setMode("reset")} className="hover:text-ritual-accent">
                {t("auth.forgot")}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signup" ? "login" : "signup");
                setError(null);
                setMessage(null);
              }}
              className="hover:text-ritual-accent"
            >
              {mode === "signup" ? t("auth.hasAccount") : t("auth.noAccount")}
            </button>
            {mode === "reset" && (
              <button type="button" onClick={() => setMode("login")} className="hover:text-ritual-accent">
                {t("common.back")}
              </button>
            )}
          </div>
        </div>

        <Link to="/" className="mt-6 block text-center text-xs text-zinc-400 hover:text-ritual-accent">
          {t("common.back")}
        </Link>
      </div>
    </main>
  );
}
