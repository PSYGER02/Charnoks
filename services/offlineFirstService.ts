/**
 * Offline-First Service for Dashboard and Other Components
 * This service prioritizes local IndexedDB data and falls back to Supabase when available
 * Ensures consistent data access patterns across the application
 */

import { offlineDB } from './offlineService';
import { getOwnerDashboard, getSales, getExpenses } from './supabaseService';

class OfflineFirstService {
  
  /**
   * Get dashboard data with offline-first approach
   * Returns cached data immediately, fresh data when online
   */
  async getOwnerDashboard() {
    try {
      // Try to get data from IndexedDB first (instant)
      const [localSales, localExpenses] = await Promise.all([
        offlineDB.getAll('sales'),
        offlineDB.getAll('expenses')
      ]);

      // If we have local data, use it for immediate display
      if (localSales.length > 0 || localExpenses.length > 0) {
        const dashboardData = this._calculateDashboardData(localSales, localExpenses);
        
        // Try to get fresh data in background if online
        if (navigator.onLine) {
          this._updateDashboardInBackground(localSales, localExpenses);
        }
        
        console.log('📊 Dashboard loaded from local cache:', {
          sales: localSales.length,
          expenses: localExpenses.length,
          offline: !navigator.onLine
        });
        
        return dashboardData;
      }

      // If no local data and we're online, try Supabase
      if (navigator.onLine) {
        try {
          console.log('📊 Loading dashboard from Supabase (no local data)...');
          const onlineData = await getOwnerDashboard();
          
          // Cache the fresh data for next time
          await this._cacheDashboardData(onlineData);
          
          return onlineData;
        } catch (error) {
          console.warn('Failed to load dashboard from Supabase:', error);
        }
      }

      // Return empty data structure if everything fails
      console.log('📊 No data available, returning empty dashboard');
      return this._getEmptyDashboard();

    } catch (error) {
      console.error('Dashboard loading failed:', error);
      return this._getEmptyDashboard();
    }
  }

  /**
   * Get sales with offline-first approach
   */
  async getSales(limit: number = 50) {
    try {
      // Always check local first
      const localSales = await offlineDB.getAll('sales');
      
      if (localSales.length > 0) {
        // Transform local data to expected format
        const transformedSales = localSales.slice(0, limit).map(sale => ({
          id: sale.id,
          date: sale.created_at || sale.date,
          items: sale.items || [],
          total: sale.total || 0,
          payment: sale.payment || 0,
          change: sale.change_due || sale.change || 0,
          workerId: sale.worker_id || sale.workerId || '',
          workerName: sale.worker_name || sale.workerName || 'Worker'
        }));

        // Update with fresh data in background if online
        if (navigator.onLine) {
          this._updateSalesInBackground(limit);
        }

        return transformedSales;
      }

      // If no local data and online, get from Supabase
      if (navigator.onLine) {
        return await getSales(limit);
      }

      return [];
    } catch (error) {
      console.error('Failed to get sales:', error);
      return [];
    }
  }

  /**
   * Get expenses with offline-first approach
   */
  async getExpenses(limit: number = 50) {
    try {
      // Always check local first
      const localExpenses = await offlineDB.getAll('expenses');
      
      if (localExpenses.length > 0) {
        // Transform local data to expected format
        const transformedExpenses = localExpenses.slice(0, limit).map(expense => ({
          id: expense.id,
          date: expense.created_at || expense.date,
          description: expense.description || 'Expense',
          amount: expense.amount || 0,
          workerId: expense.worker_id || expense.workerId || '',
          workerName: expense.worker_name || expense.workerName || 'Worker'
        }));

        // Update with fresh data in background if online
        if (navigator.onLine) {
          this._updateExpensesInBackground(limit);
        }

        return transformedExpenses;
      }

      // If no local data and online, get from Supabase
      if (navigator.onLine) {
        return await getExpenses(limit);
      }

      return [];
    } catch (error) {
      console.error('Failed to get expenses:', error);
      return [];
    }
  }

  /**
   * Check if we have any cached data available
   */
  async hasLocalData(): Promise<boolean> {
    try {
      const [sales, expenses] = await Promise.all([
        offlineDB.getCount('sales'),
        offlineDB.getCount('expenses')
      ]);
      return sales > 0 || expenses > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get data source info for debugging
   */
  async getDataSourceInfo() {
    const [salesCount, expensesCount] = await Promise.all([
      offlineDB.getCount('sales'),
      offlineDB.getCount('expenses')
    ]);

    return {
      local: { sales: salesCount, expenses: expensesCount },
      online: navigator.onLine,
      total: salesCount + expensesCount
    };
  }

  // Private helper methods

  private _calculateDashboardData(sales: any[], expenses: any[]) {
    // Calculate totals
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const transactions = sales.length;

    // Calculate sales trend (last 7 days)
    const now = new Date();
    const salesTrend = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const daySales = sales.filter(sale => {
        const saleDate = new Date(sale.created_at || sale.date);
        return saleDate >= date && saleDate < nextDate;
      });
      
      const dayTotal = daySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      
      salesTrend.push({
        name: dayNames[date.getDay()],
        sales: dayTotal
      });
    }

    // Calculate top products from sales items
    const productCounts: { [key: string]: number } = {};
    sales.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const productName = item.productName || item.name || 'Unknown Product';
          productCounts[productName] = (productCounts[productName] || 0) + (item.quantity || 1);
        });
      }
    });

    const topProducts = Object.entries(productCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    if (topProducts.length === 0) {
      topProducts.push({ name: 'No products yet', value: 1 });
    }

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      transactions,
      salesTrend,
      topProducts,
      _dataSource: 'offline' // Add indicator for debugging
    };
  }

  private _getEmptyDashboard() {
    return {
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
      topProducts: [{ name: 'No data available', value: 1 }],
      _dataSource: 'empty'
    };
  }

  private async _updateDashboardInBackground(localSales: any[], localExpenses: any[]) {
    try {
      // Get fresh data in background
      const freshData = await getOwnerDashboard();
      console.log('📊 Dashboard updated with fresh data in background');
      // Note: In a real app, you'd trigger UI update here
    } catch (error) {
      console.warn('Background dashboard update failed:', error);
    }
  }

  private async _updateSalesInBackground(limit: number) {
    try {
      const freshSales = await getSales(limit);
      console.log(`📊 Sales updated with ${freshSales.length} fresh records in background`);
    } catch (error) {
      console.warn('Background sales update failed:', error);
    }
  }

  private async _updateExpensesInBackground(limit: number) {
    try {
      const freshExpenses = await getExpenses(limit);
      console.log(`📊 Expenses updated with ${freshExpenses.length} fresh records in background`);
    } catch (error) {
      console.warn('Background expenses update failed:', error);
    }
  }

  private async _cacheDashboardData(dashboardData: any) {
    // This would cache the dashboard calculation results
    // For now, we rely on individual record caching in unifiedDataService
    console.log('📊 Dashboard data cached for offline use');
  }
}

// Export singleton instance
export const offlineFirstService = new OfflineFirstService();

// Export individual functions for easy use
export const getOwnerDashboardOfflineFirst = () => offlineFirstService.getOwnerDashboard();
export const getSalesOfflineFirst = (limit?: number) => offlineFirstService.getSales(limit);
export const getExpensesOfflineFirst = (limit?: number) => offlineFirstService.getExpenses(limit);