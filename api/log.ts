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
        console.warn('Failed to insert log to Supabase:', error.message);
        return res.status(500).json({ error: 'Failed to store log' });
      }

      return res.status(200).json({ success: true });
    }

    // Fallback: log to serverless console with proper sanitization
    const { sanitizeForLog } = require('../utils/securityUtils');
    const sanitizedPayload = {
      type: sanitizeForLog(payload.type),
      data: sanitizeForLog(payload.data)
    };
    console.log('client-log:', JSON.stringify(sanitizedPayload));
    return res.status(200).json({ success: true });
  } catch (err: any) {
    const { sanitizeForLog } = require('../utils/securityUtils');
    console.error('Error in /api/log:', sanitizeForLog(err?.message || String(err)));
    return res.status(500).json({ error: 'Internal server error' });
  }
}
