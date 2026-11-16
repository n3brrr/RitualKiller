# Auditoría de RitualKiller: UI/UX, calidad del código y seguridad

Fecha de la auditoría: 2026-11-16 · Rama: `master` (commit `466b5da`)

Este documento recoge solo lo que hay que cambiar. Cada hallazgo indica qué hay que cambiar (con archivo y línea cuando aplica), el impacto, la gravedad y el estado.

**Escala de gravedad**

| Gravedad | Criterio                                                                                                    |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| Crítica  | Explotable hoy por cualquier usuario registrado, o rompe la integridad del sistema de juego o de los datos. |
| Alta     | Fallo funcional visible o riesgo de seguridad importante con condiciones realistas.                         |
| Media    | Degrada la experiencia, la mantenibilidad o la seguridad, pero hay mitigación parcial.                      |
| Baja     | Mejora recomendable con impacto limitado.                                                                   |

**Estado:** `Pendiente` = sin corregir · `Pendiente (a confirmar)` = depende de una decisión de producto que hay que confirmar · `Realizado` = corregido.

---

## Resumen

| ID     | Área      | Hallazgo                                                                         | Gravedad | Estado                  |
| ------ | --------- | -------------------------------------------------------------------------------- | -------- | ----------------------- |
| SEC-01 | Seguridad | `complete_ritual` acepta cualquier fecha enviada por el cliente                  | Crítica  | Pendiente               |
| SEC-02 | Seguridad | RLS permite escribir el inventario directamente                                  | Crítica  | Pendiente               |
| SEC-03 | Seguridad | RLS permite crear buffs con multiplicador arbitrario                             | Crítica  | Pendiente               |
| SEC-04 | Seguridad | El cliente fija `essence_reward` y `streak` de los rituales                      | Alta     | Pendiente               |
| SEC-05 | Seguridad | El cliente puede insertar, editar y borrar `ritual_logs`                         | Alta     | Pendiente               |
| SEC-06 | Seguridad | Logros autoconcedidos desde el cliente                                           | Alta     | Pendiente               |
| SEC-07 | Seguridad | Proxy `/ollama` expone toda la API de Ollama sin autenticación                   | Alta     | Pendiente               |
| SEC-08 | Seguridad | Un usuario puede publicar posts marcados como "sistema"                          | Media    | Pendiente               |
| SEC-09 | Seguridad | "Borrar mis datos" no elimina la cuenta y el perfil se recrea                    | Media    | Pendiente               |
| SEC-10 | Seguridad | Faltan cabeceras de seguridad (CSP, HSTS) y nginx pierde cabeceras en `/assets/` | Media    | Pendiente               |
| SEC-11 | Seguridad | `avatar_url` admite cualquier URL externa y solo se valida en cliente            | Media    | Pendiente               |
| SEC-12 | Seguridad | Cambio de contraseña sin reautenticación                                         | Media    | Pendiente               |
| SEC-13 | Seguridad | Política de contraseñas débil (mínimo 6 caracteres)                              | Media    | Pendiente               |
| SEC-14 | Seguridad | `error_logs` acepta inserciones anónimas y sin límites                           | Media    | Pendiente               |
| SEC-15 | Seguridad | Sin límites de frecuencia en posts, comentarios y reportes                       | Baja     | Pendiente               |
| SEC-16 | Seguridad | `profiles` expone `is_admin` y metadatos de cualquier usuario                    | Baja     | Pendiente               |
| SEC-17 | Seguridad | Funciones `SECURITY DEFINER` ejecutables por `anon`/`PUBLIC`                     | Baja     | Pendiente               |
| SEC-18 | Seguridad | `stats.html` del visualizador se publica en producción                           | Baja     | Pendiente               |
| SEC-19 | Seguridad | Completar, gastar y deshacer conserva parte de lo comprado                       | Baja     | Pendiente               |
| SEC-20 | Seguridad | Imágenes Docker sin versión fija y nginx como root                               | Baja     | Pendiente               |
| COD-01 | Código    | Truncamiento silencioso a 1000 filas (logs y perfiles)                           | Alta     | Pendiente               |
| COD-02 | Código    | Cálculo de rachas incorrecto (semanales, sin reinicio, deshacer)                 | Alta     | Pendiente               |
| COD-03 | Código    | Tres de los cuatro objetos de la tienda no tienen efecto                         | Alta     | Pendiente               |
| COD-04 | Código    | Catálogo de la tienda duplicado en cliente y BD                                  | Media    | Pendiente               |
| COD-05 | Código    | Zona horaria inconsistente entre cliente y servidor                              | Media    | Pendiente               |
| COD-06 | Código    | Logros calculados en cliente y solo al visitar su página                         | Media    | Pendiente               |
| COD-07 | Código    | Progreso de objetivos mal calculado y columna `progress` sin uso                 | Media    | Pendiente               |
| COD-08 | Código    | Métricas tratan los rituales semanales como diarios                              | Media    | Pendiente               |
| COD-09 | Código    | Importación de backup no transaccional, duplica y valida poco                    | Media    | Pendiente               |
| COD-10 | Código    | Código muerto, dependencias sin uso y 7,8 MB de fuentes huérfanas                | Media    | Pendiente               |
| COD-11 | Código    | `pnpm lint`/`verify` fallan en local y el formato no se comprueba en CI          | Media    | Pendiente               |
| COD-12 | Código    | Cobertura de tests insuficiente en lo crítico                                    | Media    | Pendiente               |
| COD-13 | Código    | Lógica de BD duplicada en cliente y `locale` en tres sitios                      | Media    | Pendiente               |
| COD-14 | Código    | Borrar un ritual elimina todo su historial                                       | Media    | Pendiente               |
| COD-15 | Código    | Eliminar la integración de IA actual y dejar una base extensible                 | Media    | Pendiente               |
| COD-16 | Código    | Rendimiento: recorridos O(n) repetidos e invalidaciones excesivas                | Baja     | Pendiente               |
| COD-17 | Código    | Tras un despliegue, los chunks antiguos fallan sin recuperación                  | Baja     | Pendiente               |
| COD-18 | Código    | `localStorage` sin `try/catch` puede romper el arranque                          | Baja     | Pendiente               |
| COD-19 | Código    | Configuración TS/ESLint con restos y sin reglas de a11y                          | Baja     | Pendiente               |
| UX-01  | UI/UX     | Landing, `index.html` y login sin traducir ni selector de idioma                 | Media    | Pendiente               |
| UX-02  | UI/UX     | Contraste insuficiente en la landing (`text-zinc-500/600`)                       | Media    | Pendiente               |
| UX-03  | UI/UX     | Contenido estático y textos de servicios/BD sin traducir                         | Media    | Pendiente               |
| UX-04  | UI/UX     | Formularios de autenticación sin `<label>`                                       | Media    | Pendiente               |
| UX-05  | UI/UX     | Errores técnicos crudos mostrados al usuario                                     | Media    | Pendiente               |
| UX-06  | UI/UX     | Acciones sin feedback de error ni actualización optimista                        | Media    | Pendiente               |
| UX-07  | UI/UX     | Acciones costosas o sensibles sin confirmación                                   | Media    | Pendiente               |
| UX-08  | UI/UX     | Moderación incompleta en el panel de administración                              | Media    | Pendiente               |
| UX-09  | UI/UX     | Social: seguir no hace nada y el perfil no es descubrible                        | Media    | Pendiente               |
| UX-10  | UI/UX     | No se pueden editar rituales ni objetivos; la IA crea sin previsualizar          | Media    | Pendiente               |
| UX-11  | UI/UX     | Perfil público con datos engañosos                                               | Baja     | Pendiente               |
| UX-12  | UI/UX     | Problemas de accesibilidad en calendario, heatmap, progreso y pestañas           | Baja     | Pendiente               |
| UX-13  | UI/UX     | Flujos de autenticación con casos mal resueltos                                  | Baja     | Pendiente               |
| UX-14  | UI/UX     | i18n sin interpolación ni plurales                                               | Baja     | Pendiente               |
| UX-15  | UI/UX     | Ajustes con modelo de guardado inconsistente                                     | Baja     | Pendiente               |
| UX-16  | UI/UX     | Recordatorios solo in-app y solo al abrir la app                                 | Baja     | Pendiente (a confirmar) |

---

## 1. Seguridad

### SEC-01 · `complete_ritual` acepta cualquier fecha enviada por el cliente

- **Qué cambiar:** `supabase/migrations/20261113000300_functions.sql:2` recibe `p_date` del cliente (`src/services/ritualService.ts:115`) sin validarlo. Hay que eliminar el parámetro y usar la fecha actual del usuario calculada en el servidor (con su zona horaria, ver COD-05), o como mínimo restringirlo a `hoy` o `ayer` (`p_date between v_today - 1 and v_today`). Aplicar lo mismo a `undo_ritual`.
- **Impacto:** cualquier usuario puede llamar a la RPC en bucle con fechas pasadas o futuras (cientos o miles de días) y obtener esencia ilimitada, subir de rango, comprar todo e inflar rachas y logros. Además, al completar fechas desordenadas la racha suma +1 en cada llamada. Rompe la economía del juego y el ranking social.
- **Gravedad:** Crítica
- **Estado:** Pendiente

### SEC-02 · RLS permite escribir el inventario directamente

- **Qué cambiar:** la política `inventory_write_own` (`supabase/migrations/20261113000200_rls.sql:103-104`) es `FOR ALL`. Hay que dejar solo `SELECT` para el usuario y hacer todas las escrituras a través de `purchase_item`/`consume_item` (`SECURITY DEFINER`).
- **Impacto:** con la anon key pública basta un `supabase.from("inventory").upsert({ item_id: "binding_contract", quantity: 999 })` para obtener cualquier objeto gratis, sin pasar por `purchase_item`. Además, el README (§ Seguridad) afirma que comprar y consumir solo pasa por funciones seguras, algo que hoy no es cierto.
- **Gravedad:** Crítica
- **Estado:** Pendiente

### SEC-03 · RLS permite crear buffs con multiplicador arbitrario

- **Qué cambiar:** la política `buffs_write_own` (`rls.sql:107-108`) es `FOR ALL`. Hay que dejar solo `SELECT` y crear los buffs exclusivamente desde `consume_item`. Conviene añadir también un `check (multiplier <= 3)` o similar en `active_buffs`.
- **Impacto:** un usuario puede insertar un buff con `multiplier = 99.99` y `expires_at` en el año 2100. `complete_ritual` (`functions.sql:50-54`) usa `max(multiplier)`, así que cada ritual otorga ~100× esencia de forma permanente.
- **Gravedad:** Crítica
- **Estado:** Pendiente

### SEC-04 · El cliente fija `essence_reward` y `streak` de los rituales

- **Qué cambiar:** `rituals_insert_own`/`rituals_update_own_or_admin` (`rls.sql:81-85`) permiten escribir cualquier columna. La recompensa se envía desde el cliente (`src/features/rituals/pages/HabitsPage.tsx:20,71,94`, `ritualService.ts:102`). Hay que calcular `essence_reward` en un trigger `BEFORE INSERT/UPDATE` a partir de `difficulty` y `frequency`, e impedir que el cliente modifique `streak` (trigger que conserve `old.streak` cuando `auth.uid()` no es admin, como `protect_profile_fields`, o `REVOKE UPDATE (streak, essence_reward)`).
- **Impacto:** cualquiera puede crear rituales "novato" con 1000 de esencia por completado, o poner `streak = 100` y desbloquear los logros de racha. Combinado con SEC-01, el abuso es ilimitado.
- **Gravedad:** Alta
- **Estado:** Pendiente

### SEC-05 · El cliente puede insertar, editar y borrar `ritual_logs`

- **Qué cambiar:** eliminar `logs_insert_own`, `logs_update_own_or_admin` y `logs_delete_own_or_admin` (`rls.sql:92-98`) y dejar las escrituras solo a `complete_ritual`/`undo_ritual`. La importación de backups (`ritualService.ts:157-171`), que inserta logs con `essence_gained` arbitrario, debe pasar a una RPC `import_backup` que fuerce `essence_gained = 0` o marque los logs como importados (ver COD-09).
- **Impacto:** se puede falsificar el historial (heatmap, analíticas, progreso de objetivos, logros como "1000 completados") e insertar logs con `essence_gained` inventado que no cuadran con la esencia del perfil. Además, borrar un log de hoy permite volver a completar el ritual y cobrar dos veces.
- **Gravedad:** Alta
- **Estado:** Pendiente

### SEC-06 · Logros autoconcedidos desde el cliente

- **Qué cambiar:** `achievements_insert_own` (`rls.sql:156-157`) permite insertar cualquier `achievement_id`, y los logros se calculan en el navegador (`src/hooks/useAchievements.ts`, `src/services/achievementService.ts:44`). Hay que mover la evaluación y concesión a una función de servidor (llamada desde `complete_ritual` y la creación de posts) y quitar el `INSERT` directo. Igual con `notifications_insert_own` (`rls.sql:163`): las notificaciones de sistema deben crearse solo en el servidor.
- **Impacto:** los logros (y su fecha) no son fiables. Cualquiera puede conseguir "Invincible" o "Demi-God" con una sola petición, lo que invalida el componente de gamificación.
- **Gravedad:** Alta
- **Estado:** Pendiente

### SEC-07 · Proxy `/ollama` expone toda la API de Ollama sin autenticación

- **Qué cambiar:**
  - `docker/nginx.conf:14-21` reenvía `/ollama/*` completo. Hay que limitarlo a `location = /ollama/api/generate` con `limit_except POST { deny all; }`, `limit_req` (rate limiting), un `client_max_body_size` pequeño y, si es posible, validar el JWT de Supabase (o mover la llamada a una Edge Function autenticada).
  - En el servicio `ollama`, `docker-compose.yml:16-17` publica `11434` en todas las interfaces. Hay que quitar `ports` o usar `127.0.0.1:11434:11434`, y fijar el modelo permitido en el servidor, porque hoy el cliente elige `model`.
  - `vite.config.ts:11,22` expone el servidor de desarrollo y el proxy en `0.0.0.0` (toda la LAN).
  - **Resolución prevista:** se resuelve eliminando la integración de Ollama (ver COD-15). Si en el futuro se añade IA, debe hacerse mediante una Edge Function autenticada y con rate limiting, nunca con un proxy abierto. Las medidas anteriores solo aplican si se decide mantener Ollama.
- **Impacto:** cualquiera en Internet puede usar `/ollama/api/pull` para descargar modelos de decenas de GB, `/api/delete` para borrar modelos, `/api/create` o lanzar generaciones costosas en bucle (DoS de CPU/GPU y disco del servidor).
- **Gravedad:** Alta
- **Estado:** Pendiente

### SEC-08 · Un usuario puede publicar posts marcados como "sistema"

- **Qué cambiar:** `posts_insert_own` y `posts_update_own_or_admin` (`rls.sql:119-123`) no restringen `is_system`. Hay que añadir `and is_system = false` al `with check` para no admins (o un trigger que lo fuerce) y el mismo control en `UPDATE`.
- **Impacto:** suplantación de mensajes oficiales (la UI muestra la etiqueta "Sistema" en `src/components/social/EnhancedSocial.tsx:179`), útil para phishing o desinformación dentro de la comunidad.
- **Gravedad:** Media
- **Estado:** Pendiente

### SEC-09 · "Borrar mis datos" no elimina la cuenta y el perfil se recrea

- **Qué cambiar:** `delete_my_data` (`functions.sql:201-213`) solo borra `profiles` y mantiene el usuario en `auth.users` (email incluido). Si la persona vuelve a iniciar sesión, `profileService.getProfile` → `createProfile` (`src/services/profileService.ts:41-70,81`) recrea el perfil.
- **Decisión (confirmada):** el botón debe eliminar la cuenta entera.
- **Qué cambiar (detalle):**
  - **Edge Function:** crear `supabase/functions/delete-account`, que valide el JWT y llame a `auth.admin.deleteUser(uid)` con service role. Las filas de `public.*` se borran en cascada desde `profiles`.
  - **Cliente:** sustituir la llamada a `delete_my_data` en `profileService.deleteMyData` y actualizar los textos de Ajustes ("Eliminar cuenta").
  - **Perfil:** eliminar `createProfile` del cliente (ver COD-13) para que nunca se recree un perfil por accidente.
- **Impacto:** el derecho de supresión (art. 17 RGPD) queda incumplido: el email y los metadatos (`raw_user_meta_data.username`) persisten. El usuario cree haber borrado su cuenta y puede volver a entrar.
- **Gravedad:** Media
- **Estado:** Pendiente

### SEC-10 · Faltan cabeceras de seguridad (CSP, HSTS) y nginx pierde cabeceras en `/assets/`

- **Qué cambiar:**
  - Añadir `Content-Security-Policy` (`default-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co; img-src 'self' https: data:; frame-ancestors 'none'; …`) en `docker/nginx.conf` y `vercel.json`.
  - Añadir `Strict-Transport-Security` y `Permissions-Policy` en nginx.
  - En nginx, `add_header Cache-Control` dentro de `location /assets/` (`nginx.conf:23-27`) hace que **no se hereden** las cabeceras del bloque `server`. Hay que repetirlas o usar un `include` común.
- **Impacto:** sin CSP, cualquier XSS futuro (o una dependencia comprometida) puede robar el token de Supabase guardado en `localStorage`. Los JS y CSS servidos desde `/assets/` salen sin `nosniff`.
- **Gravedad:** Media
- **Estado:** Pendiente

### SEC-11 · `avatar_url` admite cualquier URL externa y solo se valida en cliente

- **Qué cambiar:** la validación está solo en `profileService.ts:133-148`. La tabla (`schema.sql:7`) no tiene `check`. Hay que añadir `check (avatar_url is null or (avatar_url ~ '^https://' and char_length(avatar_url) <= 500))`, aceptar solo `https:`, añadir `referrerPolicy="no-referrer"` y `loading="lazy"` a los `<img>` (`src/components/layout/AppLayout.tsx:162`, `src/features/users/pages/ProfilePage.tsx:52`) y, preferiblemente, subir los avatares a Supabase Storage.
- **Impacto:** quien abre un perfil hace una petición a un servidor de terceros (seguimiento de IP, "tracking pixel"), puede haber contenido mixto `http:` y se pueden enlazar imágenes inapropiadas sin moderación. Con la API directa se salta la validación del cliente.
- **Gravedad:** Media
- **Estado:** Pendiente

### SEC-12 · Cambio de contraseña sin reautenticación

- **Qué cambiar:** `src/features/settings/pages/SettingsPage.tsx:131-152` y `src/features/auth/pages/ResetPasswordPage.tsx` (usable con cualquier sesión, no solo con el evento `PASSWORD_RECOVERY`) llaman a `updateUser({ password })` sin pedir la contraseña actual. Hay que activar "Secure password change" en Supabase Auth o usar `supabase.auth.reauthenticate()` con nonce, y en `/reset-password` exigir que la sesión venga del evento `PASSWORD_RECOVERY`.
- **Impacto:** una sesión robada (equipo compartido, XSS) permite cambiar la contraseña y apropiarse de la cuenta.
- **Gravedad:** Media
- **Estado:** Pendiente

### SEC-13 · Política de contraseñas débil (mínimo 6 caracteres)

- **Qué cambiar:** `src/utils/validation.ts:15` y los `minLength={6}` (`LoginPage.tsx:138`, `ResetPasswordPage.tsx:86,96`, `SettingsPage.tsx:308`). Hay que subir a ≥ 8–10 caracteres en cliente y en la configuración de Supabase Auth, y activar "Leaked password protection".
- **Impacto:** cuentas vulnerables a ataques de diccionario o credenciales filtradas.
- **Gravedad:** Media
- **Estado:** Pendiente

### SEC-14 · `error_logs` acepta inserciones anónimas y sin límites

- **Qué cambiar:**
  - `error_logs_insert_own` (`rls.sql:180-181`) permite `user_id is null`, así que cualquier usuario no autenticado puede insertar. Hay que exigir `auth.uid() is not null and user_id = auth.uid()`.
  - Añadir `check (char_length(message) <= 2000)`, `check (char_length(stack) <= 10000)` y limitar el tamaño de `context`.
  - En `src/lib/observability.ts:18-35`, deduplicar y limitar la frecuencia de envío y no enviar `context` con datos personales.
- **Impacto:** se puede llenar la base de datos (coste y cuota de Supabase) y ocultar errores reales en el panel de admin. Un bucle de errores en el cliente genera miles de filas.
- **Gravedad:** Media
- **Estado:** Pendiente

### SEC-15 · Sin límites de frecuencia en posts, comentarios y reportes

- **Qué cambiar:** no hay control de frecuencia en `posts`, `comments`, `reports` ni `follows`, y un mismo usuario puede reportar el mismo post infinitas veces. Hay que añadir `unique (reporter_id, post_id)` y `unique (reporter_id, target_user_id)` en `reports`, y triggers que limiten las inserciones por minuto y usuario (o pasar por RPC con control de frecuencia).
- **Impacto:** spam en el feed, saturación de la cola de moderación e inflado artificial del logro social.
- **Gravedad:** Baja
- **Estado:** Pendiente

### SEC-16 · `profiles` expone `is_admin` y metadatos de cualquier usuario

- **Decisión (confirmada):** la esencia de los demás usuarios **sí** es pública; `is_admin` no debe serlo.
- **Qué cambiar:** `profiles_select_authenticated` (`rls.sql:68-69`) junto con `select("*")` (`profileService.ts:76,161`) devuelven `is_admin`, `locale` y `updated_at` de cualquier usuario. Hay que crear una vista `public_profiles` con solo `id`, `username`, `avatar_url`, `essence` y `created_at` (o permisos por columna) para leer perfiles ajenos, limitar la lectura completa de `profiles` al propio usuario y a los admins, y pedir columnas concretas en `getByUsername` y en `socialService`. La insignia "Admin" del perfil público (`ProfilePage.tsx:61-65`) tendría que desaparecer o depender de un rol público explícito (por ejemplo "moderador").
- **Impacto:** hoy se puede enumerar a los administradores (objetivo de ingeniería social) y se exponen metadatos (`locale`, `updated_at`) que no se usan en la UI.
- **Gravedad:** Baja
- **Estado:** Pendiente

### SEC-17 · Funciones `SECURITY DEFINER` ejecutables por `anon`/`PUBLIC`

- **Qué cambiar:** ninguna migración hace `revoke execute on function … from public, anon`. Hay que revocar y conceder `execute` solo a `authenticated` en `complete_ritual`, `undo_ritual`, `purchase_item`, `consume_item`, `delete_my_data`, `admin_metrics`, `set_admin`, `ensure_ritual_reminder` e `is_admin`.
- **Impacto:** hoy las funciones comprueban `auth.uid()`, pero cualquier función futura que olvide la comprobación quedaría expuesta a usuarios anónimos. Es defensa en profundidad.
- **Gravedad:** Baja
- **Estado:** Pendiente

### SEC-18 · `stats.html` del visualizador se publica en producción

- **Qué cambiar:** `vite.config.ts:33-38` escribe `dist/stats.html` en cada build, y `Dockerfile:16` y Vercel publican `dist` completo. Hay que activar el visualizador solo con una variable (`ANALYZE=1`) o escribirlo fuera de `dist`.
- **Impacto:** se publica la estructura interna de módulos y las versiones de dependencias (reconocimiento para un atacante) y aumenta el peso del despliegue.
- **Gravedad:** Baja
- **Estado:** Pendiente

### SEC-19 · Completar, gastar y deshacer conserva parte de lo comprado

- **Qué cambiar:** `undo_ritual` (`functions.sql:111-113`) resta la esencia con `greatest(…, 0)`. Si entre completar y deshacer se gastó la esencia, el usuario conserva el objeto y solo pierde lo que le queda. Hay que impedir el deshacer cuando `essence < essence_gained`, o permitir esencia negativa o deuda.
- **Impacto:** pequeña ganancia indebida repetible (menor si se corrige SEC-01).
- **Gravedad:** Baja
- **Estado:** Pendiente

### SEC-20 · Imágenes Docker sin versión fija y nginx como root

- **Qué cambiar:** `docker-compose.yml:15,23` usa `ollama/ollama:latest`. Hay que fijar la versión (o el digest). El contenedor web usa `nginx:1.27-alpine` como root; conviene `nginxinc/nginx-unprivileged` y añadir un `HEALTHCHECK`.
- **Impacto:** builds no reproducibles y exposición a cambios o compromisos de la imagen `latest`. Superficie mayor si nginx se ve comprometido.
- **Gravedad:** Baja
- **Estado:** Pendiente

---

## 2. Calidad del código (incluye fallos funcionales)

### COD-01 · Truncamiento silencioso a 1000 filas (logs y perfiles)

- **Qué cambiar:** `ritualService.list` (`src/services/ritualService.ts:77-81`) pide **todos** los `ritual_logs` del usuario ordenados de forma **ascendente** y sin paginar. PostgREST/Supabase limita por defecto la respuesta a 1000 filas, así que, superado ese número, se pierden los logs **más recientes**. Hay que:
  - pedir solo el rango necesario (por ejemplo, los últimos 365 días) con `order desc`;
  - mover los agregados (totales, logros, analítica) a RPC o vistas;
  - paginar la exportación.

  El mismo problema afecta a `adminService.getReports` (`src/services/adminService.ts:56`), que carga **todos** los perfiles para resolver nombres; hay que usar un join (`reports(*, reporter:profiles(username))`).

- **Impacto:** a partir de unos 1000 completados (≈ 3 rituales durante 1 año), hoy aparece como "no completado", el heatmap, el calendario, las analíticas y el progreso de objetivos son erróneos, y **el backup JSON/CSV queda incompleto sin aviso**. En admin, los reportes acaban mostrando "unknown" como autor.
- **Gravedad:** Alta
- **Estado:** Pendiente

### COD-02 · Cálculo de rachas incorrecto (semanales, sin reinicio, deshacer)

- **Qué cambiar:** en `complete_ritual` (`functions.sql:40-48`):
  - Para rituales **semanales** se comprueba `p_date - 1` (el día anterior), así que la racha semanal solo crece si se completa en días consecutivos. Debe comprobar la semana anterior.
  - La racha guardada en `rituals.streak` **nunca se reinicia** al saltarse días; solo se recalcula al completar. Dashboard, cabecera móvil y tarjetas (`DashboardPage.tsx:47`, `AppLayout.tsx:89`, `RitualCard.tsx:38`) muestran una racha "viva" que ya está rota.
  - `undo_ritual` (`functions.sql:115`) decrementa aunque la racha se hubiese reiniciado a 1 al completar.

  Hay que calcular la racha a partir de los logs en el servidor (función o vista `ritual_streaks`) y que el cliente la lea de ahí.

- **Impacto:** el dato central de la app ("sostén tu racha") es incorrecto, los rituales semanales nunca acumulan racha y los logros de racha son inconsistentes.
- **Gravedad:** Alta
- **Estado:** Pendiente

### COD-03 · Tres de los cuatro objetos de la tienda no tienen efecto

- **Qué cambiar:** `consume_item` (`functions.sql:185-194`) solo implementa `essence_boost`. "Potion of Oblivion" (1000), "Shadow Amulet" (2500, "visible para otros") y "Binding Contract" (5000, "desbloquea rituales maestros") se **consumen y desaparecen sin hacer nada**, y cualquiera puede crear rituales `master` sin el contrato (`HabitsPage.tsx:21`). Hay que:
  - implementar `restore_streak` (requiere COD-02);
  - tratar los objetos cosméticos o permanentes como pasivos, sin botón "Usar" en `src/features/inventory/pages/InventoryPage.tsx`, y mostrar el amuleto en el perfil;
  - aplicar `unlock_master` validando en el servidor (trigger en `rituals`) que `difficulty = 'master'` requiere el objeto.
- **Impacto:** el usuario pierde hasta 5000 de esencia por objetos inútiles, la tienda engaña y se pierde la progresión prevista.
- **Gravedad:** Alta
- **Estado:** Pendiente

### COD-04 · Catálogo de la tienda duplicado en cliente y BD

- **Qué cambiar:** `src/data/items.ts` replica nombres, costes, efectos y duraciones de la tabla `shop_items` (`schema.sql:161-166`). La UI muestra el coste local y bloquea la compra con él (`ShopPage.tsx:37`). Hay que leer `shop_items` desde Supabase (query `shop`) y dejar en el cliente solo el mapa `id → icono`. Las descripciones de `items.ts` (en inglés) no se usan porque la UI traduce con `shopItemKey`.
- **Impacto:** cualquier cambio de precio o efecto en la BD desincroniza la UI (precio mostrado distinto del cobrado, botones deshabilitados por error).
- **Gravedad:** Media
- **Estado:** Pendiente

### COD-05 · Zona horaria inconsistente entre cliente y servidor

- **Qué cambiar:** el cliente usa la fecha local (`src/utils/dates.ts:3`), pero `ensure_ritual_reminder` (`functions.sql:272,278,288`) usa `localtime`/`current_date` del servidor (UTC), y `complete_ritual` tiene `default current_date`. Hay que guardar la zona horaria del usuario (`user_settings.timezone`, inicializada con `Intl.DateTimeFormat().resolvedOptions().timeZone`) y calcular "hoy" con `now() at time zone tz` en todas las funciones.
- **Impacto:** en España (UTC+1/+2) el recordatorio de las 20:00 llega a las 21:00 o 22:00. Cerca de medianoche, "pendientes hoy" se evalúa sobre el día equivocado. Si se corrige SEC-01 sin esto, los completados de madrugada caerían en otro día.
- **Gravedad:** Media
- **Estado:** Pendiente

### COD-06 · Logros calculados en cliente y solo al visitar su página

- **Qué cambiar:**
  - `useAchievements` solo se monta en `src/components/achievements/AchievementsList.tsx`, así que los logros no se desbloquean ni se notifican hasta visitar `/app/achievements`.
  - Los logros de esencia ("Accumulate 1,000 essence") usan la esencia **actual** (`src/data/achievements.ts:177`), que baja al comprar, en lugar de la acumulada.
  - "First Week" dice "completa todos tus rituales 7 días seguidos", pero se calcula con la racha máxima de un solo ritual (`achievements.ts:173`).
  - El logro "Demi-God" (50 000) choca con el rango "Demi-God" (5000, `src/utils/rank.ts:13`).
  - Los logros cumplidos pero aún no guardados muestran como fecha "ahora" (`useAchievements.ts:44-45`).

  Hay que mover la evaluación al servidor (ver SEC-06), añadir `profiles.lifetime_essence` y alinear nombres y descripciones.

- **Impacto:** notificaciones de logro tardías o inexistentes, descripciones que no cumplen lo que prometen y fechas falsas.
- **Gravedad:** Media
- **Estado:** Pendiente

### COD-07 · Progreso de objetivos mal calculado y columna `progress` sin uso

- **Qué cambiar:**
  - `progressFor` (`src/features/goals/pages/GoalsPage.tsx:83-89`) cuenta **todos** los logs históricos, incluidos los anteriores a la creación del objetivo, y si el objetivo no tiene rituales vinculados cuenta cualquier ritual.
  - La columna `goals.progress` y `goalService.updateProgress` (`src/services/goalService.ts:71`) no se usan.
  - `ritual_ids uuid[]` (`schema.sql:70`) no tiene integridad referencial: al borrar un ritual quedan ids huérfanos que siguen contando en "N rituales".

  Hay que filtrar por `created_at ≤ date ≤ target_date`, usar una tabla `goal_rituals` con FK `on delete cascade` y eliminar o usar `progress`.

- **Impacto:** un objetivo nuevo puede aparecer completado al crearlo y los datos de objetivos son engañosos.
- **Gravedad:** Media
- **Estado:** Pendiente

### COD-08 · Métricas tratan los rituales semanales como diarios

- **Qué cambiar:** `ProductivityMetrics` (`src/components/productivity/ProductivityMetrics.tsx:30-33`) y `calculateCompletionRate` (`src/utils/analytics.ts:106-114`) usan `rituals.length * días` como denominador. Un ritual semanal completado cuenta 1/7. `RitualCalendar` (`src/components/calendar/RitualCalendar.tsx:89`) usa el número **actual** de rituales para días pasados. Hay que calcular las oportunidades por ritual según su frecuencia y su fecha de creación.
- **Impacto:** porcentajes de eficiencia y de tasa de completado artificialmente bajos o incoherentes, que desmotivan y confunden.
- **Gravedad:** Media
- **Estado:** Pendiente

### COD-09 · Importación de backup no transaccional, duplica y valida poco

- **Qué cambiar:** `ritualService.importBackup` (`src/services/ritualService.ts:134-174`) hace una petición por ritual y por log de forma secuencial (N+1) y sin transacción. Si falla a mitad, deja datos parciales. Cada importación **duplica** los rituales (no deduplica por título). `validateImportData` (`src/utils/validation.ts:133-170`) no valida `essenceReward`, `description` ni longitudes (`Math.min(1000, Math.max(0, undefined))` → `NaN` → error de `NOT NULL`), y no hay límite de tamaño del archivo (`SettingsPage.tsx:116`). Hay que crear una RPC `import_backup(jsonb)` transaccional con validación (zod en cliente y comprobaciones en SQL), deduplicación y límites.
- **Impacto:** importaciones a medias, rituales duplicados, bloqueos con archivos grandes y errores crípticos.
- **Gravedad:** Media
- **Estado:** Pendiente

### COD-10 · Código muerto, dependencias sin uso y 7,8 MB de fuentes huérfanas

- **Qué cambiar:**
  - **Componentes sin uso:** `src/components/ui/Button.tsx`, `Reveal.tsx`, `FeatureCard.tsx`, `Divider.tsx` y `ScrollIn.tsx`. El índice de git lo tiene como `ScrollIn.tsx` y el disco como `Scrollin.tsx`; en Linux/CI la diferencia de mayúsculas rompería cualquier import futuro.
  - **Funciones sin uso:** `PageLoading` (`Loading.tsx:20`), `getRitualsByCategory`, `getUnlockedAchievements` y `goalService.updateProgress`.
  - **Dependencias sin uso:** `react-window`, `@types/react-window`, `@tanstack/react-query-devtools` y `zustand` (CLAUDE.md dice que se usa, pero no se importa). `framer-motion` solo lo usan los componentes muertos y `MotionConfig` en `src/index.tsx`, pero entra en el chunk `vendor-ui` que carga **todas** las páginas.
  - **Fuentes:** `src/styles/fonts.css` no se importa y los 7,8 MB de TTF de `src/assets/fonts/` no se usan (las fuentes vienen de `@fontsource`).
  - **Tipos:** `global.d.ts` declara `gsap` como `any`, aunque gsap incluye sus propios tipos.
- **Impacto:** bundle inicial más pesado (framer-motion ≈ 100 KB+), repositorio inflado, confusión para quien mantenga el proyecto y documentación (CLAUDE.md) incorrecta.
- **Decisión (confirmada):** no están reservados para trabajo futuro; se pueden borrar.
- **Gravedad:** Media
- **Estado:** Pendiente

### COD-11 · `pnpm lint`/`verify` fallan en local y el formato no se comprueba en CI

- **Qué cambiar:**
  - `eslint.config.js:8-16` no ignora `.claude/`, así que `pnpm lint` falla en local con 136 errores (scripts JS de `.claude/skills`) y `pnpm verify` queda roto. Hay que añadir `.claude` a `ignores` y a `.prettierignore`.
  - `pnpm format:check` falla en 84 archivos de `src/`. Hay que ejecutar `pnpm format` y añadir `format:check` al workflow `.github/workflows/ci.yml`.
- **Impacto:** el flujo de verificación documentado no funciona en local y el formato del código diverge sin control.
- **Gravedad:** Media
- **Estado:** Pendiente

### COD-12 · Cobertura de tests insuficiente en lo crítico

- **Qué cambiar:** solo hay tests de `utils`, `data` y `ollamaService` (34 tests). No hay tests de:
  - funciones SQL ni políticas RLS (donde están la economía y la seguridad, ver SEC-01 a SEC-06);
  - servicios, hooks ni componentes.

  Además, `test:coverage` y `test:ui` (`package.json:17-18`) requieren `@vitest/coverage-v8` y `@vitest/ui`, que no están instalados. Hay que añadir tests de BD (pgTAP o `supabase test db`) para RLS y RPC, tests de servicios con el cliente simulado y tests de componentes con Testing Library para los flujos principales.

- **Impacto:** las regresiones en la lógica de negocio y en la seguridad no se detectan; los fallos de SEC y COD de este informe habrían salido en tests básicos.
- **Gravedad:** Media
- **Estado:** Pendiente

### COD-13 · Lógica de BD duplicada en cliente y `locale` en tres sitios

- **Qué cambiar:**
  - `profileService.createProfile` (`profileService.ts:41-70`) reimplementa `handle_new_user` con otra estrategia de sufijos (aleatoria frente a incremental).
  - `settingsService.get` (`src/services/settingsService.ts:21-25`) hace un `upsert` en **cada lectura**.
  - El idioma se guarda en `profiles.locale`, `user_settings.locale` y `localStorage`, y `SettingsPage` escribe en ambas tablas (`SettingsPage.tsx:64-73,86-87`).

  Hay que confiar en el trigger (o usar una RPC `ensure_profile`), leer los ajustes sin escribir y dejar una única fuente de verdad para el idioma.

- **Impacto:** escrituras innecesarias, comportamientos divergentes al crear perfiles y riesgo de que el idioma se desincronice.
- **Gravedad:** Media
- **Estado:** Pendiente

### COD-14 · Borrar un ritual elimina todo su historial

- **Qué cambiar:** `ritual_logs.ritual_id … on delete cascade` (`schema.sql:33`) y `ritualService.remove` hacen un borrado físico. Hay que añadir `rituals.archived_at` (borrado lógico), ocultar los archivados en la lista y conservar sus logs en heatmap, analíticas y logros.
- **Impacto:** al borrar un ritual desaparecen días del heatmap, baja el total de completados y se pueden perder logros. La esencia se conserva, así que los datos quedan incoherentes.
- **Gravedad:** Media
- **Estado:** Pendiente

### COD-15 · Integración de IA actual: eliminarla y dejar una base extensible

- **Problema actual:**
  - **No funciona en Vercel:** `vercel.json` reescribe todo a `/index.html` y no hay proxy para `/ollama`, así que `fetch("/ollama/api/generate")` (`src/services/ai/ollamaService.ts:80`) recibe HTML y siempre cae al fallback local.
  - **Idioma:** el fallback está solo en español (`ollamaService.ts:11-30`) y el prompt pide la respuesta en inglés (`ollamaService.ts:71-74`).
  - **Seguridad:** la integración es la causa de SEC-07.
- **Decisión (confirmada):** eliminar por completo la integración de IA actual y dejar preparada una base para añadir funciones de IA más adelante.
- **Qué cambiar:**
  1. **Eliminar la integración actual:**
     - **Código:** `src/services/ai/ollamaService.ts` y su test `src/services/ai/test/ollamaService.test.ts`; en `HabitsPage.tsx`, el modo "IA" (pestañas manual/IA, `handleAiCreate`, `goalInput`, `isGenerating`, líneas 18, 43-45 y 103-127 y 222-342) y las claves `habits.ai*`/`habits.invok*`/`habits.goalPlaceholder` de `src/i18n/index.tsx`.
     - **Infraestructura:** el proxy `/ollama` de `vite.config.ts:12-18,23-29` y `docker/nginx.conf:14-21`, los servicios `ollama` y `ollama-pull` de `docker-compose.yml`, `VITE_OLLAMA_MODEL` de `.env.example` y `OLLAMA_URL`.
     - **Documentación:** las secciones de Ollama del README y del CLAUDE.md.
  2. **Dejar una base extensible:**
     - **Interfaz:** definir `src/services/ai/types.ts` con una interfaz de proveedor (`AiProvider` con, por ejemplo, `suggestRituals(goal, locale)`) y una implementación `disabled` por defecto.
     - **Feature flag:** `VITE_AI_ENABLED`, que oculte cualquier punto de entrada de IA en la UI cuando está desactivado.
     - **Servidor:** documentar que las llamadas al modelo deben hacerse **solo en el servidor** (Edge Function de Supabase en `supabase/functions/ai-*`, que valide el JWT, limite la frecuencia por usuario y guarde la clave del proveedor como secreto), nunca desde el navegador ni con un proxy abierto.
     - **Validación:** mantener la validación o saneado de la salida del modelo (equivalente a `sanitizeSuggestions`) como utilidad reutilizable y con tests.
     - **Idioma:** pasar siempre el idioma del usuario al proveedor.
- **Impacto:** hoy la función de IA anunciada no funciona en producción (Vercel), expone un servicio sin autenticación en Docker (SEC-07) y mezcla idiomas. Eliminarla quita superficie de ataque y código no usado; la base extensible evita repetir estos errores cuando se añada IA.
- **Gravedad:** Media
- **Estado:** Pendiente

### COD-16 · Rendimiento: recorridos O(n) repetidos e invalidaciones excesivas

- **Qué cambiar:**
  - `isRitualCompleted` (`src/utils/analytics.ts:93-104`) recorre todos los logs por ritual y se llama 3 o más veces por ritual en cada render (`HabitsPage.tsx:72-73,457`, `DashboardPage.tsx:43`, `ProductivityMetrics.tsx:26`). Hay que construir un `Map<ritualId, Set<date>>` memoizado.
  - Cada completar o deshacer invalida 5 queries, entre ellas la recarga completa de logs (`src/hooks/useRituals.ts:21-27`). Hay que usar `setQueryData` o actualizaciones optimistas.
  - `isToggling` es global y bloquea los botones de todos los rituales mientras se procesa uno (`useRituals.ts:67`).
- **Impacto:** la latencia percibida crece con el historial y bloquea la interacción al marcar varios rituales seguidos.
- **Gravedad:** Baja
- **Estado:** Pendiente

### COD-17 · Tras un despliegue, los chunks antiguos fallan sin recuperación

- **Qué cambiar:** todas las páginas se cargan con `lazy` (`src/App.tsx:18-33`). Tras un nuevo despliegue, los hashes antiguos devuelven 404 ("Failed to fetch dynamically imported module") y se muestra `RouteError` sin reintento. nginx no envía `Cache-Control: no-cache` para `index.html`. Hay que envolver `lazy` con reintento y recarga única ante `ChunkLoadError`, y añadir `location = /index.html { add_header Cache-Control "no-cache"; }`.
- **Impacto:** quien tenga la app abierta durante un despliegue ve una pantalla de error al navegar.
- **Gravedad:** Baja
- **Estado:** Pendiente

### COD-18 · `localStorage` sin `try/catch` puede romper el arranque

- **Qué cambiar:** `src/i18n/index.tsx:810,822` accede a `localStorage` sin protección. En algunos modos privados o con el almacenamiento bloqueado lanza una excepción y la app no arranca. Hay que envolverlo en `try/catch` y usar `navigator.language` como valor inicial.
- **Impacto:** pantalla en blanco para una parte (pequeña) de los usuarios. Además, el idioma inicial no respeta el del navegador.
- **Gravedad:** Baja
- **Estado:** Pendiente

### COD-19 · Configuración TS/ESLint con restos y sin reglas de a11y

- **Qué cambiar:**
  - **`tsconfig.json`:** tiene opciones de otra plantilla (`experimentalDecorators`, `useDefineForClassFields: false`, `allowJs`) que hay que quitar.
  - **ESLint:** `eslint-plugin-react-refresh` está instalado pero no configurado. Falta `eslint-plugin-jsx-a11y` y `no-explicit-any` está desactivado.
  - **`vite.config.ts:38`:** usa `as any`.
  - **Comentarios:** mezcla de español e inglés en comentarios y código (`items.ts`, `ritualLibrary.ts`, `AnalyticsPage.tsx`).
- **Impacto:** errores de accesibilidad y de tipado que no se detectan automáticamente, y configuración confusa.
- **Gravedad:** Baja
- **Estado:** Pendiente

---

## 3. UI/UX

### UX-01 · Landing, `index.html` y login sin traducir ni selector de idioma

- **Qué cambiar:**
  - **Landing:** `src/features/auth/pages/LandingPage.tsx` tiene todo el texto en español fijo (`CTA_LABEL` en línea 13, secciones, `RITUALS`, maquetas) y no usa `useI18n`.
  - **`index.html`:** el título, la descripción y las etiquetas OG/Twitter están solo en español (`lang="es"` fijo hasta que React lo cambia).
  - **Selector de idioma:** no existe fuera de Ajustes, así que un visitante en inglés no puede cambiarlo antes de registrarse.

  Hay que pasar la landing a i18n y añadir un selector ES/EN en la landing y el login.

- **Impacto:** la primera impresión, y la conversión, para usuarios en inglés es mala; además es incoherente con el resto de la app, ya traducida.
- **Gravedad:** Media
- **Estado:** Pendiente

### UX-02 · Contraste insuficiente en la landing (`text-zinc-500/600`)

- **Qué cambiar:** la landing (y `FeatureCard.tsx`) usa `text-zinc-500` (#71717a, ≈ 4,1:1 sobre #0a0a0a) y `text-zinc-600` (#52525b, ≈ 2,6:1) para etiquetas y textos de apoyo (21 apariciones). El resto de la app ya se subió a `zinc-400` (commit `466b5da`). Hay que usar `text-zinc-400` como mínimo en texto.
- **Impacto:** no cumple WCAG 2.1 AA (4,5:1) y cuesta leer en móvil o con mucho brillo.
- **Gravedad:** Media
- **Estado:** Pendiente

### UX-03 · Contenido estático y textos de servicios/BD sin traducir

- **Qué cambiar:**
  - **Contenido estático:**
    - Logros (`src/data/achievements.ts`), biblioteca de rituales (`src/data/ritualLibrary.ts`) y citas diarias (`src/data/quotes.ts`) están solo en inglés. Además, hay una errata en `quotes.ts:4` ("weights tons" → "weighs tons").
    - Las etiquetas de dificultad están duplicadas en `src/utils/analytics.ts:20-23` en lugar de usar i18n.
    - "ADMIN"/"Admin" está fijo en `AppLayout.tsx:176` y `ProfilePage.tsx:63`.
  - **Textos generados fuera de la UI:**
    - Notificación "Logro desbloqueado" (`src/services/achievementService.ts:57`) y recordatorio en inglés (`functions.sql:295`).
    - Errores de servicios en español: `profileService.ts:69,140,143` y `settingsService.ts:46`.
    - Errores de `validateImportData` (`validation.ts:139-164`).
    - Cabeceras de CSV en español (`src/utils/exportImport.ts:55`).

  Hay que guardar claves (o `type` + parámetros) en las notificaciones y traducirlas al mostrarlas, y añadir claves i18n para el contenido.

- **Impacto:** la app mezcla idiomas en ambos locales (logros en inglés para usuarios en español, notificaciones en español para usuarios en inglés).
- **Gravedad:** Media
- **Estado:** Pendiente

### UX-04 · Formularios de autenticación sin `<label>`

- **Qué cambiar:**
  - **Etiquetas:** los inputs de usuario, email y contraseña de `LoginPage.tsx:110-143`, `ResetPasswordPage.tsx:82-101` y el de contraseña de `SettingsPage.tsx:304-313` solo tienen `placeholder`. Hay que añadir `<label>` (visible o `sr-only`).
  - **Contraseña:** falta el botón mostrar/ocultar y la indicación de requisitos.
  - **Errores:** el `role="alert"` debe asociarse con `aria-describedby` y `aria-invalid`.
- **Impacto:** los lectores de pantalla anuncian campos sin nombre fiable, la etiqueta desaparece al escribir y se incumple WCAG 1.3.1 / 3.3.2.
- **Gravedad:** Media
- **Estado:** Pendiente

### UX-05 · Errores técnicos crudos mostrados al usuario

- **Qué cambiar:** se muestra `error.message` de Supabase o Postgres tal cual en:
  - `ProtectedRoute.tsx:29`;
  - las `ErrorState` de todas las páginas;
  - `SettingsPage.tsx:77`, por ejemplo "duplicate key value violates unique constraint profiles_username_lower_idx" al elegir un nombre ya usado;
  - `LoginPage.tsx:73`, por ejemplo "Invalid login credentials" en inglés.

  Hay que crear un `mapError(error) → TranslationKey` (códigos `23505`, `PGRST*`, `AuthApiError` con `code`) y mostrar el detalle técnico solo en consola o en `error_logs`.

- **Impacto:** mensajes incomprensibles, en otro idioma, que además filtran detalles internos (nombres de restricciones o tablas).
- **Gravedad:** Media
- **Estado:** Pendiente

### UX-06 · Acciones sin feedback de error ni actualización optimista

- **Qué cambiar:** varias mutaciones se lanzan con `void` sin `catch` ni feedback:
  - completar desde el Dashboard (`DashboardPage.tsx:129`);
  - like y seguir (`EnhancedSocial.tsx:195,219`);
  - resolver reportes (`AdminPage.tsx:108,115`);
  - marcar o borrar notificaciones (`NotificationsPage.tsx:88,97`; `NotificationBell.tsx:61,90`).

  Si fallan, el usuario no se entera (el error solo llega a `error_logs` como `unhandledrejection`). Hay que añadir un sistema de toasts global y actualizaciones optimistas con rollback (`onMutate`/`onError` de TanStack Query).

- **Impacto:** acciones que "no hacen nada" sin explicación, dobles clics y sensación de lentitud.
- **Gravedad:** Media
- **Estado:** Pendiente

### UX-07 · Acciones costosas o sensibles sin confirmación

- **Qué cambiar:**
  - **Compras:** se compra al primer clic objetos de 500 a 5000 de esencia (`ShopPage.tsx:131`).
  - **Usar objetos:** se usan sin confirmar, incluidos los permanentes (`InventoryPage.tsx`, ver COD-03).
  - **Rol de admin:** **conceder** el rol se hace sin confirmación, mientras que revocarlo sí la pide (`AdminPage.tsx:158`); el riesgo está invertido.
  - **Importar backup:** no avisa de que duplica rituales (`SettingsPage.tsx:110`).

  Hay que usar `ConfirmDialog` en todos estos casos.

- **Impacto:** compras accidentales irreversibles, escalada de privilegios por un clic erróneo y datos duplicados.
- **Gravedad:** Media
- **Estado:** Pendiente

### UX-08 · Moderación incompleta en el panel de administración

- **Qué cambiar:**
  - **Reportes:** solo muestran el id truncado del post (`AdminPage.tsx:99-101`); no se ve el contenido ni el usuario reportado. Desde el panel no se puede borrar el post o comentario ni suspender usuarios.
  - **Usuarios:** la lista está limitada a 200 (`adminService.ts:42`), sin búsqueda ni paginación.
  - **Errores:** el registro no muestra `stack` ni usuario.
  - **Errores de carga:** se ignora el error de la query de errores (`useAdmin.ts:60-64`).

  Hay que añadir la vista previa del contenido reportado, acciones de borrar, ocultar y suspender (con RPC y auditoría), búsqueda y paginación.

- **Impacto:** el administrador no puede moderar de verdad, así que los reportes no sirven para nada.
- **Gravedad:** Media
- **Estado:** Pendiente

### UX-09 · Social: seguir no hace nada y el perfil no es descubrible

- **Qué cambiar:**
  - **Seguir:** no tiene efecto visible. El feed es global (`socialService.ts:38-42`), sin filtro "Siguiendo" ni contador de seguidores.
  - **Perfiles:** los nombres de autor no enlazan al perfil; solo se llega copiando el enlace del botón "compartir" (`EnhancedSocial.tsx:252-270`), que además copia el perfil y no el post.
  - **Comentarios:** no se pueden borrar los propios (la política existe).
  - **Feed:** no muestra avatares (`authorAvatar` no se usa) y no tiene paginación (50 posts).
  - **Accesibilidad:** el botón de enviar comentario es solo un icono sin `aria-label` (`EnhancedSocial.tsx:320-325`).
- **Impacto:** funcionalidad social incompleta y confusa, y un fallo de accesibilidad en una acción principal.
- **Gravedad:** Media
- **Estado:** Pendiente

### UX-10 · No se pueden editar rituales ni objetivos; la IA crea sin previsualizar

- **Qué cambiar:**
  - **Edición:** rituales y objetivos solo se pueden crear y borrar. Hay que añadir la edición.
  - **IA:** la creación con IA (`HabitsPage.tsx:103-127`) crea **todas** las sugerencias directamente, una a una. Si falla a mitad quedan rituales sueltos y el usuario no puede elegir cuáles quiere. Hay que mostrar las sugerencias con casillas antes de crearlas.
  - **Biblioteca:** importar una plantilla dos veces la duplica sin aviso, y al escribir una búsqueda se ignora el filtro "Populares" (`RitualLibrary.tsx:50-54`).
- **Impacto:** para corregir una errata hay que borrar el ritual, y con él su historial (ver COD-14); la IA llena el grimorio de rituales no deseados.
- **Gravedad:** Media
- **Estado:** Pendiente

### UX-11 · Perfil público con datos engañosos

- **Qué cambiar:**
  - **Inventario:** en perfiles ajenos siempre muestra 0, porque `getByUsername` devuelve `inventory: []` (`profileService.ts:172`) y RLS impide leerlo. Hay que quitar la tarjeta o mostrar datos públicos reales (rituales activos, mejor racha, logros).
  - **Fecha:** "Miembro desde" incluye la hora (`ProfilePage.tsx:71`).
  - **Búsqueda por nombre:** la búsqueda por `username` distingue mayúsculas (`eq`) aunque la unicidad no las distingue. Hay que usar `ilike` o normalizar.
- **Impacto:** información falsa y enlaces que no encuentran el perfil por diferencias de mayúsculas.
- **Gravedad:** Baja
- **Estado:** Pendiente

### UX-12 · Problemas de accesibilidad en calendario, heatmap, progreso y pestañas

- **Qué cambiar:**
  - **Calendario:** `RitualCalendar.tsx:95` pone `aria-label` en `<div>` sin rol, y los lectores de pantalla lo ignoran. Hay que usar `role="gridcell"` dentro de `role="grid"`, o una tabla.
  - **Heatmap:** `Heatmap.tsx:33` no alinea las filas con los días de la semana (empieza en cualquier día) y no tiene alternativa textual navegable.
  - **Barras de progreso:** las de rango (`AppLayout.tsx:193`), objetivos y logros no tienen `role="progressbar"` ni `aria-valuenow/min/max`.
  - **Pestañas:** las de manual/IA (`HabitsPage.tsx:223-244`) no usan `role="tablist"`, `role="tab"` ni `aria-selected`.
  - **Gráficos:** los de Recharts (`AdvancedAnalytics.tsx`) no tienen tabla ni resumen alternativo.
  - **Modal:** el botón de cerrar mide 36 px (`Modal.tsx:46`), por debajo de los 44 px del resto de la app.
  - **Foco:** los inputs con `outline-none` solo cambian el color del borde al recibir el foco.
  - **Notificaciones:** el popover se declara `aria-modal="true"` (`NotificationBell.tsx:50`) aunque no es modal.
- **Impacto:** barreras para usuarios de lector de pantalla y teclado; incumplimientos puntuales de WCAG 1.3.1, 2.4.7 y 2.5.5.
- **Gravedad:** Baja
- **Estado:** Pendiente

### UX-13 · Flujos de autenticación con casos mal resueltos

- **Qué cambiar:**
  - `AuthCallbackPage.tsx:13-16` ignora `error`/`error_description` de la URL (enlace caducado o usado) y redirige a `/login` sin explicar nada.
  - Tras restablecer la contraseña, `ResetPasswordPage.tsx:22` navega a `/login`, pero la sesión sigue activa, así que `LoginPage` redirige al dashboard.
  - Al cambiar a "¿Olvidaste tu contraseña?" (`LoginPage.tsx:163`) no se limpian el error ni el mensaje anteriores.
- **Impacto:** el usuario no entiende por qué el enlace no funciona y la navegación tras el restablecimiento no es la esperada.
- **Gravedad:** Baja
- **Estado:** Pendiente

### UX-14 · i18n sin interpolación ni plurales

- **Qué cambiar:** `t()` (`src/i18n/index.tsx:825-827`) no admite parámetros ni plurales. Los textos se montan concatenando (`${count} ${t("habits.pendingCount")}`, `HabitsPage.tsx:181`; `SettingsPage.tsx:121`; `RitualCard.tsx:40`), lo que fija el orden de las palabras y da plurales incorrectos ("1 días"). Hay que añadir `t(key, params)` con `{count}` e `Intl.PluralRules`.
- **Impacto:** frases gramaticalmente incorrectas en ambos idiomas y difíciles de traducir.
- **Gravedad:** Baja
- **Estado:** Pendiente

### UX-15 · Ajustes con modelo de guardado inconsistente

- **Qué cambiar:**
  - En `SettingsPage.tsx`, el idioma se guarda al pulsarlo, pero las notificaciones y la hora del recordatorio necesitan el botón "Guardar" global, que además guarda perfil y ajustes en dos peticiones no atómicas (líneas 64-73).
  - El nombre del archivo exportado usa la fecha UTC (`toISOString`, líneas 97 y 105), en contra de la regla de `dates.ts`.

  Hay que unificar (guardado automático por campo, o un formulario por sección) y usar `toDateKey()`.

- **Impacto:** cambios que se pierden al salir sin guardar y guardados parciales si falla la segunda petición.
- **Gravedad:** Baja
- **Estado:** Pendiente

### UX-16 · Recordatorios solo in-app y solo al abrir la app

- **Qué cambiar:** `ensure_ritual_reminder` solo se ejecuta al montar `AppLayout` (`AppLayout.tsx:81-83`). Si el usuario no abre la app, nunca recibe el recordatorio. Hay que programarlo en el servidor (`pg_cron` + Web Push o email) o, como mínimo, explicar en Ajustes que el recordatorio es interno.
- **Impacto:** el ajuste "Recordatorio" promete algo que no ocurre cuando más se necesita (el usuario no ha entrado).
- **Gravedad:** Baja
- **Estado:** Pendiente (a confirmar: el SQL lo documenta como atajo temporal)
