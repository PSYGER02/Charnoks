// Enhanced Supabase Edge Function: /parseNote
// Uses MCP server for reliable Gemini API calls with fallback to direct API
import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY")!;
const MCP_SERVER_URL = Deno.env.get("MCP_SERVER_URL") || "http://localhost:3001";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

// Rate limiting per client (simple in-memory)
const clientRates = new Map<string, { count: number, resetTime: number }>();

interface MCPCallRequest {
  method: string;
  params: {
    name: string;
    arguments?: Record<string, any>;
  };
}

interface MCPResponse {
  result?: {
    content?: Array<{
      type: string;
      text: string;
    }>;
  };
  error?: {
    message: string;
    code: number;
  };
}

async function callMCPServer(toolName: string, args: Record<string, any>): Promise<string> {
  try {
    const mcpRequest: MCPCallRequest = {
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args
      }
    };

    const response = await fetch(`${MCP_SERVER_URL}/call-tool`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('MCP_SERVER_TOKEN') || 'dev-token'}`
      },
      body: JSON.stringify(mcpRequest)
    });

    if (!response.ok) {
      throw new Error(`MCP server responded with ${response.status}: ${response.statusText}`);
    }

    const mcpResponse: MCPResponse = await response.json();
    
    if (mcpResponse.error) {
      throw new Error(`MCP error: ${mcpResponse.error.message}`);
    }

    // Extract text content from MCP response
    const content = mcpResponse.result?.content?.[0];
    if (!content || content.type !== 'text') {
      throw new Error('Invalid MCP response format');
    }

    return content.text;
  } catch (error) {
    console.warn('MCP server call failed:', error);
    throw error;
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Try MCP server first for embeddings
    const result = await callMCPServer('generate_embedding', { text });
    const parsed = JSON.parse(result);
    if (parsed.embedding && Array.isArray(parsed.embedding)) {
      return parsed.embedding;
    }
    throw new Error('Invalid embedding response from MCP');
  } catch (mcpError) {
    console.warn('MCP embedding failed, falling back to direct API:', mcpError);
    
    // Fallback to direct Gemini API
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
}

async function parseWithMCP(text: string, userId?: string, userRole?: string): Promise<string> {
  try {
    // Use MCP server's process_chicken_note tool
    const result = await callMCPServer('process_chicken_note', {
      note_text: text,
      user_id: userId,
      user_role: userRole,
      extract_mode: 'structured_json'
    });
    
    return result;
  } catch (mcpError) {
    console.warn('MCP parsing failed, falling back to direct API:', mcpError);
    return await parseWithGeminiDirect(text);
  }
}

async function parseWithGeminiDirect(text: string, model: string = 'gemini-2.0-flash-lite'): Promise<string> {
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

function extractBusinessType(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('purchase') || lowerText.includes('buy') || lowerText.includes('order')) return 'purchase';
  if (lowerText.includes('process') || lowerText.includes('kill') || lowerText.includes('slaughter')) return 'processing';
  if (lowerText.includes('deliver') || lowerText.includes('distribute') || lowerText.includes('transfer')) return 'distribution';
  if (lowerText.includes('cook') || lowerText.includes('prepare') || lowerText.includes('kitchen')) return 'cooking';
  if (lowerText.includes('sell') || lowerText.includes('sale') || lowerText.includes('customer')) return 'sales';
  
  return 'general';
}

serve(async (req) => {
  const startTime = Date.now();
  let mcpUsed = false;
  let noteId: string | null = null;
  
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
    const userId = body.user_id;
    const userRole = body.user_role;
    
    if (!text) return new Response(JSON.stringify({ error: 'empty text' }), { status: 400 });

    // Rate limiting
    if (!checkRateLimit(clientId)) {
      return new Response(JSON.stringify({ error: 'rate limit exceeded' }), { status: 429 });
    }

    // Create note record with enhanced fields
    const businessType = extractBusinessType(text);
    const noteRow = {
      content: text,
      user_role: userRole || null,
      business_type: businessType,
      status: 'pending',
      local_uuid: crypto.randomUUID()
    };
    
    const { data: noteData, error: noteError } = await supabase
      .from('notes')
      .insert(noteRow)
      .select('id')
      .single();
    
    if (noteError) throw noteError;
    noteId = noteData.id;

    // Generate embedding
    let embeddingSuccess = false;
    try {
      const embedding = await generateEmbedding(text);
      if (embedding.length > 0) {
        await supabase.from('note_embeddings').insert({
          note_id: noteId,
          embedding
        });
        embeddingSuccess = true;
      }
    } catch (embError) {
      console.warn('Embedding failed:', embError);
    }

    // Parse with MCP (with fallback to direct API)
    let parsedText: string;
    try {
      parsedText = await parseWithMCP(text, userId, userRole);
      mcpUsed = true;
    } catch (mcpError) {
      console.warn('MCP parsing completely failed, using direct fallback:', mcpError);
      const model = body.model || 'gemini-2.0-flash-lite';
      parsedText = await parseWithGeminiDirect(text, model);
    }
    
    let parsedJson = null;
    let confidenceScore = 0.8; // Default confidence
    
    try {
      parsedJson = JSON.parse(parsedText);
      
      // Calculate confidence based on structure completeness
      const hasExpectedKeys = ['purchases', 'productions', 'transfers', 'branch_operations', 'leftovers']
        .every(key => key in parsedJson);
      
      if (hasExpectedKeys) {
        const totalItems = Object.values(parsedJson).reduce((sum: number, arr: any) => 
          sum + (Array.isArray(arr) ? arr.length : 0), 0);
        confidenceScore = Math.min(0.95, 0.6 + (totalItems * 0.05));
      } else {
        confidenceScore = 0.3;
      }
      
    } catch (parseError) {
      // Fallback parsing
      confidenceScore = 0.1;
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

    // Update note with parsed data and confidence score
    await supabase
      .from('notes')
      .update({ 
        parsed_data: parsedJson, 
        confidence_score: confidenceScore,
        status: 'parsed' 
      })
      .eq('id', noteId);

    // Enhanced audit logging
    const executionTime = Date.now() - startTime;
    await supabase.from('ai_audit_logs').insert({
      operation_type: 'parse_note',
      input_data: { 
        note_text: text,
        business_type: businessType,
        user_role: userRole,
        mcp_used: mcpUsed 
      },
      output_data: { 
        parsed_json: parsedJson,
        confidence_score: confidenceScore,
        embedding_success: embeddingSuccess
      },
      model_used: mcpUsed ? 'mcp-server' : (body.model || 'gemini-2.0-flash-lite'),
      success: true,
      tokens_used: parsedText.length // Rough estimate
    }).catch((logError) => {
      console.warn('Audit logging failed:', logError);
    });

    // Log MCP session if used
    if (mcpUsed && noteId) {
      await supabase.from('mcp_sessions').insert({
        session_id: `parse-${noteId}`,
        tool_name: 'process_chicken_note',
        user_role: userRole,
        request_data: { note_text: text, business_type: businessType },
        response_data: { parsed_json: parsedJson, confidence_score: confidenceScore },
        success: true,
        execution_time_ms: executionTime
      }).catch((sessionError) => {
        console.warn('MCP session logging failed:', sessionError);
      });
    }

    return new Response(JSON.stringify({
      note_id: noteId,
      parsed: parsedJson,
      confidence_score: confidenceScore,
      business_type: businessType,
      model_used: mcpUsed ? 'mcp-server' : (body.model || 'gemini-2.0-flash-lite'),
      mcp_used: mcpUsed,
      embedding_success: embeddingSuccess,
      execution_time_ms: executionTime
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Parse error:', err);
    
    // Log the error
    const executionTime = Date.now() - startTime;
    await supabase.from('ai_audit_logs').insert({
      operation_type: 'parse_note',
      input_data: { error_context: String(err) },
      output_data: null,
      model_used: mcpUsed ? 'mcp-server' : 'direct-api',
      success: false,
      error_message: String(err)
    }).catch(() => {}); // Ignore logging errors

    return new Response(JSON.stringify({ 
      error: String(err),
      mcp_used: mcpUsed,
      execution_time_ms: executionTime
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});