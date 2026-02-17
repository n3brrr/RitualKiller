import { supabase } from '../lib/supabase';

export const signUpWithEmail = async (email: string, password: string, username?: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app/dashboard`,
        data: {
          username: username || email.split('@')[0],
        },
      },
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error al registrar:', error);
    return { data: null, error };
  }
};



export const signInWithEmail = async (email: string, password: string) => {
  // Verificar si es el usuario admin (soporta tanto email@gmail.com como el usuario simple 'admin')
  const isTestAdmin = (email.toLowerCase() === 'admin' && password === 'admin');

  if (isTestAdmin) {
    // Retornar datos mock del admin sin usar Supabase
    return {
      data: {
        user: {
          id: 'admin-user-id-12345',
          email: 'admin@gmail.com',
          user_metadata: {
            username: 'admin',
            isAdmin: true,
          },
        },
        session: null, // No hay sesión real de Supabase
      },
      error: null,
    };
  }

  // Si no es admin, intentar con Supabase
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error al iniciar sesión:', error);
    return { data: null, error };
  }
};

export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Error al restablecer contraseña:', error);
    return { error };
  }
};

export const updatePassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Error al restablecer contraseña:', error);
    return { error };
  }
};
