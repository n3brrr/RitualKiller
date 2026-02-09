# 👤 Usuario Administrador para Pruebas

## Credenciales de Acceso

Para acceder como administrador en modo de desarrollo/pruebas:

- **Usuario/Email:** `admin`
- **Contraseña:** `admin`

## Características del Usuario Admin

El usuario administrador tiene las siguientes características especiales:

- ✅ **Esencia inicial:** 10,000 (en lugar de 0)
- ✅ **Rango:** "Demi-God" (máximo nivel)
- ✅ **Inventario inicial:** Incluye items especiales como 'admin-badge'
- ✅ **Badge visual:** Indicador "ADMIN" visible en el perfil
- ✅ **Acceso completo:** Todas las funcionalidades disponibles

## Cómo Usar

1. Ve a la página de Login (`/login`)
2. En el campo de email/usuario, escribe: `admin`
3. En el campo de contraseña, escribe: `admin`
4. Haz clic en "Iniciar Sesión"

## Nota de Seguridad

⚠️ **IMPORTANTE:** Este usuario admin solo funciona en modo desarrollo. En producción, deberías:

1. Eliminar las credenciales hardcodeadas
2. Implementar un sistema de autenticación real con Supabase
3. Usar políticas de seguridad (RLS) en Supabase para controlar acceso admin

## Archivos Modificados

- `src/services/authService.ts` - Lógica de autenticación admin
- `src/pages/LoginPage.tsx` - Manejo de login admin
- `src/types/index.ts` - Agregado campo `isAdmin` al tipo User
- `src/utils/adminUtils.ts` - Utilidades para verificar admin
- `src/components/Layout.tsx` - Indicador visual de admin

## Utilidades Disponibles

```typescript
import { isAdmin, getAdminUser, isAdminCredentials } from '../utils/adminUtils';

// Verificar si un usuario es admin
if (isAdmin(user)) {
  // Mostrar funcionalidades admin
}

// Obtener usuario admin mock
const adminUser = getAdminUser();

// Verificar credenciales
if (isAdminCredentials(email, password)) {
  // Es admin
}
```
