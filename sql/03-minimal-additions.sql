-- MINIMAL ADDITIONS - Only what's needed for AI workflow
CREATE TABLE IF NOT EXISTS public.branch_stock (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id UUID NOT NULL,
    product_name TEXT NOT NULL,
    allocated NUMERIC NOT NULL DEFAULT 0,
    used NUMERIC NOT NULL DEFAULT 0,
    leftover NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id UUID,
    date DATE NOT NULL,
    summary JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);