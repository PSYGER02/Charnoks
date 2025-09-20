-- ============================================================================
-- WORKER BRANCH SYSTEM SETUP
-- Add local_uuid and branch_id to user_profiles for chicken business AI
-- Note: worker_id in sales/expenses tables = user_profiles.id (same UUID)
-- ============================================================================

-- Add local_uuid column to user_profiles (for IndexedDB sync)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS local_uuid TEXT UNIQUE;

-- Add branch_id column to user_profiles (worker branch assignment)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS branch_id TEXT;

-- Add worker_code for easy identification
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS worker_code TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_local_uuid ON public.user_profiles(local_uuid);
CREATE INDEX IF NOT EXISTS idx_user_profiles_branch_id ON public.user_profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_worker_code ON public.user_profiles(worker_code);

-- ============================================================================
-- UPDATE EXISTING WORKERS WITH BRANCH_ID AND LOCAL_UUID
-- ============================================================================

-- Generate local_uuid for existing workers who don't have one
UPDATE public.user_profiles 
SET local_uuid = gen_random_uuid()::text
WHERE local_uuid IS NULL AND role = 'worker';

-- Generate branch_id for existing workers (using worker naming pattern)
-- Branch format: BRANCH-{first_3_letters_of_name}-{random_4_chars}
UPDATE public.user_profiles 
SET branch_id = CONCAT(
    'BRANCH-',
    UPPER(LEFT(COALESCE(display_name, email), 3)),
    '-',
    SUBSTRING(gen_random_uuid()::text, 1, 4)
)
WHERE branch_id IS NULL AND role = 'worker';

-- Generate worker_code for existing workers
-- Format: W-{first_2_letters}-{4_digit_sequence}
WITH numbered_workers AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY created_at) as row_num,
        UPPER(LEFT(COALESCE(display_name, email), 2)) as initials
    FROM public.user_profiles 
    WHERE worker_code IS NULL AND role = 'worker'
)
UPDATE public.user_profiles 
SET worker_code = CONCAT(
    'W-',
    numbered_workers.initials,
    '-',
    LPAD(numbered_workers.row_num::text, 4, '0')
)
FROM numbered_workers
WHERE public.user_profiles.id = numbered_workers.id;

-- ============================================================================
-- TRIGGER FUNCTIONS FOR AUTO-GENERATION
-- ============================================================================

-- Function to auto-generate worker fields on insert
CREATE OR REPLACE FUNCTION auto_generate_worker_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process workers
    IF NEW.role = 'worker' THEN
        -- Generate local_uuid if not provided
        IF NEW.local_uuid IS NULL THEN
            NEW.local_uuid := gen_random_uuid()::text;
        END IF;
        
        -- Generate branch_id if not provided
        IF NEW.branch_id IS NULL THEN
            NEW.branch_id := CONCAT(
                'BRANCH-',
                UPPER(LEFT(COALESCE(NEW.display_name, NEW.email), 3)),
                '-',
                SUBSTRING(gen_random_uuid()::text, 1, 4)
            );
        END IF;
        
        -- Generate worker_code if not provided
        IF NEW.worker_code IS NULL THEN
            NEW.worker_code := CONCAT(
                'W-',
                UPPER(LEFT(COALESCE(NEW.display_name, NEW.email), 2)),
                '-',
                SUBSTRING(gen_random_uuid()::text, 1, 4)
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generation
DROP TRIGGER IF EXISTS trigger_auto_generate_worker_fields ON public.user_profiles;
CREATE TRIGGER trigger_auto_generate_worker_fields
    BEFORE INSERT ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_worker_fields();

-- ============================================================================
-- ENHANCE EXISTING TABLES FOR AI PATTERN LEARNING
-- ============================================================================

-- Add local_uuid to sales table if not exists
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS local_uuid TEXT UNIQUE;

-- Add local_uuid to expenses table if not exists  
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS local_uuid TEXT UNIQUE;

-- Add AI pattern fields to notes table
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS business_type TEXT CHECK (business_type IN ('purchase', 'processing', 'distribution', 'cooking', 'sales', 'general'));

ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS learned_patterns JSONB;

ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1);

ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS branch_id TEXT;

ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS local_uuid TEXT UNIQUE;

-- Add indexes for AI queries
CREATE INDEX IF NOT EXISTS idx_notes_business_type ON public.notes(business_type);
CREATE INDEX IF NOT EXISTS idx_notes_branch_id ON public.notes(branch_id);
CREATE INDEX IF NOT EXISTS idx_notes_confidence_score ON public.notes(confidence_score);
CREATE INDEX IF NOT EXISTS idx_notes_local_uuid ON public.notes(local_uuid);

-- ============================================================================
-- UPDATE POLICIES FOR NEW COLUMNS
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Update existing policies to include new columns (if needed)
-- Workers can read their own profile and branch data
DROP POLICY IF EXISTS "Workers can view own profile and branch" ON public.user_profiles;
CREATE POLICY "Workers can view own profile and branch" ON public.user_profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        (role = 'worker' AND branch_id IN (
            SELECT branch_id FROM public.user_profiles WHERE id = auth.uid()
        ))
    );

-- Workers can update their own branch-related data
DROP POLICY IF EXISTS "Workers can update own branch data" ON public.user_profiles;
CREATE POLICY "Workers can update own branch data" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check worker profiles with new fields
-- Run these to verify the setup worked:

/*
-- 1. Verify all workers have local_uuid and branch_id
SELECT 
    id,
    display_name,
    email,
    role,
    local_uuid,
    branch_id,
    worker_code,
    created_at
FROM public.user_profiles 
WHERE role = 'worker'
ORDER BY created_at;

-- 2. Check for any missing fields
SELECT 
    COUNT(*) as total_workers,
    COUNT(local_uuid) as have_local_uuid,
    COUNT(branch_id) as have_branch_id,
    COUNT(worker_code) as have_worker_code
FROM public.user_profiles 
WHERE role = 'worker';

-- 3. Check notes table enhancements
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notes' 
AND column_name IN ('business_type', 'learned_patterns', 'confidence_score', 'branch_id', 'local_uuid')
ORDER BY column_name;

-- 4. Test branch-specific worker grouping
SELECT 
    branch_id,
    COUNT(*) as worker_count,
    STRING_AGG(display_name, ', ') as workers
FROM public.user_profiles 
WHERE role = 'worker' AND branch_id IS NOT NULL
GROUP BY branch_id
ORDER BY worker_count DESC;
*/

-- ============================================================================
-- SAMPLE DATA INSERTION (OPTIONAL - FOR TESTING)
-- ============================================================================

-- Uncomment to create sample data for testing:
/*
-- Insert sample owner (if none exists)
INSERT INTO public.user_profiles (email, display_name, role, local_uuid)
VALUES ('owner@charnoks.com', 'Main Owner', 'owner', gen_random_uuid()::text)
ON CONFLICT (email) DO NOTHING;

-- Insert sample workers for testing
INSERT INTO public.user_profiles (email, display_name, role)
VALUES 
    ('worker1@charnoks.com', 'Branch Alpha Worker', 'worker'),
    ('worker2@charnoks.com', 'Branch Beta Worker', 'worker'),
    ('worker3@charnoks.com', 'Branch Gamma Worker', 'worker')
ON CONFLICT (email) DO NOTHING;
*/