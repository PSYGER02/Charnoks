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
   * Ensure user profiles are synced to IndexedDB for offline worker name resolution
   */
  async syncUserProfiles(): Promise<void> {
    await this.init();
    
    if (connectionService.online) {
      try {
        console.log('📊 Syncing user profiles to IndexedDB...');
        
        // Get all user profiles from Supabase
        const { data: profiles, error } = await supabase
          .from('user_profiles')
          .select('id, display_name, email, role, is_active, created_at, updated_at')
          .eq('is_active', true);

        if (!error && profiles) {
          console.log('📊 Found', profiles.length, 'user profiles to sync');
          
          // Clear existing profiles and add fresh ones
          await offlineDB.clearTable('user_profiles');
          
          for (const profile of profiles) {
            await offlineDB.upsert('user_profiles', {
              ...profile,
              local_uuid: profile.id, // Use user ID as local_uuid for profiles
              sync_status: 'synced'
            });
          }
          
          console.log('📊 User profiles synced to IndexedDB successfully');
        }
      } catch (error) {
        console.warn('📊 Failed to sync user profiles:', error);
      }
    }
  }

  /**
   * Initialize the unified service with user profile sync
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;
    
    await offlineDB.init();
    this.isInitialized = true;
    console.log('🎯 Unified Data Service initialized');
    
    // Sync user profiles on initialization if online
    if (connectionService.online) {
      this.syncUserProfiles().catch(console.warn);
    }
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
      
      // ALWAYS get fresh worker name from user_profiles - don't trust passed worker_name
      let workerName = 'Unknown Worker'; // Default fallback
      const workerId = expenseData.worker_id;
      
      if (workerId) {
        try {
          // Try online lookup first
          if (connectionService.online) {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('display_name, email')
              .eq('id', workerId)
              .single();
            
            if (profile) {
              workerName = profile.display_name || profile.email?.split('@')[0] || 'Unknown Worker';
            }
          } else {
            // Fallback to offline lookup in IndexedDB
            const localProfiles = await offlineDB.getAll('user_profiles');
            const profile = localProfiles.find((p: any) => p.id === workerId);
            if (profile) {
              workerName = profile.display_name || profile.email?.split('@')[0] || 'Unknown Worker';
            }
          }
        } catch (error) {
          console.warn('Could not fetch worker name for ID:', workerId, error);
          // Keep default fallback
        }
      }
      
      const expenseRecord = {
        ...expenseData,
        worker_name: workerName, // Ensure worker name is included
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
        console.log('💾 Saving expense to Supabase (online mode)');
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
          console.warn('💾 Supabase save failed, falling back to offline:', error);
        }
      } else {
        console.log('💾 System detected as offline, saving to IndexedDB');
      }

      // Save offline (either we're offline or Supabase failed)
      console.log('💾 Saving expense to IndexedDB');
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

    console.log('📊 Getting expenses, connection status:', connectionService.online);

    if (connectionService.online) {
      console.log('📊 Fetching expenses from Supabase (online)');
      try {
        // Get fresh data from Supabase when online
        const { data, error } = await supabase
          .from('expenses')
          .select('id, description, amount, category, worker_id, workers_id, worker_name, created_at, updated_at')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && data) {
          console.log('📊 Found', data.length, 'expenses from Supabase');
          console.log('📊 Raw expense data sample:', data.slice(0, 5).map((e: any) => ({
            id: e.id,
            worker_id: e.worker_id,
            workers_id: e.workers_id, // Check if this field exists
            worker_name: e.worker_name,
            description: e.description,
            created_at: e.created_at,
            // Show all fields to debug
            allFields: Object.keys(e)
          })));
          
          // Check for expenses with missing worker data
          const missingWorkerData = data.filter((e: any) => !e.worker_id && !e.workers_id);
          if (missingWorkerData.length > 0) {
            console.warn('📊 Found', missingWorkerData.length, 'expenses with missing worker_id/workers_id:', 
              missingWorkerData.slice(0, 3).map((e: any) => ({
                id: e.id,
                worker_id: e.worker_id,
                workers_id: e.workers_id,
                worker_name: e.worker_name,
                description: e.description
              }))
            );
          }
          
          // Get all unique worker IDs for batch lookup (check both field names)
          const workerIds = [...new Set(
            data.map((e: any) => e.worker_id || e.workers_id)
                .filter((id: any) => id && typeof id === 'string' && id.trim() !== '')
          )] as string[];
          console.log('📊 Looking up display names for worker IDs:', workerIds);
          
          // Batch lookup user display names
          const userDisplayNames = await this.getUserDisplayNames(workerIds);
          console.log('📊 Resolved user display names:', userDisplayNames);
          
          // Transform data to match expected format with resolved names
          const transformedData = data.map((expense: any) => {
            // Check both possible field names
            const workerId = expense.worker_id || expense.workers_id || '';
            const resolvedName = workerId ? userDisplayNames[workerId] : null;
            
            return {
              id: expense.id,
              date: expense.created_at,
              description: expense.description,
              amount: expense.amount,
              workerId: workerId,
              workerName: resolvedName || expense.worker_name || 'Unknown Worker'
            };
          });

          console.log('📊 Transformed data sample:', transformedData.slice(0, 2).map((e: any) => ({
            id: e.id,
            workerId: e.workerId,
            workerName: e.workerName,
            description: e.description
          })));

          // Update local cache in background
          this._updateCache('expenses', data).catch(console.warn);
          return transformedData;
        }
      } catch (error) {
        console.warn('📊 Failed to fetch expenses from Supabase:', error);
      }
    } else {
      console.log('📊 System offline, using IndexedDB data');
    }

    // Fallback to local data with transformation
    console.log('📊 Fetching expenses from IndexedDB (fallback)');
    const localExpenses = await offlineDB.getAll('expenses');
    console.log('📊 Found', localExpenses.length, 'expenses from IndexedDB');
    
    // Get all unique worker IDs for batch lookup
    const workerIds = [...new Set(localExpenses.map((e: any) => e.worker_id || e.workerId).filter(Boolean))];
    console.log('📊 Looking up display names for worker IDs (offline):', workerIds);
    
    // Batch lookup user display names (offline)
    const userDisplayNames = await this.getUserDisplayNames(workerIds);
    console.log('📊 Resolved user display names (offline):', userDisplayNames);
    
    return localExpenses.slice(0, limit).map((expense: any) => {
      const workerId = expense.worker_id || expense.workerId || '';
      const resolvedName = workerId ? userDisplayNames[workerId] : null;
      
      return {
        id: expense.id,
        date: expense.created_at || expense.date,
        description: expense.description,
        amount: expense.amount,
        workerId: workerId,
        workerName: resolvedName || expense.worker_name || expense.workerName || 'Unknown Worker'
      };
    });
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
          const { error } = await supabase
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
          const { error } = await supabase
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

  // ============================================================================
  // WORKER OPERATIONS
  // ============================================================================

  /**
   * Universal user lookup - finds any user by ID and returns display name
   * Works for both online (Supabase) and offline (IndexedDB) modes
   */
  async getUserDisplayName(userId: string): Promise<string | null> {
    if (!userId || userId.trim() === '') return null;
    
    await this.init();

    // Try online lookup first
    if (connectionService.online) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('display_name, email')
          .eq('id', userId)
          .single();

        if (!error && data) {
          return data.display_name || data.email?.split('@')[0] || null;
        }
      } catch (error) {
        console.warn('Failed to lookup user online:', error);
      }
    }

    // Fallback to offline lookup
    try {
      const localProfiles = await offlineDB.getAll('user_profiles');
      const profile = localProfiles.find((p: any) => p.id === userId);
      if (profile) {
        return profile.display_name || profile.email?.split('@')[0] || null;
      }
    } catch (error) {
      console.warn('Failed to lookup user offline:', error);
    }

    return null;
  }

  /**
   * Batch user lookup for multiple user IDs
   */
  async getUserDisplayNames(userIds: string[]): Promise<Record<string, string>> {
    const uniqueIds = [...new Set(userIds.filter(id => id && id.trim() !== ''))];
    const result: Record<string, string> = {};

    if (uniqueIds.length === 0) return result;

    await this.init();

    // Try online lookup first
    if (connectionService.online) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, display_name, email')
          .in('id', uniqueIds);

        if (!error && data) {
          data.forEach((user: any) => {
            result[user.id] = user.display_name || user.email?.split('@')[0] || 'Unknown User';
          });
          
          // Return if we found all users
          if (Object.keys(result).length === uniqueIds.length) {
            return result;
          }
        }
      } catch (error) {
        console.warn('Failed to batch lookup users online:', error);
      }
    }

    // Fallback to offline lookup for missing users
    try {
      const localProfiles = await offlineDB.getAll('user_profiles');
      uniqueIds.forEach(userId => {
        if (!result[userId]) {
          const profile = localProfiles.find((p: any) => p.id === userId);
          if (profile) {
            result[userId] = profile.display_name || profile.email?.split('@')[0] || 'Unknown User';
          } else {
            result[userId] = 'Unknown User';
          }
        }
      });
    } catch (error) {
      console.warn('Failed to batch lookup users offline:', error);
      // Fill remaining with default
      uniqueIds.forEach(userId => {
        if (!result[userId]) {
          result[userId] = 'Unknown User';
        }
      });
    }

    return result;
  }
  async getWorkers(): Promise<any[]> {
    await this.init();

    console.log('👥 Getting workers, connection status:', connectionService.online);

    if (connectionService.online) {
      console.log('👥 Fetching workers from Supabase (online)');
      try {
        // Get fresh data from Supabase when online
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, display_name, email, is_active, role')
          .eq('is_active', true)
          .order('display_name');

        if (!error && data) {
          console.log('👥 Found', data.length, 'user profiles from Supabase');
          
          const workers = data.map((w: any) => ({
            id: w.id,
            name: w.display_name || w.email?.split('@')[0] || 'Worker',
            email: w.email,
            isActive: w.is_active,
            role: w.role
          }));

          // Update local cache in background
          this._updateCache('user_profiles', data).catch(console.warn);
          return workers;
        }
      } catch (error) {
        console.warn('👥 Failed to fetch workers from Supabase:', error);
      }
    } else {
      console.log('👥 System offline, using IndexedDB data');
    }

    // Fallback to local data
    console.log('👥 Fetching workers from IndexedDB (fallback)');
    const localProfiles = await offlineDB.getAll('user_profiles');
    console.log('👥 Found', localProfiles.length, 'user profiles from IndexedDB');
    
    return localProfiles
      .filter((profile: any) => profile.is_active !== false)
      .map((w: any) => ({
        id: w.id,
        name: w.display_name || w.email?.split('@')[0] || 'Worker',
        email: w.email,
        isActive: w.is_active !== false,
        role: w.role
      }));
  }
}

// Export singleton instance
export const unifiedDataService = new UnifiedDataService();

// Backward compatibility exports
export const saveExpenseUnified = (data: any) => unifiedDataService.saveExpense(data);
export const saveSaleUnified = (data: any) => unifiedDataService.saveSale(data);
export const getExpensesUnified = (limit?: number) => unifiedDataService.getExpenses(limit);
export const getSalesUnified = (limit?: number) => unifiedDataService.getSales(limit);
export const getWorkersUnified = () => unifiedDataService.getWorkers();
export const getUserDisplayNameUnified = (userId: string) => unifiedDataService.getUserDisplayName(userId);
export const getUserDisplayNamesUnified = (userIds: string[]) => unifiedDataService.getUserDisplayNames(userIds);