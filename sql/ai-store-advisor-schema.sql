-- AI Store Advisor Database Schema
-- This creates the memory and learning system for your AI business consultant

-- Business Memory Table - Stores learned patterns and insights
CREATE TABLE IF NOT EXISTS business_memory (
  id SERIAL PRIMARY KEY,
  pattern_type VARCHAR(255) NOT NULL,
  pattern_data JSONB NOT NULL,
  frequency INTEGER DEFAULT 1,
  success_rate DECIMAL(5,2) DEFAULT 0.80,
  confidence INTEGER DEFAULT 80,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pattern_type)
);

-- AI Consultations Table - Logs all business consultation interactions
CREATE TABLE IF NOT EXISTS ai_consultations (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  business_context JSONB,
  session_id VARCHAR(255),
  confidence INTEGER,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business Insights Table - Stores AI-generated business insights and advice
CREATE TABLE IF NOT EXISTS business_insights (
  id SERIAL PRIMARY KEY,
  insight_type VARCHAR(100) NOT NULL, -- 'guidance', 'warning', 'opportunity', 'optimization'
  priority VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'urgent'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_suggested TEXT,
  data_source JSONB,
  confidence INTEGER DEFAULT 80,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE
);

-- Business State Snapshots - Periodic captures of business state for learning
CREATE TABLE IF NOT EXISTS business_state_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_type VARCHAR(50) NOT NULL, -- 'hourly', 'daily', 'weekly'
  sales_count INTEGER DEFAULT 0,
  revenue_total DECIMAL(10,2) DEFAULT 0,
  expense_total DECIMAL(10,2) DEFAULT 0,
  stock_level_summary JSONB,
  worker_activity_summary JSONB,
  business_metrics JSONB,
  ai_insights_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Learning Events - Tracks what the AI learns from business operations
CREATE TABLE IF NOT EXISTS ai_learning_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  pattern_extracted JSONB,
  learning_quality INTEGER DEFAULT 50, -- 0-100 score
  applied_to_advice BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business Performance Patterns - AI-identified recurring business patterns
CREATE TABLE IF NOT EXISTS business_performance_patterns (
  id SERIAL PRIMARY KEY,
  pattern_name VARCHAR(255) NOT NULL,
  pattern_description TEXT,
  pattern_rules JSONB NOT NULL,
  detection_frequency INTEGER DEFAULT 1,
  success_correlation DECIMAL(5,2),
  business_impact VARCHAR(50), -- 'positive', 'negative', 'neutral'
  recommendation_text TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_detected TIMESTAMP WITH TIME ZONE
);

-- Advisor Feedback Table - User feedback on AI advice quality
CREATE TABLE IF NOT EXISTS advisor_feedback (
  id SERIAL PRIMARY KEY,
  consultation_id INTEGER REFERENCES ai_consultations(id),
  insight_id INTEGER REFERENCES business_insights(id),
  feedback_type VARCHAR(50), -- 'helpful', 'not_helpful', 'inaccurate', 'excellent'
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  user_role VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_memory_pattern_type ON business_memory(pattern_type);
CREATE INDEX IF NOT EXISTS idx_business_memory_frequency ON business_memory(frequency DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON ai_consultations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_user_role ON ai_consultations(user_role);
CREATE INDEX IF NOT EXISTS idx_insights_priority ON business_insights(priority);
CREATE INDEX IF NOT EXISTS idx_insights_resolved ON business_insights(is_resolved);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON business_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_created_at ON business_state_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_events_type ON ai_learning_events(event_type);
CREATE INDEX IF NOT EXISTS idx_patterns_active ON business_performance_patterns(is_active);
CREATE INDEX IF NOT EXISTS idx_patterns_frequency ON business_performance_patterns(detection_frequency DESC);

-- Create functions for AI learning and pattern detection

-- Function to update business memory frequency
CREATE OR REPLACE FUNCTION update_business_memory_frequency(
  p_pattern_type VARCHAR(255),
  p_pattern_data JSONB,
  p_confidence INTEGER DEFAULT 80
) RETURNS VOID AS $$
BEGIN
  INSERT INTO business_memory (pattern_type, pattern_data, frequency, confidence)
  VALUES (p_pattern_type, p_pattern_data, 1, p_confidence)
  ON CONFLICT (pattern_type) 
  DO UPDATE SET 
    frequency = business_memory.frequency + 1,
    last_seen = NOW(),
    pattern_data = p_pattern_data,
    confidence = GREATEST(business_memory.confidence, p_confidence);
END;
$$ LANGUAGE plpgsql;

-- Function to get business state summary for AI
CREATE OR REPLACE FUNCTION get_business_state_summary()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT json_build_object(
    'today_sales', (
      SELECT json_build_object(
        'count', COALESCE(COUNT(*), 0),
        'total', COALESCE(SUM(total), 0)
      )
      FROM sales 
      WHERE date >= CURRENT_DATE
    ),
    'today_expenses', (
      SELECT json_build_object(
        'count', COALESCE(COUNT(*), 0),
        'total', COALESCE(SUM(amount), 0)
      )
      FROM expenses 
      WHERE date >= CURRENT_DATE
    ),
    'stock_status', (
      SELECT json_build_object(
        'total_products', COALESCE(COUNT(*), 0),
        'low_stock', COALESCE(COUNT(*) FILTER (WHERE quantity <= reorder_point), 0),
        'out_of_stock', COALESCE(COUNT(*) FILTER (WHERE quantity = 0), 0)
      )
      FROM products
    ),
    'recent_notes', (
      SELECT COALESCE(COUNT(*), 0)
      FROM notes 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create business state snapshot
CREATE OR REPLACE FUNCTION create_business_snapshot(snapshot_type VARCHAR(50) DEFAULT 'manual')
RETURNS INTEGER AS $$
DECLARE
  snapshot_id INTEGER;
  business_state JSONB;
BEGIN
  -- Get current business state
  SELECT get_business_state_summary() INTO business_state;
  
  -- Insert snapshot
  INSERT INTO business_state_snapshots (
    snapshot_type,
    sales_count,
    revenue_total,
    expense_total,
    stock_level_summary,
    business_metrics,
    ai_insights_count
  )
  SELECT 
    snapshot_type,
    (business_state->'today_sales'->>'count')::INTEGER,
    (business_state->'today_sales'->>'total')::DECIMAL,
    (business_state->'today_expenses'->>'total')::DECIMAL,
    business_state->'stock_status',
    business_state,
    (SELECT COUNT(*) FROM business_insights WHERE created_at >= CURRENT_DATE)
  RETURNING id INTO snapshot_id;
  
  RETURN snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- Function to detect business patterns
CREATE OR REPLACE FUNCTION detect_business_patterns()
RETURNS INTEGER AS $$
DECLARE
  patterns_found INTEGER := 0;
BEGIN
  -- Pattern 1: High sales days
  INSERT INTO business_performance_patterns (
    pattern_name,
    pattern_description,
    pattern_rules,
    detection_frequency,
    business_impact,
    recommendation_text
  )
  SELECT 
    'high_sales_pattern',
    'Days with unusually high sales volume',
    json_build_object(
      'min_sales_count', avg_sales + (2 * stddev_sales),
      'day_of_week', extract(dow from date),
      'avg_transaction_value', avg_total
    ),
    1,
    'positive',
    'Consider replicating conditions that led to high sales'
  FROM (
    SELECT 
      AVG(daily_count) as avg_sales,
      STDDEV(daily_count) as stddev_sales,
      AVG(daily_total) as avg_total,
      mode() WITHIN GROUP (ORDER BY extract(dow from date)) as common_dow
    FROM (
      SELECT 
        date,
        COUNT(*) as daily_count,
        AVG(total) as daily_total
      FROM sales 
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY date
    ) daily_stats
  ) pattern_data
  WHERE NOT EXISTS (
    SELECT 1 FROM business_performance_patterns 
    WHERE pattern_name = 'high_sales_pattern' 
    AND created_at >= CURRENT_DATE
  );
  
  patterns_found := patterns_found + 1;
  
  -- Pattern 2: Stock depletion patterns
  INSERT INTO business_performance_patterns (
    pattern_name,
    pattern_description,
    pattern_rules,
    detection_frequency,
    business_impact,
    recommendation_text
  )
  SELECT 
    'stock_depletion_pattern',
    'Products that frequently run out of stock',
    json_build_object(
      'products', array_agg(product_name),
      'avg_days_to_deplete', avg_days_between_reorders
    ),
    COUNT(*),
    'negative',
    'Increase reorder points for frequently depleted products'
  FROM (
    SELECT 
      product_name,
      AVG(days_between) as avg_days_between_reorders
    FROM (
      SELECT 
        p.product_name,
        LAG(s.date) OVER (PARTITION BY p.product_name ORDER BY s.date) as prev_date,
        s.date,
        s.date - LAG(s.date) OVER (PARTITION BY p.product_name ORDER BY s.date) as days_between
      FROM sales s
      JOIN products p ON s.product_name = p.product_name
      WHERE s.date >= CURRENT_DATE - INTERVAL '30 days'
    ) date_diffs
    WHERE days_between IS NOT NULL
    GROUP BY product_name
    HAVING COUNT(*) >= 3
  ) stock_patterns
  WHERE NOT EXISTS (
    SELECT 1 FROM business_performance_patterns 
    WHERE pattern_name = 'stock_depletion_pattern' 
    AND created_at >= CURRENT_DATE
  )
  GROUP BY 'stock_depletion_pattern';
  
  patterns_found := patterns_found + 1;
  
  RETURN patterns_found;
END;
$$ LANGUAGE plpgsql;

-- Create scheduled snapshot creation (if using pg_cron extension)
-- SELECT cron.schedule('business-hourly-snapshot', '0 * * * *', 'SELECT create_business_snapshot(''hourly'');');
-- SELECT cron.schedule('business-daily-snapshot', '0 0 * * *', 'SELECT create_business_snapshot(''daily'');');
-- SELECT cron.schedule('pattern-detection', '0 2 * * *', 'SELECT detect_business_patterns();');

-- Insert some initial business memory patterns for bootstrapping
INSERT INTO business_memory (pattern_type, pattern_data, frequency, confidence) VALUES
('morning_sales_peak', '{"time_range": "08:00-10:00", "typical_products": ["live_chicken", "dressed_chicken"], "avg_transactions": 15}', 5, 85),
('afternoon_lull', '{"time_range": "14:00-16:00", "low_activity": true, "maintenance_time": true}', 3, 80),
('weekend_preparation', '{"day": "friday", "increased_processing": true, "stock_preparation": true}', 2, 90),
('expense_spike_feed', '{"category": "feed", "seasonal_pattern": true, "price_volatility": "high"}', 4, 75);

-- Insert initial business insights template
INSERT INTO business_insights (insight_type, priority, title, message, action_suggested, confidence) VALUES
('guidance', 'medium', 'Welcome to AI Store Advisor', 'Your AI business consultant is now active and learning your business patterns.', 'Start by asking questions about your business operations', 95);

COMMENT ON TABLE business_memory IS 'Stores AI-learned patterns and business intelligence for continuous improvement';
COMMENT ON TABLE ai_consultations IS 'Logs all interactions with the AI business consultant for learning and improvement';
COMMENT ON TABLE business_insights IS 'AI-generated business advice, warnings, and opportunities';
COMMENT ON TABLE business_state_snapshots IS 'Periodic captures of business state for trend analysis and learning';
COMMENT ON TABLE ai_learning_events IS 'Tracks what the AI learns from observing business operations';
COMMENT ON TABLE business_performance_patterns IS 'Identified recurring patterns in business performance';
COMMENT ON TABLE advisor_feedback IS 'User feedback on AI advice quality for continuous improvement';