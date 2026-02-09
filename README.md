# 🎯 RitualKiller - TFG

Una aplicación web moderna para el seguimiento de hábitos (rituales) con gamificación, integración de IA y diseño gótico/cyberpunk.

## ✨ Características Principales

- 🎮 **Sistema de Gamificación**: Gana esencia completando rituales, sube de rango y desbloquea logros
- 🤖 **IA Integrada**: Genera rituales personalizados usando Google Gemini AI basados en tus objetivos
- 📊 **Visualización de Progreso**: Heatmap de consistencia y estadísticas detalladas
- 🛒 **Tienda Virtual**: Gasta tu esencia en objetos y logros
- 👥 **Red Social**: Comparte tus logros con la comunidad (Coven)
- 🎨 **Diseño Único**: Interfaz oscura con estética gótica/cyberpunk

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **Estilos**: Tailwind CSS + PostCSS
- **Animaciones**: GSAP + Framer Motion
- **Routing**: React Router DOM v7
- **Backend**: Supabase (autenticación y base de datos)
- **IA**: Google Gemini AI
- **Iconos**: Lucide React

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ (LTS recomendado)
- npm o yarn
- Cuenta de Google para Gemini API (opcional)
- Cuenta de Supabase (opcional, para autenticación)

### Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone <repository-url>
   cd RitualKiller-TFG
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   
   Copia `.env.example` a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   
   Edita `.env.local` y agrega tus credenciales:
   ```env
   # Supabase (opcional)
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
   
   # Gemini AI (opcional, usa fallback si no está configurado)
   VITE_GEMINI_API_KEY=tu_clave_de_gemini_api
   ```

4. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```
   
   La aplicación estará disponible en `http://localhost:3000`

5. **Build para producción:**
   ```bash
   npm run build
   ```

6. **Preview de producción:**
   ```bash
   npm run preview
   ```

## 📁 Estructura del Proyecto

```
RitualKiller-TFG/
├── src/
│   ├── components/        # Componentes reutilizables
│   │   ├── ui/            # Componentes de UI básicos
│   │   ├── rituals/       # Componentes relacionados con rituales
│   │   └── Layout.tsx      # Layout principal
│   ├── contexts/          # Context API para estado global
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Librerías y configuraciones
│   ├── pages/             # Páginas de la aplicación
│   ├── styles/            # Estilos globales
│   ├── types/             # Definiciones de tipos TypeScript
│   ├── utils/             # Utilidades y helpers
│   └── App.tsx            # Componente raíz
├── services/              # Servicios externos (Gemini AI)
├── public/                # Archivos estáticos
├── tailwind.config.js     # Configuración de Tailwind
├── postcss.config.js      # Configuración de PostCSS
├── vite.config.ts         # Configuración de Vite
└── tsconfig.json          # Configuración de TypeScript
```

## 🎮 Uso de la Aplicación

### Crear un Ritual

1. Ve a la página "Rituals" (Grimorio)
2. Haz clic en "New Ritual"
3. Elige entre:
   - **Manual Entry**: Crea tu ritual manualmente
   - **AI Summoner**: Usa IA para generar rituales basados en un objetivo

### Completar Rituales

- Haz clic en el botón de check junto a cada ritual para marcarlo como completado
- Gana esencia al completar rituales
- Las rachas aumentan tu recompensa de esencia

### Ver Estadísticas

- Visita el Dashboard (Altar) para ver:
  - Total de esencia acumulada
  - Rituales activos
  - Mejor racha
  - Heatmap de consistencia
  - Rituales pendientes del día

### Tienda (Black Market)

- Gasta tu esencia en objetos y logros
- Los objetos comprados se agregan a tu inventario

## 🔧 Configuración Avanzada

### Tailwind CSS

La configuración de Tailwind está en `tailwind.config.js`. Los colores personalizados están bajo el namespace `ritual`:

- `ritual-black`: #0a0a0a
- `ritual-dark`: #121212
- `ritual-accent`: #22c55e (verde neón)
- `ritual-blood`: #9f1239

### Tipos TypeScript

Todos los tipos están definidos en `src/types/index.ts`. Los tipos principales son:

- `User`: Información del usuario
- `Ritual`: Ritual/hábito del usuario
- `RitualLog`: Registro de completado de ritual
- `ShopItem`: Item de la tienda
- `SocialPost`: Post en la red social

## 🐛 Solución de Problemas

### La aplicación no carga
- Verifica que todas las dependencias estén instaladas: `npm install`
- Revisa la consola del navegador para errores
- Asegúrate de que las variables de entorno estén configuradas correctamente

### Gemini AI no funciona
- Verifica que `VITE_GEMINI_API_KEY` esté configurado en `.env.local`
- La aplicación usará sugerencias de fallback si la API no está disponible
- Revisa la consola para mensajes de error

### Supabase no funciona
- Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén configurados
- La aplicación funciona sin Supabase usando localStorage (modo demo)

## 📝 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm run preview`: Previsualiza el build de producción

## 🤝 Contribuir

Este es un proyecto de TFG (Trabajo de Fin de Grado). Las contribuciones son bienvenidas, pero por favor:

1. Crea un issue antes de hacer cambios grandes
2. Sigue las convenciones de código existentes
3. Asegúrate de que el código compile sin errores
4. Prueba tus cambios antes de hacer commit

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🎯 Roadmap y Mejoras

Ver [MEJORAS_Y_ADDONS.md](./MEJORAS_Y_ADDONS.md) para una lista completa de mejoras propuestas y addons futuros.

## 👨‍💻 Autor

Proyecto desarrollado como Trabajo de Fin de Grado (TFG).

---

**Nota**: Esta aplicación está diseñada con una estética oscura y temática gótica/cyberpunk. El sistema de "rituales" es una metáfora para hábitos y disciplina personal.
