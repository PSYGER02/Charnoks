import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3001, // Changed to avoid conflicts
        host: 'localhost',
        cors: true,
        open: false // Prevent auto-opening browser
    },
    build: {
        target: 'esnext',
        sourcemap: true
    }
});
