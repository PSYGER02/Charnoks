/**
 * Enhanced Firebase Service
 * Uses new error handling, validation, and monitoring systems
 */

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
import { ErrorHandler, AppError } from '../utils/errorHandler';
import { performanceMonitor, MonitoringUtils } from '../utils/monitoring';
import { 
  saleValidator, 
  expenseValidator, 
  productValidator,
  ValidationUtils 
} from '../utils/validation';

/**
 * Enhanced Products Service
 */
export class ProductsService {
  static async getProducts(): Promise<Product[]> {
    return MonitoringUtils.monitorDbOperation('getProducts', async () => {
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
          createdAt: this.convertTimestamp(doc.data().createdAt)
        })) as Product[];
      } catch (error: any) {
        throw ErrorHandler.handleFirebaseError(error, {
          operation: 'getProducts'
        });
      }
    });
  }

  static async addProduct(productData: {
    name: string;
    price: number;
    stock: number;
    category: string;
    imageUrl?: string;
  }): Promise<string> {
    return MonitoringUtils.monitorApiCall('addProduct', async () => {
      // Validate product data
      const validationResult = productValidator.validate(productData);
      if (!validationResult.isValid) {
        throw ErrorHandler.handleValidationError(validationResult.errors);
      }

      try {
        const addProductFn = httpsCallable(functions, 'addProduct');
        const result = await addProductFn(productData);
        
        if (result.data && typeof result.data === 'object' && 'success' in result.data) {
          const responseData = result.data as any;
          if (responseData.success) {
            return responseData.data.productId;
          } else {
            throw new Error(responseData.error?.message || 'Failed to add product');
          }
        }
        
        // Fallback for legacy response format
        return (result.data as any).productId;
      } catch (error: any) {
        throw ErrorHandler.handleFirebaseError(error, {
          operation: 'addProduct',
          additionalData: productData
        });
      }
    });
  }

  private static convertTimestamp(timestamp: any): string {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toISOString();
    }
    return new Date().toISOString();
  }
}/**

 * Enhanced Sales Service
 */
export class SalesService {
  static async getSales(limitCount: number = 50): Promise<Sale[]> {
    return MonitoringUtils.monitorDbOperation('getSales', async () => {
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
            date: ProductsService.convertTimestamp(data.date),
            items: data.items || [],
            total: data.total || 0,
            workerId: data.workerId || '',
            workerName: data.workerName || 'Unknown',
            payment: data.payment || 0,
            change: data.change || 0
          };
        }) as Sale[];
      } catch (error: any) {
        throw ErrorHandler.handleFirebaseError(error, {
          operation: 'getSales',
          additionalData: { limitCount }
        });
      }
    });
  }

  static async recordSale(saleData: {
    items: { productId: string; quantity: number }[];
    payment: number;
  }): Promise<string> {
    return MonitoringUtils.monitorApiCall('recordSale', async () => {
      // Validate sale data
      const validationResult = saleValidator.validate(saleData);
      if (!validationResult.isValid) {
        throw ErrorHandler.handleValidationError(validationResult.errors);
      }

      try {
        const recordSaleFn = httpsCallable(functions, 'recordSale');
        const result = await recordSaleFn(saleData);
        
        if (result.data && typeof result.data === 'object' && 'success' in result.data) {
          const responseData = result.data as any;
          if (responseData.success) {
            return responseData.data.saleId;
          } else {
            throw new Error(responseData.error?.message || 'Failed to record sale');
          }
        }
        
        // Fallback for legacy response format
        return (result.data as any).saleId;
      } catch (error: any) {
        throw ErrorHandler.handleFirebaseError(error, {
          operation: 'recordSale',
          additionalData: { itemCount: saleData.items.length, payment: saleData.payment }
        });
      }
    });
  }

  static subscribeToSales(callback: (sales: Sale[]) => void, limitCount: number = 50) {
    const salesQuery = query(
      collection(db, 'sales'),
      orderBy('date', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(salesQuery, 
      (snapshot) => {
        try {
          const sales = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              date: ProductsService.convertTimestamp(data.date),
              items: data.items || [],
              total: data.total || 0,
              workerId: data.workerId || '',
              workerName: data.workerName || 'Unknown',
              payment: data.payment || 0,
              change: data.change || 0
            };
          }) as Sale[];
          callback(sales);
        } catch (error: any) {
          ErrorHandler.logError(error, { operation: 'subscribeToSales' });
        }
      },
      (error) => {
        ErrorHandler.logError(error, { operation: 'subscribeToSales' });
      }
    );
  }
}

/**
 * Enhanced Expenses Service
 */
export class ExpensesService {
  static async getExpenses(limitCount: number = 50): Promise<Expense[]> {
    return MonitoringUtils.monitorDbOperation('getExpenses', async () => {
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
            date: ProductsService.convertTimestamp(data.date),
            description: data.description || '',
            amount: data.amount || 0,
            workerId: data.workerId || '',
            workerName: data.workerName || 'Unknown'
          };
        }) as Expense[];
      } catch (error: any) {
        throw ErrorHandler.handleFirebaseError(error, {
          operation: 'getExpenses',
          additionalData: { limitCount }
        });
      }
    });
  }

  static async recordExpense(expenseData: {
    amount: number;
    description: string;
  }): Promise<string> {
    return MonitoringUtils.monitorApiCall('recordExpense', async () => {
      // Validate expense data
      const validationResult = expenseValidator.validate(expenseData);
      if (!validationResult.isValid) {
        throw ErrorHandler.handleValidationError(validationResult.errors);
      }

      try {
        const recordExpenseFn = httpsCallable(functions, 'recordExpense');
        const result = await recordExpenseFn(expenseData);
        
        if (result.data && typeof result.data === 'object' && 'success' in result.data) {
          const responseData = result.data as any;
          if (responseData.success) {
            return responseData.data.expenseId;
          } else {
            throw new Error(responseData.error?.message || 'Failed to record expense');
          }
        }
        
        // Fallback for legacy response format
        return (result.data as any).expenseId;
      } catch (error: any) {
        throw ErrorHandler.handleFirebaseError(error, {
          operation: 'recordExpense',
          additionalData: expenseData
        });
      }
    });
  }
}

/**
 * Enhanced Dashboard Service
 */
export class DashboardService {
  static async getOwnerDashboard() {
    return MonitoringUtils.monitorApiCall('getOwnerDashboard', async () => {
      try {
        const getDashboardFn = httpsCallable(functions, 'getOwnerDashboard');
        const result = await getDashboardFn();
        return result.data;
      } catch (error: any) {
        throw ErrorHandler.handleFirebaseError(error, {
          operation: 'getOwnerDashboard'
        });
      }
    });
  }
}

/**
 * Convenience exports for backward compatibility
 */
export const getProducts = ProductsService.getProducts;
export const addProduct = ProductsService.addProduct;
export const getSales = SalesService.getSales;
export const recordSale = SalesService.recordSale;
export const subscribeToSales = SalesService.subscribeToSales;
export const getExpenses = ExpensesService.getExpenses;
export const recordExpense = ExpensesService.recordExpense;
export const getOwnerDashboard = DashboardService.getOwnerDashboard;

/**
 * Enhanced error handling for Firebase operations
 */
export const handleFirebaseError = ErrorHandler.handleFirebaseError;
export const getUserFriendlyMessage = (error: any): string => {
  if (error instanceof AppError) {
    return error.message;
  }
  return ErrorHandler.handleFirebaseError(error).message;
};