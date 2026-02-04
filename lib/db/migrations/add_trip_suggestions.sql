-- Trip Suggestions Migration
-- Creates table for creator/user location suggestions on trips
-- and adds activity_id to marketplace_proposals for per-activity bids

-- =====================================================
-- TRIP SUGGESTIONS (from creators/experienced travelers)
-- =====================================================

CREATE TABLE IF NOT EXISTS trip_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES itinerary_items(id) ON DELETE CASCADE,
  day_number INTEGER,
  place_name VARCHAR(255) NOT NULL,
  reason TEXT NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  source_url TEXT,
  category VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if table already exists
ALTER TABLE trip_suggestions ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE trip_suggestions ADD COLUMN IF NOT EXISTS location_address TEXT;

CREATE INDEX IF NOT EXISTS idx_trip_suggestions_trip ON trip_suggestions(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_suggestions_user ON trip_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_suggestions_activity ON trip_suggestions(activity_id);
CREATE INDEX IF NOT EXISTS idx_trip_suggestions_status ON trip_suggestions(status);

-- =====================================================
-- ADD ACTIVITY_ID TO MARKETPLACE_PROPOSALS
-- =====================================================

ALTER TABLE marketplace_proposals
ADD COLUMN IF NOT EXISTS activity_id UUID REFERENCES itinerary_items(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_marketplace_proposals_activity ON marketplace_proposals(activity_id);
