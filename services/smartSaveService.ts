      // Smart save service - auto-detects online/offline
import { connectionService } from './connectionService';
import { offlineDB } from './offlineService';
import { recordSale, recordExpense, addNote } from './supabaseService';
import { supabase } from '../src/supabaseConfig';

class SmartSaveService {
  // Smart expense save - auto-detects connection
  async saveExpense(expenseData: any): Promise<{ success: boolean; offline?: boolean; error?: string }> {
    try {
      if (connectionService.online) {
        // Online: Save directly to Supabase
        await recordExpense(expenseData);
        return { success: true };
      } else {
        // Offline: Add worker info and save to IndexedDB for later sync
        const enrichedExpenseData = await this.addWorkerInfoToExpense(expenseData);
        await offlineDB.save('expenses', enrichedExpenseData);
        return { success: true, offline: true };
      }
    } catch (error) {
      // Fallback to offline if Supabase fails
      try {
        const enrichedExpenseData = await this.addWorkerInfoToExpense(expenseData);
        await offlineDB.save('expenses', enrichedExpenseData);
        return { success: true, offline: true };
      } catch (offlineError) {
        return { success: false, error: String(error) };
      }
    }
  }

  // Helper to add worker info like recordExpense() does - ALWAYS lookup fresh name
  private async addWorkerInfoToExpense(expenseData: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let workerName = 'Unknown Worker';
      
      // ALWAYS get fresh display name from user_profiles
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('display_name, email')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          workerName = profile.display_name || profile.email?.split('@')[0] || user.email?.split('@')[0] || 'Unknown Worker';
        } else {
          // Fallback to auth user email
          workerName = user.email?.split('@')[0] || 'Unknown Worker';
        }
      } catch (profileError) {
        console.warn('Could not fetch user profile, using auth email:', profileError);
        workerName = user.email?.split('@')[0] || 'Unknown Worker';
      }

      return {
        ...expenseData,
        worker_id: user.id,
        worker_name: workerName
      };
    } catch (error) {
      // If we can't get user info, use fallback
      return {
        ...expenseData,
        worker_id: 'offline_user',
        worker_name: 'Offline User'
      };
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
        // Offline: Add worker info and save to IndexedDB for later sync
        const enrichedSaleData = await this.addWorkerInfoToSale(saleData);
        await offlineDB.save('sales', enrichedSaleData);
        return { success: true, offline: true };
      }
    } catch (error) {
      // Fallback to offline if Supabase fails
      try {
        const enrichedSaleData = await this.addWorkerInfoToSale(saleData);
        await offlineDB.save('sales', enrichedSaleData);
        return { success: true, offline: true };
      } catch (offlineError) {
        return { success: false, error: String(error) };
      }
    }
  }

  // Helper to add worker info like recordSale() does
  private async addWorkerInfoToSale(saleData: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();
      
      const workerName = profile?.display_name || user.email?.split('@')[0] || 'User';

      return {
        ...saleData,
        worker_id: user.id,
        worker_name: workerName
      };
    } catch (error) {
      // If we can't get user info, use fallback
      return {
        ...saleData,
        worker_id: 'offline_user',
        worker_name: 'Offline User'
      };
    }
  }

  // Smart note save
  async saveNote(noteData: any): Promise<{ success: boolean; offline?: boolean; error?: string }> {
    try {
      if (connectionService.online) {
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