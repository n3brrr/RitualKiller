import { supabase } from "@/lib/supabase";
import type { AdminMetrics, AdminUser, Report } from "@/types";

interface ProfileRow {
  id: string;
  username: string;
  essence: number;
  is_admin: boolean;
  created_at: string;
  suspended_until: string | null;
}

interface ReportDetailsRow {
  id: string;
  reporter_id: string;
  reporter_name: string | null;
  post_id: string | null;
  target_user_id: string | null;
  reason: string;
  status: Report["status"];
  created_at: string;
  post_content: string | null;
  reported_user_id: string | null;
  reported_user_name: string | null;
  reported_suspended_until: string | null;
}

export interface AdminErrorLog {
  id: string;
  message: string;
  stack: string | null;
  context: Record<string, unknown>;
  createdAt: string;
  userId: string | null;
}

export const ADMIN_USERS_PAGE = 25;

/** Escapes LIKE wildcards so a search for "a_b" does not match "axb". */
function likePattern(search: string): string {
  return `%${search.replace(/[\%_]/g, (char) => `\${char}`)}%`;
}

export const adminService = {
  async getMetrics(): Promise<AdminMetrics> {
    const { data, error } = await supabase.rpc("admin_metrics");
    if (error) throw error;
    return data as AdminMetrics;
  },

  /** Paginated, searchable user list (admins can read every profile). */
  async getUsers(
    search: string,
    page: number,
  ): Promise<{ users: AdminUser[]; total: number }> {
    const from = page * ADMIN_USERS_PAGE;
    let query = supabase
      .from("profiles")
      .select("id, username, essence, is_admin, created_at, suspended_until", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(from, from + ADMIN_USERS_PAGE - 1);
    const term = search.trim();
    if (term) query = query.ilike("username", likePattern(term));
    const { data, error, count } = await query;
    if (error) throw error;
    return {
      total: count ?? 0,
      users: ((data ?? []) as ProfileRow[]).map((row) => ({
        id: row.id,
        username: row.username,
        essence: row.essence,
        isAdmin: row.is_admin,
        createdAt: row.created_at,
        suspendedUntil: row.suspended_until,
      })),
    };
  },

  async getReports(): Promise<Report[]> {
    const { data, error } = await supabase
      .from("report_details")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return ((data ?? []) as ReportDetailsRow[]).map((row) => ({
      id: row.id,
      reporterId: row.reporter_id,
      reporterName: row.reporter_name ?? "—",
      postId: row.post_id,
      targetUserId: row.target_user_id,
      reason: row.reason,
      status: row.status,
      createdAt: row.created_at,
      postContent: row.post_content,
      reportedUserId: row.reported_user_id,
      reportedUserName: row.reported_user_name,
      reportedSuspendedUntil: row.reported_suspended_until,
    }));
  },

  async resolveReport(id: string, status: "resolved" | "dismissed"): Promise<void> {
    const { error } = await supabase.from("reports").update({ status }).eq("id", id);
    if (error) throw error;
  },

  async deletePost(postId: string, reportId: string | null): Promise<void> {
    const { error } = await supabase.rpc("admin_delete_post", {
      p_post_id: postId,
      p_report_id: reportId,
    });
    if (error) throw error;
  },

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase.rpc("admin_delete_comment", {
      p_comment_id: commentId,
    });
    if (error) throw error;
  },

  /** days = 0 lifts the suspension. */
  async suspendUser(
    userId: string,
    days: number,
    reportId: string | null,
  ): Promise<void> {
    const { error } = await supabase.rpc("admin_suspend_user", {
      p_user_id: userId,
      p_days: days,
      p_report_id: reportId,
    });
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
      .select("id, message, stack, context, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(25);
    if (error) throw error;
    return (
      (data ?? []) as Array<{
        id: string;
        message: string;
        stack: string | null;
        context: Record<string, unknown> | null;
        created_at: string;
        user_id: string | null;
      }>
    ).map((row) => ({
      id: row.id,
      message: row.message,
      stack: row.stack,
      context: row.context ?? {},
      createdAt: row.created_at,
      userId: row.user_id,
    }));
  },
};
