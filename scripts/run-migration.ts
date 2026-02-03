import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env file manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) {
    envVars[key.trim()] = values.join('=').trim();
  }
});

const pool = new Pool({
  connectionString: envVars.DATABASE_URL,
});

async function runMigration(filename: string) {
  const migrationPath = path.join(__dirname, '..', 'lib', 'db', 'migrations', filename);
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log(`Running migration: ${filename}`);
  console.log(`Database: ${envVars.DATABASE_URL?.substring(0, 30)}...`);

  try {
    await pool.query(sql);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const migrationFile = process.argv[2] || 'add_tour_bookings.sql';
runMigration(migrationFile);
