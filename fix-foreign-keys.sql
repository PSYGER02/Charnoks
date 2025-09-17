-- Fix foreign key relationships for user_profiles table

-- First, ensure user_profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  role TEXT DEFAULT 'worker',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
  -- Add foreign key for sales.worker_id -> user_profiles.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'sales_worker_id_fkey' 
    AND table_name = 'sales'
  ) THEN
    ALTER TABLE sales 
    ADD CONSTRAINT sales_worker_id_fkey 
    FOREIGN KEY (worker_id) REFERENCES user_profiles(id);
  END IF;

  -- Add foreign key for expenses.worker_id -> user_profiles.id  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'expenses_worker_id_fkey' 
    AND table_name = 'expenses'
  ) THEN
    ALTER TABLE expenses 
    ADD CONSTRAINT expenses_worker_id_fkey 
    FOREIGN KEY (worker_id) REFERENCES user_profiles(id);
  END IF;
END $$;

-- Create function to automatically populate user_profiles when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'worker')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing records to have proper worker_name from user_profiles
UPDATE sales 
SET worker_name = COALESCE(up.display_name, split_part(up.email, '@', 1), 'Worker')
FROM user_profiles up 
WHERE sales.worker_id = up.id AND (sales.worker_name IS NULL OR sales.worker_name = 'Unknown');

UPDATE expenses 
SET worker_name = COALESCE(up.display_name, split_part(up.email, '@', 1), 'Worker')
FROM user_profiles up 
WHERE expenses.worker_id = up.id AND (expenses.worker_name IS NULL OR expenses.worker_name = 'Unknown');