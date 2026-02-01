import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: tripId, itemId } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lat, lng, address } = await request.json();

    // Validate coordinates
    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        { error: 'Coordinates must be numbers' },
        { status: 400 }
      );
    }

    // Validate coordinate ranges
    if (lat < -90 || lat > 90) {
      return NextResponse.json(
        { error: 'Latitude must be between -90 and 90' },
        { status: 400 }
      );
    }

    if (lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Longitude must be between -180 and 180' },
        { status: 400 }
      );
    }

    // Check if item exists and belongs to trip
    const itemCheck = await query(
      'SELECT id, is_final FROM itinerary_items WHERE id = $1 AND trip_id = $2',
      [itemId, tripId]
    );

    if (itemCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Don't allow updating finalized items
    if (itemCheck.rows[0].is_final) {
      return NextResponse.json(
        { error: 'Cannot update finalized items' },
        { status: 400 }
      );
    }

    // Update the location
    const result = await query(
      `UPDATE itinerary_items
       SET location_lat = $1, location_lng = $2, location_address = COALESCE($3, location_address), updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [lat, lng, address || null, itemId]
    );

    return NextResponse.json({ item: result.rows[0] });
  } catch (error) {
    console.error('Failed to update item location:', error);
    return NextResponse.json(
      { error: 'Failed to update item location' },
      { status: 500 }
    );
  }
}
