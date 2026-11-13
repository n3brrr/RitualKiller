# RitualKiller — Plan de desarrollo (2026-11-13)

## Objetivo

Convertir el prototipo actual en una app móvil-first, segura y con datos persistentes en Supabase. Sin claves de Gemini en el cliente. IA local con Ollama en Docker.

## Reglas del proyecto

- Usar solo `pnpm` (nunca npm/yarn).
- No salir del directorio de trabajo.
- Móvil-first: toda vista nueva empieza en una columna y escala con `sm:`, `md:`, `lg:`.
- Cada tarea se verifica con `pnpm typecheck`, `pnpm lint`, `pnpm test` y `pnpm build` antes de commit.
- Commits profesionales y atómicos; push a la rama principal (`master`).
- Nada de claves reales en el repositorio ni en el bundle.

## Alcance

### Addons incluidos

1. IA local con Ollama en Docker (sustituye Gemini).
2. Backend social real: posts, comentarios, likes, follows y reportes.
3. Goals persistidos y ruteados.
4. Settings/Account: perfil, contraseña, export/import, borrado de datos.
5. Notificaciones y recordatorios in-app.
6. Logros persistidos.
7. Accesibilidad e i18n base.
8. Observabilidad y CI.
9. Panel de administración.
10. Analytics con rangos de fecha y exportación.

### Excluidos explícitamente

- Ledger de esencia/anti-cheat/leaderboard (addon 7 anterior).
- PWA/offline-first (addon 8 anterior).

## Fases y tareas

### Fase 0 — Tooling y baseline

- [x] Fijar `pnpm` como único gestor; eliminar `package-lock.json`.
- [x] Añadir scripts `typecheck`, `lint`, `format`, `verify`.
- [x] Añadir ESLint y configuración plana.
- [x] Añadir `.env.example`, `.dockerignore`, `vercel.json`.
- [x] Añadir `Dockerfile`, `docker/nginx.conf`, `docker-compose.yml` con Ollama.
- [x] Añadir workflow de CI.
- [x] Verificar `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.

### Fase 1 — Seguridad y auth

- [x] Eliminar el bypass `admin/admin` y `adminUtils`.
- [x] Borrar claves Gemini del `.env` y del código.
- [x] Auth basada en sesión de Supabase (`getSession` + `onAuthStateChange`).
- [x] Store de auth sin persistir el usuario; perfil cargado de `profiles`.
- [x] Guard de rutas con estado `loading` real; redirect a login.
- [x] Logout completo: `signOut`, limpiar stores y caché.
- [x] Rutas `/reset-password` y `/auth/callback`.
- [x] Migraciones Supabase con RLS para todas las tablas.
- [x] Servicios con allowlist de campos y RPC transaccionales.
- [x] Cabeceras de seguridad y validación de env.

### Fase 2 — Datos persistentes

- [x] `profileService` y carga de perfil.
- [x] `ritualService` con mapeo snake_case ↔ camelCase.
- [x] RPC `complete_ritual`, `undo_ritual`, `purchase_item`, `consume_item`.
- [x] React Query como única fuente de estado de servidor.
- [x] Eliminar `AppContext`, `useRitualStore`, `useAuth` y claves legacy.
- [x] Habits/Dashboard/Analytics/Calendar/Shop/Inventory/Profile usando servicios.
- [x] Fechas locales y semántica diaria/semanal.
- [x] Export/import JSON y CSV disponible desde Ajustes (la migración automática de `rk_*` no aplica: no había datos locales que migrar).

### Fase 3 — Addons

- [x] Ollama local con Docker y proxy `/ollama`.
- [x] Social real con feed, posts, likes, comentarios, follows y reportes.
- [x] Goals con CRUD y progreso desde logs.
- [x] Settings con perfil, contraseña, export/import y borrado de datos.
- [x] Notificaciones in-app y preferencias de recordatorio.
- [x] Logros persistidos y notificación de desbloqueo.
- [x] Panel admin con métricas, usuarios y reportes.
- [x] Analytics 7/30/90 días y export CSV.
- [x] Accesibilidad: labels, foco, modales, touch targets.
- [x] i18n base español/inglés para navegación y páginas nuevas.
- [x] Observabilidad: captura de errores en Supabase y logs.

### Fase 4 — Verificación

- [x] Tests de fechas, CSV, analítica, logros, IA y validación de auth.
- [x] `pnpm verify` en bucle hasta 0 errores.
- [x] Revisión final de seguridad y RLS.
- [x] README actualizado.
- [ ] Push a `origin/master` (pendiente de ejecutar).
- [ ] Verificación real de las migraciones contra un proyecto Supabase (requiere acceso al proyecto).
- [ ] Build de la imagen Docker (el daemon no está disponible en este entorno).

## Criterios de aceptación

- `pnpm typecheck` sin errores.
- `pnpm lint` sin errores.
- `pnpm test` en verde.
- `pnpm build` exitoso.
- No hay claves Gemini en el repo ni en `dist/`.
- Un usuario nuevo ve el dashboard sin crashes.
- Crear/completar/borrar rituales persiste tras recargar.
- Cambiar de cuenta no mezcla datos.
- `/app` sin sesión redirige a `/login`.
- RLS impide leer o modificar datos de otro usuario.
- Docker levanta web + Ollama y el proxy `/ollama` responde.

## Riesgos

- El esquema real de Supabase puede no coincidir con las migraciones; verificar en el dashboard.
- Importar datos locales a Supabase requiere una migración manual si ya hay datos.
- Ollama necesita descargar el modelo; el primer arranque puede tardar.
- El push a `master` puede requerir credenciales del remoto.
