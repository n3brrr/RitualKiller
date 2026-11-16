import type { TranslationKey } from "@/i18n";

/** An error whose message is a translation key, thrown by our own code. */
export class AppError extends Error {
  readonly key: TranslationKey;

  constructor(key: TranslationKey, options?: { cause?: unknown }) {
    super(key, options);
    this.name = "AppError";
    this.key = key;
  }
}

interface ErrorLike {
  code?: unknown;
  message?: unknown;
  status?: unknown;
  name?: unknown;
}

// Exceptions raised on purpose by our SQL functions and triggers.
const DB_MESSAGES: Record<string, TranslationKey> = {
  binding_contract_required: "errors.bindingContract",
  rate_limited: "errors.rateLimited",
  invalid_timezone: "errors.invalidTimezone",
  invalid_goal: "goals.titleRequired",
  invalid_ritual: "errors.invalidRitual",
  invalid_backup: "settings.invalidBackup",
  backup_too_large: "settings.backupTooLarge",
  quota_exceeded: "errors.rateLimited",
};

// Supabase Auth error codes (AuthApiError.code).
const AUTH_CODES: Record<string, TranslationKey> = {
  invalid_credentials: "errors.invalidCredentials",
  email_not_confirmed: "errors.emailNotConfirmed",
  user_already_exists: "errors.userExists",
  email_exists: "errors.userExists",
  weak_password: "validation.passwordMin",
  same_password: "errors.samePassword",
  over_request_rate_limit: "errors.rateLimited",
  over_email_send_rate_limit: "errors.rateLimited",
  otp_expired: "errors.linkExpired",
};

/**
 * Turns any error (ours, Postgres/PostgREST, Supabase Auth, network) into a
 * translation key. Technical details stay in the console / error_logs.
 */
export function errorKey(error: unknown): TranslationKey {
  if (error instanceof AppError) return error.key;
  if (!error || typeof error !== "object") return "common.error";

  const { code, message, status, name } = error as ErrorLike;
  const text = typeof message === "string" ? message : "";

  for (const [needle, key] of Object.entries(DB_MESSAGES)) {
    if (text.includes(needle)) return key;
  }
  if (typeof code === "string" && AUTH_CODES[code]) return AUTH_CODES[code];
  if (code === "23505") return "errors.duplicate";
  if (code === "23514" && text.includes("avatar")) return "settings.avatarInvalid";
  if (code === "42501" || (typeof code === "string" && code.startsWith("PGRST3"))) {
    return "errors.forbidden";
  }
  if (status === 429) return "errors.rateLimited";
  if (name === "TypeError" && /fetch|network/i.test(text)) return "errors.network";
  if (/Invalid login credentials/i.test(text)) return "errors.invalidCredentials";
  return "common.error";
}

export function errorMessage(error: unknown, t: (key: TranslationKey) => string): string {
  return t(errorKey(error));
}
