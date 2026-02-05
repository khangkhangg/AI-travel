import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

// GET - Fetch marketplace trips matching business coverage areas
export async function GET(request: NextRequest) {
  try {
    console.log('[Marketplace API] Starting request...');

    const user = await getUser();
    if (!user) {
      console.log('[Marketplace API] No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('[Marketplace API] User:', user.id);

    // Get user's business with coverage areas
    const businessResult = await query(
      'SELECT id, coverage_areas FROM businesses WHERE user_id = $1 AND is_active = true',
      [user.id]
    );
    console.log('[Marketplace API] Business result:', businessResult.rows.length, 'rows');

    if (businessResult.rows.length === 0) {
      return NextResponse.json({ error: 'No active business found' }, { status: 404 });
    }

    const business = businessResult.rows[0];
    console.log('[Marketplace API] Business ID:', business.id);
    console.log('[Marketplace API] Coverage areas raw:', business.coverage_areas);

    const coverageAreas = typeof business.coverage_areas === 'string'
      ? JSON.parse(business.coverage_areas)
      : business.coverage_areas || [];

    console.log('[Marketplace API] Coverage areas parsed:', coverageAreas);

    // If no coverage areas set, return empty with message
    if (coverageAreas.length === 0) {
      return NextResponse.json({
        trips: [],
        matchedCities: [],
        message: 'No coverage areas configured. Update your profile to see matching trips.'
      });
    }

    // Extract city names for fuzzy matching (filter out undefined/null cities)
    const cities = coverageAreas
      .map((area: { city?: string }) => area.city?.toLowerCase())
      .filter((city: string | undefined): city is string => !!city);

    // If no valid cities after filtering, return empty
    if (cities.length === 0) {
      return NextResponse.json({
        trips: [],
        matchedCities: [],
        totalTrips: 0,
        tripsWithMyBids: 0,
        message: 'No valid coverage cities found. Update your profile to see matching trips.'
      });
    }

    // Build ILIKE conditions for fuzzy city matching
    const cityConditions = cities.map((_: string, index: number) =>
      `LOWER(t.city) ILIKE $${index + 1}`
    ).join(' OR ');

    const cityParams = cities.map((city: string) => `%${city}%`);

    console.log('[Marketplace API] Cities:', cities);
    console.log('[Marketplace API] City conditions:', cityConditions);
    console.log('[Marketplace API] City params:', cityParams);

    // Query marketplace trips matching coverage areas with all counts in one query
    const tripsResult = await query(
      `SELECT
        t.id,
        t.title,
        t.city,
        t.start_date,
        t.end_date,
        t.generated_content->>'summary' as description,
        t.visibility,
        t.created_at,
        u.id as creator_id,
        u.full_name as creator_name,
        u.username as creator_username,
        u.avatar_url as creator_avatar,
        (SELECT COUNT(*) FROM itinerary_items WHERE trip_id = t.id) as activity_count,
        (SELECT COUNT(DISTINCT user_id) FROM trip_collaborators WHERE trip_id = t.id) + 1 as traveler_count,
        (SELECT COUNT(*) FROM trip_loves WHERE trip_id = t.id) as love_count,
        (SELECT COUNT(*) FROM marketplace_proposals WHERE trip_id = t.id AND status = 'pending') as bid_count,
        EXISTS(SELECT 1 FROM marketplace_proposals WHERE trip_id = t.id AND business_id = $${cities.length + 1}) as has_my_bid
       FROM trips t
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.visibility = 'marketplace'
       AND (${cityConditions})
       ORDER BY t.created_at DESC`,
      [...cityParams, business.id]
    );

    console.log('[Marketplace API] Trips query returned:', tripsResult.rows.length, 'rows');

    const enrichedTrips = tripsResult.rows;

    // Calculate duration for each trip
    const trips = enrichedTrips.map((trip: any) => {
      const startDate = trip.start_date ? new Date(trip.start_date) : null;
      const endDate = trip.end_date ? new Date(trip.end_date) : null;
      const duration = startDate && endDate
        ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        : null;

      return {
        id: trip.id,
        title: trip.title,
        city: trip.city,
        startDate: trip.start_date,
        endDate: trip.end_date,
        duration,
        description: trip.description?.substring(0, 150) || '',
        coverImageUrl: undefined, // trips table doesn't have cover images
        activityCount: parseInt(trip.activity_count) || 0,
        travelerCount: parseInt(trip.traveler_count) || 1,
        loveCount: parseInt(trip.love_count) || 0,
        bidCount: parseInt(trip.bid_count) || 0,
        hasMyBid: trip.has_my_bid === true || trip.has_my_bid === 't',
        creator: {
          id: trip.creator_id,
          name: trip.creator_name || 'Anonymous',
          username: trip.creator_username,
          avatarUrl: trip.creator_avatar
        }
      };
    });

    // Find which cities actually matched
    const matchedCities = [...new Set(trips.map((t: any) => t.city))];

    return NextResponse.json({
      trips,
      matchedCities,
      totalTrips: trips.length,
      tripsWithMyBids: trips.filter((t: any) => t.hasMyBid).length
    });
  } catch (error: any) {
    console.error('Failed to fetch marketplace trips:', error.message, error.stack);
    return NextResponse.json({
      error: 'Failed to fetch marketplace trips',
      details: error.message
    }, { status: 500 });
  }
}
