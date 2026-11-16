import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Ban,
  Heart,
  MessageCircle,
  Send,
  Share2,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  Flag,
} from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { useSocial } from "@/hooks/useSocial";
import { useI18n } from "@/i18n";
import { errorMessage } from "@/lib/errors";
import { adminService } from "@/services/adminService";
import type { FeedScope } from "@/services/socialService";
import { formatDateTime } from "@/utils/dates";
import Loading from "@/components/animations/Loading";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { ReportDialog } from "@/components/ui/ReportDialog";
import { Avatar } from "@/components/ui/Avatar";
import type { Comment, SocialPost } from "@/types";

type Feedback = { tone: "success" | "error"; text: string } | null;

export function EnhancedSocial() {
  const { user } = useAuth();
  const { t, tn, locale } = useI18n();
  const location = useLocation();
  const [scope, setScope] = useState<FeedScope>("all");
  const {
    posts,
    following,
    isLoading,
    error,
    refetch,
    hasMore,
    loadMore,
    isLoadingMore,
    createPost,
    isPosting,
    toggleLike,
    addComment,
    deleteComment,
    toggleFollow,
    reportPost,
    deletePost,
  } = useSocial(scope);

  const [content, setContent] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [reportTarget, setReportTarget] = useState<SocialPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SocialPost | null>(null);
  const [commentTarget, setCommentTarget] = useState<Comment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Shared links point to /app/social#post-<id>: scroll to the post once loaded.
  useEffect(() => {
    if (!location.hash.startsWith("#post-") || posts.length === 0) return;
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: "center" });
  }, [location.hash, posts.length]);

  if (!user) return null;
  if (isLoading) return <Loading />;
  if (error) {
    return (
      <ErrorState
        title={t("social.errorTitle")}
        message={errorMessage(error, t)}
        onRetry={() => void refetch()}
      />
    );
  }

  const suspended = Boolean(
    user.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now(),
  );

  const fail = (actionError: unknown) =>
    setFeedback({ tone: "error", text: errorMessage(actionError, t) });

  /** Runs a quick action (like, follow) with per-item busy state and errors. */
  const quick = async (key: string, action: () => Promise<unknown>) => {
    setPendingAction(key);
    try {
      await action();
    } catch (actionError) {
      fail(actionError);
    } finally {
      setPendingAction(null);
    }
  };

  const handlePublish = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    try {
      await createPost(content);
      setContent("");
    } catch (publishError) {
      fail(publishError);
    }
  };

  const handleComment = async (post: SocialPost) => {
    const draft = drafts[post.id]?.trim();
    if (!draft) return;
    setFeedback(null);
    try {
      await addComment({ postId: post.id, content: draft });
      setDrafts((current) => ({ ...current, [post.id]: "" }));
    } catch (commentError) {
      fail(commentError);
    }
  };

  const handleReport = async (reason: string) => {
    if (!reportTarget) return;
    await reportPost({ postId: reportTarget.id, reason });
    setReportTarget(null);
    setFeedback({ tone: "success", text: t("social.reportSent") });
  };

  const sharePost = (post: SocialPost) => {
    const url = `${window.location.origin}/app/social#post-${post.id}`;
    void navigator.clipboard
      ?.writeText(url)
      .then(() => setFeedback({ tone: "success", text: t("social.copied") }))
      .catch(() => setFeedback({ tone: "error", text: t("social.copyError") }));
  };

  const confirmDelete = async () => {
    setFeedback(null);
    setDeleting(true);
    try {
      if (deleteTarget) await deletePost(deleteTarget.id);
      if (commentTarget) {
        // Own comments are deleted directly; moderators use the audited RPC.
        if (commentTarget.authorId === user.id) {
          await deleteComment(commentTarget.id);
        } else {
          await adminService.deleteComment(commentTarget.id);
          await refetch();
        }
      }
    } catch (deleteError) {
      fail(deleteError);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
      setCommentTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          {t("social.title")}
        </h1>
        <p className="text-sm text-zinc-400">{t("social.subtitle")}</p>
      </header>

      {suspended && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
        >
          <Ban size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          {t("errors.suspended")}
        </p>
      )}

      {feedback && (
        <p
          role={feedback.tone === "success" ? "status" : "alert"}
          className={`rounded-lg border p-3 text-sm ${
            feedback.tone === "success"
              ? "border-ritual-accent/30 bg-ritual-accent/10 text-ritual-accent"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {feedback.text}
        </p>
      )}

      {!suspended && (
        <form
          onSubmit={handlePublish}
          className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
        >
          <label htmlFor="post-content" className="sr-only">
            {t("social.placeholder")}
          </label>
          <textarea
            id="post-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={500}
            rows={3}
            placeholder={t("social.placeholder")}
            aria-describedby="post-content-count"
            className="w-full resize-none rounded-lg border border-zinc-700 bg-black px-4 py-2 text-white outline-none focus:border-ritual-accent"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
            <span id="post-content-count">{content.length}/500</span>
            <button
              type="submit"
              disabled={isPosting || content.trim().length === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-ritual-accent px-4 font-bold text-black hover:bg-emerald-400 disabled:opacity-50"
            >
              <Send size={14} aria-hidden="true" />
              {isPosting ? t("common.saving") : t("social.post")}
            </button>
          </div>
        </form>
      )}

      <div role="tablist" aria-label={t("social.feedLabel")} className="flex gap-2">
        {(["all", "following"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={scope === value}
            onClick={() => setScope(value)}
            className={`min-h-11 rounded-lg border px-4 text-sm font-bold ${
              scope === value
                ? "border-ritual-accent bg-ritual-accent/10 text-ritual-accent"
                : "border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {value === "all" ? t("social.scopeAll") : t("social.scopeFollowing")}
          </button>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-400">
          <Users
            className="mx-auto mb-3 text-ritual-accent/60"
            size={28}
            aria-hidden="true"
          />
          <p>{scope === "following" ? t("social.emptyFollowing") : t("social.empty")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => {
            const isOwn = post.authorId === user.id;
            const isFollowing = following.includes(post.authorId);
            const profileUrl = `/app/profile/${encodeURIComponent(post.author)}`;

            return (
              <li
                key={post.id}
                id={`post-${post.id}`}
                className="scroll-mt-24 rounded-xl border border-zinc-800 bg-zinc-950 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to={profileUrl}
                    className="flex min-w-0 items-center gap-2 rounded-lg"
                  >
                    <Avatar
                      name={post.author}
                      url={post.authorAvatar ?? null}
                      size="sm"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-white hover:text-ritual-accent">
                        {post.author}
                        {post.isSystem && (
                          <span className="ml-2 text-xs uppercase text-zinc-400">
                            {t("social.system")}
                          </span>
                        )}
                      </span>
                      <span className="block text-xs uppercase tracking-wider text-zinc-400">
                        {formatDateTime(post.createdAt, locale)}
                      </span>
                    </span>
                  </Link>

                  {!isOwn && !suspended && (
                    <button
                      type="button"
                      onClick={() =>
                        void quick(`follow-${post.authorId}`, () =>
                          toggleFollow({
                            targetId: post.authorId,
                            following: isFollowing,
                          }),
                        )
                      }
                      disabled={pendingAction === `follow-${post.authorId}`}
                      aria-pressed={isFollowing}
                      className={`inline-flex min-h-11 items-center gap-1 rounded-lg border px-2 text-xs disabled:opacity-50 ${
                        isFollowing
                          ? "border-zinc-700 text-zinc-400"
                          : "border-ritual-accent/40 text-ritual-accent"
                      }`}
                    >
                      {isFollowing ? (
                        <UserCheck size={14} aria-hidden="true" />
                      ) : (
                        <UserPlus size={14} aria-hidden="true" />
                      )}
                      {isFollowing ? t("social.following") : t("social.follow")}
                    </button>
                  )}
                </div>

                <p className="mt-3 whitespace-pre-wrap break-words text-sm text-zinc-200">
                  {post.content}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-zinc-900 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      void quick(`like-${post.id}`, () =>
                        toggleLike({ postId: post.id, liked: post.likedByMe }),
                      )
                    }
                    disabled={pendingAction === `like-${post.id}`}
                    aria-pressed={post.likedByMe}
                    aria-label={tn("social.likesLabel", post.likes)}
                    className={`inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-xs disabled:opacity-50 ${
                      post.likedByMe
                        ? "text-red-400"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Heart
                      size={16}
                      fill={post.likedByMe ? "currentColor" : "none"}
                      aria-hidden="true"
                    />
                    {post.likes}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setOpenComments(openComments === post.id ? null : post.id)
                    }
                    aria-expanded={openComments === post.id}
                    aria-controls={`comments-${post.id}`}
                    aria-label={tn("social.commentsLabel", post.comments.length)}
                    className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    <MessageCircle size={16} aria-hidden="true" />
                    {post.comments.length}
                  </button>

                  <button
                    type="button"
                    onClick={() => sharePost(post)}
                    aria-label={t("social.copyLink")}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-300"
                  >
                    <Share2 size={16} aria-hidden="true" />
                  </button>

                  {!isOwn && !suspended && (
                    <button
                      type="button"
                      onClick={() => setReportTarget(post)}
                      aria-label={t("social.report")}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 hover:text-yellow-500"
                    >
                      <Flag size={16} aria-hidden="true" />
                    </button>
                  )}

                  {isOwn && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(post)}
                      aria-label={t("social.delete")}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 hover:text-red-500"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>

                {openComments === post.id && (
                  <div
                    id={`comments-${post.id}`}
                    className="mt-2 space-y-2 border-t border-zinc-900 pt-2"
                  >
                    {post.comments.length === 0 && (
                      <p className="text-xs text-zinc-400">{t("social.noComments")}</p>
                    )}
                    {post.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="flex items-start justify-between gap-2 rounded-lg bg-zinc-900/60 p-2 text-sm"
                      >
                        <p className="min-w-0 break-words">
                          <Link
                            to={`/app/profile/${encodeURIComponent(comment.author)}`}
                            className="font-bold text-zinc-300 hover:text-ritual-accent"
                          >
                            {comment.author}
                          </Link>
                          <span className="ml-2 text-zinc-400">{comment.content}</span>
                        </p>
                        {(comment.authorId === user.id || user.isAdmin) && (
                          <button
                            type="button"
                            onClick={() => setCommentTarget(comment)}
                            aria-label={t("social.deleteComment")}
                            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:text-red-500"
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    ))}

                    {!suspended && (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          void handleComment(post);
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          value={drafts[post.id] ?? ""}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [post.id]: event.target.value,
                            }))
                          }
                          maxLength={500}
                          placeholder={t("social.comment")}
                          aria-label={t("social.comment")}
                          className="min-h-11 flex-1 rounded-lg border border-zinc-700 bg-black px-3 text-sm text-white outline-none focus:border-ritual-accent"
                        />
                        <button
                          type="submit"
                          aria-label={t("social.sendComment")}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-zinc-700 px-3 text-zinc-300 hover:border-ritual-accent"
                        >
                          <Send size={16} aria-hidden="true" />
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={isLoadingMore}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-zinc-800 text-sm text-zinc-300 hover:border-ritual-accent disabled:opacity-50"
        >
          {isLoadingMore ? t("common.loading") : t("social.loadMore")}
        </button>
      )}

      <ReportDialog
        open={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        onSubmit={handleReport}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget) || Boolean(commentTarget)}
        title={commentTarget ? t("social.deleteCommentTitle") : t("social.deleteTitle")}
        description={
          commentTarget
            ? t("social.deleteCommentDescription")
            : t("social.deleteDescription")
        }
        confirmLabel={t("common.delete")}
        destructive
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onClose={() => {
          setDeleteTarget(null);
          setCommentTarget(null);
        }}
      />
    </div>
  );
}

export default EnhancedSocial;
