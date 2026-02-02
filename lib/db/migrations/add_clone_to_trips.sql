-- Add clone tracking columns to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS clone_count INTEGER DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS cloned_from_id UUID REFERENCES trips(id) ON DELETE SET NULL;

-- Create trigger function to auto-increment clone_count
CREATE OR REPLACE FUNCTION increment_trip_clone_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cloned_from_id IS NOT NULL THEN
    UPDATE trips SET clone_count = clone_count + 1 WHERE id = NEW.cloned_from_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists to avoid duplicates)
DROP TRIGGER IF EXISTS trigger_increment_trip_clone_count ON trips;
CREATE TRIGGER trigger_increment_trip_clone_count
  AFTER INSERT ON trips
  FOR EACH ROW
  EXECUTE FUNCTION increment_trip_clone_count();

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_trips_cloned_from_id ON trips(cloned_from_id);
