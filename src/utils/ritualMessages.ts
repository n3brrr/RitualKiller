import type { TranslationKey } from "@/i18n";

/** Maps the `reason` returned by complete_ritual / undo_ritual to a message. */
export function completionReasonKey(reason: string | undefined): TranslationKey {
  switch (reason) {
    case "invalid_date":
      return "habits.invalidDate";
    case "already_completed":
      return "habits.alreadyCompleted";
    case "essence_spent":
      return "habits.essenceSpent";
    default:
      return "common.error";
  }
}
