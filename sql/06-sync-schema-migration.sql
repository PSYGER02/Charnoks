-- ============================================================================
-- INDEXEDDB/SUPABASE SYNC PLAN - SCHEMA MIGRATION
-- ============================================================================
-- This migration adds the required sync columns to existing tables
-- and creates missing tables per the sync plan requirements

-- Enable extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- PART 1: ADD SYNC COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add sync columns to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS local_uuid TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;

-- Add sync columns to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS local_uuid TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;

-- Add sync columns to sales (missing updated_at)
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS local_uuid TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;

-- Add sync columns to expenses (missing updated_at)
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS local_uuid TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;

-- Add sync columns to notes (already has updated_at)
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS local_uuid TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;

-- Add sync columns to other important tables
ALTER TABLE public.ai_analysis
  ADD COLUMN IF NOT EXISTS local_uuid TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;

ALTER TABLE public.ai_conversations
  ADD COLUMN IF NOT EXISTS local_uuid TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;

ALTER TABLE public.branch_stock
  ADD COLUMN IF NOT EXISTS local_uuid TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;

ALTER TABLE public.summaries
  ADD COLUMN IF NOT EXISTS local_uuid TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;

-- ============================================================================
-- PART 2: CREATE/UPDATE UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

-- Create updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 3: ADD UPDATED_AT TRIGGERS TO ALL SYNC TABLES
-- ============================================================================

-- Sales table triggers
DROP TRIGGER IF EXISTS handle_updated_at_sales ON public.sales;
CREATE TRIGGER handle_updated_at_sales
  BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Expenses table triggers  
DROP TRIGGER IF EXISTS handle_updated_at_expenses ON public.expenses;
CREATE TRIGGER handle_updated_at_expenses
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- User profiles table triggers (may already exist)
DROP TRIGGER IF EXISTS handle_updated_at_user_profiles ON public.user_profiles;
CREATE TRIGGER handle_updated_at_user_profiles
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Products table triggers (may already exist)
DROP TRIGGER IF EXISTS handle_updated_at_products ON public.products;
CREATE TRIGGER handle_updated_at_products
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Notes table triggers (may already exist)
DROP TRIGGER IF EXISTS handle_updated_at_notes ON public.notes;
CREATE TRIGGER handle_updated_at_notes
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- AI tables triggers
DROP TRIGGER IF EXISTS handle_updated_at_ai_analysis ON public.ai_analysis;
CREATE TRIGGER handle_updated_at_ai_analysis
  BEFORE UPDATE ON public.ai_analysis
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_ai_conversations ON public.ai_conversations;
CREATE TRIGGER handle_updated_at_ai_conversations
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_branch_stock ON public.branch_stock;
CREATE TRIGGER handle_updated_at_branch_stock
  BEFORE UPDATE ON public.branch_stock
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_summaries ON public.summaries;
CREATE TRIGGER handle_updated_at_summaries
  BEFORE UPDATE ON public.summaries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- PART 4: ENSURE MISSING TABLES FROM SYNC PLAN EXIST
-- ============================================================================

-- Owners table (from ChatGPT plan - ensure it exists with proper sync columns)
CREATE TABLE IF NOT EXISTS public.owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add sync columns to owners table if they don't exist
DO $$
BEGIN
    -- Add local_uuid if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'owners' AND column_name = 'local_uuid'
    ) THEN
        ALTER TABLE public.owners ADD COLUMN local_uuid TEXT UNIQUE;
    END IF;
    
    -- Add deleted if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'owners' AND column_name = 'deleted'
    ) THEN
        ALTER TABLE public.owners ADD COLUMN deleted BOOLEAN DEFAULT false;
    END IF;
END
$$;

-- Branches table (from ChatGPT plan - ensure it exists with proper sync columns)  
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES owners(id),
    name TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add sync columns to branches table if they don't exist
DO $$
BEGIN
    -- Add local_uuid if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'branches' AND column_name = 'local_uuid'
    ) THEN
        ALTER TABLE public.branches ADD COLUMN local_uuid TEXT UNIQUE;
    END IF;
    
    -- Add deleted if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'branches' AND column_name = 'deleted'
    ) THEN
        ALTER TABLE public.branches ADD COLUMN deleted BOOLEAN DEFAULT false;
    END IF;
END
$$;

-- Lots table (from ChatGPT plan - may already exist but ensure sync columns)
-- Check if exists and add sync columns if needed
DO $$
BEGIN
    -- Add local_uuid if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lots' AND column_name = 'local_uuid'
    ) THEN
        ALTER TABLE public.lots ADD COLUMN local_uuid TEXT UNIQUE;
    END IF;
    
    -- Add updated_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lots' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.lots ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add deleted if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lots' AND column_name = 'deleted'
    ) THEN
        ALTER TABLE public.lots ADD COLUMN deleted BOOLEAN DEFAULT false;
    END IF;
END
$$;

-- Operations table already has local_uuid, but ensure updated_at and deleted
DO $$
BEGIN
    -- Add updated_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'operations' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.operations ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add deleted if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'operations' AND column_name = 'deleted'
    ) THEN
        ALTER TABLE public.operations ADD COLUMN deleted BOOLEAN DEFAULT false;
    END IF;
END
$$;

-- Add triggers for new/updated tables
DROP TRIGGER IF EXISTS handle_updated_at_owners ON public.owners;
CREATE TRIGGER handle_updated_at_owners
  BEFORE UPDATE ON public.owners
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_branches ON public.branches;
CREATE TRIGGER handle_updated_at_branches
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add triggers for lots if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lots') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS handle_updated_at_lots ON public.lots';
        EXECUTE 'CREATE TRIGGER handle_updated_at_lots
          BEFORE UPDATE ON public.lots
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()';
    END IF;
END
$$;

-- Add triggers for operations if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'operations') THEN
        EXECUTE 'DROP TRIGGER IF EXISTS handle_updated_at_operations ON public.operations';
        EXECUTE 'CREATE TRIGGER handle_updated_at_operations
          BEFORE UPDATE ON public.operations
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()';
    END IF;
END
$$;

-- ============================================================================
-- PART 5: ENSURE SIMILARITY SEARCH FUNCTION EXISTS (FOR RAG)
-- ============================================================================

-- Create similarity search function for note embeddings
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
-- PART 6: CREATE INDEXES FOR SYNC PERFORMANCE
-- ============================================================================

-- Add indexes for sync columns to improve performance
-- Note: CONCURRENTLY removed to allow running in transaction block
CREATE INDEX IF NOT EXISTS idx_user_profiles_local_uuid ON public.user_profiles(local_uuid);
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at ON public.user_profiles(updated_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_deleted ON public.user_profiles(deleted);

CREATE INDEX IF NOT EXISTS idx_products_local_uuid ON public.products(local_uuid);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON public.products(updated_at);
CREATE INDEX IF NOT EXISTS idx_products_deleted ON public.products(deleted);

CREATE INDEX IF NOT EXISTS idx_sales_local_uuid ON public.sales(local_uuid);
CREATE INDEX IF NOT EXISTS idx_sales_updated_at ON public.sales(updated_at);
CREATE INDEX IF NOT EXISTS idx_sales_deleted ON public.sales(deleted);

CREATE INDEX IF NOT EXISTS idx_expenses_local_uuid ON public.expenses(local_uuid);
CREATE INDEX IF NOT EXISTS idx_expenses_updated_at ON public.expenses(updated_at);
CREATE INDEX IF NOT EXISTS idx_expenses_deleted ON public.expenses(deleted);

CREATE INDEX IF NOT EXISTS idx_notes_local_uuid ON public.notes(local_uuid);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON public.notes(updated_at);
CREATE INDEX IF NOT EXISTS idx_notes_deleted ON public.notes(deleted);

-- ============================================================================
-- PART 7: SEED DEFAULT OWNER AND BRANCH (OPTIONAL)
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
-- MIGRATION COMPLETE
-- ============================================================================

-- Verification queries (comment out for production)
/*
SELECT 'Migration Status' as status;
SELECT 'Tables with sync columns:' as info;
SELECT 
    table_name,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = t.table_name AND column_name = 'local_uuid') as has_local_uuid,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = t.table_name AND column_name = 'updated_at') as has_updated_at,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = t.table_name AND column_name = 'deleted') as has_deleted
FROM (VALUES 
    ('user_profiles'), ('products'), ('sales'), ('expenses'), 
    ('notes'), ('owners'), ('branches'), ('operations'), ('lots')
) t(table_name);
*/