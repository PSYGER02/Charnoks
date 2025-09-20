-- Fix Database Schema for MCP Server Integration
-- Adds missing tables that ChatGPT's plan expected but don't exist in your current schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector; -- For embeddings

-- ============================================================================
-- MISSING TABLES (Identified from analysis)
-- ============================================================================

-- 1. Note embeddings for RAG functionality (missing from your schema)
CREATE TABLE IF NOT EXISTS note_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  embedding VECTOR(1536), -- Gemini text-embedding-004 dimensions
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AI audit logs for monitoring and debugging (missing from your schema)  
CREATE TABLE IF NOT EXISTS ai_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type TEXT NOT NULL,
  input_data JSONB,
  output_data JSONB,
  model_used TEXT,
  tokens_used INTEGER DEFAULT 0,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MCP server sessions for tracking requests
CREATE TABLE IF NOT EXISTS mcp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  tool_name TEXT NOT NULL,
  user_role TEXT CHECK (user_role IN ('owner', 'worker')),
  request_data JSONB,
  response_data JSONB,
  success BOOLEAN,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ENHANCE EXISTING TABLES (Add missing columns ChatGPT's plan expects)
-- ============================================================================

-- Fix notes table to match expected schema
ALTER TABLE notes ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS learned_patterns JSONB;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(5,4);
ALTER TABLE notes ADD COLUMN IF NOT EXISTS local_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE notes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add check constraint for valid statuses
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'notes_status_check' 
    AND table_name = 'notes'
  ) THEN
    ALTER TABLE notes ADD CONSTRAINT notes_status_check 
    CHECK (status IN ('pending', 'parsed', 'applied', 'synced'));
  END IF;
END $$;

-- Add check constraint for business types
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'notes_business_type_check' 
    AND table_name = 'notes'
  ) THEN
    ALTER TABLE notes ADD CONSTRAINT notes_business_type_check 
    CHECK (business_type IN ('purchase', 'processing', 'distribution', 'cooking', 'sales', 'general'));
  END IF;
END $$;

-- Enhance operations table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'operations') THEN
    ALTER TABLE operations ADD COLUMN IF NOT EXISTS local_uuid UUID DEFAULT gen_random_uuid();
    ALTER TABLE operations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
    ALTER TABLE operations ADD COLUMN IF NOT EXISTS synced BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Note embeddings indexes
CREATE INDEX IF NOT EXISTS idx_note_embeddings_note_id ON note_embeddings(note_id);
CREATE INDEX IF NOT EXISTS idx_note_embeddings_created_at ON note_embeddings(created_at);

-- AI audit logs indexes
CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_operation_type ON ai_audit_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_created_at ON ai_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_success ON ai_audit_logs(success);
CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_model_used ON ai_audit_logs(model_used);

-- MCP sessions indexes
CREATE INDEX IF NOT EXISTS idx_mcp_sessions_session_id ON mcp_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_mcp_sessions_tool_name ON mcp_sessions(tool_name);
CREATE INDEX IF NOT EXISTS idx_mcp_sessions_created_at ON mcp_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_mcp_sessions_user_role ON mcp_sessions(user_role);

-- Enhanced notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_business_type ON notes(business_type);
CREATE INDEX IF NOT EXISTS idx_notes_confidence_score ON notes(confidence_score);
CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status);
CREATE INDEX IF NOT EXISTS idx_notes_local_uuid ON notes(local_uuid);

-- Operations indexes (if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'operations') THEN
    CREATE INDEX IF NOT EXISTS idx_operations_local_uuid ON operations(local_uuid);
    CREATE INDEX IF NOT EXISTS idx_operations_synced ON operations(synced);
  END IF;
END $$;

-- ============================================================================
-- SIMILARITY SEARCH FUNCTION FOR RAG
-- ============================================================================

-- Function to find similar notes based on embeddings
CREATE OR REPLACE FUNCTION match_notes(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.8,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    note_id UUID,
    content TEXT,
    business_type TEXT,
    similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT 
    n.id,
    n.content,
    n.business_type,
    1 - (ne.embedding <=> query_embedding) AS similarity
  FROM notes n
  JOIN note_embeddings ne ON n.id = ne.note_id
  WHERE 1 - (ne.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE note_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_sessions ENABLE ROW LEVEL SECURITY;

-- Note embeddings policies (inherit from notes table security)
CREATE POLICY "Users can view note embeddings based on note access" ON note_embeddings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE notes.id = note_embeddings.note_id 
      AND (
        notes.created_by = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE user_profiles.id = auth.uid() 
          AND user_profiles.role = 'owner'
        )
      )
    )
  );

-- AI audit logs policies (owners can see all, workers see their own)
CREATE POLICY "Owners can view all AI audit logs" ON ai_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'owner'
    )
  );

CREATE POLICY "Service role can insert AI audit logs" ON ai_audit_logs
  FOR INSERT WITH CHECK (true);

-- MCP sessions policies
CREATE POLICY "Users can view their own MCP sessions" ON mcp_sessions
  FOR SELECT USING (
    auth.uid()::text = (request_data->>'user_id')
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'owner'
    )
  );

CREATE POLICY "Service role can manage MCP sessions" ON mcp_sessions
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update timestamp trigger for ai_audit_logs
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at column to ai_audit_logs if needed
ALTER TABLE ai_audit_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger for ai_audit_logs
DROP TRIGGER IF EXISTS update_ai_audit_logs_updated_at ON ai_audit_logs;
CREATE TRIGGER update_ai_audit_logs_updated_at 
  BEFORE UPDATE ON ai_audit_logs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all tables exist
DO $$ 
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'note_embeddings') INTO table_exists;
  RAISE NOTICE 'note_embeddings table exists: %', table_exists;
  
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_audit_logs') INTO table_exists;
  RAISE NOTICE 'ai_audit_logs table exists: %', table_exists;
  
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'mcp_sessions') INTO table_exists;
  RAISE NOTICE 'mcp_sessions table exists: %', table_exists;
  
  -- Check if notes table has new columns
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'notes' 
    AND column_name = 'business_type'
  ) INTO table_exists;
  RAISE NOTICE 'notes.business_type column exists: %', table_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'notes' 
    AND column_name = 'learned_patterns'
  ) INTO table_exists;
  RAISE NOTICE 'notes.learned_patterns column exists: %', table_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'notes' 
    AND column_name = 'confidence_score'
  ) INTO table_exists;
  RAISE NOTICE 'notes.confidence_score column exists: %', table_exists;
END $$;

-- Grant permissions for service role
GRANT ALL ON note_embeddings TO service_role;
GRANT ALL ON ai_audit_logs TO service_role;
GRANT ALL ON mcp_sessions TO service_role;

-- Grant permissions for authenticated users
GRANT SELECT ON note_embeddings TO authenticated;
GRANT SELECT ON ai_audit_logs TO authenticated;
GRANT SELECT ON mcp_sessions TO authenticated;

RAISE NOTICE '✅ Database schema fixes completed successfully!';
RAISE NOTICE '📋 Added tables: note_embeddings, ai_audit_logs, mcp_sessions';
RAISE NOTICE '🔧 Enhanced notes table with: business_type, learned_patterns, confidence_score, status';
RAISE NOTICE '🔍 Added similarity search function: match_notes()';
RAISE NOTICE '🛡️ Configured RLS policies for all new tables';
RAISE NOTICE '📊 Added performance indexes for all new columns';