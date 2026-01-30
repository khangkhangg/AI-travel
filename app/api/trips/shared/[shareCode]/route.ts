import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareCode: string }> }
) {
  try {
    const { shareCode } = await params;

    // Get trip by share code
    const tripResult = await query(
      `SELECT
        t.*,
        u.full_name as owner_name,
        u.avatar_url as owner_avatar
       FROM trips t
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.share_code = $1`,
      [shareCode]
    );

    if (tripResult.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const trip = tripResult.rows[0];

    // Increment view count
    await query(
      'UPDATE trips SET views_count = views_count + 1 WHERE id = $1',
      [trip.id]
    );

    // Get itinerary items grouped by day
    const itemsResult = await query(
      `SELECT * FROM itinerary_items
       WHERE trip_id = $1
       ORDER BY day_number, order_index`,
      [trip.id]
    );

    // Group items by day
    const dayMap = new Map<number, any[]>();
    for (const item of itemsResult.rows) {
      const dayNum = item.day_number;
      if (!dayMap.has(dayNum)) {
        dayMap.set(dayNum, []);
      }
      dayMap.get(dayNum)!.push({
        id: item.id,
        time_slot: item.time_slot,
        title: item.title,
        description: item.description,
        category: item.category,
        estimated_cost: item.estimated_cost,
        location_name: item.location_name,
      });
    }

    const days = Array.from(dayMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([day, activities]) => ({ day, activities }));

    // Get travelers if table exists
    let travelers: any[] = [];
    try {
      const travelersResult = await query(
        `SELECT id, name, age, is_child FROM trip_travelers
         WHERE trip_id = $1
         ORDER BY created_at`,
        [trip.id]
      );
      travelers = travelersResult.rows;
    } catch (e) {
      // Table might not exist yet, that's okay
    }

    return NextResponse.json({
      trip: {
        id: trip.id,
        title: trip.title,
        destination: trip.destination || trip.city,
        description: trip.description,
        created_at: trip.created_at,
        owner_name: trip.owner_name,
      },
      days,
      travelers,
    });
  } catch (error: any) {
    console.error('Failed to fetch shared trip:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trip' },
      { status: 500 }
    );
  }
}
