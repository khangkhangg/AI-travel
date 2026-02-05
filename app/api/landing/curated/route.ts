import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Fetch curated trips for landing page with images, loves, creator badges
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '4'), 12);

    // Fetch public/curated trips with creator info, love count, and first image
    const result = await query(
      `SELECT
        t.id,
        t.title,
        t.city as destination_city,
        t.start_date,
        t.end_date,
        t.num_people as group_size,
        t.visibility,
        COALESCE(t.love_count, 0) as love_count,
        COALESCE(t.views_count, 0) as view_count,
        COALESCE(t.clone_count, 0) as clone_count,
        t.created_at,
        -- Creator info
        u.id as creator_id,
        u.full_name as creator_name,
        u.avatar_url as creator_avatar,
        u.username as creator_username,
        u.is_guide as creator_is_guide,
        -- First cover image (display_order = 0)
        (SELECT image_url FROM trip_images ti
         WHERE ti.trip_id = t.id
         ORDER BY ti.display_order ASC
         LIMIT 1) as cover_image,
        -- Creator badges (as JSON array)
        (SELECT jsonb_agg(badge_type)
         FROM user_badges ub
         WHERE ub.user_id = u.id) as creator_badges,
        -- Interest tags from trip (travel_type is the array column)
        t.travel_type,
        -- Activity count
        (SELECT COUNT(*) FROM itinerary_items ii WHERE ii.trip_id = t.id) as activity_count
      FROM trips t
      JOIN users u ON t.user_id = u.id
      WHERE t.visibility IN ('public', 'curated')
        AND t.title IS NOT NULL
        AND t.city IS NOT NULL
      ORDER BY
        CASE WHEN t.visibility = 'curated' THEN 0 ELSE 1 END,
        COALESCE(t.love_count, 0) DESC,
        t.created_at DESC
      LIMIT $1`,
      [limit]
    );

    // Transform results for frontend
    const trips = result.rows.map(row => {
      // Calculate engagement score (rating) from loves, views, clones
      // Formula: normalized score out of 5
      const loves = row.love_count || 0;
      const views = row.view_count || 0;
      const clones = row.clone_count || 0;

      // Weighted score: loves are worth most, then clones, then views
      const engagementScore = (loves * 10) + (clones * 5) + (views * 0.1);
      // Normalize to 4.0-5.0 range (never below 4.0 for display)
      const rating = Math.min(5.0, 4.0 + (Math.log10(engagementScore + 1) * 0.25));

      // Calculate duration from dates
      let duration = '3 days';
      if (row.start_date && row.end_date) {
        const start = new Date(row.start_date);
        const end = new Date(row.end_date);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        duration = `${days} day${days !== 1 ? 's' : ''}`;
      }

      // Check if creator is verified (has verified_guide badge or is_guide)
      const badges = row.creator_badges || [];
      const isVerified = row.creator_is_guide ||
        badges.includes('verified_guide') ||
        badges.includes('local_expert');

      // Determine badge label for display
      let badgeLabel: string | undefined;
      if (badges.includes('local_expert')) {
        badgeLabel = 'Local Expert';
      } else if (badges.includes('verified_guide')) {
        badgeLabel = 'Verified Guide';
      } else if (badges.includes('globetrotter')) {
        badgeLabel = 'Top Creator';
      } else if (badges.includes('explorer')) {
        badgeLabel = 'Explorer';
      }

      return {
        id: row.id,
        title: row.title,
        destination: row.destination_city || 'Unknown',
        country: '', // Not stored separately, could be extracted from city
        duration,
        coverImage: row.cover_image || null,
        creator: {
          id: row.creator_id,
          name: row.creator_name || 'Anonymous',
          avatar: row.creator_avatar || null,
          username: row.creator_username,
          isVerified,
          badge: badgeLabel,
        },
        stats: {
          likes: row.love_count || 0,
          views: row.view_count || 0,
          clones: row.clone_count || 0,
        },
        rating: Math.round(rating * 10) / 10, // Round to 1 decimal
        tags: (row.travel_type || []).slice(0, 3),
      };
    });

    return NextResponse.json({ trips });
  } catch (error: any) {
    console.error('Failed to fetch curated trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch curated trips' },
      { status: 500 }
    );
  }
}
