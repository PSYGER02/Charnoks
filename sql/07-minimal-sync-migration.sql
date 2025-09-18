-- ============================================================================
-- MINIMAL SYNC MIGRATION - ONLY FIX MISSING COLUMNS
-- ============================================================================
-- This migration only adds missing sync columns to tables that need them
-- Most tables are already sync-ready per the real database analysis

-- ============================================================================
-- PART 1: FIX OWNERS TABLE (missing updated_at column)
-- ============================================================================

-- Add updated_at column to owners table
ALTER TABLE public.owners 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add updated_at trigger to owners table
DROP TRIGGER IF EXISTS handle_updated_at_owners ON public.owners;
CREATE TRIGGER handle_updated_at_owners
  BEFORE UPDATE ON public.owners
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- PART 2: FIX BRANCHES TABLE (missing updated_at column)
-- ============================================================================

-- Add updated_at column to branches table
ALTER TABLE public.branches 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add updated_at trigger to branches table  
DROP TRIGGER IF EXISTS handle_updated_at_branches ON public.branches;
CREATE TRIGGER handle_updated_at_branches
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- PART 3: ADD MISSING INDEXES FOR SYNC PERFORMANCE
-- ============================================================================

-- Indexes for operations table (already has sync columns, just missing indexes)
CREATE INDEX IF NOT EXISTS idx_operations_local_uuid ON public.operations(local_uuid);
CREATE INDEX IF NOT EXISTS idx_operations_updated_at ON public.operations(updated_at);
CREATE INDEX IF NOT EXISTS idx_operations_deleted ON public.operations(deleted);

-- Indexes for lots table (already has sync columns, just missing indexes)
CREATE INDEX IF NOT EXISTS idx_lots_local_uuid ON public.lots(local_uuid);
CREATE INDEX IF NOT EXISTS idx_lots_updated_at ON public.lots(updated_at);
CREATE INDEX IF NOT EXISTS idx_lots_deleted ON public.lots(deleted);

-- Indexes for summaries table (already has sync columns, just missing indexes)
CREATE INDEX IF NOT EXISTS idx_summaries_local_uuid ON public.summaries(local_uuid);
CREATE INDEX IF NOT EXISTS idx_summaries_updated_at ON public.summaries(updated_at);
CREATE INDEX IF NOT EXISTS idx_summaries_deleted ON public.summaries(deleted);

-- Indexes for ai_conversations table (already has sync columns, just missing indexes)
CREATE INDEX IF NOT EXISTS idx_ai_conversations_local_uuid ON public.ai_conversations(local_uuid);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated_at ON public.ai_conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_deleted ON public.ai_conversations(deleted);

-- Indexes for ai_analysis table (already has sync columns, just missing indexes)
CREATE INDEX IF NOT EXISTS idx_ai_analysis_local_uuid ON public.ai_analysis(local_uuid);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_updated_at ON public.ai_analysis(updated_at);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_deleted ON public.ai_analysis(deleted);

-- Indexes for branch_stock table (already has sync columns, just missing indexes)
CREATE INDEX IF NOT EXISTS idx_branch_stock_local_uuid ON public.branch_stock(local_uuid);
CREATE INDEX IF NOT EXISTS idx_branch_stock_updated_at ON public.branch_stock(updated_at);
CREATE INDEX IF NOT EXISTS idx_branch_stock_deleted ON public.branch_stock(deleted);

-- Indexes for owners table (now has all sync columns)
CREATE INDEX IF NOT EXISTS idx_owners_local_uuid ON public.owners(local_uuid);
CREATE INDEX IF NOT EXISTS idx_owners_updated_at ON public.owners(updated_at);
CREATE INDEX IF NOT EXISTS idx_owners_deleted ON public.owners(deleted);

-- Indexes for branches table (now has all sync columns)
CREATE INDEX IF NOT EXISTS idx_branches_local_uuid ON public.branches(local_uuid);
CREATE INDEX IF NOT EXISTS idx_branches_updated_at ON public.branches(updated_at);
CREATE INDEX IF NOT EXISTS idx_branches_deleted ON public.branches(deleted);

-- ============================================================================
-- PART 4: ENSURE SIMILARITY SEARCH FUNCTION EXISTS (FOR RAG)
-- ============================================================================

-- Create similarity search function for note embeddings (idempotent)
CREATE OR REPLACE FUNCTION public.match_notes (
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.content,
    1 - (ne.embedding <=> query_embedding) AS similarity
  FROM notes n
  JOIN note_embeddings ne ON n.id = ne.note_id
  WHERE 1 - (ne.embedding <=> query_embedding) > match_threshold
  AND n.deleted = false
  ORDER BY ne.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- PART 5: SEED DEFAULT OWNER AND BRANCH (OPTIONAL)
-- ============================================================================

-- Insert default owner and branch for testing if they don't exist
INSERT INTO public.owners (name, local_uuid)
SELECT 'Default Owner', 'owner-default-001'
WHERE NOT EXISTS (SELECT 1 FROM public.owners WHERE local_uuid = 'owner-default-001');

INSERT INTO public.branches (owner_id, name, location, local_uuid)
SELECT 
    (SELECT id FROM public.owners WHERE local_uuid = 'owner-default-001'),
    'Main Branch',
    'Main Location',
    'branch-main-001'
WHERE NOT EXISTS (SELECT 1 FROM public.branches WHERE local_uuid = 'branch-main-001');

-- ============================================================================
-- MIGRATION COMPLETE - MINIMAL CHANGES ONLY
-- ============================================================================

-- Verification query (comment out for production)
/*
SELECT 'Minimal Migration Complete' as status;
SELECT 'All core tables now sync-ready' as result;
*/