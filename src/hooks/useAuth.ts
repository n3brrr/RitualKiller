import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * Hook personalizado para manejar el estado de autenticación del usuario usando Supabase.
 * Proporciona el usuario autenticado y un indicador de carga.
 */
export const useAuth = () => {
  // Estado para almacenar el usuario actualmente autenticado
  const [user, setUser] = useState<SupabaseUser | null>(null);
  // Estado para controlar si la autenticación está cargando
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtiene la sesión inicial del usuario al montar el componente
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // En caso de error, lo mostramos por consola
        console.error('Error al obtener la sesión:', error);
      }
      // Establece el usuario si hay una sesión activa, si no, lo pone como null
      setUser(session?.user ?? null);
      // Indica que la carga ha finalizado
      setLoading(false);
    });

    // Se suscribe a los cambios de autenticación (login, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Actualiza el estado del usuario según la nueva sesión
      setUser(session?.user ?? null);
      // Indica que la carga ha finalizado tras el cambio de autenticación
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