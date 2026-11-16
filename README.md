<div align="center">

# 🔪 RitualKiller

**Sistema de seguimiento de hábitos y rituales, mobile-first y con datos persistentes**

[🚀 Demo](https://ritualkiller.vercel.app/) - [🐛 Incidencias](https://github.com/n3brrr/RitualKiller/issues)

</div>

---

## ⚡ Descripción general

RitualKiller convierte hábitos diarios en rituales medibles: rachas, esencia, logros, objetivos, comunidad y una tienda de artefactos. La autenticación y los datos viven en Supabase, sin claves privadas en el navegador.

### ✨ Características

- 📜 **Rituales diarios y semanales** con rachas, recompensas y calendario.
- 💾 **Persistencia real en Supabase** con RLS y RPC transaccionales.
- 👥 **Comunidad**: publicaciones, likes, comentarios, follows y reportes.
- 🎯 **Objetivos** vinculados a rituales y progreso calculado desde el historial.
- 🏆 **Logros persistidos** y notificaciones in-app.
- 🛒 **Mercado e inventario** con compra y consumo transaccional.
- 📊 **Analíticas** de 7/30/90 días y exportación CSV/JSON.
- 🧠 **Base preparada para IA** en servidor (Edge Function autenticada con cuota), desactivada por defecto.
- 🛡️ **Panel de administración** con métricas, usuarios, reportes y errores.
- 📱 **Mobile-first**, accesible y con interfaz ES/EN.
- 🔐 **Sin claves privadas en el cliente**: solo la anon key pública de Supabase.

### 🛠️ Stack

<p align="left">
<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
<img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
<img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
</p>

---

## 📦 Instalación

### Requisitos

- Node.js 22+
- [pnpm](https://pnpm.io/) 12 (único gestor soportado)
- Un proyecto de [Supabase](https://supabase.com/)
- Docker (opcional, para el despliegue)

### Configuración rápida

```bash
git clone https://github.com/n3brrr/RitualKiller.git
cd RitualKiller

pnpm install
cp .env.example .env
# Rellena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
```

Aplica **todas** las migraciones de `supabase/migrations/` en orden (con
`supabase db push` o pegándolas en el SQL Editor), despliega las Edge Functions y
revisa la configuración de Auth descrita en [`supabase/README.md`](supabase/README.md).

Después arranca el cliente:

```bash
pnpm dev
```

La app queda en `http://localhost:3000`.

### IA (opcional, desactivada por defecto)

La integración anterior con Ollama se ha eliminado. Las futuras funciones de IA se
conectan mediante la interfaz `AiProvider` de `src/services/ai/` y la Edge Function
`supabase/functions/ai-suggest-rituals`, que valida la sesión, aplica una cuota por
usuario (`consume_ai_quota`) y es el único lugar donde puede vivir la clave del
proveedor (como secreto de Supabase). Mientras `VITE_AI_ENABLED` no sea `true`, la
interfaz no muestra ningún punto de entrada de IA.

### Despliegue con Docker

```bash
# Define las variables en tu entorno o en un .env local (no se versiona)
docker compose up --build
```

- Web: `http://localhost:8080` (nginx sin privilegios de root, con `HEALTHCHECK` en `/healthz`).
- El contenedor sirve la SPA con fallback a `index.html`, cabeceras de seguridad
  (CSP, HSTS, Permissions-Policy) y `index.html` sin caché para que cada despliegue
  se recoja al instante.
- Si usas un dominio propio para Supabase, añádelo a `connect-src` en
  `docker/security-headers.conf` y en `vercel.json`.

## 🧪 Scripts

```bash
pnpm dev          # Servidor de desarrollo
pnpm build        # Build de producción
pnpm preview      # Previsualizar el build
pnpm typecheck    # TypeScript sin emisión
pnpm lint         # ESLint
pnpm test         # Vitest (cliente)
pnpm test:db      # Migraciones, RLS y RPC sobre Postgres en memoria (PGlite)
pnpm format       # Prettier
pnpm analyze      # Informe del bundle en reports/ (no se publica)
pnpm verify       # format:check + typecheck + lint + test + test:db + build
```

## 📁 Estructura

```text
RitualKiller/
├── src/
│   ├── components/      # UI (rituales, social, analytics, layout...)
│   ├── features/        # Páginas por dominio
│   ├── hooks/           # Hooks de React Query
│   ├── services/        # Acceso a Supabase y proveedores de IA
│   ├── i18n/            # Diccionarios ES/EN
│   ├── utils/           # Fechas, validación, export/import, analítica
│   └── App.tsx          # Router y providers
├── supabase/migrations/ # Esquema, RLS y RPC
├── supabase/functions/  # Edge Functions (Deno)
├── docker/              # Configuración de nginx
├── Dockerfile
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## 🔐 Seguridad

- Row Level Security activo en todas las tablas. Los datos que afectan a la
  economía o a la integridad del juego (inventario, ventajas, historial de
  rituales, logros y notificaciones) **solo** los escriben funciones
  `SECURITY DEFINER` que validan `auth.uid()`; el cliente no puede insertarlos.
- La recompensa de un ritual, la fecha válida de completado (hoy o ayer en la zona
  horaria del usuario), las rachas, los logros y los efectos de los objetos se
  calculan en el servidor.
- Los perfiles ajenos se leen a través de la vista `public_profiles`, que no expone
  `is_admin` ni otros datos privados.
- Límites de frecuencia en publicaciones, comentarios, reportes y follows, y
  suspensión temporal de usuarios desde el panel de administración (con registro de
  auditoría).
- Las funciones no son ejecutables por usuarios anónimos salvo que se concedan
  explícitamente.
- "Eliminar cuenta" borra el usuario de Auth (Edge Function `delete-account`) y, en
  cascada, todos sus datos.
- La `anon key` de Supabase es pública por diseño; la autorización real la aplican RLS
  y las funciones del servidor. No hay claves de proveedores de IA en el cliente.
- Los errores de cliente se registran en `error_logs` (solo usuarios autenticados,
  con límites de tamaño y de frecuencia; lectura solo para admins).
- `pnpm test:db` reproduce los ataques conocidos (inventario o ventajas forjadas,
  logros autoconcedidos, fechas arbitrarias...) y comprueba que se rechazan.

## 👤 Autores

**Rubén Torres** - [@n3brrr](https://github.com/n3brrr) <br>
**Jesús Dominguez** - [@JesusDI04](https://github.com/JesusDI04)

<div align="center">
⭐ Dale una estrella a este repositorio si te resulta útil
</div>
