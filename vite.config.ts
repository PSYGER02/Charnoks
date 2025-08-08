import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    build: {
        target: 'esnext',
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/functions'],
                    charts: ['recharts']
                }
            }
        }
    },
    define: {
        global: 'globalThis',
    },
    optimizeDeps: {
        include: ['react', 'react-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore']
    }
});
