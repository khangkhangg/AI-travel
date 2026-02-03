import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Get creator data with stats
    const result = await query(
      `
      WITH creator_stats AS (
        SELECT
          u.id,
          u.username,
          u.full_name,
          u.avatar_url,
          u.bio,
          u.location,
          COALESCE(u.is_guide, false) as is_guide,
          u.guide_details,
          COUNT(DISTINCT t.id) as itinerary_count,
          COALESCE(SUM(t.views_count), 0) as total_views,
          COALESCE(SUM(COALESCE(t.clone_count, 0)), 0) as total_clones,
          ARRAY_AGG(DISTINCT t.city) FILTER (WHERE t.city IS NOT NULL) as destinations,
          ARRAY_AGG(DISTINCT unnested_interest) FILTER (WHERE unnested_interest IS NOT NULL) as all_interests,
          BOOL_OR(t.visibility = 'curated') as is_local_expert
        FROM users u
        LEFT JOIN trips t ON t.user_id = u.id AND t.visibility IN ('public', 'marketplace', 'curated')
        LEFT JOIN LATERAL unnest(t.travel_type) as unnested_interest ON true
        WHERE u.username = $1
        GROUP BY u.id
      )
      SELECT
        cs.*,
        COALESCE(
          (SELECT json_agg(badge_data)
           FROM (
             SELECT badge_type, metadata, earned_at
             FROM user_badges
             WHERE user_id = cs.id
             ORDER BY earned_at DESC
           ) badge_data
          ), '[]'::json
        ) as badges,
        COALESCE(
          (SELECT json_agg(itinerary_data)
           FROM (
             SELECT t.id, t.title, t.city as destination_city,
               t.start_date, t.end_date, t.visibility,
               t.views_count, t.clone_count, t.travel_type as interests
             FROM trips t
             WHERE t.user_id = cs.id
               AND t.visibility IN ('public', 'marketplace', 'curated')
             ORDER BY t.created_at DESC
             LIMIT 6
           ) itinerary_data
          ), '[]'::json
        ) as recent_itineraries
      FROM creator_stats cs
      `,
      [username]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const row = result.rows[0];

    // Check if user has any public content (is actually a creator)
    if (parseInt(row.itinerary_count) === 0) {
      return NextResponse.json(
        { error: 'User has no public itineraries' },
        { status: 404 }
      );
    }

    const creator = {
      id: row.id,
      username: row.username,
      fullName: row.full_name,
      avatarUrl: row.avatar_url,
      bio: row.bio,
      location: row.location,
      isGuide: row.is_guide,
      guideDetails: row.guide_details,
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
        destinationCity: i.destination_city,
        startDate: i.start_date,
        endDate: i.end_date,
        visibility: i.visibility,
        viewsCount: i.views_count,
        cloneCount: i.clone_count,
        interests: i.interests || [],
      })),
      destinations: row.destinations || [],
      interests: row.all_interests || [],
    };

    return NextResponse.json({ creator });
  } catch (error: any) {
    console.error('Failed to fetch creator:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creator', details: error.message },
      { status: 500 }
    );
  }
}
