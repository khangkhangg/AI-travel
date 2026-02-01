-- Migration: Add collaborative planning features to itinerary_items
-- Adds columns for voting finalization, payment tracking, URLs, timing, and summary

-- Add is_final column for marking confirmed activities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'itinerary_items' AND column_name = 'is_final'
  ) THEN
    ALTER TABLE itinerary_items ADD COLUMN is_final BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add payer_id for payment assignment
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'itinerary_items' AND column_name = 'payer_id'
  ) THEN
    ALTER TABLE itinerary_items ADD COLUMN payer_id UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add is_split for split payment tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'itinerary_items' AND column_name = 'is_split'
  ) THEN
    ALTER TABLE itinerary_items ADD COLUMN is_split BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add source_url for Google Maps and other links
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'itinerary_items' AND column_name = 'source_url'
  ) THEN
    ALTER TABLE itinerary_items ADD COLUMN source_url TEXT;
  END IF;
END $$;

-- Add time_start for activity timing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'itinerary_items' AND column_name = 'time_start'
  ) THEN
    ALTER TABLE itinerary_items ADD COLUMN time_start TEXT;
  END IF;
END $$;

-- Add time_end for activity timing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'itinerary_items' AND column_name = 'time_end'
  ) THEN
    ALTER TABLE itinerary_items ADD COLUMN time_end TEXT;
  END IF;
END $$;

-- Add summary for short display text
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'itinerary_items' AND column_name = 'summary'
  ) THEN
    ALTER TABLE itinerary_items ADD COLUMN summary TEXT;
  END IF;
END $$;

-- Add arrival_time and departure_time to trips
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'arrival_time'
  ) THEN
    ALTER TABLE trips ADD COLUMN arrival_time TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'departure_time'
  ) THEN
    ALTER TABLE trips ADD COLUMN departure_time TEXT;
  END IF;
END $$;
