import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Skull } from "lucide-react";
import { updatePassword } from "@/services/authService";
import { useAuth } from "@/features/auth/AuthProvider";
import { useI18n } from "@/i18n";
import { validatePassword } from "@/utils/validation";
import Loading from "@/components/animations/Loading";

export default function ResetPasswordPage() {
  const { session, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = window.setTimeout(() => navigate("/login", { replace: true }), 1500);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [success, navigate]);

  if (loading) return <Loading />;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const validation = validatePassword(password);
    if (!validation.valid) {
      setError(validation.message ?? t("auth.invalidPassword"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.passwordsMismatch"));
      return;
    }

    setBusy(true);
    try {
      const { error: updateError } = await updatePassword(password);
      if (updateError) throw updateError;
      setSuccess(true);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : t("auth.resetError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-ritual-black px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="mb-6 flex items-center gap-2">
          <Skull className="text-ritual-accent" aria-hidden="true" />
          <span className="font-display text-lg font-bold uppercase tracking-widest">
            RitualKiller
          </span>
        </div>

        <h1 className="mb-2 font-display text-2xl font-bold">{t("auth.resetTitle")}</h1>
        <p className="mb-4 text-sm text-zinc-400">
          {session ? t("auth.resetIntro") : t("auth.resetInvalidLink")}
        </p>

        {error && (
          <p role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </p>
        )}

        {success ? (
          <p role="status" className="rounded-lg border border-ritual-accent/30 bg-ritual-accent/10 p-3 text-sm text-ritual-accent">
            {t("auth.resetSuccess")}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
              autoComplete="new-password"
              placeholder={t("auth.newPassword")}
              className="min-h-11 w-full rounded-lg border border-zinc-700 bg-black px-4 text-white outline-none focus:border-ritual-accent"
            />
            <input
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              minLength={6}
              required
              autoComplete="new-password"
              placeholder={t("auth.confirmPassword")}
              className="min-h-11 w-full rounded-lg border border-zinc-700 bg-black px-4 text-white outline-none focus:border-ritual-accent"
            />
            <button
              type="submit"
              disabled={busy || !session}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-ritual-accent font-bold text-black hover:bg-emerald-400 disabled:opacity-50"
            >
              {busy ? t("common.saving") : t("auth.updatePassword")}
            </button>
          </form>
        )}

        <Link to="/login" className="mt-4 block text-center text-xs text-zinc-400 hover:text-ritual-accent">
          {t("auth.backToLogin")}
        </Link>
      </div>
    </main>
  );
}
