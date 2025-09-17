-- Create optimized workers table for fast lookups (WORKERS ONLY)
CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Populate ONLY workers from user_profiles
INSERT INTO workers (id, name, email, is_active)
SELECT 
  id,
  COALESCE(display_name, split_part(email, '@', 1), 'Worker') as name,
  email,
  true
FROM user_profiles
WHERE role = 'worker'
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email;

-- Create trigger to auto-sync with user_profiles
CREATE OR REPLACE FUNCTION sync_worker_data()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.role = 'worker' THEN
    INSERT INTO workers (id, name, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.display_name, split_part(NEW.email, '@', 1), 'Worker'),
      NEW.email
    );
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    IF NEW.role = 'worker' THEN
      INSERT INTO workers (id, name, email)
      VALUES (
        NEW.id,
        COALESCE(NEW.display_name, split_part(NEW.email, '@', 1), 'Worker'),
        NEW.email
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email;
    ELSE
      -- Remove from workers if role changed from worker
      DELETE FROM workers WHERE id = NEW.id;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS sync_workers_on_profile_change ON user_profiles;
CREATE TRIGGER sync_workers_on_profile_change
  AFTER INSERT OR UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION sync_worker_data();