// Supabase Edge Function: /sync
// Batch sync for offline operations & notes
import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const ALLOWED_OPS = new Set(['purchase','receive','package','transfer_out','transfer_in','cook','sale','waste']);

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    // Auth check
    const apiKey = req.headers.get('x-client-key') || '';
    if (apiKey !== Deno.env.get('SYNC_CLIENT_KEY')) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    }

    const body = await req.json();
    const items = Array.isArray(body.items) ? body.items.slice(0,50) : []; // Max 50 per batch
    if (!items.length) return new Response(JSON.stringify({ results: [] }), { status: 200 });

    // Validate local_uuids
    const localUuids = items.map(i => i.local_uuid).filter(Boolean);
    if (localUuids.length !== items.length) {
      return new Response(JSON.stringify({ error: "each item must include local_uuid" }), { status: 400 });
    }

    // Check existing operations
    const { data: existing, error } = await supabase
      .from('operations')
      .select('id, local_uuid')
      .in('local_uuid', localUuids)
      .limit(100);

    if (error) throw error;

    const existingMap = new Map(existing?.map((r: any) => [r.local_uuid, r.id]));
    const results = [];
    const toInsertOps = [];
    const toInsertNotes = [];

    // Process items
    for (const item of items) {
      if (existingMap.has(item.local_uuid)) {
        results.push({ 
          local_uuid: item.local_uuid, 
          status: 'duplicate', 
          existing_id: existingMap.get(item.local_uuid) 
        });
        continue;
      }

      if (item.kind === 'operation') {
        if (!ALLOWED_OPS.has(item.op_type)) {
          results.push({ local_uuid: item.local_uuid, status: 'error', error: 'invalid op_type' });
          continue;
        }
        toInsertOps.push({
          local_uuid: item.local_uuid,
          lot_id: item.lot_id ?? null,
          branch_id: item.branch_id ?? null,
          worker_id: item.worker_id ?? null,
          op_type: item.op_type,
          quantity_parts: item.quantity_parts ?? 0,
          quantity_bags: item.quantity_bags ?? 0,
          metadata: item.metadata ?? {},
        });
      } else if (item.kind === 'note') {
        toInsertNotes.push({
          content: item.content ?? '',
          user_role: item.user_role ?? null,
          parsed_data: item.parsed_data ?? null,
          status: item.status ?? 'pending'
        });
      } else {
        results.push({ local_uuid: item.local_uuid, status: 'error', error: 'unknown kind' });
      }
    }

    // Insert notes
    if (toInsertNotes.length) {
      const r = await supabase.from('notes').insert(toInsertNotes).select('id');
      if (r.error) {
        for (const n of toInsertNotes) {
          results.push({ local_uuid: n.local_uuid, status: 'error', error: r.error.message });
        }
      } else {
        r.data.forEach((row, i) => {
          results.push({ local_uuid: toInsertNotes[i].local_uuid, status: 'inserted', id: row.id });
        });
      }
    }

    // Insert operations
    if (toInsertOps.length) {
      const r2 = await supabase.from('operations').insert(toInsertOps).select('id, local_uuid');
      if (r2.error) {
        for (const op of toInsertOps) {
          results.push({ local_uuid: op.local_uuid, status: 'error', error: r2.error.message });
        }
      } else {
        for (const row of r2.data) {
          results.push({ local_uuid: row.local_uuid, status: 'inserted', id: row.id });
        }
      }
    }

    return new Response(JSON.stringify({ results }), { status: 200 });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});