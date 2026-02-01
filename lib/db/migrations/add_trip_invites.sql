-- Migration: Add trip_invites table for collaboration invites
-- Stores pending invites with tokens that expire after 7 days

CREATE TABLE IF NOT EXISTS trip_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'viewer',
  token VARCHAR(64) UNIQUE NOT NULL,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT valid_role CHECK (role IN ('editor', 'viewer'))
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_trip_invites_token ON trip_invites(token);

-- Index for finding invites by trip
CREATE INDEX IF NOT EXISTS idx_trip_invites_trip_id ON trip_invites(trip_id);

-- Index for finding invites by email
CREATE INDEX IF NOT EXISTS idx_trip_invites_email ON trip_invites(email);
