import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { goalService, type CreateGoalInput } from "@/services/goalService";

export function useGoals() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["goals", userId],
    queryFn: () => goalService.list(userId!),
    enabled: Boolean(userId),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateGoalInput) => goalService.create(userId!, input),
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
    createGoal: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    removeGoal: removeMutation.mutateAsync,
  };
}
