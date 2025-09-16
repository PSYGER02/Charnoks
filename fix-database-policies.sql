-- FIX INFINITE RECURSION IN RLS POLICIES
-- This fixes the core backend database connection issues

-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Users can manage own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Owners can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Owners can manage all products" ON public.products;
DROP POLICY IF EXISTS "Workers can view active products" ON public.products;
DROP POLICY IF EXISTS "Workers can create sales" ON public.sales;
DROP POLICY IF EXISTS "Workers can view own sales" ON public.sales;
DROP POLICY IF EXISTS "Owners can view all sales" ON public.sales;
DROP POLICY IF EXISTS "Workers can create expenses" ON public.expenses;
DROP POLICY IF EXISTS "Workers can view own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Owners can view all expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can manage own notes" ON public.notes;
DROP POLICY IF EXISTS "Owners can view all notes" ON public.notes;
DROP POLICY IF EXISTS "Users can manage own AI data" ON public.ai_analysis;
DROP POLICY IF EXISTS "Users can manage own AI conversations" ON public.ai_conversations;

-- Create simple, non-recursive policies
-- User profiles - simple access
CREATE POLICY "Enable read access for authenticated users" ON public.user_profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Products - simple access
CREATE POLICY "Enable read access for all authenticated users" ON public.products
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" ON public.products
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" ON public.products
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Sales - simple access
CREATE POLICY "Enable read access for authenticated users" ON public.sales
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" ON public.sales
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Expenses - simple access
CREATE POLICY "Enable read access for authenticated users" ON public.expenses
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Notes - simple access
CREATE POLICY "Enable all access for authenticated users" ON public.notes
  FOR ALL USING (auth.uid() IS NOT NULL);

-- AI tables - simple access
CREATE POLICY "Enable all access for authenticated users" ON public.ai_analysis
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable all access for authenticated users" ON public.ai_conversations
  FOR ALL USING (auth.uid() IS NOT NULL);