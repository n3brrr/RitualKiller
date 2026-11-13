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
const AchievementsPage = lazy(() => import("./features/gamification/pages/AchievementsPage"));
const SettingsPage = lazy(() => import("./features/settings/pages/SettingsPage"));
const NotificationsPage = lazy(() => import("./features/notifications/pages/NotificationsPage"));
const AdminPage = lazy(() => import("./features/admin/pages/AdminPage"));
const ProfilePage = lazy(() => import("./features/users/pages/ProfilePage"));

function page(node: React.ReactNode) {
  return <Suspense fallback={<Loading />}>{node}</Suspense>;
}

const PAGE_TITLES: Record<string, string> = {
  "/": "RitualKiller — Convierte tu disciplina en un ritual",
  "/login": "Entrar · RitualKiller",
  "/reset-password": "Restablecer contraseña · RitualKiller",
  "/auth/callback": "Verificando sesión · RitualKiller",
  "/app/dashboard": "Altar · RitualKiller",
  "/app/habits": "Rituales · RitualKiller",
  "/app/goals": "Objetivos · RitualKiller",
  "/app/social": "Coven · RitualKiller",
  "/app/shop": "Mercado · RitualKiller",
  "/app/inventory": "Inventario · RitualKiller",
  "/app/analytics": "Analíticas · RitualKiller",
  "/app/achievements": "Logros · RitualKiller",
  "/app/settings": "Ajustes · RitualKiller",
  "/app/notifications": "Notificaciones · RitualKiller",
  "/app/admin": "Admin · RitualKiller",
};

function RootLayout() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
    document.title = pathname.startsWith("/app/profile/")
      ? "Perfil · RitualKiller"
      : (PAGE_TITLES[pathname] ?? "RitualKiller");
  }, [pathname, hash]);

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
            element: (
              <AdminRoute>{page(<AdminPage />)}</AdminRoute>
            ),
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
