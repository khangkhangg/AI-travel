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
    console.log('Running user profile theme migration...\n');

    // Add profile_theme column to users table
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_theme VARCHAR(50) DEFAULT 'journey'
    `);
    console.log('✓ Added profile_theme column to users table');

    console.log('\n✅ User profile theme migration complete');
  } catch (e: any) {
    console.error('❌ Migration error:', e.message);
    throw e;
  } finally {
    await pool.end();
  }
}

migrate();
