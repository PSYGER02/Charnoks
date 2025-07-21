import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../src/firebaseConfig';
import type { Product, Sale, Expense, Note } from '../types';

// Convert Firestore timestamp to ISO string
const convertTimestamp = (timestamp: any): string => {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  return new Date().toISOString();
};

// Products Service
export const getProducts = async (): Promise<Product[]> => {
  try {
    const productsQuery = query(
      collection(db, 'products'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(productsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt)
    })) as Product[];
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
  }
};

export const addProduct = async (productData: {
  name: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
}): Promise<string> => {
  try {
    const addProductFn = httpsCallable(functions, 'addProduct');
    const result = await addProductFn(productData);
    return (result.data as any).productId;
  } catch (error) {
    console.error('Error adding product:', error);
    throw new Error('Failed to add product');
  }
};

// Sales Service
export const getSales = async (limitCount: number = 50): Promise<Sale[]> => {
  try {
    const salesQuery = query(
      collection(db, 'sales'),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(salesQuery);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        date: convertTimestamp(data.date),
        items: data.items || [],
        total: data.total || 0,
        workerId: data.workerId || '',
        workerName: data.workerName || 'Unknown',
        payment: data.payment || 0,
        change: data.change || 0
      };
    }) as Sale[];
  } catch (error) {
    console.error('Error fetching sales:', error);
    throw new Error('Failed to fetch sales');
  }
};

export const recordSale = async (saleData: {
  items: { productId: string; quantity: number }[];
  payment: number;
}): Promise<string> => {
  try {
    const recordSaleFn = httpsCallable(functions, 'recordSale');
    const result = await recordSaleFn(saleData);
    return (result.data as any).saleId;
  } catch (error) {
    console.error('Error recording sale:', error);
    throw new Error('Failed to record sale');
  }
};

// Expenses Service
export const getExpenses = async (limitCount: number = 50): Promise<Expense[]> => {
  try {
    const expensesQuery = query(
      collection(db, 'expenses'),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(expensesQuery);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        date: convertTimestamp(data.date),
        description: data.description || '',
        amount: data.amount || 0,
        workerId: data.workerId || '',
        workerName: data.workerName || 'Unknown'
      };
    }) as Expense[];
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw new Error('Failed to fetch expenses');
  }
};

export const recordExpense = async (expenseData: {
  amount: number;
  description: string;
}): Promise<string> => {
  try {
    const recordExpenseFn = httpsCallable(functions, 'recordExpense');
    const result = await recordExpenseFn(expenseData);
    return (result.data as any).expenseId;
  } catch (error) {
    console.error('Error recording expense:', error);
    throw new Error('Failed to record expense');
  }
};

// Notes Service (Owner only)
export const getNotes = async (limitCount: number = 50): Promise<Note[]> => {
  try {
    const notesQuery = query(
      collection(db, 'notes'),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(notesQuery);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        date: convertTimestamp(data.date),
        category: data.category || 'Other',
        title: data.title || '',
        description: data.description || '',
        amount: data.amount
      };
    }) as Note[];
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw new Error('Failed to fetch notes');
  }
};

// Dashboard Service (Owner only)
export const getOwnerDashboard = async () => {
  try {
    const getDashboardFn = httpsCallable(functions, 'getOwnerDashboard');
    const result = await getDashboardFn();
    return result.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw new Error('Failed to fetch dashboard data');
  }
};

// AI Services (Owner only)
export const getAIAssistantResponse = async (query: string, history: any[] = []) => {
  try {
    const getAIResponseFn = httpsCallable(functions, 'getAIAssistantResponse');
    const result = await getAIResponseFn({ query, history });
    return (result.data as any).response;
  } catch (error) {
    console.error('Error getting AI response:', error);
    throw new Error('Failed to get AI response');
  }
};

export const getSalesForecast = async () => {
  try {
    const getForecastFn = httpsCallable(functions, 'getSalesForecast');
    const result = await getForecastFn();
    return (result.data as any).forecast;
  } catch (error) {
    console.error('Error getting sales forecast:', error);
    throw new Error('Failed to get sales forecast');
  }
};

export const parseSaleFromVoice = async (transcript: string) => {
  try {
    const parseVoiceFn = httpsCallable(functions, 'parseSaleFromVoice');
    const result = await parseVoiceFn({ transcript });
    return result.data;
  } catch (error) {
    console.error('Error parsing voice sale:', error);
    throw new Error('Failed to parse voice sale');
  }
};

// Real-time listeners
export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  const productsQuery = query(
    collection(db, 'products'),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(productsQuery, (snapshot) => {
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt)
    })) as Product[];
    callback(products);
  });
};

export const subscribeToSales = (callback: (sales: Sale[]) => void, limitCount: number = 50) => {
  const salesQuery = query(
    collection(db, 'sales'),
    orderBy('date', 'desc'),
    limit(limitCount)
  );
  
  return onSnapshot(salesQuery, (snapshot) => {
    const sales = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        date: convertTimestamp(data.date),
        items: data.items || [],
        total: data.total || 0,
        workerId: data.workerId || '',
        workerName: data.workerName || 'Unknown',
        payment: data.payment || 0,
        change: data.change || 0
      };
    }) as Sale[];
    callback(sales);
  });
};//
 Advanced Analytics Services
export const getSalesAnalytics = async (options: {
  startDate?: string;
  endDate?: string;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
} = {}) => {
  try {
    const getAnalyticsFn = httpsCallable(functions, 'getSalesAnalytics');
    const result = await getAnalyticsFn(options);
    return result.data;
  } catch (error) {
    console.error('Error getting sales analytics:', error);
    throw new Error('Failed to get sales analytics');
  }
};

// Worker Management Services
export const getWorkersList = async () => {
  try {
    const getWorkersFn = httpsCallable(functions, 'getWorkersList');
    const result = await getWorkersFn();
    return (result.data as any).workers;
  } catch (error) {
    console.error('Error getting workers list:', error);
    throw new Error('Failed to get workers list');
  }
};

export const getWorkerPerformance = async (workerId: string, days: number = 30) => {
  try {
    const getPerformanceFn = httpsCallable(functions, 'getWorkerPerformance');
    const result = await getPerformanceFn({ workerId, days });
    return result.data;
  } catch (error) {
    console.error('Error getting worker performance:', error);
    throw new Error('Failed to get worker performance');
  }
};

// Product Management Services
export const updateProduct = async (productId: string, updates: Partial<Product>) => {
  try {
    const updateProductFn = httpsCallable(functions, 'updateProduct');
    const result = await updateProductFn({ productId, updates });
    return result.data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw new Error('Failed to update product');
  }
};

export const deleteProduct = async (productId: string) => {
  try {
    const deleteProductFn = httpsCallable(functions, 'deleteProduct');
    const result = await deleteProductFn({ productId });
    return result.data;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw new Error('Failed to delete product');
  }
};

// Backup Services
export const createBackup = async () => {
  try {
    const backupFn = httpsCallable(functions, 'backupData');
    const result = await backupFn();
    return result.data;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw new Error('Failed to create backup');
  }
};

// User Management Services
export const setUserRole = async (targetUid: string, newRole: 'owner' | 'worker') => {
  try {
    const setRoleFn = httpsCallable(functions, 'setUserRole');
    const result = await setRoleFn({ targetUid, newRole });
    return result.data;
  } catch (error) {
    console.error('Error setting user role:', error);
    throw new Error('Failed to set user role');
  }
};

// Utility functions for better data handling
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Error handling utility
export const handleFirebaseError = (error: any): string => {
  if (error.code) {
    switch (error.code) {
      case 'permission-denied':
        return 'You do not have permission to perform this action.';
      case 'not-found':
        return 'The requested data was not found.';
      case 'already-exists':
        return 'This item already exists.';
      case 'invalid-argument':
        return 'Invalid data provided.';
      case 'unauthenticated':
        return 'Please log in to continue.';
      case 'failed-precondition':
        return 'Operation failed due to current system state.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }
  return error.message || 'An unexpected error occurred.';
};// 
System Monitoring Services
export const getSystemHealth = async () => {
  try {
    const healthCheckFn = httpsCallable(functions, 'healthCheck');
    const result = await healthCheckFn();
    return result.data;
  } catch (error) {
    console.error('Error getting system health:', error);
    throw new Error('Failed to get system health');
  }
};

export const getPerformanceMetrics = async () => {
  try {
    const getMetricsFn = httpsCallable(functions, 'getPerformanceMetrics');
    const result = await getMetricsFn();
    return result.data;
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    throw new Error('Failed to get performance metrics');
  }
};

// Data Management Services
export const cleanupOldData = async (daysOld: number = 365, dryRun: boolean = true) => {
  try {
    const cleanupFn = httpsCallable(functions, 'cleanupData');
    const result = await cleanupFn({ daysOld, dryRun });
    return result.data;
  } catch (error) {
    console.error('Error cleaning up data:', error);
    throw new Error('Failed to cleanup data');
  }
};

// Business Reporting Services
export const generateBusinessReport = async (options: {
  startDate?: string;
  endDate?: string;
  includeDetails?: boolean;
} = {}) => {
  try {
    const generateReportFn = httpsCallable(functions, 'generateBusinessReport');
    const result = await generateReportFn(options);
    return result.data;
  } catch (error) {
    console.error('Error generating business report:', error);
    throw new Error('Failed to generate business report');
  }
};

// Enhanced utility functions
export const downloadAsJSON = (data: any, filename: string) => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export const downloadAsCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  const dataBlob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPerformanceMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMetrics();
  }, [refreshMetrics]);

  return { metrics, loading, error, refreshMetrics };
};

// Data validation utilities
export const validateProductData = (product: Partial<Product>): string[] => {
  const errors: string[] = [];
  
  if (!product.name || product.name.trim().length === 0) {
    errors.push('Product name is required');
  }
  
  if (!product.price || product.price <= 0) {
    errors.push('Product price must be greater than 0');
  }
  
  if (product.stock === undefined || product.stock < 0) {
    errors.push('Product stock must be 0 or greater');
  }
  
  if (!product.category || product.category.trim().length === 0) {
    errors.push('Product category is required');
  }
  
  return errors;
};

export const validateSaleData = (saleData: {
  items: { productId: string; quantity: number }[];
  payment: number;
}): string[] => {
  const errors: string[] = [];
  
  if (!saleData.items || saleData.items.length === 0) {
    errors.push('At least one item is required');
  }
  
  saleData.items?.forEach((item, index) => {
    if (!item.productId) {
      errors.push(`Item ${index + 1}: Product ID is required`);
    }
    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
    }
  });
  
  if (!saleData.payment || saleData.payment < 0) {
    errors.push('Payment amount must be 0 or greater');
  }
  
  return errors;
};

export const validateExpenseData = (expenseData: {
  amount: number;
  description: string;
}): string[] => {
  const errors: string[] = [];
  
  if (!expenseData.amount || expenseData.amount <= 0) {
    errors.push('Expense amount must be greater than 0');
  }
  
  if (!expenseData.description || expenseData.description.trim().length === 0) {
    errors.push('Expense description is required');
  }
  
  return errors;
};