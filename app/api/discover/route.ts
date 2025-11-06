import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const city = searchParams.get('city');
    const travelType = searchParams.get('travelType');
    const sortBy = searchParams.get('sortBy') || 'recent'; // recent, popular, likes

    const offset = (page - 1) * limit;

    let whereClause = "WHERE t.visibility = 'public'";
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (city) {
      whereClause += ` AND LOWER(t.city) LIKE LOWER($${paramIndex++})`;
      queryParams.push(`%${city}%`);
    }

    if (travelType) {
      whereClause += ` AND $${paramIndex++} = ANY(t.travel_type)`;
      queryParams.push(travelType);
    }

    let orderBy = 'ORDER BY t.created_at DESC';
    if (sortBy === 'popular') {
      orderBy = 'ORDER BY t.views_count DESC, t.likes_count DESC';
    } else if (sortBy === 'likes') {
      orderBy = 'ORDER BY t.likes_count DESC';
    }

    queryParams.push(limit, offset);

    const result = await query(
      `SELECT
        t.id,
        t.title,
        t.start_date,
        t.end_date,
        t.num_people,
        t.city,
        t.travel_type,
        t.total_cost,
        t.likes_count,
        t.views_count,
        t.created_at,
        u.email as owner_email,
        u.full_name as owner_name,
        u.avatar_url as owner_avatar,
        m.display_name as ai_model_name,
        (SELECT COUNT(*) FROM itinerary_items WHERE trip_id = t.id) as activities_count,
        jsonb_build_object(
          'title', t.title,
          'summary', t.generated_content->>'summary',
          'firstDay', (
            SELECT jsonb_build_object(
              'activities', jsonb_agg(
                jsonb_build_object(
                  'title', ii.title,
                  'category', ii.category
                )
              )
            )
            FROM itinerary_items ii
            WHERE ii.trip_id = t.id AND ii.day_number = 1
            GROUP BY ii.trip_id
          )
        ) as preview
       FROM trips t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN ai_models m ON t.ai_model_id = m.id
       ${whereClause}
       ${orderBy}
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      queryParams
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM trips t ${whereClause}`,
      queryParams.slice(0, -2)
    );

    return NextResponse.json({
      trips: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error: any) {
    console.error('Failed to fetch public trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public trips' },
      { status: 500 }
    );
  }
}
