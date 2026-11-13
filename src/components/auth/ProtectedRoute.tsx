import React from "react";
import { Navigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import Loading from "@/components/animations/Loading";

function FullPageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loading />
    </div>
  );
}

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, user, loading, error, refreshProfile } = useAuth();

  if (loading) return <FullPageLoader />;
  if (!session) return <Navigate to="/login" replace />;

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-950 border border-red-500/30 rounded-xl p-6 text-center">
          <AlertCircle className="mx-auto mb-3 text-red-500" size={28} />
          <h1 className="text-lg font-bold text-white mb-2">No se pudo cargar tu perfil</h1>
          <p className="text-sm text-zinc-400 mb-4">{error.message}</p>
          <button
            onClick={() => void refreshProfile()}
            className="min-h-11 px-4 py-2 bg-ritual-accent text-black font-bold rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!user) return <FullPageLoader />;
  return <>{children}</>;
};

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user?.isAdmin) return <Navigate to="/app/dashboard" replace />;
  return <>{children}</>;
};
