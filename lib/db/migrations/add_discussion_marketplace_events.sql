-- Migration: Add Discussion Marketplace Events
-- Description: Ensure discussions table has message_type and metadata columns for marketplace events
-- Date: 2026-02-05

-- Add message_type column if it doesn't exist
ALTER TABLE discussions
  ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'message';

-- Add metadata column if it doesn't exist
ALTER TABLE discussions
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create index for filtering by message_type
CREATE INDEX IF NOT EXISTS idx_discussions_message_type
  ON discussions(message_type);

-- Create index for activity-specific marketplace events
CREATE INDEX IF NOT EXISTS idx_discussions_trip_item
  ON discussions(trip_id, itinerary_item_id);

-- Comment on columns
COMMENT ON COLUMN discussions.message_type IS 'Type of discussion message: message, deleted_activity, proposal_created, proposal_accepted, proposal_declined, proposal_withdrawn, proposal_withdrawal_requested, suggestion_created, suggestion_used, suggestion_dismissed';
COMMENT ON COLUMN discussions.metadata IS 'JSON metadata for system messages containing event details';
