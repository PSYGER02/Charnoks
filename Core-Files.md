# Core Files Collection

This document contains all the core application files including App.tsx, configuration files, types, and setup files.

## App.tsx

```tsx
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useTheme, ThemeProvider } from './hooks/useTheme';
import { AuthProvider, useAuth } from './hooks/useSupabaseAuth';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { ConnectionStatus } from './components/ui/ConnectionStatus';
import { EnvDebug } from './components/ui/EnvDebug';
import { AuthStatus } from './components/ui/AuthStatus';

import ResponsiveLayout from './components/layout/ResponsiveLayout';
import { WorkerLayout } from './components/layout/WorkerLayout';
import WorkerDashboard from './pages/Workerdashboard';

import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerHomePage from './pages/owner/OwnerHomePage';
import AnalysisPage from './pages/AnalysisPage';
import AdvancedAnalyticsPage from './pages/AdvancedAnalyticsPage';
import AIAssistantPage from './pages/AIAssistantPage';
import StockManagementPage from './pages/StockManagementPage';
import ProductsPage from './pages/ProductsPage';
import ExpensesPage from './pages/ExpensesPage';
import TransactionsPage from './pages/TransactionsPage';
import NotesPage from './pages/NotesPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';

import SalesPage from './pages/SalesPage';
import SupabaseStatus from './components/ui/SupabaseStatus';

// This component ensures a user is authenticated before rendering the child routes.
const AuthLayout: React.FC = () => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <LoadingScreen 
                message="Authenticating..." 
                submessage="Verifying your credentials"
                type="auth"
            />
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />; // Renders nested routes (e.g., owner or worker routes with their layouts)
};


const RoleRedirect: React.FC = () => {
    const { user, loading } = useAuth();
    if (loading) {
        return (
            <LoadingScreen 
                message="Loading Dashboard..." 
                submessage="Preparing your workspace"
                type="data"
            />
        );
    }

    if (user?.role === 'owner') {
        return <Navigate to="/owner/dashboard" replace />;
    }
    if (user?.role === 'worker') {
        return <Navigate to="/worker/dashboard" replace />;
    }
    // Fallback to login if role is not defined or user is null
    return <Navigate to="/login" replace />;
}


const AppContent: React.FC = () => {
  const { theme } = useTheme();

  useEffect(() => {
    const body = document.body;
    
    // Remove any existing theme classes
    body.className = body.className.replace(/theme-\S+/g, '');
    
    // Remove any Tailwind background classes that might interfere
    body.className = body.className.replace(/bg-\S+/g, '');
    
    // Apply the theme and animation classes
    body.classList.add(theme, 'animate-gradient-x');
    
    // Ensure we have the base classes
    if (!body.classList.contains('text-white')) {
      body.classList.add('text-white', 'antialiased');
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      // Allow time for CSS variables to be applied before reading them
      setTimeout(() => {
        const themeColor = getComputedStyle(body).getPropertyValue('--background-start-rgb');
        metaThemeColor.setAttribute('content', `rgb(${themeColor})`);
      }, 0);
    }
  }, [theme]);

  return (
    <>
      <ConnectionStatus />
      <EnvDebug />
      <AuthStatus />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        
        {/* Protected routes are nested under AuthLayout */}
        <Route element={<AuthLayout />}>
            {/* Owner Routes are nested under their own layout */}
            <Route path="/owner" element={<ResponsiveLayout><Outlet /></ResponsiveLayout>}>
                <Route path="dashboard" element={<OwnerDashboard />} />
                <Route path="home" element={<OwnerHomePage />} />
                <Route path="analysis" element={<AnalysisPage />} />
                <Route path="advanced-analytics" element={<AdvancedAnalyticsPage />} />
                <Route path="ai-assistant" element={<AIAssistantPage />} />
                <Route path="sales" element={<StockManagementPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="expenses" element={<ExpensesPage />} />
                <Route path="transactions" element={<TransactionsPage />} />
                <Route path="notes" element={<NotesPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route index element={<Navigate to="/owner/dashboard" replace />} />
            </Route>

            {/* Worker Routes are nested under their own layout */}
            <Route path="/worker" element={<WorkerLayout><Outlet /></WorkerLayout>}>
                <Route path="dashboard" element={<WorkerDashboard />} />
                <Route path="sales" element={<SalesPage />} />
                <Route path="expenses" element={<ExpensesPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route index element={<Navigate to="/worker/dashboard" replace />} />
            </Route>
        </Route>

        <Route path="/" element={<RoleRedirect />} />
      </Routes>
    </>
  );
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <SupabaseStatus />
      <HashRouter>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </HashRouter>
    </ErrorBoundary>
  );
};

export default App;
```

## constants.ts

```ts

import type { Theme } from './types';

export const OWNER_NAVIGATION_ITEMS = [
  { path: '/owner/dashboard', icon: '👑', label: 'Dashboard' },
  { path: '/owner/analysis', icon: '📊', label: 'Analysis' },
  { path: '/owner/ai-assistant', icon: '🧠', label: 'AI Assistant' },
  { path: '/owner/sales', icon: '🚚', label: 'Stock Management' },
  { path: '/owner/products', icon: '📦', label: 'Products' },
  { path: '/owner/expenses', icon: '🧾', label: 'Expenses' },
  { path: '/owner/transactions', icon: '📋', label: 'Transactions' },
  { path: '/owner/notes', icon: '📝', label: 'Internal Log' },
  { path: '/owner/settings', icon: '⚙️', label: 'Settings' },
];

export const WORKER_NAVIGATION_ITEMS = [
    { path: '/worker/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/worker/sales', icon: '🛒', label: 'Record Sale' },
    { path: '/worker/expenses', icon: '🧾', label: 'Record Expense' },
    { path: '/worker/settings', icon: '⚙️', label: 'Settings' },
];

export const THEMES: Theme[] = [
    { name: 'Charnoks Classic', id: 'theme-charnoks', category: 'Core' },
    { name: 'Sunset Purple', id: 'theme-sunset', category: 'Core' },
    { name: 'Ocean Blue', id: 'theme-ocean', category: 'Core' },
    { name: 'Forest Green', id: 'theme-forest', category: 'Core' },
    { name: 'Light Mode', id: 'theme-light', category: 'Core' },
    { name: 'Minimal Gray', id: 'theme-gray', category: 'Core' },
    { name: 'Ruby Red', id: 'theme-ruby', category: 'Artistic' },
    { name: 'Cosmic Lilac', id: 'theme-cosmic', category: 'Artistic' },
    { name: 'Golden Hour', id: 'theme-golden', category: 'Artistic' },
    { name: 'Emerald Isle', id: 'theme-emerald', category: 'Artistic' },
];
```

## types.ts

```ts


export interface Sale {
  id: string;
  date: string; // ISO string
  items: { productId: string; name: string; quantity: number; price: number }[];
  total: number;
  payment: number;
  change: number;
  workerId: string;
  workerName: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
}

export interface Worker {
  id:string;
  name: string;
}

export interface Expense {
    id: string;
    date: string;
    description: string;
    amount: number;
    workerId: string;
    workerName: string;
}

export interface Theme {
  name: string;
  id: string;
  category: string;
}

export interface ForecastDataPoint {
    day: string;
    predictedSales: number;
}

export interface AIInsights {
    insights: string[];
    risks: string[];
    opportunities: string[];
}

export interface Note {
  id: string;
  date: string; // ISO string
  category: 'Delivery Note' | 'Reminder' | 'Supply Cost' | 'Internal Expense' | 'Other';
  title: string;
  description: string;
  amount?: number;
}

export interface ParsedSaleItem {
    product: Product;
    quantity: number;
}

export interface ParsedSale {
    items: ParsedSaleItem[];
    payment: number;
    total: number;
}

export interface ParsedSaleFromAI {
    items: {
        productName: string;
        quantity: number;
    }[];
    payment: number;
}
```

## index.html

```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/png" href="/Charnoks logo-192x192.png" />
  <link rel="manifest" href="/manifest.json" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#db4e2a" />
  <title>CHARNOKS - Point of Sale System</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap"
    rel="stylesheet">
  <style>
    :root {
      --font-sans: 'Poppins', sans-serif;
      --font-brand: 'Orbitron', monospace;
      --font-display: 'Rajdhani', sans-serif;
    }

    /* CHARNOKS Brand Styling */
    .brand-title {
      font-family: var(--font-brand);
      font-weight: 900;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      background: linear-gradient(135deg, #ff6b35, #f7931e, #ffcc02);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 0 30px rgba(255, 107, 53, 0.5);
      position: relative;
    }

    .brand-title::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, #ff6b35, #f7931e, #ffcc02);
      border-radius: 1px;
    }

    .brand-subtitle {
      font-family: var(--font-display);
      font-weight: 500;
      letter-spacing: 0.05em;
      color: rgba(255, 255, 255, 0.9);
    }

    body {
      font-family: var(--font-sans);
      padding-top: env(safe-area-inset-top);
      padding-bottom: env(safe-area-inset-bottom);
      padding-left: env(safe-area-inset-left);
      padding-right: env(safe-area-inset-right);
    }

    /* THEME CSS VARIABLES */
    .theme-charnoks {
      --background-start-rgb: 219, 78, 42;
      --background-end-rgb: 252, 185, 59;
      --primary: 220 38 38;
      --secondary: 245 158 11;
      --accent: 253 224 71;
      --text-primary: 255 255 255;
      --text-secondary: 229 231 235;
      --card-bg: 120 53 15 / 0.5;
      --card-bg-solid: 120 53 15;
      --border: 245 158 11 / 0.5;
      --text-on-primary: 255 255 255;
    }

    .theme-ocean {
      --background-start-rgb: 20, 30, 48;
      --background-end-rgb: 36, 59, 85;
      --primary: 59 130 246;
      --secondary: 14 165 233;
      --accent: 34 211 238;
      --text-primary: 255 255 255;
      --text-secondary: 209 213 219;
      --card-bg: 36 59 85 / 0.4;
      --card-bg-solid: 36 59 85;
      --border: 59 130 246 / 0.4;
      --text-on-primary: 255 255 255;
    }

    .theme-forest {
      --background-start-rgb: 16, 26, 22;
      --background-end-rgb: 42, 68, 55;
      --primary: 34 197 94;
      --secondary: 22 163 74;
      --accent: 134 239 172;
      --text-primary: 255 255 255;
      --text-secondary: 229 231 235;
      --card-bg: 22 101 52 / 0.4;
      --card-bg-solid: 22 101 52;
      --border: 34 197 94 / 0.4;
      --text-on-primary: 255 255 255;
    }

    .theme-sunset {
      --background-start-rgb: 76, 29, 149;
      --background-end-rgb: 147, 51, 234;
      --primary: 168 85 247;
      --secondary: 192 132 252;
      --accent: 233 213 255;
      --text-primary: 255 255 255;
      --text-secondary: 229 231 235;
      --card-bg: 107 33 168 / 0.4;
      --card-bg-solid: 107 33 168;
      --border: 168 85 247 / 0.4;
      --text-on-primary: 255 255 255;
    }

    .theme-light {
      --background-start-rgb: 243, 244, 246;
      --background-end-rgb: 229, 231, 235;
      --primary: 37 99 235;
      --secondary: 29 78 216;
      --accent: 96 165 250;
      --text-primary: 29 78 216;
      --text-secondary: 55 65 81;
      --card-bg: 255 255 255 / 0.8;
      --card-bg-solid: 255 255 255;
      --border: 209 213 219;
      --text-on-primary: 255 255 255;
    }

    .theme-gray {
      --background-start-rgb: 17, 24, 39;
      --background-end-rgb: 55, 65, 81;
      --primary: 107 114 128;
      --secondary: 156 163 175;
      --accent: 209 213 219;
      --text-primary: 243 244 246;
      --text-secondary: 209 213 219;
      --card-bg: 75 85 99 / 0.4;
      --card-bg-solid: 75 85 99;
      --border: 107 114 128 / 0.4;
      --text-on-primary: 17 24 39;
    }

    /* NEW THEMES */
    .theme-ruby {
      --background-start-rgb: 159, 28, 52;
      --background-end-rgb: 220, 38, 38;
      --primary: 244 63 94;
      --secondary: 251 113 133;
      --accent: 253 164 175;
      --text-primary: 255 255 255;
      --text-secondary: 249 250 251;
      --card-bg: 159 28 52 / 0.4;
      --card-bg-solid: 159 28 52;
      --border: 244 63 94 / 0.4;
      --text-on-primary: 255 255 255;
    }

    .theme-cosmic {
      --background-start-rgb: 28, 25, 47;
      --background-end-rgb: 67, 56, 111;
      --primary: 167 139 250;
      --secondary: 196 181 253;
      --accent: 129 140 248;
      --text-primary: 255 255 255;
      --text-secondary: 224 231 240;
      --card-bg: 67 56 111 / 0.4;
      --card-bg-solid: 67 56 111;
      --border: 167 139 250 / 0.4;
      --text-on-primary: 255 255 255;
    }

    .theme-golden {
      --background-start-rgb: 234, 88, 12;
      --background-end-rgb: 251, 146, 60;
      --primary: 251 191 36;
      --secondary: 252 211 77;
      --accent: 253 230 138;
      --text-primary: 255 255 255;
      --text-secondary: 254 249 195;
      --card-bg: 120 53 15 / 0.5;
      --card-bg-solid: 120 53 15;
      --border: 251 191 36 / 0.4;
      --text-on-primary: 120 53 15;
    }

    .theme-emerald {
      --background-start-rgb: 5, 46, 22;
      --background-end-rgb: 6, 78, 59;
      --primary: 16 185 129;
      --secondary: 52 211 153;
      --accent: 110 231 183;
      --text-primary: 255 255 255;
      --text-secondary: 229 231 235;
      --card-bg: 6 95 70 / 0.4;
      --card-bg-solid: 6 95 70;
      --border: 16 185 129 / 0.4;
      --text-on-primary: 255 255 255;
    }

    /* ANIMATIONS */
    @keyframes gradient-x {
      0% {
        background-position: 0% 50%;
      }

      50% {
        background-position: 100% 50%;
      }

      100% {
        background-position: 0% 50%;
      }
    }

    .animate-gradient-x {
      background: linear-gradient(-45deg, rgba(var(--background-start-rgb), 1), rgba(var(--background-end-rgb), 1), rgba(var(--background-start-rgb), 1), rgba(var(--background-end-rgb), 1));
      background-size: 400% 400%;
      animation: gradient-x 15s ease infinite;
    }

    @keyframes bounce-in {
      0% {
        opacity: 0;
        transform: scale(0.3);
      }

      50% {
        opacity: 1;
        transform: scale(1.05);
      }

      70% {
        transform: scale(0.9);
      }

      100% {
        transform: scale(1);
      }
    }

    .animate-bounce-in {
      animation: bounce-in 0.6s ease-out;
    }

    @keyframes slide-in-bottom {
      from {
        transform: translateY(100%);
        opacity: 0;
      }

      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .animate-slide-in-bottom {
      animation: slide-in-bottom 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
    }

    /* Login page animations */
    @keyframes float {
      0% {
        transform: translate(0, 0px);
      }

      50% {
        transform: translate(10px, 15px);
      }

      100% {
        transform: translate(0, -0px);
      }
    }

    @keyframes pulse {

      0%,
      100% {
        box-shadow: 0 0 20px 5px rgba(var(--primary), 0.2);
      }

      50% {
        box-shadow: 0 0 35px 12px rgba(var(--primary), 0.4);
      }
    }

    .orb {
      animation: float 12s ease-in-out infinite, pulse 5s ease-in-out infinite;
    }

    /* New Shimmer Animation */
    @keyframes shimmer {
      0% {
        background-position: -100% 0;
      }

      100% {
        background-position: 100% 0;
      }
    }

    .hover-shimmer::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(110deg, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0) 60%);
      background-size: 200% 100%;
      transition: opacity 0.3s ease;
      opacity: 0;
      pointer-events: none;
    }

    .hover-shimmer:hover::after {
      opacity: 1;
      animation: shimmer 1.5s infinite;
    }
  </style>

  <link rel="stylesheet" href="/index.css">
</head>

<body class="text-white antialiased theme-golden animate-gradient-x">
  
  <div id="root"></div>
  <script type="module" src="/index.tsx"></script>
</body>

</html>
```

## index.tsx

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './hooks/useTheme';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
```
## package.json

```json
{
  "name": "charnoks-codes-v3",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "npm run build && vercel --prod",
    "setup": "node scripts/setup-env.js",
    "setup:env": "node scripts/setup-env.js",
    "check:env": "node -e \"console.log('Environment Check:'); console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ SET' : '❌ MISSING'); console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ SET' : '❌ MISSING');\"",
    "test": "echo 'Tests will be added in future updates'",
    "lint": "echo 'Linting will be added in future updates'"
  },
  "dependencies": {
    "@google/genai": "^1.9.0",
    "@google/generative-ai": "^0.1.1",
    "@supabase/supabase-js": "^2.54.0",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-router-dom": "^6.14.1",
    "recharts": "^2.7.2"
  },
  "engines": {
    "node": "22.x"
  },
  "devDependencies": {
    "@types/node": "^20.4.2",
    "@types/react": "^18.2.14",
    "@types/react-dom": "^18.2.6",
    "@typescript-eslint/eslint-plugin": "^5.61.0",
    "@typescript-eslint/parser": "^5.61.0",
    "@vercel/node": "^5.3.8",
    "@vitejs/plugin-react": "^4.6.0",
    "autoprefixer": "^10.4.21",
    "eslint": "^8.44.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.1",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.0.2",
    "vite": "^4.4.0"
  }
}
```

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "types": ["vite/client"],

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "allowJs": true,
    "jsx": "react-jsx",
    "jsxImportSource": "react",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,

    "paths": {
      "@/*": ["./*"]
    },
    "typeRoots": ["./node_modules/@types", "./src/types"]
  }
}
```

## vite.config.ts

```ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
    // Load env file based on `mode` in the current working directory.
    const env = loadEnv(mode, process.cwd(), '');
    
    return {
        plugins: [react()],
        build: {
            target: 'esnext',
            sourcemap: true,
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: ['react', 'react-dom'],
                        supabase: ['@supabase/supabase-js'],
                        charts: ['recharts']
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
            host: true,
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
            host: true
        }
    };
});
```

## tailwind.config.js

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a73e8',
        'text-primary': '#ffffff',
        'text-on-primary': '#ffffff',
        'background-primary': '#121212',
        'background-secondary': '#1e1e1e'
      }
    }
  },
  plugins: []
}
```

## postcss.config.js

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}
```

## vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "X-Requested-With, Content-Type, Authorization"
        }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/json"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ],
  "rewrites": [
    { "source": "/manifest.json", "destination": "/public/manifest.json" },
    { "source": "/Charnoks logo-192x192.png", "destination": "/public/Charnoks logo-192x192.png" },
    { "source": "/Charnoks logo-512x512.png", "destination": "/public/Charnoks logo-512x512.png" },
    { "source": "/((?!api/|public/).*)", "destination": "/index.html" }
  ]
}
```

## public/manifest.json

```json
{
  "name": "CHARNOKS - Point of Sale System",
  "short_name": "CHARNOKS POS",
  "description": "Special Fried Chicken & More - Restaurant Management System",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#db4e2a",
  "theme_color": "#db4e2a",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/Charnoks logo-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/Charnoks logo-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["business", "productivity", "food"],
  "lang": "en"
}
```

## src/supabaseConfig.ts

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging in development
if (import.meta.env.DEV) {
  console.log('🔧 Supabase Config Debug:');
  console.log('URL:', supabaseUrl ? '✅ SET' : '❌ MISSING');
  console.log('Key:', supabaseAnonKey ? '✅ SET' : '❌ MISSING');
  console.log('Mode:', import.meta.env.MODE);
}

// Create Supabase client or dummy client if not configured
let supabaseClient: any;

// More robust environment variable validation
const isValidUrl = typeof supabaseUrl === 'string' && supabaseUrl.length > 0 && supabaseUrl !== 'undefined';
const isValidKey = typeof supabaseAnonKey === 'string' && supabaseAnonKey.length > 0 && supabaseAnonKey !== 'undefined';

if (!isValidUrl || !isValidKey) {
  console.warn('⚠️ Supabase not configured - using demo mode');
  console.warn('Expected valid values for: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  
  // Create a dummy client to prevent crashes
  supabaseClient = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: () => Promise.reject(new Error('Supabase not configured')),
      signInWithPassword: () => Promise.reject(new Error('Supabase not configured')),
      signOut: () => Promise.reject(new Error('Supabase not configured'))
    },
    from: () => ({
      select: () => Promise.reject(new Error('Supabase not configured')),
      insert: () => Promise.reject(new Error('Supabase not configured')),
      update: () => Promise.reject(new Error('Supabase not configured')),
      delete: () => Promise.reject(new Error('Supabase not configured'))
    }),
    storage: {
      from: () => ({
        upload: () => Promise.reject(new Error('Supabase not configured')),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    },
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {}
    })
  };
} else {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
}

export const supabase = supabaseClient;

// Database types
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          role: 'owner' | 'worker';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          role?: 'owner' | 'worker';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          role?: 'owner' | 'worker';
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          price: number;
          stock: number;
          category: string | null;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          price: number;
          stock?: number;
          category?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          price?: number;
          stock?: number;
          category?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      sales: {
        Row: {
          id: string;
          items: any; // JSONB
          total: number;
          payment: number;
          change: number;
          worker_id: string | null;
          worker_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          items: any;
          total: number;
          payment: number;
          change: number;
          worker_id?: string | null;
          worker_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          items?: any;
          total?: number;
          payment?: number;
          change?: number;
          worker_id?: string | null;
          worker_name?: string | null;
          created_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          description: string;
          amount: number;
          worker_id: string | null;
          worker_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          description: string;
          amount: number;
          worker_id?: string | null;
          worker_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          description?: string;
          amount?: number;
          worker_id?: string | null;
          worker_name?: string | null;
          created_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: string | null;
          amount: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category?: string | null;
          amount?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category?: string | null;
          amount?: number | null;
          created_at?: string;
        };
      };
    };
  };
}
```

## src/vite-env.d.ts

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_GEMINI_API_KEY: string
  readonly GEMINI_API_KEY: string
  readonly VITE_DEMO_MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

## scripts/setup-env.js

```js
#!/usr/bin/env node

/**
 * Environment Setup Script
 * Helps users configure their environment variables
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function log(message, color = 'reset') {
  console.log(colorize(message, color));
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(colorize(prompt, 'cyan'), resolve);
  });
}

async function main() {
  log('\n🚀 Charnoks Manager Environment Setup', 'bright');
  log('=====================================\n', 'bright');
  
  log('This script will help you configure your environment variables.\n', 'yellow');
  
  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  let existingEnv = {};
  if (fs.existsSync(envPath)) {
    log('📄 Found existing .env file', 'green');
    const envContent = fs.readFileSync(envPath, 'utf8');
    existingEnv = parseEnvFile(envContent);
  } else {
    log('📄 No .env file found, creating new one', 'yellow');
  }
  
  // Read .env.example for reference
  let exampleEnv = {};
  if (fs.existsSync(envExamplePath)) {
    const exampleContent = fs.readFileSync(envExamplePath, 'utf8');
    exampleEnv = parseEnvFile(exampleContent);
  }
  
  log('\n🔧 Required Environment Variables:', 'bright');
  log('==================================\n', 'bright');
  
  const requiredVars = [
    {
      key: 'VITE_SUPABASE_URL',
      description: 'Your Supabase project URL',
      example: 'https://your-project-id.supabase.co',
      required: true
    },
    {
      key: 'VITE_SUPABASE_ANON_KEY',
      description: 'Your Supabase anonymous key',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      required: true
    },
    {
      key: 'GEMINI_API_KEY',
      description: 'Google Gemini API key (for AI features)',
      example: 'AIzaSyC...',
      required: false
    },
    {
      key: 'SUPABASE_SERVICE_ROLE_KEY',
      description: 'Supabase service role key (for admin operations)',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      required: false
    }
  ];
  
  const newEnv = { ...existingEnv };
  
  for (const variable of requiredVars) {
    const current = existingEnv[variable.key];
    const example = exampleEnv[variable.key] || variable.example;
    
    log(`\n${variable.required ? '🔴' : '🟡'} ${variable.key}`, variable.required ? 'red' : 'yellow');
    log(`   ${variable.description}`, 'reset');
    
    if (current && current !== '<REDACTED>' && current !== 'your_value_here') {
      log(`   Current: ${maskValue(current)}`, 'green');
      const keep = await question('   Keep current value? (y/n): ');
      if (keep.toLowerCase() === 'y' || keep.toLowerCase() === 'yes' || keep === '') {
        continue;
      }
    }
    
    if (example && example !== '<REDACTED>') {
      log(`   Example: ${example}`, 'blue');
    }
    
    const value = await question(`   Enter value${variable.required ? ' (required)' : ' (optional)'}: `);
    
    if (value.trim()) {
      newEnv[variable.key] = value.trim();
    } else if (variable.required) {
      log('   ❌ This variable is required!', 'red');
      const retry = await question('   Try again? (y/n): ');
      if (retry.toLowerCase() === 'y' || retry.toLowerCase() === 'yes') {
        // Repeat this iteration
        const retryValue = await question(`   Enter ${variable.key}: `);
        if (retryValue.trim()) {
          newEnv[variable.key] = retryValue.trim();
        }
      }
    }
  }
  
  // Generate .env file content
  const envContent = Object.entries(newEnv)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  log('\n📝 Generated .env file:', 'bright');
  log('=====================\n', 'bright');
  
  // Show preview with masked values
  Object.entries(newEnv).forEach(([key, value]) => {
    log(`${key}=${maskValue(value)}`, 'green');
  });
  
  const save = await question('\n💾 Save this configuration? (y/n): ');
  
  if (save.toLowerCase() === 'y' || save.toLowerCase() === 'yes') {
    fs.writeFileSync(envPath, envContent);
    log('\n✅ Environment configuration saved to .env', 'green');
    
    log('\n🎯 Next Steps:', 'bright');
    log('=============', 'bright');
    log('1. Start the development server: npm run dev', 'cyan');
    log('2. Open your browser to http://localhost:5173', 'cyan');
    log('3. For production deployment, add these variables to Vercel:', 'cyan');
    log('   - Go to your Vercel dashboard', 'cyan');
    log('   - Navigate to Project Settings → Environment Variables', 'cyan');
    log('   - Add each variable for all environments', 'cyan');
    
  } else {
    log('\n❌ Configuration not saved', 'yellow');
  }
  
  log('\n🚀 Setup complete! Happy coding!', 'green');
  rl.close();
}

function parseEnvFile(content) {
  const env = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  }
  
  return env;
}

function maskValue(value) {
  if (!value || value.length < 8) return value;
  return value.substring(0, 4) + '••••••••' + value.substring(value.length - 4);
}

// Handle errors gracefully
process.on('SIGINT', () => {
  log('\n\n👋 Setup cancelled by user', 'yellow');
  rl.close();
  process.exit(0);
});

// Run the setup
main().catch((error) => {
  log('\n❌ Setup failed:', 'red');
  log(error.message, 'red');
  rl.close();
  process.exit(1);
});
```

## test-env.js

```js
// Simple test to check environment variables
console.log('🔧 Environment Variables Test:');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ SET' : '❌ MISSING');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ SET' : '❌ MISSING');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ SET' : '❌ MISSING');

// Check if values are not 'undefined' strings
if (process.env.VITE_SUPABASE_URL === 'undefined') {
  console.log('⚠️ VITE_SUPABASE_URL is set to string "undefined"');
}
if (process.env.VITE_SUPABASE_ANON_KEY === 'undefined') {
  console.log('⚠️ VITE_SUPABASE_ANON_KEY is set to string "undefined"');
}

console.log('✅ Environment test complete');
```

---

## Summary

This document contains all the core files for the Charnoks POS system:

### **Main Application Files:**
- **App.tsx** - Main React application with routing and authentication
- **index.tsx** - Application entry point
- **index.html** - HTML template with themes and animations

### **Configuration Files:**
- **package.json** - Dependencies and scripts
- **tsconfig.json** - TypeScript configuration
- **vite.config.ts** - Vite build configuration
- **tailwind.config.js** - Tailwind CSS configuration
- **postcss.config.js** - PostCSS configuration
- **vercel.json** - Vercel deployment configuration

### **Type Definitions:**
- **types.ts** - TypeScript interfaces for the application
- **constants.ts** - Application constants and navigation items
- **src/vite-env.d.ts** - Vite environment type definitions

### **Database & Services:**
- **src/supabaseConfig.ts** - Supabase client configuration with fallback

### **Setup & Utilities:**
- **scripts/setup-env.js** - Interactive environment setup script
- **test-env.js** - Environment variables test script
- **public/manifest.json** - PWA manifest for mobile app features

### **Key Features:**
- **Multi-theme system** with 10 different color schemes
- **Responsive design** with mobile-first approach
- **Role-based routing** (Owner/Worker)
- **PWA capabilities** for mobile installation
- **Environment validation** with fallback modes
- **TypeScript** for type safety
- **Modern build system** with Vite