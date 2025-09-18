-- Missing tables from original ChatGPT plan
-- Enable pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Owners table
CREATE TABLE IF NOT EXISTS public.owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Branches table  
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES owners(id),
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Operations table (from ChatGPT plan)
CREATE TABLE IF NOT EXISTS public.operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_uuid TEXT UNIQUE NOT NULL,
  lot_id UUID,
  branch_id UUID REFERENCES branches(id),
  worker_id UUID REFERENCES user_profiles(id),
  op_type TEXT NOT NULL CHECK (op_type IN ('purchase', 'receive', 'package', 'transfer_out', 'transfer_in', 'cook', 'sale', 'waste')),
  quantity_parts INTEGER,
  quantity_bags INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced BOOLEAN DEFAULT FALSE
);

-- Lots table (from ChatGPT plan)
CREATE TABLE IF NOT EXISTS public.lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  origin_branch_id UUID REFERENCES branches(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  bag_count INTEGER,
  parts_per_bag INTEGER,
  lot_tag TEXT
);

-- Note embeddings for RAG
CREATE TABLE IF NOT EXISTS public.note_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES notes(id),
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_operations_type ON operations(op_type);
CREATE INDEX IF NOT EXISTS idx_operations_branch ON operations(branch_id);
CREATE INDEX IF NOT EXISTS idx_lots_product ON lots(product_id);
CREATE INDEX IF NOT EXISTS idx_note_embeddings_note ON note_embeddings(note_id);