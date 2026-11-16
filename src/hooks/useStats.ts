import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/useAuth";
import { statsService } from "@/services/statsService";

export function useStats() {
  const { user } = useAuth();
  const userId = user?.id;
  const query = useQuery({
    queryKey: ["stats", userId],
    queryFn: () => statsService.getMyStats(),
    enabled: Boolean(userId),
  });
  return {
    stats: query.data ?? null,
    isLoading: query.isLoading,
    error: (query.error as Error | null) ?? null,
    refetch: query.refetch,
  };
}
