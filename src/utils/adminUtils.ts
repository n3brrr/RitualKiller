import { User } from '../types';

/**
 * Verifica si un usuario es administrador
 */
export const isAdmin = (user: User | null): boolean => {
  return user?.isAdmin === true || user?.username === 'admin';
};

/**
 * Obtiene información del usuario admin para pruebas
 */
export const getAdminUser = (): User => {
  return {
    id: 'admin-user-id-12345',
    username: 'admin',
    essence: 100000,
    rank: 'Demi-God',
    inventory: ['admin-badge', 'crown-of-silence', 'neon-skull'],
    created_at: new Date().toISOString(),
    isAdmin: true,
  };
};

/**
 * Verifica si las credenciales son del admin
 */
export const isAdminCredentials = (email: string, password: string): boolean => {
  return email.toLowerCase() === 'admin' && password === 'admin';
};
