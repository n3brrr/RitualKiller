import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { socialService } from "@/services/socialService";

export function useSocial() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["social", "feed", userId],
    queryFn: () => socialService.getFeed(userId!),
    enabled: Boolean(userId),
  });

  const invalidateFeed = () => {
    void queryClient.invalidateQueries({ queryKey: ["social", "feed", userId] });
    void queryClient.invalidateQueries({ queryKey: ["stats", userId] });
    void queryClient.invalidateQueries({ queryKey: ["achievements", userId] });
    void queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
  };

  const postMutation = useMutation({
    mutationFn: (content: string) => socialService.createPost(userId!, content),
    onSuccess: invalidateFeed,
  });

  const likeMutation = useMutation({
    mutationFn: ({ postId, liked }: { postId: string; liked: boolean }) =>
      socialService.toggleLike(postId, userId!, liked),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["social", "feed", userId] }),
  });

  const commentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      socialService.addComment(postId, userId!, content),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["social", "feed", userId] }),
  });

  const followMutation = useMutation({
    mutationFn: ({ targetId, following }: { targetId: string; following: boolean }) =>
      following
        ? socialService.unfollow(userId!, targetId)
        : socialService.follow(userId!, targetId),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["social", "feed", userId] }),
  });

  const reportMutation = useMutation({
    mutationFn: ({ postId, reason }: { postId: string; reason: string }) =>
      socialService.reportPost(postId, userId!, reason),
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => socialService.deletePost(postId),
    onSuccess: invalidateFeed,
  });

  return {
    posts: query.data?.posts ?? [],
    following: query.data?.following ?? [],
    isLoading: query.isLoading,
    error: (query.error as Error | null) ?? null,
    refetch: query.refetch,
    createPost: postMutation.mutateAsync,
    isPosting: postMutation.isPending,
    toggleLike: likeMutation.mutateAsync,
    addComment: commentMutation.mutateAsync,
    toggleFollow: followMutation.mutateAsync,
    reportPost: reportMutation.mutateAsync,
    deletePost: deleteMutation.mutateAsync,
  };
}
