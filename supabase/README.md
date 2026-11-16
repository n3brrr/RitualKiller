# Supabase

## Migraciones

Aplica todas las migraciones de `supabase/migrations/` en orden, con la CLI de
Supabase (`supabase db push`) o pegando los archivos en el SQL Editor:

| Migración                                    | Contenido                                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `20261113000100_schema.sql`                  | Tablas, catálogo de la tienda y trigger `handle_new_user`.                                       |
| `20261113000200_rls.sql`                     | Políticas RLS iniciales.                                                                         |
| `20261113000300_functions.sql`               | RPC iniciales (completar, comprar, admin...).                                                    |
| `20261116000100_ai_quota.sql`                | Cuota por usuario para futuras funciones de IA.                                                  |
| `20261116000200_security_hardening.sql`      | Bloqueo de escrituras directas, reglas de rituales, `public_profiles`, límites y permisos.       |
| `20261116000300_gameplay_rules.sql`          | Zona horaria, ventana hoy/ayer, rachas desde el historial, efectos de objetos y archivado.       |
| `20261116000400_progress_and_import.sql`     | Esencia acumulada, logros en servidor, estadísticas, objetivos con `goal_rituals` e importación. |
| `20261116000500_account.sql`                 | Perfil y ajustes garantizados, idioma en `profiles.locale`, retirada de `delete_my_data`.        |
| `20261116000600_moderation_and_profiles.sql` | Suspensiones, acciones de moderación auditadas y perfiles públicos ampliados.                    |

Las migraciones nuevas adaptan los datos existentes: rellenan los perfiles o
ajustes que falten, evalúan los logros ya conseguidos, migran los objetivos al nuevo
modelo y limpian datos forjados (ventajas con multiplicador imposible, reportes
duplicados, avatares no `https`). Cada archivo debe aplicarse una sola vez.

### Tests de la base de datos

`pnpm test:db` aplica todas las migraciones sobre un Postgres en memoria (PGlite,
sin Docker) con un _stub_ mínimo de Supabase (`tests/support/supabase-stub.sql`) y
ejecuta los tests de `supabase/tests/` como los roles `anon` y `authenticated`.

## Edge Functions

```bash
supabase functions deploy delete-account
supabase functions deploy ai-suggest-rituals   # opcional, responde 501 sin proveedor
```

- `delete-account` necesita el secreto `SUPABASE_SERVICE_ROLE_KEY` (disponible por
  defecto en las funciones de Supabase). Borra el usuario de Auth y, en cascada,
  todos sus datos.
- `ai-suggest-rituals` es el punto de extensión para IA: valida la sesión y la
  cuota (`consume_ai_quota`). Para activarla, implementa `generateSuggestions`,
  guarda la clave del proveedor como secreto (`supabase secrets set ...`), define
  `AI_PROVIDER` y pon `VITE_AI_ENABLED=true` en el cliente.
- Opcional: `ALLOWED_ORIGIN` restringe el CORS de las funciones a tu dominio.

## Configuración de Auth (panel de Supabase)

Estas opciones no se pueden fijar desde las migraciones:

- **Password min length**: 8 (igual que la validación del cliente).
- **Leaked password protection**: activada.
- **Secure password change**: activada (el cliente ya pide la contraseña actual).
- **Site URL / Redirect URLs**: incluye `https://tu-dominio/auth/callback` y
  `https://tu-dominio/reset-password`.

## Administración

El primer administrador se promociona desde el SQL Editor:

```sql
update public.profiles set is_admin = true where username = 'tu_usuario';
```
