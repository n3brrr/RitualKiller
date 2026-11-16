import { supabase } from "@/lib/supabase";
import type { AdminMetrics, AdminUser, Report } from "@/types";

interface ProfileRow {
  id: string;
  username: string;
  essence: number;
  is_admin: boolean;
  created_at: string;
}

interface ReportRow {
  id: string;
  reporter_id: string;
  post_id: string | null;
  target_user_id: string | null;
  reason: string;
  status: Report["status"];
  created_at: string;
}

export interface AdminErrorLog {
  id: string;
  message: string;
  stack: string | null;
  createdAt: string;
  userId: string | null;
}

export const adminService = {
  async getMetrics(): Promise<AdminMetrics> {
    const { data, error } = await supabase.rpc("admin_metrics");
    if (error) throw error;
    return data as AdminMetrics;
  },

  async getUsers(): Promise<AdminUser[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, essence, is_admin, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return ((data ?? []) as ProfileRow[]).map((row) => ({
      id: row.id,
      username: row.username,
      essence: row.essence,
      isAdmin: row.is_admin,
      createdAt: row.created_at,
    }));
  },

  async getReports(): Promise<Report[]> {
    const [reportsResult, profilesResult] = await Promise.all([
      supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("profiles").select("id, username"),
    ]);
    if (reportsResult.error) throw reportsResult.error;
    if (profilesResult.error) throw profilesResult.error;

    const names = new Map(
      ((profilesResult.data ?? []) as Array<{ id: string; username: string }>).map(
        (row) => [row.id, row.username],
      ),
    );

    return ((reportsResult.data ?? []) as ReportRow[]).map((row) => ({
      id: row.id,
      reporterId: row.reporter_id,
      reporterName: names.get(row.reporter_id) ?? "unknown",
      postId: row.post_id,
      targetUserId: row.target_user_id,
      reason: row.reason,
      status: row.status,
      createdAt: row.created_at,
    }));
  },

  async resolveReport(id: string, status: "resolved" | "dismissed"): Promise<void> {
    const { error } = await supabase.from("reports").update({ status }).eq("id", id);
    if (error) throw error;
  },

  async setAdmin(userId: string, isAdmin: boolean): Promise<void> {
    const { error } = await supabase.rpc("set_admin", {
      p_user_id: userId,
      p_is_admin: isAdmin,
    });
    if (error) throw error;
  },

  async getErrorLogs(): Promise<AdminErrorLog[]> {
    const { data, error } = await supabase
      .from("error_logs")
      .select("id, message, stack, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(25);
    if (error) throw error;
    return (
      (data ?? []) as Array<{
        id: string;
        message: string;
        stack: string | null;
        created_at: string;
        user_id: string | null;
      }>
    ).map((row) => ({
      id: row.id,
      message: row.message,
      stack: row.stack,
      createdAt: row.created_at,
      userId: row.user_id,
    }));
  },
};
