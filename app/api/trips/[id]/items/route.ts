import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      dayNumber,
      title,
      description,
      locationName,
      locationAddress,
      category,
      estimatedCost,
      timeStart,
      timeEnd,
      sourceUrl,
      placeData,
      coordinates,
    } = body;

    if (!dayNumber || !title) {
      return NextResponse.json(
        { error: 'Day number and title are required' },
        { status: 400 }
      );
    }

    // Get the next order index for this day
    const orderResult = await query(
      `SELECT COALESCE(MAX(order_index), -1) + 1 as next_index
       FROM itinerary_items
       WHERE trip_id = $1 AND day_number = $2`,
      [tripId, dayNumber]
    );
    const orderIndex = orderResult.rows[0]?.next_index || 0;

    // Insert the new item
    const result = await query(
      `INSERT INTO itinerary_items (
        trip_id, day_number, order_index, title, description,
        location_name, location_address, category, estimated_cost,
        time_start, time_end, source_url, place_data,
        location_lat, location_lng, is_final, is_split
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, false, true)
      RETURNING *`,
      [
        tripId,
        dayNumber,
        orderIndex,
        title,
        description || null,
        locationName || null,
        locationAddress || null,
        category || null,
        estimatedCost || null,
        timeStart || null,
        timeEnd || null,
        sourceUrl || null,
        placeData ? JSON.stringify(placeData) : null,
        coordinates?.lat || null,
        coordinates?.lng || null,
      ]
    );

    return NextResponse.json({
      success: true,
      item: result.rows[0],
    });
  } catch (error) {
    console.error('Failed to create item:', error);
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    );
  }
}
