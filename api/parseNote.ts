// Supabase Edge Function: /parseNote
// Convert raw notes to structured JSON + embeddings
import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

// Rate limiting per client (simple in-memory)
const clientRates = new Map<string, { count: number, resetTime: number }>();

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

async function parseWithGemini(text: string, model: string = 'gemini-2.0-flash-lite'): Promise<string> {
  const prompt = `Extract stock operations from this note. Return ONLY valid JSON with keys: purchases[], productions[], transfers[], branch_operations[], leftovers[]. Each array contains objects with relevant fields like product, quantity, bags, branch, etc.

Note: "${text}"

JSON:`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 800
      }
    })
  });

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
}

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const client = clientRates.get(clientId);
  
  if (!client || now > client.resetTime) {
    clientRates.set(clientId, { count: 1, resetTime: now + 3600000 }); // 1 hour
    return true;
  }
  
  if (client.count >= 60) return false; // 60 per hour limit
  
  client.count++;
  return true;
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
    const clientId = body.client_id || 'unknown';
    
    if (!text) return new Response(JSON.stringify({ error: 'empty text' }), { status: 400 });

    // Rate limiting
    if (!checkRateLimit(clientId)) {
      return new Response(JSON.stringify({ error: 'rate limit exceeded' }), { status: 429 });
    }

    // Create note record
    const noteRow = {
      content: text,
      user_role: body.user_role || null,
      status: 'pending'
    };
    
    const { data: noteData, error: noteError } = await supabase
      .from('notes')
      .insert(noteRow)
      .select('id')
      .single();
    
    if (noteError) throw noteError;
    const noteId = noteData.id;

    // Generate embedding
    try {
      const embedding = await generateEmbedding(text);
      if (embedding.length > 0) {
        await supabase.from('note_embeddings').insert({
          note_id: noteId,
          embedding
        });
      }
    } catch (embError) {
      console.warn('Embedding failed:', embError);
    }

    // Parse with Gemini
    const model = body.model || 'gemini-2.0-flash-lite';
    const parsedText = await parseWithGemini(text, model);
    
    let parsedJson = null;
    try {
      parsedJson = JSON.parse(parsedText);
    } catch (parseError) {
      // Fallback parsing
      parsedJson = {
        parse_error: 'invalid JSON from LLM',
        raw: parsedText,
        fallback: {
          purchases: [],
          productions: [],
          transfers: [],
          branch_operations: [],
          leftovers: []
        }
      };
    }

    // Update note with parsed data
    await supabase
      .from('notes')
      .update({ 
        parsed_data: parsedJson, 
        status: 'parsed' 
      })
      .eq('id', noteId);

    // Log for debugging
    await supabase.from('ai_audit_logs').insert({
      prompt: text,
      response: parsedText,
      model_used: model,
      user_id: body.user_id
    }).catch(() => {}); // Ignore logging errors

    return new Response(JSON.stringify({
      note_id: noteId,
      parsed: parsedJson,
      model_used: model
    }), { status: 200 });

  } catch (err) {
    console.error('Parse error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});