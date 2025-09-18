// Smart save service - auto-detects online/offline
import { connectionService } from './connectionService';
import { offlineDB } from './offlineService';
import { recordSale, recordExpense } from './supabaseService';

class SmartSaveService {
  // Smart expense save - auto-detects connection
  async saveExpense(expenseData: any): Promise<{ success: boolean; offline?: boolean; error?: string }> {
    try {
      if (connectionService.online) {
        // Online: Save directly to Supabase
        await recordExpense(expenseData);
        return { success: true };
      } else {
        // Offline: Save to IndexedDB for later sync
        await offlineDB.save('expenses', expenseData);
        return { success: true, offline: true };
      }
    } catch (error) {
      // Fallback to offline if Supabase fails
      try {
        await offlineDB.save('expenses', expenseData);
        return { success: true, offline: true };
      } catch (offlineError) {
        return { success: false, error: String(error) };
      }
    }
  }

  // Smart sale save - auto-detects connection
  async saveSale(saleData: any): Promise<{ success: boolean; offline?: boolean; error?: string }> {
    try {
      if (connectionService.online) {
        // Online: Save directly to Supabase
        await recordSale(saleData);
        return { success: true };
      } else {
        // Offline: Save to IndexedDB for later sync
        await offlineDB.save('sales', saleData);
        return { success: true, offline: true };
      }
    } catch (error) {
      // Fallback to offline if Supabase fails
      try {
        await offlineDB.save('sales', saleData);
        return { success: true, offline: true };
      } catch (offlineError) {
        return { success: false, error: String(error) };
      }
    }
  }

  // Smart note save
  async saveNote(noteData: any): Promise<{ success: boolean; offline?: boolean; error?: string }> {
    try {
      if (connectionService.online) {
        const { addNote } = await import('./supabaseService');
        await addNote(noteData);
        return { success: true };
      } else {
        await offlineDB.save('notes', noteData);
        return { success: true, offline: true };
      }
    } catch (error) {
      try {
        await offlineDB.save('notes', noteData);
        return { success: true, offline: true };
      } catch (offlineError) {
        return { success: false, error: String(error) };
      }
    }
  }

  // Get connection status
  get isOnline(): boolean {
    return connectionService.online;
  }

  // Listen to connection changes
  onConnectionChange(callback: (online: boolean) => void) {
    return connectionService.onStatusChange(callback);
  }
}

export const smartSaveService = new SmartSaveService();