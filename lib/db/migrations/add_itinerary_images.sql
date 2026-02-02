-- Trip Images table for storing trip cover images
-- Supports both trips and itineraries tables
CREATE TABLE IF NOT EXISTS trip_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- At least one of trip_id or itinerary_id must be set
  CONSTRAINT trip_or_itinerary_required CHECK (trip_id IS NOT NULL OR itinerary_id IS NOT NULL)
);

CREATE INDEX idx_trip_images_trip ON trip_images(trip_id) WHERE trip_id IS NOT NULL;
CREATE INDEX idx_trip_images_itinerary ON trip_images(itinerary_id) WHERE itinerary_id IS NOT NULL;

-- Allow up to 3 images per trip/itinerary
CREATE OR REPLACE FUNCTION check_trip_image_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trip_id IS NOT NULL AND (SELECT COUNT(*) FROM trip_images WHERE trip_id = NEW.trip_id) >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 images per trip allowed';
  END IF;
  IF NEW.itinerary_id IS NOT NULL AND (SELECT COUNT(*) FROM trip_images WHERE itinerary_id = NEW.itinerary_id) >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 images per itinerary allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_trip_image_limit ON trip_images;
CREATE TRIGGER enforce_trip_image_limit
BEFORE INSERT ON trip_images
FOR EACH ROW EXECUTE FUNCTION check_trip_image_limit();
