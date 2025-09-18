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