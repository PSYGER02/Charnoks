-- ============================================================================
-- CHARNOKS MANAGER - SAFE DATABASE MIGRATION
-- Handles existing tables and adds new features safely
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SAFE TABLE CREATION/MODIFICATION
-- ============================================================================

-- Create user_profiles table if it doesn't exist, or add missing columns
DO $$
BEGIN
  -- Create table if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    CREATE TABLE public.user_profiles (
      id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT CHECK (role IN ('owner', 'worker')) DEFAULT 'owner',
      is_active BOOLEAN DEFAULT true,
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  ELSE
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'is_active') THEN
      ALTER TABLE public.user_profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'created_by') THEN
      ALTER TABLE public.user_profiles ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
    
    -- Ensure email is unique
    BEGIN
      ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_email_unique UNIQUE (email);
    EXCEPTION
      WHEN duplicate_table THEN NULL; -- Constraint already exists
    END;
  END IF;
END $$;

-- Create products table if it doesn't exist, or add missing columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
    CREATE TABLE public.products (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      category TEXT,
      image_url TEXT,
      is_active BOOLEAN DEFAULT true,
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  ELSE
    -- Add missing columns
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_active') THEN
      ALTER TABLE public.products ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'created_by') THEN
      ALTER TABLE public.products ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add constraints if they don't exist
    BEGIN
      ALTER TABLE public.products ADD CONSTRAINT products_price_check CHECK (price >= 0);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
      ALTER TABLE public.products ADD CONSTRAINT products_stock_check CHECK (stock >= 0);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Create sales table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sales') THEN
    CREATE TABLE public.sales (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      items JSONB NOT NULL,
      total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
      payment DECIMAL(10,2) NOT NULL CHECK (payment >= 0),
      change DECIMAL(10,2) NOT NULL DEFAULT 0,
      worker_id UUID REFERENCES auth.users(id) NOT NULL,
      worker_name TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  ELSE
    -- Add constraints if they don't exist
    BEGIN
      ALTER TABLE public.sales ADD CONSTRAINT sales_total_check CHECK (total >= 0);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
      ALTER TABLE public.sales ADD CONSTRAINT sales_payment_check CHECK (payment >= 0);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Create expenses table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenses') THEN
    CREATE TABLE public.expenses (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      description TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
      category TEXT DEFAULT 'general',
      worker_id UUID REFERENCES auth.users(id) NOT NULL,
      worker_name TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  ELSE
    -- Add missing columns
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'category') THEN
      ALTER TABLE public.expenses ADD COLUMN category TEXT DEFAULT 'general';
    END IF;
    
    -- Add constraints
    BEGIN
      ALTER TABLE public.expenses ADD CONSTRAINT expenses_amount_check CHECK (amount >= 0);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Create notes table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notes') THEN
    CREATE TABLE public.notes (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'general',
      amount DECIMAL(10,2) CHECK (amount >= 0),
      created_by UUID REFERENCES auth.users(id) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  ELSE
    -- Add missing columns
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'created_by') THEN
      ALTER TABLE public.notes ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'category') THEN
      ALTER TABLE public.notes ADD COLUMN category TEXT DEFAULT 'general';
    END IF;
  END IF;
END $$;

-- Create business_settings table
CREATE TABLE IF NOT EXISTS public.business_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT DEFAULT 'Charnoks Restaurant',
  business_address TEXT,
  business_phone TEXT,
  business_email TEXT,
  currency TEXT DEFAULT 'USD',
  tax_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES (CREATE IF NOT EXISTS)
-- ============================================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_worker_id ON public.sales(worker_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_total ON public.sales(total);

-- Expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_worker_id ON public.expenses(worker_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON public.notes(created_by);
CREATE INDEX IF NOT EXISTS idx_notes_category ON public.notes(category);

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP EXISTING POLICIES (SAFE)
-- ============================================================================

-- Drop all existing policies safely
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop policies for user_profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.user_profiles';
    END LOOP;
    
    -- Drop policies for products
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'products' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.products';
    END LOOP;
    
    -- Drop policies for sales
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'sales' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.sales';
    END LOOP;
    
    -- Drop policies for expenses
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'expenses' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.expenses';
    END LOOP;
    
    -- Drop policies for notes
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'notes' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.notes';
    END LOOP;
    
    -- Drop policies for business_settings
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'business_settings' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.business_settings';
    END LOOP;
END $$;

-- ============================================================================
-- CREATE NEW POLICIES
-- ============================================================================

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Owners can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Owners can manage worker profiles" ON public.user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Products Policies
CREATE POLICY "Anyone can read active products" ON public.products
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Owners can manage products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Sales Policies
CREATE POLICY "Workers can create own sales" ON public.sales
  FOR INSERT WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Workers can view own sales" ON public.sales
  FOR SELECT USING (auth.uid() = worker_id);

CREATE POLICY "Owners can view all sales" ON public.sales
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Owners can manage all sales" ON public.sales
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Expenses Policies
CREATE POLICY "Workers can create own expenses" ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Workers can view own expenses" ON public.expenses
  FOR SELECT USING (auth.uid() = worker_id);

CREATE POLICY "Owners can view all expenses" ON public.expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Owners can manage all expenses" ON public.expenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Notes Policies (Owner only)
CREATE POLICY "Only owners can manage notes" ON public.notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Business Settings Policies (Owner only)
CREATE POLICY "Only owners can manage business settings" ON public.business_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================================================
-- STORAGE SETUP
-- ============================================================================

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
CREATE POLICY "Authenticated users can update product images" ON storage.objects
  FOR UPDATE WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
CREATE POLICY "Authenticated users can delete product images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name, role, created_by)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'owner'),
    COALESCE((NEW.raw_user_meta_data->>'created_by')::UUID, NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS handle_updated_at_user_profiles ON public.user_profiles;
CREATE TRIGGER handle_updated_at_user_profiles
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_products ON public.products;
CREATE TRIGGER handle_updated_at_products
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_business_settings ON public.business_settings;
CREATE TRIGGER handle_updated_at_business_settings
  BEFORE UPDATE ON public.business_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- BUSINESS LOGIC FUNCTIONS
-- ============================================================================

-- Atomic sale transaction function (SAFE VERSION)
CREATE OR REPLACE FUNCTION public.record_sale_atomic(
  items_jsonb JSONB,
  payment_amt NUMERIC,
  worker_uuid UUID
) RETURNS UUID AS $$
DECLARE
  item JSONB;
  pid UUID;
  qty INTEGER;
  prod RECORD;
  total NUMERIC := 0;
  sale_items JSONB := '[]'::JSONB;
  new_sale_id UUID;
  worker_name_val TEXT;
  has_is_active BOOLEAN;
BEGIN
  -- Check if is_active column exists
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'is_active'
  ) INTO has_is_active;

  -- Validate inputs
  IF jsonb_typeof(items_jsonb) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'items must be a JSON array';
  END IF;
  
  IF payment_amt < 0 THEN
    RAISE EXCEPTION 'payment amount cannot be negative';
  END IF;

  -- Get worker name
  SELECT display_name INTO worker_name_val 
  FROM public.user_profiles 
  WHERE id = worker_uuid;
  
  IF worker_name_val IS NULL THEN
    RAISE EXCEPTION 'Worker not found';
  END IF;

  -- Process each item
  FOR item IN SELECT * FROM jsonb_array_elements(items_jsonb) LOOP
    pid := (item->>'productId')::UUID;
    qty := (item->>'quantity')::INTEGER;

    IF qty <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity % for product %', qty, pid;
    END IF;

    -- Lock and get product (with or without is_active check)
    IF has_is_active THEN
      SELECT * INTO prod FROM public.products WHERE id = pid AND is_active = true FOR UPDATE;
    ELSE
      SELECT * INTO prod FROM public.products WHERE id = pid FOR UPDATE;
    END IF;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found or inactive', pid;
    END IF;

    IF prod.stock < qty THEN
      RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Requested: %', prod.name, prod.stock, qty;
    END IF;

    -- Update stock
    UPDATE public.products 
    SET stock = stock - qty, updated_at = COALESCE(updated_at, NOW())
    WHERE id = pid;

    -- Calculate total
    total := total + (prod.price * qty);

    -- Build sale items
    sale_items := sale_items || jsonb_build_object(
      'productId', pid,
      'productName', prod.name,
      'quantity', qty,
      'price', prod.price,
      'subtotal', prod.price * qty
    );
  END LOOP;

  -- Validate payment
  IF payment_amt < total THEN
    RAISE EXCEPTION 'Insufficient payment. Total: %, Payment: %', total, payment_amt;
  END IF;

  -- Create sale record
  INSERT INTO public.sales (items, total, payment, change, worker_id, worker_name)
  VALUES (
    sale_items,
    total,
    payment_amt,
    payment_amt - total,
    worker_uuid,
    worker_name_val
  ) RETURNING id INTO new_sale_id;

  RETURN new_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- COMPLETION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Safe migration completed successfully!';
  RAISE NOTICE '📊 All tables updated with new columns and constraints';
  RAISE NOTICE '🔒 Row Level Security policies refreshed';
  RAISE NOTICE '⚡ Functions updated to handle existing data';
  RAISE NOTICE '🎯 Database is ready for use!';
END $$;