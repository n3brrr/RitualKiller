import React, { lazy, Suspense, useEffect } from "react";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  useLocation,
} from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { RouteError } from "./components/ui/RouteError";
import { ProtectedRoute, AdminRoute } from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./features/auth/AuthProvider";
import { useI18n, type TranslationKey } from "./i18n";
import Loading from "./components/animations/Loading";
import "./styles/main.css";

const LandingPage = lazy(() => import("./features/auth/pages/LandingPage"));
const LoginPage = lazy(() => import("./features/auth/pages/LoginPage"));
const ResetPasswordPage = lazy(() => import("./features/auth/pages/ResetPasswordPage"));
const AuthCallbackPage = lazy(() => import("./features/auth/pages/AuthCallbackPage"));
const DashboardPage = lazy(() => import("./features/dashboard/pages/DashboardPage"));
const HabitsPage = lazy(() => import("./features/rituals/pages/HabitsPage"));
const GoalsPage = lazy(() => import("./features/goals/pages/GoalsPage"));
const SocialPage = lazy(() => import("./features/social/pages/SocialPage"));
const ShopPage = lazy(() => import("./features/shop/pages/ShopPage"));
const InventoryPage = lazy(() => import("./features/inventory/pages/InventoryPage"));
const AnalyticsPage = lazy(() => import("./features/analytics/pages/AnalyticsPage"));
const AchievementsPage = lazy(
  () => import("./features/gamification/pages/AchievementsPage"),
);
const SettingsPage = lazy(() => import("./features/settings/pages/SettingsPage"));
const NotificationsPage = lazy(
  () => import("./features/notifications/pages/NotificationsPage"),
);
const AdminPage = lazy(() => import("./features/admin/pages/AdminPage"));
const ProfilePage = lazy(() => import("./features/users/pages/ProfilePage"));

function page(node: React.ReactNode) {
  return <Suspense fallback={<Loading />}>{node}</Suspense>;
}

const PAGE_TITLES: Record<string, TranslationKey> = {
  "/login": "auth.loginTitle",
  "/reset-password": "auth.resetTitle",
  "/auth/callback": "auth.verifying",
  "/app/dashboard": "nav.dashboard",
  "/app/habits": "nav.habits",
  "/app/goals": "nav.goals",
  "/app/social": "nav.social",
  "/app/shop": "nav.shop",
  "/app/inventory": "nav.inventory",
  "/app/analytics": "nav.analytics",
  "/app/achievements": "nav.achievements",
  "/app/settings": "nav.settings",
  "/app/notifications": "nav.notifications",
  "/app/admin": "nav.admin",
};

function RootLayout() {
  const { pathname, hash } = useLocation();
  const { t } = useI18n();

  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
    const key = pathname.startsWith("/app/profile/")
      ? "profile.title"
      : PAGE_TITLES[pathname];
    document.title =
      pathname === "/"
        ? t("landing.title")
        : key
          ? `${t(key)} · RitualKiller`
          : "RitualKiller";
  }, [pathname, hash, t]);

  return <Outlet />;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: page(<LandingPage />) },
      { path: "login", element: page(<LoginPage />) },
      { path: "reset-password", element: page(<ResetPasswordPage />) },
      { path: "auth/callback", element: page(<AuthCallbackPage />) },
      {
        path: "app",
        element: (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: "dashboard", element: page(<DashboardPage />) },
          { path: "habits", element: page(<HabitsPage />) },
          { path: "goals", element: page(<GoalsPage />) },
          { path: "social", element: page(<SocialPage />) },
          { path: "shop", element: page(<ShopPage />) },
          { path: "inventory", element: page(<InventoryPage />) },
          { path: "analytics", element: page(<AnalyticsPage />) },
          { path: "achievements", element: page(<AchievementsPage />) },
          { path: "settings", element: page(<SettingsPage />) },
          { path: "notifications", element: page(<NotificationsPage />) },
          {
            path: "admin",
            element: <AdminRoute>{page(<AdminPage />)}</AdminRoute>,
          },
          { path: "profile/:username", element: page(<ProfilePage />) },
        ],
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
