/*
 * Contexto global de la aplicación: gestiona usuario, rituales y logs, 
 * maneja persistencia en localStorage y sincronización con autenticación.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Ritual, RitualLog } from '@/types';
import { useAuth } from '@/hooks/useAuth';

// Tipado del contexto, expone funciones y datos principales de la app globalmente
interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  rituals: Ritual[];
  setRituals: (rituals: Ritual[] | ((prev: Ritual[]) => Ritual[])) => void;
  logs: RitualLog[];
  setLogs: (logs: RitualLog[] | ((prev: RitualLog[]) => RitualLog[])) => void;
  loading: boolean;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Hook para consumir el contexto en cualquier componente
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

// Proveedor de contexto: maneja estado global y sincronización con localStorage/autenticación
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [logs, setLogs] = useState<RitualLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Sincroniza el usuario autenticado con el estado local.
  useEffect(() => {
    if (authUser && !user) {
      const storedUser = localStorage.getItem("rk_user");
      if (storedUser) {
        // Intenta parsear el usuario almacenado en localStorage
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Error parsing stored user:", error);
          // Si hay datos corruptos, crea usuario por defecto
          setUser({
            id: authUser.id,
            username: authUser.email?.split("@")[0] || "Desconocido",
            essence: 0,
            rank: "Iniciado",
            inventory: [],
            created_at: new Date().toISOString(),
          });
        }
      } else {
        // Genera usuario por defecto o admin si corresponde
        const isAdminUser = authUser.id === 'admin-user-id-12345' || 
                           authUser.user_metadata?.isAdmin === true;
        
        setUser({
          id: authUser.id,
          username: authUser.user_metadata?.username || 
                   authUser.email?.split("@")[0] || 
                   "Desconocido",
          essence: isAdminUser ? 10000 : 0,
          rank: isAdminUser ? "Semidiós" : "Iniciado",
          inventory: isAdminUser ? ['admin-badge'] : [],
          created_at: new Date().toISOString(),
          isAdmin: isAdminUser,
        });
      }
    }
    if (!authLoading) {
      setLoading(false);
    }
  }, [authUser, authLoading, user]);

  // Lee rituals y logs almacenados la primera vez que se monta el componente
  useEffect(() => {
    try {
      const storedRituals = localStorage.getItem("rk_rituals");
      const storedLogs = localStorage.getItem("rk_logs");

      if (storedRituals) {
        const parsed = JSON.parse(storedRituals);
        if (Array.isArray(parsed)) {
          setRituals(parsed);
        }
      }
      if (storedLogs) {
        const parsed = JSON.parse(storedLogs);
        if (Array.isArray(parsed)) {
          setLogs(parsed);
        }
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error);
    }
  }, []);

  // Guarda el usuario al cambiar, si existe
  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem("rk_user", JSON.stringify(user));
      } catch (error) {
        console.error("Error saving user to localStorage:", error);
      }
    }
  }, [user]);

  // Guarda rituales en localStorage al modificarse
  useEffect(() => {
    try {
      localStorage.setItem("rk_rituals", JSON.stringify(rituals));
    } catch (error) {
      console.error("Error saving rituals to localStorage:", error);
    }
  }, [rituals]);

  // Guarda logs en localStorage al modificarse
  useEffect(() => {
    try {
      localStorage.setItem("rk_logs", JSON.stringify(logs));
    } catch (error) {
      console.error("Error saving logs to localStorage:", error);
    }
  }, [logs]);

  // Elimina todo del contexto y localStorage, y hace logout real usando Supabase
  const logout = async () => {
    setUser(null);
    setRituals([]);
    setLogs([]);
    localStorage.removeItem("rk_user");
    localStorage.removeItem("rk_rituals");
    localStorage.removeItem("rk_logs");
    try {
      const { supabase } = await import("../lib/supabase");
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        rituals,
        setRituals,
        logs,
        setLogs,
        loading,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
