-- Fix worker_name fields in all tables to use display_name
-- Run this in Supabase SQL Editor

-- Update expenses table - set worker_name from user_profiles display_name
UPDATE public.expenses 
SET worker_name = up.display_name
FROM public.user_profiles up
WHERE expenses.worker_id = up.id 
AND (expenses.worker_name IS NULL OR expenses.worker_name = 'Worker' OR expenses.worker_name = 'User');

-- Update sales table - set worker_name from user_profiles display_name  
UPDATE public.sales
SET worker_name = up.display_name
FROM public.user_profiles up
WHERE sales.worker_id = up.id
AND (sales.worker_name IS NULL OR sales.worker_name = 'Worker' OR sales.worker_name = 'User');

-- Create function to auto-update worker_name on insert/update
CREATE OR REPLACE FUNCTION update_worker_name()
RETURNS TRIGGER AS $$
BEGIN
    -- Get display_name from user_profiles
    SELECT display_name INTO NEW.worker_name
    FROM public.user_profiles
    WHERE id = NEW.worker_id;
    
    -- Fallback if no profile found
    IF NEW.worker_name IS NULL THEN
        NEW.worker_name := 'Worker';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to auto-update worker_name
DROP TRIGGER IF EXISTS update_expenses_worker_name ON public.expenses;
CREATE TRIGGER update_expenses_worker_name
    BEFORE INSERT OR UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION update_worker_name();

DROP TRIGGER IF EXISTS update_sales_worker_name ON public.sales;
CREATE TRIGGER update_sales_worker_name
    BEFORE INSERT OR UPDATE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION update_worker_name();