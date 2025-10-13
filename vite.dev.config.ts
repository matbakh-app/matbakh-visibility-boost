import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

// Development-specific Vite configuration with enhanced optimizations
export default defineConfig({
    server: {
        host: "localhost",
        port: 5173,
        // Enhanced HMR for development
        hmr: {
            overlay: true,
            clientPort: 5173,
        },
        // Optimized file watching
        watch: {
            usePolling: false,
            interval: 50, // Faster polling for development
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
        // Pre-warm frequently used files
        warmup: {
            clientFiles: [
                './src/main.tsx',
                './src/App.tsx',
                './src/components/**/*.tsx',
                './src/hooks/**/*.ts',
                './src/lib/**/*.ts',
                './src/pages/**/*.tsx'
            ]
        },
        headers: {
            'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;"
        },
        proxy: {
            '/api/persona': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                secure: false,
                configure: (proxy, _options) => {
                    proxy.on('error', (err, _req, _res) => {
                        console.log('🔴 Persona API proxy error:', err);
                    });
                    proxy.on('proxyReq', (proxyReq, req, _res) => {
                        console.log('🔵 Persona API proxy request:', req.method, req.url);
                    });
                },
            },
        },
    },

    plugins: [
        react({
            // Enhanced Fast Refresh for development
            fastRefresh: true,
            include: "**/*.{jsx,tsx}",
            jsxRuntime: 'automatic',
            devTarget: 'esnext',
            // Enable development helpers
            plugins: [
                ['@babel/plugin-transform-react-jsx-development', {}]
            ]
        }),

        // Bundle analyzer for development
        visualizer({
            filename: 'dist/stats.html',
            gzipSize: true,
            brotliSize: true,
            open: false,
            template: 'treemap' // Better visualization
        }),
    ],

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
            'tailwind-merge',
            'date-fns',
            'zod',
            'react-hook-form'
        ],
        exclude: ['@vite/client', '@vite/env'],
        force: true, // Always pre-bundle in development
        esbuildOptions: {
            target: 'esnext'
        }
    },

    // Enhanced caching
    cacheDir: 'node_modules/.vite',

    // Development-specific build options
    build: {
        // Generate source maps for debugging
        sourcemap: true,

        // Faster builds in development
        minify: false,

        rollupOptions: {
            external: [
                /^src\/archive\//,
                /^src\/archive\/.*\/manual-archive\//,
                /^src\/archive\/.*\/src\//,
                /^src\/archive\/.*\/on-hold\//,
            ],
            output: {
                // Preserve module structure for debugging
                preserveModules: false,
                manualChunks: {
                    // Development-optimized chunks
                    'react-vendor': ['react', 'react-dom'],
                    'router': ['react-router-dom'],
                    'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
                    'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
                    'query': ['@tanstack/react-query'],
                    'utils': ['clsx', 'tailwind-merge', 'date-fns'],
                    'dev-tools': ['@/lib/dev-utils', '@/components/dev/DevTools']
                },
            },
        },

        // Lower chunk size warning for development
        chunkSizeWarningLimit: 2000,
    },

    // Enhanced CSS handling
    css: {
        devSourcemap: true,
        preprocessorOptions: {
            scss: {
                additionalData: `@import "@/styles/variables.scss";`
            }
        }
    },

    // Development-specific environment
    define: {
        __DEV__: true,
        __PROD__: false,
        __TEST__: false
    },

    // Enhanced error handling
    esbuild: {
        logOverride: {
            'this-is-undefined-in-esm': 'silent'
        }
    }
});