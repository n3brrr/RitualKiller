import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ritualService } from '@/services/api/ritualService';
import { Ritual, RitualLog } from '@/types';
import { useRitualStore } from '../stores/useRitualStore';
import { useEffect } from 'react';

export const useRituals = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const { setRituals, setLogs } = useRitualStore();

  const ritualsQuery = useQuery({
    queryKey: ['rituals', userId],
    queryFn: () => ritualService.getRituals(userId!),
    enabled: !!userId,
  });

  const logsQuery = useQuery({
    queryKey: ['logs', userId],
    queryFn: () => ritualService.getLogs(userId!),
    enabled: !!userId,
  });

  // Sync with store if needed (though we should avoid duplicate state)
  useEffect(() => {
    if (ritualsQuery.data) {
      setRituals(ritualsQuery.data);
    }
  }, [ritualsQuery.data, setRituals]);

  useEffect(() => {
    if (logsQuery.data) {
      setLogs(logsQuery.data);
    }
  }, [logsQuery.data, setLogs]);

  const createRitualMutation = useMutation({
    mutationFn: ritualService.createRitual,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rituals', userId] });
    },
  });

  const deleteRitualMutation = useMutation({
    mutationFn: ritualService.deleteRitual,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rituals', userId] });
    },
  });

  const logRitualMutation = useMutation({
    mutationFn: ritualService.logRitual,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs', userId] });
    },
  });

  return {
    rituals: ritualsQuery.data || [],
    logs: logsQuery.data || [],
    isLoading: ritualsQuery.isLoading || logsQuery.isLoading,
    createRitual: createRitualMutation.mutateAsync,
    deleteRitual: deleteRitualMutation.mutateAsync,
    logRitual: logRitualMutation.mutateAsync,
  };
};
