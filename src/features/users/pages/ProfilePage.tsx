import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Settings, Shield, User as UserIcon, Zap } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { profileService } from "@/services/profileService";
import { translateRank, useI18n } from "@/i18n";
import { formatDateTime } from "@/utils/dates";
import Loading from "@/components/animations/Loading";
import { ErrorState } from "@/components/ui/ErrorState";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const { t, locale } = useI18n();

  const isOwn = !username || username === currentUser?.username;
  const profileQuery = useQuery({
    queryKey: ["profile-public", username],
    queryFn: () => profileService.getByUsername(username!),
    enabled: Boolean(!isOwn && username),
  });

  if (isOwn && !currentUser) return <Loading />;
  if (!isOwn && profileQuery.isLoading) return <Loading />;
  if (!isOwn && profileQuery.error) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorState
          title={t("profile.errorTitle")}
          message={profileQuery.error.message}
          onRetry={() => void profileQuery.refetch()}
        />
      </div>
    );
  }

  const user = isOwn ? currentUser : profileQuery.data;
  if (!user) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-400">
        {t("profile.notFound")}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-900 font-display text-3xl font-bold text-ritual-accent">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              user.username.charAt(0).toUpperCase()
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="font-display text-2xl font-bold text-white">
                {user.username}
              </h1>
              {user.isAdmin && (
                <span className="inline-flex items-center gap-1 rounded border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-xs uppercase text-yellow-500">
                  <Shield size={10} aria-hidden="true" /> Admin
                </span>
              )}
            </div>
            <p className="text-sm uppercase tracking-widest text-ritual-accent">
              {translateRank(user.rank, t)}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              {t("profile.since")} {formatDateTime(user.created_at, locale)}
            </p>
          </div>

          {isOwn && (
            <Link
              to="/app/settings"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-300 hover:border-ritual-accent hover:text-ritual-accent"
            >
              <Settings size={16} aria-hidden="true" /> {t("settings.title")}
            </Link>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-400">
            <Zap size={14} aria-hidden="true" /> {t("profile.essence")}
          </div>
          <div className="font-mono text-2xl text-ritual-accent">{user.essence}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-400">
            <UserIcon size={14} aria-hidden="true" /> {t("profile.inventory")}
          </div>
          <div className="font-mono text-2xl text-white">{user.inventory.length}</div>
        </div>
      </div>
    </div>
  );
}
