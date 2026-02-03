import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'all'; // all, guide, local_expert, regular
    const interests = searchParams.get('interests')?.split(',').filter(Boolean) || [];
    const city = searchParams.get('city') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build WHERE clauses
    const conditions: string[] = [
      "t.visibility IN ('public', 'marketplace', 'curated')",
      'u.username IS NOT NULL',
    ];
    const params: any[] = [];
    let paramIndex = 1;

    // Search filter (name or username)
    if (search) {
      conditions.push(
        `(LOWER(u.full_name) LIKE LOWER($${paramIndex}) OR LOWER(u.username) LIKE LOWER($${paramIndex}))`
      );
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Category filter
    if (category === 'guide') {
      conditions.push('u.is_guide = true');
    } else if (category === 'local_expert') {
      // Has at least one curated itinerary
      conditions.push("EXISTS (SELECT 1 FROM trips t2 WHERE t2.user_id = u.id AND t2.visibility = 'curated')");
    } else if (category === 'regular') {
      conditions.push('u.is_guide = false');
      conditions.push("NOT EXISTS (SELECT 1 FROM trips t2 WHERE t2.user_id = u.id AND t2.visibility = 'curated')");
    }

    // Interests filter
    if (interests.length > 0) {
      conditions.push(`t.travel_type && $${paramIndex}::text[]`);
      params.push(interests);
      paramIndex++;
    }

    // City filter
    if (city) {
      conditions.push(`LOWER(t.city) = LOWER($${paramIndex})`);
      params.push(city);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Main query to get creators with stats
    const creatorsQuery = `
      WITH creator_data AS (
        SELECT
          u.id,
          u.username,
          u.full_name,
          u.avatar_url,
          u.bio,
          u.location,
          COALESCE(u.is_guide, false) as is_guide,
          COUNT(DISTINCT t.id) as itinerary_count,
          COALESCE(SUM(t.views_count), 0) as total_views,
          COALESCE(SUM(COALESCE(t.clone_count, 0)), 0) as total_clones,
          ARRAY_AGG(DISTINCT t.city) FILTER (WHERE t.city IS NOT NULL) as destinations,
          ARRAY_AGG(DISTINCT unnested_interest) FILTER (WHERE unnested_interest IS NOT NULL) as all_interests,
          BOOL_OR(t.visibility = 'curated') as is_local_expert
        FROM users u
        JOIN trips t ON t.user_id = u.id
        LEFT JOIN LATERAL unnest(t.travel_type) as unnested_interest ON true
        ${whereClause}
        GROUP BY u.id, u.username, u.full_name, u.avatar_url, u.bio, u.location, u.is_guide
        ORDER BY total_clones DESC, total_views DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      )
      SELECT
        cd.*,
        COALESCE(
          (SELECT json_agg(badge_data)
           FROM (
             SELECT badge_type, metadata, earned_at
             FROM user_badges
             WHERE user_id = cd.id
             ORDER BY earned_at DESC
             LIMIT 5
           ) badge_data
          ), '[]'::json
        ) as badges,
        COALESCE(
          (SELECT json_agg(itinerary_data)
           FROM (
             SELECT t.id, t.title,
               (SELECT ii.location_name FROM itinerary_items ii WHERE ii.trip_id = t.id LIMIT 1) as cover_image,
               t.city as destination_city
             FROM trips t
             WHERE t.user_id = cd.id
               AND t.visibility IN ('public', 'marketplace', 'curated')
             ORDER BY t.created_at DESC
             LIMIT 3
           ) itinerary_data
          ), '[]'::json
        ) as recent_itineraries
      FROM creator_data cd
    `;

    params.push(limit, offset);

    const result = await query(creatorsQuery, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      JOIN trips t ON t.user_id = u.id
      ${whereClause}
    `;
    const countResult = await query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0]?.total || '0');

    // Get available cities for filter
    const citiesResult = await query(`
      SELECT DISTINCT t.city
      FROM trips t
      WHERE t.visibility IN ('public', 'marketplace', 'curated')
        AND t.city IS NOT NULL
        AND t.city != ''
      ORDER BY t.city
      LIMIT 100
    `);

    // Transform the results to match the Creator interface
    const creators = result.rows.map((row: any) => ({
      id: row.id,
      username: row.username,
      fullName: row.full_name,
      avatarUrl: row.avatar_url,
      bio: row.bio,
      location: row.location,
      isGuide: row.is_guide,
      isLocalExpert: row.is_local_expert || false,
      badges: (row.badges || []).map((b: any) => b.badge_type),
      stats: {
        itineraryCount: parseInt(row.itinerary_count) || 0,
        totalViews: parseInt(row.total_views) || 0,
        totalClones: parseInt(row.total_clones) || 0,
      },
      recentItineraries: (row.recent_itineraries || []).map((i: any) => ({
        id: i.id,
        title: i.title,
        coverImage: i.cover_image,
        destinationCity: i.destination_city,
      })),
      destinations: row.destinations || [],
      interests: row.all_interests || [],
    }));

    return NextResponse.json({
      creators,
      total,
      hasMore: offset + creators.length < total,
      availableCities: citiesResult.rows.map((r: any) => r.city),
    });
  } catch (error: any) {
    console.error('Failed to fetch creators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creators', details: error.message },
      { status: 500 }
    );
  }
}
