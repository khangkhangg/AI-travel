import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';

// Admin auth check
async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const aiOnly = searchParams.get('aiOnly') === 'true';
    const queryType = searchParams.get('type') || 'trips'; // 'trips' | 'chat' | 'all'

    // Fetch chat metrics if requested
    let chatMetrics: any[] = [];
    if (queryType === 'chat' || queryType === 'all') {
      const chatSql = `
        SELECT
          id,
          session_id,
          model,
          provider,
          prompt_tokens,
          completion_tokens,
          total_tokens,
          cost,
          conversation_state,
          slots_filled,
          slots_total,
          response_time_ms,
          trip_generated,
          created_at,
          'chat' as query_type
        FROM chat_metrics
        ORDER BY created_at DESC
        LIMIT $1
      `;
      const chatResult = await query(chatSql, [limit]);
      chatMetrics = chatResult.rows;
    }

    // Fetch trip queries if requested
    let tripQueries: any[] = [];
    if (queryType === 'trips' || queryType === 'all') {
      let sql = `
        SELECT
          t.id,
          t.title,
          t.start_date,
          t.end_date,
          t.num_people,
          t.city,
          t.travel_type,
          t.tokens_used,
          t.generation_time_ms,
          t.total_cost,
          t.created_at,
          t.ai_model_id,
          u.email as user_email,
          u.full_name as user_name,
          m.display_name as ai_model_display_name,
          m.provider as ai_provider,
          'trip' as query_type
        FROM trips t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN ai_models m ON t.ai_model_id = m.id
      `;

      if (aiOnly) {
        sql += ` WHERE t.ai_model_id IS NOT NULL`;
      }

      sql += ` ORDER BY t.created_at DESC LIMIT $1`;

      const result = await query(sql, [limit]);
      tripQueries = result.rows;
    }

    // Calculate chat metrics summary
    let chatSummary = null;
    if (queryType === 'chat' || queryType === 'all') {
      const summarySql = `
        SELECT
          COUNT(*) as total_requests,
          SUM(total_tokens) as total_tokens,
          SUM(cost) as total_cost,
          AVG(response_time_ms) as avg_response_time,
          COUNT(CASE WHEN trip_generated THEN 1 END) as trips_generated
        FROM chat_metrics
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `;
      const summaryResult = await query(summarySql, []);
      chatSummary = summaryResult.rows[0];
    }

    return NextResponse.json({
      queries: queryType === 'trips' ? tripQueries : queryType === 'chat' ? chatMetrics : [...chatMetrics, ...tripQueries].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, limit),
      chatMetrics: queryType !== 'trips' ? chatMetrics : undefined,
      chatSummary,
    });
  } catch (error: any) {
    console.error('Failed to fetch queries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queries', details: error.message },
      { status: 500 }
    );
  }
}
