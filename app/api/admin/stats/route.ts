import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';

// Admin auth check
async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

export async function GET() {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get overall statistics
    const stats = await query(`
      SELECT
        -- User metrics
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '24 hours') as users_today,
        (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days') as users_this_week,
        (SELECT COUNT(*) FROM users WHERE subscription_tier = 'premium') as premium_users,
        (SELECT COUNT(DISTINCT user_id) FROM trips WHERE created_at > NOW() - INTERVAL '7 days') as active_users,

        -- Trip metrics
        (SELECT COUNT(*) FROM trips) as total_trips,
        (SELECT COUNT(*) FROM trips WHERE created_at > NOW() - INTERVAL '24 hours') as trips_today,
        (SELECT COUNT(*) FROM trips WHERE created_at > NOW() - INTERVAL '7 days') as trips_this_week,
        (SELECT COUNT(*) FROM trips WHERE ai_model_id IS NOT NULL) as ai_generated_trips,
        (SELECT COALESCE(SUM(views_count), 0) FROM trips) as total_views,
        (SELECT COALESCE(SUM(clone_count), 0) FROM trips) as total_clones,

        -- Cost metrics
        (SELECT COALESCE(SUM(total_cost), 0) FROM trips) as total_cost,
        (SELECT COALESCE(SUM(total_cost), 0) FROM trips WHERE created_at > NOW() - INTERVAL '30 days') as cost_this_month,
        (SELECT COALESCE(SUM(tokens_used), 0) FROM trips) as total_tokens,
        (SELECT COALESCE(SUM(tokens_used), 0) FROM trips WHERE created_at > NOW() - INTERVAL '30 days') as tokens_this_month,

        -- Performance metrics
        (SELECT COALESCE(AVG(generation_time_ms), 0) FROM trips WHERE ai_model_id IS NOT NULL AND created_at > NOW() - INTERVAL '30 days') as avg_response_time,
        -- Calculate success rate from trips with AI (if generation_time exists, it was successful)
        (SELECT COALESCE(
          (COUNT(*) FILTER (WHERE generation_time_ms IS NOT NULL)::float / NULLIF(COUNT(*) FILTER (WHERE ai_model_id IS NOT NULL), 0)) * 100,
          100
        ) FROM trips WHERE created_at > NOW() - INTERVAL '30 days') as success_rate,

        -- Business metrics
        (SELECT COUNT(*) FROM businesses) as total_businesses,
        (SELECT COUNT(*) FROM businesses WHERE ekyc_verified = true) as verified_businesses,
        (SELECT COUNT(*) FROM businesses WHERE is_active = true) as active_businesses,

        -- Featured creators
        (SELECT COUNT(DISTINCT user_id) FROM featured_creators) as featured_creators_count
    `);

    // Get top AI models usage - show all models with usage, plus top 10 by default
    const modelUsage = await query(`
      SELECT
        m.display_name,
        m.provider,
        COUNT(t.id) as usage_count,
        COALESCE(SUM(t.tokens_used), 0) as tokens_used,
        COALESCE(SUM(t.total_cost), 0) as total_cost
      FROM ai_models m
      LEFT JOIN trips t ON t.ai_model_id = m.id
      WHERE m.is_active = true
      GROUP BY m.id, m.display_name, m.provider
      ORDER BY usage_count DESC, m.display_name ASC
      LIMIT 10
    `);

    // Get top destinations
    const topDestinations = await query(`
      SELECT
        city,
        COUNT(*) as trip_count
      FROM trips
      WHERE city IS NOT NULL AND city != ''
      GROUP BY city
      ORDER BY trip_count DESC
      LIMIT 5
    `);

    // Get recent activity timeline (last 7 days)
    const activityTimeline = await query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as trips,
        COUNT(DISTINCT user_id) as unique_users
      FROM trips
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    const baseStats = stats.rows[0] || {};

    return NextResponse.json({
      ...baseStats,
      modelUsage: modelUsage.rows,
      topDestinations: topDestinations.rows,
      activityTimeline: activityTimeline.rows,
    });
  } catch (error: any) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error.message },
      { status: 500 }
    );
  }
}
