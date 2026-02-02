const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Read .env manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
});

async function run() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'not set');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('Running user platform migration...');

    // Run each statement separately
    const statements = [
      // Extend users table
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_deadline TIMESTAMPTZ`,

      // User social links
      `CREATE TABLE IF NOT EXISTS user_social_links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL,
        value VARCHAR(500) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, platform)
      )`,
      `CREATE INDEX IF NOT EXISTS idx_user_social_links_user ON user_social_links(user_id)`,

      // User payment links
      `CREATE TABLE IF NOT EXISTS user_payment_links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL,
        value VARCHAR(500) NOT NULL,
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, platform)
      )`,
      `CREATE INDEX IF NOT EXISTS idx_user_payment_links_user ON user_payment_links(user_id)`,

      // User travel history
      `CREATE TABLE IF NOT EXISTS user_travel_history (
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
      )`,
      `CREATE INDEX IF NOT EXISTS idx_user_travel_history_user ON user_travel_history(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_user_travel_history_location ON user_travel_history(country, city)`,

      // User badges
      `CREATE TABLE IF NOT EXISTS user_badges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        badge_type VARCHAR(50) NOT NULL,
        metadata JSONB DEFAULT '{}',
        earned_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_user_badges_type ON user_badges(badge_type)`,

      // Site settings table
      `CREATE TABLE IF NOT EXISTS site_settings (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`,

      // User follows table
      `CREATE TABLE IF NOT EXISTS user_follows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(follower_id, following_id)
      )`,
      `CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id)`,
      `CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id)`,

      // Add wishlist field to travel history
      `ALTER TABLE user_travel_history ADD COLUMN IF NOT EXISTS is_wishlist BOOLEAN DEFAULT FALSE`,

      // Add profile visibility to users
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR(20) DEFAULT 'public'`,

      // Insert default profile design setting
      `INSERT INTO site_settings (key, value) VALUES ('profile_design', '"journey"') ON CONFLICT (key) DO NOTHING`,
    ];

    for (const statement of statements) {
      try {
        await pool.query(statement);
        console.log('✓ Executed:', statement.substring(0, 60) + '...');
      } catch (err) {
        console.log('⚠ Skipped (already exists or error):', statement.substring(0, 60) + '...', err.message);
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    await pool.end();
  }
}
run();
