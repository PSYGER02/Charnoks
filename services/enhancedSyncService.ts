import { aiAgent } from './AIAgentService';
import { offlineDB } from './offlineService';
import { supabase } from '../src/supabaseConfig';

class EnhancedSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isInitialSyncComplete = false;
  private readonly SYNC_INTERVAL = 30000; // 30 seconds
  private readonly SYNC_TABLES = [
    'notes', 'sales', 'expenses', 'products', 'user_profiles',
    'operations', 'lots', 'branches', 'owners', 'ai_analysis',
    'ai_conversations', 'branch_stock', 'summaries'
  ];

  async start() {
    console.log('🔄 Starting enhanced sync service...');
    
    try {
      // Initialize IndexedDB
      await offlineDB.init();
      console.log('✅ IndexedDB initialized');

      // Perform initial sync if needed
      if (!this.isInitialSyncComplete) {
        await this.performInitialSync();
        this.isInitialSyncComplete = true;
      }

      // Start incremental sync loop
      await this.performIncrementalSync();
      
      // Set up periodic sync every 30 seconds
      this.syncInterval = setInterval(() => this.performIncrementalSync(), this.SYNC_INTERVAL);
      
      // Sync when coming back online
      window.addEventListener('online', () => this.performIncrementalSync());
      
      console.log('✅ Enhanced sync service started');
    } catch (error) {
      console.error('❌ Failed to start sync service:', error);
    }
  }

  // STEP 1: Initial Pull (first time sync)
  async performInitialSync() {
    if (!navigator.onLine) {
      console.log('⚠️ Offline - skipping initial sync');
      return;
    }

    console.log('🔄 Performing initial sync...');

    try {
      for (const tableName of this.SYNC_TABLES) {
        await this.initialPullTable(tableName);
      }
      
      // Set initial sync timestamp
      await offlineDB.setLastSyncTimestamp(new Date().toISOString());
      console.log('✅ Initial sync completed');
    } catch (error) {
      console.error('❌ Initial sync failed:', error);
    }
  }

  private async initialPullTable(tableName: string) {
    try {
      console.log(`📥 Initial pull: ${tableName}`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('deleted', false) // Only pull non-deleted records
        .order('updated_at', { ascending: true })
        .limit(1000); // Limit for performance

      if (error) {
        console.warn(`⚠️ Failed to pull ${tableName}:`, error.message);
        return;
      }

      if (!data || data.length === 0) {
        console.log(`📭 No data in ${tableName}`);
        return;
      }

      // Clear local table and insert remote data
      await offlineDB.clearTable(tableName);
      
      for (const record of data) {
        await offlineDB.upsert(tableName, record);
      }

      console.log(`✅ Synced ${data.length} records from ${tableName}`);
    } catch (error) {
      console.warn(`⚠️ Failed to sync table ${tableName}:`, error);
    }
  }

  // STEP 2: Incremental Pull + Push (ongoing sync)
  async performIncrementalSync() {
    if (!navigator.onLine) {
      console.log('📴 Offline - sync will resume when online');
      return;
    }

    try {
      // Step 1: Pull remote changes since last sync
      await this.incrementalPull();
      
      // Step 2: Push local pending changes
      await this.pushPendingChanges();
      
      // Step 3: Process any pending AI operations
      await this.processPendingAI();
      
    } catch (error) {
      console.warn('⚠️ Incremental sync failed:', error);
    }
  }

  // Pull changes from server since last sync
  private async incrementalPull() {
    const lastSyncTimestamp = await offlineDB.getLastSyncTimestamp();
    if (!lastSyncTimestamp) {
      console.log('📭 No previous sync timestamp - performing initial sync');
      await this.performInitialSync();
      return;
    }

    console.log(`📥 Pulling changes since ${lastSyncTimestamp}`);

    for (const tableName of this.SYNC_TABLES) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .gt('updated_at', lastSyncTimestamp)
          .order('updated_at', { ascending: true })
          .limit(100);

        if (error) {
          console.warn(`⚠️ Failed to pull changes for ${tableName}:`, error.message);
          continue;
        }

        if (data && data.length > 0) {
          console.log(`📥 Pulled ${data.length} changes from ${tableName}`);
          
          for (const record of data) {
            if (record.deleted) {
              // Handle remote deletion
              await this.handleRemoteDeletion(tableName, record);
            } else {
              // Handle remote update/insert
              await offlineDB.upsert(tableName, record);
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to pull ${tableName}:`, error);
      }
    }

    // Update last sync timestamp
    await offlineDB.setLastSyncTimestamp(new Date().toISOString());
  }

  // Push local pending changes to server
  private async pushPendingChanges() {
    console.log('📤 Pushing pending changes...');

    for (const tableName of this.SYNC_TABLES) {
      try {
        const pendingRecords = await offlineDB.getPending(tableName);
        
        if (pendingRecords.length === 0) continue;
        
        console.log(`📤 Pushing ${pendingRecords.length} pending changes for ${tableName}`);

        for (const record of pendingRecords) {
          await this.pushSingleRecord(tableName, record);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to push changes for ${tableName}:`, error);
      }
    }
  }

  private async pushSingleRecord(tableName: string, record: any) {
    try {
      if (record.deleted) {
        // Handle deletion
        const { error } = await supabase
          .from(tableName)
          .update({ deleted: true, updated_at: new Date().toISOString() })
          .eq('local_uuid', record.local_uuid);

        if (error) throw error;
      } else {
        // Handle insert/update using upsert
        const { error } = await supabase
          .from(tableName)
          .upsert(record, { 
            onConflict: 'local_uuid',
            ignoreDuplicates: false 
          });

        if (error) throw error;
      }

      // Mark as synced locally
      await offlineDB.markSynced(tableName, record.id);
      console.log(`✅ Synced ${tableName} record ${record.local_uuid}`);
      
    } catch (error) {
      console.warn(`⚠️ Failed to sync record ${record.local_uuid}:`, error);
      // Mark as failed for retry logic if needed
    }
  }

  private async handleRemoteDeletion(tableName: string, remoteRecord: any) {
    try {
      // Soft delete locally to match remote state
      if (remoteRecord.local_uuid) {
        await offlineDB.softDelete(tableName, remoteRecord.local_uuid);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to handle remote deletion:`, error);
    }
  }

  // Process AI operations (notes, embeddings, etc.)
  private async processPendingAI() {
    try {
      // Get pending notes that need AI processing
      const pendingNotes = await offlineDB.getPending('notes');
      const unprocessedNotes = pendingNotes.filter(note => 
        !note.parsed_data && note.content && note.content.trim().length > 10
      );

      if (unprocessedNotes.length === 0) return;

      console.log(`🤖 Processing ${unprocessedNotes.length} notes with AI...`);

      for (const note of unprocessedNotes.slice(0, 5)) { // Limit AI calls
        try {
          await aiAgent.processNote(note.content, note.user_role || 'owner');
        } catch (error) {
          console.warn(`⚠️ Failed to process note ${note.id}:`, error);
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to process pending AI operations:', error);
    }
  }

  // Manual sync trigger
  async forcePull() {
    console.log('🔄 Force pulling latest data...');
    await this.incrementalPull();
  }

  async forcePush() {
    console.log('🔄 Force pushing pending changes...');
    await this.pushPendingChanges();
  }

  // Complete sync cycle
  async forceSync() {
    console.log('🔄 Force syncing all data...');
    await this.performIncrementalSync();
  }

  // Get sync status
  async getSyncStatus() {
    const pendingCounts: Record<string, number> = {};
    
    for (const tableName of this.SYNC_TABLES) {
      try {
        const pending = await offlineDB.getPending(tableName);
        pendingCounts[tableName] = pending.length;
      } catch (error) {
        pendingCounts[tableName] = -1; // Error state
      }
    }

    const lastSync = await offlineDB.getLastSyncTimestamp();

    return {
      isOnline: navigator.onLine,
      lastSyncTimestamp: lastSync,
      pendingCounts,
      totalPending: Object.values(pendingCounts).reduce((sum, count) => sum + Math.max(0, count), 0),
      isInitialSyncComplete: this.isInitialSyncComplete
    };
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    console.log('🛑 Enhanced sync service stopped');
  }
}

export const enhancedSyncService = new EnhancedSyncService();
export { enhancedSyncService as syncService }; // Backward compatibility