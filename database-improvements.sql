-- DATABASE PERFORMANCE IMPROVEMENTS
-- Run this after the main setup

-- 1. Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sales_worker_date ON public.sales(worker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_worker_date ON public.expenses(worker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_date_total ON public.sales(created_at DESC, total);

-- 2. Create materialized view for dashboard (faster queries)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.dashboard_summary AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as transaction_count,
    SUM(total) as daily_revenue,
    AVG(total) as avg_transaction,
    COUNT(DISTINCT worker_id) as active_workers
FROM public.sales 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 3. Create function to refresh dashboard data
CREATE OR REPLACE FUNCTION refresh_dashboard_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW public.dashboard_summary;
END;
$$ LANGUAGE plpgsql;

-- 4. Add AI conversation storage with proper indexing
CREATE TABLE IF NOT EXISTS public.ai_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    session_data JSONB,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_sessions_user_activity ON public.ai_sessions(user_id, last_activity DESC);

-- 5. Create optimized business data function
CREATE OR REPLACE FUNCTION get_business_summary(
    user_id UUID DEFAULT auth.uid(),
    days_back INTEGER DEFAULT 30
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'revenue', COALESCE(SUM(s.total), 0),
        'transactions', COUNT(s.id),
        'expenses', COALESCE(SUM(e.amount), 0),
        'top_products', (
            SELECT jsonb_agg(jsonb_build_object('name', item->>'productName', 'count', COUNT(*)))
            FROM public.sales s2, jsonb_array_elements(s2.items) item
            WHERE s2.created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
            GROUP BY item->>'productName'
            ORDER BY COUNT(*) DESC
            LIMIT 5
        )
    ) INTO result
    FROM public.sales s
    LEFT JOIN public.expenses e ON DATE(s.created_at) = DATE(e.created_at)
    WHERE s.created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back;
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;