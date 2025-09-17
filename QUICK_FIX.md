# Quick Database Fix

## Problem
- Foreign key relationships missing between tables
- Worker names showing as "Unknown" 
- TransactionsPage and ExpensesPage not loading data

## Solution Applied

### 1. Removed Problematic Joins
- Updated `salesService.ts` and `expenseService.ts` to not use joins
- Services now work without foreign key relationships

### 2. Added Background Data Fixing
- Created `dataFixService.ts` to fix worker names automatically
- Services now detect and fix missing worker names in background

### 3. Auto Profile Creation
- Updated auth handler to create user profiles when missing
- Prevents "Profile not found" errors

## Manual Database Fix (Run in Supabase SQL Editor)

```sql
-- Ensure user_profiles table exists
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  role TEXT DEFAULT 'owner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profile for current user if missing
INSERT INTO user_profiles (id, email, display_name, role)
SELECT 
  auth.uid(),
  auth.email(),
  split_part(auth.email(), '@', 1),
  'owner'
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles WHERE id = auth.uid()
);

-- Fix existing sales records
UPDATE sales 
SET worker_name = COALESCE(
  (SELECT display_name FROM user_profiles WHERE id = sales.worker_id),
  split_part((SELECT email FROM auth.users WHERE id = sales.worker_id), '@', 1),
  'Worker'
)
WHERE worker_name IS NULL OR worker_name IN ('Unknown', 'Worker');

-- Fix existing expense records  
UPDATE expenses
SET worker_name = COALESCE(
  (SELECT display_name FROM user_profiles WHERE id = expenses.worker_id),
  split_part((SELECT email FROM auth.users WHERE id = expenses.worker_id), '@', 1),
  'Worker'
)
WHERE worker_name IS NULL OR worker_name IN ('Unknown', 'Worker');
```

## Expected Result
- ✅ ExpensesPage should now load data
- ✅ TransactionsPage should now load data  
- ✅ Worker names should display correctly
- ✅ No more console errors about relationships