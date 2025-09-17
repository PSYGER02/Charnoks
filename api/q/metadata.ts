import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../src/supabaseConfig';

const ALLOWED_TABLES = [
  'products', 'sales', 'expenses', 'user_profiles', 
  'lots', 'operations', 'notes', 'summaries'
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { apiKey, tables = [], sample_rows = 5 } = req.body;

  if (!apiKey || apiKey !== process.env.Q_META_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const result: Record<string, any> = {};

  for (const tableName of tables) {
    if (!ALLOWED_TABLES.includes(tableName)) {
      result[tableName] = { error: 'Table not allowed' };
      continue;
    }

    try {
      // Get schema info
      const { data: schemaData } = await supabase.rpc('get_table_schema', { table_name: tableName });
      
      // Get sample data
      const { data: sampleData } = await supabase
        .from(tableName)
        .select('*')
        .limit(Math.min(sample_rows, 10));

      const sanitizedSample = sampleData?.map(row => {
        const sanitized = { ...row };
        delete sanitized.password;
        delete sanitized.api_key;
        return sanitized;
      }) || [];

      result[tableName] = {
        columns: schemaData || [],
        sample: sanitizedSample,
        row_count: sampleData?.length || 0
      };
    } catch (error) {
      result[tableName] = { error: 'Processing failed' };
    }
  }

  return res.status(200).json({ tables: result });
}