import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

/**
 * Hook personalizado para manejar el estado de autenticación del usuario usando Supabase.
 * Proporciona el usuario autenticado y un indicador de carga.
 */
export const useAuth = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtiene la sesión inicial del usuario al montar el componente
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Error al obtener la sesión:", error);
      }
      // Establece el usuario si hay una sesión activa, si no, lo pone como null
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Se suscribe a los cambios de autenticación (login, logout, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Limpia la suscripción al desmontar el componente para evitar fugas de memoria
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Retorna el usuario autenticado y el estado de carga
  return { user, loading };
};
