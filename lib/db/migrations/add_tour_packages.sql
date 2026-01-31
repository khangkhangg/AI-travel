-- Tour Packages Migration
-- Enables tour guides to create and manage tour packages

-- Tour guides table (users who can create tours)
CREATE TABLE tour_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  business_name TEXT,
  bio TEXT,
  city TEXT,
  country TEXT,
  phone TEXT,
  website TEXT,
  languages TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  years_experience INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tour tags (pre-defined categories)
CREATE TABLE tour_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default tour tags
INSERT INTO tour_tags (name, slug, description, icon, color, sort_order) VALUES
  ('General', 'general', 'Suitable for all travelers', '🌍', 'bg-blue-500', 1),
  ('Adventure', 'adventure', 'Thrilling outdoor activities', '🏔️', 'bg-orange-500', 2),
  ('Cultural', 'cultural', 'Heritage and traditions', '🏛️', 'bg-purple-500', 3),
  ('Food & Culinary', 'food', 'Gastronomic experiences', '🍜', 'bg-rose-500', 4),
  ('Nature & Wildlife', 'nature', 'Flora and fauna exploration', '🦁', 'bg-green-500', 5),
  ('Beach & Water', 'beach', 'Coastal and water activities', '🏖️', 'bg-cyan-500', 6),
  ('Nightlife', 'nightlife', 'Evening entertainment', '🌙', 'bg-indigo-500', 7),
  ('Wellness & Spa', 'wellness', 'Relaxation and health', '🧘', 'bg-teal-500', 8),
  ('Photography', 'photography', 'Scenic photo opportunities', '📷', 'bg-amber-500', 9),
  ('Historical', 'historical', 'History and landmarks', '🏰', 'bg-stone-500', 10),
  ('Romantic', 'romantic', 'Couples and honeymoon', '💕', 'bg-pink-500', 11),
  ('Family Friendly', 'family', 'Activities for all ages', '👨‍👩‍👧‍👦', 'bg-sky-500', 12),
  ('Luxury', 'luxury', 'Premium experiences', '✨', 'bg-yellow-500', 13),
  ('Budget', 'budget', 'Affordable options', '💰', 'bg-emerald-500', 14),
  ('Extreme Sports', 'extreme', 'High-adrenaline activities', '🪂', 'bg-red-500', 15),
  ('Adult Only', 'adult', '18+ experiences', '🔞', 'bg-gray-700', 16),
  ('Health & Fitness', 'health', 'Active and fitness focused', '💪', 'bg-lime-500', 17),
  ('Chill & Relaxing', 'chill', 'Slow-paced and peaceful', '😌', 'bg-violet-400', 18),
  ('Eco Tourism', 'eco', 'Sustainable travel', '🌱', 'bg-green-600', 19),
  ('Spiritual', 'spiritual', 'Religious and meditation', '🙏', 'bg-amber-600', 20);

-- Tours table (the main tour packages)
CREATE TABLE tours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guide_id UUID NOT NULL REFERENCES tour_guides(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  highlights TEXT[] DEFAULT '{}',

  -- Location
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  meeting_point TEXT,
  meeting_point_lat DECIMAL(10, 7),
  meeting_point_lng DECIMAL(10, 7),

  -- Duration & Pricing
  duration_days INTEGER NOT NULL DEFAULT 1,
  duration_hours INTEGER DEFAULT 0,
  price_per_person DECIMAL(10, 2) NOT NULL,
  price_currency TEXT DEFAULT 'USD',
  max_group_size INTEGER DEFAULT 10,
  min_group_size INTEGER DEFAULT 1,

  -- Content
  what_included TEXT[] DEFAULT '{}',
  what_not_included TEXT[] DEFAULT '{}',
  requirements TEXT[] DEFAULT '{}',
  notes TEXT,
  instructions TEXT,
  cancellation_policy TEXT,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'inactive', 'archived')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  is_featured BOOLEAN DEFAULT false,

  -- Stats
  views_count INTEGER DEFAULT 0,
  bookings_count INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Tour to tags mapping (many-to-many)
CREATE TABLE tour_tag_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tour_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tour_id, tag_id)
);

-- Tour images
CREATE TABLE tour_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  is_cover BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tour activities (daily itinerary)
CREATE TABLE tour_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  time_start TEXT,
  time_end TEXT,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  location_lat DECIMAL(10, 7),
  location_lng DECIMAL(10, 7),
  duration_minutes INTEGER,
  activity_type TEXT DEFAULT 'activity' CHECK (activity_type IN ('activity', 'food', 'transport', 'accommodation', 'free_time', 'meeting')),
  is_optional BOOLEAN DEFAULT false,
  extra_cost DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tour_id, day_number, order_index)
);

-- Tour availability (specific dates when tour runs)
CREATE TABLE tour_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  spots_available INTEGER NOT NULL,
  spots_booked INTEGER DEFAULT 0,
  price_override DECIMAL(10, 2),
  is_available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tour_id, date)
);

-- Tour reviews
CREATE TABLE tour_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  photos TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  guide_response TEXT,
  guide_response_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tour_id, user_id)
);

-- Tour bookings
CREATE TABLE tour_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  availability_id UUID REFERENCES tour_availability(id),

  -- Booking details
  booking_date DATE NOT NULL,
  num_travelers INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL,

  -- Contact info
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  special_requests TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'refunded', 'no_show')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded', 'failed')),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT
);

-- Indexes for performance
CREATE INDEX idx_tour_guides_user_id ON tour_guides(user_id);
CREATE INDEX idx_tour_guides_is_active ON tour_guides(is_active);
CREATE INDEX idx_tour_guides_location ON tour_guides(country, city);
CREATE INDEX idx_tours_guide_id ON tours(guide_id);
CREATE INDEX idx_tours_city ON tours(city);
CREATE INDEX idx_tours_country ON tours(country);
CREATE INDEX idx_tours_status ON tours(status);
CREATE INDEX idx_tours_visibility ON tours(visibility);
CREATE INDEX idx_tours_price ON tours(price_per_person);
CREATE INDEX idx_tours_rating ON tours(rating DESC);
CREATE INDEX idx_tours_created_at ON tours(created_at DESC);
CREATE INDEX idx_tour_images_tour_id ON tour_images(tour_id);
CREATE INDEX idx_tour_activities_tour_id ON tour_activities(tour_id);
CREATE INDEX idx_tour_availability_tour_id ON tour_availability(tour_id);
CREATE INDEX idx_tour_availability_date ON tour_availability(date);
CREATE INDEX idx_tour_reviews_tour_id ON tour_reviews(tour_id);
CREATE INDEX idx_tour_bookings_tour_id ON tour_bookings(tour_id);
CREATE INDEX idx_tour_bookings_user_id ON tour_bookings(user_id);
CREATE INDEX idx_tour_bookings_status ON tour_bookings(status);

-- Function to update tour rating
CREATE OR REPLACE FUNCTION update_tour_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tours
  SET
    rating = (SELECT COALESCE(AVG(rating), 0) FROM tour_reviews WHERE tour_id = NEW.tour_id AND is_visible = true),
    reviews_count = (SELECT COUNT(*) FROM tour_reviews WHERE tour_id = NEW.tour_id AND is_visible = true),
    updated_at = NOW()
  WHERE id = NEW.tour_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tour_rating
AFTER INSERT OR UPDATE OR DELETE ON tour_reviews
FOR EACH ROW EXECUTE FUNCTION update_tour_rating();

-- Function to update guide rating
CREATE OR REPLACE FUNCTION update_guide_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tour_guides
  SET
    rating = (
      SELECT COALESCE(AVG(t.rating), 0)
      FROM tours t
      WHERE t.guide_id = (SELECT guide_id FROM tours WHERE id = NEW.tour_id)
      AND t.reviews_count > 0
    ),
    total_reviews = (
      SELECT COALESCE(SUM(t.reviews_count), 0)
      FROM tours t
      WHERE t.guide_id = (SELECT guide_id FROM tours WHERE id = NEW.tour_id)
    ),
    updated_at = NOW()
  WHERE id = (SELECT guide_id FROM tours WHERE id = NEW.tour_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_guide_rating
AFTER INSERT OR UPDATE OR DELETE ON tour_reviews
FOR EACH ROW EXECUTE FUNCTION update_guide_rating();
