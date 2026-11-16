import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Skull,
  LayoutDashboard,
  CheckSquare,
  Target,
  ShoppingBag,
  Users,
  LogOut,
  Shield,
  Crown,
  Zap,
  ShieldCheck,
  Package,
  Settings,
  Menu,
  X,
  Flame,
} from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { translateRank, useI18n, type TranslationKey } from "@/i18n";
import { getRank, rankProgress } from "@/utils/rank";
import { useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notificationService";
import { settingsService } from "@/services/settingsService";
import { useSettings } from "@/hooks/useSettings";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useRituals } from "@/hooks/useRituals";
import { NotificationBell } from "./NotificationBell";
import { Avatar } from "@/components/ui/Avatar";

type NavGroupID = "main" | "circle" | "record" | "account";

interface NavItem {
  to: string;
  labelKey: TranslationKey;
  icon: React.ReactNode;
  group: NavGroupID;
}

const NAV_GROUPS: Array<{ id: NavGroupID; labelKey: TranslationKey }> = [
  { id: "main", labelKey: "nav.group.main" },
  { id: "circle", labelKey: "nav.group.circle" },
  { id: "record", labelKey: "nav.group.record" },
  { id: "account", labelKey: "nav.group.account" },
];

const NAV_ITEMS: NavItem[] = [
  {
    to: "/app/dashboard",
    labelKey: "nav.dashboard",
    icon: <LayoutDashboard size={20} />,
    group: "main",
  },
  {
    to: "/app/habits",
    labelKey: "nav.habits",
    icon: <CheckSquare size={20} />,
    group: "main",
  },
  { to: "/app/goals", labelKey: "nav.goals", icon: <Target size={20} />, group: "main" },
  {
    to: "/app/social",
    labelKey: "nav.social",
    icon: <Users size={20} />,
    group: "circle",
  },
  {
    to: "/app/shop",
    labelKey: "nav.shop",
    icon: <ShoppingBag size={20} />,
    group: "circle",
  },
  {
    to: "/app/inventory",
    labelKey: "nav.inventory",
    icon: <Package size={20} />,
    group: "circle",
  },
  {
    to: "/app/analytics",
    labelKey: "nav.analytics",
    icon: <Zap size={20} />,
    group: "record",
  },
  {
    to: "/app/achievements",
    labelKey: "nav.achievements",
    icon: <Crown size={20} />,
    group: "record",
  },
  {
    to: "/app/settings",
    labelKey: "nav.settings",
    icon: <Settings size={20} />,
    group: "account",
  },
];

const MOBILE_QUICK = [NAV_ITEMS[0]!, NAV_ITEMS[1]!, NAV_ITEMS[2]!, NAV_ITEMS[3]!];

export const AppLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const { rituals } = useRituals();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [progressMounted, setProgressMounted] = useState(false);
  const menuRef = useFocusTrap<HTMLDivElement>(menuOpen, () => setMenuOpen(false));

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    setProgressMounted(true);
  }, []);

  useEffect(() => {
    if (user && user.locale !== locale) setLocale(user.locale);
  }, [user, user?.locale, locale, setLocale]);

  const { settings } = useSettings();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const timezone = settings?.timezone;

  // Align the stored time zone with the device first, so the reminder and the
  // server's notion of "today" use the user's local day.
  useEffect(() => {
    if (!userId || !timezone) return;
    let cancelled = false;
    void (async () => {
      try {
        const changed = await settingsService.syncTimezone(userId, timezone);
        if (changed && !cancelled) {
          void queryClient.invalidateQueries({ queryKey: ["settings", userId] });
          void queryClient.invalidateQueries({ queryKey: ["rituals", userId] });
        }
      } catch {
        // Non-blocking: the server keeps using the previous time zone.
      }
      await notificationService.ensureReminder().catch(() => undefined);
      if (!cancelled) {
        void queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, timezone, queryClient]);

  if (!user) return null;

  const rank = getRank(user.essence);
  const progress = rankProgress(user.essence);
  const bestStreak = Math.max(...rituals.map((ritual) => ritual.streak), 0);
  const navItems = user.isAdmin
    ? [
        ...NAV_ITEMS,
        {
          to: "/app/admin",
          labelKey: "nav.admin" as const,
          icon: <ShieldCheck size={20} />,
          group: "account" as const,
        },
      ]
    : NAV_ITEMS;

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `relative flex min-h-11 items-center gap-3 rounded-xl border px-4 py-2.5 transition-colors ${
      isActive
        ? "border-ritual-accent/20 bg-ritual-accent/10 text-ritual-accent before:absolute before:left-0 before:top-1/2 before:h-6 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-ritual-accent"
        : "border-transparent text-zinc-400 hover:border-ritual-accent/30 hover:bg-zinc-900 hover:text-zinc-200"
    }`;

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-ritual-black text-zinc-100 flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ritual-accent focus:px-4 focus:py-2 focus:font-bold focus:text-black"
      >
        {t("shell.skipToContent")}
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-50 hidden h-full w-64 flex-col border-r border-zinc-900 bg-ritual-dark/95 backdrop-blur md:flex">
        <div className="flex items-center gap-3 p-6">
          <Skull className="h-8 w-8 text-ritual-accent" />
          <span className="flex-1 font-display text-xl font-bold tracking-wider text-white">
            RitualKiller
          </span>
          <NotificationBell />
        </div>

        <nav
          className="flex-1 space-y-4 overflow-y-auto px-4 pb-2"
          aria-label={t("shell.primaryNav")}
        >
          {NAV_GROUPS.map((group) => {
            const items = navItems.filter((item) => item.group === group.id);
            if (items.length === 0) return null;
            return (
              <div key={group.id}>
                <p className="mb-1 px-4 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                  {t(group.labelKey)}
                </p>
                <div className="space-y-1">
                  {items.map((item) => (
                    <NavLink key={item.to} to={item.to} className={navClass}>
                      {item.icon}
                      <span>{t(item.labelKey)}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-zinc-900 bg-zinc-950/30 p-4">
          <NavLink
            to={`/app/profile/${encodeURIComponent(user.username)}`}
            className="mb-3 flex items-center gap-3 rounded-lg p-2 hover:bg-zinc-900/50"
          >
            <Avatar
              name={user.username}
              url={user.avatar_url ?? null}
              shadow={user.inventory.includes("shadow_amulet")}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-100">
                <span className="truncate">{user.username}</span>
                {user.isAdmin && (
                  <span className="flex items-center gap-1 rounded border border-yellow-500/30 bg-yellow-500/20 px-1.5 py-0.5 text-xs text-yellow-500">
                    <Shield size={10} /> ADMIN
                  </span>
                )}
              </div>
              <div className="text-xs uppercase tracking-wider text-ritual-accent">
                {translateRank(user.rank, t)}
              </div>
            </div>
          </NavLink>

          <div className="mb-3">
            <div className="mb-1 flex justify-between text-xs uppercase tracking-wider text-zinc-400">
              <span>{t("shell.progress")}</span>
              <span>
                {user.essence} / {rank.next}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full border border-zinc-800 bg-zinc-800">
              <div
                className="h-full bg-ritual-accent transition-all duration-500"
                style={{ width: `${progressMounted ? progress : 0}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex min-h-11 w-full items-center gap-2 border-t border-zinc-800/50 pt-2 text-xs uppercase tracking-widest text-zinc-400 transition-colors hover:text-red-500"
          >
            <LogOut size={14} />
            <span>{t("auth.logout")}</span>
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="safe-pt fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-zinc-900 bg-ritual-dark/95 px-4 py-2 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label={t("shell.openMenu")}
          aria-expanded={menuOpen}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-zinc-400 hover:text-white"
        >
          <Menu size={22} />
        </button>
        <NavLink
          to="/app/dashboard"
          className="flex min-w-0 flex-col items-center gap-0.5"
        >
          <span className="flex items-center gap-2">
            <Skull className="text-ritual-accent" size={22} />
            <span className="font-display text-sm font-bold uppercase tracking-widest">
              RitualKiller
            </span>
          </span>
          <span className="flex items-center gap-2 font-mono text-[11px]">
            <span
              aria-label={t("shell.essenceLabel", { count: user.essence })}
              className="inline-flex items-center gap-1 text-ritual-accent"
            >
              <Zap size={11} aria-hidden="true" />
              {user.essence}
            </span>
            <span
              aria-label={t("shell.streakLabel", { count: bestStreak })}
              className="inline-flex items-center gap-1 text-yellow-500"
            >
              <Flame size={11} aria-hidden="true" />
              {bestStreak}
            </span>
          </span>
        </NavLink>
        <NotificationBell />
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[80] md:hidden">
          <button
            type="button"
            aria-label={t("shell.closeMenu")}
            className="absolute inset-0 animate-fade-in bg-black/80 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("shell.menu")}
            tabIndex={-1}
            className="safe-pt absolute inset-y-0 left-0 w-[min(20rem,85vw)] animate-slide-in-left overflow-y-auto border-r border-zinc-800 bg-ritual-dark p-4 outline-none"
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display font-bold uppercase tracking-widest">
                {t("shell.menu")}
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label={t("shell.closeMenu")}
                data-autofocus
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-zinc-400"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="space-y-4" aria-label={t("shell.mobileMenu")}>
              {NAV_GROUPS.map((group) => {
                const items = navItems.filter((item) => item.group === group.id);
                if (items.length === 0) return null;
                return (
                  <div key={group.id}>
                    <p className="mb-1 px-4 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                      {t(group.labelKey)}
                    </p>
                    <div className="space-y-1">
                      {items.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => setMenuOpen(false)}
                          className={navClass}
                        >
                          {item.icon}
                          <span>{t(item.labelKey)}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                );
              })}
            </nav>
            <div className="mt-6 border-t border-zinc-800 pt-4">
              <NavLink
                to={`/app/profile/${encodeURIComponent(user.username)}`}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-11 items-center gap-3 rounded-lg px-4 py-2 text-zinc-400"
              >
                <Shield size={18} /> {user.username}
              </NavLink>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="flex min-h-11 w-full items-center gap-3 rounded-lg px-4 py-2 text-left text-red-400"
              >
                <LogOut size={18} /> {t("auth.logout")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav
        className="safe-pb fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-zinc-900 bg-ritual-dark/95 px-2 pt-1 backdrop-blur md:hidden"
        aria-label={t("shell.quickLinks")}
      >
        {MOBILE_QUICK.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            aria-label={t(item.labelKey)}
            className={({ isActive }) =>
              `flex min-h-12 min-w-12 flex-col items-center justify-center gap-0.5 rounded-lg ${
                isActive ? "text-ritual-accent" : "text-zinc-400"
              }`
            }
          >
            {item.icon}
            <span className="text-[11px] uppercase tracking-wide">
              {t(item.labelKey)}
            </span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label={t("nav.more")}
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          className={`flex min-h-12 min-w-12 flex-col items-center justify-center gap-0.5 rounded-lg ${
            menuOpen ? "text-ritual-accent" : "text-zinc-400"
          }`}
        >
          <Menu size={20} />
          <span className="text-[11px] uppercase tracking-wide">{t("nav.more")}</span>
        </button>
      </nav>

      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-20 sm:px-6 md:ml-64 md:px-8 md:pb-10 md:pt-8"
      >
        <Outlet />
      </main>
    </div>
  );
};
