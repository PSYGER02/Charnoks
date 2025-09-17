-- Fix worker access to products table
-- Workers need to see products to record sales

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "products_policy" ON products;

-- Create simple policy allowing all authenticated users to read products
CREATE POLICY "products_read_policy" ON products
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure workers can also read user_profiles for worker names
DROP POLICY IF EXISTS "user_profiles_policy" ON user_profiles;

CREATE POLICY "user_profiles_read_policy" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow workers to insert sales
DROP POLICY IF EXISTS "sales_policy" ON sales;

CREATE POLICY "sales_insert_policy" ON sales
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "sales_read_policy" ON sales
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow workers to insert expenses
DROP POLICY IF EXISTS "expenses_policy" ON expenses;

CREATE POLICY "expenses_insert_policy" ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "expenses_read_policy" ON expenses
  FOR SELECT
  TO authenticated
  USING (true);