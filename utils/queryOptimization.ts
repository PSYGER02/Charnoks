/**
 * Query Optimization Utilities
 * Provides optimized database queries with proper indexing and pagination
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  DocumentSnapshot,
  QueryConstraint,
  Timestamp
} from 'firebase/firestore';
import { db } from '../src/firebaseConfig';
import { performanceMonitor } from './monitoring';
import { ErrorHandler } from './errorHandler';

/**
 * Pagination interface
 */
export interface PaginationOptions {
  limit?: number;
  startAfter?: DocumentSnapshot;
}

/**
 * Query result with pagination
 */
export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  lastDoc?: DocumentSnapshot;
  totalCount?: number;
}

/**
 * Date range interface
 */
export interface DateRange {
  start?: Date;
  end?: Date;
}

/**
 * Optimized Sales Queries
 */
export class OptimizedSalesQueries {
  /**
   * Get sales with optimized pagination
   */
  static async getSalesPaginated(options: {
    pagination?: PaginationOptions;
    workerId?: string;
    dateRange?: DateRange;
  } = {}): Promise<PaginatedResult<any>> {
    const timerId = performanceMonitor.startTimer('getSalesPaginated');
    
    try {
      const { pagination = {}, workerId, dateRange } = options;
      const { limit: pageLimit = 50, startAfter } = pagination;

      const constraints: QueryConstraint[] = [];

      // Add worker filter if specified
      if (workerId) {
        constraints.push(where('workerId', '==', workerId));
      }

      // Add date range filters if specified
      if (dateRange?.start) {
        constraints.push(where('date', '>=', Timestamp.fromDate(dateRange.start)));
      }
      if (dateRange?.end) {
        constraints.push(where('date', '<=', Timestamp.fromDate(dateRange.end)));
      }

      // Always order by date descending for consistent results
      constraints.push(orderBy('date', 'desc'));

      // Add pagination
      if (startAfter) {
        constraints.push(startAfter);
      }
      constraints.push(limit(pageLimit + 1)); // Get one extra to check if there are more

      const salesQuery = query(collection(db, 'sales'), ...constraints);
      const snapshot = await getDocs(salesQuery);

      const docs = snapshot.docs;
      const hasMore = docs.length > pageLimit;
      const data = docs.slice(0, pageLimit);
      const lastDoc = data.length > 0 ? data[data.length - 1] : undefined;

      const result = {
        data: data.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate?.()?.toISOString() || doc.data().date
        })),
        hasMore,
        lastDoc
      };

      performanceMonitor.endTimer(timerId, true);
      performanceMonitor.logMetric('sales_query_results', result.data.length);

      return result;
    } catch (error: any) {
      performanceMonitor.endTimer(timerId, false, error.message);
      throw ErrorHandler.handleFirebaseError(error, {
        operation: 'getSalesPaginated',
        additionalData: options
      });
    }
  }

  /**
   * Get sales summary for dashboard (optimized)
   */
  static async getSalesSummary(days: number = 30): Promise<{
    totalRevenue: number;
    transactionCount: number;
    averageOrderValue: number;
    topProducts: Array<{ name: string; revenue: number; quantity: number }>;
  }> {
    const timerId = performanceMonitor.startTimer('getSalesSummary');
    
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const salesQuery = query(
        collection(db, 'sales'),
        where('date', '>=', Timestamp.fromDate(startDate)),
        orderBy('date', 'desc'),
        limit(1000) // Reasonable limit for summary
      );

      const snapshot = await getDocs(salesQuery);
      
      let totalRevenue = 0;
      let transactionCount = 0;
      const productStats = new Map<string, { name: string; revenue: number; quantity: number }>();

      snapshot.docs.forEach(doc => {
        const sale = doc.data();
        totalRevenue += sale.total || 0;
        transactionCount++;

        // Aggregate product statistics
        (sale.items || []).forEach((item: any) => {
          const existing = productStats.get(item.productId) || {
            name: item.name,
            revenue: 0,
            quantity: 0
          };
          existing.revenue += (item.price || 0) * (item.quantity || 0);
          existing.quantity += item.quantity || 0;
          productStats.set(item.productId, existing);
        });
      });

      const averageOrderValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;
      const topProducts = Array.from(productStats.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      performanceMonitor.endTimer(timerId, true);
      
      return {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        transactionCount,
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
        topProducts
      };
    } catch (error: any) {
      performanceMonitor.endTimer(timerId, false, error.message);
      throw ErrorHandler.handleFirebaseError(error, {
        operation: 'getSalesSummary',
        additionalData: { days }
      });
    }
  }

  /**
   * Get worker performance data (optimized)
   */
  static async getWorkerPerformance(workerId: string, days: number = 30): Promise<{
    totalSales: number;
    transactionCount: number;
    averageOrderValue: number;
    dailyBreakdown: Array<{ date: string; sales: number; transactions: number }>;
  }> {
    const timerId = performanceMonitor.startTimer('getWorkerPerformance');
    
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Use optimized compound index: workerId + date
      const salesQuery = query(
        collection(db, 'sales'),
        where('workerId', '==', workerId),
        where('date', '>=', Timestamp.fromDate(startDate)),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(salesQuery);
      
      let totalSales = 0;
      let transactionCount = 0;
      const dailyStats = new Map<string, { sales: number; transactions: number }>();

      snapshot.docs.forEach(doc => {
        const sale = doc.data();
        const saleTotal = sale.total || 0;
        totalSales += saleTotal;
        transactionCount++;

        // Group by day
        const date = sale.date?.toDate?.()?.toISOString()?.split('T')[0] || 
                    new Date().toISOString().split('T')[0];
        
        const existing = dailyStats.get(date) || { sales: 0, transactions: 0 };
        existing.sales += saleTotal;
        existing.transactions++;
        dailyStats.set(date, existing);
      });

      const averageOrderValue = transactionCount > 0 ? totalSales / transactionCount : 0;
      const dailyBreakdown = Array.from(dailyStats.entries())
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date));

      performanceMonitor.endTimer(timerId, true);
      
      return {
        totalSales: parseFloat(totalSales.toFixed(2)),
        transactionCount,
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
        dailyBreakdown
      };
    } catch (error: any) {
      performanceMonitor.endTimer(timerId, false, error.message);
      throw ErrorHandler.handleFirebaseError(error, {
        operation: 'getWorkerPerformance',
        additionalData: { workerId, days }
      });
    }
  }
}

/**
 * Optimized Product Queries
 */
export class OptimizedProductQueries {
  /**
   * Get active products with category filtering
   */
  static async getActiveProducts(options: {
    category?: string;
    lowStockOnly?: boolean;
    pagination?: PaginationOptions;
  } = {}): Promise<PaginatedResult<any>> {
    const timerId = performanceMonitor.startTimer('getActiveProducts');
    
    try {
      const { category, lowStockOnly, pagination = {} } = options;
      const { limit: pageLimit = 50, startAfter } = pagination;

      const constraints: QueryConstraint[] = [
        where('isActive', '==', true)
      ];

      if (category) {
        constraints.push(where('category', '==', category));
      }

      if (lowStockOnly) {
        constraints.push(where('stock', '<=', 10));
      }

      // Order by name for consistent pagination
      constraints.push(orderBy('name', 'asc'));

      if (startAfter) {
        constraints.push(startAfter);
      }
      constraints.push(limit(pageLimit + 1));

      const productsQuery = query(collection(db, 'products'), ...constraints);
      const snapshot = await getDocs(productsQuery);

      const docs = snapshot.docs;
      const hasMore = docs.length > pageLimit;
      const data = docs.slice(0, pageLimit);
      const lastDoc = data.length > 0 ? data[data.length - 1] : undefined;

      const result = {
        data: data.map(doc => ({
          id: doc.id,
          ...doc.data()
        })),
        hasMore,
        lastDoc
      };

      performanceMonitor.endTimer(timerId, true);
      return result;
    } catch (error: any) {
      performanceMonitor.endTimer(timerId, false, error.message);
      throw ErrorHandler.handleFirebaseError(error, {
        operation: 'getActiveProducts',
        additionalData: options
      });
    }
  }

  /**
   * Get low stock products (optimized)
   */
  static async getLowStockProducts(threshold: number = 10): Promise<any[]> {
    const timerId = performanceMonitor.startTimer('getLowStockProducts');
    
    try {
      // Use compound index: isActive + stock
      const productsQuery = query(
        collection(db, 'products'),
        where('isActive', '==', true),
        where('stock', '<=', threshold),
        orderBy('stock', 'asc'),
        limit(50)
      );

      const snapshot = await getDocs(productsQuery);
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      performanceMonitor.endTimer(timerId, true);
      performanceMonitor.logMetric('low_stock_products_found', products.length);
      
      return products;
    } catch (error: any) {
      performanceMonitor.endTimer(timerId, false, error.message);
      throw ErrorHandler.handleFirebaseError(error, {
        operation: 'getLowStockProducts',
        additionalData: { threshold }
      });
    }
  }
}

/**
 * Optimized Expense Queries
 */
export class OptimizedExpenseQueries {
  /**
   * Get expenses with pagination and filtering
   */
  static async getExpensesPaginated(options: {
    pagination?: PaginationOptions;
    workerId?: string;
    dateRange?: DateRange;
  } = {}): Promise<PaginatedResult<any>> {
    const timerId = performanceMonitor.startTimer('getExpensesPaginated');
    
    try {
      const { pagination = {}, workerId, dateRange } = options;
      const { limit: pageLimit = 50, startAfter } = pagination;

      const constraints: QueryConstraint[] = [];

      if (workerId) {
        constraints.push(where('workerId', '==', workerId));
      }

      if (dateRange?.start) {
        constraints.push(where('date', '>=', Timestamp.fromDate(dateRange.start)));
      }
      if (dateRange?.end) {
        constraints.push(where('date', '<=', Timestamp.fromDate(dateRange.end)));
      }

      constraints.push(orderBy('date', 'desc'));

      if (startAfter) {
        constraints.push(startAfter);
      }
      constraints.push(limit(pageLimit + 1));

      const expensesQuery = query(collection(db, 'expenses'), ...constraints);
      const snapshot = await getDocs(expensesQuery);

      const docs = snapshot.docs;
      const hasMore = docs.length > pageLimit;
      const data = docs.slice(0, pageLimit);
      const lastDoc = data.length > 0 ? data[data.length - 1] : undefined;

      const result = {
        data: data.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate?.()?.toISOString() || doc.data().date
        })),
        hasMore,
        lastDoc
      };

      performanceMonitor.endTimer(timerId, true);
      return result;
    } catch (error: any) {
      performanceMonitor.endTimer(timerId, false, error.message);
      throw ErrorHandler.handleFirebaseError(error, {
        operation: 'getExpensesPaginated',
        additionalData: options
      });
    }
  }
}

/**
 * Query optimization utilities
 */
export const QueryOptimizationUtils = {
  /**
   * Create optimized date range for queries
   */
  createDateRange: (days: number): DateRange => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return { start, end };
  },

  /**
   * Batch multiple queries for better performance
   */
  batchQueries: async <T>(queries: Array<() => Promise<T>>): Promise<T[]> => {
    const timerId = performanceMonitor.startTimer('batch_queries');
    
    try {
      const results = await Promise.all(queries.map(query => query()));
      performanceMonitor.endTimer(timerId, true);
      return results;
    } catch (error: any) {
      performanceMonitor.endTimer(timerId, false, error.message);
      throw error;
    }
  },

  /**
   * Get query performance recommendations
   */
  getQueryRecommendations: (collectionName: string, filters: any[]): string[] => {
    const recommendations: string[] = [];
    
    if (filters.length > 1) {
      recommendations.push(`Consider creating a compound index for ${collectionName} with fields: ${filters.join(', ')}`);
    }
    
    if (filters.includes('date') && !filters.includes('orderBy')) {
      recommendations.push('Consider adding orderBy for date queries to improve performance');
    }
    
    return recommendations;
  }
};