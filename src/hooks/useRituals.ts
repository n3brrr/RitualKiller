import { useMemo } from "react";
import {
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { useAuth } from "@/features/auth/useAuth";
import {
  ritualService,
  type CompleteResult,
  type CreateRitualInput,
  type RitualBundle,
} from "@/services/ritualService";
import { buildCompletionIndex } from "@/utils/analytics";
import { toDateKey } from "@/utils/dates";
import type { ExportData } from "@/utils/exportImport";

const TOGGLE_KEY = ["rituals", "toggle"] as const;

interface ToggleContext {
  previous: RitualBundle | undefined;
}

export function useRituals() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const ritualsKey = ["rituals", userId] as const;

  const query = useQuery({
    queryKey: ritualsKey,
    queryFn: () => ritualService.list(userId!),
    enabled: Boolean(userId),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["rituals", userId] });
    void queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    void queryClient.invalidateQueries({ queryKey: ["goals", userId] });
    void queryClient.invalidateQueries({ queryKey: ["achievements", userId] });
    void queryClient.invalidateQueries({ queryKey: ["stats", userId] });
    void queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
  };

  /**
   * Optimistic toggle: the check mark flips immediately (a temporary log for
   * today) and is rolled back if the server refuses or fails.
   */
  const optimisticToggle = (
    completing: boolean,
  ): Pick<
    UseMutationOptions<CompleteResult, Error, string, ToggleContext>,
    "onMutate" | "onError" | "onSuccess" | "onSettled"
  > => ({
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ritualsKey });
      const previous = queryClient.getQueryData<RitualBundle>(ritualsKey);
      if (previous) {
        const today = toDateKey();
        const logs = completing
          ? [
              ...previous.logs,
              {
                id: `optimistic-${id}`,
                ritualId: id,
                user_id: userId ?? "",
                date: today,
                essence_gained: 0,
                protected: false,
              },
            ]
          : previous.logs.filter((log) => !(log.ritualId === id && log.date === today));
        queryClient.setQueryData<RitualBundle>(ritualsKey, { ...previous, logs });
      }
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(ritualsKey, context.previous);
    },
    onSuccess: (result, _id, context) => {
      if (!result.success && context?.previous) {
        queryClient.setQueryData(ritualsKey, context.previous);
      }
    },
    onSettled: invalidate,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateRitualInput) => ritualService.create(userId!, input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateRitualInput }) =>
      ritualService.update(id, input),
    onSuccess: invalidate,
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => ritualService.archive(id),
    onSuccess: invalidate,
  });

  const completeMutation = useMutation({
    mutationKey: TOGGLE_KEY,
    mutationFn: (id: string): Promise<CompleteResult> => ritualService.complete(id),
    ...optimisticToggle(true),
  });

  const undoMutation = useMutation({
    mutationKey: TOGGLE_KEY,
    mutationFn: (id: string): Promise<CompleteResult> => ritualService.undo(id),
    ...optimisticToggle(false),
  });

  const importMutation = useMutation({
    mutationFn: (backup: ExportData) => ritualService.importBackup(backup),
    onSuccess: invalidate,
  });

  // Ritual ids with a complete/undo in flight, shared by every component.
  const pendingIds = useMutationState({
    filters: { mutationKey: TOGGLE_KEY, status: "pending" },
    select: (mutation) => mutation.state.variables as string,
  });

  const logs = useMemo(() => query.data?.logs ?? [], [query.data]);
  const completionIndex = useMemo(() => buildCompletionIndex(logs), [logs]);

  return {
    rituals: query.data?.rituals ?? [],
    archivedRituals: query.data?.archived ?? [],
    logs,
    /** Map ritualId -> set of completed dates, for O(1) "done?" checks. */
    completionIndex,
    isLoading: query.isLoading,
    error: (query.error as Error | null) ?? null,
    refetch: query.refetch,
    createRitual: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateRitual: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    archiveRitual: archiveMutation.mutateAsync,
    completeRitual: completeMutation.mutateAsync,
    undoRitual: undoMutation.mutateAsync,
    isPending: (id: string) => pendingIds.includes(id),
    importBackup: importMutation.mutateAsync,
  };
}
