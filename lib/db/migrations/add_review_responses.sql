-- Add business response columns to business_reviews table
-- Migration: add_review_responses.sql

ALTER TABLE business_reviews ADD COLUMN IF NOT EXISTS response_text TEXT;
ALTER TABLE business_reviews ADD COLUMN IF NOT EXISTS response_at TIMESTAMPTZ;
ALTER TABLE business_reviews ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'open';

-- Add check constraint for status values (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'business_reviews_status_check'
  ) THEN
    ALTER TABLE business_reviews ADD CONSTRAINT business_reviews_status_check
      CHECK (status IN ('open', 'resolved', 'flagged'));
  END IF;
END $$;

-- Create index for filtering by status
CREATE INDEX IF NOT EXISTS idx_business_reviews_status ON business_reviews(status);
CREATE INDEX IF NOT EXISTS idx_business_reviews_business_status ON business_reviews(business_id, status);
