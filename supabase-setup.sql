-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  role TEXT CHECK (role IN ('owner', 'worker')) DEFAULT 'owner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
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

-- Sales table
CREATE TABLE public.sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payment DECIMAL(10,2) NOT NULL,
  change DECIMAL(10,2) NOT NULL,
  worker_id UUID REFERENCES auth.users(id),
  worker_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  worker_id UUID REFERENCES auth.users(id),
  worker_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes table (owner only)
CREATE TABLE public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read/write their own profile
CREATE POLICY "Users can manage own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

-- Products: authenticated users can read, owners can write
CREATE POLICY "Anyone can read products" ON public.products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Owners can manage products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Sales: workers can create their own, owners can see all
CREATE POLICY "Workers can create own sales" ON public.sales
  FOR INSERT WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Owners can see all sales" ON public.sales
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Workers can see own sales" ON public.sales
  FOR SELECT USING (auth.uid() = worker_id);

-- Expenses: workers can create their own, owners can see all
CREATE POLICY "Workers can create own expenses" ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Owners can see all expenses" ON public.expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Workers can see own expenses" ON public.expenses
  FOR SELECT USING (auth.uid() = worker_id);

-- Notes: only owners can access
CREATE POLICY "Only owners can manage notes" ON public.notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true);

-- Storage policy for product images
CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update product images" ON storage.objects
  FOR UPDATE WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete product images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
  COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
  'worker'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

--
-- Atomic sale transaction function
-- This function validates stock levels, decrements stock, and inserts a sale in a single transaction.
-- Usage: SELECT public.record_sale_atomic($1::jsonb, $2::numeric, $3::uuid);
-- Parameters:
--  - items_jsonb: JSONB array of { productId: UUID, quantity: integer }
--  - payment_amt: numeric
--  - worker_uuid: UUID of worker creating the sale
-- Returns: RECORD -> (sale_id UUID)
--
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
BEGIN
  -- Validate items
  IF jsonb_typeof(items_jsonb) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'items must be a JSON array';
  END IF;

  PERFORM 1; -- placeholder

  FOR item IN SELECT * FROM jsonb_array_elements(items_jsonb) LOOP
    pid := (item->>'productId')::uuid;
    qty := (item->>'quantity')::int;

    IF qty <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for product %', pid;
    END IF;

    SELECT * INTO prod FROM public.products WHERE id = pid FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', pid;
    END IF;

    IF prod.stock < qty THEN
      RAISE EXCEPTION 'Insufficient stock for product %', pid;
    END IF;

    -- decrement stock
    UPDATE public.products SET stock = stock - qty, updated_at = NOW() WHERE id = pid;

    -- compute line total
    total := total + (prod.price * qty);

    -- append to sale items
    sale_items := sale_items || jsonb_build_object(
      'productId', pid,
      'productName', prod.name,
      'quantity', qty,
      'price', prod.price
    );
  END LOOP;

  -- Create sale record
  INSERT INTO public.sales (items, total, payment, change, worker_id, worker_name, created_at)
  VALUES (
    sale_items,
    total,
    payment_amt,
    payment_amt - total,
    worker_uuid,
    (SELECT display_name FROM public.user_profiles WHERE id = worker_uuid),
    NOW()
  ) RETURNING id INTO new_sale_id;

  RETURN new_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
