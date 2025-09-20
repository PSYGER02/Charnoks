import { supabase } from '../src/supabaseConfig';
import { safeLog } from '../utils/securityUtils';

export interface Worker {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

// Fast worker lookup - query user_profiles directly (FIXED)
export const getWorkers = async (): Promise<Worker[]> => {
  try {
    console.log('👥 Fetching workers from user_profiles');
    
    // Query user_profiles for all active users (not just workers)
    // This ensures we can resolve worker names for expenses created by owners too
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, display_name, email, is_active, role')
      .eq('is_active', true) // Remove role filter to include owners
      .order('display_name');

    if (error) {
      safeLog.warn('Workers fetch error', error.message);
      
      // If it's a policy recursion error, return cached data or empty array to prevent spam
      if (error.message.includes('infinite recursion')) {
        console.warn('⚠️ Supabase policy recursion detected, using fallback');
        return [
          { id: 'fallback-1', name: 'Default User', email: 'user@example.com', isActive: true }
        ];
      }
      
      return [];
    }

    console.log('👥 Found user profiles:', data?.length || 0);
    
    return (data || []).map((w: any) => ({
      id: w.id,
      name: w.display_name || w.email?.split('@')[0] || 'Worker',
      email: w.email,
      isActive: w.is_active
    }));
  } catch (error) {
    safeLog.error('Error fetching workers', error);
    return [];
  }
};

// Get single worker by ID - super fast
export const getWorkerById = async (id: string): Promise<Worker | null> => {
  try {
    const { data, error } = await supabase
      .from('workers')
      .select('id, name, email, is_active')
      .eq('id', id)
      .single();

    if (error) return null;

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      isActive: data.is_active
    };
  } catch {
    return null;
  }
};

// Batch worker lookup for performance
export const getWorkersByIds = async (ids: string[]): Promise<Worker[]> => {
  if (ids.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from('workers')
      .select('id, name, email, is_active')
      .in('id', ids);

    if (error) return [];

    return (data || []).map((w: any) => ({
      id: w.id,
      name: w.name,
      email: w.email,
      isActive: w.is_active
    }));
  } catch {
    return [];
  }
};