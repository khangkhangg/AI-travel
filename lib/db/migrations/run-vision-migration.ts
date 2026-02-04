import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Load .env manually
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  });
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const sql = fs.readFileSync('lib/db/migrations/add_vision_ai_models.sql', 'utf-8');

  // Split by semicolons, filter out comments-only lines
  const statements = sql.split(';')
    .map(s => s.trim())
    .filter(s => {
      // Remove empty statements
      if (!s) return false;
      // Check if statement has actual SQL (not just comments)
      const nonCommentLines = s.split('\n').filter(line => !line.trim().startsWith('--'));
      return nonCommentLines.some(line => line.trim().length > 0);
    });

  for (const stmt of statements) {
    try {
      await pool.query(stmt);
      const preview = stmt.replace(/\n/g, ' ').slice(0, 60);
      console.log('✓ Executed:', preview + '...');
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        console.log('- Skipped (already exists)');
      } else {
        console.error('Error:', e.message.slice(0, 100));
      }
    }
  }

  // Verify vision models were added
  const result = await pool.query(
    "SELECT name, display_name, model_type, cost_per_1k_tokens FROM ai_models WHERE model_type = 'vision' ORDER BY priority"
  );
  console.log('\n✅ Vision models added:');
  console.table(result.rows);

  // Verify site settings
  const settings = await pool.query(
    "SELECT key, value FROM site_settings WHERE key LIKE 'ekyc%'"
  );
  console.log('\n✅ eKYC settings:');
  console.table(settings.rows);

  await pool.end();
}

migrate().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
