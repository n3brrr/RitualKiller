import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  ritualService,
  type CompleteResult,
  type CreateRitualInput,
} from "@/services/ritualService";
import type { ExportData } from "@/utils/exportImport";

export function useRituals() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["rituals", userId],
    queryFn: () => ritualService.list(userId!),
    enabled: Boolean(userId),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["rituals", userId] });
    void queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    void queryClient.invalidateQueries({ queryKey: ["goals", userId] });
    void queryClient.invalidateQueries({ queryKey: ["achievements", userId] });
    void queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
  };

  const createMutation = useMutation({
    mutationFn: (input: CreateRitualInput) => ritualService.create(userId!, input),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => ritualService.remove(id),
    onSuccess: invalidate,
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }): Promise<CompleteResult> =>
      ritualService.complete(id, date),
    onSuccess: invalidate,
  });

  const undoMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }): Promise<CompleteResult> =>
      ritualService.undo(id, date),
    onSuccess: invalidate,
  });

  const importMutation = useMutation({
    mutationFn: (backup: ExportData) => ritualService.importBackup(userId!, backup),
    onSuccess: invalidate,
  });

  return {
    rituals: query.data?.rituals ?? [],
    logs: query.data?.logs ?? [],
    isLoading: query.isLoading,
    error: (query.error as Error | null) ?? null,
    createRitual: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    removeRitual: removeMutation.mutateAsync,
    completeRitual: completeMutation.mutateAsync,
    undoRitual: undoMutation.mutateAsync,
    isToggling: completeMutation.isPending || undoMutation.isPending,
    importBackup: importMutation.mutateAsync,
  };
}
