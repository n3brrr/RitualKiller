import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@/features/auth/useAuth";
import { adminService } from "@/services/adminService";

export function useAdmin(userSearch = "", userPage = 0) {
  const { user } = useAuth();
  const enabled = Boolean(user?.isAdmin);
  const queryClient = useQueryClient();

  const metricsQuery = useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: () => adminService.getMetrics(),
    enabled,
  });

  const usersQuery = useQuery({
    queryKey: ["admin", "users", userSearch, userPage],
    queryFn: () => adminService.getUsers(userSearch, userPage),
    enabled,
    placeholderData: keepPreviousData,
  });

  const reportsQuery = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: () => adminService.getReports(),
    enabled,
  });

  const errorsQuery = useQuery({
    queryKey: ["admin", "errors"],
    queryFn: () => adminService.getErrorLogs(),
    enabled,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin"] });
    void queryClient.invalidateQueries({ queryKey: ["social"] });
  };

  const resolveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "resolved" | "dismissed" }) =>
      adminService.resolveReport(id, status),
    onSuccess: invalidate,
  });

  const adminMutation = useMutation({
    mutationFn: ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) =>
      adminService.setAdmin(userId, isAdmin),
    onSuccess: invalidate,
  });

  const deletePostMutation = useMutation({
    mutationFn: ({ postId, reportId }: { postId: string; reportId: string | null }) =>
      adminService.deletePost(postId, reportId),
    onSuccess: invalidate,
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => adminService.deleteComment(commentId),
    onSuccess: invalidate,
  });

  const suspendMutation = useMutation({
    mutationFn: ({
      userId,
      days,
      reportId,
    }: {
      userId: string;
      days: number;
      reportId: string | null;
    }) => adminService.suspendUser(userId, days, reportId),
    onSuccess: invalidate,
  });

  return {
    metrics: metricsQuery.data ?? null,
    users: usersQuery.data?.users ?? [],
    usersTotal: usersQuery.data?.total ?? 0,
    usersFetching: usersQuery.isFetching,
    reports: reportsQuery.data ?? [],
    errorLogs: errorsQuery.data ?? [],
    isLoading: metricsQuery.isLoading || reportsQuery.isLoading || errorsQuery.isLoading,
    error:
      (metricsQuery.error as Error | null) ??
      (usersQuery.error as Error | null) ??
      (reportsQuery.error as Error | null) ??
      (errorsQuery.error as Error | null) ??
      null,
    refetch: () => {
      void metricsQuery.refetch();
      void usersQuery.refetch();
      void reportsQuery.refetch();
      void errorsQuery.refetch();
    },
    resolveReport: resolveMutation.mutateAsync,
    setAdmin: adminMutation.mutateAsync,
    deletePost: deletePostMutation.mutateAsync,
    deleteComment: deleteCommentMutation.mutateAsync,
    suspendUser: suspendMutation.mutateAsync,
  };
}
