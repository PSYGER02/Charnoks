-- Google Maps Worker Locations Schema
-- Add this to your Supabase database

-- Create worker_locations table
CREATE TABLE IF NOT EXISTS worker_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    is_hq BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'offline', 'break')),
    territory_radius INTEGER DEFAULT 5000, -- radius in meters
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only one location per worker
    UNIQUE(worker_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_worker_locations_worker_id ON worker_locations(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_locations_status ON worker_locations(status);
CREATE INDEX IF NOT EXISTS idx_worker_locations_coordinates ON worker_locations(latitude, longitude);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_worker_location_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_worker_locations_updated_at
    BEFORE UPDATE ON worker_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_worker_location_updated_at();

-- Insert sample data (HQ and a few sample workers)
-- Note: Adjust coordinates to your actual business locations
INSERT INTO worker_locations (worker_id, latitude, longitude, address, is_hq, status) VALUES
-- HQ Location (Manila - adjust to your actual HQ)
(NULL, 14.5995, 120.9842, 'Charnoks Headquarters, Makati City, Manila', true, 'active'),

-- Sample worker locations (you'll replace with real data)
-- Worker 1 - BGC Area
-- (worker_id_from_workers_table, 14.6042, 120.9822, 'BGC, Taguig City', false, 'active'),

-- Worker 2 - Ortigas Area  
-- (worker_id_from_workers_table, 14.5932, 120.9755, 'Ortigas Center, Pasig City', false, 'active'),

-- Worker 3 - Quezon City
-- (worker_id_from_workers_table, 14.6091, 120.9962, 'Quezon City', false, 'offline')
ON CONFLICT (worker_id) DO NOTHING;

-- Create view for easier querying with worker details
CREATE OR REPLACE VIEW worker_locations_with_details AS
SELECT 
    wl.*,
    CASE 
        WHEN wl.is_hq THEN 'Charnoks HQ'
        ELSE COALESCE(w.name, 'Unknown Worker')
    END as worker_name,
    CASE 
        WHEN wl.is_hq THEN 'hq@charnoks.com'
        ELSE w.email
    END as worker_email,
    CASE 
        WHEN wl.is_hq THEN 'hq'
        ELSE 'worker'
    END as location_type
FROM worker_locations wl
LEFT JOIN workers w ON wl.worker_id = w.id
ORDER BY wl.is_hq DESC, wl.created_at ASC;

-- Grant permissions (adjust based on your RLS policies)
-- ALTER TABLE worker_locations ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (adjust to your needs)
-- CREATE POLICY "Users can view their organization's worker locations" ON worker_locations
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM workers w 
--             WHERE w.id = worker_locations.worker_id 
--             AND w.organization_id = (SELECT organization_id FROM workers WHERE id = auth.uid())
--         )
--         OR worker_locations.is_hq = true
--     );