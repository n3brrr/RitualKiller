import React, { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Ritual, RitualLog, SocialPost, User } from "./types/index.ts";
import { Layout } from "./components/Layout.tsx";
import LandingPage from "./pages/LandingPage.tsx";
import Dashboard from "./pages/Dashboard.tsx"; // Ensure extension match
import HabitsPage from "./pages/HabitsPage.tsx";
import SocialPage from "./pages/SocialPage.tsx";
import ShopPage from "./pages/ShopPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import { useAuth } from "./hooks/useAuth.ts";
import "./styles/main.css";

// --- Mock Data Constants --- (If needed, otherwise remove)

function App() {
  const { user: authUser, loading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [logs, setLogs] = useState<RitualLog[]>([]);

  // Effect to sync authUser with local user state, but allow local overrides
  // (IMPORTANT: This is a hack for the TFG/Demo nature where we might not have a full backend user profile yet)
  useEffect(() => {
    if (authUser && !user) {
      // Here we'd ideally fetch the full profile from Supabase 'profiles' table.
      // For now, we'll try to load from local storage OR create a placeholder from auth user.
      const storedUser = localStorage.getItem("rk_user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        // Create a default user structure if not in local storage but authed
        setUser({
          id: authUser.id,
          username: authUser.email?.split("@")[0] || "Unknown",
          essence: 0,
          rank: "Unkindled",
          inventory: [],
          created_at: new Date().toISOString(),
        } as User);
      }
    }
  }, [authUser]);

  // Initialize Data from LocalStorage
  useEffect(() => {
    const storedRituals = localStorage.getItem("rk_rituals");
    const storedLogs = localStorage.getItem("rk_logs");

    if (storedRituals) setRituals(JSON.parse(storedRituals));
    if (storedLogs) setLogs(JSON.parse(storedLogs));
  }, []);

  // Save to LocalStorage on changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("rk_user", JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("rk_rituals", JSON.stringify(rituals));
  }, [rituals]);

  useEffect(() => {
    localStorage.setItem("rk_logs", JSON.stringify(logs));
  }, [logs]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("rk_user");
    // Also sign out from Supabase if needed: supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="bg-ritual-black h-screen flex items-center justify-center text-ritual-accent font-display text-xl animate-pulse">
        Loading Rituals...
      </div>
    );
  }

  // Protected Route Wrapper
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user) return <Navigate to="/" replace />;
    return (
      <Layout user={user} onLogout={handleLogout}>
        {children}
      </Layout>
    );
  };

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/app/dashboard" replace />
            ) : (
              <LandingPage onAuth={setUser} />
            )
          }
        />

        <Route path="/login" element={<LoginPage onAuth={setUser} />} />

        <Route
          path="/app/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard user={user!} rituals={rituals} logs={logs} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/app/habits"
          element={
            <ProtectedRoute>
              <HabitsPage
                rituals={rituals}
                setRituals={setRituals}
                logs={logs}
                setLogs={setLogs}
                user={user!}
                setUser={setUser}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/app/social"
          element={
            <ProtectedRoute>
              <SocialPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/app/shop"
          element={
            <ProtectedRoute>
              <ShopPage user={user!} setUser={setUser} />
            </ProtectedRoute>
          }
        />

        {/* Catch all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
