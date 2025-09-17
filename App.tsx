import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useTheme, ThemeProvider } from './hooks/useTheme';
import { AuthProvider, useAuth } from './hooks/useSupabaseAuth';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { LoadingScreen } from './components/ui/LoadingScreen';
import ResponsiveLayout from './components/layout/ResponsiveLayout';
import { WorkerLayout } from './components/layout/WorkerLayout';


import OwnerHomePage from './pages/owner/OwnerHomePage';
import AnalysisPage from './pages/owner/AnalysisPage';
import AdvancedAnalyticsPage from './pages/owner/AdvancedAnalyticsPage';
import AIAssistantPage from './pages/owner/AIAssistantPage';
import StockManagementPage from './pages/owner/StockManagementPage';
import ProductsPage from './pages/owner/ProductsPage';
import ExpensesPage from './pages/owner/ExpensesPage';
import TransactionsPage from './pages/owner/TransactionsPage';
import NotesPage from './pages/owner/NotesPage';
import SettingsPage from './pages/owner/SettingsPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';

import WorkerDashboard from './pages/worker/WorkerDashboard';
import SalesPage from './pages/worker/SalesPage';
import WorkerExpensePage from './pages/worker/WorkerExpensePage';
import WorkerNotesPage from './pages/worker/WorkerNotesPage';
import WorkerTransactionsPage from './pages/worker/WorkerTransactionsPage';

// This component ensures a user is authenticated before rendering the child routes.
const AuthLayout: React.FC = () => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (!loading && !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />; // Renders nested routes (e.g., owner or worker routes with their layouts)
};


const RoleRedirect: React.FC = () => {
    const { user, loading } = useAuth();
    
    if (!loading) {
        if (user?.role === 'owner') {
            return <Navigate to="/owner/dashboard" replace />;
        }
        if (user?.role === 'worker') {
            return <Navigate to="/worker/dashboard" replace />;
        }
        return <Navigate to="/login" replace />;
    }
    
    return null;
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
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        
        {/* Protected routes are nested under AuthLayout */}
        <Route element={<AuthLayout />}>
            {/* Owner Routes are nested under their own layout */}
            <Route path="/owner" element={<ResponsiveLayout><Outlet /></ResponsiveLayout>}>
                <Route path="dashboard" element={<OwnerHomePage />} />
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
                <Route path="expenses" element={<WorkerExpensePage />} />
                <Route path="transactions" element={<WorkerTransactionsPage />} />
                <Route path="notes" element={<WorkerNotesPage />} />
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
