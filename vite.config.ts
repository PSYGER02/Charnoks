import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        cors: true
    },
    build: {
        target: 'es2020',
        sourcemap: true,
        rollupOptions: {
            external: [
                'react',
                'react-dom',
                'react-dom/client',
                'react-router-dom',
                '@google/genai',
                '@google/generative-ai',
                'recharts',
                'firebase/app',
                'firebase/firestore',
                'firebase/auth',
                'firebase/functions'
            ],
            output: {
                globals: {
                    'react': 'React',
                    'react-dom': 'ReactDOM',
                    'react-dom/client': 'ReactDOMClient',
                    'react-router-dom': 'ReactRouterDOM',
                    '@google/genai': 'GoogleGenAI',
                    'recharts': 'Recharts'
                }
            }
        }
    },
    define: {
        'process.env': {}
    },
    resolve: {
        alias: {
            '@': '.'
        }
    }
});
