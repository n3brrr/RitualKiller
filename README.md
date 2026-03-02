<div align="center">

# 🔪 RitualKiller

**Sistema Avanzado de Seguimiento y Gestión de Rituales**

[🚀 Demo]((https://ritualkiller.vercel.app/)) - [🐛 Incidencias](https://github.com/n3brrr/RitualKiller/issues) - [📖 Documentación](#documentation)

</div>

---

## ⚡ Descripción General

RitualKiller es una aplicación web moderna diseñada para gestionar y realizar el seguimiento de secuencias y rituales complejos. Construida con una arquitectura robusta de React y TypeScript, cuenta con actualizaciones de estado en tiempo real, filtrado por categorías y una interfaz elegante de tema oscuro impulsada por TailwindCSS.

### ✨ Características Principales

- 🔍 **Búsqueda Inteligente de Rituales** - Acceso instantáneo a una base de datos exhaustiva de rituales registrados
- 🎭 **Filtrado por Categorías** - Sistema de filtrado intuitivo para organizar tareas por tipo o prioridad
- ⚡ **Alto Rendimiento** - Impulsado por Vite para compilaciones ultrarrápidas y HMR
- 🎨 **Diseño Moderno** - Interfaz totalmente responsiva con TailwindCSS v4
- 🛡️ **Seguridad de Tipos** - Integración completa de TypeScript para una fiabilidad de misión crítica

### 🛠️ Stack Tecnológico

<p align="left">
<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
<img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
</p>

---

## 📦 Instalación

### Requisitos Previos

- Node.js 18+ (Recomendado)
- npm o pnpm

### Configuración Rápida

```bash
# Clonar el repositorio
git clone https://github.com/n3brrr/RitualKiller.git

# Navegar al directorio
cd RitualKiller

# Instalar dependencias
pnpm install

# Iniciar el Servidor de Desarrollo
pnpm run dev

# Compilar para Producción
pnpm run build
```

## 📁 Estructura del Proyecto

```bash
RitualKiller/
├── src/
│   ├── components/      # Componentes de UI (RitualCard, SearchBar, CategoryFilters)
│   ├── hooks/          # Hooks personalizados (useRituals)
│   ├── assets/         # Recursos estáticos
│   ├── App.tsx         # Componente principal de la aplicación
│   └── main.tsx        # Punto de entrada
├── public/             # Recursos públicos
├── index.html          # HTML de entrada
├── vite.config.ts      # Configuración de Vite
└── package.json        # Dependencias y scripts
```

## 🔄 Arquitectura

```
graph TD
    User[Interacción del Usuario] --> Search[Barra de Búsqueda]
    User --> Filter[Filtros de Categoría]
    Search --> Hook[Hook useRituals]
    Filter --> Hook
    Hook --> API[API/Almacén de Rituales]
    API --> State[Estado Global]
    State --> Card[Componente RitualCard]
```

## 🧪 Scripts

```bash
# Iniciar servidor de desarrollo
pnpm run dev

# Compilar para producción
pnpm run build

# Analizar código (Lint)
pnpm run lint

# Previsualizar compilación de producción
pnpm run preview
```

## 👤 Autores

**Rubén Torres** - [@n3brrr](https://github.com/n3brrr) <br>
**Jesús Dominguez** - [@JesusDI04](https://github.com/JesusDI04)

<div align="center">
⭐ Dale una estrella a este repositorio si te resulta útil
</div>
