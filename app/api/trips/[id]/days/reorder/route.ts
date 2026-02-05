// app/api/trips/[id]/days/reorder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth/supabase';

export async function PATCH(
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
    const { order } = body; // Array of day numbers in new order, e.g., [3, 1, 2, 4]

    if (!order || !Array.isArray(order)) {
      return NextResponse.json({ error: 'Invalid order array' }, { status: 400 });
    }

    // Verify user has access
    const tripCheck = await query(
      `SELECT id FROM trips WHERE id = $1 AND user_id = $2`,
      [tripId, user.id]
    );

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // First, move all days to negative positions to avoid conflicts
    for (let i = 0; i < order.length; i++) {
      const oldDayNumber = order[i];
      await query(
        `UPDATE itinerary_items SET day_number = $1 WHERE trip_id = $2 AND day_number = $3`,
        [-(i + 1), tripId, oldDayNumber]
      );
    }

    // Then, move them to their new positions
    for (let i = 0; i < order.length; i++) {
      const newDayNumber = i + 1;
      await query(
        `UPDATE itinerary_items SET day_number = $1 WHERE trip_id = $2 AND day_number = $3`,
        [newDayNumber, tripId, -(i + 1)]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reorder days:', error);
    return NextResponse.json({ error: 'Failed to reorder days' }, { status: 500 });
  }
}
