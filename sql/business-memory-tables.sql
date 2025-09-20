-- Business Memory System Tables for MCP Server
-- These tables support the business memory functionality for learning and context

-- Business Entities Table
-- Stores all business entities (suppliers, customers, workers, branches, products)
CREATE TABLE IF NOT EXISTS business_entities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('supplier', 'customer', 'worker', 'branch', 'product', 'business_period')),
    attributes JSONB DEFAULT '{}'::jsonb,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique entity names per type
    CONSTRAINT unique_entity_name_type UNIQUE(name, entity_type)
);

-- Business Relations Table
-- Stores relationships between business entities
CREATE TABLE IF NOT EXISTS business_relations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_entity TEXT NOT NULL,
    to_entity TEXT NOT NULL,
    relation_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique relations
    CONSTRAINT unique_relation UNIQUE(from_entity, to_entity, relation_type)
);

-- Business Observations Table
-- Stores learning observations about business entities
CREATE TABLE IF NOT EXISTS business_observations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_name TEXT NOT NULL,
    observation TEXT NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
    source TEXT NOT NULL CHECK (source IN ('ai_learning', 'user_input', 'system_analysis')),
    created_by TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_entities_type ON business_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_business_entities_name ON business_entities(name);
CREATE INDEX IF NOT EXISTS idx_business_relations_from ON business_relations(from_entity);
CREATE INDEX IF NOT EXISTS idx_business_relations_to ON business_relations(to_entity);
CREATE INDEX IF NOT EXISTS idx_business_observations_entity ON business_observations(entity_name);
CREATE INDEX IF NOT EXISTS idx_business_observations_timestamp ON business_observations(timestamp DESC);

-- Full text search indexes
CREATE INDEX IF NOT EXISTS idx_business_observations_text_search 
ON business_observations USING GIN(to_tsvector('english', observation));

-- Row Level Security (RLS) Policies
ALTER TABLE business_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_observations ENABLE ROW LEVEL SECURITY;

-- Policies for business_entities
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read business entities" 
ON business_entities FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert business entities" 
ON business_entities FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to update business entities" 
ON business_entities FOR UPDATE 
TO authenticated 
USING (true);

-- Policies for business_relations
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read business relations" 
ON business_relations FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert business relations" 
ON business_relations FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policies for business_observations
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read business observations" 
ON business_observations FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert business observations" 
ON business_observations FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Function to automatically update last_updated timestamp
CREATE OR REPLACE FUNCTION update_business_entity_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp on business_entities
DROP TRIGGER IF EXISTS update_business_entities_timestamp ON business_entities;
CREATE TRIGGER update_business_entities_timestamp
    BEFORE UPDATE ON business_entities
    FOR EACH ROW
    EXECUTE FUNCTION update_business_entity_timestamp();

-- Sample data to initialize basic knowledge
-- This will be handled by the initialize_business_knowledge MCP tool