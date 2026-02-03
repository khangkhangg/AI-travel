import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const INTEREST_CATEGORIES = {
  food: { emoji: '🍜', label: 'Food Experts' },
  culture: { emoji: '🏛️', label: 'Culture Enthusiasts' },
  nature: { emoji: '🌿', label: 'Nature Lovers' },
  adventure: { emoji: '⛰️', label: 'Adventure Seekers' },
  nightlife: { emoji: '🌙', label: 'Nightlife Guides' },
  shopping: { emoji: '🛍️', label: 'Shopping Experts' },
  relaxation: { emoji: '🧘', label: 'Relaxation Gurus' },
  history: { emoji: '📜', label: 'History Buffs' },
};

async function getCreatorData(userIds: string[]) {
  if (userIds.length === 0) return [];

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
        COUNT(DISTINCT t.id) as itinerary_count,
        COALESCE(SUM(t.views_count), 0) as total_views,
        COALESCE(SUM(COALESCE(t.clone_count, 0)), 0) as total_clones,
        ARRAY_AGG(DISTINCT t.city) FILTER (WHERE t.city IS NOT NULL) as destinations,
        BOOL_OR(t.visibility = 'curated') as is_local_expert
      FROM users u
      JOIN trips t ON t.user_id = u.id
      WHERE u.id = ANY($1)
        AND t.visibility IN ('public', 'marketplace', 'curated')
      GROUP BY u.id
    )
    SELECT
      cs.*,
      COALESCE(
        (SELECT json_agg(badge_type)
         FROM user_badges
         WHERE user_id = cs.id
        ), '[]'::json
      ) as badges,
      COALESCE(
        (SELECT json_agg(itinerary_data)
         FROM (
           SELECT t.id, t.title, t.city as destination_city
           FROM trips t
           WHERE t.user_id = cs.id
             AND t.visibility IN ('public', 'marketplace', 'curated')
           ORDER BY t.created_at DESC
           LIMIT 3
         ) itinerary_data
        ), '[]'::json
      ) as recent_itineraries
    FROM creator_stats cs
    `,
    [userIds]
  );

  return result.rows.map((row: any) => ({
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    location: row.location,
    isGuide: row.is_guide,
    isLocalExpert: row.is_local_expert || false,
    badges: row.badges || [],
    stats: {
      itineraryCount: parseInt(row.itinerary_count) || 0,
      totalViews: parseInt(row.total_views) || 0,
      totalClones: parseInt(row.total_clones) || 0,
    },
    recentItineraries: (row.recent_itineraries || []).map((i: any) => ({
      id: i.id,
      title: i.title,
      destinationCity: i.destination_city,
    })),
    destinations: row.destinations || [],
    interests: [],
  }));
}

async function getAlgorithmicCreators(category: string, limit: number = 3) {
  // Get top creators by clone count who have itineraries with this interest
  const result = await query(
    `
    SELECT DISTINCT u.id
    FROM users u
    JOIN trips t ON t.user_id = u.id
    WHERE t.visibility IN ('public', 'marketplace', 'curated')
      AND u.username IS NOT NULL
      AND $1 = ANY(t.travel_type)
    GROUP BY u.id
    ORDER BY SUM(COALESCE(t.clone_count, 0)) DESC
    LIMIT $2
    `,
    [category, limit]
  );

  const userIds = result.rows.map((r: any) => r.id);
  return getCreatorData(userIds);
}

export async function GET(request: NextRequest) {
  try {
    // Check if featured_creators table exists (handle case where migration hasn't run)
    let hasFeaturedTable = true;
    try {
      await query('SELECT 1 FROM featured_creators LIMIT 1');
    } catch {
      hasFeaturedTable = false;
    }

    const categories: Record<
      string,
      {
        emoji: string;
        label: string;
        creators: any[];
        isAlgorithmic: boolean;
      }
    > = {};

    for (const [categoryId, categoryInfo] of Object.entries(INTEREST_CATEGORIES)) {
      let creators: any[] = [];
      let isAlgorithmic = true;

      // Try to get manually featured creators first
      if (hasFeaturedTable) {
        const featuredResult = await query(
          `
          SELECT fc.user_id, fc.display_order
          FROM featured_creators fc
          WHERE fc.category = $1
            AND (fc.featured_until IS NULL OR fc.featured_until > NOW())
          ORDER BY fc.display_order ASC
          LIMIT 6
          `,
          [categoryId]
        );

        if (featuredResult.rows.length > 0) {
          const userIds = featuredResult.rows.map((r: any) => r.user_id);
          creators = await getCreatorData(userIds);
          isAlgorithmic = false;

          // Preserve the display order
          const orderMap = new Map(
            featuredResult.rows.map((r: any, i: number) => [r.user_id, r.display_order ?? i])
          );
          creators.sort(
            (a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999)
          );
        }
      }

      // Fallback to algorithmic selection if no manual features
      if (creators.length === 0) {
        creators = await getAlgorithmicCreators(categoryId, 3);
      }

      // Only include category if it has creators
      if (creators.length > 0) {
        categories[categoryId] = {
          emoji: categoryInfo.emoji,
          label: categoryInfo.label,
          creators,
          isAlgorithmic,
        };
      }
    }

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Failed to fetch featured creators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured creators', details: error.message },
      { status: 500 }
    );
  }
}
