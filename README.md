<div align="center">

# 🔪 RitualKiller

**Sistema de seguimiento de hábitos y rituales, mobile-first y con datos persistentes**

[🚀 Demo](https://ritualkiller.vercel.app/) - [🐛 Incidencias](https://github.com/n3brrr/RitualKiller/issues)

</div>

---

## ⚡ Descripción general

RitualKiller convierte hábitos diarios en rituales medibles: rachas, esencia, logros, objetivos, comunidad y una tienda de artefactos. La autenticación y los datos viven en Supabase; la generación de rituales con IA se ejecuta en local mediante Ollama, sin claves de terceros en el navegador.

### ✨ Características

- 📜 **Rituales diarios y semanales** con rachas, recompensas y calendario.
- 💾 **Persistencia real en Supabase** con RLS y RPC transaccionales.
- 👥 **Comunidad**: publicaciones, likes, comentarios, follows y reportes.
- 🎯 **Objetivos** vinculados a rituales y progreso calculado desde el historial.
- 🏆 **Logros persistidos** y notificaciones in-app.
- 🛒 **Mercado e inventario** con compra y consumo transaccional.
- 📊 **Analíticas** de 7/30/90 días y exportación CSV/JSON.
- 🧠 **IA local con Ollama** (fallback a sugerencias locales si no está disponible).
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
<img src="https://img.shields.io/badge/Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white" alt="Ollama" />
</p>

---

## 📦 Instalación

### Requisitos

- Node.js 22+
- [pnpm](https://pnpm.io/) 12 (único gestor soportado)
- Un proyecto de [Supabase](https://supabase.com/)
- Docker (opcional, para Ollama y despliegue)

### Configuración rápida

```bash
git clone https://github.com/n3brrr/RitualKiller.git
cd RitualKiller

pnpm install
cp .env.example .env
# Rellena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
```

Aplica las migraciones en orden desde el SQL Editor de Supabase (o con `supabase db push`):

```text
supabase/migrations/20261113000100_schema.sql
supabase/migrations/20261113000200_rls.sql
supabase/migrations/20261113000300_functions.sql
```

Después arranca el cliente:

```bash
pnpm dev
```

La app queda en `http://localhost:3000`.

### IA local con Ollama

```bash
docker compose up -d ollama ollama-pull
pnpm dev
```

Vite proxya `/ollama` hacia `http://localhost:11434`. Si Ollama no responde, la app usa sugerencias locales sin romper el flujo. El modelo se configura con `VITE_OLLAMA_MODEL` (por defecto `llama3.2`).

### Despliegue con Docker

```bash
# Define las variables en tu entorno o en un .env local (no se versiona)
docker compose up --build
```

- Web: `http://localhost:8080`
- Ollama: `http://localhost:11434`
- El contenedor web sirve la SPA con fallback a `index.html` y proxya `/ollama`.

## 🧪 Scripts

```bash
pnpm dev          # Servidor de desarrollo
pnpm build        # Build de producción
pnpm preview      # Previsualizar el build
pnpm typecheck    # TypeScript sin emisión
pnpm lint         # ESLint
pnpm test         # Vitest
pnpm format       # Prettier
pnpm verify       # typecheck + lint + test + build
```

## 📁 Estructura

```text
RitualKiller/
├── src/
│   ├── components/      # UI (rituales, social, analytics, layout...)
│   ├── features/        # Páginas por dominio
│   ├── hooks/           # Hooks de React Query
│   ├── services/        # Acceso a Supabase y Ollama
│   ├── i18n/            # Diccionarios ES/EN
│   ├── utils/           # Fechas, validación, export/import, analítica
│   └── App.tsx          # Router y providers
├── supabase/migrations/ # Esquema, RLS y RPC
├── docker/              # Configuración de nginx
├── Dockerfile
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## 🔐 Seguridad

- Row Level Security activo en todas las tablas.
- Las mutaciones sensibles (completar/deshacer ritual, comprar/consumir, borrar datos, admin) pasan por funciones `SECURITY DEFINER` que validan `auth.uid()`.
- El perfil protege `essence`, `is_admin` y `created_at` mediante trigger.
- La `anon key` de Supabase es pública por diseño; la autorización real la aplica RLS.
- No hay claves de Gemini ni de otros proveedores en el repositorio ni en el bundle.
- Los errores de cliente se registran en `error_logs` (solo lectura para admins).

## 👤 Autores

**Rubén Torres** - [@n3brrr](https://github.com/n3brrr) <br>
**Jesús Dominguez** - [@JesusDI04](https://github.com/JesusDI04)

<div align="center">
⭐ Dale una estrella a este repositorio si te resulta útil
</div>
