<div align="center">

# 🔪 RitualKiller

**Advanced Ritual Tracking & Management System**

[🚀 Demo](#) - [🐛 Issues](https://github.com/n3brrr/RitualKiller/issues) - [📖 Docs](#documentation)

</div>

---

## ⚡ Overview

RitualKiller is a modern web application designed to manage and track complex sequences and rituals. Built with a robust React & TypeScript architecture, it features real-time status updates, category filtering, and a sleek, dark-themed interface powered by TailwindCSS.

### ✨ Key Features

- 🔍 **Smart Ritual Search** - Instant access to a comprehensive database of tracked rituals
- 🎭 **Category Filtering** - Intuitive filtering system to organize tasks by type or priority
- ⚡ **High Performance** - Powered by Vite for lightning-fast builds and HMR
- 🎨 **Modern Design** - Fully responsive UI with TailwindCSS v4
- 🛡️ **Type Safety** - Comprehensive TypeScript integration for mission-critical reliability

### 🛠️ Tech Stack

<p align="left">
<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
<img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
</p>

---

## 📦 Installation

### Prerequisites

- Node.js 18+ (Recommended)
- npm or pnpm

### Quick Setup

```bash
# Clone repository
git clone https://github.com/n3brrr/RitualKiller.git

# Navigate to directory
cd RitualKiller

# Install dependencies
pnpm install

# Start Development Server
pnpm run dev

# Build for Production
pnpm run build
```

## 📁 Project Structure

```bash
RitualKiller/
├── src/
│   ├── components/      # UI Components (RitualCard, SearchBar, CategoryFilters)
│   ├── hooks/          # Custom hooks (useRituals)
│   ├── assets/         # Static assets
│   ├── App.tsx         # Main application component
│   └── main.tsx        # Entry point
├── public/             # Public assets
├── index.html          # Entry HTML
├── vite.config.ts      # Vite configuration
└── package.json        # Dependencies and scripts
```

## 🔄 Architecture

```
graph TD
    User[User Interaction] --> Search[SearchBar]
    User --> Filter[CategoryFilters]
    Search --> Hook[useRituals Hook]
    Filter --> Hook
    Hook --> API[Ritual API/Store]
    API --> State[Global State]
    State --> Card[RitualCard Component]
```

## 🧪 Scripts

```
bash
# Start development server
pnpm run dev

# Build for production
pnpm run build

# Lint code
pnpm run lint

# Preview production build
pnpm run preview
```

## 👤 Author

**Rubén Torres** - [@n3brrr](https://github.com/n3brrr)
**Jesús Dominguez** - [@JesusDom](https://github.com/JesusDom)

<div align="center">
⭐ Star this repo if you find it useful
</div>
