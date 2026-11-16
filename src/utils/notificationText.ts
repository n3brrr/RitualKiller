import { achievementKey, type TranslationKey } from "@/i18n";
import type { Notification } from "@/types";

/**
 * Server notifications carry a type and data; their text is translated here so
 * it follows the user's language. Unknown types fall back to the stored text.
 */
export function notificationText(
  notification: Pick<Notification, "type" | "title" | "message" | "data">,
  t: (key: TranslationKey) => string,
): { title: string; message: string } {
  if (notification.type === "achievement") {
    const id =
      typeof notification.data.achievementId === "string"
        ? notification.data.achievementId
        : notification.message;
    const name = t(achievementKey(id, "name"));
    return {
      title: t("notifications.achievementTitle"),
      message: name.startsWith("achievement.") ? notification.message : name,
    };
  }
  if (notification.type === "reminder") {
    return {
      title: t("notifications.reminderTitle"),
      message: t("notifications.reminderMessage"),
    };
  }
  return { title: notification.title, message: notification.message };
}
