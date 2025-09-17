import { supabase } from '../src/supabaseConfig';
import { safeLog } from '../utils/securityUtils';

export interface Worker {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

// Fast worker lookup - single table query
export const getWorkers = async (): Promise<Worker[]> => {
  try {
    const { data, error } = await supabase
      .from('workers')
      .select('id, name, email, is_active')
      .eq('is_active', true)
      .order('name');

    if (error) {
      safeLog.warn('Workers fetch error', error.message);
      return [];
    }

    return (data || []).map(w => ({
      id: w.id,
      name: w.name,
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

    return (data || []).map(w => ({
      id: w.id,
      name: w.name,
      email: w.email,
      isActive: w.is_active
    }));
  } catch {
    return [];
  }
};