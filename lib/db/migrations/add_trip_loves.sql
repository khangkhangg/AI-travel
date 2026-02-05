-- Add trip loves table for tracking user likes/loves on trips
CREATE TABLE IF NOT EXISTS trip_loves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, user_id)  -- Prevent duplicate loves from same user
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_trip_loves_trip_id ON trip_loves(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_loves_user_id ON trip_loves(user_id);

-- Add love count tracking (denormalized for performance)
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS love_count INTEGER DEFAULT 0;
