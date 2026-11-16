import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, KeyRound, LogOut, Save, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { useRituals } from "@/hooks/useRituals";
import { useI18n, type TranslationKey } from "@/i18n";
import { profileService } from "@/services/profileService";
import { changePassword } from "@/services/authService";
import { ritualService } from "@/services/ritualService";
import { AppError, errorMessage } from "@/lib/errors";
import { downloadFile, exportData, exportToCSV, importData } from "@/utils/exportImport";
import { BACKUP_LIMITS, PASSWORD_MIN_LENGTH, validatePassword } from "@/utils/validation";
import { csvLabels } from "@/utils/csvLabels";
import { toDateKey } from "@/utils/dates";
import Loading from "@/components/animations/Loading";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { PasswordField, TextField } from "@/components/ui/FormField";
import type { Locale } from "@/types";

type Feedback = { tone: "success" | "error"; text: string } | null;

/**
 * Each section saves on its own: the profile form with its button, preferences
 * as soon as they change, so nothing is lost or half-saved.
 */
export default function SettingsPage() {
  const { user, session, refreshProfile, signOut } = useAuth();
  const {
    settings,
    isLoading,
    error: settingsError,
    refetch: refetchSettings,
    updateSettings,
  } = useSettings();
  const { rituals, archivedRituals, importBackup } = useRituals();
  const { t, locale, setLocale } = useI18n();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Per-field dependencies so a refetch does not overwrite local edits.
  useEffect(() => {
    if (!user) return;
    setUsername(user.username);
    setAvatarUrl(user.avatar_url ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.username, user?.avatar_url]);

  if (!user) return null;
  if (isLoading) return <Loading />;

  const ok = (key: TranslationKey) => setFeedback({ tone: "success", text: t(key) });
  const fail = (error: unknown) =>
    setFeedback({ tone: "error", text: errorMessage(error, t) });

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      await profileService.updateProfile(user.id, {
        username,
        avatar_url: avatarUrl.trim() || null,
      });
      await refreshProfile();
      ok("settings.updated");
    } catch (saveError) {
      fail(saveError);
    } finally {
      setBusy(false);
    }
  };

  const savePreferences = async (
    updates: Parameters<typeof updateSettings>[0],
  ): Promise<void> => {
    setFeedback(null);
    try {
      await updateSettings(updates);
      ok("settings.preferencesSaved");
    } catch (preferenceError) {
      fail(preferenceError);
    }
  };

  // The language lives in profiles.locale only.
  const handleLanguage = async (next: Locale) => {
    setLocale(next);
    setFeedback(null);
    try {
      await profileService.updateProfile(user.id, { locale: next });
      await refreshProfile();
    } catch (languageError) {
      fail(languageError);
    }
  };

  // Exports read the full history page by page (the UI only keeps a window)
  // and include archived rituals so every log keeps its title.
  const handleExport = async (format: "json" | "csv") => {
    setFeedback({ tone: "success", text: t("settings.exporting") });
    setBusy(true);
    try {
      const allRituals = [...rituals, ...archivedRituals];
      const allLogs = await ritualService.listAllLogs(user.id);
      const stamp = toDateKey();
      if (format === "json") {
        downloadFile(
          exportData(allRituals, allLogs),
          `ritualkiller-backup-${stamp}.json`,
          "application/json",
        );
      } else {
        downloadFile(
          exportToCSV(allRituals, allLogs, csvLabels(t)),
          `ritualkiller-backup-${stamp}.csv`,
          "text/csv;charset=utf-8",
        );
      }
      setFeedback(null);
    } catch (exportError) {
      fail(exportError);
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    setFeedback(null);
    setBusy(true);
    try {
      if (file.size > BACKUP_LIMITS.bytes) throw new AppError("settings.backupTooLarge");
      const backup = importData(await file.text());
      if (!backup) throw new AppError("settings.invalidBackup");
      const result = await importBackup(backup);
      setFeedback({
        tone: "success",
        text: t("settings.importSummary", {
          rituals: result.rituals,
          reused: result.reused,
          logs: result.logs,
          skipped: result.skipped,
        }),
      });
    } catch (importError) {
      fail(importError);
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const handlePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      setFeedback({
        tone: "error",
        text: t(validation.messageKey ?? "settings.invalidPassword"),
      });
      return;
    }
    const email = session?.user.email;
    if (!email) {
      fail(null);
      return;
    }

    setBusy(true);
    setFeedback(null);
    try {
      const result = await changePassword(email, currentPassword, newPassword);
      if (result.wrongCurrent) throw new AppError("settings.wrongCurrentPassword");
      if (result.error) throw result.error;
      setCurrentPassword("");
      setNewPassword("");
      ok("settings.passwordUpdated");
    } catch (passwordError) {
      fail(passwordError);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    setConfirmDelete(false);
    setBusy(true);
    setFeedback(null);
    try {
      await profileService.deleteAccount();
      await signOut();
      navigate("/login", { replace: true });
    } catch (deleteError) {
      fail(deleteError);
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
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          {t("settings.title")}
        </h1>
        <p className="text-sm text-zinc-400">{t("settings.subtitle")}</p>
      </header>

      {settingsError && (
        <ErrorState
          title={t("settings.errorTitle")}
          message={errorMessage(settingsError, t)}
          onRetry={() => void refetchSettings()}
        />
      )}

      {feedback && (
        <p
          role={feedback.tone === "error" ? "alert" : "status"}
          className={`rounded-lg border p-3 text-sm ${
            feedback.tone === "error"
              ? "border-red-500/30 bg-red-500/10 text-red-400"
              : "border-ritual-accent/30 bg-ritual-accent/10 text-ritual-accent"
          }`}
        >
          {feedback.text}
        </p>
      )}

      <form
        onSubmit={handleSaveProfile}
        className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6"
      >
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
          {t("settings.profile")}
        </h2>
        <TextField
          label={t("auth.usernameLabel")}
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          maxLength={30}
          required
          autoComplete="username"
        />
        <TextField
          label={t("settings.avatar")}
          type="url"
          value={avatarUrl}
          onChange={(event) => setAvatarUrl(event.target.value)}
          maxLength={500}
          placeholder="https://..."
          inputMode="url"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-ritual-accent px-5 font-bold text-black hover:bg-emerald-400 disabled:opacity-50 sm:w-auto"
        >
          <Save size={16} aria-hidden="true" />
          {busy ? t("common.saving") : t("settings.saveProfile")}
        </button>
      </form>

      <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
          {t("settings.preferences")}
        </h2>
        <fieldset>
          <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
            {t("settings.language")}
          </legend>
          <div className="flex gap-2">
            {(["es", "en"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => void handleLanguage(value)}
                aria-pressed={locale === value}
                lang={value}
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
            checked={settings?.notificationsEnabled ?? true}
            onChange={(event) =>
              void savePreferences({ notificationsEnabled: event.target.checked })
            }
            disabled={!settings}
            className="h-5 w-5 accent-ritual-accent"
          />
        </label>

        <TextField
          label={t("settings.reminder")}
          type="time"
          defaultValue={settings?.reminderTime ?? "20:00"}
          key={settings?.reminderTime ?? "default"}
          disabled={!settings || !settings.notificationsEnabled}
          onBlur={(event) => {
            const value = event.target.value;
            if (value && value !== settings?.reminderTime) {
              void savePreferences({ reminderTime: value });
            }
          }}
          hint={
            <>
              {t("settings.reminderHint")}{" "}
              {settings && (
                <span className="text-zinc-300">
                  {t("settings.timezone")}: {settings.timezone}
                </span>
              )}
            </>
          }
        />
      </section>

      <form
        onSubmit={handlePassword}
        className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6"
      >
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-300">
          <KeyRound size={16} aria-hidden="true" /> {t("settings.security")}
        </h2>
        {/* Hidden username helps password managers update the right entry. */}
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={session?.user.email ?? ""}
          readOnly
          hidden
        />
        <PasswordField
          label={t("settings.currentPassword")}
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
          autoComplete="current-password"
        />
        <PasswordField
          label={t("auth.newPassword")}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          minLength={PASSWORD_MIN_LENGTH}
          required
          autoComplete="new-password"
          hint={t("settings.newPasswordHint")}
        />
        <button
          type="submit"
          disabled={busy || !currentPassword || !newPassword}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-700 px-4 text-sm font-bold text-zinc-200 hover:border-ritual-accent disabled:opacity-50"
        >
          {t("auth.updatePassword")}
        </button>
      </form>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-300">
          {t("settings.data")}
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => void handleExport("json")}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-200 hover:border-ritual-accent disabled:opacity-50"
          >
            <Download size={16} aria-hidden="true" /> {t("settings.exportJson")}
          </button>
          <button
            type="button"
            onClick={() => void handleExport("csv")}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-200 hover:border-ritual-accent disabled:opacity-50"
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
            aria-label={t("settings.importJson")}
            onChange={(event) => void handleImport(event.target.files?.[0])}
            className="sr-only"
            tabIndex={-1}
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
            onClick={() => setConfirmDelete(true)}
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

      <ConfirmDialog
        open={confirmDelete}
        title={t("settings.deleteConfirmTitle")}
        description={
          <>
            {t("settings.deleteWarning")}{" "}
            <strong className="text-red-400">{t("settings.deleteIrreversible")}</strong>
          </>
        }
        confirmLabel={t("settings.deleteConfirmLabel")}
        destructive
        busy={busy}
        onConfirm={() => void handleDeleteAccount()}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
