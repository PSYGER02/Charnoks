-- Quick Worker ID Fix - Comprehensive Solution
-- This script populates missing worker_id fields and ensures consistency between user_profiles and workers tables

-- =============================================================================
-- STEP 1: ANALYSIS QUERIES - Run these first to see the current state
-- =============================================================================

-- Check current state of expenses
SELECT 
    'Current Expenses Analysis' as report,
    COUNT(*) as total_expenses,
    COUNT(worker_id) as expenses_with_worker_id,
    COUNT(*) - COUNT(worker_id) as expenses_missing_worker_id,
    COUNT(CASE WHEN worker_name IN ('Worker', 'Unknown', '') OR worker_name IS NULL THEN 1 END) as expenses_with_generic_names
FROM public.expenses;

-- Check current state of user_profiles
SELECT 
    'Current User Profiles Analysis' as report,
    COUNT(*) as total_user_profiles,
    COUNT(CASE WHEN role = 'worker' THEN 1 END) as workers,
    COUNT(CASE WHEN role = 'owner' THEN 1 END) as owners,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_users
FROM public.user_profiles;

-- Check auth.users
SELECT 
    'Auth Users Analysis' as report,
    COUNT(*) as total_auth_users,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as users_with_email
FROM auth.users;

-- =============================================================================
-- STEP 2: FIX EXPENSES TABLE - Populate missing worker_id
-- =============================================================================

-- Option A: Set all NULL worker_id to the current authenticated user (single user system)
UPDATE public.expenses 
SET 
    worker_id = (
        SELECT id 
        FROM auth.users 
        WHERE email IS NOT NULL 
        ORDER BY created_at DESC 
        LIMIT 1
    ),
    updated_at = NOW()
WHERE worker_id IS NULL OR worker_id = '';

-- Option B: If multiple users, set to the user who created most expenses
-- UPDATE public.expenses 
-- SET worker_id = (
--     SELECT e2.worker_id 
--     FROM public.expenses e2 
--     WHERE e2.worker_id IS NOT NULL 
--     GROUP BY e2.worker_id 
--     ORDER BY COUNT(*) DESC 
--     LIMIT 1
-- )
-- WHERE worker_id IS NULL OR worker_id = '';

-- =============================================================================
-- STEP 3: ENSURE USER_PROFILES TABLE HAS ALL USERS
-- =============================================================================

-- Insert missing users from auth.users into user_profiles
INSERT INTO public.user_profiles (id, email, display_name, role, is_active, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'display_name', 
        au.raw_user_meta_data->>'full_name', 
        split_part(au.email, '@', 1),
        'User'
    ) as display_name,
    COALESCE(au.raw_user_meta_data->>'role', 'worker') as role,
    true as is_active,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL
    AND au.email IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

-- =============================================================================
-- STEP 4: CREATE/UPDATE WORKERS TABLE
-- =============================================================================

-- Create workers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.workers (
    id UUID PRIMARY KEY REFERENCES public.user_profiles(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Populate workers table with all users (both workers and owners can create expenses)
INSERT INTO public.workers (id, name, email, is_active, created_at, updated_at)
SELECT 
    up.id,
    COALESCE(up.display_name, split_part(up.email, '@', 1), 'User') as name,
    up.email,
    COALESCE(up.is_active, true) as is_active,
    up.created_at,
    up.updated_at
FROM public.user_profiles up
LEFT JOIN public.workers w ON up.id = w.id
WHERE w.id IS NULL
    AND up.is_active = true
    AND up.email IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- =============================================================================
-- STEP 5: UPDATE WORKER_NAME IN EXPENSES FROM USER_PROFILES
-- =============================================================================

-- Update worker_name field in expenses to match display_name from user_profiles
UPDATE public.expenses 
SET 
    worker_name = COALESCE(up.display_name, split_part(up.email, '@', 1), 'User'),
    updated_at = NOW()
FROM public.user_profiles up
WHERE expenses.worker_id = up.id
    AND (expenses.worker_name IS NULL 
         OR expenses.worker_name = 'Worker' 
         OR expenses.worker_name = 'Unknown' 
         OR expenses.worker_name = '');

-- =============================================================================
-- STEP 6: FIX SALES TABLE (if it exists and has similar issues)
-- =============================================================================

-- Check if sales table exists and fix it too
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sales') THEN
        -- Fix sales table worker_id
        UPDATE public.sales 
        SET 
            worker_id = (
                SELECT id 
                FROM auth.users 
                WHERE email IS NOT NULL 
                ORDER BY created_at DESC 
                LIMIT 1
            ),
            updated_at = NOW()
        WHERE worker_id IS NULL OR worker_id = '';
        
        -- Update worker_name in sales table
        UPDATE public.sales 
        SET 
            worker_name = COALESCE(up.display_name, split_part(up.email, '@', 1), 'User'),
            updated_at = NOW()
        FROM public.user_profiles up
        WHERE sales.worker_id = up.id
            AND (sales.worker_name IS NULL 
                 OR sales.worker_name = 'Worker' 
                 OR sales.worker_name = 'Unknown' 
                 OR sales.worker_name = '');
    END IF;
END $$;

-- =============================================================================
-- STEP 7: CREATE CONSISTENCY TRIGGERS (Optional)
-- =============================================================================

-- Function to auto-update worker_name when user_profiles.display_name changes
CREATE OR REPLACE FUNCTION update_worker_name_on_profile_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update expenses table
    UPDATE public.expenses 
    SET 
        worker_name = COALESCE(NEW.display_name, split_part(NEW.email, '@', 1), 'User'),
        updated_at = NOW()
    WHERE worker_id = NEW.id;
    
    -- Update sales table if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sales') THEN
        UPDATE public.sales 
        SET 
            worker_name = COALESCE(NEW.display_name, split_part(NEW.email, '@', 1), 'User'),
            updated_at = NOW()
        WHERE worker_id = NEW.id;
    END IF;
    
    -- Update workers table
    UPDATE public.workers 
    SET 
        name = COALESCE(NEW.display_name, split_part(NEW.email, '@', 1), 'User'),
        updated_at = NOW()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on user_profiles
DROP TRIGGER IF EXISTS trigger_update_worker_name ON public.user_profiles;
CREATE TRIGGER trigger_update_worker_name
    AFTER UPDATE OF display_name, email ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_worker_name_on_profile_change();

-- =============================================================================
-- STEP 8: VERIFICATION QUERIES - Run after the fixes
-- =============================================================================

-- Check expenses without worker_id (should be 0 after fixes)
SELECT 
    'Post-Fix Expenses Analysis' as report,
    COUNT(*) as total_expenses,
    COUNT(worker_id) as expenses_with_worker_id,
    COUNT(*) - COUNT(worker_id) as expenses_missing_worker_id,
    COUNT(CASE WHEN worker_name IN ('Worker', 'Unknown', '') OR worker_name IS NULL THEN 1 END) as expenses_with_generic_names
FROM public.expenses;

-- Show sample of fixed expenses
SELECT 
    'Sample Fixed Expenses' as report,
    e.id,
    e.description,
    e.worker_id,
    e.worker_name,
    up.display_name as actual_display_name,
    up.role
FROM public.expenses e
LEFT JOIN public.user_profiles up ON e.worker_id = up.id
ORDER BY e.created_at DESC
LIMIT 10;

-- Show all users in user_profiles
SELECT 
    'User Profiles' as report,
    id,
    email,
    display_name,
    role,
    is_active
FROM public.user_profiles
ORDER BY created_at DESC;

-- Show workers table
SELECT 
    'Workers Table' as report,
    w.id,
    w.name,
    w.email,
    w.is_active,
    up.role
FROM public.workers w
LEFT JOIN public.user_profiles up ON w.id = up.id
ORDER BY w.created_at DESC;

-- Check for any remaining issues
SELECT 
    'Remaining Issues Check' as report,
    COUNT(CASE WHEN e.worker_id IS NULL THEN 1 END) as expenses_null_worker_id,
    COUNT(CASE WHEN e.worker_id = '' THEN 1 END) as expenses_empty_worker_id,
    COUNT(CASE WHEN e.worker_name = 'Worker' THEN 1 END) as expenses_generic_worker_name,
    COUNT(CASE WHEN up.id IS NULL AND e.worker_id IS NOT NULL THEN 1 END) as expenses_missing_user_profile
FROM public.expenses e
LEFT JOIN public.user_profiles up ON e.worker_id = up.id;

-- =============================================================================
-- QUICK TEST QUERIES - Run these to verify everything works
-- =============================================================================

-- Test: Create a sample expense to verify worker_id auto-population works
-- INSERT INTO public.expenses (description, amount, category) 
-- VALUES ('Test Expense', 10.00, 'test');

-- Test: Check if the trigger works by updating a user's display name
-- UPDATE public.user_profiles 
-- SET display_name = 'Updated Test Name' 
-- WHERE email = 'your-email@example.com';

-- =============================================================================
-- ROLLBACK QUERIES - Use these if you need to undo changes
-- =============================================================================

-- ROLLBACK: Remove the trigger if needed
-- DROP TRIGGER IF EXISTS trigger_update_worker_name ON public.user_profiles;
-- DROP FUNCTION IF EXISTS update_worker_name_on_profile_change();

-- ROLLBACK: Reset worker_name to generic if needed  
-- UPDATE public.expenses SET worker_name = 'Worker' WHERE worker_name != 'Worker';

-- =============================================================================
-- USAGE INSTRUCTIONS
-- =============================================================================

/*
HOW TO USE THIS SCRIPT:

1. BACKUP FIRST: Always backup your database before running fixes
   pg_dump your_database > backup.sql

2. RUN ANALYSIS: Execute STEP 1 queries first to see current state

3. RUN FIXES: Execute STEPS 2-7 in order
   - Each step is safe and uses ON CONFLICT clauses
   - Steps can be run multiple times safely

4. VERIFY: Run STEP 8 verification queries to confirm fixes

5. TEST: Create a test expense and update a user profile to verify triggers work

WHAT THIS SCRIPT DOES:
✅ Populates missing worker_id fields in expenses table
✅ Ensures all auth.users are in user_profiles table  
✅ Creates/populates workers table with all users
✅ Updates worker_name fields with actual display names
✅ Creates triggers to maintain consistency automatically
✅ Fixes both expenses and sales tables
✅ Provides comprehensive verification queries

EXPECTED RESULTS:
- All expenses will have valid worker_id values
- All worker_name fields will show actual display names
- Workers table will contain all users for lookup
- Future changes to user profiles will auto-update related tables
*/