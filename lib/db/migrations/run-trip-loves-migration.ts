import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Load .env manually
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1];
      if (process.env[key] === undefined) {
        process.env[key] = match[2].replace(/^["']|["']$/g, '');
      }
    }
  });
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  try {
    console.log('Running trip loves migration...\n');

    // Create trip_loves table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trip_loves (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(trip_id, user_id)
      )
    `);
    console.log('✓ Created trip_loves table');

    // Add indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_trip_loves_trip_id ON trip_loves(trip_id)');
    console.log('✓ Created idx_trip_loves_trip_id index');

    await pool.query('CREATE INDEX IF NOT EXISTS idx_trip_loves_user_id ON trip_loves(user_id)');
    console.log('✓ Created idx_trip_loves_user_id index');

    // Add love_count column to trips table
    await pool.query('ALTER TABLE trips ADD COLUMN IF NOT EXISTS love_count INTEGER DEFAULT 0');
    console.log('✓ Added love_count column to trips table');

    console.log('\n✅ Trip loves migration complete');
  } catch (e: any) {
    console.error('❌ Migration error:', e.message);
    throw e;
  } finally {
    await pool.end();
  }
}

migrate();
