-- Fix Worker ID Population and Data Consistency
-- Run this in Supabase SQL Editor to fix missing worker_id fields

-- =============================================================================
-- STEP 1: Ensure all authenticated users have profiles
-- =============================================================================

-- Create user profiles for users who don't have them yet
INSERT INTO public.user_profiles (id, email, display_name, role, is_active, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'display_name', au.email),
    COALESCE(au.raw_user_meta_data->>'role', 'worker'),
    true,
    au.created_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- =============================================================================
-- STEP 2: Fix expenses table - populate missing worker_id
-- =============================================================================

-- For expenses with missing worker_id, try to infer from context
-- Option A: Set to the first active user (owner) for legacy records
UPDATE public.expenses 
SET worker_id = (
    SELECT id 
    FROM public.user_profiles 
    WHERE role = 'owner' AND is_active = true 
    LIMIT 1
)
WHERE worker_id IS NULL OR worker_id = '';

-- Alternative Option B: If you want to set all to a specific user
-- UPDATE public.expenses 
-- SET worker_id = 'YOUR_USER_ID_HERE'
-- WHERE worker_id IS NULL OR worker_id = '';

-- =============================================================================
-- STEP 3: Fix sales table - populate missing worker_id
-- =============================================================================

-- For sales with missing worker_id, set to owner
UPDATE public.sales 
SET worker_id = (
    SELECT id 
    FROM public.user_profiles 
    WHERE role = 'owner' AND is_active = true 
    LIMIT 1
)
WHERE worker_id IS NULL OR worker_id = '';

-- =============================================================================
-- STEP 4: Sync workers table with user_profiles
-- =============================================================================

-- Insert users into workers table who should be workers but aren't there yet
INSERT INTO public.workers (id, name, email, is_active, created_at)
SELECT 
    up.id,
    up.display_name,
    up.email,
    up.is_active,
    up.created_at
FROM public.user_profiles up
LEFT JOIN public.workers w ON up.id = w.id
WHERE w.id IS NULL 
  AND up.is_active = true;

-- Update existing workers with latest data from user_profiles
UPDATE public.workers 
SET 
    name = up.display_name,
    email = up.email,
    is_active = up.is_active
FROM public.user_profiles up
WHERE workers.id = up.id
  AND (workers.name != up.display_name 
       OR workers.email != up.email 
       OR workers.is_active != up.is_active);

-- =============================================================================
-- STEP 5: Update worker_name fields with proper display names
-- =============================================================================

-- Update expenses table with proper worker names
UPDATE public.expenses 
SET worker_name = up.display_name
FROM public.user_profiles up
WHERE expenses.worker_id = up.id 
  AND (expenses.worker_name IS NULL 
       OR expenses.worker_name = 'Worker' 
       OR expenses.worker_name = 'Unknown'
       OR expenses.worker_name != up.display_name);

-- Update sales table with proper worker names
UPDATE public.sales 
SET worker_name = up.display_name
FROM public.user_profiles up
WHERE sales.worker_id = up.id 
  AND (sales.worker_name IS NULL 
       OR sales.worker_name = 'Worker' 
       OR sales.worker_name = 'Unknown'
       OR sales.worker_name != up.display_name);

-- =============================================================================
-- STEP 6: Add constraints to prevent future issues
-- =============================================================================

-- Ensure worker_id references valid users
DO $$
BEGIN
    -- Add foreign key constraint for expenses if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'expenses_worker_id_fkey' 
        AND table_name = 'expenses'
    ) THEN
        ALTER TABLE public.expenses 
        ADD CONSTRAINT expenses_worker_id_fkey 
        FOREIGN KEY (worker_id) REFERENCES public.user_profiles(id);
    END IF;

    -- Add foreign key constraint for sales if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'sales_worker_id_fkey' 
        AND table_name = 'sales'
    ) THEN
        ALTER TABLE public.sales 
        ADD CONSTRAINT sales_worker_id_fkey 
        FOREIGN KEY (worker_id) REFERENCES public.user_profiles(id);
    END IF;
END $$;

-- =============================================================================
-- STEP 7: Create triggers to keep data in sync
-- =============================================================================

-- Function to automatically update worker_name when worker_id changes
CREATE OR REPLACE FUNCTION update_worker_name_from_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Update worker_name based on worker_id
    IF NEW.worker_id IS NOT NULL THEN
        SELECT display_name INTO NEW.worker_name
        FROM public.user_profiles
        WHERE id = NEW.worker_id;
        
        -- Fallback if no profile found
        IF NEW.worker_name IS NULL THEN
            NEW.worker_name := 'Unknown User';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for expenses table
DROP TRIGGER IF EXISTS update_expenses_worker_name ON public.expenses;
CREATE TRIGGER update_expenses_worker_name
    BEFORE INSERT OR UPDATE ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_worker_name_from_profile();

-- Create triggers for sales table
DROP TRIGGER IF EXISTS update_sales_worker_name ON public.sales;
CREATE TRIGGER update_sales_worker_name
    BEFORE INSERT OR UPDATE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION update_worker_name_from_profile();

-- =============================================================================
-- STEP 8: Verification queries
-- =============================================================================

-- Check results
SELECT 'Expenses with missing worker_id' as check_name, COUNT(*) as count
FROM public.expenses 
WHERE worker_id IS NULL OR worker_id = ''
UNION ALL
SELECT 'Sales with missing worker_id', COUNT(*)
FROM public.sales 
WHERE worker_id IS NULL OR worker_id = ''
UNION ALL
SELECT 'User profiles without workers entry', COUNT(*)
FROM public.user_profiles up
LEFT JOIN public.workers w ON up.id = w.id
WHERE w.id IS NULL AND up.is_active = true
UNION ALL
SELECT 'Expenses with generic worker names', COUNT(*)
FROM public.expenses 
WHERE worker_name IN ('Worker', 'Unknown', 'Unknown Worker')
UNION ALL
SELECT 'Total active users', COUNT(*)
FROM public.user_profiles 
WHERE is_active = true;