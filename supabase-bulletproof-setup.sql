-- ============================================================================
-- CHARNOKS MANAGER - BULLETPROOF DATABASE SETUP
-- This script checks existing structure and only adds what's missing
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- STEP 1: ANALYZE EXISTING DATABASE STRUCTURE
-- ============================================================================

DO $$
DECLARE
    table_exists BOOLEAN;
    column_exists BOOLEAN;
BEGIN
    RAISE NOTICE '🔍 Analyzing existing database structure...';
    
    -- Check what tables exist
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') INTO table_exists;
    RAISE NOTICE 'user_profiles table exists: %', table_exists;
    
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') INTO table_exists;
    RAISE NOTICE 'products table exists: %', table_exists;
    
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sales') INTO table_exists;
    RAISE NOTICE 'sales table exists: %', table_exists;
    
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenses') INTO table_exists;
    RAISE NOTICE 'expenses table exists: %', table_exists;
    
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notes') INTO table_exists;
    RAISE NOTICE 'notes table exists: %', table_exists;
END $$;

-- ============================================================================
-- STEP 2: CREATE MISSING TABLES ONLY
-- ============================================================================

-- Create user_profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        RAISE NOTICE '📝 Creating user_profiles table...';
        CREATE TABLE public.user_profiles (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            email TEXT,
            display_name TEXT,
            role TEXT CHECK (role IN ('owner', 'worker')) DEFAULT 'owner',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE '✅ user_profiles table created';
    ELSE
        RAISE NOTICE '⏭️ user_profiles table already exists, skipping creation';
    END IF;
END $$;

-- Create products table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
        RAISE NOTICE '📝 Creating products table...';
        CREATE TABLE public.products (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            stock INTEGER NOT NULL DEFAULT 0,
            category TEXT,
            image_url TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE '✅ products table created';
    ELSE
        RAISE NOTICE '⏭️ products table already exists, skipping creation';
    END IF;
END $$;

-- Create sales table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sales') THEN
        RAISE NOTICE '📝 Creating sales table...';
        CREATE TABLE public.sales (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            items JSONB NOT NULL,
            total DECIMAL(10,2) NOT NULL,
            payment DECIMAL(10,2) NOT NULL,
            change DECIMAL(10,2) NOT NULL DEFAULT 0,
            worker_id UUID REFERENCES auth.users(id),
            worker_name TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE '✅ sales table created';
    ELSE
        RAISE NOTICE '⏭️ sales table already exists, skipping creation';
    END IF;
END $$;

-- Create expenses table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenses') THEN
        RAISE NOTICE '📝 Creating expenses table...';
        CREATE TABLE public.expenses (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            description TEXT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            worker_id UUID REFERENCES auth.users(id),
            worker_name TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE '✅ expenses table created';
    ELSE
        RAISE NOTICE '⏭️ expenses table already exists, skipping creation';
    END IF;
END $$;

-- Create notes table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notes') THEN
        RAISE NOTICE '📝 Creating notes table...';
        CREATE TABLE public.notes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT,
            amount DECIMAL(10,2),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE '✅ notes table created';
    ELSE
        RAISE NOTICE '⏭️ notes table already exists, skipping creation';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: ADD MISSING COLUMNS SAFELY
-- ============================================================================

-- Add missing columns to user_profiles
DO $$
BEGIN
    -- Add is_active column if missing
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'is_active') THEN
        RAISE NOTICE '📝 Adding is_active column to user_profiles...';
        ALTER TABLE public.user_profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE '✅ is_active column added to user_profiles';
    END IF;
    
    -- Add created_by column if missing
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'created_by') THEN
        RAISE NOTICE '📝 Adding created_by column to user_profiles...';
        ALTER TABLE public.user_profiles ADD COLUMN created_by UUID REFERENCES auth.users(id);
        RAISE NOTICE '✅ created_by column added to user_profiles';
    END IF;
END $$;

-- Add missing columns to products
DO $$
BEGIN
    -- Check if stock column exists before adding constraints
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock') THEN
        RAISE NOTICE '✅ stock column exists in products table';
    ELSE
        RAISE NOTICE '📝 Adding stock column to products...';
        ALTER TABLE public.products ADD COLUMN stock INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE '✅ stock column added to products';
    END IF;
    
    -- Add is_active column if missing
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_active') THEN
        RAISE NOTICE '📝 Adding is_active column to products...';
        ALTER TABLE public.products ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE '✅ is_active column added to products';
    END IF;
    
    -- Add created_by column if missing
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'created_by') THEN
        RAISE NOTICE '📝 Adding created_by column to products...';
        ALTER TABLE public.products ADD COLUMN created_by UUID REFERENCES auth.users(id);
        RAISE NOTICE '✅ created_by column added to products';
    END IF;
END $$;

-- Add missing columns to expenses
DO $$
BEGIN
    -- Add category column if missing
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'category') THEN
        RAISE NOTICE '📝 Adding category column to expenses...';
        ALTER TABLE public.expenses ADD COLUMN category TEXT DEFAULT 'general';
        RAISE NOTICE '✅ category column added to expenses';
    END IF;
END $$;

-- Add missing columns to notes
DO $$
BEGIN
    -- Add created_by column if missing
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'created_by') THEN
        RAISE NOTICE '📝 Adding created_by column to notes...';
        ALTER TABLE public.notes ADD COLUMN created_by UUID REFERENCES auth.users(id);
        RAISE NOTICE '✅ created_by column added to notes';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: ADD CONSTRAINTS SAFELY
-- ============================================================================

-- Add constraints only if columns exist
DO $$
BEGIN
    -- Add price constraint to products if price column exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'price') THEN
        BEGIN
            ALTER TABLE public.products ADD CONSTRAINT products_price_check CHECK (price >= 0);
            RAISE NOTICE '✅ Price constraint added to products';
        EXCEPTION
            WHEN duplicate_object THEN 
                RAISE NOTICE '⏭️ Price constraint already exists on products';
        END;
    END IF;
    
    -- Add stock constraint to products if stock column exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock') THEN
        BEGIN
            ALTER TABLE public.products ADD CONSTRAINT products_stock_check CHECK (stock >= 0);
            RAISE NOTICE '✅ Stock constraint added to products';
        EXCEPTION
            WHEN duplicate_object THEN 
                RAISE NOTICE '⏭️ Stock constraint already exists on products';
        END;
    END IF;
    
    -- Add amount constraint to expenses if amount column exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'amount') THEN
        BEGIN
            ALTER TABLE public.expenses ADD CONSTRAINT expenses_amount_check CHECK (amount >= 0);
            RAISE NOTICE '✅ Amount constraint added to expenses';
        EXCEPTION
            WHEN duplicate_object THEN 
                RAISE NOTICE '⏭️ Amount constraint already exists on expenses';
        END;
    END IF;
END $$;

-- ============================================================================
-- STEP 5: CREATE INDEXES SAFELY
-- ============================================================================

-- Create indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- Only create is_active index if column exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'is_active') THEN
        CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active);
        RAISE NOTICE '✅ is_active index created on user_profiles';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_active') THEN
        CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
        RAISE NOTICE '✅ is_active index created on products';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_sales_worker_id ON public.sales(worker_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_worker_id ON public.expenses(worker_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses(created_at);

-- ============================================================================
-- STEP 6: ENABLE RLS
-- ============================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 7: CREATE RLS POLICIES (SIMPLE VERSION)
-- ============================================================================

-- Drop existing policies safely
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
        EXCEPTION
            WHEN OTHERS THEN NULL;
        END;
    END LOOP;
END $$;

-- Create basic policies
CREATE POLICY "Users can manage own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Owners can see all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Anyone can read products" ON public.products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Owners can manage products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Workers can create own sales" ON public.sales
  FOR INSERT WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Workers can see own sales" ON public.sales
  FOR SELECT USING (auth.uid() = worker_id);

CREATE POLICY "Owners can see all sales" ON public.sales
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Workers can create own expenses" ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Workers can see own expenses" ON public.expenses
  FOR SELECT USING (auth.uid() = worker_id);

CREATE POLICY "Owners can see all expenses" ON public.expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Only owners can manage notes" ON public.notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================================================
-- STEP 8: STORAGE SETUP
-- ============================================================================

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- ============================================================================
-- STEP 9: FUNCTIONS & TRIGGERS
-- ============================================================================

-- User profile creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'owner')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers only if updated_at column exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'updated_at') THEN
        DROP TRIGGER IF EXISTS handle_updated_at_user_profiles ON public.user_profiles;
        CREATE TRIGGER handle_updated_at_user_profiles
          BEFORE UPDATE ON public.user_profiles
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'updated_at') THEN
        DROP TRIGGER IF EXISTS handle_updated_at_products ON public.products;
        CREATE TRIGGER handle_updated_at_products
          BEFORE UPDATE ON public.products
          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- ============================================================================
-- STEP 10: GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

DO $$
DECLARE
    table_count INTEGER;
    user_profiles_cols INTEGER;
    products_cols INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_name IN ('user_profiles', 'products', 'sales', 'expenses', 'notes');
    
    -- Count columns in key tables
    SELECT COUNT(*) INTO user_profiles_cols 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles';
    
    SELECT COUNT(*) INTO products_cols 
    FROM information_schema.columns 
    WHERE table_name = 'products';
    
    RAISE NOTICE '✅ SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '📊 Tables created/verified: %', table_count;
    RAISE NOTICE '📋 user_profiles columns: %', user_profiles_cols;
    RAISE NOTICE '📋 products columns: %', products_cols;
    RAISE NOTICE '🔒 Row Level Security enabled';
    RAISE NOTICE '🖼️ Storage bucket configured';
    RAISE NOTICE '⚡ Triggers and functions ready';
    RAISE NOTICE '🎯 Database is ready for use!';
END $$;