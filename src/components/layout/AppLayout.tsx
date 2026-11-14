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
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { useI18n, type TranslationKey } from "@/i18n";
import { getRank, rankProgress } from "@/utils/rank";
import { notificationService } from "@/services/notificationService";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { NotificationBell } from "./NotificationBell";

interface NavItem {
  to: string;
  labelKey: TranslationKey;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/app/dashboard", labelKey: "nav.dashboard", icon: <LayoutDashboard size={20} /> },
  { to: "/app/habits", labelKey: "nav.habits", icon: <CheckSquare size={20} /> },
  { to: "/app/goals", labelKey: "nav.goals", icon: <Target size={20} /> },
  { to: "/app/social", labelKey: "nav.social", icon: <Users size={20} /> },
  { to: "/app/shop", labelKey: "nav.shop", icon: <ShoppingBag size={20} /> },
  { to: "/app/inventory", labelKey: "nav.inventory", icon: <Package size={20} /> },
  { to: "/app/analytics", labelKey: "nav.analytics", icon: <Zap size={20} /> },
  { to: "/app/achievements", labelKey: "nav.achievements", icon: <Crown size={20} /> },
  { to: "/app/settings", labelKey: "nav.settings", icon: <Settings size={20} /> },
];

const MOBILE_QUICK: NavItem[] = [
  NAV_ITEMS[0]!,
  NAV_ITEMS[1]!,
  NAV_ITEMS[2]!,
  NAV_ITEMS[3]!,
  NAV_ITEMS[8]!,
];

export const AppLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useFocusTrap<HTMLDivElement>(menuOpen, () => setMenuOpen(false));

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (user && user.locale !== locale) setLocale(user.locale);
  }, [user, user?.locale, locale, setLocale]);

  useEffect(() => {
    void notificationService.ensureReminder().catch(() => undefined);
  }, [user?.id]);

  if (!user) return null;

  const rank = getRank(user.essence);
  const progress = rankProgress(user.essence);
  const navItems = user.isAdmin
    ? [...NAV_ITEMS, { to: "/app/admin", labelKey: "nav.admin" as const, icon: <ShieldCheck size={20} /> }]
    : NAV_ITEMS;

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-11 items-center gap-3 rounded-xl px-4 py-2.5 transition-colors ${
      isActive
        ? "bg-ritual-accent/10 text-ritual-accent border border-ritual-accent/20"
        : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent"
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
        Saltar al contenido
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

        <nav className="flex-1 space-y-1 overflow-y-auto px-4" aria-label="Principal">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass}>
              {item.icon}
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-zinc-900 bg-zinc-950/30 p-4">
          <NavLink
            to={`/app/profile/${user.username}`}
            className="mb-3 flex items-center gap-3 rounded-lg p-2 hover:bg-zinc-900/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 font-display font-bold text-ritual-accent">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                user.username.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-100">
                <span className="truncate">{user.username}</span>
                {user.isAdmin && (
                  <span className="flex items-center gap-1 rounded border border-yellow-500/30 bg-yellow-500/20 px-1.5 py-0.5 text-[10px] text-yellow-500">
                    <Shield size={10} /> ADMIN
                  </span>
                )}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-ritual-accent">
                {user.rank}
              </div>
            </div>
          </NavLink>

          <div className="mb-3">
            <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-zinc-500">
              <span>Progreso</span>
              <span>
                {user.essence} / {rank.next}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full border border-zinc-800 bg-zinc-800">
              <div
                className="h-full bg-ritual-accent transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex min-h-11 w-full items-center gap-2 border-t border-zinc-800/50 pt-2 text-xs uppercase tracking-widest text-zinc-500 transition-colors hover:text-red-500"
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
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-zinc-400 hover:text-white"
        >
          <Menu size={22} />
        </button>
        <NavLink to="/app/dashboard" className="flex items-center gap-2">
          <Skull className="text-ritual-accent" size={22} />
          <span className="font-display text-sm font-bold uppercase tracking-widest">
            RitualKiller
          </span>
        </NavLink>
        <NotificationBell />
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[80] md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
            tabIndex={-1}
            className="safe-pt absolute inset-y-0 left-0 w-[min(20rem,85vw)] overflow-y-auto border-r border-zinc-800 bg-ritual-dark p-4 outline-none"
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display font-bold uppercase tracking-widest">Menú</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Cerrar menú"
                data-autofocus
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-zinc-400"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="space-y-1" aria-label="Menú móvil">
              {navItems.map((item) => (
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
            </nav>
            <div className="mt-6 border-t border-zinc-800 pt-4">
              <NavLink
                to={`/app/profile/${user.username}`}
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
        aria-label="Accesos rápidos"
      >
        {MOBILE_QUICK.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            aria-label={t(item.labelKey)}
            className={({ isActive }) =>
              `flex min-h-12 min-w-12 flex-col items-center justify-center gap-0.5 rounded-lg ${
                isActive ? "text-ritual-accent" : "text-zinc-600"
              }`
            }
          >
            {item.icon}
            <span className="text-[9px] uppercase tracking-wide">{t(item.labelKey)}</span>
          </NavLink>
        ))}
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
