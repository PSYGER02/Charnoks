/**
 * Worker Branch Sync Service
 * Handles local_uuid synchronization between IndexedDB and Supabase
 * Sets up branch assignments for worker accounts
 */

import { supabase } from '../src/supabaseConfig';
import { offlineDB } from './offlineService';
import { connectionService } from './connectionService';

export class WorkerBranchSyncService {
  
  /**
   * Sync local_uuid from IndexedDB to Supabase user_profiles
   * This ensures workers have consistent local_uuid across offline/online
   */
  async syncWorkerLocalUuids(): Promise<{ success: boolean; synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      if (!connectionService.online) {
        throw new Error('Cannot sync - offline');
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get current user profile from Supabase
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, email, role, local_uuid, branch_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw new Error(`Failed to get user profile: ${profileError.message}`);
      }

      // Get local_uuid from IndexedDB if it exists
      let indexedDbLocalUuid: string | null = null;
      try {
        const localProfiles = await offlineDB.getAll('user_profiles');
        const localProfile = localProfiles.find(p => p.id === user.id || p.email === user.email);
        if (localProfile && localProfile.local_uuid) {
          indexedDbLocalUuid = localProfile.local_uuid;
        }
      } catch (error) {
        console.warn('Could not get local_uuid from IndexedDB:', error);
      }

      // Determine which local_uuid to use
      let finalLocalUuid = profile.local_uuid;
      
      if (!finalLocalUuid && indexedDbLocalUuid) {
        // Use IndexedDB local_uuid if Supabase doesn't have one
        finalLocalUuid = indexedDbLocalUuid;
      } else if (!finalLocalUuid && !indexedDbLocalUuid) {
        // Generate new local_uuid if neither has one
        finalLocalUuid = crypto.randomUUID();
      }

      // Update Supabase if local_uuid changed or is missing
      if (finalLocalUuid !== profile.local_uuid) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ local_uuid: finalLocalUuid })
          .eq('id', user.id);

        if (updateError) {
          errors.push(`Failed to update Supabase local_uuid: ${updateError.message}`);
        } else {
          synced++;
          console.log(`✅ Synced local_uuid for user ${profile.email}: ${finalLocalUuid}`);
        }
      }

      // Update IndexedDB with the final local_uuid
      try {
        await offlineDB.upsert('user_profiles', {
          id: user.id,
          email: profile.email,
          role: profile.role,
          local_uuid: finalLocalUuid,
          branch_id: profile.branch_id,
          sync_status: 'synced'
        });
      } catch (error) {
        errors.push(`Failed to update IndexedDB: ${error}`);
      }

      return { success: errors.length === 0, synced, errors };

    } catch (error) {
      errors.push(`Sync failed: ${error}`);
      return { success: false, synced, errors };
    }
  }

  /**
   * Get all workers with their branch assignments
   */
  async getWorkersWithBranches(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, display_name, role, local_uuid, branch_id, worker_code')
        .eq('role', 'worker')
        .order('created_at');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get workers with branches:', error);
      
      // Fallback to IndexedDB if offline
      try {
        const localProfiles = await offlineDB.getAll('user_profiles');
        return localProfiles.filter(p => p.role === 'worker');
      } catch (localError) {
        console.error('Failed to get local workers:', localError);
        return [];
      }
    }
  }

  /**
   * Get current user's branch info
   */
  async getCurrentUserBranch(): Promise<{ branch_id: string | null; worker_code: string | null; local_uuid: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('branch_id, worker_code, local_uuid')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      return {
        branch_id: profile.branch_id || null,
        worker_code: profile.worker_code || null,
        local_uuid: profile.local_uuid || null
      };
    } catch (error) {
      console.error('Failed to get current user branch:', error);
      return { branch_id: null, worker_code: null, local_uuid: null };
    }
  }

  /**
   * Update worker's branch assignment
   */
  async updateWorkerBranch(workerId: string, branchId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!connectionService.online) {
        throw new Error('Cannot update branch - offline');
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({ branch_id: branchId })
        .eq('id', workerId)
        .eq('role', 'worker');

      if (error) throw error;

      // Update IndexedDB as well
      try {
        const localProfiles = await offlineDB.getAll('user_profiles');
        const workerProfile = localProfiles.find(p => p.id === workerId);
        if (workerProfile) {
          await offlineDB.upsert('user_profiles', {
            ...workerProfile,
            branch_id: branchId,
            sync_status: 'synced'
          });
        }
      } catch (localError) {
        console.warn('Failed to update local branch assignment:', localError);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate unique branch ID for new worker
   */
  generateBranchId(workerName: string): string {
    const prefix = workerName.substring(0, 3).toUpperCase();
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BRANCH-${prefix}-${suffix}`;
  }

  /**
   * Initialize branch sync service - run this on app startup
   */
  async init(): Promise<void> {
    try {
      console.log('🔄 Initializing Worker Branch Sync Service...');
      
      // Sync current user's local_uuid
      const result = await this.syncWorkerLocalUuids();
      
      if (result.success) {
        console.log(`✅ Worker branch sync initialized - synced ${result.synced} records`);
      } else {
        console.warn('⚠️ Worker branch sync had errors:', result.errors);
      }

      // Get current user's branch info for logging
      const branchInfo = await this.getCurrentUserBranch();
      console.log('📍 Current user branch info:', branchInfo);

    } catch (error) {
      console.error('❌ Failed to initialize worker branch sync:', error);
    }
  }

  /**
   * Ensure all workers have required fields (local_uuid, branch_id, worker_code)
   * Run this as an admin function
   */
  async ensureAllWorkersHaveFields(): Promise<{ updated: number; errors: string[] }> {
    const errors: string[] = [];
    let updated = 0;

    try {
      if (!connectionService.online) {
        throw new Error('Cannot update workers - offline');
      }

      // Get all workers
      const { data: workers, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'worker');

      if (error) throw error;

      for (const worker of workers || []) {
        const updates: any = {};
        let needsUpdate = false;

        // Ensure local_uuid
        if (!worker.local_uuid) {
          updates.local_uuid = crypto.randomUUID();
          needsUpdate = true;
        }

        // Ensure branch_id
        if (!worker.branch_id) {
          updates.branch_id = this.generateBranchId(worker.display_name || worker.email);
          needsUpdate = true;
        }

        // Ensure worker_code
        if (!worker.worker_code) {
          const workerCount = (workers?.length || 0) + 1;
          const prefix = (worker.display_name || worker.email).substring(0, 2).toUpperCase();
          updates.worker_code = `W-${prefix}-${workerCount.toString().padStart(4, '0')}`;
          needsUpdate = true;
        }

        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', worker.id);

          if (updateError) {
            errors.push(`Failed to update worker ${worker.email}: ${updateError.message}`);
          } else {
            updated++;
            console.log(`✅ Updated worker ${worker.email} with:`, updates);
          }
        }
      }

      return { updated, errors };
    } catch (error) {
      errors.push(`Batch update failed: ${error}`);
      return { updated, errors };
    }
  }
}

// Export singleton instance
export const workerBranchSyncService = new WorkerBranchSyncService();