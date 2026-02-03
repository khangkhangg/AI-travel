-- Tour Bookings System Migration
-- Run this migration to add tour booking functionality

-- Drop and recreate tour_bookings table to ensure clean state
DROP TABLE IF EXISTS tour_bookings CASCADE;

-- Tour bookings table
CREATE TABLE tour_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  visitor_name VARCHAR(255) NOT NULL,
  visitor_email VARCHAR(255) NOT NULL,
  visitor_phone VARCHAR(50),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  party_size INTEGER DEFAULT 1,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_tour_bookings_guide_id ON tour_bookings(guide_id);
CREATE INDEX idx_tour_bookings_date ON tour_bookings(booking_date);
CREATE INDEX idx_tour_bookings_status ON tour_bookings(status);
CREATE INDEX idx_tour_bookings_guide_date ON tour_bookings(guide_id, booking_date);

-- Insert default site setting for Google Calendar (if not exists)
INSERT INTO site_settings (key, value)
VALUES (
  'google_calendar_booking_enabled',
  'false'
)
ON CONFLICT (key) DO NOTHING;
