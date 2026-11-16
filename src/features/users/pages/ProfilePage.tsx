import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  Crown,
  Flame,
  ListChecks,
  Settings,
  Skull,
  UserCheck,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { useSocial } from "@/hooks/useSocial";
import { profileService } from "@/services/profileService";
import { translateRank, useI18n } from "@/i18n";
import { errorMessage } from "@/lib/errors";
import { formatDateKey, toDateKey } from "@/utils/dates";
import Loading from "@/components/animations/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { Avatar } from "@/components/ui/Avatar";

export default function ProfilePage() {
  const { username = "" } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const { t, locale } = useI18n();
  const { following, toggleFollow } = useSocial();
  const [followError, setFollowError] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ["profile-public", username.toLowerCase()],
    queryFn: () => profileService.getPublicProfile(username),
    enabled: Boolean(username),
  });

  if (profileQuery.isLoading) return <Loading />;
  if (profileQuery.error) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorState
          title={t("profile.errorTitle")}
          message={errorMessage(profileQuery.error, t)}
          onRetry={() => void profileQuery.refetch()}
        />
      </div>
    );
  }

  const profile = profileQuery.data;
  if (!profile) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-400">
        {t("profile.notFound")}
      </p>
    );
  }

  const isOwn = profile.id === currentUser?.id;
  const isFollowing = following.includes(profile.id);
  const since = formatDateKey(toDateKey(new Date(profile.createdAt)), locale);

  const handleFollow = async () => {
    setFollowError(null);
    try {
      await toggleFollow({ targetId: profile.id, following: isFollowing });
    } catch (error) {
      setFollowError(errorMessage(error, t));
    }
  };

  const stats = [
    {
      icon: <Zap size={14} aria-hidden="true" />,
      label: t("profile.essence"),
      value: profile.essence,
    },
    {
      icon: <Flame size={14} aria-hidden="true" />,
      label: t("profile.bestStreak"),
      value: profile.bestStreak,
    },
    {
      icon: <ListChecks size={14} aria-hidden="true" />,
      label: t("profile.activeRituals"),
      value: profile.activeRituals,
    },
    {
      icon: <Crown size={14} aria-hidden="true" />,
      label: t("profile.achievements"),
      value: profile.achievements,
    },
    {
      icon: <Users size={14} aria-hidden="true" />,
      label: t("profile.followers"),
      value: profile.followers,
    },
    {
      icon: <UserCheck size={14} aria-hidden="true" />,
      label: t("profile.following"),
      value: profile.following,
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section
        className={`rounded-2xl border p-6 ${
          profile.shadowAmulet
            ? "border-purple-500/40 bg-gradient-to-b from-purple-950/40 to-black"
            : "border-zinc-800 bg-zinc-950"
        }`}
      >
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <Avatar
            name={profile.username}
            url={profile.avatarUrl}
            size="lg"
            shadow={profile.shadowAmulet}
          />

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold text-white">
              {profile.username}
            </h1>
            <p className="text-sm uppercase tracking-widest text-ritual-accent">
              {translateRank(profile.rank, t)}
            </p>
            {profile.shadowAmulet && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-purple-300">
                <Skull size={12} aria-hidden="true" /> {t("profile.shadowAmulet")}
              </p>
            )}
            <p className="mt-1 text-xs text-zinc-400">
              {t("profile.since")} {since}
            </p>
          </div>

          {isOwn ? (
            <Link
              to="/app/settings"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-300 hover:border-ritual-accent hover:text-ritual-accent"
            >
              <Settings size={16} aria-hidden="true" /> {t("settings.title")}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => void handleFollow()}
              aria-pressed={isFollowing}
              className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm ${
                isFollowing
                  ? "border-zinc-700 text-zinc-300"
                  : "border-ritual-accent/40 text-ritual-accent"
              }`}
            >
              {isFollowing ? (
                <UserCheck size={16} aria-hidden="true" />
              ) : (
                <UserPlus size={16} aria-hidden="true" />
              )}
              {isFollowing ? t("social.following") : t("social.follow")}
            </button>
          )}
        </div>
        {followError && (
          <p role="alert" className="mt-3 text-sm text-red-400">
            {followError}
          </p>
        )}
      </section>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
          >
            <dt className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-400">
              {stat.icon} {stat.label}
            </dt>
            <dd className="font-mono text-2xl text-white">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
