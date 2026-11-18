import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/useAuth'
import { settingsService } from '@/services/settingsService'
import type { UserSettings } from '@/types'

export function useSettings() {
  const { user } = useAuth()
  const userId = user?.id
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['settings', userId],
    queryFn: () => settingsService.get(userId!),
    enabled: Boolean(userId),
  })

  const updateMutation = useMutation({
    mutationFn: (
      updates: Partial<
        Pick<UserSettings, 'notificationsEnabled' | 'reminderTime'>
      >,
    ) => settingsService.update(userId!, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings', userId] })
      void queryClient.invalidateQueries({ queryKey: ['profile', userId] })
    },
  })

  return {
    settings: query.data ?? null,
    isLoading: query.isLoading,
    error: (query.error as Error | null) ?? null,
    refetch: query.refetch,
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  }
}
