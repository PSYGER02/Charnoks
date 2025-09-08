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

import Ownersdashboard from './components/ui/Ownersdashboard';
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
                <Route path="dashboard" element={<Ownersdashboard />} />
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
