import { achievementKey, type TranslationKey, type TranslationParams } from "@/i18n";
import type { Notification } from "@/types";

const SOCIAL_KEYS: Record<string, { title: TranslationKey; message: TranslationKey }> = {
  like: {
    title: "notifications.likeTitle",
    message: "notifications.likeMessage",
  },
  comment: {
    title: "notifications.commentTitle",
    message: "notifications.commentMessage",
  },
  follow: {
    title: "notifications.followTitle",
    message: "notifications.followMessage",
  },
};

/**
 * Server notifications carry a type and data; their text is translated here so
 * it follows the user's language. Unknown types fall back to the stored text.
 */
export function notificationText(
  notification: Pick<Notification, "type" | "title" | "message" | "data">,
  t: (key: TranslationKey, params?: TranslationParams) => string,
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
  const social = SOCIAL_KEYS[notification.type];
  if (social) {
    const name =
      typeof notification.data.actorName === "string"
        ? notification.data.actorName
        : notification.message;
    return { title: t(social.title), message: t(social.message, { name }) };
  }
  return { title: notification.title, message: notification.message };
}
