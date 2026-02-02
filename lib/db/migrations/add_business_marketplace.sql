-- Business Marketplace Migration
-- Creates tables for businesses, proposals, service needs, and accommodations

-- Business accounts
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_type VARCHAR(20) NOT NULL CHECK (business_type IN ('guide', 'hotel', 'transport', 'experience', 'health')),
  business_name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url VARCHAR(500),
  coverage_areas JSONB DEFAULT '[]',
  contact_info JSONB DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  verified BOOLEAN DEFAULT false,
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business type-specific details
CREATE TABLE IF NOT EXISTS business_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  details JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business services catalog
CREATE TABLE IF NOT EXISTS business_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  service_name VARCHAR(255) NOT NULL,
  description TEXT,
  price_type VARCHAR(20) CHECK (price_type IN ('hourly', 'daily', 'fixed', 'per_person')),
  base_price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  add_ons JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trip service needs (marketplace requests)
CREATE TABLE IF NOT EXISTS trip_service_needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  activity_id UUID,
  service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('guide', 'hotel', 'transport', 'experience', 'health')),
  notes TEXT,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'has_offers', 'booked')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trip accommodation needs (per-night)
CREATE TABLE IF NOT EXISTS trip_accommodations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  night_number INTEGER NOT NULL,
  date DATE,
  status VARCHAR(20) DEFAULT 'need' CHECK (status IN ('need', 'booked_open', 'booked_final')),
  current_booking JSONB,
  location_preference VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace proposals (bids)
CREATE TABLE IF NOT EXISTS marketplace_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  service_needs_ids UUID[],
  services_offered JSONB NOT NULL,
  pricing_breakdown JSONB NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  message TEXT,
  terms JSONB,
  attachments JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'negotiating', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposal messages (for negotiation)
CREATE TABLE IF NOT EXISTS proposal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES marketplace_proposals(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add guide mode columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_guide BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS guide_details JSONB;

-- Add marketplace_needs to trips table for quick filtering
ALTER TABLE trips ADD COLUMN IF NOT EXISTS marketplace_needs JSONB DEFAULT '[]';
ALTER TABLE trips ADD COLUMN IF NOT EXISTS marketplace_budget_min DECIMAL(10,2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS marketplace_budget_max DECIMAL(10,2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS marketplace_notes TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_type ON businesses(business_type);
CREATE INDEX IF NOT EXISTS idx_businesses_active ON businesses(is_active);
CREATE INDEX IF NOT EXISTS idx_business_services_business_id ON business_services(business_id);
CREATE INDEX IF NOT EXISTS idx_trip_service_needs_trip_id ON trip_service_needs(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_service_needs_type ON trip_service_needs(service_type);
CREATE INDEX IF NOT EXISTS idx_trip_accommodations_trip_id ON trip_accommodations(trip_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_proposals_trip_id ON marketplace_proposals(trip_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_proposals_business_id ON marketplace_proposals(business_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_proposals_status ON marketplace_proposals(status);
CREATE INDEX IF NOT EXISTS idx_trips_visibility_marketplace ON trips(visibility) WHERE visibility = 'marketplace';
CREATE INDEX IF NOT EXISTS idx_users_is_guide ON users(is_guide) WHERE is_guide = true;
