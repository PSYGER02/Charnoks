import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
    // Load env file based on `mode` in the current working directory.
    const _env = loadEnv(mode, process.cwd(), '');
    
    return {
        plugins: [
            react({
                // Enable React Refresh for better development experience
                fastRefresh: true,
                // JSX runtime optimization
                jsxRuntime: 'automatic'
            })
        ],
        build: {
            outDir: 'build-output',
            emptyOutDir: true,
            target: 'esnext',
            sourcemap: mode === 'development',
            minify: 'esbuild', // Use esbuild instead of terser for better performance
            chunkSizeWarningLimit: 1000,
            // Enable CSS code splitting
            cssCodeSplit: true,
            rollupOptions: {
                output: {
                    // Advanced chunking strategy for optimal loading
                    manualChunks: (id) => {
                        // Vendor chunks
                        if (id.includes('node_modules')) {
                            if (id.includes('react') || id.includes('react-dom')) {
                                return 'react-vendor';
                            }
                            if (id.includes('@supabase')) {
                                return 'supabase-vendor';
                            }
                            if (id.includes('recharts') || id.includes('d3')) {
                                return 'charts-vendor';
                            }
                            if (id.includes('react-router')) {
                                return 'router-vendor';
                            }
                            // Other vendors
                            return 'vendor';
                        }
                        
                        // Design system chunk
                        if (id.includes('/components/ui/') || id.includes('/design-system/')) {
                            return 'design-system';
                        }
                        
                        // Services chunk
                        if (id.includes('/services/')) {
                            return 'services';
                        }
                        
                        // Utils chunk
                        if (id.includes('/utils/')) {
                            return 'utils';
                        }
                        
                        // Pages chunks (lazy loaded)
                        if (id.includes('/pages/owner/')) {
                            return 'owner-pages';
                        }
                        if (id.includes('/pages/worker/')) {
                            return 'worker-pages';
                        }
                    },
                    // Optimize chunk names for caching
                    chunkFileNames: () => {
                        return `assets/js/[name]-[hash].js`;
                    },
                    assetFileNames: (assetInfo) => {
                        if (!assetInfo.name) return `assets/[name]-[hash].[ext]`;
                        
                        if (/\.(css)$/.test(assetInfo.name)) {
                            return `assets/css/[name]-[hash].css`;
                        }
                        if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
                            return `assets/images/[name]-[hash].[ext]`;
                        }
                        if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
                            return `assets/fonts/[name]-[hash].[ext]`;
                        }
                        return `assets/[name]-[hash].[ext]`;
                    }
                }
            },
            // Enable asset inlining for small files
            assetsInlineLimit: 4096
        },
        define: {
            global: 'globalThis',
            // Expose environment info for debugging
            __DEV__: mode === 'development',
            __PROD__: mode === 'production',
        },
        optimizeDeps: {
            include: [
                'react', 
                'react-dom', 
                '@supabase/supabase-js',
                'react-router-dom',
                'recharts'
            ],
            // Force pre-bundling of these packages
            force: true
        },
        // Environment variable configuration
        envPrefix: ['VITE_'],
        // CSS optimization
        css: {
            devSourcemap: mode === 'development',
            preprocessorOptions: {
                // Add any CSS preprocessor options here
            }
        },
        // Server configuration for development
        server: {
            port: 5173,
            host: '0.0.0.0',
            open: false,
            strictPort: false,
            // Fix WebSocket issues in GitHub Codespaces
            hmr: {
                port: 24678,
                clientPort: 24678,
                host: 'localhost'
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
        },
        // Performance optimizations
        esbuild: {
            // Drop console and debugger in production
            drop: mode === 'production' ? ['console', 'debugger'] : [],
            // Enable top-level await
            target: 'esnext'
        }
    };
});
