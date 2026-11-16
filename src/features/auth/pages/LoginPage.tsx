import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Skull } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import {
  requestPasswordReset,
  signInWithEmail,
  signUpWithEmail,
} from "@/services/authService";
import { useI18n, type TranslationKey } from "@/i18n";
import { errorMessage } from "@/lib/errors";
import {
  PASSWORD_MIN_LENGTH,
  validateEmail,
  validatePassword,
  validateUsername,
} from "@/utils/validation";
import Loading from "@/components/animations/Loading";
import { PasswordField, TextField } from "@/components/ui/FormField";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

type Mode = "login" | "signup" | "reset";

interface LoginLocationState {
  /** Set by AuthCallbackPage when a confirmation/recovery link failed. */
  authError?: TranslationKey;
}

export default function LoginPage() {
  const { session, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const initialError = (location.state as LoginLocationState | null)?.authError;
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    initialError ? t(initialError) : null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;
  if (session) return <Navigate to="/app/dashboard" replace />;

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setMessage(null);
  };

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
        setError(t(usernameValidation.messageKey ?? "auth.invalidUsername"));
        return;
      }
    }

    if (mode !== "reset") {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        setError(t(passwordValidation.messageKey ?? "auth.invalidPassword"));
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
        const { data, error: signUpError } = await signUpWithEmail(
          email,
          password,
          username,
        );
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
      setError(errorMessage(authError, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-ritual-black px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>
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
            <p
              role="alert"
              className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
            >
              {error}
            </p>
          )}
          {message && (
            <p
              role="status"
              className="mb-4 rounded-lg border border-ritual-accent/30 bg-ritual-accent/10 p-3 text-sm text-ritual-accent"
            >
              {message}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            {mode === "signup" && (
              <TextField
                label={t("auth.usernameLabel")}
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                minLength={2}
                maxLength={30}
                required
                autoComplete="username"
              />
            )}

            <TextField
              label={t("auth.emailLabel")}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />

            {mode !== "reset" && (
              <PasswordField
                label={t("auth.passwordLabel")}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={PASSWORD_MIN_LENGTH}
                required
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                hint={mode === "signup" ? t("auth.passwordRequirements") : undefined}
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

          <div className="mt-4 flex flex-col items-center gap-1 text-sm text-zinc-400">
            {mode === "login" && (
              <button
                type="button"
                onClick={() => switchMode("reset")}
                className="min-h-11 hover:text-ritual-accent"
              >
                {t("auth.forgot")}
              </button>
            )}
            <button
              type="button"
              onClick={() => switchMode(mode === "signup" ? "login" : "signup")}
              className="min-h-11 hover:text-ritual-accent"
            >
              {mode === "signup" ? t("auth.hasAccount") : t("auth.noAccount")}
            </button>
            {mode === "reset" && (
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="min-h-11 hover:text-ritual-accent"
              >
                {t("common.back")}
              </button>
            )}
          </div>
        </div>

        <Link
          to="/"
          className="mt-6 block min-h-11 text-center text-sm text-zinc-400 hover:text-ritual-accent"
        >
          {t("common.back")}
        </Link>
      </div>
    </main>
  );
}
