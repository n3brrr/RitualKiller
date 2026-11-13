import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, KeyRound, LogOut, Save, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { useSettings } from "@/hooks/useSettings";
import { useRituals } from "@/hooks/useRituals";
import { useI18n } from "@/i18n";
import { profileService } from "@/services/profileService";
import { updatePassword } from "@/services/authService";
import { downloadFile, exportData, exportToCSV, importData } from "@/utils/exportImport";
import { validatePassword } from "@/utils/validation";
import Loading from "@/components/animations/Loading";

export default function SettingsPage() {
  const { user, refreshProfile, signOut } = useAuth();
  const { settings, isLoading, updateSettings, isUpdating } = useSettings();
  const { rituals, logs, importBackup } = useRituals();
  const { t, locale, setLocale } = useI18n();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("20:00");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Dependencias por campo para no pisar ediciones locales en cada refetch.
  useEffect(() => {
    if (!user) return;
    setUsername(user.username);
    setAvatarUrl(user.avatar_url ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.username, user?.avatar_url]);

  useEffect(() => {
    if (!settings) return;
    setNotificationsEnabled(settings.notificationsEnabled);
    setReminderTime(settings.reminderTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.userId, settings?.notificationsEnabled, settings?.reminderTime]);

  if (!user) return null;
  if (isLoading) return <Loading />;

  const flash = (text: string) => {
    setMessage(text);
    setError(null);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await profileService.updateProfile(user.id, {
        username,
        avatar_url: avatarUrl.trim() || null,
        locale,
      });
      await updateSettings({
        notificationsEnabled,
        reminderTime,
        locale,
      });
      await refreshProfile();
      flash(t("settings.updated"));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudieron guardar los ajustes");
    } finally {
      setBusy(false);
    }
  };

  const handleLanguage = async (next: "es" | "en") => {
    setLocale(next);
    try {
      await profileService.updateProfile(user.id, { locale: next });
      await updateSettings({ locale: next });
      await refreshProfile();
    } catch (languageError) {
      setError(languageError instanceof Error ? languageError.message : "No se pudo cambiar el idioma");
    }
  };

  const handleExportJson = () => {
    downloadFile(
      exportData(rituals, logs),
      `ritualkiller-backup-${new Date().toISOString().slice(0, 10)}.json`,
      "application/json",
    );
  };

  const handleExportCsv = () => {
    downloadFile(
      exportToCSV(rituals, logs),
      `ritualkiller-backup-${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv;charset=utf-8",
    );
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const text = await file.text();
      const backup = importData(text);
      if (!backup) throw new Error("El archivo no es un backup válido de RitualKiller");
      const result = await importBackup(backup);
      flash(`${t("settings.imported")} ${result.rituals} rituales, ${result.logs} registros.`);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "No se pudo importar");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const handlePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      setError(validation.message ?? "Contraseña inválida");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const { error: updateError } = await updatePassword(newPassword);
      if (updateError) throw updateError;
      setNewPassword("");
      flash("Contraseña actualizada.");
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : "No se pudo actualizar");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteData = async () => {
    if (
      !window.confirm(
        `${t("settings.deleteWarning")}\n\n¿Quieres borrar todos tus datos definitivamente?`,
      )
    ) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await profileService.deleteMyData();
      await signOut();
      navigate("/login", { replace: true });
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudieron borrar");
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{t("settings.title")}</h1>
        <p className="text-sm text-zinc-500">Perfil, preferencias y control de tus datos.</p>
      </header>

      {(message || error) && (
        <p
          role={error ? "alert" : "status"}
          className={`rounded-lg border p-3 text-sm ${
            error
              ? "border-red-500/30 bg-red-500/10 text-red-400"
              : "border-ritual-accent/30 bg-ritual-accent/10 text-ritual-accent"
          }`}
        >
          {error ?? message}
        </p>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-300">
            {t("settings.profile")}
          </h2>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {t("auth.username")}
              </span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                maxLength={30}
                required
                className="min-h-11 w-full rounded-lg border border-zinc-700 bg-black px-4 text-white outline-none focus:border-ritual-accent"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {t("settings.avatar")}
              </span>
              <input
                type="url"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                maxLength={500}
                placeholder="https://..."
                className="min-h-11 w-full rounded-lg border border-zinc-700 bg-black px-4 text-white outline-none focus:border-ritual-accent"
              />
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-300">
            {t("settings.preferences")}
          </h2>
          <div className="space-y-4">
            <fieldset>
              <legend className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {t("settings.language")}
              </legend>
              <div className="flex gap-2">
                {(["es", "en"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => void handleLanguage(value)}
                    aria-pressed={locale === value}
                    className={`min-h-11 flex-1 rounded-lg border text-sm font-bold uppercase ${
                      locale === value
                        ? "border-ritual-accent bg-ritual-accent/10 text-ritual-accent"
                        : "border-zinc-800 text-zinc-400"
                    }`}
                  >
                    {value === "es" ? "Español" : "English"}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-zinc-800 px-3">
              <span className="text-sm text-zinc-300">{t("settings.notifications")}</span>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(event) => setNotificationsEnabled(event.target.checked)}
                className="h-5 w-5 accent-ritual-accent"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {t("settings.reminder")}
              </span>
              <input
                type="time"
                value={reminderTime}
                onChange={(event) => setReminderTime(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-zinc-700 bg-black px-4 text-white outline-none focus:border-ritual-accent"
              />
            </label>
          </div>
        </section>

        <button
          type="submit"
          disabled={busy || isUpdating}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-ritual-accent px-5 font-bold text-black hover:bg-emerald-400 disabled:opacity-50 sm:w-auto"
        >
          <Save size={16} aria-hidden="true" />
          {busy || isUpdating ? t("common.saving") : t("common.save")}
        </button>
      </form>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-300">
          <KeyRound size={16} aria-hidden="true" /> {t("settings.security")}
        </h2>
        <form onSubmit={handlePassword} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            minLength={6}
            required
            autoComplete="new-password"
            placeholder={t("auth.newPassword")}
            className="min-h-11 flex-1 rounded-lg border border-zinc-700 bg-black px-4 text-white outline-none focus:border-ritual-accent"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-700 px-4 text-sm font-bold text-zinc-200 hover:border-ritual-accent disabled:opacity-50"
          >
            {t("auth.updatePassword")}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-300">
          {t("settings.data")}
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-200 hover:border-ritual-accent"
          >
            <Download size={16} aria-hidden="true" /> {t("settings.exportJson")}
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-200 hover:border-ritual-accent"
          >
            <Download size={16} aria-hidden="true" /> {t("settings.exportCsv")}
          </button>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-200 hover:border-ritual-accent disabled:opacity-50"
          >
            <Upload size={16} aria-hidden="true" /> {t("settings.importJson")}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            onChange={(event) => void handleImport(event.target.files?.[0])}
            className="sr-only"
          />
        </div>
      </section>

      <section className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 sm:p-6">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-red-400">
          {t("settings.deleteData")}
        </h2>
        <p className="mb-4 text-sm text-zinc-400">{t("settings.deleteWarning")}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void handleDeleteData()}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 text-sm font-bold text-white hover:bg-red-400 disabled:opacity-50"
          >
            <Trash2 size={16} aria-hidden="true" /> {t("settings.deleteData")}
          </button>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-300 hover:border-red-500 hover:text-red-400"
          >
            <LogOut size={16} aria-hidden="true" /> {t("auth.logout")}
          </button>
        </div>
      </section>
    </div>
  );
}
