import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
      SELECT
        m.id,
        m.name as model_name,
        m.display_name,
        m.provider,
        COUNT(mp.id) as usage_count,
        AVG(mp.response_time_ms) as avg_response_time,
        AVG(mp.tokens_used) as avg_tokens,
        SUM(mp.cost) as total_cost,
        AVG(mp.user_rating) as avg_rating,
        AVG(CASE WHEN mp.was_edited THEN mp.edit_percentage ELSE 0 END) as avg_edit_percentage,
        COUNT(*) FILTER (WHERE mp.was_saved = true) as save_count
      FROM ai_models m
      LEFT JOIN model_performance mp ON m.id = mp.ai_model_id
      WHERE m.is_active = true
      GROUP BY m.id, m.name, m.display_name, m.provider
      ORDER BY usage_count DESC
    `);

    return NextResponse.json({ performance: result.rows });
  } catch (error: any) {
    console.error('Failed to fetch model performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch model performance' },
      { status: 500 }
    );
  }
}
