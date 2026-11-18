import { supabase } from "@/lib/supabase";
import type { Notification } from "@/types";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

function mapNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    data: row.data ?? {},
    read: row.read,
    createdAt: row.created_at,
  };
}

export const NOTIFICATIONS_PAGE = 50;

export const notificationService = {
  async list(userId: string, limit = NOTIFICATIONS_PAGE): Promise<Notification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, message, data, read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return ((data ?? []) as NotificationRow[]).map(mapNotification);
  },

  async markRead(id: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
    if (error) throw error;
  },

  async markAllRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) throw error;
  },

  async ensureReminder(): Promise<void> {
    const { error } = await supabase.rpc("ensure_ritual_reminder");
    if (error) throw error;
  },
};
