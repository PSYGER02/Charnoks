/**
 * Unified Data Service - Single Source of Truth
 * Handles all data operations with proper deduplication and sync management
 * Replaces scattered save/load logic with centralized system
 */

import { connectionService } from './connectionService';
import { offlineDB } from './offlineService';
import { supabase } from '../src/supabaseConfig';
import type { Sale, Expense } from '../types';

class UnifiedDataService {
  private isInitialized = false;
  private syncInProgress = false;

  /**
   * Initialize the unified service
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;
    
    await offlineDB.init();
    this.isInitialized = true;
    console.log('🎯 Unified Data Service initialized');
  }

  // ============================================================================
  // SALES OPERATIONS
  // ============================================================================

  /**
   * Save a sale - handles online/offline automatically
   */
  async saveSale(saleData: any): Promise<{ success: boolean; id?: string; offline?: boolean }> {
    await this.init();
    
    try {
      // Generate consistent local_uuid
      const localUuid = saleData.local_uuid || crypto.randomUUID();
      const saleRecord = {
        ...saleData,
        local_uuid: localUuid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (connectionService.online) {
        try {
          // Save to Supabase first when online
          const { data, error } = await supabase
            .from('sales')
            .insert(saleRecord)
            .select()
            .single();

          if (error) throw error;

          // Mark as synced in local storage
          await offlineDB.upsert('sales', {
            ...data,
            local_uuid: localUuid,
            sync_status: 'synced'
          });

          return { success: true, id: data.id };
        } catch (error) {
          // Fallback to offline if Supabase fails
          console.warn('Supabase save failed, saving offline:', error);
        }
      }

      // Save offline (either we're offline or Supabase failed)
      const result = await offlineDB.save('sales', {
        ...saleRecord,
        sync_status: 'pending'
      });

      return { success: true, id: result as string, offline: true };

    } catch (error) {
      console.error('Failed to save sale:', error);
      return { success: false };
    }
  }

  /**
   * Get sales with smart loading and proper data transformation
   */
  async getSales(limit: number = 50): Promise<Sale[]> {
    await this.init();

    if (connectionService.online) {
      try {
        // Get fresh data from Supabase when online
        const { data, error } = await supabase
          .from('sales')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && data) {
          // Transform data to match expected format
          const transformedData = data.map((sale: any) => ({
            id: sale.id,
            date: sale.created_at,
            items: sale.items || [],
            total: sale.total,
            payment: sale.payment,
            change: sale.change_due,
            workerId: sale.worker_id || '',
            workerName: sale.worker_name || 'Worker'
          }));

          // Update local cache in background
          this._updateCache('sales', data).catch(console.warn);
          return transformedData;
        }
      } catch (error) {
        console.warn('Failed to fetch sales from Supabase:', error);
      }
    }

    // Fallback to local data with transformation
    const localSales = await offlineDB.getAll('sales');
    return localSales.slice(0, limit).map((sale: any) => ({
      id: sale.id,
      date: sale.created_at || sale.date,
      items: sale.items || [],
      total: sale.total,
      payment: sale.payment,
      change: sale.change_due || sale.change,
      workerId: sale.worker_id || sale.workerId || '',
      workerName: sale.worker_name || sale.workerName || 'Worker'
    }));
  }

  // ============================================================================
  // EXPENSE OPERATIONS
  // ============================================================================

  /**
   * Save an expense - handles online/offline automatically with deduplication
   */
  async saveExpense(expenseData: any): Promise<{ success: boolean; id?: string; offline?: boolean }> {
    await this.init();
    
    try {
      // Generate consistent local_uuid
      const localUuid = expenseData.local_uuid || crypto.randomUUID();
      const expenseRecord = {
        ...expenseData,
        local_uuid: localUuid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Check for duplicates first
      const existingExpenses = await offlineDB.getAll('expenses');
      const duplicate = existingExpenses.find(exp => 
        exp.description === expenseRecord.description &&
        exp.amount === expenseRecord.amount &&
        Math.abs(new Date(exp.created_at).getTime() - new Date(expenseRecord.created_at).getTime()) < 60000 // Within 1 minute
      );

      if (duplicate) {
        console.warn('Duplicate expense detected, skipping save');
        return { success: true, id: duplicate.id };
      }

      if (connectionService.online) {
        try {
          // Save to Supabase first when online
          const { data, error } = await supabase
            .from('expenses')
            .insert(expenseRecord)
            .select()
            .single();

          if (error) throw error;

          // Mark as synced in local storage
          await offlineDB.upsert('expenses', {
            ...data,
            local_uuid: localUuid,
            sync_status: 'synced'
          });

          return { success: true, id: data.id };
        } catch (error) {
          // Fallback to offline if Supabase fails
          console.warn('Supabase save failed, saving offline:', error);
        }
      }

      // Save offline (either we're offline or Supabase failed)
      const result = await offlineDB.save('expenses', {
        ...expenseRecord,
        sync_status: 'pending'
      });

      return { success: true, id: result as string, offline: true };

    } catch (error) {
      console.error('Failed to save expense:', error);
      return { success: false };
    }
  }

  /**
   * Get expenses with smart loading and proper data transformation
   */
  async getExpenses(limit: number = 50): Promise<Expense[]> {
    await this.init();

    if (connectionService.online) {
      try {
        // Get fresh data from Supabase when online
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && data) {
          // Transform data to match expected format
          const transformedData = data.map((expense: any) => ({
            id: expense.id,
            date: expense.created_at,
            description: expense.description,
            amount: expense.amount,
            workerId: expense.worker_id || '',
            workerName: expense.worker_name || null // Don't default to 'Worker', let UI handle lookup
          }));

          // Update local cache in background
          this._updateCache('expenses', data).catch(console.warn);
          return transformedData;
        }
      } catch (error) {
        console.warn('Failed to fetch expenses from Supabase:', error);
      }
    }

    // Fallback to local data with transformation
    const localExpenses = await offlineDB.getAll('expenses');
    return localExpenses.slice(0, limit).map((expense: any) => ({
      id: expense.id,
      date: expense.created_at || expense.date,
      description: expense.description,
      amount: expense.amount,
      workerId: expense.worker_id || expense.workerId || '',
      workerName: expense.worker_name || expense.workerName || null // Don't default, let UI handle lookup
    }));
  }

  // ============================================================================
  // SYNC AND CACHE MANAGEMENT
  // ============================================================================

  /**
   * Sync pending data to Supabase
   */
  async syncPendingData(): Promise<{ success: boolean; synced: number; errors: number }> {
    if (!connectionService.online || this.syncInProgress) {
      return { success: false, synced: 0, errors: 0 };
    }

    this.syncInProgress = true;
    let synced = 0;
    let errors = 0;

    try {
      const tables = ['sales', 'expenses'];
      
      for (const table of tables) {
        const pending = await offlineDB.getPending(table);
        
        for (const record of pending) {
          try {
            const { data, error } = await supabase
              .from(table)
              .upsert(record, { onConflict: 'local_uuid' })
              .select()
              .single();

            if (!error && data) {
              await offlineDB.markSynced(table, record.id);
              synced++;
            } else {
              errors++;
            }
          } catch (recordError) {
            errors++;
            console.warn(`Failed to sync ${table} record:`, recordError);
          }
        }
      }

      return { success: true, synced, errors };

    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Private method to update cache
   */
  private async _updateCache(tableName: string, data: any[]): Promise<void> {
    try {
      // Update cache with fresh data
      for (const record of data.slice(0, 50)) {
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

  /**
   * Sync pending changes to server (for smart sync service)
   */
  async syncPendingChanges(): Promise<void> {
    if (!connectionService.online) {
      throw new Error('Cannot sync - offline');
    }

    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }

    try {
      this.syncInProgress = true;
      console.log('🔄 Syncing pending changes...');

      // Get all pending records
      const [pendingSales, pendingExpenses] = await Promise.all([
        offlineDB.getPending('sales'),
        offlineDB.getPending('expenses')
      ]);

      console.log(`Found ${pendingSales.length} pending sales, ${pendingExpenses.length} pending expenses`);

      // Sync sales
      for (const sale of pendingSales) {
        try {
          const { data, error } = await supabase
            .from('sales')
            .insert([sale])
            .select()
            .single();

          if (error) throw error;

          // Mark as synced
          await offlineDB.markSynced('sales', sale.local_uuid);
          console.log(`✅ Synced sale ${sale.local_uuid}`);
        } catch (error) {
          console.warn(`Failed to sync sale ${sale.local_uuid}:`, error);
        }
      }

      // Sync expenses
      for (const expense of pendingExpenses) {
        try {
          const { data, error } = await supabase
            .from('expenses')
            .insert([expense])
            .select()
            .single();

          if (error) throw error;

          // Mark as synced
          await offlineDB.markSynced('expenses', expense.local_uuid);
          console.log(`✅ Synced expense ${expense.local_uuid}`);
        } catch (error) {
          console.warn(`Failed to sync expense ${expense.local_uuid}:`, error);
        }
      }

      console.log('✅ Pending changes sync completed');
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats() {
    const [salesPending, expensesPending, salesCount, expensesCount] = await Promise.all([
      offlineDB.getPending('sales').then(p => p.length),
      offlineDB.getPending('expenses').then(p => p.length),
      offlineDB.getCount('sales'),
      offlineDB.getCount('expenses')
    ]);

    return {
      pending: salesPending + expensesPending,
      local: salesCount + expensesCount,
      online: connectionService.online
    };
  }
}

// Export singleton instance
export const unifiedDataService = new UnifiedDataService();

// Backward compatibility exports
export const saveExpenseUnified = (data: any) => unifiedDataService.saveExpense(data);
export const saveSaleUnified = (data: any) => unifiedDataService.saveSale(data);
export const getExpensesUnified = (limit?: number) => unifiedDataService.getExpenses(limit);
export const getSalesUnified = (limit?: number) => unifiedDataService.getSales(limit);