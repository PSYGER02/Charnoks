/**
 * Offline-First Data Service
 * Automatically loads from IndexedDB when offline, Supabase when online
 * Provides seamless offline/online data access for dashboard components
 */

import { connectionService } from './connectionService';
import { offlineDB } from './offlineService';
import { getSales as getSupabaseSales, getExpenses as getSupabaseExpenses } from './supabaseService';
import type { Sale, Expense } from '../types';

class OfflineFirstDataService {
  
  /**
   * Get sales data - Fresh from Supabase when online, IndexedDB when offline
   */
  async getSales(limitCount: number = 50): Promise<Sale[]> {
    try {
      if (connectionService.online) {
        try {
          // When online, get fresh data from Supabase
          const remoteSales = await getSupabaseSales(limitCount);
          
          if (remoteSales.length > 0) {
            // Update local cache with fresh data in background
            this._updateLocalCache('sales', remoteSales).catch(console.warn);
            return remoteSales;
          }
        } catch (error) {
          console.warn('Failed to fetch remote sales, using local data:', error);
        }
      }
      
      // Fallback to local data (when offline or Supabase fails)
      const localSales = await offlineDB.getAll('sales');
      return localSales.slice(0, limitCount);
      
    } catch (error) {
      console.error('Failed to get sales data:', error);
      return [];
    }
  }

  /**
   * Get expenses data - Fresh from Supabase when online, IndexedDB when offline
   */
  async getExpenses(limitCount: number = 50): Promise<Expense[]> {
    try {
      if (connectionService.online) {
        try {
          // When online, get fresh data from Supabase
          const remoteExpenses = await getSupabaseExpenses(limitCount);
          
          if (remoteExpenses.length > 0) {
            // Update local cache with fresh data in background
            this._updateLocalCache('expenses', remoteExpenses).catch(console.warn);
            return remoteExpenses;
          }
        } catch (error) {
          console.warn('Failed to fetch remote expenses, using local data:', error);
        }
      }
      
      // Fallback to local data (when offline or Supabase fails)
      const localExpenses = await offlineDB.getAll('expenses');
      return localExpenses.slice(0, limitCount);
      
    } catch (error) {
      console.error('Failed to get expenses data:', error);
      return [];
    }
  }

  /**
   * Get products data with offline support
   */
  async getProducts(limitCount: number = 50) {
    try {
      const localProducts = await offlineDB.getAll('products');
      
      if (connectionService.online) {
        try {
          // Try to get fresh product data from Supabase
          // You can implement getSupabaseProducts() similar to sales/expenses
          return localProducts.slice(0, limitCount);
        } catch (error) {
          return localProducts.slice(0, limitCount);
        }
      } else {
        return localProducts.slice(0, limitCount);
      }
    } catch (error) {
      console.error('Failed to get products data:', error);
      return [];
    }
  }

  /**
   * Get user profiles with offline support
   */
  async getWorkers() {
    try {
      const localWorkers = await offlineDB.getAll('user_profiles');
      return localWorkers.filter(worker => worker.role === 'worker');
    } catch (error) {
      console.error('Failed to get workers data:', error);
      return [];
    }
  }

  /**
   * Check if we have any local data available
   */
  async hasLocalData(): Promise<boolean> {
    try {
      const [sales, expenses] = await Promise.all([
        offlineDB.getAll('sales'),
        offlineDB.getAll('expenses')
      ]);
      return sales.length > 0 || expenses.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Force refresh from remote (when user manually syncs)
   */
  async forceRefresh() {
    if (!connectionService.online) {
      throw new Error('Cannot refresh: offline');
    }

    try {
      const [sales, expenses] = await Promise.all([
        getSupabaseSales(100),
        getSupabaseExpenses(100)
      ]);

      // Clear and refresh local cache
      // Note: In a production app, you'd want more sophisticated merging
      console.log('Refreshed data from server:', { sales: sales.length, expenses: expenses.length });
      
      return { sales, expenses };
    } catch (error) {
      console.error('Failed to force refresh:', error);
      throw error;
    }
  }

  /**
   * Get dashboard data with offline-first approach
   */
  async getDashboardData() {
    try {
      const [sales, expenses] = await Promise.all([
        this.getSales(30),
        this.getExpenses(30)
      ]);

      // Calculate dashboard metrics
      const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      const netProfit = totalRevenue - totalExpenses;
      const transactions = sales.length;

      // Calculate sales trend (last 7 days)
      const salesTrend = this.calculateSalesTrend(sales);

      // Get top products from sales data
      const topProducts = this.calculateTopProducts(sales);

      return {
        totalRevenue,
        totalExpenses,
        netProfit,
        transactions,
        salesTrend,
        topProducts
      };
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        transactions: 0,
        salesTrend: this.getEmptySalesTrend(),
        topProducts: [{ name: 'No products yet', value: 1 }]
      };
    }
  }

  /**
   * Calculate sales trend for last 7 days
   */
  private calculateSalesTrend(sales: Sale[]) {
    const now = new Date();
    const salesTrend = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const daySales = sales.filter((sale: Sale) => {
        const saleDate = new Date(sale.date);
        return saleDate >= date && saleDate < nextDate;
      });
      
      const dayTotal = daySales.reduce((sum: number, sale: Sale) => sum + (sale.total || 0), 0);
      
      salesTrend.push({
        name: dayNames[date.getDay()],
        sales: dayTotal
      });
    }

    return salesTrend;
  }

  /**
   * Calculate top products from sales data
   */
  private calculateTopProducts(sales: Sale[]) {
    const productTotals: { [key: string]: number } = {};
    
    sales.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const productName = item.productName || item.name || 'Unknown Product';
          const quantity = item.quantity || 0;
          productTotals[productName] = (productTotals[productName] || 0) + quantity;
        });
      }
    });

    const topProductsArray = Object.entries(productTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return topProductsArray.length > 0 ? topProductsArray : [{ name: 'No products yet', value: 1 }];
  }

  /**
   * Get empty sales trend for fallback
   */
  private getEmptySalesTrend() {
    return [
      { name: 'Mon', sales: 0 },
      { name: 'Tue', sales: 0 },
      { name: 'Wed', sales: 0 },
      { name: 'Thu', sales: 0 },
      { name: 'Fri', sales: 0 },
      { name: 'Sat', sales: 0 },
      { name: 'Sun', sales: 0 }
    ];
  }

  /**
   * Private method to update local cache with fresh data
   */
  private async _updateLocalCache(tableName: string, data: any[]): Promise<void> {
    try {
      // Update cache in background without blocking UI
      for (const record of data.slice(0, 20)) { // Limit to prevent UI blocking
        await offlineDB.upsert(tableName, {
          ...record,
          local_uuid: record.local_uuid || record.id || crypto.randomUUID(),
          sync_status: 'synced'
        });
      }
    } catch (error) {
      console.warn(`Failed to update ${tableName} cache:`, error);
    }
  }
}

// Export singleton instance
export const offlineFirstDataService = new OfflineFirstDataService();

// Export individual functions for backward compatibility
export const getSalesOfflineFirst = (limitCount?: number) => 
  offlineFirstDataService.getSales(limitCount);

export const getExpensesOfflineFirst = (limitCount?: number) => 
  offlineFirstDataService.getExpenses(limitCount);

export const getWorkersOfflineFirst = () => 
  offlineFirstDataService.getWorkers();

export const getProductsOfflineFirst = (limitCount?: number) => 
  offlineFirstDataService.getProducts(limitCount);

export const getDashboardDataOfflineFirst = () => 
  offlineFirstDataService.getDashboardData();