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
        m.provider as ai_provider
      FROM trips t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN ai_models m ON t.ai_model_id = m.id
    `;

    if (aiOnly) {
      sql += ` WHERE t.ai_model_id IS NOT NULL`;
    }

    sql += ` ORDER BY t.created_at DESC LIMIT $1`;

    const result = await query(sql, [limit]);

    return NextResponse.json({ queries: result.rows });
  } catch (error: any) {
    console.error('Failed to fetch queries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queries', details: error.message },
      { status: 500 }
    );
  }
}
