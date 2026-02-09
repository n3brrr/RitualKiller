import React, { lazy } from "react";
import { createHashRouter, RouterProvider, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import "./styles/main.css";
import { useAuthStore } from "./features/auth/stores/useAuthStore";

// Lazy loading primary routes
const LandingPage = lazy(() => import("./features/auth/pages/LandingPage"));
const LoginPage = lazy(() => import("./features/auth/pages/LoginPage"));

const authLoader = async () => {
  return useAuthStore.getState().user;
};

const protectedLoader = async () => {
  const user = useAuthStore.getState().user;
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
};

const router = createHashRouter([
  {
    path: "/",
    errorElement: (
      <ErrorBoundary>
        <div>Error loading app</div>
      </ErrorBoundary>
    ),
    children: [
      {
        index: true,
        loader: authLoader,
        element: <LandingPage />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "app",
        element: <AppLayout />,
        loader: protectedLoader,
        children: [
          {
            path: "dashboard",
            async lazy() {
              const { default: Dashboard, dashboardLoader } =
                await import("./features/dashboard/pages/DashboardPage");
              return { Component: Dashboard, loader: dashboardLoader };
            },
          },
          {
            path: "habits",
            async lazy() {
              const { default: HabitsPage, habitsLoader } =
                await import("./features/rituals/pages/HabitsPage");
              return { Component: HabitsPage, loader: habitsLoader };
            },
          },
          {
            path: "social",
            async lazy() {
              const { default: SocialPage } =
                await import("./features/social/pages/SocialPage");
              return { Component: SocialPage };
            },
          },
          {
            path: "shop",
            async lazy() {
              const { default: ShopPage } =
                await import("./features/shop/pages/ShopPage");
              return { Component: ShopPage };
            },
          },
          {
            path: "",
            element: <Navigate to="dashboard" replace />,
          },
        ],
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

import { AppProvider } from "./contexts/AppContext";

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
