import React, { lazy, Suspense } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { User } from "./types/index.ts";
import { Layout } from "./components/Layout.tsx";
import { AppProvider, useAppContext } from "./contexts/AppContext.tsx";
import { ErrorBoundary } from "./components/ui/ErrorBoundary.tsx";
import "./styles/main.css";

// Lazy loading de páginas para mejorar el rendimiento
const LandingPage = lazy(() => import("./pages/LandingPage.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const HabitsPage = lazy(() => import("./pages/HabitsPage.tsx"));
const SocialPage = lazy(() => import("./pages/SocialPage.tsx"));
const ShopPage = lazy(() => import("./pages/ShopPage.tsx"));
const LoginPage = lazy(() => import("./pages/LoginPage.tsx"));

// Componente mostrado mientras se cargan otros componentes (fallback de carga)
const LoadingFallback = () => (
  <div className="bg-ritual-black h-screen flex items-center justify-center text-ritual-accent font-display text-xl animate-pulse">
    Cargando...
  </div>
);

// Protege rutas que requieren autenticación
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAppContext();

  if (!user) {
    // Redirige si no hay usuario autenticado
    return <Navigate to="/" replace />;
  }

  return (
    <Layout user={user} onLogout={logout}>
      {children}
    </Layout>
  );
};

// Componente principal de la aplicación
function AppContent() {
  const { user, rituals, logs, setUser, loading } = useAppContext();

  if (loading) {
    // Muestra un mensaje de carga inicial mientras se resuelve el contexto
    return (
      <div className="bg-ritual-black h-screen flex items-center justify-center text-ritual-accent font-display text-xl animate-pulse">
        Loading Rituals...
      </div>
    );
  }

  return (
    <HashRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route
            path="/"
            element={
              user ? (
                <Navigate to="/app/dashboard" replace />
              ) : (
                <Suspense fallback={<LoadingFallback />}>
                  <LandingPage onAuth={setUser} />
                </Suspense>
              )
            }
          />

          <Route 
            path="/login" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <LoginPage onAuth={setUser} />
              </Suspense>
            } 
          />

          <Route
            path="/app/dashboard"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <Dashboard />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/habits"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <HabitsPage />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/social"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <SocialPage />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/shop"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <ShopPage />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* Redirección para rutas no existentes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}

// Render principal de la aplicación, manejando errores y contexto global
function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
