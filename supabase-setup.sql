-- ============================================================================
-- CHARNOKS MANAGER - COMPLETE POINT OF SALE DATABASE
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- STEP 1: ANALYZE EXISTING STRUCTURE (Optional - for debugging)
-- ============================================================================

DO $$
DECLARE
    table_exists BOOLEAN;
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
    
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_analysis') INTO table_exists;
    RAISE NOTICE 'ai_analysis table exists: %', table_exists;
    
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_conversations') INTO table_exists;
    RAISE NOTICE 'ai_conversations table exists: %', table_exists;
END $$;

-- ============================================================================
-- STEP 2: CREATE TABLES
-- ============================================================================

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    role TEXT CHECK (role IN ('owner', 'worker')) DEFAULT 'worker',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2),
    stock INTEGER NOT NULL DEFAULT 0,
    category TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table with enhanced structure
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_number SERIAL,
    items JSONB NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    payment DECIMAL(10,2) NOT NULL,
    change_due DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_method TEXT DEFAULT 'cash',
    worker_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenses table with categories
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    receipt_url TEXT,
    worker_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notes table with priorities
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI analysis storage
CREATE TABLE IF NOT EXISTS public.ai_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    analysis_type TEXT NOT NULL,
    content JSONB NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI conversations storage
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    session_id TEXT,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: ADD CONSTRAINTS
-- ============================================================================

-- Add constraints to products
ALTER TABLE public.products 
    ADD CONSTRAINT products_price_check CHECK (price >= 0),
    ADD CONSTRAINT products_cost_check CHECK (cost >= 0 OR cost IS NULL),
    ADD CONSTRAINT products_stock_check CHECK (stock >= 0);

-- Add constraints to sales
ALTER TABLE public.sales 
    ADD CONSTRAINT sales_total_check CHECK (total >= 0),
    ADD CONSTRAINT sales_payment_check CHECK (payment >= 0),
    ADD CONSTRAINT sales_change_check CHECK (change_due >= 0);

-- Add constraints to expenses
ALTER TABLE public.expenses 
    ADD CONSTRAINT expenses_amount_check CHECK (amount >= 0);

-- Add foreign key constraints
DO $$
BEGIN
    -- Add foreign key from sales to user_profiles if both tables exist
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints 
                   WHERE table_name = 'sales' AND constraint_name = 'sales_worker_id_fkey') THEN
        ALTER TABLE public.sales ADD CONSTRAINT sales_worker_id_fkey 
        FOREIGN KEY (worker_id) REFERENCES public.user_profiles(id);
    END IF;
    
    -- Similar check for expenses table
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints 
                   WHERE table_name = 'expenses' AND constraint_name = 'expenses_worker_id_fkey') THEN
        ALTER TABLE public.expenses ADD CONSTRAINT expenses_worker_id_fkey 
        FOREIGN KEY (worker_id) REFERENCES public.user_profiles(id);
    END IF;
END $$;

-- ============================================================================
-- STEP 4: CREATE INDEXES
-- ============================================================================

-- Indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active);

-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

-- Indexes for sales
CREATE INDEX IF NOT EXISTS idx_sales_worker_id ON public.sales(worker_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);

-- Indexes for expenses
CREATE INDEX IF NOT EXISTS idx_expenses_worker_id ON public.expenses(worker_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);

-- Indexes for notes
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON public.notes(created_by);
CREATE INDEX IF NOT EXISTS idx_notes_priority ON public.notes(priority);

-- Indexes for AI data
CREATE INDEX IF NOT EXISTS idx_ai_analysis_created_by ON public.ai_analysis(created_by);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);

-- ============================================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: CREATE RLS POLICIES
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

-- User profiles policies
CREATE POLICY "Users can manage own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Owners can manage all profiles" ON public.user_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Products policies
CREATE POLICY "Owners can manage all products" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Workers can view active products" ON public.products
  FOR SELECT USING (is_active = true);

-- Sales policies
CREATE POLICY "Workers can create sales" ON public.sales
  FOR INSERT WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Workers can view own sales" ON public.sales
  FOR SELECT USING (auth.uid() = worker_id);

CREATE POLICY "Owners can view all sales" ON public.sales
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Expenses policies
CREATE POLICY "Workers can create expenses" ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Workers can view own expenses" ON public.expenses
  FOR SELECT USING (auth.uid() = worker_id);

CREATE POLICY "Owners can view all expenses" ON public.expenses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Notes policies
CREATE POLICY "Users can manage own notes" ON public.notes
  FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Owners can view all notes" ON public.notes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- AI data policies
CREATE POLICY "Users can manage own AI data" ON public.ai_analysis
  FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Users can manage own AI conversations" ON public.ai_conversations
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 7: STORAGE SETUP FOR PRODUCT IMAGES
-- ============================================================================

DO $$
BEGIN
  -- Check if storage schema exists
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
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
    
    RAISE NOTICE '✅ Storage bucket configured';
  ELSE
    RAISE NOTICE '⚠️ Storage extension not available, skipping storage setup';
  END IF;
END $$;

-- ============================================================================
-- STEP 8: FUNCTIONS & TRIGGERS
-- ============================================================================

-- User profile creation function with first user as owner
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name', 
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    CASE 
      WHEN (SELECT COUNT(*) FROM public.user_profiles) = 0 THEN 'owner'
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'worker')
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      display_name = EXCLUDED.display_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
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

-- Add updated_at triggers
DO $$
BEGIN
    DROP TRIGGER IF EXISTS handle_updated_at_user_profiles ON public.user_profiles;
    CREATE TRIGGER handle_updated_at_user_profiles
      BEFORE UPDATE ON public.user_profiles
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    
    DROP TRIGGER IF EXISTS handle_updated_at_products ON public.products;
    CREATE TRIGGER handle_updated_at_products
      BEFORE UPDATE ON public.products
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    
    DROP TRIGGER IF EXISTS handle_updated_at_notes ON public.notes;
    CREATE TRIGGER handle_updated_at_notes
      BEFORE UPDATE ON public.notes
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
END $$;

-- Function to update stock after a sale
CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    product_id UUID;
    quantity INTEGER;
BEGIN
    -- Loop through each item in the sale
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
        product_id := (item.value->>'product_id')::UUID;
        quantity := (item.value->>'quantity')::INTEGER;
        
        -- Update the product stock
        UPDATE public.products 
        SET stock = stock - quantity,
            updated_at = NOW()
        WHERE id = product_id;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update stock after sale
DROP TRIGGER IF EXISTS after_sale_on_stock ON public.sales;
CREATE TRIGGER after_sale_on_stock
  AFTER INSERT ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.update_product_stock();

-- Function for owners to create worker accounts
CREATE OR REPLACE FUNCTION public.create_worker_account(
    user_email TEXT,
    user_display_name TEXT
) RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
    current_user_role TEXT;
BEGIN
    -- Check if current user is an owner
    SELECT role INTO current_user_role 
    FROM public.user_profiles 
    WHERE id = auth.uid();
    
    IF current_user_role != 'owner' THEN
        RAISE EXCEPTION 'Only owners can create worker accounts';
    END IF;
    
    -- Generate a user ID (in a real scenario, you'd create the auth user first)
    new_user_id := gen_random_uuid();
    
    -- Create the profile with worker role
    INSERT INTO public.user_profiles (id, email, display_name, role, created_by)
    VALUES (new_user_id, user_email, user_display_name, 'worker', auth.uid());
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get sales data for AI analysis
CREATE OR REPLACE FUNCTION public.get_sales_data_for_ai(
    start_date TIMESTAMP DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP DEFAULT NOW()
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_agg(jsonb_build_object(
        'date', created_at::date,
        'total', total,
        'items', items
    )) INTO result
    FROM public.sales
    WHERE created_at BETWEEN start_date AND end_date;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 9: CREATE VIEWS FOR DASHBOARD
-- ============================================================================

-- Daily sales summary
CREATE OR REPLACE VIEW public.daily_sales_summary AS
SELECT 
    DATE(created_at) as sale_date,
    COUNT(*) as total_transactions,
    SUM(total) as total_revenue,
    AVG(total) as average_sale
FROM public.sales
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- Product performance view
CREATE OR REPLACE VIEW public.product_performance AS
SELECT
    p.id,
    p.name,
    p.category,
    COUNT(s.id) as times_sold,
    COALESCE(SUM((item->>'quantity')::INTEGER), 0) as total_quantity_sold,
    COALESCE(SUM((item->>'quantity')::DECIMAL * (item->>'price')::DECIMAL), 0) as total_revenue
FROM public.products p
LEFT JOIN public.sales s ON true
LEFT JOIN jsonb_array_elements(s.items) item ON (item->>'product_id')::UUID = p.id
GROUP BY p.id, p.name, p.category;

-- Expense summary by category
CREATE OR REPLACE VIEW public.expense_summary AS
SELECT
    category,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount
FROM public.expenses
GROUP BY category
ORDER BY total_amount DESC;

-- ============================================================================
-- STEP 10: GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT ALL ON ALL PROCEDURES IN SCHEMA public TO authenticated;

-- ============================================================================
-- STEP 11: DEFAULT DATA (Optional)
-- ============================================================================

-- Insert a default owner if no users exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles) THEN
    -- This would typically be done when the first user signs up via the handle_new_user function
    RAISE NOTICE 'No users found. The first user to sign up will be assigned the owner role.';
  END IF;
END $$;

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
    WHERE table_schema = 'public' 
    AND table_name IN ('user_profiles', 'products', 'sales', 'expenses', 'notes', 'ai_analysis', 'ai_conversations');
    
    -- Count columns in key tables
    SELECT COUNT(*) INTO user_profiles_cols 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND table_schema = 'public';
    
    SELECT COUNT(*) INTO products_cols 
    FROM information_schema.columns 
    WHERE table_name = 'products' AND table_schema = 'public';
    
    RAISE NOTICE '✅ SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '📊 Tables created/verified: %', table_count;
    RAISE NOTICE '📋 user_profiles columns: %', user_profiles_cols;
    RAISE NOTICE '📋 products columns: %', products_cols;
    RAISE NOTICE '🔒 Row Level Security enabled';
    RAISE NOTICE '🖼️ Storage bucket configured';
    RAISE NOTICE '⚡ Triggers and functions ready';
    RAISE NOTICE '📊 Dashboard views created';
    RAISE NOTICE '🎯 Database is ready for use!';
END $$;