-- Create chat_history table for storing AI assistant conversations
CREATE TABLE IF NOT EXISTS chat_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'ai')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at);

-- Enable RLS
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access only their own chat history
CREATE POLICY "Users can access their own chat history" ON chat_history
  FOR ALL USING (auth.uid() = user_id);