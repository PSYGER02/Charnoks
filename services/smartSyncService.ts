import { connectionService } from './connectionService';
import { unifiedDataService } from './unifiedDataService';

/**
 * Smart sync service that only syncs when connection is stable
 * and prevents conflicts with the unified data service
 */
class SmartSyncService {
    private syncInProgress = false;
    private lastSyncTime = 0;
    private readonly SYNC_COOLDOWN = 30000; // 30 seconds between syncs
    private readonly CONNECTION_STABLE_DELAY = 10000; // Wait 10s for stable connection
    private connectionStableTimeout: NodeJS.Timeout | null = null;

    constructor() {
        this.setupConnectionListener();
    }

    private setupConnectionListener() {
        connectionService.onStatusChange(async (isOnline) => {
            if (isOnline) {
                // Wait for connection to stabilize before syncing
                this.scheduleStableSync();
            } else {
                // Cancel any pending sync when offline
                this.cancelPendingSync();
            }
        });
    }

    private scheduleStableSync() {
        // Cancel any existing timeout
        this.cancelPendingSync();
        
        // Wait for connection to be stable
        this.connectionStableTimeout = setTimeout(() => {
            this.attemptSync();
        }, this.CONNECTION_STABLE_DELAY);
    }

    private cancelPendingSync() {
        if (this.connectionStableTimeout) {
            clearTimeout(this.connectionStableTimeout);
            this.connectionStableTimeout = null;
        }
    }

    private async attemptSync() {
        // Don't sync if already in progress
        if (this.syncInProgress) {
            console.log('⏳ Sync already in progress, skipping...');
            return;
        }

        // Don't sync too frequently
        const now = Date.now();
        if (now - this.lastSyncTime < this.SYNC_COOLDOWN) {
            console.log('⏰ Sync cooldown active, skipping...');
            return;
        }

        // Double-check connection is still stable
        if (!connectionService.online) {
            console.log('📡 Connection lost, canceling sync');
            return;
        }

        try {
            this.syncInProgress = true;
            this.lastSyncTime = now;
            
            console.log('🔄 Starting smart sync...');
            
            // Use unified service to sync data
            await this.performSync();
            
            console.log('✅ Smart sync completed successfully');
            
        } catch (error) {
            console.warn('❌ Smart sync failed:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    private async performSync() {
        // Only sync if we have a stable connection
        if (!connectionService.online) {
            throw new Error('Connection lost during sync');
        }

        // Sync through unified service to prevent conflicts
        // This ensures data goes through proper transformation
        await unifiedDataService.syncPendingChanges();
    }

    /**
     * Manual sync trigger (for user-initiated refresh)
     */
    async forcSync(): Promise<boolean> {
        if (!connectionService.online) {
            console.warn('Cannot force sync - offline');
            return false;
        }

        try {
            await this.attemptSync();
            return true;
        } catch (error) {
            console.error('Force sync failed:', error);
            return false;
        }
    }

    /**
     * Get sync status
     */
    getStatus() {
        return {
            inProgress: this.syncInProgress,
            lastSync: new Date(this.lastSyncTime),
            isOnline: connectionService.online,
            pendingSync: this.connectionStableTimeout !== null
        };
    }

    /**
     * Start the smart sync service
     */
    start() {
        console.log('🚀 Smart sync service started');
        
        // If already online, schedule initial sync
        if (connectionService.online) {
            this.scheduleStableSync();
        }
    }

    /**
     * Stop the smart sync service
     */
    stop() {
        this.cancelPendingSync();
        console.log('⏹️ Smart sync service stopped');
    }
}

export const smartSyncService = new SmartSyncService();