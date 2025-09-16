-- FIX DATABASE SCHEMA ISSUES
-- Ensure all required columns exist with correct names

-- Fix sales table - ensure change_due column exists
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS change_due DECIMAL(10,2) DEFAULT 0;

-- Update any existing 'change' column to 'change_due'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'sales' AND column_name = 'change') THEN
        ALTER TABLE public.sales RENAME COLUMN change TO change_due;
    END IF;
END $$;

-- Ensure worker_name column exists in sales
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS worker_name TEXT;

-- Ensure worker_name column exists in expenses  
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS worker_name TEXT;

-- Ensure category column exists in expenses
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Fix any missing constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'sales_change_due_check' AND table_name = 'sales') THEN
        ALTER TABLE public.sales ADD CONSTRAINT sales_change_due_check CHECK (change_due >= 0);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_worker_id_date ON public.sales(worker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_worker_id_date ON public.expenses(worker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active) WHERE is_active = true;