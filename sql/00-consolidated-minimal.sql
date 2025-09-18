-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Core tables
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    role TEXT CHECK (role IN ('owner', 'worker')) DEFAULT 'worker',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    items JSONB NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    payment DECIMAL(10,2) NOT NULL,
    change_due DECIMAL(10,2) NOT NULL DEFAULT 0,
    worker_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category TEXT DEFAULT 'general',
    worker_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes (unified from 3 versions)
CREATE TABLE IF NOT EXISTS notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    title TEXT,
    category TEXT,
    user_role TEXT CHECK (user_role IN ('owner', 'worker')),
    parsed_data JSONB,
    status TEXT DEFAULT 'pending',
    amount DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ChatGPT plan tables
CREATE TABLE IF NOT EXISTS owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES owners(id),
    name TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    origin_branch_id UUID REFERENCES branches(id),
    bag_count INTEGER,
    parts_per_bag INTEGER,
    lot_tag TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_uuid TEXT UNIQUE NOT NULL,
    lot_id UUID REFERENCES lots(id),
    branch_id UUID REFERENCES branches(id),
    worker_id UUID REFERENCES user_profiles(id),
    op_type TEXT NOT NULL CHECK (op_type IN ('purchase', 'receive', 'package', 'transfer_out', 'transfer_in', 'cook', 'sale', 'waste')),
    quantity_parts INTEGER,
    quantity_bags INTEGER,
    metadata JSONB,
    synced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS note_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID REFERENCES notes(id),
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics tables
CREATE TABLE IF NOT EXISTS summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id UUID REFERENCES branches(id),
    date DATE NOT NULL,
    summary JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branch_stock (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id UUID REFERENCES branches(id),
    product_name TEXT NOT NULL,
    allocated NUMERIC DEFAULT 0,
    used NUMERIC DEFAULT 0,
    leftover NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workers (
    id UUID PRIMARY KEY REFERENCES user_profiles(id),
    name TEXT NOT NULL,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI tables
CREATE TABLE IF NOT EXISTS ai_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    analysis_type TEXT NOT NULL,
    content JSONB NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sales_worker_date ON sales(worker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_worker_date ON expenses(worker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operations_type ON operations(op_type);
CREATE INDEX IF NOT EXISTS idx_operations_branch ON operations(branch_id);
CREATE INDEX IF NOT EXISTS idx_note_embeddings_note ON note_embeddings(note_id);

-- Similarity search function
CREATE OR REPLACE FUNCTION match_notes(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (id UUID, content TEXT, similarity FLOAT)
LANGUAGE SQL STABLE
AS $$
    SELECT n.id, n.content, 1 - (ne.embedding <=> query_embedding) AS similarity
    FROM notes n
    JOIN note_embeddings ne ON n.id = ne.note_id
    WHERE 1 - (ne.embedding <=> query_embedding) > match_threshold
    ORDER BY ne.embedding <=> query_embedding
    LIMIT match_count;
$$;