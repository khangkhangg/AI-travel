-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (enhanced from Supabase auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  trips_generated_count INTEGER DEFAULT 0,
  last_trip_generated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Models configuration
CREATE TABLE ai_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  api_endpoint TEXT,
  model_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  cost_per_1k_tokens DECIMAL(10, 6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trips table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  num_people INTEGER NOT NULL,
  budget_per_person DECIMAL(10, 2),
  city TEXT,
  budget_range TEXT,
  travel_type TEXT[] DEFAULT '{}',
  age_range TEXT,
  description TEXT,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'friends')),
  ai_model_id UUID REFERENCES ai_models(id),
  generated_content JSONB NOT NULL,
  total_cost DECIMAL(10, 2),
  tokens_used INTEGER,
  generation_time_ms INTEGER,
  is_exported BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trip itinerary items (for individual activities/days)
CREATE TABLE itinerary_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  time_slot TEXT,
  title TEXT NOT NULL,
  description TEXT,
  location_name TEXT,
  location_address TEXT,
  location_lat DECIMAL(10, 7),
  location_lng DECIMAL(10, 7),
  google_place_id TEXT,
  category TEXT,
  estimated_cost DECIMAL(10, 2),
  estimated_duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, day_number, order_index)
);

-- Voting on itinerary items
CREATE TABLE item_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_item_id UUID NOT NULL REFERENCES itinerary_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down', 'neutral')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(itinerary_item_id, user_id)
);

-- Trip collaborators (group members)
CREATE TABLE trip_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'editor', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

-- Threaded discussions
CREATE TABLE discussions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  itinerary_item_id UUID REFERENCES itinerary_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Followers
CREATE TABLE followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Trip likes
CREATE TABLE trip_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

-- AI Model performance tracking
CREATE TABLE model_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  ai_model_id UUID NOT NULL REFERENCES ai_models(id),
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_feedback TEXT,
  was_edited BOOLEAN DEFAULT false,
  edit_percentage DECIMAL(5, 2),
  was_saved BOOLEAN DEFAULT false,
  response_time_ms INTEGER,
  tokens_used INTEGER,
  cost DECIMAL(10, 6),
  error_occurred BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin logs
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_visibility ON trips(visibility);
CREATE INDEX idx_trips_created_at ON trips(created_at DESC);
CREATE INDEX idx_itinerary_items_trip_id ON itinerary_items(trip_id);
CREATE INDEX idx_discussions_trip_id ON discussions(trip_id);
CREATE INDEX idx_discussions_parent_id ON discussions(parent_id);
CREATE INDEX idx_trip_collaborators_trip_id ON trip_collaborators(trip_id);
CREATE INDEX idx_trip_collaborators_user_id ON trip_collaborators(user_id);
CREATE INDEX idx_model_performance_ai_model_id ON model_performance(ai_model_id);
CREATE INDEX idx_model_performance_created_at ON model_performance(created_at DESC);

-- Insert default AI models
INSERT INTO ai_models (name, display_name, provider, model_id, is_active, is_default, priority, cost_per_1k_tokens) VALUES
  ('gpt-4-turbo', 'GPT-4 Turbo', 'openai', 'gpt-4-turbo-preview', true, true, 1, 0.03),
  ('gpt-4', 'GPT-4', 'openai', 'gpt-4', true, false, 2, 0.06),
  ('claude-3.5-sonnet', 'Claude 3.5 Sonnet', 'anthropic', 'claude-3-5-sonnet-20241022', true, false, 3, 0.015),
  ('claude-3-opus', 'Claude 3 Opus', 'anthropic', 'claude-3-opus-20240229', true, false, 4, 0.075),
  ('gemini-pro', 'Gemini Pro', 'google', 'gemini-1.5-pro', true, false, 5, 0.0125),
  ('deepseek-chat', 'DeepSeek Chat', 'deepseek', 'deepseek-chat', true, false, 6, 0.001),
  ('qwen-plus', 'Qwen Plus', 'alibaba', 'qwen-plus', true, false, 7, 0.002),
  ('ernie-bot', 'ERNIE Bot', 'baidu', 'ernie-bot-4', true, false, 8, 0.003),
  ('glm-4', 'GLM-4', 'zhipu', 'glm-4', true, false, 9, 0.002),
  ('moonshot-v1', 'Moonshot v1', 'moonshot', 'moonshot-v1-8k', true, false, 10, 0.002);
