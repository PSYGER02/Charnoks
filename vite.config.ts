import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
    // Load env file based on `mode` in the current working directory.
    const _env = loadEnv(mode, process.cwd(), '');
    
    return {
        plugins: [react()],
        build: {
            outDir: 'build-output',
            emptyOutDir: true,
            target: 'esnext',
            sourcemap: true,
            chunkSizeWarningLimit: 1000,
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: ['react', 'react-dom'],
                        supabase: ['@supabase/supabase-js'],
                        charts: ['recharts'],
                        router: ['react-router-dom'],
                        services: [
                            './services/supabaseService',
                            './services/unifiedDataService',
                            './services/smartSaveService'
                        ]
                    }
                }
            }
        },
        define: {
            global: 'globalThis',
            // Expose environment info for debugging
            __DEV__: mode === 'development',
            __PROD__: mode === 'production',
        },
        optimizeDeps: {
            include: ['react', 'react-dom', '@supabase/supabase-js']
        },
        // Environment variable configuration
        envPrefix: ['VITE_'],
        // Server configuration for development
        server: {
            port: 5173,
            host: '0.0.0.0',
            open: false,
            strictPort: false,
            // Try multiple ports if 5173 is occupied
            hmr: {
                port: 24678
            },
            // Proxy API calls in development
            proxy: command === 'serve' ? {
                '/api': {
                    target: 'http://localhost:3000',
                    changeOrigin: true,
                    secure: false,
                }
            } : undefined
        },
        // Preview configuration
        preview: {
            port: 4173,
            host: '0.0.0.0',
            open: false,
            strictPort: false
        }
    };
});
