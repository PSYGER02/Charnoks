-- Notes table with AI parsing support - Part B
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  user_role text CHECK (user_role IN ('owner', 'worker')),
  parsed_data jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'parsed', 'applied')),
  created_at timestamptz DEFAULT now()
);