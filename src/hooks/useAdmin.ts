import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { adminService } from "@/services/adminService";

export function useAdmin() {
  const { user } = useAuth();
  const enabled = Boolean(user?.isAdmin);
  const queryClient = useQueryClient();

  const metricsQuery = useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: () => adminService.getMetrics(),
    enabled,
  });

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminService.getUsers(),
    enabled,
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

  return {
    metrics: metricsQuery.data ?? null,
    users: usersQuery.data ?? [],
    reports: reportsQuery.data ?? [],
    errorLogs: errorsQuery.data ?? [],
    isLoading:
      metricsQuery.isLoading ||
      usersQuery.isLoading ||
      reportsQuery.isLoading ||
      errorsQuery.isLoading,
    error:
      (metricsQuery.error as Error | null) ??
      (usersQuery.error as Error | null) ??
      (reportsQuery.error as Error | null) ??
      null,
    resolveReport: resolveMutation.mutateAsync,
    setAdmin: adminMutation.mutateAsync,
  };
}
