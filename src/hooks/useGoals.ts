import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { goalService, type GoalInput } from "@/services/goalService";

export function useGoals() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["goals", userId],
    queryFn: () => goalService.list(userId!),
    enabled: Boolean(userId),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: GoalInput }) =>
      goalService.save(id, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["goals", userId] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => goalService.remove(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["goals", userId] }),
  });

  return {
    goals: query.data ?? [],
    isLoading: query.isLoading,
    error: (query.error as Error | null) ?? null,
    refetch: query.refetch,
    saveGoal: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    removeGoal: removeMutation.mutateAsync,
  };
}
