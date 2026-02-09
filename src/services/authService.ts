import { supabase } from '../lib/supabase';

export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/app/dashboard`,
      },
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    return { data: null, error };
  }
};

export const signInWithGitHub = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/app/dashboard`,
      },
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error signing in with GitHub:', error);
    return { data: null, error };
  }
};

export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app/dashboard`,
      },
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error signing up:', error);
    return { data: null, error };
  }
};

// Credenciales de administrador para pruebas
const ADMIN_CREDENTIALS = {
  email: 'admin@gmail.com',
  password: '123456',
  username: 'admin',
  id: 'admin-user-id-12345',
};

export const signInWithEmail = async (email: string, password: string) => {
  // Verificar si es el usuario admin
  if (email.toLowerCase() === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
    // Retornar datos mock del admin sin usar Supabase
    return {
      data: {
        user: {
          id: ADMIN_CREDENTIALS.id,
          email: `${ADMIN_CREDENTIALS.email}@ritualkiller.local`,
          user_metadata: {
            username: ADMIN_CREDENTIALS.username,
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
    console.error('Error signing in:', error);
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
    console.error('Error resetting password:', error);
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
    console.error('Error updating password:', error);
    return { error };
  }
};
