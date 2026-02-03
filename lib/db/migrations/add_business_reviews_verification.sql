-- Business Reviews, Verification, and Notifications Migration
-- Adds support for user reviews, eKYC verification, and notification settings

-- Business reviews from users
CREATE TABLE IF NOT EXISTS business_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  -- User verification flags (crowdsourced trust signals)
  verified_contact BOOLEAN DEFAULT FALSE,
  verified_location BOOLEAN DEFAULT FALSE,
  verified_services BOOLEAN DEFAULT FALSE,
  verified_pricing BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate reviews from same user
  UNIQUE(business_id, reviewer_id)
);

-- Business verification documents for eKYC
CREATE TABLE IF NOT EXISTS business_verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('business_license', 'owner_id')),
  document_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- One document per type per business
  UNIQUE(business_id, document_type)
);

-- Business notification preferences
CREATE TABLE IF NOT EXISTS business_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  -- Email notifications
  email_new_trips BOOLEAN DEFAULT TRUE,
  email_proposal_updates BOOLEAN DEFAULT TRUE,
  email_new_reviews BOOLEAN DEFAULT TRUE,
  email_weekly_digest BOOLEAN DEFAULT FALSE,
  -- Telegram notifications
  telegram_id VARCHAR(100),
  telegram_verified BOOLEAN DEFAULT FALSE,
  telegram_new_trips BOOLEAN DEFAULT TRUE,
  telegram_proposal_updates BOOLEAN DEFAULT TRUE,
  telegram_new_reviews BOOLEAN DEFAULT TRUE,
  telegram_daily_summary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id)
);

-- Add new columns to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS verification_counts JSONB DEFAULT '{"contact": 0, "location": 0, "services": 0, "pricing": 0}';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ekyc_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ekyc_verified_at TIMESTAMPTZ;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS slug VARCHAR(100);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS completed_trips_count INTEGER DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS response_rate DECIMAL(5,2) DEFAULT 0;

-- Create unique index for slug (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS businesses_slug_idx ON businesses(slug) WHERE slug IS NOT NULL;

-- Create indexes for reviews
CREATE INDEX IF NOT EXISTS business_reviews_business_id_idx ON business_reviews(business_id);
CREATE INDEX IF NOT EXISTS business_reviews_reviewer_id_idx ON business_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS business_reviews_rating_idx ON business_reviews(rating);
CREATE INDEX IF NOT EXISTS business_reviews_created_at_idx ON business_reviews(created_at DESC);

-- Create indexes for verification documents
CREATE INDEX IF NOT EXISTS business_verification_documents_business_id_idx ON business_verification_documents(business_id);
CREATE INDEX IF NOT EXISTS business_verification_documents_status_idx ON business_verification_documents(status);

-- Create index for notification settings
CREATE INDEX IF NOT EXISTS business_notification_settings_business_id_idx ON business_notification_settings(business_id);
CREATE INDEX IF NOT EXISTS business_notification_settings_telegram_id_idx ON business_notification_settings(telegram_id) WHERE telegram_id IS NOT NULL;

-- Function to update business rating and verification counts when a review is added/updated
CREATE OR REPLACE FUNCTION update_business_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update rating and review_count
  UPDATE businesses
  SET
    rating = (
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM business_reviews
      WHERE business_id = COALESCE(NEW.business_id, OLD.business_id)
    ),
    review_count = (
      SELECT COUNT(*)
      FROM business_reviews
      WHERE business_id = COALESCE(NEW.business_id, OLD.business_id)
    ),
    verification_counts = (
      SELECT jsonb_build_object(
        'contact', COUNT(*) FILTER (WHERE verified_contact = true),
        'location', COUNT(*) FILTER (WHERE verified_location = true),
        'services', COUNT(*) FILTER (WHERE verified_services = true),
        'pricing', COUNT(*) FILTER (WHERE verified_pricing = true)
      )
      FROM business_reviews
      WHERE business_id = COALESCE(NEW.business_id, OLD.business_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.business_id, OLD.business_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for review stats
DROP TRIGGER IF EXISTS trigger_update_business_review_stats ON business_reviews;
CREATE TRIGGER trigger_update_business_review_stats
  AFTER INSERT OR UPDATE OR DELETE ON business_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_business_review_stats();

-- Function to check eKYC verification status
CREATE OR REPLACE FUNCTION update_business_ekyc_status()
RETURNS TRIGGER AS $$
DECLARE
  license_approved BOOLEAN;
  id_approved BOOLEAN;
BEGIN
  -- Check if both documents are approved
  SELECT
    EXISTS(SELECT 1 FROM business_verification_documents WHERE business_id = NEW.business_id AND document_type = 'business_license' AND status = 'approved'),
    EXISTS(SELECT 1 FROM business_verification_documents WHERE business_id = NEW.business_id AND document_type = 'owner_id' AND status = 'approved')
  INTO license_approved, id_approved;

  -- Update eKYC status
  UPDATE businesses
  SET
    ekyc_verified = (license_approved AND id_approved),
    ekyc_verified_at = CASE WHEN (license_approved AND id_approved) THEN NOW() ELSE NULL END,
    updated_at = NOW()
  WHERE id = NEW.business_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for eKYC status
DROP TRIGGER IF EXISTS trigger_update_business_ekyc_status ON business_verification_documents;
CREATE TRIGGER trigger_update_business_ekyc_status
  AFTER INSERT OR UPDATE ON business_verification_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_business_ekyc_status();
