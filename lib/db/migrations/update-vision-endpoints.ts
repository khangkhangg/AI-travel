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

async function update() {
  // Update DeepSeek VL2 to use SiliconFlow endpoint
  // DeepSeek's official API doesn't support vision models - need SiliconFlow
  await pool.query(`
    UPDATE ai_models
    SET provider = 'siliconflow',
        api_endpoint = 'https://api.siliconflow.cn/v1/chat/completions',
        model_id = 'deepseek-ai/deepseek-vl2',
        display_name = 'DeepSeek VL2 (SiliconFlow)'
    WHERE name = 'deepseek-vl2'
  `);
  console.log('✓ Updated deepseek-vl2 to use SiliconFlow API');

  // Verify
  const result = await pool.query(
    "SELECT name, display_name, provider, api_endpoint, model_id FROM ai_models WHERE model_type = 'vision'"
  );
  console.log('\nVision models:');
  console.table(result.rows);

  await pool.end();
}

update().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
