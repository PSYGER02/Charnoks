// Supabase Edge Function: /similarNotes
// RAG similarity search using embeddings
import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/text-embedding-004',
      content: { parts: [{ text }] }
    })
  });
  
  const data = await response.json();
  return data.embedding?.values || [];
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    // Auth check
    const apiKey = req.headers.get('x-client-key') || '';
    if (apiKey !== Deno.env.get('SYNC_CLIENT_KEY')) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    }

    const body = await req.json();
    const text = (body.text || '').trim();
    const limit = Math.min(body.limit || 5, 20); // Max 20 results
    
    if (!text) return new Response(JSON.stringify({ error: 'empty text' }), { status: 400 });

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(text);
    if (queryEmbedding.length === 0) {
      return new Response(JSON.stringify({ similar_notes: [] }), { status: 200 });
    }

    // Use the similarity search function
    const { data: similarNotes, error } = await supabase.rpc('match_notes', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: limit
    });

    if (error) throw error;

    return new Response(JSON.stringify({
      similar_notes: similarNotes || [],
      query_text: text
    }), { status: 200 });

  } catch (err) {
    console.error('Similar notes error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});