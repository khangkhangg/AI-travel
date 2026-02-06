-- Chat Metrics table to track AI token usage from chat API
-- This captures usage from the v2 slot-filling chat endpoint

CREATE TABLE IF NOT EXISTS chat_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  model VARCHAR(100) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  conversation_state VARCHAR(50),
  slots_filled INTEGER,
  slots_total INTEGER,
  response_time_ms INTEGER,
  trip_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_chat_metrics_created_at ON chat_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_metrics_session_id ON chat_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_metrics_user_id ON chat_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_metrics_model ON chat_metrics(model);
