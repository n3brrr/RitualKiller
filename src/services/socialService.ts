import { supabase } from "@/lib/supabase";
import type { Comment, SocialPost } from "@/types";
import { validateContent } from "@/utils/validation";

interface PostRow {
  id: string;
  user_id: string;
  content: string;
  is_system: boolean;
  created_at: string;
}

interface ProfileLite {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface LikeRow {
  post_id: string;
  user_id: string;
}

interface CommentRow {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

function profileMap(profiles: ProfileLite[]): Map<string, ProfileLite> {
  return new Map(profiles.map((profile) => [profile.id, profile]));
}

export const FEED_PAGE_SIZE = 20;
export type FeedScope = "all" | "following";

export interface FeedPage {
  posts: SocialPost[];
  nextCursor: string | null;
}

export const socialService = {
  async getFollowing(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);
    if (error) throw error;
    return (data ?? []).map((row) => (row as { following_id: string }).following_id);
  },

  /**
   * One page of the feed, newest first. `before` is the created_at cursor of
   * the last post already shown; scope "following" limits it to followed users.
   */
  async getFeedPage(
    userId: string,
    options: { scope: FeedScope; following: string[]; before: string | null },
  ): Promise<FeedPage> {
    if (options.scope === "following" && options.following.length === 0) {
      return { posts: [], nextCursor: null };
    }
    let query = supabase
      .from("posts")
      .select("id, user_id, content, is_system, created_at")
      .order("created_at", { ascending: false })
      .limit(FEED_PAGE_SIZE);
    if (options.before) query = query.lt("created_at", options.before);
    if (options.scope === "following") query = query.in("user_id", options.following);
    const { data: postsData, error: postsError } = await query;
    if (postsError) throw postsError;

    const posts = (postsData ?? []) as PostRow[];
    if (posts.length === 0) return { posts: [], nextCursor: null };

    const postIds = posts.map((post) => post.id);
    const [likesResult, commentsResult] = await Promise.all([
      supabase.from("post_likes").select("post_id, user_id").in("post_id", postIds),
      supabase
        .from("comments")
        .select("id, post_id, user_id, content, created_at")
        .in("post_id", postIds)
        .order("created_at", { ascending: true }),
    ]);

    if (likesResult.error) throw likesResult.error;
    if (commentsResult.error) throw commentsResult.error;

    const likes = (likesResult.data ?? []) as LikeRow[];
    const comments = (commentsResult.data ?? []) as CommentRow[];

    const authorIds = Array.from(
      new Set([
        ...posts.map((post) => post.user_id),
        ...comments.map((comment) => comment.user_id),
      ]),
    );
    const { data: profilesData, error: profilesError } = await supabase
      .from("public_profiles")
      .select("id, username, avatar_url")
      .in("id", authorIds);
    if (profilesError) throw profilesError;

    const profiles = profileMap((profilesData ?? []) as ProfileLite[]);
    const likeCounts = new Map<string, number>();
    const likedByMe = new Set<string>();
    for (const like of likes) {
      likeCounts.set(like.post_id, (likeCounts.get(like.post_id) ?? 0) + 1);
      if (like.user_id === userId) likedByMe.add(like.post_id);
    }

    const commentsByPost = new Map<string, Comment[]>();
    for (const comment of comments) {
      const author = profiles.get(comment.user_id);
      const mapped: Comment = {
        id: comment.id,
        postId: comment.post_id,
        authorId: comment.user_id,
        author: author?.username ?? "unknown",
        content: comment.content,
        createdAt: comment.created_at,
      };
      const list = commentsByPost.get(comment.post_id) ?? [];
      list.push(mapped);
      commentsByPost.set(comment.post_id, list);
    }

    return {
      nextCursor:
        posts.length === FEED_PAGE_SIZE
          ? (posts[posts.length - 1]?.created_at ?? null)
          : null,
      posts: posts.map((post) => {
        const author = profiles.get(post.user_id);
        return {
          id: post.id,
          authorId: post.user_id,
          author: author?.username ?? "unknown",
          authorAvatar: author?.avatar_url ?? null,
          content: post.content,
          isSystem: post.is_system,
          createdAt: post.created_at,
          likes: likeCounts.get(post.id) ?? 0,
          likedByMe: likedByMe.has(post.id),
          comments: commentsByPost.get(post.id) ?? [],
        };
      }),
    };
  },

  async createPost(userId: string, content: string): Promise<void> {
    const validation = validateContent(content, 500);
    if (!validation.valid) throw new Error(validation.message);
    const { error } = await supabase
      .from("posts")
      .insert({ user_id: userId, content: content.trim() });
    if (error) throw error;
  },

  async deletePost(postId: string): Promise<void> {
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) throw error;
  },

  async toggleLike(postId: string, userId: string, liked: boolean): Promise<void> {
    if (liked) {
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
      if (error) throw error;
      return;
    }
    const { error } = await supabase
      .from("post_likes")
      .upsert(
        { post_id: postId, user_id: userId },
        { onConflict: "post_id,user_id", ignoreDuplicates: true },
      );
    if (error) throw error;
  },

  async addComment(postId: string, userId: string, content: string): Promise<void> {
    const validation = validateContent(content, 500);
    if (!validation.valid) throw new Error(validation.message);
    const { error } = await supabase
      .from("comments")
      .insert({ post_id: postId, user_id: userId, content: content.trim() });
    if (error) throw error;
  },

  /** Own comments (RLS) — admins use the audited admin_delete_comment RPC. */
  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (error) throw error;
  },

  async follow(userId: string, targetId: string): Promise<void> {
    const { error } = await supabase
      .from("follows")
      .upsert(
        { follower_id: userId, following_id: targetId },
        { onConflict: "follower_id,following_id", ignoreDuplicates: true },
      );
    if (error) throw error;
  },

  async unfollow(userId: string, targetId: string): Promise<void> {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", userId)
      .eq("following_id", targetId);
    if (error) throw error;
  },

  async reportPost(postId: string, reporterId: string, reason: string): Promise<void> {
    const validation = validateContent(reason, 500);
    if (!validation.valid) throw new Error(validation.message);
    const { error } = await supabase
      .from("reports")
      .insert({ reporter_id: reporterId, post_id: postId, reason: reason.trim() });
    if (error) throw error;
  },

  async reportUser(
    targetUserId: string,
    reporterId: string,
    reason: string,
  ): Promise<void> {
    const validation = validateContent(reason, 500);
    if (!validation.valid) throw new Error(validation.message);
    const { error } = await supabase.from("reports").insert({
      reporter_id: reporterId,
      target_user_id: targetUserId,
      reason: reason.trim(),
    });
    if (error) throw error;
  },
};
