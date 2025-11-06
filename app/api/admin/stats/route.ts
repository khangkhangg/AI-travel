import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Get overall statistics
    const stats = await query(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM trips) as total_trips,
        (SELECT COUNT(*) FROM users WHERE subscription_tier = 'premium') as premium_users,
        (SELECT COALESCE(SUM(total_cost), 0) FROM trips) as total_cost,
        (SELECT COALESCE(SUM(tokens_used), 0) FROM trips) as total_tokens,
        (SELECT COALESCE(AVG(generation_time_ms), 0) FROM trips WHERE created_at > NOW() - INTERVAL '30 days') as avg_response_time,
        (SELECT COALESCE(
          (COUNT(*) FILTER (WHERE error_occurred = false)::float / NULLIF(COUNT(*), 0)) * 100,
          0
        ) FROM model_performance WHERE created_at > NOW() - INTERVAL '30 days') as success_rate
    `);

    return NextResponse.json(stats.rows[0] || {});
  } catch (error: any) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
