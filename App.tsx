import React, { useState, useEffect, useRef } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Ritual, UserProfile, RitualLog, SocialPost } from "./types";
import { Layout } from "./src/components/Layout.tsx";
import  LandingPage  from "./src/pages/LandingPages.tsx";
import  Dashboard  from "./src/pages/Dashboard";
import  HabitsPage  from "./src/pages/HabitsPage.tsx";
import  SocialPage  from "./src/pages/SocialPage.tsx";
import  ShopPage  from "./src/pages/ShopPage.tsx";
import { useAuth } from "./src/hooks/useAuth.ts";   
import setUser from "./src/pages/LandingPages.tsx";


// --- Mock Data Constants ---


const MOCK_POSTS: SocialPost[] = [
  {
    id: "1",
    author: "ShadowWalker",
    content:
      "Just completed a 30-day meditation streak. My mind is a fortress.",
    likes: 42,
    timestamp: "2h ago",
  },
  {
    id: "2",
    author: "System",
    content: "User @CryptKeeper has ascended to Adept rank!",
    likes: 15,
    timestamp: "5h ago",
    isSystem: true,
  },
  {
    id: "3",
    author: "IronWill",
    content: "The 5AM run ritual is brutal but effective. Who is with me?",
    likes: 28,
    timestamp: "1d ago",
  },
];



// --- Main App Logic ---

function App() {
    const { user, loading } = useAuth();
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [logs, setLogs] = useState<RitualLog[]>([]);

  if (loading) {
    return <div className="bg-black h-screen flex items-center justify-center text-ritual-accent" >Loading...</div>;
    return (
        <HashRouter>
        <Routes>
            <Route path="/" element={user ? <Navigate to="/app/dashboard" /> : <LandingPage />}/>
            <Route path="/app/*" element={user ? <AppRoutes user={user}/> : <Navigate to="/" />} />
            
        </Routes>
        </HashRouter>
    )
}

  // Initialize from LocalStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("rk_user");
    const storedRituals = localStorage.getItem("rk_rituals");
    const storedLogs = localStorage.getItem("rk_logs");

    if (storedUser) setUser(JSON.parse(storedUser));
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
  };

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
      </Routes>
    </HashRouter>
  );
}

export default App;
