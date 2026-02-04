-- Add withdrawn and withdrawal_requested status to marketplace_proposals
-- Drop old constraint and add new one with additional status values

-- Drop the old constraint (PostgreSQL doesn't allow direct ALTER of CHECK constraints)
ALTER TABLE marketplace_proposals DROP CONSTRAINT IF EXISTS marketplace_proposals_status_check;

-- Add the new constraint with withdrawn and withdrawal_requested status
ALTER TABLE marketplace_proposals
ADD CONSTRAINT marketplace_proposals_status_check
CHECK (status IN ('pending', 'accepted', 'declined', 'negotiating', 'expired', 'withdrawn', 'withdrawal_requested'));
