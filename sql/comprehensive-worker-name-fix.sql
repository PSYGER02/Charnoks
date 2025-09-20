-- Comprehensive Worker Name Fix Script
-- This will fix all existing expense records to have proper worker names
-- Run this in your Supabase SQL Editor

-- =============================================================================
-- STEP 1: Update all expenses with proper worker names from user_profiles
-- =============================================================================

-- Update expenses that have worker_id but bad worker_name
UPDATE public.expenses 
SET 
    worker_name = COALESCE(up.display_name, split_part(up.email, '@', 1), 'Unknown Worker'),
    updated_at = NOW()
FROM public.user_profiles up
WHERE expenses.worker_id = up.id
    AND (
        expenses.worker_name IS NULL 
        OR expenses.worker_name = '' 
        OR expenses.worker_name = 'Worker' 
        OR expenses.worker_name = 'Unknown' 
        OR expenses.worker_name = 'Unknown Worker'
        OR expenses.worker_name = 'User'
        OR expenses.worker_name = 'Legacy User'
    );

-- =============================================================================
-- STEP 2: Fix expenses with missing worker_id (set to first available user)
-- =============================================================================

-- For expenses without worker_id, set to the first available user
UPDATE public.expenses 
SET 
    worker_id = (
        SELECT id 
        FROM public.user_profiles 
        WHERE is_active = true 
        ORDER BY created_at ASC 
        LIMIT 1
    ),
    updated_at = NOW()
WHERE worker_id IS NULL OR worker_id = '';

-- Update worker_name for records that just got worker_id assigned
UPDATE public.expenses 
SET 
    worker_name = COALESCE(up.display_name, split_part(up.email, '@', 1), 'Unknown Worker'),
    updated_at = NOW()
FROM public.user_profiles up
WHERE expenses.worker_id = up.id
    AND (
        expenses.worker_name IS NULL 
        OR expenses.worker_name = '' 
        OR expenses.worker_name = 'Worker' 
        OR expenses.worker_name = 'Unknown Worker'
    );

-- =============================================================================
-- STEP 3: Create trigger to automatically maintain worker_name
-- =============================================================================

-- Function to automatically update worker_name when records are inserted/updated
CREATE OR REPLACE FUNCTION public.update_worker_name_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- If worker_id is provided, get the display name from user_profiles
    IF NEW.worker_id IS NOT NULL THEN
        SELECT COALESCE(display_name, split_part(email, '@', 1), 'Unknown Worker')
        INTO NEW.worker_name
        FROM public.user_profiles
        WHERE id = NEW.worker_id
        AND is_active = true;
        
        -- If no profile found, keep existing worker_name or set to Unknown
        IF NEW.worker_name IS NULL THEN
            NEW.worker_name := COALESCE(OLD.worker_name, 'Unknown Worker');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for expenses table
DROP TRIGGER IF EXISTS trigger_update_expense_worker_name ON public.expenses;
CREATE TRIGGER trigger_update_expense_worker_name
    BEFORE INSERT OR UPDATE ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_worker_name_trigger();

-- =============================================================================
-- STEP 4: Fix sales table if it exists (same pattern)
-- =============================================================================

-- Check if sales table exists and apply same fixes
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sales' AND table_schema = 'public') THEN
        -- Update sales worker names
        UPDATE public.sales 
        SET 
            worker_name = COALESCE(up.display_name, split_part(up.email, '@', 1), 'Unknown Worker'),
            updated_at = NOW()
        FROM public.user_profiles up
        WHERE sales.worker_id = up.id
            AND (
                sales.worker_name IS NULL 
                OR sales.worker_name = '' 
                OR sales.worker_name = 'Worker' 
                OR sales.worker_name = 'Unknown Worker'
            );
            
        -- Fix missing worker_id in sales
        UPDATE public.sales 
        SET 
            worker_id = (
                SELECT id 
                FROM public.user_profiles 
                WHERE is_active = true 
                ORDER BY created_at ASC 
                LIMIT 1
            ),
            updated_at = NOW()
        WHERE worker_id IS NULL OR worker_id = '';
        
        -- Create trigger for sales table
        DROP TRIGGER IF EXISTS trigger_update_sales_worker_name ON public.sales;
        CREATE TRIGGER trigger_update_sales_worker_name
            BEFORE INSERT OR UPDATE ON public.sales
            FOR EACH ROW
            EXECUTE FUNCTION public.update_worker_name_trigger();
    END IF;
END $$;

-- =============================================================================
-- STEP 5: Verification queries
-- =============================================================================

-- Check the results
SELECT 
    'Fixed Expenses Analysis' as report,
    COUNT(*) as total_expenses,
    COUNT(CASE WHEN worker_id IS NOT NULL THEN 1 END) as expenses_with_worker_id,
    COUNT(CASE WHEN worker_name NOT IN ('Worker', 'Unknown', 'Unknown Worker', 'User', 'Legacy User', '') AND worker_name IS NOT NULL THEN 1 END) as expenses_with_proper_names,
    COUNT(CASE WHEN worker_name IN ('Worker', 'Unknown', 'Unknown Worker', 'User', 'Legacy User', '') OR worker_name IS NULL THEN 1 END) as expenses_still_generic
FROM public.expenses;

-- Show sample of fixed records
SELECT 
    'Sample Fixed Records' as report,
    e.id,
    e.description,
    e.worker_id,
    e.worker_name,
    up.display_name as profile_display_name,
    up.email as profile_email
FROM public.expenses e
LEFT JOIN public.user_profiles up ON e.worker_id = up.id
ORDER BY e.created_at DESC
LIMIT 10;

-- Show any remaining problematic records
SELECT 
    'Remaining Issues' as report,
    COUNT(CASE WHEN worker_id IS NULL OR worker_id = '' THEN 1 END) as missing_worker_id,
    COUNT(CASE WHEN worker_name IN ('Worker', 'Unknown', 'Unknown Worker', 'User', 'Legacy User') OR worker_name IS NULL THEN 1 END) as generic_worker_names
FROM public.expenses;

-- =============================================================================
-- STEP 6: Add RLS policies for security (optional but recommended)
-- =============================================================================

-- Enable RLS on expenses table
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see all expenses if they're owners, or only their own if they're workers
CREATE POLICY "Users can view expenses" ON public.expenses
    FOR SELECT USING (
        auth.uid() = worker_id 
        OR EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role = 'owner'
        )
    );

-- Policy: Users can insert expenses with their own worker_id
CREATE POLICY "Users can create expenses" ON public.expenses
    FOR INSERT WITH CHECK (
        auth.uid() = worker_id
    );

-- Policy: Users can update their own expenses, owners can update any
CREATE POLICY "Users can update expenses" ON public.expenses
    FOR UPDATE USING (
        auth.uid() = worker_id 
        OR EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role = 'owner'
        )
    );

-- =============================================================================
-- USAGE INSTRUCTIONS
-- =============================================================================

/*
WHAT THIS SCRIPT DOES:
✅ Updates all existing expenses to have proper worker names from user_profiles
✅ Fixes missing worker_id fields by assigning to first available user
✅ Creates triggers to automatically maintain worker_name consistency
✅ Applies same fixes to sales table if it exists
✅ Adds RLS policies for proper security
✅ Provides verification queries to confirm success

EXPECTED RESULTS:
- All expenses should have valid worker_id values
- All worker_name fields should show actual display names (no more "Worker", "Unknown Worker", etc.)
- Future expenses will automatically get correct worker names via triggers
- Proper security via RLS policies

TO VERIFY SUCCESS:
Run the verification queries at the end to confirm:
- expenses_still_generic should be 0
- missing_worker_id should be 0
- Sample records should show proper display names
*/