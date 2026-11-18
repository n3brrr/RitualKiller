import { useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@/features/auth/useAuth";
import { NOTIFICATIONS_PAGE, notificationService } from "@/services/notificationService";

export function useNotifications() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  // The list grows by one page each time the user asks for more.
  const [limit, setLimit] = useState(NOTIFICATIONS_PAGE);

  const query = useQuery({
    queryKey: ["notifications", userId, limit],
    queryFn: () => notificationService.list(userId!, limit),
    enabled: Boolean(userId),
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
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
    /** A full page suggests there are older notifications to load. */
    hasMore: notifications.length >= limit,
    loadMore: () => setLimit((current) => current + NOTIFICATIONS_PAGE),
    isFetching: query.isFetching,
    isLoading: query.isLoading,
    error: (query.error as Error | null) ?? null,
    refetch: query.refetch,
    markRead: markReadMutation.mutateAsync,
    markAllRead: markAllMutation.mutateAsync,
    removeNotification: removeMutation.mutateAsync,
  };
}
