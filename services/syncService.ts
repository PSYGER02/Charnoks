import { aiAgent } from './AIAgentService';
import { offlineDB } from './offlineService';

class SyncService {
  private syncInterval: NodeJS.Timeout | null = null;

  async start() {
    // Initialize IndexedDB
    await offlineDB.init();
    
    // Sync immediately
    await this.sync();
    
    // Set up periodic sync every 30 seconds
    this.syncInterval = setInterval(() => this.sync(), 30000);
    
    // Sync when coming back online
    window.addEventListener('online', () => this.sync());
  }

  private async sync() {
    if (!navigator.onLine) return;
    
    try {
      await aiAgent.syncPendingData();
    } catch (error) {
      console.warn('Background sync failed:', error);
    }
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const syncService = new SyncService();