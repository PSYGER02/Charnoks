import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../src/supabaseConfig';
import { sanitizeForLog } from '../utils/securityUtils';

interface SyncOperation {
  local_uuid: string;
  type: 'purchase' | 'production' | 'transfer' | 'cook' | 'sale';
  data: any;
  timestamp: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { operations } = req.body;

    if (!Array.isArray(operations)) {
      return res.status(400).json({ error: 'Operations must be an array' });
    }

    const results = [];

    for (const op of operations) {
      try {
        // Check if operation already exists (dedupe by local_uuid)
        const { data: existing } = await supabase
          .from('operations')
          .select('id')
          .eq('local_uuid', op.local_uuid)
          .single();

        if (existing) {
          results.push({ local_uuid: op.local_uuid, status: 'duplicate' });
          continue;
        }

        // Insert new operation
        const { data, error } = await supabase
          .from('operations')
          .insert({
            local_uuid: op.local_uuid,
            type: op.type,
            data: op.data,
            timestamp: op.timestamp,
            synced_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;

        results.push({ local_uuid: op.local_uuid, status: 'synced', id: data.id });

      } catch (error) {
        console.error('Sync operation failed:', sanitizeForLog(error));
        results.push({ local_uuid: op.local_uuid, status: 'failed' });
      }
    }

    return res.status(200).json({ results });

  } catch (error) {
    console.error('Sync error:', sanitizeForLog(error));
    return res.status(500).json({ error: 'Sync failed' });
  }
}