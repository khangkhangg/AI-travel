-- Migration: Add featured_creators table for Creator page
-- Date: 2026-02-03

-- =====================================================
-- FEATURED CREATORS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS featured_creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,  -- matches interest tags: 'food', 'culture', 'nature', etc.
  display_order INT DEFAULT 0,
  featured_until TIMESTAMPTZ,  -- NULL = forever, date = auto-expires
  featured_by UUID REFERENCES users(id),  -- admin who featured them
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category)  -- same creator can be in multiple categories
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_featured_creators_category ON featured_creators(category);
CREATE INDEX IF NOT EXISTS idx_featured_creators_until ON featured_creators(featured_until)
  WHERE featured_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_featured_creators_user ON featured_creators(user_id);
CREATE INDEX IF NOT EXISTS idx_featured_creators_order ON featured_creators(category, display_order);

-- =====================================================
-- HELPER VIEW: CREATORS WITH STATS
-- =====================================================
-- This view aggregates creator statistics from trips table
-- Used by /api/creators endpoint

CREATE OR REPLACE VIEW creator_stats AS
SELECT
  u.id,
  u.username,
  u.full_name,
  u.avatar_url,
  u.bio,
  u.location,
  u.is_guide,
  COUNT(DISTINCT t.id) as itinerary_count,
  COALESCE(SUM(t.views_count), 0) as total_views,
  COALESCE(SUM(COALESCE(t.clone_count, 0)), 0) as total_clones,
  ARRAY_AGG(DISTINCT t.city) FILTER (WHERE t.city IS NOT NULL) as destinations,
  ARRAY_AGG(DISTINCT unnest_interest) FILTER (WHERE unnest_interest IS NOT NULL) as all_interests,
  BOOL_OR(t.visibility = 'curated') as is_local_expert
FROM users u
JOIN trips t ON t.user_id = u.id
LEFT JOIN LATERAL unnest(t.travel_type) as unnest_interest ON true
WHERE t.visibility IN ('public', 'marketplace', 'curated')
  AND u.username IS NOT NULL
GROUP BY u.id, u.username, u.full_name, u.avatar_url, u.bio, u.location, u.is_guide;

-- =====================================================
-- INTEREST CATEGORY METADATA
-- =====================================================

CREATE TABLE IF NOT EXISTS interest_categories (
  id TEXT PRIMARY KEY,  -- 'food', 'culture', etc.
  emoji TEXT NOT NULL,
  label TEXT NOT NULL,
  display_order INT DEFAULT 0
);

-- Insert default interest categories
INSERT INTO interest_categories (id, emoji, label, display_order) VALUES
  ('food', '🍜', 'Food Experts', 1),
  ('culture', '🏛️', 'Culture Enthusiasts', 2),
  ('nature', '🌿', 'Nature Lovers', 3),
  ('adventure', '⛰️', 'Adventure Seekers', 4),
  ('nightlife', '🌙', 'Nightlife Guides', 5),
  ('shopping', '🛍️', 'Shopping Experts', 6),
  ('relaxation', '🧘', 'Relaxation Gurus', 7),
  ('history', '📜', 'History Buffs', 8)
ON CONFLICT (id) DO UPDATE SET
  emoji = EXCLUDED.emoji,
  label = EXCLUDED.label,
  display_order = EXCLUDED.display_order;
