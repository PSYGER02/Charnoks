-- Database schema for ChatGPT plan implementation
-- Operations and summaries tables for stock management

-- Operations table for storing all stock operations
CREATE TABLE IF NOT EXISTS operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  local_uuid uuid UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('purchase', 'production', 'transfer', 'cook', 'sale')),
  data jsonb NOT NULL,
  timestamp timestamptz NOT NULL,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Lots table for tracking stock batches
CREATE TABLE IF NOT EXISTS lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  quantity numeric NOT NULL,
  unit text NOT NULL DEFAULT 'kg',
  received_date date NOT NULL,
  supplier text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Summaries table for daily aggregated data
CREATE TABLE IF NOT EXISTS summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid,
  date date NOT NULL,
  summary jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(branch_id, date)
);

-- Notes table for free-text input
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  parsed_operations jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'parsed', 'synced')),
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_operations_type ON operations(type);
CREATE INDEX IF NOT EXISTS idx_operations_timestamp ON operations(timestamp);
CREATE INDEX IF NOT EXISTS idx_lots_received_date ON lots(received_date);
CREATE INDEX IF NOT EXISTS idx_summaries_date ON summaries(date);
CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status);