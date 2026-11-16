import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { notificationService } from "@/services/notificationService";

export function useNotifications() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => notificationService.list(userId!),
    enabled: Boolean(userId),
    refetchInterval: 60_000,
  });

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ["notifications", userId] });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: invalidate,
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(userId!),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => notificationService.remove(id),
    onSuccess: invalidate,
  });

  const notifications = query.data ?? [];

  return {
    notifications,
    unreadCount: notifications.filter((notification) => !notification.read).length,
    isLoading: query.isLoading,
    error: (query.error as Error | null) ?? null,
    refetch: query.refetch,
    markRead: markReadMutation.mutateAsync,
    markAllRead: markAllMutation.mutateAsync,
    removeNotification: removeMutation.mutateAsync,
  };
}
