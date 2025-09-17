-- Summaries table for daily aggregated insights
CREATE TABLE IF NOT EXISTS summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid,
  date date NOT NULL,
  summary jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- AI audit logs for tracking interactions
CREATE TABLE IF NOT EXISTS ai_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt text NOT NULL,
  response text,
  model_used text DEFAULT 'gemini-2.0-flash',
  user_id uuid,
  created_at timestamptz DEFAULT now()
);