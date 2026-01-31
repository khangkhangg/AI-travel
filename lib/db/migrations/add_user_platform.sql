-- User Platform Migration
-- Extends users table and adds profile, social, payment, travel history, badges, and collaboration features

-- =====================================================
-- EXTEND USERS TABLE
-- =====================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_deadline TIMESTAMPTZ;

-- =====================================================
-- USER SOCIAL LINKS
-- =====================================================

CREATE TABLE IF NOT EXISTS user_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- instagram, twitter, facebook, tiktok, youtube, linkedin, website
  value VARCHAR(500) NOT NULL, -- username or URL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

CREATE INDEX idx_user_social_links_user ON user_social_links(user_id);

-- =====================================================
-- USER PAYMENT LINKS (for tips)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- paypal, venmo, cashapp, wise, kofi, buymeacoffee
  value VARCHAR(500) NOT NULL, -- email, username, or link
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

CREATE INDEX idx_user_payment_links_user ON user_payment_links(user_id);

-- =====================================================
-- USER TRAVEL HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS user_travel_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  city VARCHAR(255) NOT NULL,
  country VARCHAR(255) NOT NULL,
  year INTEGER,
  month INTEGER CHECK (month IS NULL OR (month >= 1 AND month <= 12)),
  notes TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_travel_history_user ON user_travel_history(user_id);
CREATE INDEX idx_user_travel_history_location ON user_travel_history(country, city);

-- =====================================================
-- USER BADGES
-- =====================================================

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL,
  -- Badge types: first_itinerary, explorer, globetrotter, helpful, tipped_creator, verified_guide, local_expert
  metadata JSONB DEFAULT '{}', -- e.g., {"city": "Tokyo"} for local_expert
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type, (metadata->>'city')) -- Allow multiple local_expert badges for different cities
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_type ON user_badges(badge_type);

-- =====================================================
-- ITINERARIES (shared trip plans)
-- =====================================================

CREATE TABLE IF NOT EXISTS itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  destination_city VARCHAR(255),
  destination_country VARCHAR(255),
  start_date DATE,
  end_date DATE,
  visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'marketplace')),
  open_to_offers BOOLEAN DEFAULT FALSE,
  group_size INTEGER DEFAULT 1,
  interests TEXT[], -- e.g., ['food', 'culture', 'nature']
  clone_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  cloned_from_id UUID REFERENCES itineraries(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_itineraries_user ON itineraries(user_id);
CREATE INDEX idx_itineraries_visibility ON itineraries(visibility);
CREATE INDEX idx_itineraries_destination ON itineraries(destination_country, destination_city);
CREATE INDEX idx_itineraries_dates ON itineraries(start_date, end_date);
CREATE INDEX idx_itineraries_marketplace ON itineraries(visibility, open_to_offers) WHERE visibility = 'marketplace' AND open_to_offers = TRUE;

-- =====================================================
-- ITINERARY COLLABORATORS
-- =====================================================

CREATE TABLE IF NOT EXISTS itinerary_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('viewer', 'collaborator')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(itinerary_id, user_id)
);

CREATE INDEX idx_itinerary_collaborators_itinerary ON itinerary_collaborators(itinerary_id);
CREATE INDEX idx_itinerary_collaborators_user ON itinerary_collaborators(user_id);

-- =====================================================
-- ITINERARY SUGGESTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS itinerary_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_number INTEGER,
  activity_index INTEGER, -- which activity in the day
  suggestion_type VARCHAR(20) DEFAULT 'alternative' CHECK (suggestion_type IN ('replace', 'alternative', 'add', 'remove')),
  content JSONB NOT NULL, -- the suggested activity details
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_itinerary_suggestions_itinerary ON itinerary_suggestions(itinerary_id);
CREATE INDEX idx_itinerary_suggestions_status ON itinerary_suggestions(status);

-- =====================================================
-- ITINERARY VOTES
-- =====================================================

CREATE TABLE IF NOT EXISTS itinerary_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('activity', 'hotel', 'suggestion')),
  target_id VARCHAR(100) NOT NULL, -- activity index, hotel id, or suggestion id
  vote VARCHAR(10) NOT NULL CHECK (vote IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(itinerary_id, user_id, target_type, target_id)
);

CREATE INDEX idx_itinerary_votes_itinerary ON itinerary_votes(itinerary_id);
CREATE INDEX idx_itinerary_votes_target ON itinerary_votes(target_type, target_id);

-- =====================================================
-- ITINERARY COMMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS itinerary_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES itinerary_comments(id) ON DELETE CASCADE, -- for threaded replies
  day_number INTEGER, -- optional: comment on specific day
  activity_index INTEGER, -- optional: comment on specific activity
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_itinerary_comments_itinerary ON itinerary_comments(itinerary_id);
CREATE INDEX idx_itinerary_comments_user ON itinerary_comments(user_id);
CREATE INDEX idx_itinerary_comments_parent ON itinerary_comments(parent_id);

-- =====================================================
-- HOTELS (business accounts)
-- =====================================================

CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  city VARCHAR(255) NOT NULL,
  country VARCHAR(255) NOT NULL,
  address TEXT,
  star_rating INTEGER CHECK (star_rating >= 1 AND star_rating <= 5),
  photos TEXT[], -- array of URLs
  amenities TEXT[], -- e.g., ['wifi', 'pool', 'gym', 'breakfast']
  website VARCHAR(500),
  google_maps_url VARCHAR(500),
  agoda_url VARCHAR(500),
  booking_com_url VARCHAR(500),
  airbnb_url VARCHAR(500),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hotels_user ON hotels(user_id);
CREATE INDEX idx_hotels_location ON hotels(country, city);
CREATE INDEX idx_hotels_verified ON hotels(is_verified, is_active);

-- =====================================================
-- BUSINESS OFFERS
-- =====================================================

CREATE TABLE IF NOT EXISTS business_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type VARCHAR(20) NOT NULL CHECK (business_type IN ('guide', 'hotel')),
  business_id UUID NOT NULL, -- tour_guides.id or hotels.id
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  traveler_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  offer_details JSONB NOT NULL, -- flexible: tour info, room details, price, message
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT, -- custom message from business
  response_message TEXT, -- response from traveler
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX idx_business_offers_business ON business_offers(business_type, business_id);
CREATE INDEX idx_business_offers_itinerary ON business_offers(itinerary_id);
CREATE INDEX idx_business_offers_traveler ON business_offers(traveler_id);
CREATE INDEX idx_business_offers_status ON business_offers(status);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-increment clone count when itinerary is cloned
CREATE OR REPLACE FUNCTION increment_clone_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cloned_from_id IS NOT NULL THEN
    UPDATE itineraries SET clone_count = clone_count + 1 WHERE id = NEW.cloned_from_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_clone_count ON itineraries;
CREATE TRIGGER trigger_increment_clone_count
  AFTER INSERT ON itineraries
  FOR EACH ROW
  EXECUTE FUNCTION increment_clone_count();

-- Set verification deadline on user creation (30 days)
CREATE OR REPLACE FUNCTION set_verification_deadline()
RETURNS TRIGGER AS $$
BEGIN
  NEW.verification_deadline := NOW() + INTERVAL '30 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_verification_deadline ON users;
CREATE TRIGGER trigger_set_verification_deadline
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_verification_deadline();
