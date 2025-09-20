-- AI Enhanced Features Schema
-- Support for AI Observer, AI Assistant, and monitoring capabilities

-- AI Summaries table for AI Observer
CREATE TABLE IF NOT EXISTS public.ai_summaries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    summary_data jsonb NOT NULL,
    generated_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- AI Proposals table for AI Assistant with human approval workflow
CREATE TABLE IF NOT EXISTS public.ai_proposals (
    id text PRIMARY KEY, -- Use the ID from the service
    type text NOT NULL CHECK (type IN ('expense_categorization', 'stock_adjustment', 'price_optimization', 'reorder_suggestion', 'process_improvement')),
    title text NOT NULL,
    description text NOT NULL,
    proposed_action jsonb NOT NULL,
    confidence integer NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    reasoning text NOT NULL,
    data_source jsonb,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    created_by text NOT NULL DEFAULT 'ai_assistant',
    human_notes text,
    approved_by text,
    approved_at timestamptz,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enhanced AI audit logs for better monitoring
CREATE TABLE IF NOT EXISTS public.ai_audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    model_used text,
    tokens_used integer DEFAULT 0,
    success boolean NOT NULL,
    error_message text,
    request_data jsonb,
    response_data jsonb,
    execution_time_ms integer,
    created_at timestamptz DEFAULT now()
);

-- Usage tracking for different AI models
CREATE TABLE IF NOT EXISTS public.ai_usage_tracking (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    model_id text NOT NULL,
    model_name text NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    request_count integer DEFAULT 1,
    token_count integer DEFAULT 0,
    cost_estimate decimal(10,4) DEFAULT 0,
    date date DEFAULT current_date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(model_id, user_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_summaries_date ON public.ai_summaries(date);
CREATE INDEX IF NOT EXISTS idx_ai_summaries_generated_at ON public.ai_summaries(generated_at);

CREATE INDEX IF NOT EXISTS idx_ai_proposals_status ON public.ai_proposals(status);
CREATE INDEX IF NOT EXISTS idx_ai_proposals_type ON public.ai_proposals(type);
CREATE INDEX IF NOT EXISTS idx_ai_proposals_expires_at ON public.ai_proposals(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_proposals_created_at ON public.ai_proposals(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_user_id ON public.ai_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_action ON public.ai_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_created_at ON public.ai_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_success ON public.ai_audit_logs(success);

CREATE INDEX IF NOT EXISTS idx_ai_usage_tracking_model_id ON public.ai_usage_tracking(model_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_tracking_user_id ON public.ai_usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_tracking_date ON public.ai_usage_tracking(date);

-- RLS Policies for security
ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_tracking ENABLE ROW LEVEL SECURITY;

-- AI Summaries policies (owners can read all, workers can read their branch)
CREATE POLICY "Enable read access for authenticated users" ON public.ai_summaries
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.ai_summaries
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- AI Proposals policies (authenticated users can read their proposals)
CREATE POLICY "Enable read access for authenticated users" ON public.ai_proposals
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for system" ON public.ai_proposals
    FOR INSERT WITH CHECK (true); -- AI system can create proposals

CREATE POLICY "Enable update for authenticated users" ON public.ai_proposals
    FOR UPDATE USING (auth.role() = 'authenticated');

-- AI Audit logs policies (users can read their own logs, admins can read all)
CREATE POLICY "Users can read their own audit logs" ON public.ai_audit_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for system" ON public.ai_audit_logs
    FOR INSERT WITH CHECK (true); -- AI system can log actions

-- AI Usage tracking policies (users can read their own usage)
CREATE POLICY "Users can read their own usage" ON public.ai_usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for system" ON public.ai_usage_tracking
    FOR INSERT WITH CHECK (true); -- AI system can track usage

CREATE POLICY "Enable update for system" ON public.ai_usage_tracking
    FOR UPDATE USING (true); -- AI system can update usage

-- Functions for AI usage tracking
CREATE OR REPLACE FUNCTION public.track_ai_usage(
    p_model_id text,
    p_model_name text,
    p_user_id uuid,
    p_token_count integer DEFAULT 0,
    p_cost_estimate decimal DEFAULT 0
) RETURNS void AS $$
BEGIN
    INSERT INTO public.ai_usage_tracking (
        model_id, model_name, user_id, request_count, token_count, cost_estimate, date
    ) VALUES (
        p_model_id, p_model_name, p_user_id, 1, p_token_count, p_cost_estimate, current_date
    )
    ON CONFLICT (model_id, user_id, date)
    DO UPDATE SET
        request_count = ai_usage_tracking.request_count + 1,
        token_count = ai_usage_tracking.token_count + p_token_count,
        cost_estimate = ai_usage_tracking.cost_estimate + p_cost_estimate,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired proposals
CREATE OR REPLACE FUNCTION public.cleanup_expired_proposals() RETURNS void AS $$
BEGIN
    UPDATE public.ai_proposals 
    SET status = 'expired'
    WHERE status = 'pending' 
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically cleanup expired proposals daily
-- This would typically be set up as a cron job, but we'll create the function for manual execution

COMMENT ON TABLE public.ai_summaries IS 'AI-generated daily business summaries with insights and recommendations';
COMMENT ON TABLE public.ai_proposals IS 'AI Assistant proposals requiring human approval before execution';
COMMENT ON TABLE public.ai_audit_logs IS 'Comprehensive audit trail for all AI interactions and decisions';
COMMENT ON TABLE public.ai_usage_tracking IS 'Track AI model usage for cost management and optimization';

COMMENT ON FUNCTION public.track_ai_usage IS 'Track AI model usage with deduplication by user and date';
COMMENT ON FUNCTION public.cleanup_expired_proposals IS 'Mark expired AI proposals to keep the system clean';