-- Add status column to users table for ban/activate functionality
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'banned'));

-- Add index for quick filtering by status
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
