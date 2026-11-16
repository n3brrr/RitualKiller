import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { shopService } from "@/services/shopService";

export function useShop() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["shop", userId],
    queryFn: () => shopService.getInventory(userId!),
    enabled: Boolean(userId),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["shop", userId] });
    void queryClient.invalidateQueries({ queryKey: ["profile", userId] });
  };

  const purchaseMutation = useMutation({
    mutationFn: (itemId: string) => shopService.purchase(itemId),
    onSuccess: invalidate,
  });

  const consumeMutation = useMutation({
    mutationFn: (itemId: string) => shopService.consume(itemId),
    onSuccess: invalidate,
  });

  return {
    quantities: query.data?.quantities ?? {},
    buffs: query.data?.buffs ?? [],
    isLoading: query.isLoading,
    error: (query.error as Error | null) ?? null,
    refetch: query.refetch,
    purchase: purchaseMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending,
    consume: consumeMutation.mutateAsync,
  };
}
