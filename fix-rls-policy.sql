-- Fix infinite recursion in user_profiles RLS policy
-- This SQL should be run in your Supabase SQL editor

-- First, let's drop existing problematic policies
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow read access to user_profiles" ON user_profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Enable read access for authenticated users" 
ON user_profiles 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable users to update own profile" 
ON user_profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Enable users to insert own profile" 
ON user_profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Optional: If you need service role access for your backend
CREATE POLICY "Service role full access" 
ON user_profiles 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Make sure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;