import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/useAuth'
import { shopService } from '@/services/shopService'

export function useShop() {
  const { user } = useAuth()
  const userId = user?.id
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['shop', userId],
    queryFn: () => shopService.getInventory(userId!),
    enabled: Boolean(userId),
  })

  const catalogQuery = useQuery({
    queryKey: ['shop', 'catalog'],
    queryFn: () => shopService.listItems(),
    enabled: Boolean(userId),
    staleTime: 10 * 60_000,
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['shop', userId] })
    void queryClient.invalidateQueries({ queryKey: ['profile', userId] })
    // The Potion of Oblivion changes logs and streaks.
    void queryClient.invalidateQueries({ queryKey: ['rituals', userId] })
  }

  const purchaseMutation = useMutation({
    mutationFn: (itemId: string) => shopService.purchase(itemId),
    onSuccess: invalidate,
  })

  const consumeMutation = useMutation({
    mutationFn: (itemId: string) => shopService.consume(itemId),
    onSuccess: invalidate,
  })

  return {
    items: catalogQuery.data ?? [],
    quantities: query.data?.quantities ?? {},
    buffs: query.data?.buffs ?? [],
    isLoading: query.isLoading || catalogQuery.isLoading,
    error: ((query.error ?? catalogQuery.error) as Error | null) ?? null,
    refetch: () => {
      void catalogQuery.refetch()
      return query.refetch()
    },
    purchase: purchaseMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending,
    consume: consumeMutation.mutateAsync,
  }
}
