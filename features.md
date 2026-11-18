# Propuestas de mejora y nuevas funcionalidades

Revisión del código de RitualKiller (2026-11-17). Cada punto indica qué es, qué parte del código afecta y por qué sería valioso.

Estado: `[ ]` pendiente · `[x]` hecho.

Los hallazgos de la auditoría anterior (SEC-, COD-, UX-) se han retirado de este archivo porque estaban resueltos. Siguen disponibles en el historial de git.

---

## 1. Rituales y rachas

- [x] **Marcar "ayer" desde la interfaz.** `complete_ritual` ya acepta `p_date` igual a hoy o ayer, pero `ritualService.complete` no lo envía. _Afecta:_ `ritualService.ts`, `RitualCard`, `RitualCalendar`. _Valor:_ quien olvida marcar un ritual por la noche puede recuperar la racha sin depender de la Poción de Olvido.
- [ ] **Frecuencias flexibles** (días concretos o "N veces por semana"). _Afecta:_ `check` de `rituals.frequency`, `ritual_period_start`, `compute_streak`, `isCompletedIn` en `utils/analytics.ts` y el formulario de `HabitsPage`. _Valor:_ hoy no se pueden representar hábitos como "gimnasio 3 veces por semana".
- [ ] **Rituales cuantitativos** (contador o temporizador: "8 vasos de agua", "20 minutos"). _Afecta:_ nuevas columnas `rituals.target_amount` y `rituals.unit`, `ritual_logs.amount`, `RitualCard`. _Valor:_ hoy todo es sí o no y se pierde el progreso parcial.
- [ ] **Nota o estado de ánimo al completar.** _Afecta:_ columna `ritual_logs.note`, campo opcional en la compleción y `complete_ritual`. _Valor:_ añade un diario ligero y es la base de varias funciones de IA.
- [ ] **Orden manual, etiquetas y momento del día** (mañana, tarde, noche). _Afecta:_ `rituals.position` y `rituals.tags`, `ritualService.list` (hoy ordena por `created_at`), `HabitsPage`. _Valor:_ con muchos rituales la lista se vuelve difícil de usar.
- [x] **Ver y restaurar rituales archivados.** `archivedRituals` solo se usa en analíticas y exportación. _Afecta:_ `HabitsPage` (sección "Archivados") y `ritualService.update` para poner `archived_at = null`. _Valor:_ el archivado no tiene forma de deshacerse en la interfaz.
- [ ] **Pausa o "modo vacaciones"** sin romper la racha. _Afecta:_ nueva RPC, `compute_streak`, `consume_item` y `ritual_logs.protected`. _Valor:_ hoy la única protección es la Poción de Olvido, que es de pago y solo cubre un día.

## 2. Dashboard y analíticas

- [x] **Etiqueta "Mejor racha" con dato incorrecto.** `DashboardPage.tsx` calcula el máximo con `ritual.streak` (racha actual), no con `bestStreak`. _Afecta:_ `DashboardPage.tsx`. _Valor:_ la etiqueta y el dato deben coincidir.
- [x] **Un único "hoy" entre cliente y servidor.** _(El bundle de rituales trae `today` desde `user_today()` y lo usan Dashboard, Rituales, AppLayout y la actualización optimista. `syncTimezone` no se ha tocado.)_ El cliente usa la hora del dispositivo (`toDateKey`, `useRituals` en la actualización optimista) y el servidor usa `user_settings.timezone`. Con dos dispositivos en zonas distintas, `syncTimezone` alterna el valor. _Afecta:_ `utils/dates.ts`, `useRituals.ts`, `settingsService.syncTimezone`. _Valor:_ evita que el check aparezca y desaparezca cerca de medianoche. Basta con devolver `user_today()` en el bundle de rituales.
- [ ] **Página de detalle por ritual** (`/app/habits/:id`): historial, cumplimiento, mejor racha y calendario propio. _Afecta:_ nueva página, `App.tsx`, `PAGE_TITLES`, `useRituals`. _Valor:_ las analíticas actuales son solo agregadas y no dicen qué ritual se falla.
- [x] **Progreso del día** ("3/5 hoy") en el Dashboard y en la cabecera de `AppLayout`. _Afecta:_ `DashboardPage.tsx`, `AppLayout.tsx`. _Valor:_ recompensa visual inmediata con poco coste.
- [ ] **Resumen semanal o mensual** (cumplimiento, comparación con la semana anterior, ritual más débil). _Afecta:_ nueva RPC de agregados y `AnalyticsPage`. _Valor:_ favorece la retención y sirve de base al coach de IA.

## 3. Objetivos

- [ ] **Tipos de objetivo distintos de "N compleciones"**: racha de X días, porcentaje de cumplimiento en un periodo o hitos intermedios. _Afecta:_ `goals_with_progress`, `save_goal`, `GoalsPage.tsx`. _Valor:_ contar compleciones no refleja objetivos como "no fallar en 30 días".
- [ ] **Sugerir `target_value`** a partir de los rituales vinculados, su frecuencia y los días restantes. _Afecta:_ `GoalsPage.tsx`, `utils/validation.ts`. _Valor:_ evita metas imposibles que el usuario calcula mal a mano.
- [ ] **Notificaciones de objetivo cumplido o vencido**, y archivado de objetivos terminados. _Afecta:_ `save_goal`/triggers, `utils/notificationText.ts`, `GoalsPage.tsx`. _Valor:_ cierra el ciclo del objetivo. Hoy solo existen los tipos `achievement` y `reminder`.

## 4. Gamificación: rangos, logros, tienda e inventario

- [x] **El rango se calcula con la esencia gastable.** `getRank(user.essence)` se usa en `AppLayout.tsx` y `profileService.ts`, así que comprar en la tienda puede bajar de rango. Además, por encima de 10 000 la barra puede desbordarse, porque el último tramo de `utils/rank.ts` tiene `next: 10000`. _Afecta:_ `utils/rank.ts`, `AppLayout.tsx`, `profileService.ts`. _Valor:_ va contra la economía del juego. `profiles.lifetime_essence` ya existe y es el dato correcto.
- [ ] **Más logros** (seguidores, likes recibidos, objetivos cumplidos, rituales semanales, logros ocultos). _Afecta:_ `user_stats`, `achievement_definitions`, `data/achievements.ts`. _Valor:_ 13 logros se agotan pronto y la tabla ya está orientada a datos.
- [ ] **Ampliar la tienda**: cosméticos visibles (marcos de avatar, temas, títulos), que la Poción de Olvido sirva también para rituales semanales (hoy solo restaura diarios) y decidir si los buffs se acumulan (hoy se aplica `max(multiplier)`). _Afecta:_ `consume_item`, `data/items.ts`, `ShopPage`, `InventoryPage`. _Valor:_ la esencia necesita usos con sentido a largo plazo.
- [ ] **Retos temporales** con recompensa (eventos semanales). _Afecta:_ nueva tabla `challenges`, evaluación en el servidor como los logros, nueva página. _Valor:_ novedad recurrente sin crear contenido cada vez.

## 5. Comunidad (social)

- [x] **Notificaciones sociales** de likes, comentarios y seguidores. _Afecta:_ triggers sobre `post_likes`, `comments` y `follows`, `utils/notificationText.ts`, `NotificationsPage.tsx`. _Valor:_ hoy nadie se entera de las interacciones, y eso es el motor de cualquier feed.
- [ ] **Compartir un hito** (logro o racha) como publicación prellenada. _Afecta:_ `AchievementsPage`, notificaciones, `socialService.createPost`. _Valor:_ genera contenido en el feed de forma natural.
- [ ] **Clasificación entre seguidos**, semanal y basada en compleciones y no en esencia acumulada. _Afecta:_ nueva RPC sobre `public_profiles` y `ritual_logs`, nueva vista o sección en `SocialPage`. _Valor:_ competencia sana y accesible también para usuarios nuevos.
- [ ] **Compañero de rendición de cuentas** o rituales compartidos entre dos usuarios. _Afecta:_ nueva tabla de vínculos, RLS, `SocialPage`. _Valor:_ el compromiso social es de lo que más ayuda a la constancia.
- [ ] **Bloquear o silenciar usuarios.** Hoy solo se puede reportar. _Afecta:_ nueva tabla `blocks`, filtros en `getFeedPage` y en las RLS de lectura. _Valor:_ control del usuario sobre su experiencia.
- [ ] **Consultas del feed escalables.** `getFeedPage` descarga las filas de `post_likes` y `comments` de las 20 publicaciones de la página solo para contarlas, y PostgREST puede truncar en silencio al llegar a su límite de filas. _Afecta:_ `socialService.ts` (`getFeedPage`). _Valor:_ recuentos correctos y escalables. Se resuelve con una vista de recuentos y comentarios paginados.
- [ ] **Supabase Realtime** para el feed y las notificaciones, en lugar del sondeo cada 60 s. _Afecta:_ `hooks/useNotifications.ts`, `hooks/useSocial.ts`, `NotificationBell.tsx`. _Valor:_ actualizaciones inmediatas y menos peticiones.

## 6. Notificaciones y recordatorios

- [ ] **Recordatorios reales** con Web Push o email, programados con `pg_cron`. _Afecta:_ `ensure_ritual_reminder` (hoy solo se ejecuta al montar `AppLayout`), `notificationService.ts`, Edge Function nueva. _Valor:_ el recordatorio hace falta justo cuando el usuario no ha entrado en la app.
- [ ] **Hora de recordatorio por ritual**, además de la global de `user_settings.reminder_time`. _Afecta:_ `rituals`, `ensure_ritual_reminder`, `SettingsPage.tsx`. _Valor:_ no todos los hábitos ocurren a la misma hora.
- [ ] **Retención y paginación de notificaciones.** _(Hecha solo la paginación con "Cargar más"; falta la limpieza con `pg_cron`, ver pendientes.)_ Hoy `list` usa `limit(50)` y nunca se limpian. _Afecta:_ `notificationService.ts`, nueva limpieza con `pg_cron`, `NotificationsPage.tsx`. _Valor:_ la tabla crece sin control y el listado se corta sin paginar.

## 7. Cuenta, ajustes y datos

- [ ] **Inicio de sesión con OAuth** (Google o GitHub), enlace mágico y MFA (TOTP). _Afecta:_ `authService.ts`, `LoginPage.tsx`, `SettingsPage.tsx`, configuración de Auth en Supabase. _Valor:_ menos fricción al registrarse y más seguridad.
- [ ] **Avatar en Supabase Storage** en lugar de una URL `https` externa. _Afecta:_ `profileService.updateProfile`, `SettingsPage.tsx`, `Avatar.tsx`, políticas de Storage. _Valor:_ no depende de terceros y evita enlaces que se rompen.
- [ ] **Exportación completa**: objetivos, logros, inventario y publicaciones. Hoy `exportData` solo incluye rituales y registros. _Afecta:_ `utils/exportImport.ts`, `ritualService.listAllLogs`, `SettingsPage.tsx`. _Valor:_ portabilidad real de los datos del usuario.

## 8. Administración

- [ ] **Gestionar desde el panel el catálogo de la tienda y las definiciones de logros.** Hoy solo se puede cambiar por SQL. _Afecta:_ nuevas RPC `admin_*`, `adminService.ts`, pestaña nueva en `AdminPage.tsx`. _Valor:_ operar el juego sin tocar la base de datos a mano.
- [x] **Mostrar el registro de `moderation_actions`.** La tabla existe, pero `AdminPage` no la muestra. _Afecta:_ `adminService.ts`, `AdminPage.tsx`. _Valor:_ trazabilidad entre moderadores.
- [ ] **Métricas con series temporales** (usuarios activos diarios, retención a 7 y 30 días), **errores agrupados** por mensaje (hoy son los últimos 25 de `getErrorLogs`) y **paginación de reportes** (hoy `limit(100)`). _Afecta:_ `admin_metrics`, `adminService.ts`, `AdminPage.tsx`. _Valor:_ detectar problemas y escalar la moderación.

## 9. Rendimiento y arquitectura

- [x] **Reescribir `compute_streak`** con la técnica de _gaps-and-islands_ que ya usa `longest_full_day_run`. Hoy hace una consulta `EXISTS` por periodo y `rituals_with_streak` la llama para cada ritual en cada carga. _Afecta:_ migración nueva con `compute_streak`, `refresh_ritual_streak` y la vista. _Valor:_ el coste crece con rituales × racha y se nota con rachas largas.
- [x] **Reducir las invalidaciones tras cada check.** `useRituals` invalida seis consultas, y una de ellas vuelve a descargar 400 días de registros paginados. _Afecta:_ `hooks/useRituals.ts`. _Valor:_ es la acción más frecuente de la app. La RPC ya devuelve `essence_gained` y `streak`, así que basta con `setQueryData` y una invalidación más perezosa.
- [ ] **Evaluar logros solo por las métricas afectadas.** `evaluate_achievements` recalcula todo `user_stats` (incluido `longest_full_day_run`) en cada inserción de registro. _Afecta:_ migración nueva con `evaluate_achievements` y sus triggers. _Valor:_ menos carga en cada check.
- [ ] **Tipos generados** con `supabase gen types typescript` en lugar de las interfaces `*Row` escritas a mano en cada servicio. _Afecta:_ `src/services/*.ts`, `src/types/index.ts`. _Valor:_ evita desajustes silenciosos entre esquema y cliente.

## 10. Calidad, tests y DevOps

- [ ] **Tests de componentes y páginas** con Testing Library para `HabitsPage`, `GoalsPage` y `SettingsPage`. _Afecta:_ `src/features/*/pages`, `src/test`. _Valor:_ hoy no hay ningún test de página.
- [ ] **Tests E2E con Playwright** de los flujos críticos (registro, crear ritual, completar, comprar). _Afecta:_ nueva carpeta `e2e/`, `ci.yml`. _Valor:_ detecta regresiones de extremo a extremo.
- [ ] **Tests de las Edge Functions** con `deno test`. _Afecta:_ `supabase/functions/*`, `ci.yml`. _Valor:_ hoy `delete-account` y `ai-suggest-rituals` no tienen tests.
- [ ] **Umbral de cobertura y chequeo de accesibilidad automático** (axe o Lighthouse CI) en `ci.yml`. _Afecta:_ `vitest.config.ts`, `ci.yml`. _Valor:_ respalda la promesa de WCAG 2.1 AA del README.

## 11. PWA, accesibilidad e i18n

- [ ] **PWA instalable**: manifest y service worker (por ejemplo con `vite-plugin-pwa`). _Afecta:_ `public/` (hoy solo tiene `favicon.svg`, `og.png` y `locale-init.js`), `vite.config.ts`, `index.html`. _Valor:_ instalación como app y requisito para Web Push en iOS.
- [ ] **Completar sin conexión**: cola de mutaciones persistida (persistencia de TanStack Query) que se sincroniza al recuperar la red. _Afecta:_ `src/index.tsx`, `hooks/useRituals.ts`. _Valor:_ el check diario no debería perderse por falta de cobertura.
- [ ] **Más idiomas.** Los diccionarios tipados (`Record<TranslationKey, string>`) hacen que añadir uno sea un trabajo mecánico. _Afecta:_ `src/i18n/`, `utils/notificationText.ts`, `data/`. _Valor:_ llegar a más usuarios.

---

## 12. Integraciones y funciones de IA

**Situación actual:** la infraestructura existe (`AiProvider`, `edgeFunctionProvider`, `sanitizeSuggestions`, cuota en `consume_ai_quota` y la Edge Function `ai-suggest-rituals`), pero no está conectada a ninguna pantalla. `getAiProvider()` no se usa en ningún sitio, y `generateSuggestions` devuelve `null` en `supabase/functions/ai-suggest-rituals/index.ts`. El primer paso es cerrar ese circuito.

- [ ] **Sugerencias de rituales a partir de un objetivo.** Implementar `generateSuggestions` con un proveedor y salida JSON estructurada. En `HabitsPage` o `RitualLibrary`, mostrar vista previa con casillas antes de crear nada (UX-10 de la auditoría anterior). Pasar al modelo los títulos existentes para evitar duplicados y respetar el bloqueo de dificultad `master`. _Valor:_ es el uso para el que se preparó la base, con coste bajo.
- [ ] **Alta rápida en lenguaje natural.** "Leer 20 min cada noche" se convierte en `{title, frequency, difficulty}` y rellena el formulario sin guardarlo. _Afecta:_ `HabitsPage`, `utils/validation.ts`, la Edge Function. _Valor:_ menos fricción al crear rituales, con un modelo pequeño.
- [ ] **Plan para un objetivo.** Desde `GoalsPage`, el modelo propone rituales vinculados, un `target_value` y una fecha razonables. El usuario confirma antes de llamar a `save_goal`. _Valor:_ convierte una intención vaga en algo medible.
- [ ] **Coach semanal personalizado.** La Edge Function recibe solo agregados (`my_stats`, cumplimiento por ritual y día de la semana), nunca nombres de usuario ni texto libre, y genera un resumen breve en el idioma del usuario. Se guarda una vez por semana para acotar el coste. _Valor:_ retención, con la privacidad controlada.
- [ ] **Detección de riesgo de abandono y ajuste de dificultad.** Sin modelo de lenguaje: heurísticas sobre los registros (cumplimiento decreciente, hora habitual de compleción). Sugiere dividir un ritual, bajar su dificultad o mover el recordatorio. Opcionalmente, un modelo redacta el mensaje. _Valor:_ IA barata, explicable y fácil de probar.
- [ ] **Moderación asistida.** Clasificar en una Edge Function las publicaciones reportadas y priorizarlas en la cola de `report_details` de `AdminPage`. Nunca borrar automáticamente: siempre decide un moderador. _Valor:_ escala la moderación sin quitar el control humano.
- [ ] **Resumen mensual del diario** (si se implementan las notas al completar). Opcional y con consentimiento explícito, porque son datos sensibles. _Valor:_ valor emocional para el usuario.
- [ ] **Traducción ES↔EN de publicaciones** bajo demanda. _Valor:_ la comunidad es bilingüe por diseño.

**Requisitos comunes para cualquier función de IA:**

- Cuota por función: añadir una columna `feature` a `ai_usage`, porque hoy hay un único límite global de 20 por hora.
- Tope de gasto diario por usuario.
- Consentimiento y activación desde Ajustes.
- Volver a sanear la salida también en el servidor (hoy solo se hace en el cliente).
- No enviar datos personales al proveedor.
- Mantener `VITE_AI_ENABLED` como interruptor general.

---

## Prioridad recomendada

1. Calcular el rango con `lifetime_essence` (sección 4).
2. Permitir marcar "ayer" desde la interfaz (sección 1).
3. Corregir la etiqueta "Mejor racha" (sección 2).
4. Ver y restaurar rituales archivados (sección 1).
5. Notificaciones sociales (sección 5).
6. Reescribir `compute_streak` y reducir las invalidaciones tras cada check (sección 9).
7. Conectar las sugerencias de IA (sección 12, primeros dos puntos).

---

## Pendiente de decisión (no implementado en esta iteración)

No se han asumido interpretaciones. Estos puntos quedan a la espera de respuesta:

- **Excluidos por petición expresa (sin tests por ahora):** toda la sección 10 (tests de componentes, E2E, Edge Functions, cobertura/axe).
- **Dependen de servicios o configuración externa que hay que elegir:** OAuth/magic link/MFA (proveedores y panel de Auth), Web Push o email y `pg_cron` (recordatorios, retención de notificaciones), Supabase Storage para avatares, PWA/service worker y cola sin conexión, Supabase Realtime, tipos generados (`supabase gen types` necesita CLI y proyecto enlazado).
- **IA (sección 12):** hay que decidir proveedor y modelo, topes de gasto y la UX de consentimiento en Ajustes antes de conectar `generateSuggestions`.
- **Cambios de modelo de datos con varias lecturas posibles:** frecuencias flexibles ("N veces por semana" frente a días concretos), rituales cuantitativos, notas al completar, orden manual/etiquetas/momento del día, modo vacaciones, tipos de objetivo nuevos, sugerencia de `target_value`, notificaciones de objetivo vencido (necesita tarea programada), retos temporales, compañero de rendición de cuentas, clasificación entre seguidos, bloqueo/silencio de usuarios.
- **Contenido del juego a decidir:** más logros y cosméticos, si los buffs se acumulan y si la Poción de Olvido cubre rituales semanales.
- **Rendimiento a valorar con datos reales:** feed escalable (vista de recuentos), evaluar logros solo por las métricas afectadas, métricas de administración con series temporales, catálogo de tienda/logros editable desde el panel, exportación completa, más idiomas.
