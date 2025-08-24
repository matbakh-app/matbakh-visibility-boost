import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    mode === 'development' && visualizer({ 
      filename: 'stats.html', 
      gzipSize: true,
      brotliSize: true,
      open: false
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          
          // UI libraries
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          
          // Data & API
          query: ['@tanstack/react-query'],
          supabase: ['@supabase/supabase-js'],
          
          // Icons & Styling
          icons: ['lucide-react'],
          charts: ['recharts'],
          
          // i18n
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          
          // Utils
          utils: ['clsx', 'tailwind-merge', 'date-fns'],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
}));
