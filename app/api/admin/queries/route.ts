import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await query(
      `SELECT
        t.*,
        u.email as user_email,
        m.display_name as ai_model_display_name
       FROM trips t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN ai_models m ON t.ai_model_id = m.id
       ORDER BY t.created_at DESC
       LIMIT $1`,
      [limit]
    );

    return NextResponse.json({ queries: result.rows });
  } catch (error: any) {
    console.error('Failed to fetch queries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queries' },
      { status: 500 }
    );
  }
}
