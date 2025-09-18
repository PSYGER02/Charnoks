/**
 * Enhanced Offline Data Service
 * Provides offline-first data access for all components that need to load/display data
 * Handles the seamless transition between offline IndexedDB and online Supabase data
 */

import { offlineDB } from './offlineService';
import { getSales, getExpenses, getProducts, getWorkers } from './supabaseService';

interface DataLoadingOptions {
  preferOffline?: boolean;
  limit?: number;
  forceRefresh?: boolean;
}

class EnhancedOfflineDataService {
  
  /**
   * Generic data loader that works with any table
   * @param tableName - Name of the table to load from
   * @param supabaseLoader - Function to load data from Supabase
   * @param options - Loading options
   */
  async loadData<T>(
    tableName: string, 
    supabaseLoader: (limit?: number) => Promise<T[]>,
    options: DataLoadingOptions = {}
  ): Promise<T[]> {
    const { preferOffline = false, limit = 50, forceRefresh = false } = options;

    try {
      // Force refresh bypasses cache
      if (forceRefresh && navigator.onLine) {
        console.log(`🔄 Force refreshing ${tableName} from Supabase`);
        try {
          const freshData = await supabaseLoader(limit);
          await this._updateCache(tableName, freshData);
          return freshData;
        } catch (error) {
          console.warn(`Force refresh failed for ${tableName}, falling back to cache:`, error);
        }
      }

      // Check local data first
      const localData = await offlineDB.getAll(tableName);
      const hasLocalData = localData.length > 0;

      // If prefer offline or we're offline, use local data if available
      if (preferOffline || !navigator.onLine) {
        if (hasLocalData) {
          console.log(`📱 Loading ${tableName} from local cache (${localData.length} records)`);
          return localData.slice(0, limit) as T[];
        }
      }

      // If online and not preferring offline, try to get fresh data
      if (navigator.onLine && !preferOffline) {
        try {
          console.log(`🌐 Loading ${tableName} from Supabase`);
          const freshData = await supabaseLoader(limit);
          
          if (freshData.length > 0) {
            // Update cache in background
            this._updateCache(tableName, freshData).catch(console.warn);
            return freshData;
          }
        } catch (error) {
          console.warn(`Failed to load ${tableName} from Supabase:`, error);
        }
      }

      // Fallback to local data if we have it
      if (hasLocalData) {
        console.log(`📱 Fallback: Loading ${tableName} from local cache (${localData.length} records)`);
        return localData.slice(0, limit) as T[];
      }

      // No data available
      console.log(`❌ No data available for ${tableName}`);
      return [];

    } catch (error) {
      console.error(`Error loading ${tableName}:`, error);
      return [];
    }
  }

  /**
   * Load sales data with offline-first approach
   */
  async getSales(options: DataLoadingOptions = {}) {
    return this.loadData('sales', getSales, options);
  }

  /**
   * Load expenses data with offline-first approach
   */
  async getExpenses(options: DataLoadingOptions = {}) {
    return this.loadData('expenses', getExpenses, options);
  }

  /**
   * Load products data with offline-first approach
   */
  async getProducts(options: DataLoadingOptions = {}) {
    return this.loadData('products', getProducts, options);
  }

  /**
   * Load workers data with offline-first approach
   */
  async getWorkers(options: DataLoadingOptions = {}) {
    return this.loadData('user_profiles', getWorkers, options);
  }

  /**
   * Get comprehensive data summary for dashboard and analytics
   */
  async getDataSummary() {
    try {
      const [sales, expenses, products, workers] = await Promise.all([
        this.getSales({ limit: 100 }),
        this.getExpenses({ limit: 100 }),
        this.getProducts({ limit: 50 }),
        this.getWorkers({ limit: 20 })
      ]);

      const summary = {
        sales: {
          count: sales.length,
          total: sales.reduce((sum: number, sale: any) => sum + (sale.total || 0), 0),
          recent: sales.slice(0, 5)
        },
        expenses: {
          count: expenses.length,
          total: expenses.reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0),
          recent: expenses.slice(0, 5)
        },
        products: {
          count: products.length,
          lowStock: products.filter((p: any) => (p.stock || 0) < 10).length
        },
        workers: {
          count: workers.length,
          active: workers.filter((w: any) => w.role === 'worker').length
        },
        dataStatus: {
          offline: !navigator.onLine,
          lastUpdate: new Date().toISOString()
        }
      };

      console.log('📊 Data summary generated:', summary);
      return summary;

    } catch (error) {
      console.error('Failed to generate data summary:', error);
      return null;
    }
  }

  /**
   * Check data availability across all tables
   */
  async getDataAvailability() {
    try {
      const tables = ['sales', 'expenses', 'products', 'user_profiles', 'notes'];
      const availability: { [key: string]: number } = {};

      for (const table of tables) {
        availability[table] = await offlineDB.getCount(table);
      }

      const totalRecords = Object.values(availability).reduce((sum, count) => sum + count, 0);

      return {
        availability,
        totalRecords,
        hasData: totalRecords > 0,
        online: navigator.onLine
      };
    } catch (error) {
      console.error('Failed to check data availability:', error);
      return { availability: {}, totalRecords: 0, hasData: false, online: false };
    }
  }

  /**
   * Refresh all cached data (when connection is restored)
   */
  async refreshAllData() {
    if (!navigator.onLine) {
      throw new Error('Cannot refresh data while offline');
    }

    console.log('🔄 Refreshing all cached data...');
    
    try {
      const results = await Promise.allSettled([
        this.getSales({ forceRefresh: true, limit: 100 }),
        this.getExpenses({ forceRefresh: true, limit: 100 }),
        this.getProducts({ forceRefresh: true, limit: 50 }),
        this.getWorkers({ forceRefresh: true, limit: 20 })
      ]);

      const refreshedCounts = {
        sales: results[0].status === 'fulfilled' ? results[0].value.length : 0,
        expenses: results[1].status === 'fulfilled' ? results[1].value.length : 0,
        products: results[2].status === 'fulfilled' ? results[2].value.length : 0,
        workers: results[3].status === 'fulfilled' ? results[3].value.length : 0
      };

      console.log('✅ Data refresh completed:', refreshedCounts);
      return refreshedCounts;

    } catch (error) {
      console.error('Failed to refresh all data:', error);
      throw error;
    }
  }

  /**
   * Clear all cached data (for testing or reset)
   */
  async clearAllCache() {
    const tables = ['sales', 'expenses', 'products', 'user_profiles', 'notes'];
    
    for (const table of tables) {
      try {
        await offlineDB.clearTable(table);
      } catch (error) {
        console.warn(`Failed to clear ${table}:`, error);
      }
    }
    
    console.log('🗑️ All cached data cleared');
  }

  // Private helper methods

  private async _updateCache(tableName: string, data: any[]): Promise<void> {
    try {
      // Update cache with fresh data
      for (const record of data.slice(0, 50)) { // Limit to prevent blocking
        await offlineDB.upsert(tableName, {
          ...record,
          local_uuid: record.local_uuid || record.id || crypto.randomUUID(),
          sync_status: 'synced',
          updated_at: new Date().toISOString()
        });
      }
      console.log(`💾 Cache updated for ${tableName}: ${data.length} records`);
    } catch (error) {
      console.warn(`Failed to update cache for ${tableName}:`, error);
    }
  }
}

// Export singleton instance
export const enhancedOfflineDataService = new EnhancedOfflineDataService();

// Export convenient functions for common use cases
export const getSalesOffline = (options?: DataLoadingOptions) => 
  enhancedOfflineDataService.getSales(options);

export const getExpensesOffline = (options?: DataLoadingOptions) => 
  enhancedOfflineDataService.getExpenses(options);

export const getProductsOffline = (options?: DataLoadingOptions) => 
  enhancedOfflineDataService.getProducts(options);

export const getWorkersOffline = (options?: DataLoadingOptions) => 
  enhancedOfflineDataService.getWorkers(options);

export const getDataSummaryOffline = () => 
  enhancedOfflineDataService.getDataSummary();

export const refreshAllDataOffline = () => 
  enhancedOfflineDataService.refreshAllData();