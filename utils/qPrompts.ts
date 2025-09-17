// Amazon Q Developer prompt templates for ChatGPT plan implementation

export const Q_PROMPTS = {
  // Part A: Repository file search
  FIND_FILES: `Model: Claude Sonnet 4
Task: Search the current repository for files (or code snippets) related to StockManagementPage, IndexedDB sync code, the Edge Function named /sync, and SQL table definitions.
Instructions:
1. Reply with JSON containing a "found_files" array. Each item: {path, first_line_preview, found, brief_note}.
2. If you cannot find a file, return an entry with "found": false and a suggested alternative filename or location.
3. Do NOT output any other text.
Example: {"found_files":[{"path":"src/pages/StockManagementPage.jsx","first_line_preview":"import React from 'react'...","found":true,"note":"Contains local sync logic"}]}
Now search the repo.`,

  // Part B: Schema validation
  VALIDATE_SCHEMA: `I will provide a JSON object containing DB schema and sample rows for tables. Please:
1) Confirm these table names and column types exist (reply: {"ok":true} or {"ok":false,"missing":[...]}).
2) Return a short summary of fields relevant to inventory reconciliation (2-3 bullet points).
3) Output example SQL to compute "cooked today" given these tables.
Input:`,

  // Part C: Stock note parsing (strict JSON)
  PARSE_NOTE_SYSTEM: `You are a strict JSON-only extractor. For every input note, output valid JSON only. The JSON must follow the schema keys: purchases[], productions[], transfers[], branch_operations[], leftovers[].
If any field is unknown, omit it. Do not add commentary.`,

  PARSE_NOTE_USER: (note: string) => `Parse this note into the JSON schema:
"${note}"`,

  // Daily summary generation
  GENERATE_SUMMARY: (operations: any[], branchId: string, date: string) => `Using these operations ${JSON.stringify(operations)}, produce a detailed human-readable summary for ${branchId} for ${date} that includes:
- total bags received,
- total parts produced,
- total cooked,
- total sold (by part & neck),
- leftovers (count & suggested price),
- anomalies (e.g., mismatch between produced and accounted-for).
Output JSON:
{"branch_id":"${branchId}","date":"${date}","total_received_bags":int,"total_parts_produced":int,"total_cooked_parts":int,"total_sold_parts":int,"leftovers":[{"product":"", "parts":int, "suggested_price":int}], "anomalies":[ "..."]}`,

  // SQL validation
  VALIDATE_SQL: (sql: string) => `I will paste DB-schema JSON. Then run these three checks:
1) Confirm table & column names referenced below exist.
2) Return corrected SQL if column names differ.
3) Provide a safe SELECT that computes total cooked parts per branch for a date range.

Referenced SQL:
${sql}`
};

// Audit logging function
export const logAIInteraction = async (prompt: string, response: string, model: string = 'gemini-2.0-flash', userId?: string) => {
  try {
    const { supabase } = await import('../src/supabaseConfig');
    await supabase.from('ai_audit_logs').insert({
      prompt: prompt.substring(0, 1000), // Limit size
      response: response.substring(0, 2000),
      model_used: model,
      user_id: userId
    });
  } catch (error) {
    console.warn('Failed to log AI interaction:', error);
  }
};