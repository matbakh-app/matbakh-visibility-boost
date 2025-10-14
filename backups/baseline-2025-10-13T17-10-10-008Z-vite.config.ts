import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// import { componentTagger } from "lovable-tagger"; // Disabled - package not available
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 5173,
    // Enhanced HMR configuration
    hmr: {
      overlay: true,
      clientPort: 5173,
    },
    // Faster file watching
    watch: {
      usePolling: false,
      interval: 100,
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/src/archive/**',
        '**/.git/**',
        '**/test-results/**',
        '**/playwright-report/**'
      ]
    },
    // Optimized middleware
    middlewareMode: false,
    // Faster startup
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/components/**/*.tsx',
        './src/hooks/**/*.ts',
        './src/lib/**/*.ts'
      ]
    },
    headers: {
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;"
    },
    proxy: {
      // Proxy persona API to mock service or staging
      '/api/persona': {
        target: mode === 'development' ? 'http://localhost:3001' : 'https://api-staging.matbakh.app',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Persona API proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Persona API proxy request:', req.method, req.url);
          });
        },
      },
    },
  },
  plugins: [
    react({
      // Enhanced Fast Refresh configuration
      fastRefresh: true,
      // Include development helpers
      include: "**/*.{jsx,tsx}",
      // Optimize JSX runtime
      jsxRuntime: 'automatic',
      // Enable development optimizations
      devTarget: 'esnext',
    }),
    // mode === 'development' && componentTagger(), // Disabled - package not available
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
  // Enhanced development optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'lucide-react',
      'clsx',
      'tailwind-merge'
    ],
    exclude: ['@vite/client', '@vite/env'],
    // Force pre-bundling of commonly used dependencies
    force: mode === 'development'
  },
  // Enhanced caching for faster rebuilds
  cacheDir: 'node_modules/.vite',
  build: {
    rollupOptions: {
      // Hard exclude permanent archive from build (Defence-in-Depth)
      // Note: on-hold components are NOT excluded - they may be restored
      external: [
        /^src\/archive\//,
        /^src\/archive\/.*\/manual-archive\//,
        /^src\/archive\/.*\/src\//,
        /^src\/archive\/.*\/on-hold\//,
        /^src\/archive\/backup-files\//,
        /^src\/archive\/legacy-auth\//,
        /^src\/archive\/figma-demos\//,
        /^src\/archive\/old-flows\//,
        /^src\/archive\/old-profile-flow\//
      ],
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
          aws: ['aws-amplify', '@aws-sdk/client-rds-data', '@aws-sdk/client-cognito-identity-provider'],

          // Icons & Styling
          icons: ['lucide-react'],
          charts: ['recharts'],

          // i18n
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],

          // Performance & Optimization
          optimization: ['web-vitals'],
          monitoring: ['@/lib/monitoring', '@/lib/performance-monitoring'],

          // Utils
          utils: ['clsx', 'tailwind-merge', 'date-fns'],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
}));
