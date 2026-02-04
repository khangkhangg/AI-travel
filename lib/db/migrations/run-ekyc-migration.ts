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
    await pool.query('ALTER TABLE business_verification_documents ADD COLUMN IF NOT EXISTS ai_analysis JSONB');
    console.log('✓ Added ai_analysis column');
    await pool.query('ALTER TABLE business_verification_documents ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMP WITH TIME ZONE');
    console.log('✓ Added ai_analyzed_at column');
    await pool.query('ALTER TABLE business_verification_documents ADD COLUMN IF NOT EXISTS ai_model TEXT');
    console.log('✓ Added ai_model column');
    console.log('\n✅ eKYC analysis columns migration complete');
  } catch (e: any) {
    console.error('Error:', e.message);
  }
  await pool.end();
}

migrate();
