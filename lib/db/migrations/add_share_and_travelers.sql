-- Migration: Add share_code column and trip_travelers table
-- Run this migration to add support for sharing and travelers

-- Add share_code column to trips if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'share_code'
  ) THEN
    ALTER TABLE trips ADD COLUMN share_code TEXT UNIQUE;
    CREATE INDEX idx_trips_share_code ON trips(share_code);
  END IF;
END $$;

-- Make some columns nullable for chat-created trips
ALTER TABLE trips ALTER COLUMN start_date DROP NOT NULL;
ALTER TABLE trips ALTER COLUMN end_date DROP NOT NULL;
ALTER TABLE trips ALTER COLUMN num_people DROP NOT NULL;
ALTER TABLE trips ALTER COLUMN generated_content DROP NOT NULL;

-- Create trip_travelers table
CREATE TABLE IF NOT EXISTS trip_travelers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  is_child BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for trip_travelers
CREATE INDEX IF NOT EXISTS idx_trip_travelers_trip_id ON trip_travelers(trip_id);

-- Add item_type column to itinerary_items if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'itinerary_items' AND column_name = 'item_type'
  ) THEN
    ALTER TABLE itinerary_items ADD COLUMN item_type TEXT DEFAULT 'activity';
  END IF;
END $$;

-- Rename location column if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'itinerary_items' AND column_name = 'location'
  ) THEN
    ALTER TABLE itinerary_items ADD COLUMN location TEXT;
  END IF;
END $$;
