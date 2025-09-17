import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../src/supabaseConfig';
import { handlePreflight, setCorsHeaders } from './_cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Preflight handling
  if (handlePreflight(req, res)) return;

  try {
    setCorsHeaders(res, req.headers.origin as string | undefined);

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const payload = req.body;

    // Basic validation
    if (!payload || !payload.type) {
      return res.status(400).json({ error: 'Invalid log payload' });
    }

    // If Supabase is configured with a service role key (server-side), insert into logs table
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabase
        .from('app_logs')
        .insert([{ type: payload.type, data: payload.data || {}, created_at: new Date().toISOString() }]);

      if (error) {
        // Import secure logger
        const { secureLogger } = require('../utils/securityConfig');
        secureLogger.warn('Failed to insert log to Supabase', error.message || 'Unknown error');
        return res.status(500).json({ error: 'Failed to store log' });
      }

      return res.status(200).json({ success: true, id: data[0]?.id });
    }

    // Fallback: log to serverless console
    console.log('client-log:', JSON.stringify(payload));
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Error in /api/log:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
