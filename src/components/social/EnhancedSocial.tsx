import { useState } from "react";
import {
  AlertCircle,
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
import { useAuth } from "@/features/auth/AuthProvider";
import { useSocial } from "@/hooks/useSocial";
import { useI18n } from "@/i18n";
import { formatDateTime } from "@/utils/dates";
import Loading from "@/components/animations/Loading";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ReportDialog } from "@/components/ui/ReportDialog";
import type { SocialPost } from "@/types";

export function EnhancedSocial() {
  const { user } = useAuth();
  const {
    posts,
    following,
    isLoading,
    error,
    refetch,
    createPost,
    isPosting,
    toggleLike,
    addComment,
    toggleFollow,
    reportPost,
    deletePost,
  } = useSocial();
  const { t, locale } = useI18n();

  const [content, setContent] = useState("");
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [reportTarget, setReportTarget] = useState<SocialPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SocialPost | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (!user) return null;
  if (isLoading) return <Loading />;
  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center"
      >
        <AlertCircle className="mx-auto mb-2 text-red-500" size={24} aria-hidden="true" />
        <h1 className="font-display text-lg font-bold text-white">{t("social.errorTitle")}</h1>
        <p className="mt-1 text-sm text-red-400">{error.message}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-zinc-700 px-4 text-sm text-zinc-200 transition-colors hover:border-ritual-accent hover:text-ritual-accent"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  const handleError = (actionError: unknown) => {
    setFeedback({
      tone: "error",
      text: actionError instanceof Error ? actionError.message : t("common.error"),
    });
  };

  const handlePublish = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    try {
      await createPost(content);
      setContent("");
    } catch (publishError) {
      handleError(publishError);
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
      handleError(commentError);
    }
  };

  const handleReport = async (reason: string) => {
    if (!reportTarget) return;
    await reportPost({ postId: reportTarget.id, reason });
    setReportTarget(null);
    setFeedback({ tone: "success", text: t("social.reportSent") });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setFeedback(null);
    setDeleting(true);
    try {
      await deletePost(deleteTarget.id);
    } catch (deleteError) {
      handleError(deleteError);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{t("social.title")}</h1>
        <p className="text-sm text-zinc-400">{t("social.subtitle")}</p>
      </header>

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

      <form onSubmit={handlePublish} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
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
          className="w-full resize-none rounded-lg border border-zinc-700 bg-black px-4 py-2 text-white outline-none focus:border-ritual-accent"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
          <span>{content.length}/500</span>
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

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-400">
          <Users className="mx-auto mb-3 text-ritual-accent/60" size={28} aria-hidden="true" />
          <p>{t("social.empty")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => {
            const isOwn = post.authorId === user.id;
            const isFollowing = following.includes(post.authorId);

            return (
              <li key={post.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 font-display text-sm font-bold text-ritual-accent">
                      {post.author.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">
                        {post.author}
                        {post.isSystem && (
                          <span className="ml-2 text-xs uppercase text-zinc-400">
                            {t("social.system")}
                          </span>
                        )}
                      </p>
                      <p className="text-xs uppercase tracking-wider text-zinc-400">
                        {formatDateTime(post.createdAt, locale)}
                      </p>
                    </div>
                  </div>

                  {!isOwn && (
                    <button
                      type="button"
                      onClick={() =>
                        void toggleFollow({ targetId: post.authorId, following: isFollowing })
                      }
                      className={`inline-flex min-h-11 items-center gap-1 rounded-lg border px-2 text-xs ${
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
                    onClick={() => void toggleLike({ postId: post.id, liked: post.likedByMe })}
                    aria-pressed={post.likedByMe}
                    aria-label={`${post.likes} ${t("social.likes")}`}
                    className={`inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-xs ${
                      post.likedByMe ? "text-red-400" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Heart size={16} fill={post.likedByMe ? "currentColor" : "none"} aria-hidden="true" />
                    {post.likes}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpenComments(openComments === post.id ? null : post.id)}
                    aria-expanded={openComments === post.id}
                    aria-label={`${post.comments.length} ${t("social.comments")}`}
                    className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    <MessageCircle size={16} aria-hidden="true" />
                    {post.comments.length}
                  </button>

                  {!isOwn && (
                    <>
                      <button
                        type="button"
                        onClick={() => setReportTarget(post)}
                        aria-label={t("social.report")}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 hover:text-yellow-500"
                      >
                        <Flag size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard
                            ?.writeText(`${window.location.origin}/app/profile/${post.author}`)
                            .then(() =>
                              setFeedback({
                                tone: "success",
                                text: t("social.copied"),
                              }),
                            )
                            .catch(() =>
                              setFeedback({
                                tone: "error",
                                text: t("social.copyError"),
                              }),
                            );
                        }}
                        aria-label={t("social.copyLink")}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-300"
                      >
                        <Share2 size={16} aria-hidden="true" />
                      </button>
                    </>
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
                  <div className="mt-2 space-y-2 border-t border-zinc-900 pt-2">
                    {post.comments.length === 0 && (
                      <p className="text-xs text-zinc-400">{t("social.noComments")}</p>
                    )}
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="rounded-lg bg-zinc-900/60 p-2 text-sm">
                        <span className="font-bold text-zinc-300">{comment.author}</span>
                        <span className="ml-2 break-words text-zinc-400">{comment.content}</span>
                      </div>
                    ))}

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
                          setDrafts((current) => ({ ...current, [post.id]: event.target.value }))
                        }
                        maxLength={500}
                        placeholder={t("social.comment")}
                        aria-label={t("social.comment")}
                        className="min-h-11 flex-1 rounded-lg border border-zinc-700 bg-black px-3 text-sm text-white outline-none focus:border-ritual-accent"
                      />
                      <button
                        type="submit"
                        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-700 px-3 text-zinc-300 hover:border-ritual-accent"
                      >
                        <Send size={16} aria-hidden="true" />
                      </button>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ReportDialog
        open={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        onSubmit={handleReport}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t("social.deleteTitle")}
        description={t("social.deleteDescription")}
        confirmLabel={t("common.delete")}
        destructive
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default EnhancedSocial;
