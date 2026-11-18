import { useMemo } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useAuth } from '@/features/auth/useAuth'
import { socialService, type FeedScope } from '@/services/socialService'

export function useSocial(scope: FeedScope = 'all') {
  const { user } = useAuth()
  const userId = user?.id
  const queryClient = useQueryClient()

  const followingQuery = useQuery({
    queryKey: ['social', 'following', userId],
    queryFn: () => socialService.getFollowing(userId!),
    enabled: Boolean(userId),
  })
  const following = useMemo(
    () => followingQuery.data ?? [],
    [followingQuery.data],
  )

  const feedQuery = useInfiniteQuery({
    queryKey: [
      'social',
      'feed',
      userId,
      scope,
      scope === 'following' ? following : null,
    ],
    queryFn: ({ pageParam }) =>
      socialService.getFeedPage(userId!, {
        scope,
        following,
        before: pageParam,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(userId) && (scope === 'all' || followingQuery.isSuccess),
  })

  const posts = useMemo(
    () => feedQuery.data?.pages.flatMap((page) => page.posts) ?? [],
    [feedQuery.data],
  )

  const invalidateFeed = () => {
    void queryClient.invalidateQueries({ queryKey: ['social'] })
  }
  const invalidateAfterPost = () => {
    invalidateFeed()
    void queryClient.invalidateQueries({ queryKey: ['stats', userId] })
    void queryClient.invalidateQueries({ queryKey: ['achievements', userId] })
    void queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
  }

  const postMutation = useMutation({
    mutationFn: (content: string) => socialService.createPost(userId!, content),
    onSuccess: invalidateAfterPost,
  })

  const likeMutation = useMutation({
    mutationFn: ({ postId, liked }: { postId: string; liked: boolean }) =>
      socialService.toggleLike(postId, userId!, liked),
    onSuccess: invalidateFeed,
  })

  const commentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      socialService.addComment(postId, userId!, content),
    onSuccess: invalidateFeed,
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => socialService.deleteComment(commentId),
    onSuccess: invalidateFeed,
  })

  const followMutation = useMutation({
    mutationFn: ({
      targetId,
      following: isFollowing,
    }: {
      targetId: string
      following: boolean
    }) =>
      isFollowing
        ? socialService.unfollow(userId!, targetId)
        : socialService.follow(userId!, targetId),
    onSuccess: () => {
      invalidateFeed()
      void queryClient.invalidateQueries({ queryKey: ['profile-public'] })
    },
  })

  const reportMutation = useMutation({
    mutationFn: ({ postId, reason }: { postId: string; reason: string }) =>
      socialService.reportPost(postId, userId!, reason),
  })

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => socialService.deletePost(postId),
    onSuccess: invalidateAfterPost,
  })

  return {
    posts,
    following,
    isLoading: feedQuery.isLoading || followingQuery.isLoading,
    error: ((feedQuery.error ?? followingQuery.error) as Error | null) ?? null,
    refetch: feedQuery.refetch,
    hasMore: Boolean(feedQuery.hasNextPage),
    loadMore: feedQuery.fetchNextPage,
    isLoadingMore: feedQuery.isFetchingNextPage,
    createPost: postMutation.mutateAsync,
    isPosting: postMutation.isPending,
    toggleLike: likeMutation.mutateAsync,
    addComment: commentMutation.mutateAsync,
    deleteComment: deleteCommentMutation.mutateAsync,
    toggleFollow: followMutation.mutateAsync,
    reportPost: reportMutation.mutateAsync,
    deletePost: deleteMutation.mutateAsync,
  }
}
