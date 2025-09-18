/**
 * Offline Data Initialization Service
 * Ensures IndexedDB is populated with initial data for offline functionality
 * Runs on app startup and provides fallback data when needed
 */

import { offlineDB } from './offlineService';
import { connectionService } from './connectionService';
import { getSales, getExpenses, getProducts } from './supabaseService';
import { getWorkers } from './workerService';

class OfflineDataInitService {
  private hasInitialized = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize offline data stores with fresh data from Supabase
   * Only runs once per session, safe to call multiple times
   */
  async initializeOfflineData(): Promise<void> {
    if (this.hasInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._performInitialization();
    return this.initPromise;
  }

  private async _performInitialization(): Promise<void> {
    try {
      console.log('🔄 Initializing offline data stores...');
      
      // Initialize the IndexedDB
      await offlineDB.init();

      // Check if we already have local data
      const [localSalesCount, localExpensesCount, localProductsCount] = await Promise.all([
        offlineDB.getCount('sales'),
        offlineDB.getCount('expenses'),
        offlineDB.getCount('products')
      ]);

      const hasLocalData = localSalesCount > 0 || localExpensesCount > 0 || localProductsCount > 0;

      // If we have local data and we're offline, we're good
      if (hasLocalData && !connectionService.online) {
        console.log('📱 Using existing offline data (offline mode)');
        this.hasInitialized = true;
        return;
      }

      // If online, try to fetch fresh data
      if (connectionService.online) {
        await this._fetchAndStoreInitialData(hasLocalData);
      } else if (!hasLocalData) {
        // Offline with no local data - create minimal sample data
        await this._createSampleData();
      }

      this.hasInitialized = true;
      console.log('✅ Offline data initialization complete');

    } catch (error) {
      console.warn('⚠️ Offline data initialization failed:', error);
      // Even if initialization fails, mark as initialized to prevent infinite retries
      this.hasInitialized = true;
    }
  }

  private async _fetchAndStoreInitialData(hasLocalData: boolean): Promise<void> {
    try {
      console.log('🌐 Fetching fresh data from Supabase...');

      // Fetch fresh data from Supabase (with reasonable limits)
      const [salesData, expensesData, productsData, workersData] = await Promise.all([
        getSales(100).catch(() => []),
        getExpenses(100).catch(() => []),
        getProducts().catch(() => []),
        getWorkers().catch(() => [])
      ]);

      // Only clear and repopulate if we got significant new data
      const newDataAvailable = salesData.length > 0 || expensesData.length > 0 || productsData.length > 0;

      if (newDataAvailable) {
        // Store fresh data (this will merge with existing data)
        const storePromises = [];

        if (salesData.length > 0) {
          storePromises.push(this._bulkStore('sales', salesData));
        }
        if (expensesData.length > 0) {
          storePromises.push(this._bulkStore('expenses', expensesData));
        }
        if (productsData.length > 0) {
          storePromises.push(this._bulkStore('products', productsData));
        }
        if (workersData.length > 0) {
          storePromises.push(this._bulkStore('user_profiles', workersData));
        }

        await Promise.all(storePromises);
        console.log(`📦 Stored fresh data: ${salesData.length} sales, ${expensesData.length} expenses, ${productsData.length} products`);
      } else if (!hasLocalData) {
        // No fresh data and no local data - create sample data
        await this._createSampleData();
      }

    } catch (error) {
      console.warn('Failed to fetch initial data from Supabase:', error);
      if (!hasLocalData) {
        await this._createSampleData();
      }
    }
  }

  private async _bulkStore(tableName: string, data: any[]): Promise<void> {
    try {
      // Store each record, letting the service handle duplicates
      for (const record of data) {
        try {
          await offlineDB.upsert(tableName, {
            ...record,
            local_uuid: record.local_uuid || record.id || crypto.randomUUID(),
            sync_status: 'synced', // Mark as synced since it came from server
            updated_at: record.updated_at || new Date().toISOString()
          });
        } catch (recordError) {
          // Skip individual record errors to continue with bulk operation
          console.warn(`Failed to store ${tableName} record:`, recordError);
        }
      }
    } catch (error) {
      console.warn(`Failed to bulk store ${tableName}:`, error);
    }
  }

  private async _createSampleData(): Promise<void> {
    console.log('📝 Creating sample data for offline demonstration...');

    try {
      // Create sample sales
      const sampleSales = [
        {
          description: 'Sample Sale 1',
          total: 150.00,
          items: [{ name: 'Sample Product', quantity: 1, price: 150.00 }],
          worker_name: 'Demo Worker',
          payment_method: 'cash'
        },
        {
          description: 'Sample Sale 2',
          total: 89.50,
          items: [{ name: 'Sample Product 2', quantity: 2, price: 44.75 }],
          worker_name: 'Demo Worker',
          payment_method: 'cash'
        }
      ];

      // Create sample expenses
      const sampleExpenses = [
        {
          description: 'Sample Office Supplies',
          amount: 45.00,
          category: 'supplies',
          worker_name: 'Demo Worker'
        },
        {
          description: 'Sample Transportation',
          amount: 20.00,
          category: 'transportation',
          worker_name: 'Demo Worker'
        }
      ];

      // Store sample data
      for (const sale of sampleSales) {
        await offlineDB.save('sales', sale);
      }

      for (const expense of sampleExpenses) {
        await offlineDB.save('expenses', expense);
      }

      console.log('✅ Sample data created for offline demonstration');

    } catch (error) {
      console.warn('Failed to create sample data:', error);
    }
  }

  /**
   * Force refresh offline data from server
   */
  async refreshOfflineData(): Promise<void> {
    if (!connectionService.online) {
      throw new Error('Cannot refresh: device is offline');
    }

    console.log('🔄 Force refreshing offline data...');
    this.hasInitialized = false;
    this.initPromise = null;
    await this.initializeOfflineData();
  }

  /**
   * Check if offline data is available and ready
   */
  async isOfflineDataReady(): Promise<boolean> {
    try {
      await this.initializeOfflineData();
      
      const [salesCount, expensesCount] = await Promise.all([
        offlineDB.getCount('sales'),
        offlineDB.getCount('expenses')
      ]);

      return salesCount > 0 || expensesCount > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get offline data statistics
   */
  async getOfflineDataStats() {
    try {
      const [salesCount, expensesCount, productsCount, notesCount] = await Promise.all([
        offlineDB.getCount('sales'),
        offlineDB.getCount('expenses'),
        offlineDB.getCount('products'),
        offlineDB.getCount('notes')
      ]);

      return {
        sales: salesCount,
        expenses: expensesCount,
        products: productsCount,
        notes: notesCount,
        total: salesCount + expensesCount + productsCount + notesCount
      };
    } catch (error) {
      return { sales: 0, expenses: 0, products: 0, notes: 0, total: 0 };
    }
  }
}

// Export singleton instance
export const offlineDataInitService = new OfflineDataInitService();

// Auto-initialize when imported (but don't block)
offlineDataInitService.initializeOfflineData().catch(console.warn);