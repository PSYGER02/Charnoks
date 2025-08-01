/**
 * Demo Mode Utilities
 * Provides fallback data and demo functionality when Firebase is not available
 */

export const isDemoMode = () => {
  return import.meta.env.VITE_DEMO_MODE === 'true' || 
         import.meta.env.VITE_FIREBASE_API_KEY?.includes('demo') ||
         import.meta.env.VITE_FIREBASE_PROJECT_ID?.includes('demo');
};

export const getDemoData = () => ({
  dashboard: {
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    transactions: 0,
    salesTrend: [
      { name: 'Mon', sales: 0 },
      { name: 'Tue', sales: 0 },
      { name: 'Wed', sales: 0 },
      { name: 'Thu', sales: 0 },
      { name: 'Fri', sales: 0 },
      { name: 'Sat', sales: 0 },
      { name: 'Sun', sales: 0 }
    ],
    topProducts: [
      { name: 'No products yet', value: 1 }
    ]
  },
  products: [],
  sales: [],
  expenses: [],
  workers: []
});

export const simulateLoading = (ms: number = 1000) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const createDemoError = (message: string = 'Demo mode - no real data available') => {
  const error = new Error(message);
  error.name = 'DemoModeError';
  return error;
};