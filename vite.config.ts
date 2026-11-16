import path from "path";
import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

const ollamaTarget = process.env.OLLAMA_URL || "http://localhost:11434";

// The bundle report is only generated on demand (`pnpm analyze`) and never inside
// `dist`, so it is not published with the production build.
export default defineConfig(({ mode }) => ({
  server: {
    port: 3000,
    host: "0.0.0.0",
    proxy: {
      "/ollama": {
        target: ollamaTarget,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ollama/, ""),
      },
    },
  },
  preview: {
    port: 3000,
    host: "0.0.0.0",
    proxy: {
      "/ollama": {
        target: ollamaTarget,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ollama/, ""),
      },
    },
  },
  plugins: [
    react(),
    mode === "analyze" &&
      (visualizer({
        open: false,
        filename: "reports/bundle-stats.html",
        gzipSize: true,
        brotliSize: true,
      }) as PluginOption),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": ["lucide-react", "framer-motion"],
          "vendor-utils": ["@tanstack/react-query", "zustand"],
          "vendor-supabase": ["@supabase/supabase-js"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}));
