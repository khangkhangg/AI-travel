// app/api/trips/[id]/days/reorder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/lib/db';
import { getUser } from '@/lib/auth/supabase';

// Use a large negative offset to avoid UNIQUE constraint violations
// The constraint is on (trip_id, day_number, order_index)
const TEMP_DAY_OFFSET = -1000000;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await getClient();

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
    const tripCheck = await client.query(
      `SELECT id FROM trips WHERE id = $1 AND user_id = $2`,
      [tripId, user.id]
    );

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Use transaction for atomic reorder
    await client.query('BEGIN');

    try {
      // First, move all days to large negative positions to avoid UNIQUE constraint conflicts
      for (let i = 0; i < order.length; i++) {
        const oldDayNumber = order[i];
        await client.query(
          `UPDATE itinerary_items SET day_number = $1 WHERE trip_id = $2 AND day_number = $3`,
          [TEMP_DAY_OFFSET - i, tripId, oldDayNumber]
        );
      }

      // Then, move them to their new positions
      for (let i = 0; i < order.length; i++) {
        const newDayNumber = i + 1;
        await client.query(
          `UPDATE itinerary_items SET day_number = $1 WHERE trip_id = $2 AND day_number = $3`,
          [newDayNumber, tripId, TEMP_DAY_OFFSET - i]
        );
      }

      await client.query('COMMIT');
      return NextResponse.json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Failed to reorder days:', error);
    return NextResponse.json({ error: 'Failed to reorder days' }, { status: 500 });
  } finally {
    client.release();
  }
}
